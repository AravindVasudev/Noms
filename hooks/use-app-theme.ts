import { getAppleColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppSelector } from '@/lib/store';

/** Resolves the stored appearance preference against the system scheme. */
export function useAppTheme() {
  const preference = useAppSelector((state) => state.appearance.preference);
  const systemScheme = useColorScheme() ?? 'light';
  const scheme = preference === 'system' ? systemScheme : preference;
  const resolved = scheme === 'dark' ? 'dark' as const : 'light' as const;
  return { scheme: resolved, preference, colors: getAppleColors(resolved) };
}
