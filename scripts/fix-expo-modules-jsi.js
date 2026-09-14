#!/usr/bin/env node
/**
 * Postinstall patches for Expo native modules (Xcode 26 toolchain fixes).
 *
 * 1. expo-modules-jsi / RuntimeScheduler.h — Xcode 26's Clang rejects
 *    SWIFT_RETURNS_RETAINED on C++ constructors:
 *
 *      'RuntimeScheduler' cannot be annotated with either SWIFT_RETURNS_RETAINED
 *      or SWIFT_RETURNS_UNRETAINED because it is not returning a
 *      SWIFT_SHARED_REFERENCE type
 *
 *    The annotation is only meaningful on factory functions returning a +1
 *    retained pointer. These are constructors (lifetime is already managed via
 *    SWIFT_SHARED_REFERENCE(retainRuntimeScheduler, releaseRuntimeScheduler)),
 *    so the annotation is removed.
 *
 * 2. expo-modules-jsi / JavaScriptRuntime.swift — Xcode 26's Swift 6.2 checker
 *    flags the transfer of the raw JSI slot pointers (`thisPtr`,
 *    `argumentsPtr`, `resultPtr`) into the actor-isolated host-callback
 *    closures as `sending ... risks causing data races`, even through
 *    `nonisolated(unsafe)` locals. The closures all execute synchronously
 *    before the C++ callback returns, so the pointers are boxed in an
 *    `@unchecked Sendable` carrier (`UncheckedSendable`) that records that
 *    reasoning.
 *
 * 3. expo-modules-core / EventEmitter.swift — same checker flags the `weak
 *    emitter` capture into the `runtime.schedule` closures. The emitter is
 *    boxed in a `weak` `@unchecked Sendable` carrier (`WeakEventEmitter`);
 *    the scheduled closure only reaches `@JavaScriptActor`-isolated or
 *    `Sendable` state through it, never the module's mutable state.
 *
 * Upstream still ships these issues, hence this local patch.
 *
 * Idempotent: safe to run on every `npm install` via the `postinstall` hook.
 * If the upstream text changes, the affected hunk is skipped with a warning
 * instead of failing the install.
 */
const fs = require('fs');
const path = require('path');

const NODE_MODULES = path.join(__dirname, '..', 'node_modules');
const HEADER_PATH = path.join(
  NODE_MODULES,
  'expo-modules-jsi',
  'apple',
  'Sources',
  'ExpoModulesJSI-Cxx',
  'include',
  'RuntimeScheduler.h'
);
const JSI_RUNTIME_PATH = path.join(
  NODE_MODULES,
  'expo-modules-jsi',
  'apple',
  'Sources',
  'ExpoModulesJSI',
  'Runtime',
  'JavaScriptRuntime.swift'
);
const EMITTER_PATH = path.join(
  NODE_MODULES,
  'expo-modules-core',
  'ios',
  'Core',
  'Events',
  'EventEmitter.swift'
);

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

/**
 * Applies exact-match [old, new, expectedCount] hunks to a file.
 * Skips the file when `marker` is already present (idempotency).
 */
function applyPatches(label, filePath, marker, patches) {
  let src;
  try {
    src = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.log(`[fix-expo-modules-jsi] ${label} not found, skipping (${filePath})`);
    return;
  }
  if (src.includes(marker)) {
    console.log(`[fix-expo-modules-jsi] ${label} already patched, nothing to do`);
    return;
  }
  let fixed = src;
  let skipped = 0;
  for (const [old, replacement, expected] of patches) {
    const found = countOccurrences(fixed, old);
    if (found !== expected) {
      console.log(
        `[fix-expo-modules-jsi] WARNING: expected ${expected} occurrence(s), found ${found} for: ${JSON.stringify(
          old.slice(0, 80)
        )} — skipping hunk (upstream text may have changed)`
      );
      skipped += 1;
      continue;
    }
    fixed = fixed.split(old).join(replacement);
  }
  if (fixed === src) {
    console.log(`[fix-expo-modules-jsi] ${label}: no hunks applied`);
    return;
  }
  fs.writeFileSync(filePath, fixed);
  console.log(`[fix-expo-modules-jsi] patched ${label} (${patches.length - skipped}/${patches.length} hunks applied)`);
}

function patchHeader() {
  let src;
  try {
    src = fs.readFileSync(HEADER_PATH, 'utf8');
  } catch (err) {
    console.log(`[fix-expo-modules-jsi] header not found, skipping (${HEADER_PATH})`);
    return;
  }
  // Only strip the annotation from RuntimeScheduler constructors, leaving any
  // legitimate use on factory functions untouched.
  const fixed = src.replace(/SWIFT_RETURNS_RETAINED\s+(RuntimeScheduler\s*\()/g, '$1');
  if (fixed === src) {
    console.log('[fix-expo-modules-jsi] RuntimeScheduler.h already patched, nothing to do');
    return;
  }
  fs.writeFileSync(HEADER_PATH, fixed);
  console.log('[fix-expo-modules-jsi] removed SWIFT_RETURNS_RETAINED from RuntimeScheduler constructors');
}

const SWIFT_STRUCT = `/// Boxes a non-\`Sendable\` value so it can be captured across an isolation
/// boundary when the holder can prove the transfer is race-free.
///
/// Used for the raw JSI slot pointers handed to a synchronous C++ host
/// callback (\`thisPtr\`, \`argumentsPtr\`, \`resultPtr\`): every closure capturing
/// the box executes synchronously before that callback returns (see
/// \`JavaScriptActor.assumeIsolated\` and \`withGuaranteedContext\`), so the
/// pointers never outlive the call and cannot race. (\`nonisolated(unsafe)\`
/// locals are not sufficient: Xcode 26's checker still flags the transfer of
/// the non-\`Sendable\` pointer types into the actor-isolated closures as
/// \`sending ... risks causing data races\`.) Do not store or escape instances
/// beyond the callback invocation.
private struct UncheckedSendable<Value>: @unchecked Sendable {
  let value: Value
}

`;

/** [old, new, expectedCount] — expectedCount is the exact number of matches required. */
const JSI_RUNTIME_PATCHES = [
  [
    'private func createFunctionClosure(\n  runtime: JavaScriptRuntime, name: String? = nil, _ closure: @escaping JavaScriptRuntime.SyncFunctionClosure\n) -> expo.HostFunctionClosure {',
    SWIFT_STRUCT +
      'private func createFunctionClosure(\n  runtime: JavaScriptRuntime, name: String? = nil, _ closure: @escaping JavaScriptRuntime.SyncFunctionClosure\n) -> expo.HostFunctionClosure {',
    1,
  ],
  [
    '      let propertyName = String(cString: propertyName)\n      nonisolated(unsafe) let resultPtr = resultPtr',
    '      let propertyName = String(cString: propertyName)\n      let resultSlot = UncheckedSendable(value: resultPtr)',
    1,
  ],
  [
    'try context.get(propertyName).writeJSIValue(to: resultPtr)',
    'try context.get(propertyName).writeJSIValue(to: resultSlot.value)',
    1,
  ],
  [
    '    nonisolated(unsafe) let thisPtr = thisPtr\n    nonisolated(unsafe) let argumentsPtr = argumentsPtr\n    nonisolated(unsafe) let resultPtr = resultPtr',
    '    let slots = UncheckedSendable(value: (thisPtr: thisPtr, argumentsPtr: argumentsPtr, resultPtr: resultPtr))',
    2,
  ],
  [
    'let this = UnsafeMutablePointer(mutating: thisPtr).move()',
    'let this = UnsafeMutablePointer(mutating: slots.value.thisPtr).move()',
    1,
  ],
  [
    'JavaScriptValuesBuffer(runtime, start: argumentsPtr, count: argumentsCount)',
    'JavaScriptValuesBuffer(runtime, start: slots.value.argumentsPtr, count: argumentsCount)',
    2,
  ],
  [
    'JavaScriptUnownedValue(runtime.pointee, thisPtr)',
    'JavaScriptUnownedValue(runtime.pointee, slots.value.thisPtr)',
    1,
  ],
  [
    'try context.call(thisValue, consume arguments).writeJSIValue(to: resultPtr)',
    'try context.call(thisValue, consume arguments).writeJSIValue(to: slots.value.resultPtr)',
    2,
  ],
  [
    '// synchronous call, so the `nonisolated(unsafe)` capture is sound.',
    '// synchronous call, so capturing them in the `UncheckedSendable` box below is sound.',
    1,
  ],
];

const EMITTER_STRUCT = `/**
 Holds the event emitter across the \`runtime.schedule\` boundary without
 requiring the module to be \`Sendable\`.

 The scheduled closure only reaches \`@JavaScriptActor\`-isolated or \`Sendable\`
 state through the emitter (\`withEventTarget\`, the JS object, \`appContext\`)
 plus its identity — never the module's own mutable state — so sharing the
 reference is race-free. (\`nonisolated(unsafe)\` locals are not sufficient:
 Xcode 26's checker still flags the transfer of the non-\`Sendable\` emitter
 into the actor-isolated closure as \`sending ... risks causing data races\`.)
 \`weak\` preserves the no-op-after-deallocation behavior. Do not store or
 escape instances beyond the scheduled closure.
 */
private struct WeakEventEmitter: @unchecked Sendable {
  weak var emitter: (any EventEmitter)?
}

`;

/** [old, new, expectedCount] — expectedCount is the exact number of matches required. */
const EMITTER_PATCHES = [
  [
    '  @JavaScriptActor\n  func withEventTarget<R>(_ body: (borrowing JavaScriptObject) throws -> R) rethrows -> R?\n}\n\npublic extension EventEmitter {',
    '  @JavaScriptActor\n  func withEventTarget<R>(_ body: (borrowing JavaScriptObject) throws -> R) rethrows -> R?\n}\n\n' +
      EMITTER_STRUCT +
      'public extension EventEmitter {',
    1,
  ],
  [
    '    // the compiler send `self` into the `@JavaScriptActor` region. Capturing it as `nonisolated(unsafe)` is\n    // safe here because the scheduled closure only calls `withEventTarget`, which touches `@JavaScriptActor`-\n    // isolated or `Sendable` state (the JS object, the registry, `appContext`) and the emitter\'s identity -\n    // never the module\'s own mutable state.\n    nonisolated(unsafe) weak let emitter = self\n\n    runtime.schedule {\n      guard let emitter else {',
    '    // the compiler send `self` into the `@JavaScriptActor` region. It is captured in the `WeakEventEmitter`\n    // box instead, which is safe here because the scheduled closure only calls `withEventTarget`, which\n    // touches `@JavaScriptActor`-isolated or `Sendable` state (the JS object, the registry, `appContext`)\n    // and the emitter\'s identity - never the module\'s own mutable state.\n    let emitterBox = WeakEventEmitter(emitter: self)\n\n    runtime.schedule {\n      guard let emitter = emitterBox.emitter else {',
    1,
  ],
  [
    '    // See the note in `emit(event:payload:)` above - the emitter is captured as `nonisolated(unsafe)`\n    // because it isn\'t necessarily `Sendable`, and the scheduled closure only reaches `@JavaScriptActor`-\n    // isolated or `Sendable` state through it.\n    nonisolated(unsafe) weak let emitter = self\n\n    runtime.schedule { [weak appContext] in\n      guard let emitter, let appContext else {',
    '    // See the `WeakEventEmitter` note above - the emitter is captured in that box\n    // because it isn\'t necessarily `Sendable`, and the scheduled closure only reaches `@JavaScriptActor`-\n    // isolated or `Sendable` state through it.\n    let emitterBox = WeakEventEmitter(emitter: self)\n\n    runtime.schedule { [weak appContext] in\n      guard let emitter = emitterBox.emitter, let appContext else {',
    1,
  ],
];

patchHeader();
applyPatches('JavaScriptRuntime.swift', JSI_RUNTIME_PATH, 'UncheckedSendable', JSI_RUNTIME_PATCHES);
applyPatches('EventEmitter.swift', EMITTER_PATH, 'WeakEventEmitter', EMITTER_PATCHES);
