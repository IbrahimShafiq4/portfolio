import { Service, signal } from '@angular/core';
import { EditorTab } from '../models/tab.model';

const WELCOME: EditorTab = {
    id: 'welcome', title: 'Welcome', icon: '🏠', type: 'welcome', closable: false,
};

@Service()
export class TabsService {
    readonly tabs = signal<EditorTab[]>([WELCOME]);
    readonly activeId = signal<string>('welcome');

    open(tab: EditorTab): void {
        if (!this.tabs().some(t => t.id === tab.id)) {
            this.tabs.update(list => [...list, tab]);
        }
        this.activeId.set(tab.id);
    }

    close(id: string): void {
        const t = this.tabs().find(x => x.id === id);
        if (!t?.closable) return;
        const list = this.tabs().filter(x => x.id !== id);
        this.tabs.set(list);
        if (this.activeId() === id && list.length) {
            this.activeId.set(list[list.length - 1].id);
        }
    }

    setActive(id: string): void { this.activeId.set(id); }
    active(): EditorTab | undefined { return this.tabs().find(t => t.id === this.activeId()); }
}