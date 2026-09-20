export type ThemeId =
    | 'default-light'
    | 'default-dark'
    | 'github-dark'
    | 'nord'
    | 'solarized-light'
    | 'monokai';

export type AccentColor = 'blue' | 'purple' | 'pink' | 'orange' | 'green';

export interface ThemeDef {
    id: ThemeId;
    label: string;
    kind: 'light' | 'dark';
    preview: { bg: string; fg: string; accent: string };
}

export const THEMES: ThemeDef[] = [
    { id: 'default-light', label: 'Daylight', kind: 'light', preview: { bg: '#ffffff', fg: '#1a1a1a', accent: '#007aff' } },
    { id: 'default-dark', label: 'Midnight', kind: 'dark', preview: { bg: '#1c1c1e', fg: '#ffffff', accent: '#0a84ff' } },
    { id: 'github-dark', label: 'GitHub Dark', kind: 'dark', preview: { bg: '#0d1117', fg: '#c9d1d9', accent: '#58a6ff' } },
    { id: 'nord', label: 'Nord', kind: 'dark', preview: { bg: '#2e3440', fg: '#d8dee9', accent: '#88c0d0' } },
    { id: 'solarized-light', label: 'Solarized', kind: 'light', preview: { bg: '#fdf6e3', fg: '#586e75', accent: '#268bd2' } },
    { id: 'monokai', label: 'Monokai', kind: 'dark', preview: { bg: '#272822', fg: '#f8f8f2', accent: '#a6e22e' } },
];

export const ACCENTS: { id: AccentColor; label: string; swatch: string }[] = [
    { id: 'blue', label: 'Blue', swatch: '#007aff' },
    { id: 'purple', label: 'Purple', swatch: '#af52de' },
    { id: 'pink', label: 'Pink', swatch: '#ff2d55' },
    { id: 'orange', label: 'Orange', swatch: '#ff9500' },
    { id: 'green', label: 'Green', swatch: '#34c759' },
];