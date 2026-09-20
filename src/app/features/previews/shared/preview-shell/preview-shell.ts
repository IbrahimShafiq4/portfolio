import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { LayoutService } from '../../../../core/services/layout.service';
import { ToastService } from '../../../../core/services/toast.service';

export interface PreviewNavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string | number;
  group?: string;
}

export interface ToolbarAction {
  id: string;
  label: string;
  icon: string;
  primary?: boolean;
  action: () => void;
}

export interface PreviewNotification {
  id: number;
  icon: string;
  title: string;
  body: string;
  time: string;
}

@Component({
  selector: 'app-preview-shell',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell" [attr.data-window]="layout.previewState()">
      <aside class="nav">
        <header class="nav-brand">
          <span class="brand-mark">{{ brand() }}</span>
          @if (!collapsed()) {
            <div class="brand-text">
              <b>{{ title() }}</b>
              <small>{{ subtitle() }}</small>
            </div>
          }
          <button class="collapse-btn" (click)="collapsed.set(!collapsed())"
                  [title]="collapsed() ? 'Expand' : 'Collapse'">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"
                 stroke-linecap="round" stroke-linejoin="round">
              <path [attr.d]="collapsed() ? 'm4 3 3 3-3 3' : 'm7 3-3 3 3 3'" />
            </svg>
          </button>
        </header>

        <nav class="nav-items">
          @for (group of groupedNav(); track group.name) {
            @if (group.name && !collapsed()) {
              <div class="nav-group-label">{{ group.name }}</div>
            }
            @for (item of group.items; track item.id) {
              <button
                class="nav-item"
                [class.active]="active() === item.id"
                (click)="onNavClick(item.id)"
                (contextmenu)="onNavContext($event, item.id, item.label)"
                [title]="item.label"
              >
                <span class="n-icon">{{ item.icon }}</span>
                @if (!collapsed()) {
                  <span class="n-label">{{ item.label }}</span>
                  @if (item.badge !== undefined && item.badge !== null) {
                    <span class="n-badge">{{ item.badge }}</span>
                  }
                }
              </button>
            }
          }
        </nav>

        <footer class="nav-foot">
          @if (!collapsed()) {
            <div class="foot-pill">
              <span class="dot-live"></span>
              <span>Live demo</span>
            </div>
            <div class="foot-meta">
              <span class="mono">v2.0 · {{ nav().length }} sections</span>
            </div>
          }
        </footer>
      </aside>

      <main class="stage">
        <header class="stage-bar" (contextmenu)="onShellContext($event)">
          <div class="crumbs">
            <span class="crumb">{{ title() }}</span>
            <span class="crumb-sep">/</span>
            <span class="crumb active">{{ activeLabel() }}</span>
          </div>

          @if (searchPlaceholder()) {
            <div class="stage-search">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"
                   stroke-width="1.8" stroke-linecap="round">
                <circle cx="9" cy="9" r="6" /><path d="m17 17-3.5-3.5" />
              </svg>
              <input
                [placeholder]="searchPlaceholder()"
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearch($event)"
              />
              @if (searchQuery()) {
                <button class="clear-search" (click)="onSearch('')">✕</button>
              }
            </div>
          }

          <div class="stage-actions">
            @for (a of toolbarActions(); track a.id) {
              <button
                class="tb-btn"
                [class.primary]="a.primary"
                (click)="a.action()"
                [title]="a.label"
              >
                <span class="tb-icon">{{ a.icon }}</span>
                <span class="tb-label">{{ a.label }}</span>
              </button>
            }

            <div class="divider"></div>

            <button class="icon-btn" (click)="notifOpen.set(!notifOpen())"
                    [class.active]="notifOpen()" title="Notifications">
              <span>🔔</span>
              @if (notifications().length) {
                <span class="notif-dot">{{ notifications().length }}</span>
              }
            </button>

            <button class="user-btn" (click)="userMenuOpen.set(!userMenuOpen())"
                    [class.active]="userMenuOpen()" title="Account">
              <span class="user-av">IS</span>
            </button>

            <div class="divider"></div>

            <div class="window-controls">
              <button class="wc minimize" (click)="layout.minimizePreview()" title="Minimize">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
                  <path d="M3 6h6" />
                </svg>
              </button>
              <button class="wc maximize" (click)="layout.maximizePreview()"
                      [title]="layout.previewState() === 'maximized' ? 'Restore' : 'Maximize'">
                @if (layout.previewState() === 'maximized') {
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">
                    <rect x="3" y="3" width="6" height="6" />
                  </svg>
                } @else {
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">
                    <rect x="2.5" y="2.5" width="7" height="7" />
                  </svg>
                }
              </button>
              <button class="wc close" (click)="onClose()" title="Close">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
                  <path d="m3 3 6 6 M9 3l-6 6" />
                </svg>
              </button>
            </div>
          </div>

          @if (notifOpen()) {
            <div class="dropdown notif-drop" (click)="$event.stopPropagation()">
              <header>
                <b>Notifications</b>
                <button class="link-btn" (click)="clearNotifs()">Clear all</button>
              </header>
              @for (n of notifications(); track n.id) {
                <button class="notif-row" (click)="openNotif(n)">
                  <span class="nr-icon">{{ n.icon }}</span>
                  <div class="nr-body">
                    <b>{{ n.title }}</b>
                    <small>{{ n.body }}</small>
                  </div>
                  <span class="nr-time">{{ n.time }}</span>
                </button>
              } @empty {
                <div class="empty-drop">No notifications</div>
              }
            </div>
          }

          @if (userMenuOpen()) {
            <div class="dropdown user-drop" (click)="$event.stopPropagation()">
              <div class="user-head">
                <span class="user-av-lg">IS</span>
                <div>
                  <b>Ibrahim Shafiq</b>
                  <small>ibrahim.shafiq440&#64;gmail.com</small>
                </div>
              </div>
              <button class="menu-item" (click)="userAction('profile')">👤 Profile</button>
              <button class="menu-item" (click)="userAction('preferences')">⚙️ Preferences</button>
              <button class="menu-item" (click)="userAction('themes')">🎨 Themes</button>
              <div class="menu-sep"></div>
              <button class="menu-item danger" (click)="userAction('signout')">🚪 Sign out</button>
            </div>
          }
        </header>

        <div class="stage-body" (click)="closeDropdowns()">
          <ng-content />
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: hidden; }
    .shell {
      display: grid;
      grid-template-columns: 240px 1fr;
      height: 100%;
      background: var(--bg-root);
      transition: grid-template-columns var(--t-base) var(--ease-smooth);
    }
    .shell.collapsed { grid-template-columns: 60px 1fr; }
    .shell[data-window='maximized'] {
      position: fixed;
      inset: 0;
      z-index: 9990;
      grid-template-columns: 240px 1fr;
    }
    .shell[data-window='minimized'] {
      position: fixed;
      bottom: 44px;
      right: 20px;
      width: 320px;
      height: 80px;
      z-index: 9990;
      grid-template-columns: 1fr;
      border-radius: var(--r-md);
      box-shadow: var(--shadow-xl);
      overflow: hidden;
    }
    .shell[data-window='minimized'] .nav { display: none; }
    .shell[data-window='minimized'] .stage-body { display: none; }
    .shell[data-window='minimized'] .stage { grid-template-rows: 56px; }
    .shell[data-window='closed'] { display: none; }

    .nav {
      display: flex;
      flex-direction: column;
      background: var(--bg-sidebar);
      backdrop-filter: var(--blur-regular);
      -webkit-backdrop-filter: var(--blur-regular);
      border-right: 0.5px solid var(--separator);
      overflow: hidden;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 12px;
      border-bottom: 0.5px solid var(--separator);
      min-height: 62px;
    }
    .brand-mark {
      width: 34px; height: 34px;
      display: grid; place-items: center;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: var(--r-sm);
      font-size: 17px;
      flex-shrink: 0;
    }
    .brand-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .brand-text b { font-size: var(--fs-sm); font-weight: 700; letter-spacing: -0.015em;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .brand-text small { font-size: var(--fs-2xs); color: var(--label-2);
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .collapse-btn {
      width: 22px; height: 22px;
      display: grid; place-items: center;
      border-radius: var(--r-xs);
      color: var(--label-3);
      flex-shrink: 0;
      transition: all var(--t-fast);
    }
    .collapse-btn:hover { background: var(--bg-hover); color: var(--label); }
    .collapse-btn svg { width: 12px; height: 12px; }

    .nav-items {
      flex: 1;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 1px;
      overflow-y: auto;
    }
    .nav-group-label {
      padding: 10px 10px 6px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--label-3);
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      border-radius: var(--r-sm);
      color: var(--label-2);
      font-size: var(--fs-sm);
      font-weight: 500;
      text-align: left;
      transition: all var(--t-fast) var(--ease-smooth);
      white-space: nowrap;
      position: relative;
    }
    .nav-item:hover { background: var(--bg-hover); color: var(--label); }
    .nav-item.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0; top: 50%;
      transform: translateY(-50%);
      width: 3px; height: 18px;
      background: var(--accent);
      border-radius: 0 3px 3px 0;
    }
    .n-icon { font-size: 15px; flex-shrink: 0; width: 20px; text-align: center; }
    .n-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }
    .n-badge {
      background: var(--bg-fill-3);
      color: var(--label-2);
      padding: 1px 7px;
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .nav-item.active .n-badge { background: var(--accent); color: var(--accent-contrast); }

    .nav-foot {
      padding: 12px 14px;
      border-top: 0.5px solid var(--separator);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .foot-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 10px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
      color: #34c759;
      align-self: flex-start;
    }
    .dot-live {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #34c759;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 2px rgba(52, 199, 89, 0.2); }
      50% { box-shadow: 0 0 0 5px rgba(52, 199, 89, 0.05); }
    }
    .foot-meta { font-size: 9px; color: var(--label-3); }
    .mono { font-family: var(--sf-mono); }

    .stage {
      display: grid;
      grid-template-rows: 56px 1fr;
      min-height: 0;
      overflow: hidden;
      position: relative;
    }
    .stage-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 0 16px;
      background: var(--bg-chrome);
      backdrop-filter: var(--blur-thin);
      -webkit-backdrop-filter: var(--blur-thin);
      border-bottom: 0.5px solid var(--separator);
      position: relative;
      z-index: 20;
    }
    .crumbs {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--fs-xs);
      color: var(--label-2);
      font-weight: 500;
      flex-shrink: 0;
    }
    .crumb-sep { color: var(--label-4); }
    .crumb.active { color: var(--label); font-weight: 600; }

    .stage-search {
      flex: 1;
      max-width: 340px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      background: var(--bg-input);
      border-radius: var(--r-pill);
      height: 34px;
      transition: box-shadow var(--t-fast);
    }
    .stage-search:focus-within { box-shadow: 0 0 0 2px var(--accent-soft); }
    .stage-search svg { width: 14px; height: 14px; color: var(--label-3); flex-shrink: 0; }
    .stage-search input {
      flex: 1;
      background: transparent;
      border: 0;
      outline: none;
      font-size: var(--fs-xs);
      color: var(--label);
      font-family: inherit;
    }
    .stage-search input::placeholder { color: var(--label-3); }
    .clear-search {
      width: 18px; height: 18px;
      display: grid; place-items: center;
      background: var(--bg-fill-3);
      color: var(--label-2);
      border-radius: 50%;
      font-size: 10px;
    }

    .stage-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
    }
    .tb-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: var(--r-sm);
      background: var(--bg-fill-2);
      color: var(--label);
      font-size: var(--fs-xs);
      font-weight: 600;
      transition: all var(--t-fast);
    }
    .tb-btn:hover { background: var(--bg-fill-3); }
    .tb-btn.primary { background: var(--accent); color: var(--accent-contrast); }
    .tb-btn.primary:hover { background: var(--accent-hover); }
    .tb-icon { font-size: 13px; }
    .tb-label { white-space: nowrap; }
    @media (max-width: 1024px) { .tb-label { display: none; } .tb-btn { padding: 7px 10px; } }

    .divider { width: 1px; height: 20px; background: var(--separator); margin: 0 4px; }

    .icon-btn {
      position: relative;
      width: 34px; height: 34px;
      display: grid; place-items: center;
      border-radius: var(--r-sm);
      color: var(--label-2);
      transition: all var(--t-fast);
      font-size: 15px;
    }
    .icon-btn:hover { background: var(--bg-hover); color: var(--label); }
    .icon-btn.active { background: var(--bg-fill-2); color: var(--label); }
    .notif-dot {
      position: absolute;
      top: 4px; right: 4px;
      min-width: 16px; height: 16px;
      padding: 0 4px;
      background: #ff3b30;
      color: #fff;
      border-radius: var(--r-pill);
      font-size: 9px;
      font-weight: 800;
      display: grid; place-items: center;
      border: 2px solid var(--bg-chrome);
    }

    .user-btn {
      width: 34px; height: 34px;
      display: grid; place-items: center;
      border-radius: 50%;
      transition: all var(--t-fast);
    }
    .user-btn:hover, .user-btn.active { background: var(--bg-hover); }
    .user-av {
      width: 30px; height: 30px;
      display: grid; place-items: center;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: 50%;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.02em;
    }

    .window-controls {
      display: flex;
      gap: 2px;
      padding-left: 4px;
      border-left: 0.5px solid var(--separator);
      margin-left: 4px;
    }
    .wc {
      width: 28px; height: 28px;
      display: grid; place-items: center;
      border-radius: var(--r-xs);
      color: var(--label-2);
      transition: all var(--t-fast);
    }
    .wc svg { width: 12px; height: 12px; }
    .wc:hover { background: var(--bg-hover); color: var(--label); }
    .wc.close:hover { background: #ff3b30; color: #fff; }

    .dropdown {
      position: absolute;
      top: 60px;
      background: var(--bg-elevated);
      backdrop-filter: var(--blur-thick);
      -webkit-backdrop-filter: var(--blur-thick);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      box-shadow: var(--shadow-lg);
      z-index: 100;
      animation: dropIn 220ms var(--ease-spring);
      overflow: hidden;
    }
    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-6px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .notif-drop { right: 152px; width: 340px; max-height: 400px; overflow-y: auto; }
    .notif-drop header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      border-bottom: 0.5px solid var(--separator);
      font-size: var(--fs-xs);
      position: sticky;
      top: 0;
      background: var(--bg-elevated);
      backdrop-filter: var(--blur-thick);
      z-index: 1;
    }
    .link-btn { color: var(--accent); font-size: 10px; font-weight: 600; }
    .link-btn:hover { text-decoration: underline; }
    .notif-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      border-bottom: 0.5px solid var(--separator);
      transition: background var(--t-fast);
      width: 100%;
      text-align: left;
    }
    .notif-row:last-child { border-bottom: 0; }
    .notif-row:hover { background: var(--bg-hover); }
    .nr-icon { font-size: 16px; }
    .nr-body { flex: 1; min-width: 0; }
    .nr-body b { font-size: var(--fs-2xs); font-weight: 700; display: block; }
    .nr-body small { font-size: 10px; color: var(--label-2); line-height: 1.35;
                    display: block; margin-top: 2px; }
    .nr-time { font-size: 9px; color: var(--label-3); font-family: var(--sf-mono); }

    .user-drop { right: 118px; width: 260px; padding: 6px; }
    .user-head {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 10px 14px;
      border-bottom: 0.5px solid var(--separator);
      margin-bottom: 6px;
    }
    .user-av-lg {
      width: 40px; height: 40px;
      display: grid; place-items: center;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: 50%;
      font-size: 14px;
      font-weight: 800;
    }
    .user-head b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .user-head small { font-size: 10px; color: var(--label-2); }
    .menu-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: var(--r-xs);
      color: var(--label);
      font-size: var(--fs-xs);
      text-align: left;
      transition: background var(--t-fast);
    }
    .menu-item:hover { background: var(--bg-hover); }
    .menu-item.danger { color: #ff3b30; }
    .menu-sep { height: 0.5px; background: var(--separator); margin: 6px 0; }
    .empty-drop { padding: 30px 20px; text-align: center;
                  color: var(--label-3); font-size: var(--fs-xs); }

    .stage-body { overflow-y: auto; padding: 24px; background: var(--bg-root); }

    @media (max-width: 820px) {
      .shell { grid-template-columns: 60px 1fr; }
      .brand-text, .n-label, .nav-foot, .nav-group-label, .n-badge { display: none; }
      .stage-search { max-width: none; }
    }
  `],
})
export class PreviewShellComponent {
  brand = input<string>('◆');
  title = input<string>('Preview');
  subtitle = input<string>('Interactive demo');
  nav = input<PreviewNavItem[]>([]);
  active = input<string>('');
  searchPlaceholder = input<string>('');
  toolbarActions = input<ToolbarAction[]>([]);
  notifications = input<PreviewNotification[]>([]);

  activeChange = output<string>();
  searchChange = output<string>();
  closeRequest = output<void>();
  notifOpenRequest = output<PreviewNotification>();

  readonly layout = inject(LayoutService);
  private menu = inject(ContextMenuService);
  private toast = inject(ToastService);

  readonly searchQuery = signal('');
  readonly collapsed = signal(false);
  readonly notifOpen = signal(false);
  readonly userMenuOpen = signal(false);

  onNavClick(id: string): void {
    this.activeChange.emit(id);
    this.closeDropdowns();
  }

  onSearch(q: string): void {
    this.searchQuery.set(q);
    this.searchChange.emit(q);
  }

  onClose(): void {
    this.closeRequest.emit();
    this.layout.closePreview();
  }

  openNotif(n: PreviewNotification): void {
    this.notifOpen.set(false);
    this.notifOpenRequest.emit(n);
  }

  clearNotifs(): void {
    this.toast.success('Notifications cleared');
    this.notifOpen.set(false);
  }

  userAction(kind: string): void {
    this.userMenuOpen.set(false);
    const map: Record<string, string> = {
      profile: '👤 Opening profile…',
      preferences: '⚙️ Loading preferences…',
      themes: '🎨 Opening themes…',
      signout: '🚪 Signed out',
    };
    this.toast.info(map[kind] ?? kind);
  }

  closeDropdowns(): void {
    this.notifOpen.set(false);
    this.userMenuOpen.set(false);
  }

  onNavContext(ev: MouseEvent, id: string, label: string): void {
    ev.preventDefault();
    ev.stopPropagation();

    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'open', label: 'Open', icon: '📂', action: () => this.onNavClick(id) },
      {
        id: 'open-new', label: 'Open in new tab', icon: '➕',
        action: () => this.toast.info(`Opened "${label}" in new tab`)
      },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'pin', label: 'Pin to sidebar', icon: '📌',
        action: () => this.toast.success(`Pinned "${label}"`)
      },
      {
        id: 'rename', label: 'Rename…', icon: '✎',
        action: () => this.toast.info(`Renaming "${label}"`)
      },
      {
        id: 'duplicate', label: 'Duplicate', icon: '⧉',
        action: () => this.toast.success(`Duplicated "${label}"`)
      },
      { id: 'sep-2', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'export', label: 'Export as JSON', icon: '📤',
        action: () => this.toast.success(`Exported "${label}"`)
      },
      { id: 'sep-3', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'delete', label: 'Delete', icon: '🗑', danger: true,
        action: () => this.toast.warning(`Deleted "${label}"`)
      },
    ], id);
  }

  onShellContext(ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      {
        id: 'reload', label: 'Reload preview', icon: '⟳', shortcut: '⌘R',
        action: () => { window.location.reload(); }
      },
      {
        id: 'hard', label: 'Hard reload', icon: '⚡', shortcut: '⇧⌘R',
        action: () => { window.location.reload(); }
      },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      { id: 'max', label: 'Maximize', icon: '⛶', action: () => this.layout.maximizePreview() },
      { id: 'min', label: 'Minimize', icon: '⊟', action: () => this.layout.minimizePreview() },
      { id: 'sep-2', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'inspect', label: 'Inspect element', icon: '🔍',
        action: () => this.toast.info('DevTools inspection mode')
      },
      {
        id: 'console', label: 'Open console', icon: '⌨︎',
        action: () => this.toast.info('Console opened')
      },
      { id: 'sep-3', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'copy-link', label: 'Copy link to view', icon: '🔗',
        action: () => {
          navigator.clipboard?.writeText(window.location.href);
          this.toast.success('Link copied');
        }
      },
      {
        id: 'print', label: 'Print view', icon: '🖨', shortcut: '⌘P',
        action: () => window.print()
      },
    ]);
  }

  readonly groupedNav = computed(() => {
    const items = this.nav();
    const map = new Map<string, PreviewNavItem[]>();
    for (const item of items) {
      const key = item.group ?? '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
  });

  readonly activeLabel = computed(() => {
    const id = this.active();
    return this.nav().find(n => n.id === id)?.label ?? '';
  });
}