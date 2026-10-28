/**
 * Apple Human Interface Guidelines semantic colors.
 * Names follow Apple's dynamic system colors (label, separators, grouped
 * backgrounds) so the palette adapts to light/dark instead of hard-coding
 * one appearance. Values are Apple's documented light/dark variants:
 * system backgrounds white/black, cards white / #1C1C1E, blue #007AFF /
 * #0A84FF (brighter in dark for contrast), red #FF3B30 / #FF453A.
 */

import { Platform } from 'react-native';

export type AppColorScheme = 'light' | 'dark';
export type AppearancePreference = 'system' | AppColorScheme;

const tintColorLight = '#007AFF';
const tintColorDark = '#0A84FF';

export const Colors = {
  light: {
    text: '#000000',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#3C3C43',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    tint: tintColorDark,
    icon: '#EBEBF5',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorDark,
  },
};

export const AppleSemanticColors = {
  light: {
    systemBackground: '#FFFFFF',
    systemGroupedBackground: '#F2F2F7',
    cardBackground: '#FFFFFF',
    label: '#000000',
    secondaryLabel: 'rgba(60,60,67,0.6)',
    separator: '#C6C6C8',
    systemBlue: '#007AFF',
    destructive: '#FF3B30',
    segmentedTrack: '#E5E5EA',
    inputBackground: '#F0F0F3',
    onAccent: '#FFFFFF',
  },
  dark: {
    systemBackground: '#000000',
    systemGroupedBackground: '#000000',
    cardBackground: '#1C1C1E',
    label: '#FFFFFF',
    secondaryLabel: 'rgba(235,235,245,0.6)',
    separator: '#38383A',
    systemBlue: '#0A84FF',
    destructive: '#FF453A',
    segmentedTrack: '#2C2C2E',
    inputBackground: '#2C2C2E',
    onAccent: '#FFFFFF',
  },
} as const;

export type AppleSemanticColorName = keyof typeof AppleSemanticColors.light;

export function getAppleColors(scheme: AppColorScheme) {
  return AppleSemanticColors[scheme === 'dark' ? 'dark' : 'light'];
}

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
