import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { TabsService } from '../../../core/services/tabs.service';
import { LayoutService } from '../../../core/services/layout.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-title-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-ctx]': '"titlebar"' },
  template: `
    <div class="tb">
      <div class="tb-left">
        <div class="dots">
          <span class="r"></span><span class="y"></span><span class="g"></span>
        </div>
        <div class="menu">
          <span (click)="menuAction('File')">File</span>
          <span (click)="menuAction('Edit')">Edit</span>
          <span (click)="menuAction('View')">View</span>
          <span (click)="menuAction('Go')">Go</span>
          <span (click)="menuAction('Run')">Run</span>
          <span (click)="menuAction('Help')">Help</span>
        </div>
      </div>

      <div class="tb-center">
        <b>ibrahim-shafiq-portfolio</b> — Visual Studio Code
      </div>

      <div class="tb-right">
        <button class="theme-pill" (click)="theme.cycle()" [title]="'Theme: ' + theme.active().label">
          <span class="dot" [style.background]="theme.active().preview"></span>
          <span>{{ theme.active().label }}</span>
        </button>

        <button class="user-trigger"
                (click)="userOpen.set(!userOpen())"
                [class.active]="userOpen()"
                [attr.data-ctx]="'activity'"
                [attr.data-ctx-id]="'profile'"
                [attr.data-ctx-label]="'Profile'">
          <span class="user-av">IS</span>
        </button>
      </div>

      @if (userOpen()) {
        <div class="user-backdrop" (click)="userOpen.set(false)"></div>
        <div class="user-menu">
          <header class="um-head">
            <span class="um-av">IS</span>
            <div>
              <b>Ibrahim Shafiq</b>
              <small>ibrahim.shafiq440&#64;gmail.com</small>
            </div>
          </header>

          <div class="um-body">
            <button class="um-item" (click)="goProfile()">
              <span class="um-icon">👤</span>
              <div class="um-text">
                <b>Profile</b>
                <small>Open your landing page</small>
              </div>
              <span class="um-arrow">→</span>
            </button>

            <button class="um-item" (click)="goPreferences()">
              <span class="um-icon">⚙️</span>
              <div class="um-text">
                <b>Preferences</b>
                <small>Appearance & behavior</small>
              </div>
              <span class="um-arrow">→</span>
            </button>

            <button class="um-item" (click)="goThemes()">
              <span class="um-icon">🎨</span>
              <div class="um-text">
                <b>Themes</b>
                <small>Color scheme & accent</small>
              </div>
              <span class="um-arrow">→</span>
            </button>

            <button class="um-item" (click)="goCv()">
              <span class="um-icon">📄</span>
              <div class="um-text">
                <b>View CV</b>
                <small>Resume & experience</small>
              </div>
              <span class="um-arrow">→</span>
            </button>

            <button class="um-item" (click)="goContact()">
              <span class="um-icon">✉️</span>
              <div class="um-text">
                <b>Contact</b>
                <small>Email, phone, LinkedIn</small>
              </div>
              <span class="um-arrow">→</span>
            </button>
          </div>

          <footer class="um-foot">
            <button class="um-item danger" (click)="signOut()">
              <span class="um-icon">🚪</span>
              <div class="um-text">
                <b>Sign out</b>
                <small>Clear session</small>
              </div>
            </button>
          </footer>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; position: relative; }
    .tb {
      height: var(--h-titlebar);
      background: var(--bg-titlebar);
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      padding: 0 12px;
      border-bottom: 1px solid var(--border-soft);
      user-select: none;
      font-size: 12px;
      position: relative;
      z-index: 200;
      @media(max-width:767px) { display: flex;flex-wrap:wrap; }
    }
    .tb-left { display: flex; align-items: center; gap: 12px; }
    .dots { display: flex; gap: 6px; }
    .dots span { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
    .dots .r { background: #ff5f57; }
    .dots .y { background: #febc2e; }
    .dots .g { background: #28c840; }
    .menu { display: flex; gap: 2px; color: var(--text-muted); }
    .menu span { padding: 3px 8px; border-radius: 3px; cursor: pointer; }
    .menu span:hover { background: var(--bg-hover); color: var(--text); }
    .tb-center {
      text-align: center; color: var(--text-muted);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      font-size: 12px;
    }
    .tb-center b { color: var(--text); font-weight: 600; }
    .tb-right { display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
    .theme-pill {
      background: var(--bg-hover);
      border: 1px solid var(--border-soft);
      color: var(--text);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all .15s;
    }
    .theme-pill:hover { border-color: var(--accent); }
    .theme-pill .dot {
      width: 10px; height: 10px; border-radius: 50%;
      border: 1px solid var(--border-soft);
    }
    .user-trigger {
      width: 34px; height: 34px;
      display: grid; place-items: center;
      border-radius: 50%;
      transition: background var(--t-fast);
    }
    .user-trigger:hover, .user-trigger.active { background: var(--bg-hover); }
    .user-av {
      width: 28px; height: 28px;
      display: grid; place-items: center;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: 50%;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.02em;
    }
    .user-backdrop {
      position: fixed;
      inset: 0;
      z-index: 250;
    }
    .user-menu {
      position: absolute;
      top: calc(var(--h-titlebar) - 4px);
      right: 12px;
      width: 300px;
      background: var(--bg-elevated);
      backdrop-filter: var(--blur-thick);
      -webkit-backdrop-filter: var(--blur-thick);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      box-shadow: var(--shadow-xl);
      z-index: 260;
      overflow: hidden;
      animation: umIn 220ms var(--ease-spring);
      transform-origin: top right;
    }
    @keyframes umIn {
      from { opacity: 0; transform: scale(0.95) translateY(-6px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .um-head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: var(--bg-fill-2);
      border-bottom: 0.5px solid var(--separator);
    }
    .um-av {
      width: 44px; height: 44px;
      display: grid; place-items: center;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: 50%;
      font-size: 15px;
      font-weight: 800;
      flex-shrink: 0;
    }
    .um-head b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .um-head small { font-size: var(--fs-2xs); color: var(--label-2);
                     overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                     display: block; }
    .um-body { padding: 6px; }
    .um-item {
      width: 100%;
      display: grid;
      grid-template-columns: 32px 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 10px 12px;
      border-radius: var(--r-xs);
      color: var(--label);
      text-align: left;
      transition: background var(--t-fast);
    }
    .um-item:hover { background: var(--bg-hover); }
    .um-item.danger { color: #ff3b30; }
    .um-item.danger:hover { background: rgba(255, 59, 48, 0.1); }
    .um-icon {
      width: 32px; height: 32px;
      display: grid; place-items: center;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      font-size: 15px;
    }
    .um-item.danger .um-icon { background: rgba(255, 59, 48, 0.12); }
    .um-text b { font-size: var(--fs-xs); font-weight: 600; display: block; }
    .um-text small { font-size: 10px; color: var(--label-2); display: block; margin-top: 1px; }
    .um-arrow {
      color: var(--label-3);
      font-weight: 700;
      transition: transform var(--t-fast);
    }
    .um-item:hover .um-arrow { transform: translateX(3px); color: var(--accent); }
    .um-foot { padding: 6px; border-top: 0.5px solid var(--separator); }
  `],
})
export class TitleBarComponent {
  readonly theme = inject(ThemeService);
  private tabs = inject(TabsService);
  private layout = inject(LayoutService);
  private toast = inject(ToastService);

  readonly userOpen = signal(false);

  menuAction(name: string): void {
    this.toast.info(`${name} menu`, 'Feature coming soon');
  }

  goProfile(): void {
    this.userOpen.set(false);
    this.tabs.setActive('welcome');
    if (this.layout.viewport() === 'mobile') {
      this.layout.mobileSidebarOpen.set(false);
    }
    this.toast.success('Welcome home', 'Opened your landing page');
  }

  goPreferences(): void {
    this.userOpen.set(false);
    this.layout.showSidebar('themes');
    this.toast.info('Preferences', 'Appearance settings opened');
  }

  goThemes(): void {
    this.userOpen.set(false);
    this.layout.showSidebar('themes');
    this.toast.info('Themes', 'Pick your color scheme');
  }

  goCv(): void {
    this.userOpen.set(false);
    this.tabs.open({ id: 'cv', title: 'CV.pdf', icon: '📄', type: 'cv', closable: true });
    this.toast.success('CV opened');
  }

  goContact(): void {
    this.userOpen.set(false);
    this.layout.showSidebar('contact');
    this.toast.info('Contact', 'All channels opened');
  }

  signOut(): void {
    this.userOpen.set(false);
    this.toast.warning('Signed out', 'Session cleared');
  }
}