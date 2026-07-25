import type { DualTheme, Theme } from '../../../src/types';

// packages/player/src/theme.ts

export interface FoliaThemeTokens {
    background: string;
    foreground: string;
    accent: string;
    secondary: string;
    fontFamily?: string;
    fontWeight?: number;
}

function buildTheme(name: string, tokens: FoliaThemeTokens): Theme {
    return {
        name,
        backgroundColor: tokens.background,
        primaryColor: tokens.foreground,
        accentColor: tokens.accent,
        secondaryColor: tokens.secondary,
        fontStyle: 'sans',
        fontFamily: tokens.fontFamily,
        fontFamilyStack: tokens.fontFamily ? [tokens.fontFamily] : undefined,
        fontWeight: tokens.fontWeight,
        animationIntensity: 'normal',
        wordColors: [],
        lyricsIcons: [],
        provider: 'host',
    };
}

export function buildFoliaDualTheme(light: FoliaThemeTokens, dark: FoliaThemeTokens): DualTheme {
    return {
        light: buildTheme('Host Light', light),
        dark: buildTheme('Host Dark', dark),
    };
}

export const DEFAULT_FOLIA_DUAL_THEME: DualTheme = buildFoliaDualTheme(
    {
        background: '#f6f7f8',
        foreground: '#17191c',
        accent: '#137f72',
        secondary: '#677078',
    },
    {
        background: '#111315',
        foreground: '#f4f6f7',
        accent: '#5bd1bf',
        secondary: '#9aa4aa',
    },
);
