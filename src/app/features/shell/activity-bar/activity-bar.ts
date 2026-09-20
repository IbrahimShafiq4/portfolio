import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LayoutService } from '../../../core/services/layout.service';
import { SidebarPanel } from '../../../core/models/tab.model';

@Component({
  selector: 'app-activity-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-ctx]': '"activity"' },
  template: `
    <nav class="nav">
      @for (item of items; track item.id) {
        <button
          class="nav-btn"
          [class.active]="isActive(item.id)"
          (click)="layout.toggleSidebar(item.id)"
          [attr.data-ctx]="'activity'"
          [attr.data-ctx-id]="item.id"
          [attr.data-ctx-label]="item.label"
          [title]="item.label"
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path [attr.d]="item.path" />
          </svg>
          <span class="indicator"></span>
        </button>
      }
      <div class="spacer"></div>
      <button class="nav-btn"
              (click)="layout.toggleTerminal()"
              [class.active]="layout.terminalOpen()"
              [attr.data-ctx]="'activity'"
              [attr.data-ctx-id]="'terminal'"
              [attr.data-ctx-label]="'Terminal'"
              title="Terminal (⌘\`)">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="m7 9 3 3-3 3 M13 15h4" />
        </svg>
      </button>
    </nav>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .nav { height: 100%; display: flex; flex-direction: column; align-items: center;
           padding: 14px 0 12px; gap: 2px;
           background: var(--bg-sidebar);
           backdrop-filter: var(--blur-thin);
           border-right: 0.5px solid var(--separator); @media(max-width: 767px) { flex-direction: row; }}
    .nav-btn { position: relative; width: 40px; height: 40px; display: grid; place-items: center;
               border-radius: var(--r-sm); color: var(--label-2);
               transition: color var(--t-fast), background var(--t-fast), transform var(--t-fast); }
    .nav-btn:hover { color: var(--label); background: var(--bg-hover); }
    .nav-btn:active { transform: scale(0.92); }
    .nav-btn.active { color: var(--accent); background: var(--accent-soft); }
    .icon { width: 20px; height: 20px; }
    .indicator { position: absolute; left: -1px; top: 50%; width: 3px; height: 0;
                 background: var(--accent); border-radius: 0 var(--r-pill) var(--r-pill) 0;
                 transform: translateY(-50%); transition: height var(--t-base); }
    .nav-btn.active .indicator { height: 18px; }
    .spacer { flex: 1; }
  `],
})
export class ActivityBarComponent {
  readonly layout = inject(LayoutService);

  readonly items: { id: SidebarPanel; label: string; path: string }[] = [
    { id: 'explorer', label: 'Explorer', path: 'M3 5.5 12 3l9 2.5v13L12 21 3 18.5v-13Z M12 3v18' },
    { id: 'search', label: 'Search', path: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z M20 20l-4-4' },
    { id: 'dotnet', label: '.NET Projects', path: 'M4 6h16v4H4z M4 14h10v4H4z M16 14h4v4h-4z' },
    { id: 'companies', label: 'Companies', path: 'M4 21V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15 M14 21V10h4a2 2 0 0 1 2 2v9 M8 8h2 M8 12h2 M8 16h2' },
    { id: 'projects', label: 'Projects', path: 'M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z M3 12l9 4.5 9-4.5 M3 16.5 12 21l9-4.5' },
    { id: 'skills', label: 'Skills', path: 'M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l0-8Z' },
    { id: 'themes', label: 'Themes', path: 'M12 21a9 9 0 1 1 0-18c5 0 9 4 9 9 0 2-1.5 3-3 3h-2a2 2 0 0 0-1.5 3.3A2 2 0 0 1 12 21Z M7 12h.01 M9 8h.01 M14 7h.01 M17 11h.01' },
    { id: 'contact', label: 'Contact', path: 'M4 6h16v12H4z M4 6l8 6 8-6' },
  ];

  isActive(id: SidebarPanel): boolean {
    const active = this.layout.sidebarPanel() === id;
    if (this.layout.viewport() === 'mobile') return active && this.layout.mobileSidebarOpen();
    return active && this.layout.sidebarOpen();
  }
}