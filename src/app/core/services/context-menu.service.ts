import { Service, signal } from '@angular/core';

export interface ContextMenuItem {
    id: string;
    label: string;
    icon?: string;
    shortcut?: string;
    danger?: boolean;
    disabled?: boolean;
    separatorBefore?: boolean;
    action?: () => void;
}

export interface ContextMenuState {
    open: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
    target?: string;
}

@Service()
export class ContextMenuService {
    readonly state = signal<ContextMenuState>({
        open: false,
        x: 0,
        y: 0,
        items: [],
    });

    open(x: number, y: number, items: ContextMenuItem[], target?: string): void {
        const menuWidth = 240;
        const menuHeight = items.length * 36 + 20;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const adjX = x + menuWidth > vw ? Math.max(8, vw - menuWidth - 8) : x;
        const adjY = y + menuHeight > vh ? Math.max(8, vh - menuHeight - 8) : y;

        this.state.set({ open: true, x: adjX, y: adjY, items, target });
    }

    close(): void {
        this.state.update(s => ({ ...s, open: false }));
    }
}