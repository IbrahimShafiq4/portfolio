import {
  ChangeDetectionStrategy, Component, HostListener,
  computed, inject, signal,
} from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { TabsService } from '../../../core/services/tabs.service';
import { LayoutService } from '../../../core/services/layout.service';
import { ToastService } from '../../../core/services/toast.service';
import { ViewModeService } from '../../../core/services/view-mode.service';
import { CommandPaletteService } from '../../../core/services/command-palette.service';
import { ContextMenuService } from '../../../core/services/context-menu.service';
import { PdfService } from '../../../core/services/pdf.service';
import { ProjectsService } from '../../../core/services/projects.service';
import { SidebarPanel } from '../../../core/models/tab.model';

type MenuId = 'file' | 'edit' | 'view' | 'go' | 'run' | 'help';

interface MenuEntry {
  id: string;
  label?: string;
  icon?: string;
  shortcut?: string;
  separatorBefore?: boolean;
  disabled?: boolean;
  checked?: boolean;
  danger?: boolean;
  action?: () => void;
}

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

        @if(isRecruiterView()) {
                  <nav class="menu" (click)="$event.stopPropagation()">
          @for (m of menuIds; track m.id) {
            <div class="menu-wrap">
              <button
                class="menu-btn"
                [class.active]="activeMenu() === m.id"
                (click)="openMenu(m.id, $event)"
                (mouseenter)="hoverMenu(m.id)"
              >
                {{ m.label }}
              </button>

              @if (activeMenu() === m.id) {
                <div class="menu-dropdown" (click)="$event.stopPropagation()">
                  @for (item of currentMenuItems(); track item.id) {
                    @if (item.separatorBefore) {
                      <div class="menu-sep"></div>
                    }
                    <button
                      class="menu-item"
                      [class.checked]="item.checked"
                      [class.danger]="item.danger"
                      [disabled]="item.disabled"
                      (click)="runItem(item)"
                    >
                      <span class="mi-icon">{{ item.icon }}</span>
                      <span class="mi-label">{{ item.label }}</span>
                      @if (item.checked) { <span class="mi-check">✓</span> }
                      @if (item.shortcut) {
                        <span class="mi-shortcut">{{ item.shortcut }}</span>
                      }
                    </button>
                  }
                </div>
              }
            </div>
          }
        </nav>
        }
      </div>

      <div class="tb-center">
        <b>ibrahim-shafiq-portfolio</b>
        <span class="tb-center-sep">—</span>
        <span class="tb-center-mode">
          {{ viewMode.mode() === 'developer' ? 'Developer View' : 'Recruiter View' }}
        </span>
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
              <div class="um-text"><b>Profile</b><small>Open landing page</small></div>
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

            <button class="um-item" (click)="downloadCv()">
              <span class="um-icon">📄</span>
              <div class="um-text"><b>Download CV</b><small>PDF resume</small></div>
              <span class="um-arrow">→</span>
            </button>

            <button class="um-item" (click)="goThemes()">
              <span class="um-icon">🎨</span>
              <div class="um-text"><b>Themes</b><small>Color scheme</small></div>
              <span class="um-arrow">→</span>
            </button>

            <button class="um-item" (click)="goContact()">
              <span class="um-icon">✉️</span>
              <div class="um-text"><b>Contact</b><small>Email, phone, LinkedIn</small></div>
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

      @media(max-width: 767px) {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
      }
    }

    .tb-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      overflow: visible;
      width: fit-content;
    }

    .dots { display: flex; gap: 6px; flex-shrink: 0; }
    .dots span { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
    .dots .r { background: #ff5f57; }
    .dots .y { background: #febc2e; }
    .dots .g { background: #28c840; }

    /* ═══════════ MENU ═══════════ */
    .menu {
      display: flex;
      gap: 0;
      position: relative;
      overflow: visible;
    }
    .menu-wrap { position: relative; }

    .menu-btn {
      padding: 4px 10px;
      border-radius: 3px;
      cursor: pointer;
      white-space: nowrap;
      font-size: 12px;
      color: var(--text-muted);
      transition: background var(--t-fast), color var(--t-fast);
      background: transparent;
      border: 0;
      font-family: inherit;
    }
    .menu-btn:hover { background: var(--bg-hover); color: var(--text); }
    .menu-btn.active { background: var(--accent); color: var(--accent-contrast); }

    .menu-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      min-width: 260px;
      padding: 6px;
      background: var(--bg-elevated);
      backdrop-filter: var(--blur-thick);
      -webkit-backdrop-filter: var(--blur-thick);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      box-shadow: var(--shadow-xl);
      z-index: 300;
      animation: dropIn 160ms var(--ease-spring);
      transform-origin: top left;
    }
    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-6px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .menu-sep {
      height: 0.5px;
      background: var(--separator);
      margin: 5px 4px;
    }

    .menu-item {
      width: 100%;
      display: grid;
      grid-template-columns: 22px 1fr auto auto;
      gap: 8px;
      align-items: center;
      padding: 7px 10px;
      border-radius: var(--r-xs);
      color: var(--label);
      font-size: 12px;
      text-align: left;
      background: transparent;
      border: 0;
      cursor: pointer;
      font-family: inherit;
      transition: background var(--t-fast), color var(--t-fast);
    }
    .menu-item:hover:not(:disabled) {
      background: var(--accent);
      color: var(--accent-contrast);
    }
    .menu-item:hover:not(:disabled) .mi-shortcut,
    .menu-item:hover:not(:disabled) .mi-icon {
      color: rgba(255, 255, 255, 0.85);
    }
    .menu-item:disabled { opacity: 0.35; cursor: not-allowed; }
    .menu-item.danger { color: #ff3b30; }
    .menu-item.danger:hover:not(:disabled) {
      background: rgba(255, 59, 48, 0.15);
      color: #ff3b30;
    }

    .mi-icon {
      font-size: 13px;
      text-align: center;
      color: var(--label-2);
    }
    .mi-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
    }
    .mi-check {
      color: var(--accent);
      font-weight: 800;
      font-size: 11px;
    }
    .menu-item:hover .mi-check { color: var(--accent-contrast); }
    .mi-shortcut {
      font-family: var(--sf-mono);
      font-size: 10px;
      color: var(--label-3);
      font-weight: 600;
      padding-left: 12px;
    }

    /* ═══════════ CENTER ═══════════ */
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

    /* ═══════════ RIGHT ═══════════ */
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
      width: 26px; height: 22px;
      display: grid; place-items: center;
      font-size: 12px;
      color: var(--label-3);
      transition: color var(--t-base);
    }
    .vs-opt.active { color: var(--accent-contrast); }
    .vs-slider {
      position: absolute;
      top: 2px; left: 2px;
      width: 26px; height: 22px;
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
      width: 10px; height: 10px;
      border-radius: 50%;
      border: 1px solid var(--border-soft);
      flex-shrink: 0;
    }

    .user-trigger {
      width: 34px; height: 34px;
      display: grid; place-items: center;
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
      width: 28px; height: 28px;
      display: grid; place-items: center;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: 50%;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.02em;
    }

    .user-backdrop { position: fixed; inset: 0; z-index: 250; }

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
      width: 32px; height: 32px;
      display: grid; place-items: center;
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
  readonly tabs = inject(TabsService);
  readonly layout = inject(LayoutService);

  private toast = inject(ToastService);
  private palette = inject(CommandPaletteService);
  private ctxMenu = inject(ContextMenuService);
  private pdf = inject(PdfService);
  private projects = inject(ProjectsService);

  readonly userOpen = signal(false);
  readonly activeMenu = signal<MenuId | null>(null);

  readonly menuIds: { id: MenuId; label: string }[] = [
    { id: 'file', label: 'File' },
    { id: 'edit', label: 'Edit' },
    { id: 'view', label: 'View' },
    { id: 'go', label: 'Go' },
    { id: 'run', label: 'Run' },
    { id: 'help', label: 'Help' },
  ];

  /* ─────────────────────────────────────────────
     All menus computed once, keyed by id.
     Reading all signals up front ensures reactivity.
     ───────────────────────────────────────────── */
  private readonly allMenus = computed<Record<MenuId, MenuEntry[]>>(() => {
    // Read every signal we care about → keeps computed reactive
    const tabsList = this.tabs.tabs();
    const activeTab = this.tabs.active();
    const activeThemeLabel = this.theme.active().label;
    const currentPanel: SidebarPanel = this.layout.sidebarPanel();
    const sidebarOpen = this.layout.sidebarOpen();
    const terminalOpen = this.layout.terminalOpen();
    const accentId = this.theme.accent();
    const isDev = this.viewMode.isDeveloper();

    const hasClosableTabs = tabsList.some(t => t.closable);
    const canCloseActive = !!activeTab?.closable;
    const canCycleTabs = tabsList.length > 1;

    return {
      file: [
        {
          id: 'new-welcome', label: 'New Welcome Tab', icon: '🏠',
          action: () => this.newWelcomeTab(),
        },
        {
          id: 'close-tab', label: 'Close Tab', icon: '✕',
          disabled: !canCloseActive,
          action: () => this.closeActiveTab(),
        },
        {
          id: 'close-all', label: 'Close All Tabs', icon: '🗑',
          disabled: !hasClosableTabs,
          action: () => this.closeAllTabs(),
        },
        { id: 's1', separatorBefore: true },
        {
          id: 'open-cv', label: 'Open CV', icon: '📄',
          action: () => this.openCv(),
        },
        {
          id: 'download-cv', label: 'Download CV (PDF)', icon: '⬇',
          action: () => this.downloadCv(),
        },
        { id: 's2', separatorBefore: true },
        {
          id: 'print', label: 'Print Page', icon: '🖨', shortcut: '⌘P',
          action: () => window.print(),
        },
        {
          id: 'fullscreen', label: 'Fullscreen', icon: '⛶', shortcut: 'F11',
          action: () => this.toggleFullscreen(),
        },
        { id: 's3', separatorBefore: true },
        {
          id: 'reset', label: 'Reset Workspace', icon: '⟳', danger: true,
          action: () => this.resetWorkspace(),
        },
      ],

      edit: [
        {
          id: 'palette', label: 'Command Palette…', icon: '⌘', shortcut: '⌘K',
          action: () => this.palette.toggle(),
        },
        { id: 's1', separatorBefore: true },
        {
          id: 'find', label: 'Find in Files…', icon: '🔍', shortcut: '⌘F',
          action: () => this.layout.showSidebar('search'),
        },
        {
          id: 'goto-projects', label: 'Jump to Project…', icon: '🧩',
          action: () => this.palette.toggle(),
        },
        {
          id: 'copy-link', label: 'Copy Page Link', icon: '🔗',
          action: () => this.copyLink(),
        },
        { id: 's2', separatorBefore: true },
        {
          id: 'theme-cycle', label: 'Cycle Theme', icon: '🎨',
          action: () => {
            this.theme.cycle();
            this.toast.success('Theme changed', this.theme.active().label);
          },
        },
        {
          id: 'accent-next', label: `Next Accent (${accentId})`, icon: '🎯',
          action: () => this.cycleAccent(),
        },
        {
          id: 'appearance-reset', label: 'Reset Appearance', icon: '↺',
          action: () => {
            this.theme.setTheme('default-dark');
            this.theme.setAccent('blue');
            this.toast.success('Appearance reset', 'Default theme + blue accent');
          },
        },
        { id: 's3', separatorBefore: true },
        {
          id: 'view-mode',
          label: `Switch to ${isDev ? 'Recruiter' : 'Developer'} View`,
          icon: '🔄',
          shortcut: '⌘⇧V',
          action: () => this.switchView(),
        },
      ],

      view: [
        {
          id: 'toggle-sidebar',
          label: sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar',
          icon: '📁',
          shortcut: '⌘B',
          action: () => this.layout.toggleSidebar(currentPanel),
        },
        {
          id: 'toggle-terminal',
          label: terminalOpen ? 'Hide Terminal' : 'Show Terminal',
          icon: '⌨',
          shortcut: '⌘`',
          action: () => this.layout.toggleTerminal(),
        },
        { id: 's1', separatorBefore: true },
        { id: 'panel-explorer', label: 'Explorer', icon: '📂', checked: currentPanel === 'explorer', action: () => this.layout.showSidebar('explorer') },
        { id: 'panel-search', label: 'Search', icon: '🔍', checked: currentPanel === 'search', action: () => this.layout.showSidebar('search') },
        { id: 'panel-dotnet', label: '.NET', icon: '🟪', checked: currentPanel === 'dotnet', action: () => this.layout.showSidebar('dotnet') },
        { id: 'panel-companies', label: 'Companies', icon: '🏢', checked: currentPanel === 'companies', action: () => this.layout.showSidebar('companies') },
        { id: 'panel-projects', label: 'Projects', icon: '🧩', checked: currentPanel === 'projects', action: () => this.layout.showSidebar('projects') },
        { id: 'panel-skills', label: 'Skills', icon: '⚡', checked: currentPanel === 'skills', action: () => this.layout.showSidebar('skills') },
        { id: 'panel-themes', label: 'Themes', icon: '🎨', checked: currentPanel === 'themes', action: () => this.layout.showSidebar('themes') },
        { id: 'panel-contact', label: 'Contact', icon: '✉', checked: currentPanel === 'contact', action: () => this.layout.showSidebar('contact') },
        { id: 's2', separatorBefore: true },
        {
          id: 'fullscreen', label: 'Toggle Fullscreen', icon: '⛶', shortcut: 'F11',
          action: () => this.toggleFullscreen(),
        },
      ],

      go: [
        {
          id: 'go-home', label: 'Welcome', icon: '🏠',
          action: () => this.tabs.setActive('welcome'),
        },
        {
          id: 'go-cv', label: 'CV', icon: '📄',
          action: () => this.openCv(),
        },
        { id: 's1', separatorBefore: true },
        {
          id: 'next-tab', label: 'Next Tab', icon: '→',
          shortcut: '⌥→',
          disabled: !canCycleTabs,
          action: () => this.cycleTab(1),
        },
        {
          id: 'prev-tab', label: 'Previous Tab', icon: '←',
          shortcut: '⌥←',
          disabled: !canCycleTabs,
          action: () => this.cycleTab(-1),
        },
        { id: 's2', separatorBefore: true },
        {
          id: 'browse-companies', label: 'Browse Companies', icon: '🏢',
          action: () => this.layout.showSidebar('companies'),
        },
        {
          id: 'browse-projects', label: 'Browse All Projects', icon: '🧩',
          action: () => this.layout.showSidebar('projects'),
        },
      ],

      run: [
        {
          id: 'open-terminal', label: 'Open Terminal', icon: '⌨', shortcut: '⌘`',
          action: () => {
            if (!this.layout.terminalOpen()) this.layout.toggleTerminal();
          },
        },
        {
          id: 'run-cmd', label: 'Run Command…', icon: '⌘', shortcut: '⌘K',
          action: () => this.palette.toggle(),
        },
        { id: 's1', separatorBefore: true },
        {
          id: 'term-help', label: 'Terminal Help', icon: '❓',
          action: () => this.openTerminalAndRun('help'),
        },
        {
          id: 'term-whoami', label: 'whoami', icon: '👤',
          action: () => this.openTerminalAndRun('whoami'),
        },
        {
          id: 'term-ls', label: 'ls (list projects)', icon: '📋',
          action: () => this.openTerminalAndRun('ls'),
        },
        {
          id: 'term-ls-co', label: 'ls companies', icon: '🏢',
          action: () => this.openTerminalAndRun('ls companies'),
        },
        { id: 's2', separatorBefore: true },
        {
          id: 'health', label: 'Health Check', icon: '💚',
          action: () => this.healthCheck(),
        },
      ],

      help: [
        {
          id: 'welcome', label: 'Welcome', icon: '🏠',
          action: () => this.tabs.setActive('welcome'),
        },
        {
          id: 'shortcuts', label: 'Keyboard Shortcuts', icon: '⌨',
          action: () => this.showShortcuts(),
        },
        {
          id: 'readme', label: 'Open README', icon: '📘',
          action: () => {
            this.tabs.open({
              id: 'file-readme',
              title: 'README.md',
              icon: '📘',
              type: 'file',
              fileId: 'readme',
              language: 'markdown',
              closable: true,
            });
          },
        },
        { id: 's1', separatorBefore: true },
        {
          id: 'docs', label: 'Documentation', icon: '📖',
          action: () => window.open('https://angular.dev', '_blank'),
        },
        {
          id: 'source', label: 'View Source on GitHub', icon: '🐙',
          action: () => window.open('https://github.com/IbrahimShafiq4', '_blank'),
        },
        { id: 's2', separatorBefore: true },
        {
          id: 'about', label: 'About', icon: 'ℹ',
          action: () => this.showAbout(),
        },
      ],
    };
  });

  readonly currentMenuItems = computed<MenuEntry[]>(() => {
    const id = this.activeMenu();
    if (!id) return [];
    return this.allMenus()[id];
  });

  /* ═══════════ Menu interaction ═══════════ */

  openMenu(id: MenuId, ev: MouseEvent): void {
    ev.stopPropagation();
    if (this.activeMenu() === id) {
      this.activeMenu.set(null);
      return;
    }
    this.activeMenu.set(id);
    this.userOpen.set(false);
  }

  hoverMenu(id: MenuId): void {
    if (this.activeMenu() === null) return;
    if (this.activeMenu() === id) return;
    this.activeMenu.set(id);
  }

  runItem(item: MenuEntry): void {
    if (item.disabled || !item.action) return;
    this.activeMenu.set(null);
    item.action();
  }

  @HostListener('document:click')
  onDocClick(): void {
    if (this.activeMenu() !== null) this.activeMenu.set(null);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.activeMenu.set(null);
  }

  /* ═══════════ Action implementations ═══════════ */

  private newWelcomeTab(): void {
    this.tabs.setActive('welcome');
    this.toast.success('Welcome tab focused', 'Homepage');
  }

  private closeActiveTab(): void {
    const active = this.tabs.active();
    if (!active?.closable) return;
    this.tabs.close(active.id);
    this.toast.info('Tab closed', active.title);
  }

  private closeAllTabs(): void {
    const ids = this.tabs.tabs().filter(t => t.closable).map(t => t.id);
    ids.forEach(id => this.tabs.close(id));
    this.tabs.setActive('welcome');
    this.toast.success(`${ids.length} tab${ids.length === 1 ? '' : 's'} closed`);
  }

  private openCv(): void {
    this.tabs.open({
      id: 'cv',
      title: 'CV.pdf',
      icon: '📄',
      type: 'cv',
      closable: true,
    });
  }

  downloadCv(): void {
    const c = this.projects.contact;
    this.pdf.generate({
      title: c.name,
      subtitle: c.title,
      filename: 'Ibrahim-Shafiq-CV',
      classification: 'public',
      meta: [
        { label: 'Location', value: c.location },
        { label: 'Email', value: c.email },
        { label: 'Phone', value: c.phone },
      ],
      sections: [
        { type: 'text', title: 'Professional Summary', body: c.summary },
        {
          type: 'kpi',
          title: 'Career Highlights',
          items: [
            { label: 'Years Experience', value: '3+' },
            { label: 'Projects Shipped', value: '27' },
            { label: 'API Endpoints Built', value: '850+' },
            { label: 'Users Served', value: '12K+' },
          ],
        },
        {
          type: 'text',
          title: 'Core Skills',
          body: 'Angular · TypeScript · RxJS · NgRx · ASP.NET Core · C# · EF Core · SignalR · SQL Server · Identity/JWT · Clean Architecture · SOLID · RESTful APIs',
        },
      ],
    });
    this.toast.success('CV downloaded', 'Check your downloads folder', '📄');
  }

  private toggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }

  private resetWorkspace(): void {
    this.closeAllTabs();
    this.layout.closeSidebar();
    this.layout.terminalOpen.set(false);
    this.theme.setTheme('default-dark');
    this.theme.setAccent('blue');
    this.toast.success('Workspace reset', 'All tabs closed · theme reset');
  }

  private copyLink(): void {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    this.toast.success('Link copied', url);
  }

  private cycleAccent(): void {
    const accents = this.theme.accents;
    const idx = accents.findIndex(a => a.id === this.theme.accent());
    const next = accents[(idx + 1) % accents.length];
    this.theme.setAccent(next.id);
    this.toast.success(`Accent → ${next.label}`, '', '🎯');
  }

  private cycleTab(dir: 1 | -1): void {
    const list = this.tabs.tabs();
    if (list.length < 2) return;
    const currentIdx = list.findIndex(t => t.id === this.tabs.activeId());
    const nextIdx = (currentIdx + dir + list.length) % list.length;
    this.tabs.setActive(list[nextIdx].id);
  }

  private openTerminalAndRun(cmd: string): void {
    if (!this.layout.terminalOpen()) this.layout.toggleTerminal();
    // Small delay so terminal component mounts
    setTimeout(() => {
      const term = (window as any).__terminalService;
      if (term?.run) {
        term.run(cmd);
      } else {
        this.toast.info('Terminal opened', `Type "${cmd}" in the terminal`);
      }
    }, 120);
  }

  private healthCheck(): void {
    this.toast.success(
      'All systems operational',
      'Theme engine · Tabs · Terminal · Palette · PDF',
      '💚',
    );
  }

  private showShortcuts(): void {
    this.ctxMenu.open(window.innerWidth / 2 - 140, 100, [
      { id: 'k1', label: '⌘K — Command palette', icon: '⌘' },
      { id: 'k2', label: '⌘B — Toggle sidebar', icon: '⌘' },
      { id: 'k3', label: '⌘` — Toggle terminal', icon: '⌘' },
      { id: 'k4', label: '⌘⇧V — Switch view mode', icon: '⌘' },
      { id: 'k5', label: '⌥→ — Next tab', icon: '⌥' },
      { id: 'k6', label: '⌥← — Previous tab', icon: '⌥' },
      { id: 'k7', label: 'F11 — Fullscreen', icon: '⌨' },
      { id: 'k8', label: 'Esc — Close overlays', icon: '⌨' },
    ]);
  }

  private showAbout(): void {
    this.ctxMenu.open(window.innerWidth / 2 - 140, 140, [
      { id: 'a1', label: 'Ibrahim Shafiq — Full-Stack Portfolio', icon: '◆' },
      { id: 'a2', label: 'Angular 22 · Signals · Standalone', icon: '🅰' },
      { id: 'a3', label: 'Theme engine · Command palette · Terminal', icon: '✨' },
      { id: 'sep', label: '', separatorBefore: true },
      { id: 'a4', label: '© 2024 — Built with care', icon: '❤' },
    ]);
  }

  /* ─── User menu ─── */

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

  goThemes(): void {
    this.userOpen.set(false);
    this.layout.showSidebar('themes');
  }

  goContact(): void {
    this.userOpen.set(false);
    this.layout.showSidebar('contact');
  }

  isRecruiterView(): boolean {
    return localStorage.getItem('view-mode') !== 'recruiter' ? true : false; 
  }
}