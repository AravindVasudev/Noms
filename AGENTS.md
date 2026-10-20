# AGENTS.md — noms

> Local-first, open-source calorie tracker built with Expo + React Native.
> Everything is stored on-device. No backend, no cloud sync, no auth server.

## 1. What this repo is

`noms` is a simple food journal:

- **Diary tab** (`app/(tabs)/index.tsx`): per-day food log + calorie-donut aggregates vs. goals.
- **Insights tab** (`app/(tabs)/insights.tsx`): 7 / 14 / 30-day line charts for enabled metrics with goal overlay + fixed Week/Fortnight/Month period averages.
- **Settings tab** (`app/(tabs)/settings.tsx`): profile card, Set Goals, Customize Insights, Manage Data (import/export/clear).
- **Supporting flows**: catalog quick-add + text search + UPC barcode scan (`app/search.tsx`), manual entry (`app/add.tsx`), goals form (`app/goals.tsx`, with TDEE Calculator entry), TDEE calculator (`app/tdee-calculator.tsx`), insights customization (`app/customize-insights.tsx`), onboarding (`app/signup.tsx` → `app/profile-info.tsx` → `app/goals?from=signup`).

Philosophy (from `README.md`): avoid bloat / paywalls / cloud lock-in. iOS is the tested platform; Android UX may be broken.

## 2. Tech stack

| Area | Choice |
|---|---|
| Runtime | Expo SDK `~54.0.30`, React `19.1.0`, React Native `0.81.5`, New Architecture enabled (`newArchEnabled: true`) |
| Routing | `expo-router@~6.0.21` file-based routing, `typedRoutes: true`, `reactCompiler: true` |
| Tabs | `expo-router/unstable-native-tabs` with SF Symbols (`book.fill`, `graph.2d`, `gear`) |
| State | `@reduxjs/toolkit@^2.11.2` + `react-redux@^9.2.0`, single store in `lib/store.ts` |
| Local DB | `expo-sqlite@~16.0.10` (`diary.db`, tables `nutrition` + `catalog`) |
| KV storage | `@react-native-async-storage/async-storage@2.2.0` (profile + goals) |
| Camera / barcode | `react-native-vision-camera@^4.7.3` (`upc-a`, `upc-e` only) |
| Charts | `react-native-chart-kit@^6.12.0` + `react-native-svg@15.12.1` |
| UI primitives | `expo-symbols`, `@expo/vector-icons`, `expo-image-picker`, `expo-linear-gradient`, `react-native-gesture-handler` + `reanimated`, `react-native-dropdown-picker` (installed, currently unused in UI), `react-native-safe-area-context` |
| Data portability | `expo-document-picker`, `expo-file-system` (new `File` / `Paths` API), `expo-sharing` |
| Lint / types | `eslint@^9` + `eslint-config-expo@~10`, `typescript@~5.9`, strict mode, path alias `@/* → ./*` |
| Build | EAS (`eas.json`, projectId `4d8784ee-...`), bundle ID / package `com.aravindvasudev.noms` |

Key config: `app.json` (name/slug/scheme `noms`, portrait, `expo-router` + `expo-splash-screen` + `expo-sqlite` plugins), `tsconfig.json`, `eslint.config.js`, `eas.json` (internal distribution, iOS simulator build).

## 3. Commands

```bash
npm start          # expo start (dev server)
npm run ios        # primary tested flow: dev run on iOS
npm run android    # exists but UX largely untested
npm run web        # expo start --web
npm run lint       # expo lint (only automated check; no unit tests)
npm run reset-project  # scripts/reset-project.js (template reset — avoid unless intentional)
```

`postinstall` always runs `node ./scripts/fix-expo-modules-jsi.js`. Do not remove it. It patches Xcode 26 incompatibilities in `expo-modules-jsi` (`RuntimeScheduler.h`, `JavaScriptRuntime.swift`) and `expo-modules-core` (`EventEmitter.swift`). It is idempotent; if upstream changes it skips hunks with a warning instead of failing install.

No test runner is configured. Verify changes with `npm run lint`, `npx tsc --noEmit`, and manual Expo run.

## 4. Repo layout

```
app/
  _layout.tsx            # Root Stack + Redux Provider + init + signup gate
  signup.tsx             #Entry if !signedUp: Sign Up / Continue without signup
  profile-info.tsx       # Edit name/avatar, Next → /goals?from=signup
  goals.tsx              # Set Daily Goals form + "Use TDEE Calculator" → /tdee-calculator (also used from Settings)
  tdee-calculator.tsx    # TDEE/macro calculator → applies results via setGoalsAsync
  customize-insights.tsx # Toggle + reorder insight metrics (insightsSettings slice)
  search.tsx             # Catalog search + barcode button + + button → /add
  add.tsx                # Manual entry form (date + optional barcode params), back button → router.back()
  manage-data.tsx        # Import / Export / Clear (profile, goals, catalog, diary, insightsSettings)
  (tabs)/
    _layout.tsx          # NativeTabs: Diary (index), Insights, Settings
    index.tsx            # Diary screen
    insights.tsx         # Charts + period averages screen
    settings.tsx         # Profile + SettingsItem links (Goals, Customize Insights, Manage Data)
components/ui/
  aggregates.tsx         # Calorie-donut card (Remaining/Eaten/Over + macro gram rows) + + button
  calorie-donut.tsx      # Segmented donut primitives used by Aggregates
  journal-entries.tsx    # Diary list, swipe-to-delete
  catalog-entries.tsx    # Catalog list (alphabetical), tap → QuantityModal → log, swipe-to-delete, barcode badge
  quantity-modal.tsx     # Quantity picker (X / X.X, 0 < q ≤ 999.9) for catalog quick-add
  date-picker.tsx        # Mon–Sun week strip: circles per day (grey empty / solid past fill / center-dot today), selected ring, week label, ◀ ▶ week paging + swipe, no future dates
  duration-picker.tsx    # Generic pill selector ({ label, value }[] options + value/onChange)
  average-card.tsx       # Period-average rows (Week/Fortnight/Month) vs goal with overIsGood coloring
  line-chart-card.tsx    # react-native-chart-kit wrapper + goal dashed line
  barcode-scanner.tsx    # VisionCamera modal
  profile-card.tsx       # Avatar (image-picker → base64) + editable username
  settings-item.tsx      # iOS-style row with chevron, destructive variant
lib/
  store.ts               # configureStore { diary, catalog, goals, profile, insightsSettings } + typed hooks
  diarySlice.ts          # Nutrition type (incl. quantity) + thunks: initialize/add/remove/clear/set
  catalogSlice.ts        # Catalog thunks (same shape)
  goalsSlice.ts          # Goals strings in AsyncStorage
  profileSlice.ts        # username/displayPicture/signedUp in AsyncStorage
  insightsSettingsSlice.ts # Insights { order, visible } in AsyncStorage (`insights-settings`), sanitize on load
  quantity.ts            # DEFAULT_QUANTITY 1.0, MAX 999.9, parse/format/normalize/truncate (X / X.X)
  calorie-breakdown.ts   # Atwater factors (net carbs), parseGoal, getCalorieBreakdown (segments + remaining)
  tdee.ts                # Mifflin-St Jeor (Katch-McArdle w/ body fat), activity multipliers, macro splits, ±500 goals
  journal-store.tsx      # SQLite wrapper: nutrition table
  catalog-store.tsx      # SQLite wrapper: catalog table (+ getEntryByBarcode)
  date.ts                # formatDateKey, getStartOfWeek (Monday), getLastNDaysKeys, keyToWeekdayLabel, parseDateKey
constants/theme.ts       # Colors (light/dark) + Fonts (expo template, mostly unused)
hooks/                   # use-color-scheme (re-export RN), use-theme-color, .web variant
scripts/                 # fix-expo-modules-jsi.js, reset-project.js
assets/images/           # icon, splash, favicon, android icons
android/ ios/            # Prebuild output, gitignored (/ios /android in .gitignore) — don't hand-edit; use Expo prebuild
```

## 5. Navigation & app bootstrap

`app/_layout.tsx`:

1. Wraps app in Redux `<Provider store={store}>`.
2. `AppContent` dispatches `initializeProfile()`, `initializeDiary()`, `initializeGoals()`, `initializeCatalog()`, `initializeInsightsSettings()` in parallel, renders `null` until `isInitialized`.
3. Renders a `<Stack>` with `(tabs)`, `signup`, `profile-info`, `add`, `goals`, `tdee-calculator`, `search`, `manage-data`, `customize-insights` (all `headerShown: false`; custom headers/inline titles instead, e.g. `add.tsx` back button). `unstable_settings = { anchor: '(tabs)' }`.
4. Gates with `{!signedUp && <Redirect href="/signup" />}`. `signedUp` lives in `profileSlice` / AsyncStorage `signedUp`.
5. Requires `GestureHandlerRootView` at root for `Swipeable` rows.

Onboarding: `signup.tsx` → `profile-info.tsx` (reuses `ProfileCard`) → `goals.tsx?from=signup` (on save: `setGoalsAsync` then `setSignedUpAsync(true)` → `router.replace('/(tabs)')`). “Continue without sign up” sets `signedUp=true` directly.

Diary add flow preserves date: `index.tsx` → `router.push({ pathname: '/search', params: { date: selectedDate.toISOString() } })` → `search.tsx` passes `date` through to `add.tsx` or uses it when quick-adding from catalog.

## 6. State & persistence — read this before editing data code

### Redux slices (all async, no plain reducers)

- `lib/diarySlice.ts` — `Nutrition { id?, name, calories|fat|protein|carbs|fiber: number|null, quantity: number, date: Date }`. State `{ diary: Nutrition[] }`. Thunks: `initializeDiary` (init DB + `getAllEntries`), `addEntryAsync` (normalize quantity → insert → push with `lastInsertRowId`), `removeEntryAsync`, `clearAllAsync` (drop + init → `[]`), `setDiary` (drop + re-insert without old ids, normalize quantity, backfill legacy ISO-string dates; used by import).
- `lib/catalogSlice.ts` — mirrors diary, type `CatalogRow` (same + `barcode: string|null`). Extra thunk `removeCatalogItemAsync`. Note: `barcode` column is `UNIQUE`; inserting a duplicate barcode throws (currently unhandled — surface of future bug).
- `lib/goalsSlice.ts` — `Goals { calories, protein, fiber, fat, carbs: string }` (strings, not numbers). Keys: `goal-calories`, `goal-protein`, `goal-fiber`, `goal-fat`, `goal-carbs`. `setGoalsAsync` only writes non-empty trimmed values (so clearing a goal in UI does not delete the stored key — known quirk). Parse with `parseFloat(...) || 0` at read time (or `parseGoal` from `calorie-breakdown.ts` for nullable parsing).
- `lib/profileSlice.ts` — `Profile { username: string, displayPicture: string|null (data-uri base64), signedUp: boolean }`. Keys: `username`, `displayPicture`, `signedUp`. `displayPicture` stored as full `data:image/jpeg;base64,...` string.
- `lib/insightsSettingsSlice.ts` — `InsightsSettings { order: InsightMetricId[], visible: Record<InsightMetricId, boolean> }`, single AsyncStorage key `insights-settings`, sanitized on load (unknown ids dropped, missing metrics appended). Thunks: `initializeInsightsSettings`, `setMetricVisibleAsync`, `setInsightsOrderAsync`, `setInsightsSettingsAsync`/`setInsightsSettings` (import/restore), `clearAllAsync` (resets to defaults). Always pass `current` settings into the update thunks.
- `lib/store.ts` — `useAppDispatch`, `useAppSelector` typed hooks. Always use these, never bare `useDispatch`/`useSelector`.

### Quantity (`lib/quantity.ts`)

Every diary/catalog entry carries `quantity: number`. Totals everywhere = `macro × quantity`. Format is `X` or `X.X` (`QUANTITY_PATTERN`), range `0 < q ≤ MAX_QUANTITY (999.9)`, default `DEFAULT_QUANTITY (1.0)`. Use `parseQuantity` (input validation), `formatQuantity` (display: `3` not `3.0`), `normalizeQuantity` (slice/insert/import backfill), `truncateQuantityInput` (onBlur cut, don't round: `3.55 → 3.5`).

### Calorie breakdown (`lib/calorie-breakdown.ts`)

Atwater factors protein 4 / fat 9 / carbs 4 / fiber 2 kcal/g; carbs counted as net carbs (`carbs − fiber`) to avoid double-counting. `getCalorieBreakdown(totals, goalStr)` returns per-macro kcal + `unknownKcal` (logged calories not explained by macros) + `consumed` + nullable `goal`/`remaining`. Drives `Aggregates` donut segments and center label.

### TDEE (`lib/tdee.ts`)

Mirrors tdeecalculator.net: Mifflin-St Jeor by default, Katch-McArdle when body-fat % is known; `ACTIVITY_MULTIPLIERS` (sedentary 1.2 → athlete 1.9); `MACRO_SPLITS` (moderate/low/high carb pct splits); `GOAL_OPTIONS` maintenance ±0 / cutting −500 / bulking +500. `tdee-calculator.tsx` applies the result via `setGoalsAsync`.

### SQLite stores

Both open the **same file** `diary.db` (lazy singleton `getDb()`):

- `journal-store.tsx` → `nutrition (id PK, name TEXT, calories/fat/protein/carbs/fiber REAL, date TEXT ISO)`. Dates stored via `date.toISOString()`, read back with `new Date(r.date)`.
- `catalog-store.tsx` → `catalog (id PK, name TEXT, barcode TEXT UNIQUE, ...macros REAL)`. Provides `getEntryByBarcode(barcode)`.

`dropTable()` + `init()` is the reset pattern used by clear/import.

### Date handling

All day-grouping goes through `lib/date.ts`:

- `formatDateKey(date)` → `YYYY-MM-DD` local-time key. Diary filtering (`index.tsx`, `journal-entries.tsx`), `DatePicker` stats, and Insights aggregation compare these keys — never compare `Date` objects directly.
- `getStartOfWeek(date)` → Monday-start calendar week at local midnight; anchors the `DatePicker` week strip (`weekDays = start + 0..6`).
- `getLastNDaysKeys(n)` → ordered keys for charts; `keyToWeekdayLabel` → `Mon/Tue/...` labels.

## 7. Screen / component notes

- `Diary (tabs/index.tsx)`: local `selectedDate` state, `filteredDiary` via `useMemo`, totals reduced inline quantity-aware (`macro × (quantity ?? 1.0)`, null-safe). Renders `DatePicker` + `Aggregates` always; empty state is a `Pressable` → `/search`, otherwise `<JournalEntries selectedDate>`.
- `Aggregates`: calorie-donut card (`LinearGradient` + `CalorieDonut`). Reads calorie goal from store, builds segments via `getCalorieBreakdown` with `SEGMENT_COLORS` (protein `#34C759`, fat `#FFCC00`, carbs `#FF3B30`, fiber `#8B2D26`, unknown `#A9A9B0`, goal `#007AFF`); full circle = goal when set and not over. Center shows Remaining (goal − food) / Eaten / Over. Right column: Base Goal + per-macro gram rows. `+` button calls `onAdd`.
- `JournalEntries` / `CatalogEntries`: `FlatList` + `Swipeable renderRightActions` → red `✕` `RectButton` dispatching remove. `keyExtractor` is index-based (not `id`) — keep in mind if reordering. Journal rows are display-only; catalog rows are alphabetically sorted, `onPress` opens `QuantityModal` → `addEntryAsync` with `date` prop + chosen quantity then `router.back()`.
- `DatePicker`: Mon–Sun week strip (Noom-style). Reads `diary` + calorie goal from store, aggregates `count`/`calories` (quantity-aware) per day key for the week containing `value` (`getStartOfWeek`). Day states: empty (no entries, or any future day) → grey `#E9E9EE`; past logged → solid fill (`#D1EFB5` within goal, `#DD7373` over, `#007AFF` when no goal set); today logged → grey outer + filled center dot (in-progress). Selected day gets `#007AFF` ring, today label bold, week-range caption below (`Oct 19–25`). ◀ ▶ page by week (`PanResponder` swipe, 50px threshold); next-week/day clamped to today (no future logging).
- `Add (add.tsx)`: controlled string inputs, `name` defaults to `Quick Add`, `calories` required + `parseInt` validated, macros `'' → null` else `parseInt`. Manual entries log `quantity: 1.0`. If `barcode` param present, `name` required. On save: `addEntryAsync` always; `addCatalogItemAsync` only if name non-empty (so “Quick Add” never pollutes catalog). Then `dismissAll` + `replace('/(tabs)/')`. Custom back button (`Ionicons` chevron + `router.back()`); custom keyboard `Done` accessory tracking `keyboardWillShow/DidShow`.
- `Search (search.tsx)`: client-side `catalog.filter(name.includes(query))`; barcode button opens `BarcodeScanner` modal; `+` → `/add`. `handleBarcodeScanned`: `catalogStore.getEntryByBarcode` → if hit, `addEntryAsync` + `replace('/(tabs)/')`; else `replace('/add', { date?, barcode })`.
- `BarcodeScanner`: requests `Camera.requestCameraPermission()` when visible; `hasScannedRef` guard + 100ms defer to avoid double-fire; handles `!device` and `!hasPermission` modals. Scans `upc-a`/`upc-e` only — add code types here for QR/EAN support (requires `app.json` camera permission strings for production).
- `Insights`: metrics from `insightsSettings.order ∩ visible` (`METRIC_CONFIGS` carry `overIsGood`: true for protein/fiber). `DurationPicker` (generic options) sets chart window (7/14/30); `getLastNDaysKeys(duration)` + quantity-aware aggregation, 2dp rounding, `LineChartCard`s with goal overlay; `scrollable={duration > 7}` with `chartWidth = max(screen, labels*60)`. Below charts: fixed `AVERAGE_WINDOWS` (Week 7 / Fortnight 14 / Month 30) daily means over logged days via `AverageCard`s (`overIsGood` coloring, `null` when no logged days). Empty state (no metrics enabled) links to `/customize-insights`.
- `DurationPicker`: generic pill selector — props `{ label, value, options: { label, value }[], onChange, style? }`, not week-specific despite the 7/14/30 usage.
- `AverageCard`: rows of `{ periodLabel, average, goal }` with `unit` + `overIsGood` for under/over coloring.
- `LineChartCard`: blue series + optional red dashed goal line (`Array(labels.length).fill(goal)`), `bezier`, `fromZero`, white-on-white `chartConfig`.
- `ProfileCard`: avatar `Pressable` → `ImagePicker.launchImageLibraryAsync({ allowsEditing, aspect 1:1, quality 0.5, base64: true })` → `setDisplayPictureAsync`; falls back to `ui-avatars.com` URL (network dependency). Name edit toggles `TextInput`, saves on blur/submit, defaults empty → `User`.
- `Goals`: local string state seeded from store via `useEffect`; "Use TDEE Calculator" → `/tdee-calculator`; `setGoalsAsync` then alert → back or `/(tabs)` if `from=signup`.
- `TDEECalculator (tdee-calculator.tsx)`: inputs for the `lib/tdee.ts` model, applies chosen calorie + macro-split result via `setGoalsAsync`.
- `CustomizeInsights (customize-insights.tsx)`: toggle visibility (`setMetricVisibleAsync`), reorder (`setInsightsOrderAsync`), reset to `DEFAULT_INSIGHTS_SETTINGS`.
- `ManageData`: export builds `{ profile, goals, catalog, diary, insightsSettings, exportDate }` → `FileSystem.File(Paths.cache, 'noms-export.json')` → `Sharing.shareAsync`. Import picks `application/json`, validates presence of 4 top-level keys, confirms destructive replace, then dispatches `setProfile` / `setGoalsAsync` / `setCatalog` / `setDiary` (+ `setInsightsSettings` when present — backward compatible). Clear dispatches all five `clearAllAsync` (insights settings reset to defaults) then `replace('/signup')`.
- `SettingsItem`: simple row; use `destructive` for red text (Clear App Data).

## 8. Conventions for agents

- **Imports**: use `@/` alias (`@/lib/store`, `@/components/...`). Relative imports (`../../components/...`) exist in tabs screens — prefer `@/` in new code.
- **Styling**: inline `StyleSheet.create`, no shared theme system. Brand blues `#034ea6` / `#007AFF` / `#2296f3`, backgrounds `#fff` / `#f2f2f7`, inputs `#f0f0f3` radius 20. `constants/theme.ts` `Colors`/`Fonts` are expo-template leftovers — `use-theme-color` is available but most screens hardcode colors; follow surrounding file, don’t migrate wholesale.
- **Forms**: string-state inputs + `parseInt`/`parseFloat` at submit; `KeyboardAvoidingView` + `TouchableWithoutFeedback(dismiss)` + custom `Done` accessory is copy-pasted in `add`/`search`/`goals` — replicate the pattern, don’t abstract unless asked (README lists shared input/button styles as tech debt).
- **Lists**: `Swipeable` requires root `GestureHandlerRootView` (already in `_layout`). Right-action component needs `displayName` for lint.
- **Dates**: always pass dates through router params as ISO strings, reconstruct with `new Date(iso)`, compare with `formatDateKey`. Never store `Date` in AsyncStorage; SQLite layer handles ISO conversion.
- **Store edits**: add thunks in the slice file + low-level SQL in `*-store.tsx`; keep `initialize/add/remove/clear/set` naming. Remember both tables share `diary.db` — table names `nutrition`/`catalog` must stay in sync across slice + store + import/export.
- **Quantity**: every total is `macro × (quantity ?? 1.0)`. New diary entries must set `quantity` (manual entry hardcodes `1.0`; catalog quick-add uses `QuantityModal`). Validate input with `parseQuantity`, normalize stored values with `normalizeQuantity`.
- **Insights metrics**: new chartable macros go in `insights.tsx` `METRIC_CONFIGS` + `insightsSettingsSlice` `DEFAULT_ORDER` (key type `InsightMetricId`); set `overIsGood` correctly (protein/fiber true, calories/fat/carbs false).
- **Barcode**: catalog `barcode` is `UNIQUE` + nullable. Handle constraint errors if you touch insert paths. Scanner currently UPC-only.
- **No tests**: run `npm run lint` and `npx tsc --noEmit` before finishing. For runtime verification use `npm run ios` (simulator) — Android is untested upstream.

## 9. Known gaps / TODOs (from README + code)

- No edit flow for diary/catalog entries (delete + re-add only). No per-entry quantity editing after logging (quantity set at log time).
- Quantity model exists (`quantity` per entry, `X`/`X.X` ≤ 999.9), but macros are still entered as integers via `parseInt` in `add.tsx`.
- Goals have no direction (surplus vs deficit) in the goals form; over-goal coloring assumes deficit for cal/fat/carbs, surplus for protein/fiber. (TDEE calculator does offer cutting/bulking ±500 targets at set time.)
- Insights charts side-scroll for fortnight/month instead of sampling (see TODO).
- Full diary loads into memory on boot; no pagination / pre-aggregation (tech debt noted in README). `DatePicker` aggregates per-day stats in-memory on every diary change.
- `diarySlice` vs `journal-store` naming is inconsistent (README tech debt); `setGoalsAsync` doesn’t clear keys; `FlatList` keys are indices; avatar fallback needs network.
- `react-native-dropdown-picker` is installed but unused; `use-color-scheme.web.ts` exists for web but web is not a target.
- `ios/` + `android/` exist locally but are gitignored prebuild artifacts — prefer `npx expo prebuild` / config-plugin changes in `app.json` over direct edits.
- `scripts/reset-project.js` is the Expo template reset — destructive, don’t run casually.

## 10. Agent quick-tasks

- **Add a screen**: create `app/<name>.tsx` (auto-routed), add `<Stack.Screen name="<name>" options={{ headerShown: false }} />` in `app/_layout.tsx`, navigate with `router.push/replace`.
- **Add a tab**: add file under `app/(tabs)/`, register `<NativeTabs.Trigger name="...">` in `app/(tabs)/_layout.tsx`.
- **Add persisted state**: new slice in `lib/` (thunks + `extraReducers`), wire reducer into `lib/store.ts`, call its `initialize` in `app/_layout.tsx`’s `Promise.all`, include it in `manage-data.tsx` export/import/clear. See `insightsSettingsSlice.ts` as the template (single JSON key + sanitize).
- **Add a chart**: compute `getLastNDaysKeys(n)` aggregates like `insights.tsx` (quantity-aware, 2dp rounding), render `<LineChartCard title labels dataPoints goal?>`. Register the metric in `METRIC_CONFIGS` + `insightsSettingsSlice` `DEFAULT_ORDER` so it respects visibility/order, and add an `AverageCard` row set if a period average makes sense.
