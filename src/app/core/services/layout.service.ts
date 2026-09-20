import { Service, signal } from '@angular/core';
import { SidebarPanel } from '../models/tab.model';

export type LayoutMode = 'desktop' | 'tablet' | 'mobile';
export type PreviewWindowState = 'normal' | 'maximized' | 'minimized' | 'closed';

@Service()
export class LayoutService {
    readonly sidebarOpen = signal<boolean>(true);
    readonly sidebarPanel = signal<SidebarPanel>('explorer');
    readonly terminalOpen = signal<boolean>(false);
    readonly terminalHeight = signal<number>(280);
    readonly mobileSidebarOpen = signal<boolean>(false);
    readonly viewport = signal<LayoutMode>('desktop');

    readonly previewState = signal<PreviewWindowState>('normal');

    constructor() { this.watchViewport(); }

    private watchViewport(): void {
        const compute = () => {
            const w = window.innerWidth;
            const mode: LayoutMode = w < 720 ? 'mobile' : w < 1100 ? 'tablet' : 'desktop';
            this.viewport.set(mode);
            if (mode === 'mobile') this.mobileSidebarOpen.set(false);
        };
        compute();
        window.addEventListener('resize', compute);
    }

    showSidebar(panel: SidebarPanel): void {
        this.sidebarPanel.set(panel);
        if (this.viewport() === 'mobile') {
            this.mobileSidebarOpen.set(true);
        } else {
            this.sidebarOpen.set(true);
        }
    }

    toggleSidebar(panel: SidebarPanel): void {
        if (this.viewport() === 'mobile') {
            if (this.sidebarPanel() === panel && this.mobileSidebarOpen()) {
                this.mobileSidebarOpen.set(false);
            } else {
                this.sidebarPanel.set(panel);
                this.mobileSidebarOpen.set(true);
            }
            return;
        }
        if (this.sidebarPanel() === panel && this.sidebarOpen()) {
            this.sidebarOpen.set(false);
        } else {
            this.sidebarPanel.set(panel);
            this.sidebarOpen.set(true);
        }
    }

    closeSidebar(): void {
        this.sidebarOpen.set(false);
        this.mobileSidebarOpen.set(false);
    }

    toggleTerminal(): void { this.terminalOpen.update(v => !v); }

    setTerminalHeight(px: number): void {
        this.terminalHeight.set(Math.max(140, Math.min(px, window.innerHeight - 220)));
    }

    maximizePreview(): void {
        this.previewState.set(this.previewState() === 'maximized' ? 'normal' : 'maximized');
    }

    minimizePreview(): void {
        this.previewState.set(this.previewState() === 'minimized' ? 'normal' : 'minimized');
    }

    closePreview(): void {
        this.previewState.set('closed');
        setTimeout(() => this.previewState.set('normal'), 320);
    }

    resetPreview(): void {
        this.previewState.set('normal');
    }
}