import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { LayoutService } from './core/services/layout.service';
import { CommandPaletteService } from './core/services/command-palette.service';
import { TabsService } from './core/services/tabs.service';
import { ThemeService } from './core/services/theme.service';
import { ProjectsService } from './core/services/projects.service';
import { ContextMenuService, ContextMenuItem } from './core/services/context-menu.service';
import { ToastService } from './core/services/toast.service';
import { EditorPanelComponent } from './features/editor/editor-panel/editor-panel';
import { EditorTabsComponent } from './features/editor/editor-tabs/editor-tabs';
import { ActivityBarComponent } from './features/shell/activity-bar/activity-bar';
import { ContextMenuComponent } from './features/shell/context-menu/context-menu';
import { ToastContainerComponent } from './features/shell/toast/toast-container/toast-container';
import { TerminalComponent } from './features/terminal/terminal';
import { StatusBar } from './features/shell/status-bar/status-bar';
import { CommandPalette } from './features/shell/command-palette/command-palette';
import { TitleBarComponent } from './features/shell/title-bar/title-bar';
import { SidebarComponent } from './features/sidebar/sidebar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ActivityBarComponent,
    ToastContainerComponent,
    ContextMenuComponent,
    EditorTabsComponent,
    EditorPanelComponent,
    TerminalComponent,
    StatusBar,
    CommandPalette,
    TitleBarComponent,
    SidebarComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app" [attr.data-vp]="layout.viewport()">
      <app-title-bar />

      <div class="body">
        <app-activity-bar />

        @if (layout.viewport() === 'mobile') {
          @if (layout.mobileSidebarOpen()) {
            <div class="mobile-backdrop" (click)="layout.mobileSidebarOpen.set(false)"></div>
            <div class="mobile-sidebar"><app-sidebar /></div>
          }
        } @else {
          <div class="sidebar-host" [class.open]="layout.sidebarOpen()">
            <app-sidebar />
          </div>
        }

        <main class="editor" [class.sidebar-closed]="!layout.sidebarOpen()">
          <app-editor-tabs />
          <app-editor-panel />
          @if (layout.terminalOpen()) {
            <app-terminal />
          }
        </main>
      </div>

      <app-status-bar />
      <app-command-palette />
      <app-toast-container />
      <app-context-menu />
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }
    .app {
      display: grid;
      grid-template-rows: var(--h-titlebar) 1fr var(--h-statusbar);
      height: 100vh;
      background: var(--bg-root);
    }
    .body {
      display: grid;
      grid-template-columns: var(--w-activitybar) var(--w-sidebar) 1fr;
      min-height: 0;
      overflow: hidden;
      transition: grid-template-columns var(--t-base) var(--ease-smooth);
    }
    .app[data-vp='desktop'] .body:has(.sidebar-host:not(.open)) {
      grid-template-columns: var(--w-activitybar) 0px 1fr;
    }
    .app[data-vp='tablet'] .body {
      grid-template-columns: var(--w-activitybar) 260px 1fr;
    }
    .app[data-vp='tablet'] .body:has(.sidebar-host:not(.open)) {
      grid-template-columns: var(--w-activitybar) 0px 1fr;
    }
    .app[data-vp='mobile'] .body {
      grid-template-columns: 1fr;
      position: relative;
    }
    .sidebar-host {
      overflow: hidden;
      min-width: 0;
      transition: opacity var(--t-base) var(--ease-smooth);
    }
    .sidebar-host:not(.open) { opacity: 0; pointer-events: none; }
    .editor {
      display: grid;
      grid-template-rows: var(--h-tabs) 1fr;
      min-height: 0;
      overflow: hidden;
      background: var(--bg-root);
    }
    .editor:has(app-terminal) {
      grid-template-rows: var(--h-tabs) 1fr auto;
    }
    .mobile-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(8px);
      z-index: 60;
      animation: fadeIn 240ms var(--ease-out);
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .mobile-sidebar {
      position: absolute;
      top: 0; bottom: 0; left: 0;
      width: min(320px, 86vw);
      z-index: 70;
      background: var(--bg-elevated);
      backdrop-filter: var(--blur-thick);
      -webkit-backdrop-filter: var(--blur-thick);
      border-right: 0.5px solid var(--separator);
      box-shadow: var(--shadow-xl);
      animation: drawerIn 280ms var(--ease-spring);
      overflow-y: auto;
    }
    @keyframes drawerIn {
      from { transform: translateX(-100%); opacity: 0.5; }
      to   { transform: translateX(0); opacity: 1; }
    }
  `],
})
export class AppComponent {
  readonly layout = inject(LayoutService);
  readonly palette = inject(CommandPaletteService);
  private tabs = inject(TabsService);
  private theme = inject(ThemeService);
  private svc = inject(ProjectsService);
  private menu = inject(ContextMenuService);
  private toast = inject(ToastService);

  constructor() { this.registerCommands(); }

  @HostListener('document:keydown', ['$event'])
  onKey(ev: KeyboardEvent): void {
    const meta = ev.ctrlKey || ev.metaKey;

    if (meta && ev.key.toLowerCase() === 'k') {
      ev.preventDefault(); this.palette.toggle(); return;
    }
    if (meta && ev.key === '`') {
      ev.preventDefault(); this.layout.toggleTerminal(); return;
    }
    if (meta && ev.key.toLowerCase() === 'b') {
      ev.preventDefault();
      this.layout.sidebarOpen() ? this.layout.closeSidebar() : this.layout.toggleSidebar(this.layout.sidebarPanel());
      return;
    }
    if (ev.key === 'Escape') {
      if (this.menu.state().open) { this.menu.close(); return; }
      if (this.palette.open()) { this.palette.close(); return; }
      if (this.layout.mobileSidebarOpen()) { this.layout.mobileSidebarOpen.set(false); return; }
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  onGlobalContextMenu(ev: MouseEvent): void {
    if (this.menu.state().open) {
      ev.preventDefault();
      this.menu.close();
      return;
    }

    const target = ev.target as HTMLElement;
    const ctxEl = target.closest('[data-ctx]') as HTMLElement | null;
    const ctx = ctxEl?.dataset['ctx'] ?? 'app';
    const ctxId = ctxEl?.dataset['ctxId'] ?? '';
    const ctxLabel = ctxEl?.dataset['ctxLabel'] ?? '';

    ev.preventDefault();
    this.menu.open(ev.clientX, ev.clientY, this.buildMenuItems(ctx, ctxId, ctxLabel), ctxId);
  }

  private buildMenuItems(ctx: string, ctxId: string, ctxLabel: string): ContextMenuItem[] {
    switch (ctx) {
      case 'titlebar': return this.menuTitleBar();
      case 'activity': return this.menuActivityBar(ctxId, ctxLabel);
      case 'sidebar': return this.menuSidebar();
      case 'file': return this.menuFile(ctxId, ctxLabel);
      case 'tab': return this.menuTab(ctxId, ctxLabel);
      case 'editor': return this.menuEditor();
      case 'terminal': return this.menuTerminal();
      case 'welcome': return this.menuWelcome();
      case 'statusbar': return this.menuStatusBar();
      case 'project': return this.menuProject(ctxId, ctxLabel);
      default: return this.menuApp();
    }
  }

  private menuApp(): ContextMenuItem[] {
    return [
      { id: 'palette', label: 'Command Palette', icon: '⌘', shortcut: '⌘K', action: () => this.palette.toggle() },
      { id: 'terminal', label: 'Toggle Terminal', icon: '⌨', shortcut: '⌘`', action: () => this.layout.toggleTerminal() },
      { id: 'sidebar', label: 'Toggle Sidebar', icon: '📁', shortcut: '⌘B', action: () => this.layout.toggleSidebar(this.layout.sidebarPanel()) },
      { id: 'theme', label: 'Cycle Theme', icon: '🎨', shortcut: '⌘J', action: () => this.theme.cycle() },
      { id: 'appearance', label: 'Appearance', icon: '◐', action: () => this.layout.showSidebar('themes') },
      { id: 'welcome', label: 'Go Home', icon: '🏠', action: () => this.tabs.setActive('welcome') },
      { id: 'cv', label: 'View CV', icon: '📄', action: () => this.openCv() },
      { id: 'sep-3', label: '', separatorBefore: true, action: () => { } },
      { id: 'reload', label: 'Reload app', icon: '⟳', shortcut: '⌘R', action: () => window.location.reload() },
      { id: 'print', label: 'Print', icon: '🖨', shortcut: '⌘P', action: () => window.print() },
    ];
  }

  private menuTitleBar(): ContextMenuItem[] {
    return [
      { id: 'min', label: 'Minimize', icon: '⊟', action: () => this.toast.info('Minimize requested') },
      { id: 'max', label: 'Maximize', icon: '⛶', action: () => this.toast.info('Maximize requested') },
      { id: 'close', label: 'Close', icon: '✕', danger: true, action: () => this.toast.warning('Close requested') },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      { id: 'about', label: 'About this app', icon: 'ℹ', action: () => this.toast.info('Portfolio v3 — Ibrahim Shafiq', 'Angular 22 · Full-Stack Engineer') },
    ];
  }

  private menuActivityBar(id: string, label: string): ContextMenuItem[] {
    if (!id) {
      return [
        { id: 'hide', label: 'Hide activity bar', icon: '⇤', action: () => this.toast.info('Activity bar hidden') },
        { id: 'settings', label: 'Activity settings', icon: '⚙', action: () => this.layout.showSidebar('themes') },
      ];
    }
    return [
      { id: 'open', label: `Open ${label}`, icon: '📂', action: () => this.layout.showSidebar(id as any) },
      { id: 'toggle', label: 'Toggle visibility', icon: '👁', action: () => this.layout.toggleSidebar(id as any) },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      { id: 'pin', label: 'Pin panel', icon: '📌', action: () => this.toast.success(`Pinned ${label}`) },
      { id: 'settings', label: 'Panel settings', icon: '⚙', action: () => this.toast.info(`${label} settings`) },
    ];
  }

  private menuSidebar(): ContextMenuItem[] {
    return [
      { id: 'collapse', label: 'Collapse sidebar', icon: '⇤', shortcut: '⌘B', action: () => this.layout.closeSidebar() },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      { id: 'explorer', label: 'Explorer', icon: '📁', action: () => this.layout.showSidebar('explorer') },
      { id: 'search', label: 'Search', icon: '🔍', action: () => this.layout.showSidebar('search') },
      { id: 'companies', label: 'Companies', icon: '🏢', action: () => this.layout.showSidebar('companies') },
      { id: 'projects', label: 'Projects', icon: '🧩', action: () => this.layout.showSidebar('projects') },
      { id: 'skills', label: 'Skills', icon: '⚡', action: () => this.layout.showSidebar('skills') },
      { id: 'themes', label: 'Themes', icon: '🎨', action: () => this.layout.showSidebar('themes') },
      { id: 'contact', label: 'Contact', icon: '✉️', action: () => this.layout.showSidebar('contact') },
    ];
  }

  private menuFile(id: string, label: string): ContextMenuItem[] {
    if (!id) return this.menuSidebar();
    return [
      { id: 'open', label: 'Open', icon: '📂', action: () => this.openFileById(id, label) },
      { id: 'new-tab', label: 'Open in new tab', icon: '➕', action: () => this.openFileById(id, label) },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      { id: 'rename', label: 'Rename', icon: '✎', action: () => this.toast.info(`Rename ${label}`) },
      { id: 'duplicate', label: 'Duplicate', icon: '⧉', action: () => this.toast.success(`Duplicated ${label}`) },
      { id: 'copy-path', label: 'Copy path', icon: '🔗', action: () => { navigator.clipboard?.writeText(label); this.toast.success('Path copied'); } },
      { id: 'sep-2', label: '', separatorBefore: true, action: () => { } },
      { id: 'delete', label: 'Delete', icon: '🗑', danger: true, action: () => this.toast.warning(`Deleted ${label}`) },
    ];
  }

  private menuTab(id: string, label: string): ContextMenuItem[] {
    return [
      { id: 'close', label: 'Close', icon: '✕', shortcut: '⌘W', action: () => this.tabs.close(id) },
      {
        id: 'close-others', label: 'Close others', icon: '⧉', action: () => {
          this.tabs.tabs().forEach(t => { if (t.id !== id && t.closable) this.tabs.close(t.id); });
          this.tabs.setActive(id);
          this.toast.success('Closed other tabs');
        }
      },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      { id: 'pin', label: 'Pin tab', icon: '📌', action: () => this.toast.success(`Pinned ${label}`) },
      { id: 'sep-2', label: '', separatorBefore: true, action: () => { } },
      { id: 'reload', label: 'Reload view', icon: '⟳', action: () => { this.tabs.setActive(id); this.toast.info('View reloaded'); } },
    ];
  }

  private menuEditor(): ContextMenuItem[] {
    return [
      { id: 'find', label: 'Find in view', icon: '🔍', shortcut: '⌘F', action: () => this.toast.info('Find bar opened') },
      { id: 'select-all', label: 'Select all', icon: '▦', shortcut: '⌘A', action: () => { try { document.execCommand('selectAll'); this.toast.success('Selected'); } catch { this.toast.info('Select all'); } } },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      { id: 'zoom-in', label: 'Zoom in', icon: '➕', action: () => this.toast.info('Zoomed in') },
      { id: 'zoom-out', label: 'Zoom out', icon: '➖', action: () => this.toast.info('Zoomed out') },
      { id: 'reset', label: 'Reset zoom', icon: '↺', action: () => this.toast.success('Zoom reset') },
      { id: 'sep-2', label: '', separatorBefore: true, action: () => { } },
      { id: 'print', label: 'Print view', icon: '🖨', shortcut: '⌘P', action: () => window.print() },
    ];
  }

  private menuTerminal(): ContextMenuItem[] {
    return [
      { id: 'clear', label: 'Clear terminal', icon: '⌫', action: () => { this.toast.success('Terminal cleared'); } },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      { id: 'copy', label: 'Copy', icon: '📋', shortcut: '⌘C', action: () => { try { document.execCommand('copy'); this.toast.success('Copied'); } catch { this.toast.info('Copy'); } } },
      { id: 'paste', label: 'Paste', icon: '📥', shortcut: '⌘V', action: () => this.toast.info('Paste requested') },
      { id: 'sep-2', label: '', separatorBefore: true, action: () => { } },
      { id: 'close', label: 'Close terminal', icon: '✕', shortcut: '⌘`', action: () => this.layout.toggleTerminal() },
    ];
  }

  private menuWelcome(): ContextMenuItem[] {
    return [
      { id: 'refresh', label: 'Refresh view', icon: '⟳', action: () => this.toast.success('Refreshed') },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      { id: 'copy-link', label: 'Copy page link', icon: '🔗', action: () => { navigator.clipboard?.writeText(window.location.href); this.toast.success('Link copied'); } },
      { id: 'share', label: 'Share profile', icon: '📤', action: () => this.toast.success('Share sheet opened') },
      { id: 'sep-2', label: '', separatorBefore: true, action: () => { } },
      { id: 'print', label: 'Print page', icon: '🖨', shortcut: '⌘P', action: () => window.print() },
    ];
  }

  private menuStatusBar(): ContextMenuItem[] {
    return [
      { id: 'theme', label: 'Change theme', icon: '🎨', action: () => this.layout.showSidebar('themes') },
      { id: 'accent', label: 'Change accent', icon: '◐', action: () => this.layout.showSidebar('themes') },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      { id: 'copy-status', label: 'Copy status', icon: '📋', action: () => { navigator.clipboard?.writeText('ibrahim-portfolio · online'); this.toast.success('Status copied'); } },
    ];
  }

  private menuProject(id: string, label: string): ContextMenuItem[] {
    if (!id) return this.menuApp();
    return [
      { id: 'open', label: 'Open project', icon: '📂', action: () => this.openProject(id) },
      { id: 'preview', label: 'Live preview', icon: '👁', action: () => this.openProject(id) },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      { id: 'new-window', label: 'Open in new window', icon: '➕', action: () => window.open(window.location.href, '_blank') },
      { id: 'copy-link', label: 'Copy link', icon: '🔗', action: () => { navigator.clipboard?.writeText(`${window.location.origin}/?project=${id}`); this.toast.success('Link copied'); } },
      { id: 'sep-2', label: '', separatorBefore: true, action: () => { } },
      { id: 'details', label: 'View details', icon: 'ℹ', action: () => this.openProject(id) },
    ];
  }

  private openProject(id: string): void {
    const p = this.svc.byId(id);
    if (!p) return;
    this.tabs.open({
      id: `project-${p.id}`,
      title: p.name,
      icon: '🧩',
      type: 'project',
      projectId: p.id,
      closable: true,
    });
  }

  private openFileById(id: string, label: string): void {
    if (id.startsWith('project-')) {
      this.openProject(id.replace('project-', ''));
      return;
    }
    this.tabs.open({
      id: `file-${id}`,
      title: label,
      icon: '📄',
      type: 'file',
      fileId: id,
      closable: true,
    });
  }

  private openCv(): void {
    this.tabs.open({ id: 'cv', title: 'CV.pdf', icon: '📄', type: 'cv', closable: true });
  }

  private registerCommands(): void {
    this.palette.register([
      { id: 'welcome', label: 'Go to Welcome', hint: 'Homepage', icon: '🏠', action: () => this.tabs.setActive('welcome') },
      { id: 'cv', label: 'Open CV', hint: 'PDF viewer', icon: '📄', action: () => this.openCv() },
      { id: 'terminal', label: 'Toggle Terminal', hint: '⌘ `', icon: '⌨︎', action: () => this.layout.toggleTerminal() },
      { id: 'theme-cycle', label: 'Cycle Theme', hint: 'Appearance', icon: '◐', action: () => this.theme.cycle() },
      ...this.svc.companies.map(c => ({
        id: `co-${c.id}`, label: c.name, hint: `${this.svc.countByCompany(c.id)} projects · ${c.type}`,
        icon: c.icon, action: () => this.layout.toggleSidebar('companies'),
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