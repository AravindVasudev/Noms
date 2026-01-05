export function formatDateKey(date?: Date) {
  const d = date ? new Date(date) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getLastNDaysKeys(n: number, endDate?: Date) {
  const today = endDate ? new Date(endDate) : new Date();
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keys.push(formatDateKey(d));
  }
  return keys;
}

export function keyToWeekdayLabel(key: string, locale?: string) {
  const d = parseDateKey(key);
  return d.toLocaleDateString(locale, { weekday: 'short' });
}

export function parseDateKey(iso: string) {
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10));
  return new Date(y, m - 1, d);
}

export default { formatDateKey, getLastNDaysKeys, keyToWeekdayLabel };
