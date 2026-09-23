import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { TabsService } from '../../../core/services/tabs.service';
import { LayoutService } from '../../../core/services/layout.service';
import { ToastService } from '../../../core/services/toast.service';
import { ViewModeService } from '../../../core/services/view-mode.service';

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
        <b>ibrahim-shafiq-portfolio</b>
        <span class="tb-center-sep">—</span>
        <span class="tb-center-mode">{{ viewMode.mode() === 'developer' ? 'Developer View' : 'Recruiter View' }}</span>
      </div>

      <div class="tb-right">
        <button
          class="view-switch"
          (click)="viewMode.toggle()"
          [title]="'Switch to ' + (viewMode.mode() === 'developer' ? 'Recruiter' : 'Developer') + ' view (⌘⇧V)'"
        >
          <span class="vs-opt" [class.active]="viewMode.isDeveloper()">⌨</span>
          <span class="vs-opt" [class.active]="viewMode.isRecruiter()">👔</span>
          <span class="vs-slider" [class.right]="viewMode.isRecruiter()"></span>
        </button>

        <button class="theme-pill" (click)="theme.cycle()" [title]="'Theme: ' + theme.active().label">
          <span class="dot" [style.background]="theme.active().preview.accent"></span>
          <span class="theme-label">{{ theme.active().label }}</span>
        </button>

        <button
          class="user-trigger"
          (click)="userOpen.set(!userOpen())"
          [class.active]="userOpen()"
        >
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
                <small>Open landing page</small>
              </div>
              <span class="um-arrow">→</span>
            </button>

            <button class="um-item" (click)="switchView()">
              <span class="um-icon">{{ viewMode.isDeveloper() ? '👔' : '⌨' }}</span>
              <div class="um-text">
                <b>Switch to {{ viewMode.isDeveloper() ? 'Recruiter' : 'Developer' }} view</b>
                <small>{{ viewMode.isDeveloper() ? 'Beautiful portfolio for HR' : 'Full technical workspace' }}</small>
              </div>
              <span class="um-arrow">→</span>
            </button>

            <button class="um-item" (click)="goCv()">
              <span class="um-icon">📄</span>
              <div class="um-text">
                <b>Download CV</b>
                <small>PDF resume</small>
              </div>
              <span class="um-arrow">→</span>
            </button>

            <button class="um-item" (click)="goThemes()">
              <span class="um-icon">🎨</span>
              <div class="um-text">
                <b>Themes</b>
                <small>Color scheme</small>
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
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; position: relative; height: 100%; min-height: 0; }

    .tb {
      height: 100%;
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
      min-height: 0;
    }

    .tb-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      overflow: hidden;
    }

    .dots { display: flex; gap: 6px; flex-shrink: 0; }
    .dots span { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
    .dots .r { background: #ff5f57; }
    .dots .y { background: #febc2e; }
    .dots .g { background: #28c840; }

    .menu { display: flex; gap: 2px; color: var(--text-muted); overflow: hidden; }
    .menu span {
      padding: 3px 8px;
      border-radius: 3px;
      cursor: pointer;
      white-space: nowrap;
      transition: background var(--t-fast);
    }
    .menu span:hover { background: var(--bg-hover); color: var(--text); }

    .tb-center {
      text-align: center;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 12px;
      padding: 0 12px;
      min-width: 0;
    }
    .tb-center b { color: var(--text); font-weight: 600; }
    .tb-center-sep { margin: 0 6px; color: var(--label-3); }
    .tb-center-mode { color: var(--accent); font-weight: 600; }

    .tb-right {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .view-switch {
      position: relative;
      display: inline-flex;
      gap: 0;
      padding: 2px;
      background: var(--bg-fill-2);
      border: 1px solid var(--border-soft);
      border-radius: var(--r-pill);
      cursor: pointer;
      transition: all var(--t-fast);
    }
    .view-switch:hover { border-color: var(--accent); }

    .vs-opt {
      position: relative;
      z-index: 2;
      width: 26px;
      height: 22px;
      display: grid;
      place-items: center;
      font-size: 12px;
      color: var(--label-3);
      transition: color var(--t-base);
    }
    .vs-opt.active { color: var(--accent-contrast); }

    .vs-slider {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 26px;
      height: 22px;
      background: var(--accent);
      border-radius: var(--r-pill);
      transition: transform var(--t-base) var(--ease-spring);
      z-index: 1;
    }
    .vs-slider.right { transform: translateX(26px); }

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
      transition: all var(--t-fast);
      cursor: pointer;
      white-space: nowrap;
    }
    .theme-pill:hover { border-color: var(--accent); }
    .theme-pill .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 1px solid var(--border-soft);
      flex-shrink: 0;
    }

    .user-trigger {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      transition: background var(--t-fast);
      background: transparent;
      border: 0;
      cursor: pointer;
      flex-shrink: 0;
    }
    .user-trigger:hover,
    .user-trigger.active { background: var(--bg-hover); }

    .user-av {
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
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
      top: calc(100% - 4px);
      right: 12px;
      width: 300px;
      background: var(--bg-elevated);
      backdrop-filter: var(--blur-thick);
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
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: 50%;
      font-size: 15px;
      font-weight: 800;
      flex-shrink: 0;
    }

    .um-head b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .um-head small { font-size: var(--fs-2xs); color: var(--label-2); }

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
      background: transparent;
      border: 0;
      cursor: pointer;
      transition: background var(--t-fast);
    }
    .um-item:hover { background: var(--bg-hover); }

    .um-icon {
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      font-size: 15px;
    }

    .um-text b { font-size: var(--fs-xs); font-weight: 600; display: block; }
    .um-text small { font-size: 10px; color: var(--label-2); display: block; margin-top: 1px; }
    .um-arrow { color: var(--label-3); font-weight: 700; }

    @media (max-width: 900px) {
      .menu { display: none; }
      .theme-label { display: none; }
    }

    @media (max-width: 640px) {
      .tb-center { font-size: 10px; }
      .tb-center-mode { display: none; }
      .tb-center-sep { display: none; }
      .view-switch { padding: 1px; }
      .vs-opt { width: 22px; height: 20px; font-size: 11px; }
      .vs-slider { width: 22px; height: 20px; top: 1px; left: 1px; }
      .vs-slider.right { transform: translateX(22px); }
    }
  `],
})
export class TitleBarComponent {
  readonly theme = inject(ThemeService);
  readonly viewMode = inject(ViewModeService);
  private tabs = inject(TabsService);
  private layout = inject(LayoutService);
  private toast = inject(ToastService);

  readonly userOpen = signal(false);

  menuAction(name: string): void {
    this.toast.info(`${name} menu`, 'Feature coming soon');
  }

  goProfile(): void {
    this.userOpen.set(false);
    if (this.viewMode.isRecruiter()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.tabs.setActive('welcome');
    }
  }

  switchView(): void {
    this.userOpen.set(false);
    this.viewMode.toggle();
    const mode = this.viewMode.mode();
    this.toast.success(
      mode === 'recruiter' ? 'Recruiter view' : 'Developer view',
      mode === 'recruiter' ? 'Beautiful portfolio for HR' : 'Full technical workspace',
      mode === 'recruiter' ? '👔' : '⌨',
    );
  }

  goCv(): void {
    this.userOpen.set(false);
    this.tabs.open({ id: 'cv', title: 'CV.pdf', icon: '📄', type: 'cv', closable: true });
  }

  goThemes(): void {
    this.userOpen.set(false);
    this.layout.showSidebar('themes');
  }

  goContact(): void {
    this.userOpen.set(false);
    this.layout.showSidebar('contact');
  }
}