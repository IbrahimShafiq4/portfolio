import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { getFlowsFor } from '../../../../data/flows';
import { MvcProject, MVC_PROJECTS, MvcEndpoint } from '../../../../data/mvc-projects.data';
import { FlowsPanelComponent } from '../../shared/flows-panel/flows-panel';
import { PreviewShellComponent, PreviewNavItem, ToolbarAction, PreviewNotification } from '../../shared/preview-shell/preview-shell';

@Component({
  selector: 'app-mvc-project-preview',
  standalone: true,
  imports: [PreviewShellComponent, FormsModule, FlowsPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (project(); as p) {
      <app-preview-shell
        [brand]="p.icon"
        [title]="p.name"
        [subtitle]="p.tagline"
        [nav]="nav()"
        [active]="active()"
        (activeChange)="active.set($any($event))"
        [toolbarActions]="toolbar()"
        [notifications]="notifs()"
        [searchPlaceholder]="searchPlaceholder()"
      >
        @if (active() === 'flows') {
          <app-flows-panel [projectId]="p.id" />
        }

        @else if (active() === 'overview') {
          <div class="view">
            <header class="hero-card" [style.--c]="p.color">
              <div class="hero-content">
                <span class="hero-badge">◆ {{ p.techStack[0] }}</span>
                <h1>{{ p.name }}</h1>
                <p class="hero-lede">{{ p.description }}</p>
                <div class="hero-cta">
                  @if (flowsCount() > 0) {
                    <button class="pill primary" (click)="active.set('flows')">
                      🎬 Watch {{ flowsCount() }} flows
                    </button>
                  }
                  <button class="pill" (click)="active.set('endpoints')">
                    🔌 Endpoints ({{ p.endpoints.length }})
                  </button>
                  <button class="pill" (click)="active.set('database')">🗄 Database</button>
                </div>
              </div>
              <div class="hero-stats">
                @for (s of p.stats; track s.label) {
                  <div class="hs">
                    <span class="hs-icon">{{ s.icon }}</span>
                    <b>{{ s.value }}</b>
                    <small>{{ s.label }}</small>
                  </div>
                }
              </div>
            </header>

            <section class="stat-grid">
              @for (k of kpis(); track k.label) {
                <article class="stat-card" [style.--c]="k.color">
                  <span class="stat-icon">{{ k.icon }}</span>
                  <b class="stat-val">{{ k.value }}</b>
                  <span class="stat-label">{{ k.label }}</span>
                </article>
              }
            </section>

            <section class="info-card">
              <header><h4>✨ Features</h4></header>
              <div class="feat-grid">
                @for (f of p.features; track f) {
                  <div class="feat-item">
                    <span class="feat-check">✓</span>
                    <span>{{ f }}</span>
                  </div>
                }
              </div>
            </section>

            <div class="grid-2">
              <section class="info-card">
                <header><h4>📐 Architecture</h4></header>
                <ul class="arch-list">
                  @for (a of p.architecture; track a.label) {
                    <li>
                      <span class="arch-icon">{{ a.icon }}</span>
                      <div>
                        <b>{{ a.label }}</b>
                        <small>{{ a.desc }}</small>
                      </div>
                    </li>
                  }
                </ul>
              </section>

              <section class="info-card">
                <header><h4>📦 NuGet packages</h4></header>
                <ul class="pkg-list">
                  @for (pkg of p.packages; track pkg.name) {
                    <li>
                      <code>{{ pkg.name }}</code>
                      <span class="pkg-version">{{ pkg.version }}</span>
                    </li>
                  }
                </ul>
              </section>
            </div>

            <section class="info-card">
              <header><h4>🗂 Project structure</h4></header>
              <pre class="tree">{{ p.projectTree }}</pre>
            </section>

            <section class="info-card">
              <header><h4>🛡 Identity configuration</h4></header>
              <pre class="code-block">{{ p.identityConfig }}</pre>
            </section>
          </div>
        }

        @else if (active() === 'endpoints') {
          <div class="view">
            <header class="view-head">
              <div>
                <h3>Endpoints Catalog</h3>
                <p>{{ filteredEndpoints().length }} of {{ p.endpoints.length }} endpoints</p>
              </div>
              <div class="view-toggle">
                <button class="vt" [class.active]="endpointView() === 'table'" (click)="endpointView.set('table')" title="Table">☰</button>
                <button class="vt" [class.active]="endpointView() === 'grouped'" (click)="endpointView.set('grouped')" title="Grouped">▦</button>
              </div>
            </header>

            <div class="endpoint-filters">
              @for (m of methodFilters(); track m.id) {
                <button class="mf" [class.active]="methodFilter() === m.id" (click)="methodFilter.set(m.id)">
                  <span class="mf-badge" [attr.data-m]="m.id">{{ m.id }}</span>
                  <span class="mf-count">{{ m.count }}</span>
                </button>
              }
            </div>

            @if (endpointView() === 'table') {
              <div class="endpoint-table">
                <header class="ep-head">
                  <span>Method</span>
                  <span>Route</span>
                  <span>Action</span>
                  <span>Description</span>
                  <span>Auth</span>
                  <span>Returns</span>
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
                } @empty {
                  <div class="empty">No endpoints match your filter</div>
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
            <header class="view-head">
              <div>
                <h3>Database Schema</h3>
                <p>{{ p.dbTables.length }} tables · EF Core code-first</p>
              </div>
            </header>

            <div class="db-grid">
              @for (t of p.dbTables; track t.name) {
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

            <section class="info-card">
              <header><h4>🔧 EF Core DbContext</h4></header>
              <pre class="code-block">{{ dbContextSnippet() }}</pre>
            </section>

            <section class="info-card">
              <header><h4>⚙️ Setup commands</h4></header>
              <pre class="code-block">{{ setupCommands() }}</pre>
            </section>
          </div>
        }
      </app-preview-shell>
    } @else {
      <div class="not-found">
        <span>🚧</span>
        <b>Preview not available</b>
        <small>Project data not found for ID: <code>{{ projectId() }}</code></small>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .view { max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

    .not-found {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%; gap: 10px; text-align: center; padding: 40px;
    }
    .not-found span { font-size: 56px; opacity: 0.4; }
    .not-found b { font-size: var(--fs-lg); font-weight: 700; }
    .not-found small { font-size: var(--fs-sm); color: var(--label-2); }
    .not-found code {
      background: var(--bg-fill-2); padding: 2px 8px; border-radius: var(--r-xs);
      font-family: var(--sf-mono); font-size: var(--fs-xs);
    }

    .hero-card { padding: 32px; background: var(--bg-surface-solid);
                 border: 0.5px solid var(--separator); border-radius: var(--r-lg);
                 position: relative; overflow: hidden; }
    .hero-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0;
                         width: 4px; background: var(--c); }
    .hero-content { max-width: 720px; }
    .hero-badge { display: inline-block; padding: 5px 12px; background: var(--accent-soft);
                  color: var(--accent); border-radius: var(--r-pill); font-size: var(--fs-2xs);
                  font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
                  margin-bottom: 14px; }
    .hero-content h1 { font-size: var(--fs-4xl); font-weight: 800; letter-spacing: -0.03em;
                       margin-bottom: 12px; }
    .hero-lede { font-size: var(--fs-base); line-height: 1.6; color: var(--label-2);
                 margin-bottom: 24px; }
    .hero-cta { display: flex; gap: 10px; flex-wrap: wrap; }
    .pill { padding: 9px 16px; background: var(--bg-fill-2); color: var(--label);
            border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600;
            transition: all var(--t-fast); cursor: pointer; }
    .pill:hover { background: var(--bg-fill-3); transform: translateY(-1px); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }

    .hero-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
                  margin-top: 32px; padding-top: 24px; border-top: 0.5px solid var(--separator); }
    @media (max-width: 720px) { .hero-stats { grid-template-columns: repeat(2, 1fr); } }
    .hs { display: flex; flex-direction: column; gap: 2px; }
    .hs-icon { font-size: 16px; }
    .hs b { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em;
            font-variant-numeric: tabular-nums; }
    .hs small { font-size: var(--fs-2xs); color: var(--label-2);
                text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }

    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
    .stat-card { padding: 18px; background: var(--bg-surface-solid);
                 border: 0.5px solid var(--separator); border-radius: var(--r-md);
                 border-left: 3px solid var(--c); display: flex; flex-direction: column; gap: 4px; }
    .stat-icon { font-size: 20px; }
    .stat-val { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em;
                font-variant-numeric: tabular-nums; line-height: 1; }
    .stat-label { font-size: var(--fs-2xs); color: var(--label-2);
                  text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    .info-card { padding: 24px; background: var(--bg-surface-solid);
                 border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .info-card > header { margin-bottom: 16px; }
    .info-card > header h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }

    .feat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; }
    .feat-item { display: flex; align-items: flex-start; gap: 10px;
                 font-size: var(--fs-xs); line-height: 1.5; }
    .feat-check { color: #34c759; font-weight: 800; flex-shrink: 0; margin-top: 1px; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 820px) { .grid-2 { grid-template-columns: 1fr; } }

    .arch-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .arch-list li { display: flex; gap: 12px; align-items: flex-start; }
    .arch-icon { width: 32px; height: 32px; display: grid; place-items: center;
                 background: var(--accent-soft); color: var(--accent);
                 border-radius: var(--r-sm); font-size: 15px; flex-shrink: 0; }
    .arch-list b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .arch-list small { font-size: var(--fs-2xs); color: var(--label-2); }

    .pkg-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .pkg-list li { display: flex; justify-content: space-between; align-items: center;
                   gap: 12px; padding: 8px 12px; background: var(--bg-fill-2);
                   border-radius: var(--r-xs); }
    .pkg-list code { font-family: var(--sf-mono); font-size: var(--fs-2xs);
                     color: var(--label); overflow: hidden; text-overflow: ellipsis;
                     white-space: nowrap; }
    .pkg-version { font-family: var(--sf-mono); font-size: 10px; color: var(--accent);
                   font-weight: 700; flex-shrink: 0; }

    .tree, .code-block { padding: 18px 20px; background: var(--bg-code);
                         border: 0.5px solid var(--separator); border-radius: var(--r-sm);
                         font-family: var(--sf-mono); font-size: var(--fs-2xs);
                         line-height: 1.65; color: var(--label); overflow-x: auto;
                         white-space: pre; }

    .view-head { display: flex; justify-content: space-between; align-items: flex-end;
                 gap: 16px; flex-wrap: wrap; }
    .view-head h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .view-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }
    .view-toggle { display: flex; gap: 2px; padding: 3px; background: var(--bg-fill-2);
                   border-radius: var(--r-sm); }
    .vt { width: 32px; height: 32px; display: grid; place-items: center;
          border-radius: calc(var(--r-sm) - 4px); color: var(--label-2);
          font-size: 13px; transition: all var(--t-fast); cursor: pointer; }
    .vt:hover { color: var(--label); }
    .vt.active { background: var(--bg-surface-solid); color: var(--label);
                 box-shadow: var(--shadow-xs); }

    .endpoint-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .mf { display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px;
          background: var(--bg-fill-2); border-radius: var(--r-pill);
          font-size: var(--fs-xs); font-weight: 600; color: var(--label-2);
          transition: all var(--t-fast); cursor: pointer; }
    .mf:hover { background: var(--bg-fill-3); color: var(--label); }
    .mf.active { background: var(--accent); color: var(--accent-contrast); }
    .mf-count { font-variant-numeric: tabular-nums; }
    .mf-badge { font-family: var(--sf-mono); font-size: 10px; font-weight: 800;
                padding: 2px 7px; border-radius: var(--r-pill); color: #fff; }
    .mf-badge[data-m='ALL']    { background: var(--label-2); }
    .mf-badge[data-m='GET']    { background: #007aff; }
    .mf-badge[data-m='POST']   { background: #34c759; }
    .mf-badge[data-m='PUT']    { background: #ff9500; }
    .mf-badge[data-m='DELETE'] { background: #ff3b30; }
    .mf.active .mf-badge { background: rgba(255,255,255,0.25); color: #fff; }

    .endpoint-table { background: var(--bg-surface-solid);
                      border: 0.5px solid var(--separator); border-radius: var(--r-md);
                      overflow: hidden; }
    .ep-head, .ep-row { display: grid;
                        grid-template-columns: 80px 200px 200px 1fr 120px 220px;
                        gap: 14px; padding: 12px 16px; align-items: center;
                        font-size: var(--fs-xs); }
    .ep-head { background: var(--bg-fill-2); font-size: 10px; text-transform: uppercase;
               letter-spacing: 0.06em; color: var(--label-2); font-weight: 700; }
    .ep-row { border-top: 0.5px solid var(--separator); cursor: pointer;
              transition: background var(--t-fast); }
    .ep-row:hover { background: var(--bg-hover); }
    .route { color: var(--accent); font-weight: 600; overflow: hidden;
             text-overflow: ellipsis; }
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
                  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                  max-width: 100%; }
    .auth-badge.public { background: rgba(52, 199, 89, 0.15); color: #34c759; }

    .empty { padding: 60px 20px; text-align: center; color: var(--label-3);
             font-size: var(--fs-sm); }

    .endpoint-group { background: var(--bg-surface-solid);
                      border: 0.5px solid var(--separator); border-radius: var(--r-md);
                      overflow: hidden; margin-bottom: 14px; }
    .eg-head { display: flex; align-items: center; gap: 10px; padding: 14px 18px;
               background: var(--bg-fill-2);
               border-bottom: 0.5px solid var(--separator); }
    .eg-icon { font-size: 18px; }
    .eg-head b { font-size: var(--fs-sm); font-weight: 700; flex: 1; }
    .eg-count { padding: 2px 10px; background: var(--bg-fill-3);
                border-radius: var(--r-pill); font-size: 10px; font-weight: 700;
                color: var(--label-2); }
    .eg-card { padding: 16px 18px; border-top: 0.5px solid var(--separator);
               cursor: pointer; transition: background var(--t-fast);
               display: flex; flex-direction: column; gap: 8px; }
    .eg-card:hover { background: var(--bg-hover); }
    .eg-card header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .eg-card header .route { font-family: var(--sf-mono); font-size: var(--fs-xs);
                             font-weight: 600; }
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
export class MvcProjectPreviewComponent {
  projectId = input.required<string>();

  private menu = inject(ContextMenuService);
  private toast = inject(ToastService);

  readonly active = signal('overview');
  readonly endpointView = signal<'table' | 'grouped'>('table');
  readonly methodFilter = signal<string>('ALL');
  readonly searchQuery = signal('');

  readonly project = computed<MvcProject | undefined>(() => {
    const id = this.projectId();
    return MVC_PROJECTS.find(p => p.id === id)
      ?? MVC_PROJECTS.find(p => p.id === id + '-mvc')
      ?? MVC_PROJECTS.find(p => p.id.replace('-mvc', '') === id);
  });

  readonly flowsCount = computed(() => getFlowsFor(this.projectId()).length);

  readonly nav = computed<PreviewNavItem[]>(() => {
    const p = this.project();
    if (!p) return [];
    const items: PreviewNavItem[] = [
      { id: 'overview', label: 'Overview', icon: '📋', group: 'Project' },
    ];
    if (this.flowsCount() > 0) {
      items.push({
        id: 'flows', label: 'Demo Flows', icon: '🎬',
        badge: this.flowsCount(), group: 'Project'
      });
    }
    items.push(
      {
        id: 'endpoints', label: 'Endpoints', icon: '🔌',
        badge: p.endpoints.length, group: 'API'
      },
      {
        id: 'database', label: 'Database', icon: '🗄',
        badge: p.dbTables.length, group: 'API'
      },
    );
    return items;
  });

  readonly toolbar = computed<ToolbarAction[]>(() => [
    {
      id: 'refresh', label: 'Refresh', icon: '⟳',
      action: () => this.toast.success('Refreshed')
    },
    {
      id: 'run', label: 'Run demo', icon: '▶', primary: true,
      action: () => this.active.set(this.flowsCount() ? 'flows' : 'overview')
    },
  ]);

  readonly notifs = signal<PreviewNotification[]>([
    { id: 1, icon: '📦', title: 'NuGet packages', body: 'All up to date', time: '5m' },
    { id: 2, icon: '✅', title: 'Migrations applied', body: 'DB schema current', time: '1h' },
  ]);

  readonly searchPlaceholder = computed(() =>
    this.active() === 'endpoints' ? 'Search route, action…' : ''
  );

  readonly kpis = computed(() => {
    const p = this.project();
    if (!p) return [];
    const controllers = new Set(p.endpoints.map(e => e.controller)).size;
    const secured = p.endpoints.filter(e => e.auth !== 'Anonymous').length;
    return [
      { icon: '🎮', label: 'Controllers', value: controllers.toString(), color: '#007aff' },
      { icon: '🔌', label: 'Endpoints', value: p.endpoints.length.toString(), color: '#34c759' },
      { icon: '🔐', label: 'Secured', value: secured.toString(), color: '#ff9500' },
      { icon: '🗄', label: 'Tables', value: p.dbTables.length.toString(), color: '#af52de' },
    ];
  });

  readonly methodFilters = computed(() => {
    const eps = this.project()?.endpoints ?? [];
    const counts: Record<string, number> = { ALL: eps.length, GET: 0, POST: 0, PUT: 0, DELETE: 0 };
    eps.forEach(e => { counts[e.method] = (counts[e.method] ?? 0) + 1; });
    return Object.entries(counts)
      .filter(([_, c]) => c > 0)
      .map(([id, count]) => ({ id, count }));
  });

  readonly filteredEndpoints = computed(() => {
    const p = this.project();
    if (!p) return [];
    const m = this.methodFilter();
    const q = this.searchQuery().toLowerCase().trim();
    let list = p.endpoints;
    if (m !== 'ALL') list = list.filter(e => e.method === m);
    if (q) list = list.filter(e =>
      e.route.toLowerCase().includes(q) ||
      e.action.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.returns.toLowerCase().includes(q)
    );
    return list;
  });

  readonly groupedEndpoints = computed(() => {
    const map = new Map<string, MvcEndpoint[]>();
    for (const ep of this.filteredEndpoints()) {
      if (!map.has(ep.controller)) map.set(ep.controller, []);
      map.get(ep.controller)!.push(ep);
    }
    return Array.from(map.entries()).map(([controller, items]) => ({ controller, items }));
  });

  readonly dbContextSnippet = computed(() => {
    const p = this.project();
    if (!p) return '';
    const ns = p.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    return `using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ${ns}.Models;

namespace ${ns}.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

${p.dbTables.filter(t => !t.name.startsWith('AspNet')).map(t =>
      `        public DbSet<${t.name}> ${t.name}s { get; set; }`
    ).join('\n')}

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
        }
    }
}`;
  });

  readonly setupCommands = computed(() => {
    const p = this.project();
    if (!p) return '';
    const ns = p.name.replace(/\s+/g, '');
    return `dotnet new mvc -n ${ns}
cd ${ns}

${p.packages.map(pkg => `dotnet add package ${pkg.name}`).join('\n')}

dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run`;
  });

  onNav(id: string): void {
    this.active.set(id);
    this.searchQuery.set('');
    this.methodFilter.set('ALL');
  }

  onSearch(q: string): void { this.searchQuery.set(q); }

  inspectEndpoint(ep: MvcEndpoint): void {
    this.toast.info(`${ep.method} ${ep.route}`, `${ep.action} → ${ep.returns}`, '🔌');
  }

  onEndpointContext(ev: MouseEvent, ep: MvcEndpoint): void {
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