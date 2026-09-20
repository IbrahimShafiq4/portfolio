import { Service, effect, signal } from '@angular/core';
import { ACCENTS, AccentColor, THEMES, ThemeDef, ThemeId } from '../models/theme.model';

@Service()
export class ThemeService {
    readonly themes = THEMES;
    readonly accents = ACCENTS;

    readonly themeId = signal<ThemeId>(
        (localStorage.getItem('theme-id') as ThemeId) ?? 'default-dark'
    );
    readonly accent = signal<AccentColor>(
        (localStorage.getItem('accent') as AccentColor) ?? 'blue'
    );

    constructor() {
        effect(() => {
            const id = this.themeId();
            document.documentElement.setAttribute('data-theme', id);
            localStorage.setItem('theme-id', id);
        });
        effect(() => {
            const a = this.accent();
            document.documentElement.setAttribute('data-accent', a);
            localStorage.setItem('accent', a);
        });
    }

    setTheme(id: ThemeId): void { this.themeId.set(id); }
    setAccent(a: AccentColor): void { this.accent.set(a); }

    active(): ThemeDef {
        return this.themes.find(t => t.id === this.themeId()) ?? this.themes[0];
    }

    cycle(): void {
        const idx = this.themes.findIndex(t => t.id === this.themeId());
        this.themeId.set(this.themes[(idx + 1) % this.themes.length].id);
    }
}