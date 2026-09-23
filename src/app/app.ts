import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { LayoutService } from './core/services/layout.service';
import { CommandPaletteService } from './core/services/command-palette.service';
import { TabsService } from './core/services/tabs.service';
import { ThemeService } from './core/services/theme.service';
import { ProjectsService } from './core/services/projects.service';
import { ViewModeService } from './core/services/view-mode.service';
import { EditorPanelComponent } from './features/editor/editor-panel/editor-panel';
import { EditorTabsComponent } from './features/editor/editor-tabs/editor-tabs';
import { RecruiterViewComponent } from './features/recruiter-view/recruiter-view';
import { ActivityBarComponent } from './features/shell/activity-bar/activity-bar';
import { ContextMenuComponent } from './features/shell/context-menu/context-menu';
import { MobileSheetComponent } from './features/shell/mobile-sheet/mobile-sheet';
import { MobileTabBarComponent } from './features/shell/mobile-tab-bar/mobile-tab-bar';
import { TitleBarComponent } from './features/shell/title-bar/title-bar';
import { ToastContainerComponent } from './features/shell/toast/toast-container/toast-container';
import { SidebarComponent } from './features/sidebar/sidebar';
import { TerminalComponent } from './features/terminal/terminal';
import { StatusBar } from './features/shell/status-bar/status-bar';
import { CommandPalette } from './features/shell/command-palette/command-palette';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    TitleBarComponent,
    ActivityBarComponent,
    StatusBar,
    CommandPalette,
    ToastContainerComponent,
    ContextMenuComponent,
    MobileTabBarComponent,
    MobileSheetComponent,
    SidebarComponent,
    EditorTabsComponent,
    EditorPanelComponent,
    TerminalComponent,
    RecruiterViewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="app"
      [attr.data-view]="viewMode.mode()"
      [attr.data-vp]="layout.viewport()"
    >
      <app-title-bar />

      @if (viewMode.isRecruiter()) {
        <app-recruiter-view />
      } @else if (layout.isMobile()) {
        <!-- ══════════════ MOBILE SHELL ══════════════ -->
        <main class="mobile-editor">
          <app-editor-panel />
        </main>

        <app-mobile-tab-bar />

        @if (layout.mobileSidebarOpen()) {
          <app-mobile-sheet />
        }
      } @else {
        <!-- ══════════════ DESKTOP / TABLET SHELL ══════════════ -->
        <div class="body">
          <app-activity-bar />

          <div class="sidebar-host" [class.open]="layout.sidebarOpen()">
            <app-sidebar />
          </div>

          <main class="editor">
            <app-editor-tabs />
            <app-editor-panel />
            @if (layout.terminalOpen()) {
              <app-terminal />
            }
          </main>
        </div>
      }

      @if (!layout.isMobile() || viewMode.isDeveloper()) {
        <app-status-bar />
      }

      <app-command-palette />
      <app-toast-container />
      <app-context-menu />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }

    .app {
      display: grid;
      grid-template-rows: var(--h-titlebar) minmax(0, 1fr) var(--h-statusbar);
      height: 100vh;
      width: 100%;
      overflow: hidden;
      background: var(--bg-root);
    }

    .app > * {
      min-height: 0;
      min-width: 0;
    }

    /* ────────────── MOBILE ────────────── */
    .app[data-vp='mobile'] {
      grid-template-rows: var(--h-titlebar) minmax(0, 1fr);
    }

    .app[data-vp='mobile'] > app-status-bar {
      display: none;
    }

    .mobile-editor {
      overflow: hidden;
      background: var(--bg-root);
      padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
      min-height: 0;
      display: grid;
    }

    /* ────────────── RECRUITER ────────────── */
    .app[data-view='recruiter'] {
      grid-template-rows: var(--h-titlebar) minmax(0, 1fr);
    }

    .app[data-view='recruiter'] > app-status-bar {
      display: none;
    }

    /* ────────────── DESKTOP / TABLET ────────────── */
    .body {
      display: grid;
      grid-template-columns: var(--w-activitybar) var(--w-sidebar) minmax(0, 1fr);
      min-height: 0;
      overflow: hidden;
      transition: grid-template-columns var(--t-base) var(--ease-smooth);
    }

    .body > * {
      min-height: 0;
      min-width: 0;
    }

    .app[data-vp='desktop'] .body:has(.sidebar-host:not(.open)) {
      grid-template-columns: var(--w-activitybar) 0px minmax(0, 1fr);
    }

    .app[data-vp='tablet'] .body {
      grid-template-columns: var(--w-activitybar) 260px minmax(0, 1fr);
    }

    .app[data-vp='tablet'] .body:has(.sidebar-host:not(.open)) {
      grid-template-columns: var(--w-activitybar) 0px minmax(0, 1fr);
    }

    .sidebar-host {
      overflow: hidden;
      min-width: 0;
      transition: opacity var(--t-base) var(--ease-smooth);
    }

    .sidebar-host:not(.open) {
      opacity: 0;
      pointer-events: none;
    }

    .editor {
      display: grid;
      grid-template-rows: var(--h-tabs) minmax(0, 1fr);
      min-height: 0;
      overflow: hidden;
      background: var(--bg-root);
    }

    .editor:has(app-terminal) {
      grid-template-rows: var(--h-tabs) minmax(0, 1fr) auto;
    }
  `],
})
export class AppComponent {
  readonly layout = inject(LayoutService);
  readonly viewMode = inject(ViewModeService);
  readonly palette = inject(CommandPaletteService);
  private tabs = inject(TabsService);
  private theme = inject(ThemeService);
  private svc = inject(ProjectsService);

  constructor() {
    this.registerCommands();
  }

  @HostListener('document:keydown', ['$event'])
  onKey(ev: KeyboardEvent): void {
    const meta = ev.ctrlKey || ev.metaKey;

    if (meta && ev.shiftKey && ev.key.toLowerCase() === 'v') {
      ev.preventDefault();
      this.viewMode.toggle();
      return;
    }

    if (!this.viewMode.isDeveloper()) return;

    if (meta && ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      this.palette.toggle();
      return;
    }

    if (meta && ev.key === '`') {
      ev.preventDefault();
      this.layout.toggleTerminal();
      return;
    }

    if (meta && ev.key.toLowerCase() === 'b') {
      ev.preventDefault();
      this.layout.sidebarOpen()
        ? this.layout.closeSidebar()
        : this.layout.toggleSidebar(this.layout.sidebarPanel());
      return;
    }

    if (ev.key === 'Escape') {
      if (this.palette.open()) {
        this.palette.close();
        return;
      }
      if (this.layout.mobileSidebarOpen()) {
        this.layout.mobileSidebarOpen.set(false);
        return;
      }
    }
  }

  private registerCommands(): void {
    this.palette.register([
      {
        id: 'welcome', label: 'Go to Welcome', hint: 'Homepage', icon: '🏠',
        action: () => this.tabs.setActive('welcome')
      },
      {
        id: 'view-toggle', label: 'Toggle View Mode', hint: '⌘⇧V', icon: '🔄',
        action: () => this.viewMode.toggle()
      },
      {
        id: 'cv', label: 'Open CV', hint: 'PDF viewer', icon: '📄',
        action: () => this.tabs.open({ id: 'cv', title: 'CV.pdf', icon: '📄', type: 'cv', closable: true })
      },
      {
        id: 'terminal', label: 'Toggle Terminal', hint: '⌘ `', icon: '⌨︎',
        action: () => this.layout.toggleTerminal()
      },
      {
        id: 'theme-cycle', label: 'Cycle Theme', hint: 'Appearance', icon: '◐',
        action: () => this.theme.cycle()
      },
      ...this.svc.companies.map(c => ({
        id: `co-${c.id}`, label: c.name, hint: `${this.svc.countByCompany(c.id)} projects · ${c.type}`,
        icon: c.icon, action: () => this.layout.showSidebar('companies'),
      })),
      ...this.svc.projects.map(p => ({
        id: `proj-${p.id}`, label: p.name, hint: p.summary, icon: '🧩',
        action: () => this.tabs.open({
          id: `project-${p.id}`, title: p.name, icon: '🧩',
          type: 'project', projectId: p.id, closable: true,
        }),
      })),
    ]);
  }
}