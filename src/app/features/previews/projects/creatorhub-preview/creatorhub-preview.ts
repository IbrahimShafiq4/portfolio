import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FlowsPanelComponent } from '../../shared/flows-panel/flows-panel';
import { PreviewShellComponent, PreviewNavItem, ToolbarAction, PreviewNotification } from '../../shared/preview-shell/preview-shell';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  route: string;
  action: string;
  description: string;
  auth: string;
  returns: string;
  controller: string;
}

@Component({
  selector: 'app-creatorhub-preview',
  standalone: true,
  imports: [PreviewShellComponent, FormsModule, FlowsPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🎬"
      title="CreatorHub"
      subtitle="ASP.NET Core MVC"
      [nav]="nav()"
      [active]="active()"
      (activeChange)="onNav($event)"
      [toolbarActions]="toolbar()"
      [notifications]="notifs()"
      [searchPlaceholder]="searchPlaceholder()"
      (searchChange)="onSearch($event)"
    >
      @if (active() === 'flows') {
        <app-flows-panel projectId="creatorhub" />
      }

      @else if (active() === 'overview') {
        <div class="view">
          <header class="hero-card">
            <div class="hero-content">
              <span class="hero-badge">◆ ASP.NET Core MVC · v1.0</span>
              <h1>CreatorHub</h1>
              <p class="hero-lede">A production-grade MVC platform for creators — episodic content, user accounts, and a fully documented REST surface.</p>
              <div class="hero-cta">
                <button class="pill primary" (click)="active.set('flows')">🎬 Watch demo flows</button>
                <button class="pill" (click)="active.set('endpoints')">🔌 Endpoints ({{ endpoints.length }})</button>
              </div>
            </div>
            <div class="hero-stats">
              <div class="hs"><b>8</b><small>Controllers</small></div>
              <div class="hs"><b>{{ endpoints.length }}</b><small>Endpoints</small></div>
              <div class="hs"><b>6</b><small>Entities</small></div>
              <div class="hs"><b>3</b><small>Demo flows</small></div>
            </div>
          </header>

          <section class="stat-grid">
            @for (k of kpis; track k.label) {
              <article class="stat-card" [style.--c]="k.color">
                <span class="stat-icon">{{ k.icon }}</span>
                <b class="stat-val">{{ k.value }}</b>
                <span class="stat-label">{{ k.label }}</span>
              </article>
            }
          </section>
        </div>
      }

      @else if (active() === 'endpoints') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Endpoints Catalog</h3>
              <p>{{ filteredEndpoints().length }} endpoints</p>
            </div>
            <div class="view-toggle">
              <button class="vt" [class.active]="endpointView() === 'table'" (click)="endpointView.set('table')">☰</button>
              <button class="vt" [class.active]="endpointView() === 'grouped'" (click)="endpointView.set('grouped')">▦</button>
            </div>
          </header>

          <div class="endpoint-filters">
            @for (m of methodFilters; track m.id) {
              <button class="mf" [class.active]="methodFilter() === m.id" (click)="methodFilter.set(m.id)">
                <span class="mf-badge" [attr.data-m]="m.id">{{ m.id }}</span>
                <span class="mf-count">{{ countBy(m.id) }}</span>
              </button>
            }
          </div>

          @if (endpointView() === 'table') {
            <div class="endpoint-table">
              <header class="ep-head">
                <span>Method</span><span>Route</span><span>Action</span>
                <span>Description</span><span>Auth</span><span>Returns</span>
              </header>
              @for (ep of filteredEndpoints(); track ep.route + ep.method) {
                <div class="ep-row" (click)="inspectEndpoint(ep)" (contextmenu)="onEndpointContext($event, ep)">
                  <span><span class="method-badge" [attr.data-m]="ep.method">{{ ep.method }}</span></span>
                  <span class="mono route">{{ ep.route }}</span>
                  <span class="mono action">{{ ep.action }}</span>
                  <span class="desc">{{ ep.description }}</span>
                  <span><span class="auth-badge" [class.public]="ep.auth === 'Anonymous'">{{ ep.auth }}</span></span>
                  <span class="mono returns">{{ ep.returns }}</span>
                </div>
              }
            </div>
          } @else {
            @for (g of groupedEndpoints(); track g.controller) {
              <section class="endpoint-group">
                <header class="eg-head">
                  <span class="eg-icon">🎮</span>
                  <b>{{ g.controller }}Controller</b>
                  <span class="eg-count">{{ g.items.length }} endpoints</span>
                </header>
                @for (ep of g.items; track ep.route + ep.method) {
                  <article class="eg-card" (click)="inspectEndpoint(ep)" (contextmenu)="onEndpointContext($event, ep)">
                    <header>
                      <span class="method-badge" [attr.data-m]="ep.method">{{ ep.method }}</span>
                      <code class="route">{{ ep.route }}</code>
                      <span class="auth-badge" [class.public]="ep.auth === 'Anonymous'">{{ ep.auth }}</span>
                    </header>
                    <p class="eg-desc">{{ ep.description }}</p>
                    <div class="eg-returns">
                      <span>Returns</span>
                      <code>{{ ep.returns }}</code>
                    </div>
                  </article>
                }
              </section>
            }
          }
        </div>
      }

      @else if (active() === 'database') {
        <div class="view">
          <h3>Database Schema</h3>
          <div class="db-grid">
            @for (t of dbTables; track t.name) {
              <article class="db-card">
                <header>
                  <span class="db-icon">📊</span>
                  <b>{{ t.name }}</b>
                  <span class="db-cols">{{ t.columns }} cols</span>
                </header>
                <p>{{ t.description }}</p>
              </article>
            }
          </div>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .view { max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

    .hero-card {
      padding: 32px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
    }
    .hero-badge {
      display: inline-block;
      padding: 5px 12px;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 14px;
    }
    .hero-content h1 { font-size: var(--fs-4xl); font-weight: 800; letter-spacing: -0.03em; margin-bottom: 12px; }
    .hero-lede { font-size: var(--fs-base); line-height: 1.6; color: var(--label-2); margin-bottom: 24px; max-width: 720px; }
    .hero-cta { display: flex; gap: 10px; flex-wrap: wrap; }
    .pill { padding: 9px 16px; background: var(--bg-fill-2); color: var(--label);
            border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600;
            transition: all var(--t-fast); }
    .pill:hover { background: var(--bg-fill-3); transform: translateY(-1px); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }

    .hero-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
                  margin-top: 32px; padding-top: 24px; border-top: 0.5px solid var(--separator); }
    .hs b { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em;
            font-variant-numeric: tabular-nums; display: block; }
    .hs small { font-size: var(--fs-2xs); color: var(--label-2);
                text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }

    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .stat-grid, .hero-stats { grid-template-columns: repeat(2, 1fr); } }
    .stat-card { padding: 18px; background: var(--bg-surface-solid);
                 border: 0.5px solid var(--separator); border-radius: var(--r-md);
                 border-left: 3px solid var(--c); }
    .stat-icon { font-size: 20px; }
    .stat-val { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em;
                font-variant-numeric: tabular-nums; display: block; }
    .stat-label { font-size: var(--fs-2xs); color: var(--label-2);
                  text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    .view-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
    .view-head h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .view-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }
    .view-toggle { display: flex; gap: 2px; padding: 3px; background: var(--bg-fill-2);
                   border-radius: var(--r-sm); }
    .vt { width: 32px; height: 32px; display: grid; place-items: center;
          border-radius: calc(var(--r-sm) - 4px); color: var(--label-2);
          font-size: 13px; transition: all var(--t-fast); }
    .vt:hover { color: var(--label); }
    .vt.active { background: var(--bg-surface-solid); color: var(--label); box-shadow: var(--shadow-xs); }

    .endpoint-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .mf { display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px;
          background: var(--bg-fill-2); border-radius: var(--r-pill);
          font-size: var(--fs-xs); font-weight: 600; color: var(--label-2);
          transition: all var(--t-fast); }
    .mf:hover { background: var(--bg-fill-3); color: var(--label); }
    .mf.active { background: var(--accent); color: var(--accent-contrast); }
    .mf-count { font-variant-numeric: tabular-nums; }
    .mf-badge { font-family: var(--sf-mono); font-size: 10px; font-weight: 800;
                padding: 2px 7px; border-radius: var(--r-pill); color: #fff; }
    .mf-badge[data-m='GET']    { background: #007aff; }
    .mf-badge[data-m='POST']   { background: #34c759; }
    .mf-badge[data-m='PUT']    { background: #ff9500; }
    .mf-badge[data-m='DELETE'] { background: #ff3b30; }
    .mf.active .mf-badge { background: rgba(255,255,255,0.25); color: #fff; }

    .endpoint-table { background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
                      border-radius: var(--r-md); overflow: hidden; }
    .ep-head, .ep-row {
      display: grid;
      grid-template-columns: 80px 200px 200px 1fr 120px 220px;
      gap: 14px;
      padding: 12px 16px;
      align-items: center;
      font-size: var(--fs-xs);
    }
    .ep-head { background: var(--bg-fill-2); font-size: 10px; text-transform: uppercase;
               letter-spacing: 0.06em; color: var(--label-2); font-weight: 700; }
    .ep-row { border-top: 0.5px solid var(--separator); cursor: pointer;
              transition: background var(--t-fast); }
    .ep-row:hover { background: var(--bg-hover); }
    .route { color: var(--accent); font-weight: 600; overflow: hidden; text-overflow: ellipsis; }
    .action { color: var(--label-2); overflow: hidden; text-overflow: ellipsis; }
    .desc { color: var(--label); line-height: 1.4; }
    .returns { color: #34c759; font-weight: 600; overflow: hidden; text-overflow: ellipsis; }

    .method-badge { display: inline-block; font-family: var(--sf-mono); font-size: 10px;
                    font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill);
                    color: #fff; text-align: center; min-width: 60px; }
    .method-badge[data-m='GET']    { background: #007aff; }
    .method-badge[data-m='POST']   { background: #34c759; }
    .method-badge[data-m='PUT']    { background: #ff9500; }
    .method-badge[data-m='DELETE'] { background: #ff3b30; }

    .auth-badge { display: inline-block; padding: 3px 9px;
                  background: rgba(255, 149, 0, 0.15); color: #ff9500;
                  border-radius: var(--r-pill); font-size: 10px; font-weight: 700;
                  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .auth-badge.public { background: rgba(52, 199, 89, 0.15); color: #34c759; }

    .endpoint-group { background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
                      border-radius: var(--r-md); overflow: hidden; margin-bottom: 14px; }
    .eg-head { display: flex; align-items: center; gap: 10px; padding: 14px 18px;
               background: var(--bg-fill-2); border-bottom: 0.5px solid var(--separator); }
    .eg-icon { font-size: 18px; }
    .eg-head b { font-size: var(--fs-sm); font-weight: 700; flex: 1; }
    .eg-count { padding: 2px 10px; background: var(--bg-fill-3); border-radius: var(--r-pill);
                font-size: 10px; font-weight: 700; color: var(--label-2); }
    .eg-card { padding: 16px 18px; border-top: 0.5px solid var(--separator);
               cursor: pointer; transition: background var(--t-fast);
               display: flex; flex-direction: column; gap: 8px; }
    .eg-card:hover { background: var(--bg-hover); }
    .eg-card header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .eg-card header .route { font-family: var(--sf-mono); font-size: var(--fs-xs); font-weight: 600; }
    .eg-desc { font-size: var(--fs-sm); color: var(--label-2); line-height: 1.5; }
    .eg-returns { display: flex; align-items: center; gap: 10px; padding-top: 8px;
                  border-top: 0.5px solid var(--separator); font-size: var(--fs-2xs); }
    .eg-returns span { color: var(--label-3); text-transform: uppercase;
                       letter-spacing: 0.06em; font-weight: 700; }
    .eg-returns code { font-family: var(--sf-mono); color: #34c759; font-weight: 600; }

    .db-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .db-card { padding: 18px; background: var(--bg-surface-solid);
               border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .db-card header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .db-icon { font-size: 18px; }
    .db-card b { font-size: var(--fs-sm); font-weight: 700; flex: 1; }
    .db-cols { padding: 2px 9px; background: var(--accent-soft); color: var(--accent);
               border-radius: var(--r-pill); font-size: 10px; font-weight: 700; }
    .db-card p { font-size: var(--fs-2xs); color: var(--label-2); line-height: 1.5; }
  `],
})
export class CreatorHubPreviewComponent {
  private menu = inject(ContextMenuService);
  private toast = inject(ToastService);

  readonly active = signal('overview');
  readonly endpointView = signal<'table' | 'grouped'>('table');
  readonly methodFilter = signal<string>('ALL');
  readonly searchQuery = signal('');

  readonly nav = computed<PreviewNavItem[]>(() => [
    { id: 'overview', label: 'Overview', icon: '📋', group: 'Project' },
    { id: 'flows', label: 'Demo Flows', icon: '🎬', badge: 3, group: 'Project' },
    { id: 'endpoints', label: 'Endpoints', icon: '🔌', badge: this.endpoints.length, group: 'API' },
    { id: 'database', label: 'Database', icon: '🗄', badge: 5, group: 'API' },
  ]);

  readonly toolbar = computed<ToolbarAction[]>(() => [
    { id: 'refresh', label: 'Refresh', icon: '⟳', action: () => this.toast.success('Refreshed') },
    { id: 'run', label: 'Run demo', icon: '▶', primary: true, action: () => this.active.set('flows') },
  ]);

  readonly notifs = signal<PreviewNotification[]>([
    { id: 1, icon: '📦', title: 'NuGet packages', body: 'All up to date', time: '5m' },
    { id: 2, icon: '✅', title: 'Migrations applied', body: 'DB schema current', time: '1h' },
  ]);

  readonly searchPlaceholder = computed(() =>
    this.active() === 'endpoints' ? 'Search route, action…' : ''
  );

  readonly kpis = [
    { icon: '🎮', label: 'Controllers', value: '8', color: '#007aff' },
    { icon: '🔌', label: 'Endpoints', value: '24', color: '#34c759' },
    { icon: '🔐', label: 'Secured', value: '18', color: '#ff9500' },
    { icon: '🗄', label: 'Tables', value: '5', color: '#af52de' },
  ];

  readonly endpoints: Endpoint[] = [
    { method: 'GET', route: '/', action: 'Home.Index', description: 'Homepage with latest content', auth: 'Anonymous', returns: 'View(latestContent)', controller: 'Home' },
    { method: 'GET', route: '/Home/Privacy', action: 'Home.Privacy', description: 'Static privacy page', auth: 'Anonymous', returns: 'View()', controller: 'Home' },
    { method: 'GET', route: '/Account/Register', action: 'Account.Register', description: 'Registration form', auth: 'Anonymous', returns: 'View()', controller: 'Account' },
    { method: 'POST', route: '/Account/Register', action: 'Account.Register', description: 'Create account + welcome email', auth: 'Anonymous', returns: 'RedirectToAction("Index","Home")', controller: 'Account' },
    { method: 'GET', route: '/Account/Login', action: 'Account.Login', description: 'Login form', auth: 'Anonymous', returns: 'View()', controller: 'Account' },
    { method: 'POST', route: '/Account/Login', action: 'Account.Login', description: 'Sign in with lockout', auth: 'Anonymous', returns: 'RedirectToAction("Index","Home")', controller: 'Account' },
    { method: 'POST', route: '/Account/Logout', action: 'Account.Logout', description: 'Sign out', auth: 'Authorize', returns: 'RedirectToAction("Index","Home")', controller: 'Account' },
    { method: 'GET', route: '/Account/AccessDenied', action: 'Account.AccessDenied', description: '403 page', auth: 'Anonymous', returns: 'View()', controller: 'Account' },
    { method: 'GET', route: '/Projects', action: 'Projects.Index', description: 'All projects', auth: 'Anonymous', returns: 'View(List<ContentProject>)', controller: 'Projects' },
    { method: 'GET', route: '/Projects/Details/{id}', action: 'Projects.Details', description: 'Project detail + episodes', auth: 'Anonymous', returns: 'View(ContentProject)', controller: 'Projects' },
    { method: 'GET', route: '/Projects/Create', action: 'Projects.Create', description: 'New project form', auth: 'Authorize', returns: 'View()', controller: 'Projects' },
    { method: 'POST', route: '/Projects/Create', action: 'Projects.Create', description: 'Save + cover upload', auth: 'Authorize', returns: 'RedirectToAction("Index")', controller: 'Projects' },
    { method: 'POST', route: '/Projects/PreviewCover', action: 'Projects.PreviewCover', description: 'AJAX cover preview', auth: 'Authorize', returns: 'Json({ url })', controller: 'Projects' },
    { method: 'GET', route: '/Projects/Edit/{id}', action: 'Projects.Edit', description: 'Edit form', auth: 'Authorize(Owner)', returns: 'View(ContentProject)', controller: 'Projects' },
    { method: 'POST', route: '/Projects/Edit/{id}', action: 'Projects.Edit', description: 'Update project', auth: 'Authorize(Owner)', returns: 'RedirectToAction("Index")', controller: 'Projects' },
    { method: 'POST', route: '/Projects/Delete/{id}', action: 'Projects.DeleteConfirmed', description: 'Cascade delete', auth: 'Authorize(Owner)', returns: 'RedirectToAction("Index")', controller: 'Projects' },
    { method: 'GET', route: '/Episodes/Details/{id}', action: 'Episodes.Details', description: 'Episode player', auth: 'Anonymous', returns: 'View(Episode)', controller: 'Episodes' },
    { method: 'GET', route: '/Episodes/Create/{projectId}', action: 'Episodes.Create', description: 'New episode form', auth: 'Authorize(Owner)', returns: 'View()', controller: 'Episodes' },
    { method: 'POST', route: '/Episodes/Create/{projectId}', action: 'Episodes.Create', description: 'Upload video + thumbnail', auth: 'Authorize(Owner)', returns: 'RedirectToAction("Details","Projects")', controller: 'Episodes' },
    { method: 'POST', route: '/Episodes/Increment/{id}', action: 'Episodes.Increment', description: 'View counter (AJAX)', auth: 'Anonymous', returns: 'Json({ views })', controller: 'Episodes' },
    { method: 'GET', route: '/Dashboard', action: 'Dashboard.Index', description: 'Creator dashboard', auth: 'Authorize', returns: 'View(DashboardViewModel)', controller: 'Dashboard' },
    { method: 'GET', route: '/Dashboard/Analytics', action: 'Dashboard.Analytics', description: 'Charts + stats', auth: 'Authorize', returns: 'View(AnalyticsViewModel)', controller: 'Dashboard' },
    { method: 'GET', route: '/Admin/Users', action: 'Admin.Users', description: 'User management', auth: 'Authorize(Roles=Admin)', returns: 'View(List<ApplicationUser>)', controller: 'Admin' },
    { method: 'POST', route: '/Admin/Users/{id}/Role', action: 'Admin.ChangeRole', description: 'Update role', auth: 'Authorize(Roles=Admin)', returns: 'Json({ success })', controller: 'Admin' },
  ];

  readonly dbTables = [
    { name: 'AspNetUsers', columns: 16, description: 'ApplicationUser with DisplayName, Bio, ProfileImagePath' },
    { name: 'AspNetRoles', columns: 4, description: 'Admin, Creator roles' },
    { name: 'AspNetUserRoles', columns: 2, description: 'User-Role mapping' },
    { name: 'ContentProjects', columns: 8, description: 'Title, Description, Category, CoverImagePath' },
    { name: 'Episodes', columns: 11, description: 'Title, EpisodeNumber, VideoPath, ViewsCount' },
  ];

  readonly methodFilters = [
    { id: 'ALL' },
    { id: 'GET' },
    { id: 'POST' },
  ];

  readonly filteredEndpoints = computed(() => {
    const m = this.methodFilter();
    const q = this.searchQuery().toLowerCase().trim();
    let list = this.endpoints;
    if (m !== 'ALL') list = list.filter(e => e.method === m);
    if (q) list = list.filter(e =>
      e.route.toLowerCase().includes(q) ||
      e.action.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    );
    return list;
  });

  readonly groupedEndpoints = computed(() => {
    const map = new Map<string, Endpoint[]>();
    for (const ep of this.filteredEndpoints()) {
      if (!map.has(ep.controller)) map.set(ep.controller, []);
      map.get(ep.controller)!.push(ep);
    }
    return Array.from(map.entries()).map(([controller, items]) => ({ controller, items }));
  });

  onNav(id: string): void {
    this.active.set(id);
    this.searchQuery.set('');
    this.methodFilter.set('ALL');
  }

  onSearch(q: string): void { this.searchQuery.set(q); }

  countBy(m: string): number {
    if (m === 'ALL') return this.endpoints.length;
    return this.endpoints.filter(e => e.method === m).length;
  }

  inspectEndpoint(ep: Endpoint): void {
    this.toast.info(`${ep.method} ${ep.route}`, `${ep.action} → ${ep.returns}`, '🔌');
  }

  onEndpointContext(ev: MouseEvent, ep: Endpoint): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      {
        id: 'copy-route', label: 'Copy route', icon: '📋',
        action: () => { navigator.clipboard?.writeText(ep.route); this.toast.success('Route copied'); }
      },
      {
        id: 'copy-curl', label: 'Copy as cURL', icon: '⌨',
        action: () => { navigator.clipboard?.writeText(`curl -X ${ep.method} https://localhost:5001${ep.route}`); this.toast.success('cURL copied'); }
      },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'docs', label: 'Documentation', icon: '📖',
        action: () => this.toast.info('Docs opened')
      },
      {
        id: 'test', label: 'Generate test', icon: '🧪',
        action: () => this.toast.success('Test scaffolded')
      },
    ]);
  }
}