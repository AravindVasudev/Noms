export const DEFAULT_QUANTITY = 1.0;
export const MAX_QUANTITY = 999.9;

const QUANTITY_PATTERN = /^\d+(\.\d)?$/;

/**
 * Parse a quantity string in "X" or "X.X" form.
 * Returns a finite positive number rounded to 1 decimal, or null if invalid.
 */
export function parseQuantity(input: string): number | null {
  const trimmed = (input || '').trim();
  if (!QUANTITY_PATTERN.test(trimmed)) return null;
  const value = parseFloat(trimmed);
  if (!Number.isFinite(value) || value <= 0 || value > MAX_QUANTITY) return null;
  return Math.round(value * 10) / 10;
}

/** Format a quantity for display: whole numbers without decimal (3 -> "3"), otherwise one decimal (2.5 -> "2.5"). */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_QUANTITY.toFixed(1);
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
}

/** Normalize unknown/imported values, falling back to 1.0. */
export function normalizeQuantity(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.min(Math.round(value * 10) / 10, MAX_QUANTITY);
  }
  if (typeof value === 'string') {
    return parseQuantity(value) ?? DEFAULT_QUANTITY;
  }
  return DEFAULT_QUANTITY;
}

/**
 * Truncate a raw quantity input to one decimal place (cut, don't round).
 * Returns the truncated string, or the trimmed original when there is
 * nothing to truncate or the input isn't numeric.
 * Intended for onBlur normalization: "3.55" -> "3.5", "3." -> "3.0".
 */
export function truncateQuantityInput(input: string): string {
  const trimmed = (input || '').trim();
  const match = trimmed.match(/^(\d+)(?:\.(\d*))?$/);
  if (!match) return trimmed;
  const intPart = match[1];
  const decimals = match[2] ?? '';
  if (decimals.length <= 1) {
    return decimals.length === 0 && trimmed.includes('.') ? `${intPart}.0` : trimmed;
  }
  return `${intPart}.${decimals.slice(0, 1)}`;
}
