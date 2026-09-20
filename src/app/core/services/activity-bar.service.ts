import { Service, signal } from '@angular/core';
import { SidebarPanel } from '../models/tab.model';

@Service()
export class ActivityBarService {
    readonly active = signal<SidebarPanel>('explorer');

    select(panel: SidebarPanel): void {
        this.active.set(panel);
    }
}