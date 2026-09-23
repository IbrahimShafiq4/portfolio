import { ChangeDetectionStrategy, Component, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { LayoutService } from '../../../../core/services/layout.service';
import { TabsService } from '../../../../core/services/tabs.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { ToastService } from '../../../../core/services/toast.service';

export interface PreviewNavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string | number;
  group?: string;
  action?: () => void;
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
  action?: () => void;
}

@Component({
  selector: 'app-preview-shell',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell"
         [class.collapsed]="collapsed()"
         [attr.data-window]="layout.previewState()">
      <aside class="nav">
        <header class="nav-brand">
          <button class="brand-mark-btn" (click)="goHome()" title="Go to home">
            <span class="brand-mark">{{ brand() }}</span>
          </button>
          @if (!collapsed()) {
            <div class="brand-text" (click)="goHome()" title="Go to home">
              <b>{{ title() }}</b>
              <small>{{ subtitle() }}</small>
            </div>
          }
          <button class="collapse-btn"
                  (click)="toggleCollapsed()"
                  [title]="collapsed() ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'">
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
                (click)="onNavClick(item)"
                (contextmenu)="onNavContext($event, item)"
                [title]="collapsed() ? item.label : ''"
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
            <button class="foot-pill" (click)="pingLive()" title="Refresh live data">
              <span class="dot-live"></span>
              <span>Live demo</span>
            </button>
            <div class="foot-meta">
              <span class="mono">v2.0 · {{ nav().length }} sections</span>
            </div>
          } @else {
            <button class="foot-icon-btn" (click)="pingLive()" title="Live demo">
              <span class="dot-live"></span>
            </button>
          }
        </footer>
      </aside>

      <main class="stage">
        <header class="stage-bar" (contextmenu)="onShellContext($event)">
          <div class="crumbs">
            <button class="crumb-btn" (click)="goHome()" title="Home">{{ title() }}</button>
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
                #searchInput
                [placeholder]="searchPlaceholder()"
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearch($event)"
              />
              @if (searchQuery()) {
                <button class="clear-search" (click)="onSearch('')" title="Clear">✕</button>
              } @else {
                <kbd class="search-kbd">⌘F</kbd>
              }
            </div>
          }

          <div class="stage-actions">
            @for (a of allToolbarActions(); track a.id) {
              <button
                class="tb-btn"
                [class.primary]="a.primary"
                (click)="runToolbar(a)"
                [title]="a.label"
              >
                <span class="tb-icon">{{ a.icon }}</span>
                <span class="tb-label">{{ a.label }}</span>
              </button>
            }

            <div class="divider"></div>

            <button class="icon-btn" (click)="toggleNotifs()"
                    [class.active]="notifOpen()" title="Notifications">
              <span>🔔</span>
              @if (notifications().length) {
                <span class="notif-dot">{{ notifications().length }}</span>
              }
            </button>

            <button class="user-btn" (click)="toggleUserMenu()"
                    [class.active]="userMenuOpen()" title="Account">
              <span class="user-av">IS</span>
            </button>

            <div class="divider"></div>

            <div class="window-controls">
              <button class="wc minimize" (click)="minimize()" title="Minimize">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
                  <path d="M3 6h6" />
                </svg>
              </button>
              <button class="wc maximize" (click)="maximize()"
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
                <b>Notifications ({{ notifications().length }})</b>
                <button class="link-btn" (click)="clearNotifs()" [disabled]="!notifications().length">
                  Clear all
                </button>
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
                <div class="empty-drop">
                  <span>🔕</span>
                  <b>All caught up</b>
                  <small>No notifications</small>
                </div>
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
              <button class="menu-item" (click)="userAction('profile')">
                <span class="mi-icon">👤</span>
                <span class="mi-text">
                  <b>Profile</b>
                  <small>Open landing page</small>
                </span>
              </button>
              <button class="menu-item" (click)="userAction('cv')">
                <span class="mi-icon">📄</span>
                <span class="mi-text">
                  <b>View CV</b>
                  <small>Resume & experience</small>
                </span>
              </button>
              <button class="menu-item" (click)="userAction('themes')">
                <span class="mi-icon">🎨</span>
                <span class="mi-text">
                  <b>Themes & Appearance</b>
                  <small>Color scheme & accent</small>
                </span>
              </button>
              <button class="menu-item" (click)="userAction('contact')">
                <span class="mi-icon">✉️</span>
                <span class="mi-text">
                  <b>Contact</b>
                  <small>Email, phone, LinkedIn</small>
                </span>
              </button>
              <button class="menu-item" (click)="userAction('terminal')">
                <span class="mi-icon">⌨️</span>
                <span class="mi-text">
                  <b>Open Terminal</b>
                  <small>Run commands</small>
                </span>
              </button>
              <div class="menu-sep"></div>
              <button class="menu-item" (click)="userAction('themes-cycle')">
                <span class="mi-icon">🎨</span>
                <span class="mi-text">
                  <b>Cycle Theme</b>
                  <small>{{ theme.active().label }}</small>
                </span>
              </button>
              <div class="menu-sep"></div>
              <button class="menu-item danger" (click)="userAction('signout')">
                <span class="mi-icon">🚪</span>
                <span class="mi-text">
                  <b>Sign out</b>
                  <small>Clear session</small>
                </span>
              </button>
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
    .shell[data-window='maximized'] { position: fixed; inset: 0; z-index: 9990; }
    .shell[data-window='minimized'] {
      position: fixed; bottom: 44px; right: 20px;
      width: 320px; height: 80px; z-index: 9990;
      grid-template-columns: 1fr; border-radius: var(--r-md);
      box-shadow: var(--shadow-xl); overflow: hidden;
    }
    .shell[data-window='minimized'] .nav,
    .shell[data-window='minimized'] .stage-body { display: none; }
    .shell[data-window='minimized'] .stage { grid-template-rows: 56px; }
    .shell[data-window='closed'] { display: none; }

    .nav {
      display: flex; flex-direction: column;
      background: var(--bg-sidebar);
      backdrop-filter: var(--blur-regular);
      border-right: 0.5px solid var(--separator);
      overflow: hidden; min-width: 0;
    }
    .nav-brand {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 12px; border-bottom: 0.5px solid var(--separator);
      min-height: 62px;
    }
    .brand-mark-btn {
      background: transparent; border: 0; padding: 0;
      cursor: pointer; flex-shrink: 0; border-radius: var(--r-sm);
      transition: transform var(--t-fast);
    }
    .brand-mark-btn:hover { transform: scale(1.05); }
    .brand-mark-btn:active { transform: scale(0.95); }
    .brand-mark {
      width: 34px; height: 34px;
      display: grid; place-items: center;
      background: var(--accent-soft); color: var(--accent);
      border-radius: var(--r-sm); font-size: 17px;
    }
    .brand-text {
      flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px;
      cursor: pointer; padding: 4px 6px; border-radius: var(--r-xs);
      transition: background var(--t-fast);
    }
    .brand-text:hover { background: var(--bg-hover); }
    .brand-text b { font-size: var(--fs-sm); font-weight: 700; letter-spacing: -0.015em;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .brand-text small { font-size: var(--fs-2xs); color: var(--label-2);
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .collapse-btn {
      width: 24px; height: 24px;
      display: grid; place-items: center;
      border-radius: var(--r-xs); color: var(--label-3);
      flex-shrink: 0; cursor: pointer;
      transition: background var(--t-fast), color var(--t-fast);
    }
    .collapse-btn:hover { background: var(--bg-hover); color: var(--label); }
    .collapse-btn svg { width: 12px; height: 12px; }

    .nav-items {
      flex: 1; padding: 12px 8px;
      display: flex; flex-direction: column; gap: 1px;
      overflow-y: auto; overflow-x: hidden;
    }
    .nav-group-label {
      padding: 10px 10px 6px;
      font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--label-3); white-space: nowrap;
    }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 10px; border-radius: var(--r-sm);
      color: var(--label-2); font-size: var(--fs-sm); font-weight: 500;
      text-align: left; cursor: pointer;
      transition: background var(--t-fast), color var(--t-fast);
      white-space: nowrap; position: relative; overflow: hidden;
      background: transparent; border: 0;
    }
    .nav-item:hover { background: var(--bg-hover); color: var(--label); }
    .nav-item.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
    .nav-item.active::before {
      content: ''; position: absolute;
      left: 0; top: 50%; transform: translateY(-50%);
      width: 3px; height: 18px;
      background: var(--accent); border-radius: 0 3px 3px 0;
    }
    .n-icon { font-size: 15px; flex-shrink: 0; width: 20px; text-align: center; }
    .n-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }
    .n-badge {
      background: var(--bg-fill-3); color: var(--label-2);
      padding: 1px 7px; border-radius: var(--r-pill);
      font-size: 10px; font-weight: 700; font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }
    .nav-item.active .n-badge { background: var(--accent); color: var(--accent-contrast); }

    .nav-foot {
      padding: 12px 14px; border-top: 0.5px solid var(--separator);
      display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;
    }
    .foot-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 10px; background: var(--bg-fill-2);
      border-radius: var(--r-pill); font-size: 10px; font-weight: 700;
      color: #34c759; align-self: flex-start; white-space: nowrap;
      cursor: pointer; border: 0; transition: background var(--t-fast);
    }
    .foot-pill:hover { background: var(--bg-fill-3); }
    .foot-icon-btn {
      width: 32px; height: 32px; margin: 0 auto;
      display: grid; place-items: center;
      background: var(--bg-fill-2); border: 0; border-radius: 50%;
      cursor: pointer;
    }
    .foot-icon-btn:hover { background: var(--bg-fill-3); }
    .dot-live {
      width: 6px; height: 6px; border-radius: 50%;
      background: #34c759; animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 2px rgba(52, 199, 89, 0.2); }
      50% { box-shadow: 0 0 0 5px rgba(52, 199, 89, 0.05); }
    }
    .foot-meta { font-size: 9px; color: var(--label-3); white-space: nowrap; }
    .mono { font-family: var(--sf-mono); }

    .shell.collapsed .nav-brand { flex-direction: column; padding: 14px 8px; gap: 6px; }
    .shell.collapsed .nav-item { padding: 9px; justify-content: center; }
    .shell.collapsed .n-icon { width: auto; }

    .stage {
      display: grid; grid-template-rows: 56px 1fr;
      min-height: 0; overflow: hidden; position: relative;
    }
    .stage-bar {
      display: flex; align-items: center; gap: 16px;
      padding: 0 16px; background: var(--bg-chrome);
      backdrop-filter: var(--blur-thin);
      border-bottom: 0.5px solid var(--separator);
      position: relative; z-index: 20;
    }
    .crumbs {
      display: flex; align-items: center; gap: 8px;
      font-size: var(--fs-xs); color: var(--label-2);
      font-weight: 500; flex-shrink: 0;
    }
    .crumb-btn {
      background: transparent; border: 0; padding: 4px 6px;
      color: var(--label-2); font-size: var(--fs-xs); font-weight: 500;
      cursor: pointer; border-radius: var(--r-xs);
      transition: background var(--t-fast), color var(--t-fast);
      font-family: inherit;
    }
    .crumb-btn:hover { background: var(--bg-hover); color: var(--accent); }
    .crumb-sep { color: var(--label-4); }
    .crumb.active { color: var(--label); font-weight: 600; padding: 4px 6px; }

    .stage-search {
      flex: 1; max-width: 380px;
      display: flex; align-items: center; gap: 8px;
      padding: 0 12px; background: var(--bg-input);
      border-radius: var(--r-pill); height: 34px;
      transition: box-shadow var(--t-fast);
    }
    .stage-search:focus-within { box-shadow: 0 0 0 2px var(--accent-soft); }
    .stage-search svg { width: 14px; height: 14px; color: var(--label-3); flex-shrink: 0; }
    .stage-search input {
      flex: 1; background: transparent; border: 0; outline: none;
      font-size: var(--fs-xs); color: var(--label); font-family: inherit;
    }
    .stage-search input::placeholder { color: var(--label-3); }
    .search-kbd {
      font-family: var(--sf-mono); font-size: 9px;
      padding: 2px 6px; background: var(--bg-fill-3);
      color: var(--label-3); border-radius: var(--r-xs);
      font-weight: 700;
    }
    .clear-search {
      width: 18px; height: 18px; display: grid; place-items: center;
      background: var(--bg-fill-3); color: var(--label-2);
      border-radius: 50%; font-size: 10px; cursor: pointer;
      border: 0;
    }
    .clear-search:hover { background: var(--bg-fill); color: var(--label); }

    .stage-actions { display: flex; align-items: center; gap: 6px; margin-left: auto; }
    .tb-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 12px; border-radius: var(--r-sm);
      background: var(--bg-fill-2); color: var(--label);
      font-size: var(--fs-xs); font-weight: 600;
      cursor: pointer; border: 0;
      transition: background var(--t-fast), transform var(--t-fast);
    }
    .tb-btn:hover { background: var(--bg-fill-3); }
    .tb-btn:active { transform: scale(0.97); }
    .tb-btn.primary { background: var(--accent); color: var(--accent-contrast); }
    .tb-btn.primary:hover { background: var(--accent-hover); }
    .tb-icon { font-size: 13px; }
    .tb-label { white-space: nowrap; }
    @media (max-width: 1024px) { .tb-label { display: none; } .tb-btn { padding: 7px 10px; } }

    .divider { width: 1px; height: 20px; background: var(--separator); margin: 0 4px; }

    .icon-btn {
      position: relative; width: 34px; height: 34px;
      display: grid; place-items: center;
      border-radius: var(--r-sm); color: var(--label-2);
      cursor: pointer; background: transparent; border: 0;
      transition: background var(--t-fast), color var(--t-fast);
      font-size: 15px;
    }
    .icon-btn:hover { background: var(--bg-hover); color: var(--label); }
    .icon-btn.active { background: var(--bg-fill-2); color: var(--label); }
    .notif-dot {
      position: absolute; top: 4px; right: 4px;
      min-width: 16px; height: 16px; padding: 0 4px;
      background: #ff3b30; color: #fff; border-radius: var(--r-pill);
      font-size: 9px; font-weight: 800;
      display: grid; place-items: center;
      border: 2px solid var(--bg-chrome);
    }

    .user-btn {
      width: 34px; height: 34px; display: grid; place-items: center;
      border-radius: 50%; cursor: pointer;
      background: transparent; border: 0;
      transition: background var(--t-fast);
    }
    .user-btn:hover, .user-btn.active { background: var(--bg-hover); }
    .user-av {
      width: 30px; height: 30px;
      display: grid; place-items: center;
      background: var(--accent); color: var(--accent-contrast);
      border-radius: 50%; font-size: 11px; font-weight: 800;
      letter-spacing: 0.02em;
    }

    .window-controls {
      display: flex; gap: 2px;
      padding-left: 4px; border-left: 0.5px solid var(--separator); margin-left: 4px;
    }
    .wc {
      width: 28px; height: 28px; display: grid; place-items: center;
      border-radius: var(--r-xs); color: var(--label-2);
      cursor: pointer; background: transparent; border: 0;
      transition: background var(--t-fast), color var(--t-fast);
    }
    .wc svg { width: 12px; height: 12px; }
    .wc:hover { background: var(--bg-hover); color: var(--label); }
    .wc.close:hover { background: #ff3b30; color: #fff; }

    .dropdown {
      position: absolute; top: 60px;
      background: var(--bg-elevated);
      backdrop-filter: var(--blur-thick);
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
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 14px;
      border-bottom: 0.5px solid var(--separator);
      font-size: var(--fs-xs);
      position: sticky; top: 0;
      background: var(--bg-elevated);
      backdrop-filter: var(--blur-thick); z-index: 1;
    }
    .notif-drop header b { font-size: var(--fs-xs); font-weight: 700; }
    .link-btn {
      color: var(--accent); font-size: 10px; font-weight: 600;
      cursor: pointer; background: transparent; border: 0;
    }
    .link-btn:hover:not(:disabled) { text-decoration: underline; }
    .link-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .notif-row {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 14px; border-bottom: 0.5px solid var(--separator);
      transition: background var(--t-fast);
      width: 100%; text-align: left; cursor: pointer;
      background: transparent; border-left: 0; border-right: 0; border-top: 0;
    }
    .notif-row:last-child { border-bottom: 0; }
    .notif-row:hover { background: var(--bg-hover); }
    .nr-icon { font-size: 16px; }
    .nr-body { flex: 1; min-width: 0; }
    .nr-body b { font-size: var(--fs-2xs); font-weight: 700; display: block; }
    .nr-body small { font-size: 10px; color: var(--label-2); line-height: 1.35;
                    display: block; margin-top: 2px; }
    .nr-time { font-size: 9px; color: var(--label-3); font-family: var(--sf-mono); }

    .user-drop { right: 118px; width: 280px; padding: 6px; }
    .user-head {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 10px 14px;
      border-bottom: 0.5px solid var(--separator);
      margin-bottom: 6px;
    }
    .user-av-lg {
      width: 42px; height: 42px; display: grid; place-items: center;
      background: var(--accent); color: var(--accent-contrast);
      border-radius: 50%; font-size: 15px; font-weight: 800;
    }
    .user-head b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .user-head small { font-size: 10px; color: var(--label-2); }
    .menu-item {
      width: 100%; display: grid;
      grid-template-columns: 32px 1fr;
      gap: 10px; align-items: center;
      padding: 9px 10px;
      border-radius: var(--r-xs);
      color: var(--label); text-align: left; cursor: pointer;
      background: transparent; border: 0;
      transition: background var(--t-fast);
    }
    .menu-item:hover { background: var(--bg-hover); }
    .menu-item.danger { color: #ff3b30; }
    .mi-icon {
      width: 32px; height: 32px;
      display: grid; place-items: center;
      background: var(--bg-fill-2); border-radius: var(--r-sm);
      font-size: 15px;
    }
    .menu-item.danger .mi-icon { background: rgba(255, 59, 48, 0.12); }
    .mi-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .mi-text b { font-size: var(--fs-xs); font-weight: 600; }
    .mi-text small { font-size: 10px; color: var(--label-2); }
    .menu-sep { height: 0.5px; background: var(--separator); margin: 6px 0; }
    .empty-drop {
      padding: 40px 20px; text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
    }
    .empty-drop span { font-size: 32px; opacity: 0.4; }
    .empty-drop b { font-size: var(--fs-sm); font-weight: 700; }
    .empty-drop small { font-size: var(--fs-xs); color: var(--label-2); }

    .stage-body { overflow-y: auto; padding: 24px; background: var(--bg-root); }

    @media (max-width: 820px) {
      .shell { grid-template-columns: 60px 1fr; }
      .shell.collapsed { grid-template-columns: 60px 1fr; }
      .brand-text, .n-label, .nav-foot, .nav-group-label, .n-badge { display: none; }
      .nav-item { padding: 9px; justify-content: center; }
      .nav-brand { flex-direction: column; padding: 14px 8px; gap: 6px; }
      .stage-search { max-width: none; }
      .search-kbd { display: none; }
    }

    /* ─────────── MOBILE HORIZONTAL SCROLL ─────────── */
@media (max-width: 720px) {

  .shell {
    grid-template-columns: 1fr !important;
    min-width: 0;
  }

  /* الـ nav يبقى horizontal pills فوق */
  .nav {
    position: sticky;
    top: 0;
    z-index: 15;
    height: auto !important;
    flex-direction: row !important;
    align-items: center;
    border-right: 0 !important;
    border-bottom: 0.5px solid var(--separator);
    padding: 8px 4px;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    backdrop-filter: blur(40px) saturate(180%);
    background: var(--bg-chrome);
  }

  .nav::-webkit-scrollbar { display: none; }

  .nav-brand {
    flex-shrink: 0;
    min-height: 40px !important;
    padding: 6px 10px !important;
    border-bottom: 0 !important;
    border-right: 0.5px solid var(--separator);
    flex-direction: row !important;
    gap: 8px !important;
  }

  .brand-mark {
    width: 28px !important;
    height: 28px !important;
    font-size: 14px !important;
  }

  .collapse-btn { display: none !important; }

  .nav-items {
    flex-direction: row !important;
    flex: none !important;
    padding: 0 6px !important;
    gap: 4px !important;
    overflow: visible !important;
  }

  .nav-group-label { display: none !important; }

  .nav-item {
    flex-shrink: 0 !important;
    padding: 6px 12px !important;
    border-radius: 999px !important;
    font-size: 11px !important;
    gap: 6px !important;
    background: var(--bg-fill-2) !important;
    border: 1px solid transparent !important;
  }

  .nav-item.active {
    background: var(--accent) !important;
    color: var(--accent-contrast) !important;
    border-color: var(--accent) !important;
  }

  .nav-item.active::before { display: none; }
  .nav-item .n-badge {
    font-size: 9px !important;
    padding: 0 6px !important;
  }

  .nav-foot { display: none !important; }

  /* الـ stage */
  .stage {
    grid-template-rows: 52px minmax(0, 1fr) !important;
    min-width: 0;
  }

  .stage-bar {
    padding: 0 12px !important;
    gap: 8px !important;
  }

  .crumbs {
    font-size: 11px !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 120px;
  }

  .stage-search {
    max-width: none !important;
    height: 30px !important;
    min-width: 100px;
  }

  .stage-search input { font-size: 11px !important; }
  .search-kbd { display: none !important; }

  .tb-btn { padding: 5px 8px !important; }
  .tb-label { display: none !important; }

  .divider { margin: 0 2px !important; }

  .icon-btn,
  .user-btn {
    width: 30px !important;
    height: 30px !important;
    font-size: 13px !important;
  }

  .user-av {
    width: 26px !important;
    height: 26px !important;
    font-size: 10px !important;
  }

  .wc {
    width: 24px !important;
    height: 24px !important;
  }

  .wc svg { width: 10px !important; height: 10px !important; }

  /* الـ stage body — horizontal scroll */
  .stage-body {
    overflow-x: auto !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
    padding: 16px !important;
  }

  .stage-body > * {
    min-width: 640px;
  }

  /* الـ dropdowns */
  .notif-drop {
    right: 8px !important;
    left: 8px !important;
    width: auto !important;
    max-width: none !important;
  }

  .user-drop {
    right: 8px !important;
    width: 260px !important;
  }
}

/* ─────────── VERY SMALL PHONES ─────────── */
@media (max-width: 380px) {
  .stage-body > * {
    min-width: 560px;
  }

  .crumbs {
    max-width: 80px;
  }
}

@media (max-width: 720px) {
  .shell {
    grid-template-columns: 1fr !important;
    width: 100% !important;
  }

  .stage-body {
    overflow-x: hidden !important;
    padding: 16px !important;
  }

  .stage-body > * {
    min-width: 0 !important;
    width: 100% !important;
  }

  /* Nav — horizontal pills */
  .nav {
    flex-direction: row !important;
    height: auto !important;
    border-right: 0 !important;
    border-bottom: 0.5px solid var(--separator);
    padding: 8px 4px !important;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .nav::-webkit-scrollbar { display: none; }
  .collapse-btn { display: none !important; }
  .nav-group-label { display: none !important; }
  .nav-foot { display: none !important; }
  .nav-items {
    flex-direction: row !important;
    flex: none !important;
    gap: 4px !important;
    padding: 0 6px !important;
  }
  .nav-item {
    flex-shrink: 0 !important;
    padding: 6px 12px !important;
    border-radius: 999px !important;
    font-size: 11px !important;
    background: var(--bg-fill-2) !important;
  }
  .nav-item.active {
    background: var(--accent) !important;
    color: var(--accent-contrast) !important;
  }
  .nav-item.active::before { display: none; }
}
@media (max-width: 720px) {
  .shell {
    grid-template-columns: 1fr !important;
    width: 100% !important;
  }

  .stage-body {
    overflow-x: hidden !important;
    padding: 16px !important;
  }

  .stage-body > * {
    min-width: 0 !important;
    width: 100% !important;
  }

  /* Nav — horizontal pills */
  .nav {
    flex-direction: row !important;
    height: auto !important;
    border-right: 0 !important;
    border-bottom: 0.5px solid var(--separator);
    padding: 8px 4px !important;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .nav::-webkit-scrollbar { display: none; }
  .collapse-btn { display: none !important; }
  .nav-group-label { display: none !important; }
  .nav-foot { display: none !important; }
  .nav-items {
    flex-direction: row !important;
    flex: none !important;
    gap: 4px !important;
    padding: 0 6px !important;
  }
  .nav-item {
    flex-shrink: 0 !important;
    padding: 6px 12px !important;
    border-radius: 999px !important;
    font-size: 11px !important;
    background: var(--bg-fill-2) !important;
  }
  .nav-item.active {
    background: var(--accent) !important;
    color: var(--accent-contrast) !important;
  }
  .nav-item.active::before { display: none; }
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
  readonly theme = inject(ThemeService);
  private menu = inject(ContextMenuService);
  private toast = inject(ToastService);
  private tabs = inject(TabsService);

  readonly searchQuery = signal('');
  readonly collapsed = signal(false);
  readonly notifOpen = signal(false);
  readonly userMenuOpen = signal(false);

  readonly defaultToolbar = computed<ToolbarAction[]>(() => [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      action: () => this.goHome(),
    },
    {
      id: 'refresh',
      label: 'Refresh',
      icon: '⟳',
      action: () => this.refresh(),
    },
    {
      id: 'help',
      label: 'Help',
      icon: '?',
      action: () => this.showHelp(),
    },
  ]);

  readonly allToolbarActions = computed(() => {
    const custom = this.toolbarActions();
    const defaults = this.defaultToolbar();
    const seen = new Set<string>();
    const result: ToolbarAction[] = [];

    for (const a of [...custom, ...defaults]) {
      let id = a.id;
      let counter = 1;
      while (seen.has(id)) {
        id = `${a.id}-${counter++}`;
      }
      seen.add(id);
      result.push(id === a.id ? a : { ...a, id });
    }

    return result;
  });

  toggleCollapsed(): void {
    this.collapsed.update(v => !v);
    this.toast.info(this.collapsed() ? 'Sidebar collapsed' : 'Sidebar expanded', '⌘B to toggle', '⇤');
  }

  goHome(): void {
    this.tabs.setActive('welcome');
    this.closeDropdowns();
    this.toast.success('Welcome home', 'Opened portfolio landing page', '🏠');
  }

  refresh(): void {
    this.toast.info('Refreshing…', 'Data reloaded from source', '⟳');
  }

  showHelp(): void {
    this.menu.open(window.innerWidth / 2 - 120, 100, [
      { id: 'k1', label: '⌘B — Toggle sidebar', icon: '⌨', action: () => this.toggleCollapsed() },
      { id: 'k2', label: '⌘F — Focus search', icon: '⌨', action: () => this.focusSearch() },
      {
        id: 'k3', label: '⌘K — Command palette', icon: '⌨',
        action: () => this.toast.info('Command palette', 'Press ⌘K from the app')
      },
      {
        id: 'k4', label: 'Esc — Close overlays', icon: '⌨',
        action: () => this.closeDropdowns()
      },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'docs', label: 'View full docs', icon: '📖',
        action: () => this.toast.info('Docs', 'Full documentation coming soon')
      },
    ]);
  }

  focusSearch(): void {
    const input = document.querySelector('.stage-search input') as HTMLInputElement;
    input?.focus();
  }

  pingLive(): void {
    this.toast.success('Live data refreshed', 'Connected · real-time', '📡');
  }

  toggleNotifs(): void {
    this.notifOpen.update(v => !v);
    if (this.notifOpen()) this.userMenuOpen.set(false);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
    if (this.userMenuOpen()) this.notifOpen.set(false);
  }

  minimize(): void {
    this.layout.minimizePreview();
    this.toast.info('Minimized', 'Click to restore', '⊟');
  }

  maximize(): void {
    this.layout.maximizePreview();
    const state = this.layout.previewState();
    this.toast.success(state === 'maximized' ? 'Maximized' : 'Restored',
      state === 'maximized' ? 'Fullscreen mode' : 'Normal size', '⛶');
  }

  onNavClick(item: PreviewNavItem): void {
    if (item.action) {
      item.action();
    } else {
      this.activeChange.emit(item.id);
    }
    this.closeDropdowns();
  }

  onSearch(q: string): void {
    this.searchQuery.set(q);
    this.searchChange.emit(q);
  }

  onClose(): void {
    this.closeRequest.emit();
    this.layout.closePreview();
    this.toast.info('Preview closed', 'Reopen from sidebar');
  }

  openNotif(n: PreviewNotification): void {
    this.notifOpen.set(false);
    if (n.action) {
      n.action();
    } else {
      this.notifOpenRequest.emit(n);
    }
  }

  clearNotifs(): void {
    if (!this.notifications().length) return;
    this.toast.success('Notifications cleared', 'All marked as read', '✓');
    this.notifOpen.set(false);
  }

  userAction(kind: string): void {
    this.userMenuOpen.set(false);
    switch (kind) {
      case 'profile':
        this.goHome();
        break;
      case 'cv':
        this.tabs.open({ id: 'cv', title: 'CV.pdf', icon: '📄', type: 'cv', closable: true });
        this.toast.success('CV opened', 'Resume & experience', '📄');
        break;
      case 'themes':
        this.layout.showSidebar('themes');
        this.toast.info('Themes & Appearance', 'Pick your color scheme', '🎨');
        break;
      case 'contact':
        this.layout.showSidebar('contact');
        this.toast.info('Contact', 'Email, phone, LinkedIn', '✉️');
        break;
      case 'terminal':
        this.layout.toggleTerminal();
        this.toast.info('Terminal toggled', '⌘` to toggle', '⌨️');
        break;
      case 'themes-cycle':
        this.theme.cycle();
        this.toast.success('Theme changed', this.theme.active().label, '🎨');
        break;
      case 'signout':
        this.toast.warning('Signed out', 'Session cleared', '🚪');
        break;
    }
  }

  closeDropdowns(): void {
    this.notifOpen.set(false);
    this.userMenuOpen.set(false);
  }

  onNavContext(ev: MouseEvent, item: PreviewNavItem): void {
    ev.preventDefault();
    ev.stopPropagation();
    const items = [
      { id: 'open', label: 'Open', icon: '📂', action: () => this.onNavClick(item) },
      {
        id: 'open-new', label: 'Open in new tab', icon: '➕',
        action: () => this.toast.info(`Opened "${item.label}" in new tab`)
      },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'pin', label: 'Pin to sidebar', icon: '📌',
        action: () => this.toast.success(`Pinned "${item.label}"`)
      },
      {
        id: 'rename', label: 'Rename…', icon: '✎',
        action: () => this.toast.info(`Renaming "${item.label}"`)
      },
      {
        id: 'duplicate', label: 'Duplicate', icon: '⧉',
        action: () => this.toast.success(`Duplicated "${item.label}"`)
      },
      { id: 'sep-2', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'collapse', label: this.collapsed() ? 'Expand sidebar' : 'Collapse sidebar',
        icon: '⇤', shortcut: '⌘B', action: () => this.toggleCollapsed()
      },
      { id: 'sep-3', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'export', label: 'Export as JSON', icon: '📤',
        action: () => this.toast.success(`Exported "${item.label}"`)
      },
      {
        id: 'delete', label: 'Remove', icon: '🗑', danger: true,
        action: () => this.toast.warning(`Removed "${item.label}"`)
      },
    ];
    this.menu.open(ev.clientX, ev.clientY, items, item.id);
  }

  onShellContext(ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      {
        id: 'home', label: 'Go home', icon: '🏠',
        action: () => this.goHome()
      },
      {
        id: 'collapse', label: this.collapsed() ? 'Expand sidebar' : 'Collapse sidebar',
        icon: '⇤', shortcut: '⌘B', action: () => this.toggleCollapsed()
      },
      {
        id: 'search', label: 'Focus search', icon: '🔍', shortcut: '⌘F',
        action: () => this.focusSearch()
      },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'reload', label: 'Reload preview', icon: '⟳', shortcut: '⌘R',
        action: () => { window.location.reload(); }
      },
      { id: 'max', label: 'Maximize', icon: '⛶', action: () => this.maximize() },
      { id: 'min', label: 'Minimize', icon: '⊟', action: () => this.minimize() },
      { id: 'sep-2', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'theme', label: 'Cycle theme', icon: '🎨',
        action: () => { this.theme.cycle(); this.toast.success('Theme: ' + this.theme.active().label); }
      },
      {
        id: 'terminal', label: 'Toggle terminal', icon: '⌨', shortcut: '⌘`',
        action: () => this.layout.toggleTerminal()
      },
      { id: 'sep-3', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'inspect', label: 'Inspect element', icon: '🔍',
        action: () => this.toast.info('DevTools inspection mode')
      },
      {
        id: 'copy-link', label: 'Copy link', icon: '🔗',
        action: () => {
          navigator.clipboard?.writeText(window.location.href);
          this.toast.success('Link copied');
        }
      },
      {
        id: 'print', label: 'Print view', icon: '🖨', shortcut: '⌘P',
        action: () => window.print()
      },
      { id: 'sep-4', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'close', label: 'Close preview', icon: '✕', danger: true,
        action: () => this.onClose()
      },
    ]);
  }

  runToolbar(a: ToolbarAction): void {
    a.action();
  }

  @HostListener('document:keydown', ['$event'])
  onKey(ev: KeyboardEvent): void {
    const meta = ev.ctrlKey || ev.metaKey;

    if (meta && ev.key.toLowerCase() === 'b') {
      ev.preventDefault();
      this.toggleCollapsed();
      return;
    }
    if (meta && ev.key.toLowerCase() === 'f' && this.searchPlaceholder()) {
      ev.preventDefault();
      this.focusSearch();
      return;
    }
    if (ev.key === 'Escape') {
      if (this.notifOpen() || this.userMenuOpen()) {
        this.closeDropdowns();
        return;
      }
    }
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