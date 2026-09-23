import { Service, computed, effect, signal } from '@angular/core';

export type ViewMode = 'developer' | 'recruiter';

@Service()
export class ViewModeService {
    readonly mode = signal<ViewMode>(
        (localStorage.getItem('view-mode') as ViewMode) ?? 'developer'
    );

    readonly isDeveloper = computed(() => this.mode() === 'developer');
    readonly isRecruiter = computed(() => this.mode() === 'recruiter');

    constructor() {
        effect(() => {
            const m = this.mode();
            localStorage.setItem('view-mode', m);
            document.documentElement.setAttribute('data-view', m);
        });
    }

    set(mode: ViewMode): void {
        this.mode.set(mode);
    }

    toggle(): void {
        this.mode.set(this.mode() === 'developer' ? 'recruiter' : 'developer');
    }
}