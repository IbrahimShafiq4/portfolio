import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { getFlowsFor } from '../../../../data/flows';
import { TOTAL_CONTROLLERS, TOTAL_ENDPOINTS, OMNISOCIAL_FEATURES, OsController, OMNISOCIAL_CONTROLLERS, OsEndpoint } from '../../../../data/omnisocial/omnisocial-endpoints.data';
import { FlowsPanelComponent } from '../../shared/flows-panel/flows-panel';
import { PreviewShellComponent, PreviewNavItem, ToolbarAction, PreviewNotification } from '../../shared/preview-shell/preview-shell';

@Component({
  selector: 'app-omnisocial-preview',
  standalone: true,
  imports: [PreviewShellComponent, FormsModule, FlowsPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🌐"
      title="OmniSocial"
      subtitle="71 controllers · 525 endpoints"
      [nav]="nav()"
      [active]="active()"
      (activeChange)="onNav($event)"
      [toolbarActions]="toolbar()"
      [notifications]="notifs()"
      [searchPlaceholder]="searchPlaceholder()"
    >
      @if (active() === 'flows') {
        <app-flows-panel projectId="omnisocial" />
      }

      @else if (active() === 'overview') {
        <div class="view">
          <header class="hero-card">
            <div class="hero-content">
              <span class="hero-badge">◆ Multi-Platform Social Network</span>
              <h1>OmniSocial</h1>
              <p class="hero-lede">The world's first truly multi-platform social network. One account, three personalities — Twitter, Instagram, and TikTok unified with AI-powered features, real-time communication, and 71 REST controllers.</p>
              <div class="hero-cta">
                <button class="pill primary" (click)="active.set('flows')">🎬 Watch 10 flows</button>
                <button class="pill" (click)="active.set('endpoints')">🔌 {{ totalEndpoints }} endpoints</button>
                <button class="pill" (click)="active.set('realtime')">📡 SignalR hubs</button>
              </div>
            </div>
            <div class="hero-stats">
              <div class="hs"><b>{{ totalControllers }}</b><small>Controllers</small></div>
              <div class="hs"><b>{{ totalEndpoints }}</b><small>Endpoints</small></div>
              <div class="hs"><b>10</b><small>Demo Flows</small></div>
              <div class="hs"><b>25+</b><small>DB Tables</small></div>
            </div>
          </header>

          <section class="stat-grid">
            @for (k of kpis; track k.label) {
              <article class="stat-card" [style.--c]="k.color" (click)="openFeature(k.featureId)">
                <span class="stat-icon">{{ k.icon }}</span>
                <b class="stat-val">{{ k.value }}</b>
                <span class="stat-label">{{ k.label }}</span>
              </article>
            }
          </section>

          <section class="feature-map">
            <header class="fm-head">
              <h3>Feature Map — 14 Categories</h3>
              <p>Click any category to explore its controllers</p>
            </header>
            <div class="fm-grid">
              @for (f of features; track f.id) {
                <article class="fm-card" [style.--c]="f.color" (click)="openFeature(f.id)">
                  <header>
                    <span class="fm-icon">{{ f.icon }}</span>
                    <b>{{ f.label }}</b>
                    <span class="fm-count">{{ countByFeature(f.id) }}</span>
                  </header>
                  <div class="fm-controllers">
                    @for (c of controllersByFeature(f.id).slice(0, 4); track c.id) {
                      <span class="fm-chip">{{ c.name.replace('Controller', '') }}</span>
                    }
                    @if (controllersByFeature(f.id).length > 4) {
                      <span class="fm-chip more">+{{ controllersByFeature(f.id).length - 4 }}</span>
                    }
                  </div>
                </article>
              }
            </div>
          </section>

          <div class="grid-2">
            <section class="info-card">
              <header><h4>🏗 Architecture</h4></header>
              <ul class="arch-list">
                @for (a of architecture; track a.label) {
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
              <header><h4>📦 Backend Stack</h4></header>
              <ul class="pkg-list">
                @for (p of packages; track p.name) {
                  <li>
                    <code>{{ p.name }}</code>
                    <span class="pkg-version">{{ p.version }}</span>
                  </li>
                }
              </ul>
            </section>
          </div>

          <section class="info-card">
            <header><h4>🗂 Solution structure</h4></header>
            <pre class="tree">{{ solutionTree }}</pre>
          </section>
        </div>
      }

      @else if (active() === 'endpoints') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Endpoints Explorer</h3>
              <p>{{ filteredControllers().length }} of {{ totalControllers }} controllers · {{ filteredEndpointCount() }} endpoints</p>
            </div>
            <div class="view-toggle">
              <button class="vt" [class.active]="endpointView() === 'features'" (click)="endpointView.set('features')" title="By Feature">📂</button>
              <button class="vt" [class.active]="endpointView() === 'controllers'" (click)="endpointView.set('controllers')" title="By Controller">🎮</button>
            </div>
          </header>

          <div class="endpoint-filters">
            <button class="mf" [class.active]="featureFilter() === 'all'" (click)="featureFilter.set('all')">
              <span class="mf-badge">ALL</span>
              <span class="mf-count">{{ totalControllers }}</span>
            </button>
            @for (f of features; track f.id) {
              <button class="mf" [class.active]="featureFilter() === f.id" (click)="featureFilter.set(f.id)" [style.--c]="f.color">
                <span class="mf-icon">{{ f.icon }}</span>
                <span class="mf-count">{{ countByFeature(f.id) }}</span>
              </button>
            }
          </div>

          @if (endpointView() === 'features') {
            @for (f of activeFeatures(); track f.id) {
              <section class="feature-block" [style.--c]="f.color">
                <header class="fb-head">
                  <span class="fb-icon">{{ f.icon }}</span>
                  <div>
                    <h4>{{ f.label }}</h4>
                    <small>{{ controllersByFeature(f.id).length }} controllers</small>
                  </div>
                </header>
                <div class="fb-controllers">
                  @for (c of controllersByFeature(f.id); track c.id) {
                    <article class="ctrl-card" (click)="selectController(c)" (contextmenu)="onControllerContext($event, c)">
                      <header>
                        <span class="cc-icon">{{ c.icon }}</span>
                        <div>
                          <b>{{ c.name }}</b>
                          <small>{{ c.description }}</small>
                        </div>
                        <span class="cc-count">{{ c.endpoints.length }}</span>
                      </header>
                      <ul class="cc-endpoints">
                        @for (ep of c.endpoints.slice(0, 3); track ep.route + ep.method) {
                          <li>
                            <span class="method-badge" [attr.data-m]="ep.method">{{ ep.method }}</span>
                            <code>{{ ep.route }}</code>
                          </li>
                        }
                        @if (c.endpoints.length > 3) {
                          <li class="more">+{{ c.endpoints.length - 3 }} more…</li>
                        }
                      </ul>
                    </article>
                  }
                </div>
              </section>
            }
          } @else {
            <div class="controller-list">
              @for (c of filteredControllers(); track c.id) {
                <article class="ctrl-row" (click)="toggleController(c.id)" (contextmenu)="onControllerContext($event, c)">
                  <header class="cr-head">
                    <span class="cr-icon" [style.background]="c.color + '22'" [style.color]="c.color">{{ c.icon }}</span>
                    <div>
                      <b>{{ c.name }}</b>
                      <small>{{ c.description }}</small>
                    </div>
                    <span class="cr-count">{{ c.endpoints.length }} endpoints</span>
                    <span class="cr-chev" [class.open]="expandedControllers().includes(c.id)">▾</span>
                  </header>
                  @if (expandedControllers().includes(c.id)) {
                    <div class="cr-body">
                      @for (ep of c.endpoints; track ep.route + ep.method) {
                        <div class="ep-row" (click)="inspectEndpoint($event, ep)">
                          <span class="method-badge" [attr.data-m]="ep.method">{{ ep.method }}</span>
                          <code class="route">{{ ep.route }}</code>
                          <span class="ep-action">{{ ep.action }}</span>
                          <span class="ep-desc">{{ ep.description }}</span>
                          <span class="auth-badge" [class.public]="ep.auth === 'Anonymous'">{{ ep.auth }}</span>
                          <span class="ep-returns">{{ ep.returns }}</span>
                        </div>
                      }
                    </div>
                  }
                </article>
              }
            </div>
          }
        </div>
      }

      @else if (active() === 'components') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Angular Components</h3>
              <p>Frontend component library across all features</p>
            </div>
          </header>

          <section class="stat-grid">
            @for (k of componentKpis; track k.label) {
              <article class="stat-card" [style.--c]="k.color">
                <span class="stat-icon">{{ k.icon }}</span>
                <b class="stat-val">{{ k.value }}</b>
                <span class="stat-label">{{ k.label }}</span>
              </article>
            }
          </section>

          @for (group of componentGroups; track group.name) {
            <section class="component-group">
              <header class="cg-head">
                <span class="cg-icon">{{ group.icon }}</span>
                <h4>{{ group.name }}</h4>
                <span class="cg-count">{{ group.components.length }}</span>
              </header>
              <div class="cg-grid">
                @for (comp of group.components; track comp.name) {
                  <article class="comp-card" (click)="showComponent(comp)">
                    <header>
                      <span class="comp-icon">{{ comp.icon }}</span>
                      <b>{{ comp.name }}</b>
                    </header>
                    <p>{{ comp.desc }}</p>
                    <div class="comp-endpoints">
                      @for (ep of comp.uses; track ep) {
                        <span class="comp-endpoint-chip">{{ ep }}</span>
                      }
                    </div>
                  </article>
                }
              </div>
            </section>
          }
        </div>
      }

      @else if (active() === 'database') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Database Schema</h3>
              <p>{{ dbTables.length }} tables · EF Core code-first with Identity</p>
            </div>
          </header>

          <section class="db-group">
            <header class="dg-head">
              <span class="dg-icon">🔐</span>
              <h4>Identity Tables (ASP.NET Core Identity)</h4>
              <span class="dg-count">{{ dbTables.filter(t => t.group === 'identity').length }}</span>
            </header>
            <div class="db-grid">
              @for (t of dbTables.filter(x => x.group === 'identity'); track t.name) {
                <article class="db-card">
                  <header>
                    <span class="db-icon">{{ t.icon }}</span>
                    <b>{{ t.name }}</b>
                    <span class="db-cols">{{ t.columns }} cols</span>
                  </header>
                  <p>{{ t.description }}</p>
                </article>
              }
            </div>
          </section>

          <section class="db-group">
            <header class="dg-head">
              <span class="dg-icon">📱</span>
              <h4>Core Social Tables</h4>
              <span class="dg-count">{{ dbTables.filter(t => t.group === 'core').length }}</span>
            </header>
            <div class="db-grid">
              @for (t of dbTables.filter(x => x.group === 'core'); track t.name) {
                <article class="db-card">
                  <header>
                    <span class="db-icon">{{ t.icon }}</span>
                    <b>{{ t.name }}</b>
                    <span class="db-cols">{{ t.columns }} cols</span>
                  </header>
                  <p>{{ t.description }}</p>
                </article>
              }
            </div>
          </section>

          <section class="db-group">
            <header class="dg-head">
              <span class="dg-icon">🤖</span>
              <h4>AI & Analytics Tables</h4>
              <span class="dg-count">{{ dbTables.filter(t => t.group === 'ai').length }}</span>
            </header>
            <div class="db-grid">
              @for (t of dbTables.filter(x => x.group === 'ai'); track t.name) {
                <article class="db-card">
                  <header>
                    <span class="db-icon">{{ t.icon }}</span>
                    <b>{{ t.name }}</b>
                    <span class="db-cols">{{ t.columns }} cols</span>
                  </header>
                  <p>{{ t.description }}</p>
                </article>
              }
            </div>
          </section>

          <section class="info-card">
            <header><h4>🔧 AppDbContext</h4></header>
            <pre class="code-block">{{ dbContextSnippet }}</pre>
          </section>
        </div>
      }

      @else if (active() === 'realtime') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Real-Time Infrastructure</h3>
              <p>SignalR hubs for instant communication</p>
            </div>
          </header>

          <section class="hubs-grid">
            @for (h of signalRHubs; track h.name) {
              <article class="hub-card" [style.--c]="h.color">
                <header>
                  <span class="hub-icon">{{ h.icon }}</span>
                  <b>{{ h.name }}</b>
                  <code class="hub-path">{{ h.path }}</code>
                </header>
                <p>{{ h.description }}</p>
                <div class="hub-events">
                  <span class="he-label">Server → Client events:</span>
                  <div class="he-list">
                    @for (e of h.serverEvents; track e) {
                      <span class="he-chip">{{ e }}</span>
                    }
                  </div>
                </div>
                <div class="hub-events">
                  <span class="he-label">Client → Server methods:</span>
                  <div class="he-list">
                    @for (m of h.clientMethods; track m) {
                      <span class="he-chip client">{{ m }}</span>
                    }
                  </div>
                </div>
                <footer class="hub-foot">
                  <span>🔌 WebSocket · SSE · Long Polling</span>
                  <button class="pill-sm" (click)="testHub(h)">Test connection</button>
                </footer>
              </article>
            }
          </section>

          <section class="info-card">
            <header><h4>⚡ SignalR client setup (Angular)</h4></header>
            <pre class="code-block">{{ signalRClientSetup }}</pre>
          </section>
        </div>
      }

      @else if (active() === 'security') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Security & Roles</h3>
              <p>Authentication, authorization, and safety systems</p>
            </div>
          </header>

          <div class="grid-2">
            <section class="info-card">
              <header><h4>🔐 Authentication</h4></header>
              <ul class="auth-list">
                @for (a of authMethods; track a.name) {
                  <li>
                    <span class="auth-icon">{{ a.icon }}</span>
                    <div>
                      <b>{{ a.name }}</b>
                      <small>{{ a.desc }}</small>
                    </div>
                    <span class="auth-status">{{ a.status }}</span>
                  </li>
                }
              </ul>
            </section>

            <section class="info-card">
              <header><h4>🛡 Roles</h4></header>
              <ul class="roles-list">
                @for (r of roles; track r.name) {
                  <li>
                    <span class="role-icon" [style.background]="r.color + '22'" [style.color]="r.color">{{ r.icon }}</span>
                    <div>
                      <b>{{ r.name }}</b>
                      <small>{{ r.desc }}</small>
                    </div>
                    <span class="role-count">{{ r.permissions }} perms</span>
                  </li>
                }
              </ul>
            </section>
          </div>

          <section class="info-card">
            <header><h4>🛡 Safety features</h4></header>
            <div class="safety-grid">
              @for (s of safetyFeatures; track s.name) {
                <div class="safety-card">
                  <span class="sf-icon">{{ s.icon }}</span>
                  <b>{{ s.name }}</b>
                  <small>{{ s.desc }}</small>
                </div>
              }
            </div>
          </section>

          <section class="info-card">
            <header><h4>🔒 JWT configuration</h4></header>
            <pre class="code-block">{{ jwtConfig }}</pre>
          </section>
        </div>
      }

      @else if (active() === 'setup') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Setup & Run Guide</h3>
              <p>From clone to running in 5 commands</p>
            </div>
          </header>

          <section class="setup-steps">
            @for (step of setupSteps; track step.num; let i = $index) {
              <article class="setup-step" [class.done]="setupProgress() > i" (click)="markSetupStep(i)">
                <span class="ss-num">{{ step.num }}</span>
                <div class="ss-body">
                  <b>{{ step.title }}</b>
                  <p>{{ step.desc }}</p>
                  @if (step.code) {
                    <pre class="ss-code">{{ step.code }}</pre>
                  }
                </div>
                <span class="ss-check" [class.done]="setupProgress() > i">{{ setupProgress() > i ? '✓' : '' }}</span>
              </article>
            }
          </section>

          <section class="info-card">
            <header><h4>🧪 Smoke test checklist</h4></header>
            <ul class="smoke-list">
              @for (t of smokeTests; track t.step) {
                <li>
                  <span class="smoke-num">{{ t.step }}</span>
                  <span class="smoke-page">{{ t.page }}</span>
                  <span class="smoke-check">{{ t.check }}</span>
                </li>
              }
            </ul>
          </section>

          <section class="info-card warn-card">
            <header><h4>⚠️ Important: Admin role setup</h4></header>
            <p>Some endpoints require <code>[Authorize(Roles = "Admin")]</code>. After registration, assign the role via SQL:</p>
            <pre class="code-block">{{ adminRoleSql }}</pre>
          </section>
        </div>
      }

      @if (selectedController(); as c) {
        <div class="modal-backdrop" (click)="selectedController.set(null)">
          <div class="modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon" [style.background]="c.color + '22'" [style.color]="c.color">{{ c.icon }}</span>
              <div>
                <h3>{{ c.name }}</h3>
                <p>{{ c.description }}</p>
              </div>
              <button class="modal-close" (click)="selectedController.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <table class="endpoint-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Route</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>Auth</th>
                    <th>Returns</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ep of c.endpoints; track ep.route + ep.method) {
                    <tr (click)="inspectEndpoint($event, ep)">
                      <td><span class="method-badge" [attr.data-m]="ep.method">{{ ep.method }}</span></td>
                      <td><code>{{ ep.route }}</code></td>
                      <td class="mono">{{ ep.action }}</td>
                      <td>{{ ep.description }}</td>
                      <td><span class="auth-badge" [class.public]="ep.auth === 'Anonymous'">{{ ep.auth }}</span></td>
                      <td><code class="returns">{{ ep.returns }}</code></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .view { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

    .hero-card {
      padding: 36px;
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
    .hero-content h1 { font-size: var(--fs-4xl); font-weight: 800; letter-spacing: -0.035em; margin-bottom: 14px; }
    .hero-lede { font-size: var(--fs-base); line-height: 1.65; color: var(--label-2); margin-bottom: 24px; max-width: 780px; }
    .hero-cta { display: flex; gap: 10px; flex-wrap: wrap; }
    .pill { padding: 9px 18px; background: var(--bg-fill-2); color: var(--label);
            border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600;
            transition: all var(--t-fast); cursor: pointer; }
    .pill:hover { background: var(--bg-fill-3); transform: translateY(-1px); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }
    .pill-sm { padding: 6px 12px; background: var(--bg-fill-2); color: var(--label);
               border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 600;
               transition: all var(--t-fast); }
    .pill-sm:hover { background: var(--bg-fill-3); }

    .hero-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 0.5px solid var(--separator);
    }
    @media (max-width: 720px) { .hero-stats { grid-template-columns: repeat(2, 1fr); } }
    .hs b { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em;
            font-variant-numeric: tabular-nums; display: block; }
    .hs small { font-size: var(--fs-2xs); color: var(--label-2);
                text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }

    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
    .stat-card { padding: 18px; background: var(--bg-surface-solid);
                 border: 0.5px solid var(--separator); border-radius: var(--r-md);
                 border-left: 3px solid var(--c); cursor: pointer;
                 transition: all var(--t-base); }
    .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .stat-icon { font-size: 22px; }
    .stat-val { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em;
                font-variant-numeric: tabular-nums; display: block; margin-top: 6px; }
    .stat-label { font-size: var(--fs-2xs); color: var(--label-2);
                  text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    .feature-map {
      padding: 24px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .fm-head { margin-bottom: 18px; }
    .fm-head h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .fm-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }
    .fm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .fm-card {
      padding: 16px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      border-left: 3px solid var(--c);
      cursor: pointer;
      transition: all var(--t-base);
    }
    .fm-card:hover { background: var(--bg-fill-3); transform: translateX(3px); }
    .fm-card header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .fm-icon { font-size: 20px; }
    .fm-card b { font-size: var(--fs-sm); font-weight: 700; flex: 1; }
    .fm-count { padding: 2px 8px; background: var(--bg-surface-solid); border-radius: var(--r-pill);
                font-size: 10px; font-weight: 700; font-variant-numeric: tabular-nums;
                color: var(--c); }
    .fm-controllers { display: flex; flex-wrap: wrap; gap: 4px; }
    .fm-chip {
      font-family: var(--sf-mono);
      font-size: 10px;
      padding: 2px 8px;
      background: var(--bg-surface-solid);
      border-radius: var(--r-pill);
      color: var(--label-2);
    }
    .fm-chip.more { color: var(--accent); font-weight: 700; }

    .info-card {
      padding: 24px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .info-card > header { margin-bottom: 16px; }
    .info-card > header h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .info-card.warn-card { border-left: 3px solid #ff9500; background: rgba(255,149,0,0.04); }
    .info-card.warn-card p { font-size: var(--fs-sm); color: var(--label-2); line-height: 1.6; margin-bottom: 12px; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 820px) { .grid-2 { grid-template-columns: 1fr; } }

    .arch-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
    .arch-list li { display: flex; gap: 12px; align-items: flex-start; }
    .arch-icon {
      width: 36px; height: 36px;
      display: grid; place-items: center;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: var(--r-sm);
      font-size: 16px;
      flex-shrink: 0;
    }
    .arch-list b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .arch-list small { font-size: var(--fs-2xs); color: var(--label-2); }

    .pkg-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .pkg-list li { display: flex; justify-content: space-between; align-items: center;
                   gap: 12px; padding: 8px 12px; background: var(--bg-fill-2);
                   border-radius: var(--r-xs); }
    .pkg-list code { font-family: var(--sf-mono); font-size: var(--fs-2xs);
                     color: var(--label); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pkg-version { font-family: var(--sf-mono); font-size: 10px; color: var(--accent);
                   font-weight: 700; flex-shrink: 0; }

    .tree, .code-block {
      padding: 18px 20px;
      background: var(--bg-code);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-sm);
      font-family: var(--sf-mono);
      font-size: var(--fs-2xs);
      line-height: 1.65;
      color: var(--label);
      overflow-x: auto;
      white-space: pre;
    }

    .view-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
    .view-head h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .view-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }
    .view-toggle { display: flex; gap: 2px; padding: 3px; background: var(--bg-fill-2);
                   border-radius: var(--r-sm); }
    .vt { width: 34px; height: 34px; display: grid; place-items: center;
          border-radius: calc(var(--r-sm) - 4px); color: var(--label-2);
          font-size: 14px; transition: all var(--t-fast); cursor: pointer; }
    .vt:hover { color: var(--label); }
    .vt.active { background: var(--bg-surface-solid); color: var(--label);
                 box-shadow: var(--shadow-xs); }

    .endpoint-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .mf {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      font-size: var(--fs-xs);
      font-weight: 600;
      color: var(--label-2);
      transition: all var(--t-fast);
      cursor: pointer;
      border-left: 3px solid var(--c, transparent);
    }
    .mf:hover { background: var(--bg-fill-3); color: var(--label); }
    .mf.active { background: var(--accent); color: var(--accent-contrast); }
    .mf-icon { font-size: 13px; }
    .mf-badge { font-family: var(--sf-mono); font-size: 10px; font-weight: 800;
                padding: 2px 7px; border-radius: var(--r-pill); background: var(--bg-fill-3);
                color: var(--label); }
    .mf.active .mf-badge { background: rgba(255,255,255,0.25); color: #fff; }
    .mf-count { font-variant-numeric: tabular-nums; }

    .feature-block {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      border-left: 4px solid var(--c);
    }
    .fb-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .fb-icon { font-size: 24px; }
    .fb-head h4 { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.015em; }
    .fb-head small { font-size: var(--fs-2xs); color: var(--label-2); display: block; margin-top: 2px; }
    .fb-controllers { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
    .ctrl-card {
      padding: 14px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      cursor: pointer;
      transition: all var(--t-base);
    }
    .ctrl-card:hover { background: var(--bg-fill-3); transform: translateY(-2px);
                       box-shadow: var(--shadow-md); }
    .ctrl-card header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .cc-icon { font-size: 20px; }
    .ctrl-card header > div { flex: 1; min-width: 0; }
    .ctrl-card b { font-size: var(--fs-xs); font-weight: 700; display: block;
                   overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ctrl-card small { font-size: 10px; color: var(--label-2); line-height: 1.4;
                       display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
                       overflow: hidden; }
    .cc-count { font-family: var(--sf-mono); font-size: 11px; font-weight: 800;
                padding: 2px 8px; background: var(--bg-surface-solid); border-radius: var(--r-pill);
                color: var(--c); }
    .cc-endpoints { list-style: none; display: flex; flex-direction: column; gap: 4px; }
    .cc-endpoints li { display: flex; align-items: center; gap: 8px; font-size: 10px;
                       font-family: var(--sf-mono); color: var(--label-2);
                       padding: 3px 6px; background: var(--bg-surface-solid);
                       border-radius: var(--r-xs); overflow: hidden; }
    .cc-endpoints li code { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
    .cc-endpoints li.more { justify-content: center; color: var(--accent);
                            font-weight: 700; font-family: inherit; font-size: 10px; }

    .method-badge { display: inline-block; font-family: var(--sf-mono); font-size: 9px;
                    font-weight: 800; padding: 2px 7px; border-radius: var(--r-pill);
                    color: #fff; text-align: center; min-width: 50px; flex-shrink: 0; }
    .method-badge[data-m='GET']    { background: #007aff; }
    .method-badge[data-m='POST']   { background: #34c759; }
    .method-badge[data-m='PUT']    { background: #ff9500; }
    .method-badge[data-m='PATCH']  { background: #af52de; }
    .method-badge[data-m='DELETE'] { background: #ff3b30; }

    .auth-badge { display: inline-block; padding: 3px 8px;
                  background: rgba(255, 149, 0, 0.15); color: #ff9500;
                  border-radius: var(--r-pill); font-size: 9px; font-weight: 700;
                  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .auth-badge.public { background: rgba(52, 199, 89, 0.15); color: #34c759; }

    .controller-list { display: flex; flex-direction: column; gap: 8px; }
    .ctrl-row { background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
                border-radius: var(--r-md); overflow: hidden; }
    .cr-head { display: flex; align-items: center; gap: 12px; padding: 14px 18px;
               cursor: pointer; transition: background var(--t-fast); }
    .cr-head:hover { background: var(--bg-hover); }
    .cr-icon { width: 36px; height: 36px; display: grid; place-items: center;
               border-radius: var(--r-sm); font-size: 16px; flex-shrink: 0; }
    .cr-head > div { flex: 1; min-width: 0; }
    .cr-head b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .cr-head small { font-size: var(--fs-2xs); color: var(--label-2); }
    .cr-count { font-family: var(--sf-mono); font-size: 11px; font-weight: 700;
                padding: 3px 10px; background: var(--bg-fill-2); border-radius: var(--r-pill);
                color: var(--label-2); }
    .cr-chev { color: var(--label-3); font-size: 14px; transition: transform var(--t-base); }
    .cr-chev.open { transform: rotate(180deg); }
    .cr-body { border-top: 0.5px solid var(--separator); background: var(--bg-fill-2); }
    .ep-row {
      display: grid;
      grid-template-columns: 60px 1.4fr 140px 1fr 100px 1.4fr;
      gap: 12px;
      padding: 10px 18px;
      align-items: center;
      font-size: 11px;
      cursor: pointer;
      transition: background var(--t-fast);
      border-top: 0.5px solid var(--separator);
    }
    @media (max-width: 1100px) {
      .ep-row { grid-template-columns: 60px 1.4fr 1fr 100px; }
      .ep-row > *:nth-child(3), .ep-row > *:nth-child(6) { display: none; }
    }
    .ep-row:first-child { border-top: 0; }
    .ep-row:hover { background: var(--bg-hover); }
    .ep-row .route { color: var(--accent); font-weight: 600; overflow: hidden;
                     text-overflow: ellipsis; white-space: nowrap; font-family: var(--sf-mono); }
    .ep-action { font-family: var(--sf-mono); color: var(--label-2);
                 overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ep-desc { color: var(--label); line-height: 1.4; font-size: 11px;
               overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ep-returns { font-family: var(--sf-mono); color: #34c759; font-weight: 600;
                  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .component-group {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .cg-head { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .cg-icon { font-size: 20px; }
    .cg-head h4 { font-size: var(--fs-lg); font-weight: 700; flex: 1; }
    .cg-count { padding: 2px 10px; background: var(--bg-fill-2); border-radius: var(--r-pill);
                font-size: 11px; font-weight: 700; color: var(--label-2); }
    .cg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .comp-card {
      padding: 14px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      cursor: pointer;
      transition: all var(--t-base);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .comp-card:hover { background: var(--bg-fill-3); transform: translateY(-2px); }
    .comp-card header { display: flex; align-items: center; gap: 8px; }
    .comp-icon { font-size: 18px; }
    .comp-card b { font-size: var(--fs-xs); font-weight: 700; }
    .comp-card p { font-size: 10px; color: var(--label-2); line-height: 1.45; }
    .comp-endpoints { display: flex; flex-wrap: wrap; gap: 3px; padding-top: 8px;
                      border-top: 0.5px solid var(--separator); }
    .comp-endpoint-chip { font-family: var(--sf-mono); font-size: 9px; padding: 2px 6px;
                          background: var(--bg-surface-solid); border-radius: var(--r-pill);
                          color: var(--accent); }

    .db-group {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .dg-head { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .dg-icon { font-size: 20px; }
    .dg-head h4 { font-size: var(--fs-lg); font-weight: 700; flex: 1; }
    .dg-count { padding: 2px 10px; background: var(--bg-fill-2); border-radius: var(--r-pill);
                font-size: 11px; font-weight: 700; color: var(--label-2); }
    .db-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .db-card { padding: 16px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .db-card header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .db-icon { font-size: 18px; }
    .db-card b { font-size: var(--fs-sm); font-weight: 700; flex: 1; }
    .db-cols { padding: 2px 9px; background: var(--accent-soft); color: var(--accent);
               border-radius: var(--r-pill); font-size: 10px; font-weight: 700; }
    .db-card p { font-size: var(--fs-2xs); color: var(--label-2); line-height: 1.5; }

    .hubs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }
    .hub-card {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      border-left: 3px solid var(--c);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .hub-card header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .hub-icon { font-size: 22px; }
    .hub-card b { font-size: var(--fs-base); font-weight: 700; }
    .hub-path { font-family: var(--sf-mono); font-size: 10px; padding: 3px 8px;
                background: var(--bg-fill-2); border-radius: var(--r-pill); color: var(--c); }
    .hub-card > p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5; }
    .hub-events { display: flex; flex-direction: column; gap: 6px; }
    .he-label { font-size: 10px; font-weight: 800; text-transform: uppercase;
                letter-spacing: 0.06em; color: var(--label-3); }
    .he-list { display: flex; flex-wrap: wrap; gap: 4px; }
    .he-chip { font-family: var(--sf-mono); font-size: 10px; padding: 3px 9px;
               background: var(--bg-fill-2); border-radius: var(--r-pill); color: var(--label); }
    .he-chip.client { background: var(--accent-soft); color: var(--accent); }
    .hub-foot { display: flex; justify-content: space-between; align-items: center;
                padding-top: 12px; border-top: 0.5px solid var(--separator);
                font-size: 10px; color: var(--label-3); }

    .auth-list, .roles-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
    .auth-list li, .roles-list li { display: flex; gap: 12px; align-items: center; }
    .auth-icon, .role-icon {
      width: 36px; height: 36px;
      display: grid; place-items: center;
      border-radius: var(--r-sm);
      font-size: 16px;
      flex-shrink: 0;
      background: var(--accent-soft);
      color: var(--accent);
    }
    .auth-list li > div, .roles-list li > div { flex: 1; min-width: 0; }
    .auth-list b, .roles-list b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .auth-list small, .roles-list small { font-size: var(--fs-2xs); color: var(--label-2); }
    .auth-status { font-size: 10px; font-weight: 700; padding: 3px 10px;
                   background: rgba(52, 199, 89, 0.15); color: #34c759;
                   border-radius: var(--r-pill); }
    .role-count { font-size: 10px; font-weight: 700; padding: 3px 10px;
                  background: var(--bg-fill-2); color: var(--label-2);
                  border-radius: var(--r-pill); }

    .safety-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .safety-card { padding: 14px; background: var(--bg-fill-2); border-radius: var(--r-sm);
                   display: flex; flex-direction: column; gap: 6px; }
    .sf-icon { font-size: 22px; }
    .safety-card b { font-size: var(--fs-xs); font-weight: 700; }
    .safety-card small { font-size: 10px; color: var(--label-2); line-height: 1.4; }

    .setup-steps { display: flex; flex-direction: column; gap: 10px; }
    .setup-step {
      display: grid;
      grid-template-columns: 44px 1fr 40px;
      gap: 16px;
      padding: 16px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      cursor: pointer;
      transition: all var(--t-base);
    }
    .setup-step:hover { border-color: var(--accent); }
    .setup-step.done { opacity: 0.7; }
    .ss-num {
      width: 44px; height: 44px;
      display: grid; place-items: center;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: 50%;
      font-size: var(--fs-base);
      font-weight: 800;
    }
    .ss-body b { font-size: var(--fs-base); font-weight: 700; display: block; margin-bottom: 4px; }
    .ss-body p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5; margin-bottom: 8px; }
    .ss-code {
      padding: 12px 14px;
      background: var(--bg-code);
      border-radius: var(--r-sm);
      font-family: var(--sf-mono);
      font-size: var(--fs-2xs);
      line-height: 1.6;
      color: var(--label);
      overflow-x: auto;
      white-space: pre;
      margin: 0;
    }
    .ss-check {
      width: 28px; height: 28px;
      display: grid; place-items: center;
      border-radius: 50%;
      border: 2px solid var(--separator);
      font-size: 14px;
      font-weight: 800;
      transition: all var(--t-base);
    }
    .ss-check.done { background: #34c759; border-color: #34c759; color: #fff; }

    .smoke-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .smoke-list li { display: grid; grid-template-columns: 40px 200px 1fr; gap: 16px;
                     align-items: center; padding: 12px 16px;
                     background: var(--bg-fill-2); border-radius: var(--r-sm); font-size: var(--fs-xs); }
    .smoke-num { width: 28px; height: 28px; display: grid; place-items: center;
                 background: var(--accent); color: var(--accent-contrast);
                 border-radius: 50%; font-size: 11px; font-weight: 800; }
    .smoke-page { font-family: var(--sf-mono); color: var(--accent); font-weight: 600; }
    .smoke-check { color: var(--label-2); line-height: 1.5; }

    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(8px);
      z-index: 9990;
      display: grid; place-items: center;
      padding: 40px 20px;
      animation: fadeIn 200ms var(--ease-out);
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal {
      max-width: 1200px;
      width: 100%;
      max-height: 85vh;
      background: var(--bg-elevated);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
      box-shadow: var(--shadow-xl);
      display: flex; flex-direction: column;
      overflow: hidden;
      animation: modalIn 300ms var(--ease-spring);
    }
    @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .modal-head { display: flex; align-items: center; gap: 14px; padding: 20px 24px;
                  border-bottom: 0.5px solid var(--separator); }
    .modal-icon { width: 48px; height: 48px; display: grid; place-items: center;
                  border-radius: var(--r-md); font-size: 22px; flex-shrink: 0; }
    .modal-head > div { flex: 1; }
    .modal-head h3 { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.015em; }
    .modal-head p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 2px; }
    .modal-close { width: 32px; height: 32px; display: grid; place-items: center;
                   border-radius: var(--r-xs); color: var(--label-3);
                   font-size: 16px; transition: all var(--t-fast); cursor: pointer; }
    .modal-close:hover { background: var(--bg-hover); color: var(--label); }
    .modal-body { flex: 1; overflow-y: auto; padding: 20px 24px; }
    .endpoint-table { width: 100%; border-collapse: collapse; font-size: var(--fs-xs); }
    .endpoint-table th { text-align: left; padding: 10px 12px; background: var(--bg-fill-2);
                         font-size: 10px; font-weight: 800; text-transform: uppercase;
                         letter-spacing: 0.06em; color: var(--label-3);
                         border-bottom: 0.5px solid var(--separator); position: sticky; top: 0; }
    .endpoint-table td { padding: 10px 12px; border-bottom: 0.5px solid var(--separator); }
    .endpoint-table tr { cursor: pointer; transition: background var(--t-fast); }
    .endpoint-table tr:hover td { background: var(--bg-hover); }
    .endpoint-table td code { font-family: var(--sf-mono); font-size: 10px; color: var(--accent); }
    .endpoint-table td.returns code { color: #34c759; font-weight: 600; }
  `],
})
export class OmniSocialPreviewComponent {
  private menu = inject(ContextMenuService);
  private toast = inject(ToastService);

  readonly totalControllers = TOTAL_CONTROLLERS;
  readonly totalEndpoints = TOTAL_ENDPOINTS;
  readonly features = OMNISOCIAL_FEATURES;

  readonly active = signal('overview');
  readonly endpointView = signal<'features' | 'controllers'>('features');
  readonly featureFilter = signal<string>('all');
  readonly searchQuery = signal('');
  readonly expandedControllers = signal<string[]>([]);
  readonly selectedController = signal<OsController | null>(null);
  readonly setupProgress = signal(0);

  readonly nav = computed<PreviewNavItem[]>(() => [
    { id: 'overview', label: 'Overview', icon: '📋', group: 'Project' },
    { id: 'flows', label: 'Demo Flows', icon: '🎬', badge: getFlowsFor('omnisocial').length, group: 'Project' },
    { id: 'endpoints', label: 'Endpoints', icon: '🔌', badge: this.totalControllers, group: 'API' },
    { id: 'components', label: 'Components', icon: '🧩', group: 'API' },
    { id: 'database', label: 'Database', icon: '🗄', group: 'API' },
    { id: 'realtime', label: 'Real-Time', icon: '📡', group: 'Systems' },
    { id: 'security', label: 'Security', icon: '🛡', group: 'Systems' },
    { id: 'setup', label: 'Setup Guide', icon: '🚀', group: 'Systems' },
  ]);

  readonly toolbar = computed<ToolbarAction[]>(() => [
    { id: 'refresh', label: 'Refresh', icon: '⟳', action: () => this.toast.success('Data refreshed') },
    { id: 'docs', label: 'Docs', icon: '📖', action: () => this.toast.info('README.md opened') },
    { id: 'run', label: 'Run demo', icon: '▶', primary: true, action: () => this.active.set('flows') },
  ]);

  readonly notifs = signal<PreviewNotification[]>([
    { id: 1, icon: '🌐', title: '71 controllers ready', body: 'All endpoints documented', time: '2m' },
    { id: 2, icon: '📡', title: '6 SignalR hubs active', body: 'WebSocket connections healthy', time: '8m' },
    { id: 3, icon: '🧠', title: 'AI features online', body: 'Smart search + suggestions running', time: '1h' },
    { id: 4, icon: '🛡', title: 'Security scan passed', body: 'No vulnerabilities found', time: '3h' },
  ]);

  readonly searchPlaceholder = computed(() =>
    this.active() === 'endpoints' ? 'Search routes, actions, descriptions…' : ''
  );

  readonly kpis = [
    { icon: '🎮', label: 'Controllers', value: '71', color: '#007aff', featureId: 'posts' },
    { icon: '🔌', label: 'Endpoints', value: '525', color: '#34c759', featureId: 'posts' },
    { icon: '🧩', label: 'Components', value: '180+', color: '#af52de', featureId: 'posts' },
    { icon: '📡', label: 'SignalR Hubs', value: '6', color: '#ff9500', featureId: 'messages' },
  ];

  readonly architecture = [
    { label: 'API Layer', desc: '71 controllers with attribute routing', icon: '🎮' },
    { label: 'Service Layer', desc: 'Business logic + AI integrations', icon: '⚙️' },
    { label: 'Repository', desc: 'Generic Repository + UnitOfWork', icon: '🗄' },
    { label: 'SignalR Hubs', desc: 'Real-time bidirectional communication', icon: '📡' },
    { label: 'Background Jobs', desc: 'Hangfire for scheduled tasks', icon: '⏰' },
    { label: 'Identity', desc: 'JWT + Google OAuth + Refresh tokens', icon: '🔐' },
  ];

  readonly packages = [
    { name: 'Microsoft.EntityFrameworkCore.SqlServer', version: '9.0.0' },
    { name: 'Microsoft.AspNetCore.Identity.EntityFrameworkCore', version: '9.0.0' },
    { name: 'Microsoft.AspNetCore.Authentication.JwtBearer', version: '9.0.0' },
    { name: 'Microsoft.AspNetCore.SignalR', version: '9.0.0' },
    { name: 'Hangfire.AspNetCore', version: '1.8.17' },
    { name: 'Google.Apis.Auth', version: '1.68.0' },
    { name: 'MediatR', version: '12.4.1' },
    { name: 'FluentValidation', version: '11.10.0' },
    { name: 'AutoMapper', version: '14.0.0' },
    { name: 'Serilog.AspNetCore', version: '8.0.3' },
    { name: 'QuestPDF', version: '2024.12.0' },
    { name: 'ClosedXML', version: '0.104.0' },
  ];

  readonly solutionTree = `OmniSocial/
├── OmniSocial.API/                    # Controllers, Hubs, Middleware
│   ├── Controllers/
│   │   ├── Posts/                     # 8 controllers
│   │   ├── Feed/                      # 4 controllers
│   │   ├── Stories/                   # 5 controllers
│   │   ├── Live/                      # 6 controllers
│   │   ├── Messages/                  # 7 controllers
│   │   ├── Profiles/                  # 6 controllers
│   │   ├── Social/                    # 8 controllers
│   │   ├── Bookmarks/                 # 4 controllers
│   │   ├── Analytics/                 # 6 controllers
│   │   ├── AI/                        # 7 controllers
│   │   ├── Safety/                    # 5 controllers
│   │   ├── Gamification/              # 4 controllers
│   │   └── Admin/                     # 3 controllers
│   ├── Hubs/                          # 6 SignalR hubs
│   ├── Middleware/                    # JWT, Logging, Rate limiting
│   └── Program.cs
├── OmniSocial.Application/            # Services, DTOs, Interfaces
│   ├── Services/
│   ├── DTOs/
│   ├── Validators/
│   └── Mapping/
├── OmniSocial.Domain/                 # Entities, Value Objects
│   ├── Entities/                      # 45+ entities
│   ├── Enums/
│   └── Interfaces/
├── OmniSocial.Infrastructure/         # EF Core, Repos, External
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   └── Configurations/
│   ├── Repositories/
│   ├── External/                      # Google, Email, Storage
│   └── Migrations/
└── OmniSocial.Tests/                  # xUnit, Moq, FluentAssertions
    ├── Unit/
    ├── Integration/
    └── Functional/`;

  readonly componentKpis = [
    { icon: '🧩', label: 'Components', value: '180+', color: '#af52de' },
    { icon: '📄', label: 'Pages/Routes', value: '64', color: '#007aff' },
    { icon: '🔌', label: 'Services', value: '42', color: '#34c759' },
    { icon: '📡', label: 'SignalR clients', value: '6', color: '#ff9500' },
  ];

  readonly componentGroups = [
    {
      name: 'Posts & Publishing', icon: '📝',
      components: [
        { icon: '✍️', name: 'PostComposerComponent', desc: 'Multi-platform post editor with live preview', uses: ['POST /api/posts', 'POST /api/media/upload'] },
        { icon: '🎨', name: 'PlatformPickerComponent', desc: 'Twitter/IG/TikTok toggle with preview', uses: ['GET /api/posts/compose-options'] },
        { icon: '🖼️', name: 'MediaUploaderComponent', desc: 'Drag-drop with progress and thumbnails', uses: ['POST /api/media/upload'] },
        { icon: '🔍', name: 'DuplicateDetectorComponent', desc: 'Pre-post duplicate check', uses: ['POST /api/duplicatedetector/check'] },
        { icon: '✨', name: 'PostQualityIndicatorComponent', desc: 'AI quality score meter', uses: ['POST /api/postquality/analyze'] },
        { icon: '📊', name: 'PollCreatorInlineComponent', desc: 'Attach poll to post', uses: ['POST /api/polls'] },
        { icon: '⚠️', name: 'ContentWarningPickerComponent', desc: 'Attach warnings', uses: ['POST /api/contentwarnings'] },
      ],
    },
    {
      name: 'Feed & Discovery', icon: '📰',
      components: [
        { icon: '📱', name: 'UnifiedFeedComponent', desc: 'Main feed with filters', uses: ['GET /api/feed'] },
        { icon: '📊', name: 'FeedTabsComponent', desc: 'For You / Following / Trending', uses: ['GET /api/feed/following', 'GET /api/feed/trending'] },
        { icon: '🎯', name: 'PlatformFilterComponent', desc: 'Twitter/IG/TikTok filter chips', uses: ['GET /api/feed/platform/{name}'] },
        { icon: '🔥', name: 'HashtagTrendingComponent', desc: 'Trending hashtags sidebar', uses: ['GET /api/hashtags/trending'] },
      ],
    },
    {
      name: 'Stories & Reels', icon: '📸',
      components: [
        { icon: '📸', name: 'StoryCarouselComponent', desc: 'Horizontal story viewer', uses: ['GET /api/stories'] },
        { icon: '🎬', name: 'StoryUploadComponent', desc: 'Upload + music picker', uses: ['POST /api/stories'] },
        { icon: '👁️', name: 'StoryViewersListComponent', desc: 'Viewers list (owner only)', uses: ['GET /api/stories/{id}/viewers'] },
        { icon: '🎵', name: 'MusicPickerComponent', desc: 'Track search + preview', uses: ['GET /api/music/search'] },
      ],
    },
    {
      name: 'Live & Real-Time', icon: '📡',
      components: [
        { icon: '🎥', name: 'LiveStreamLobbyComponent', desc: 'Discover active streams', uses: ['GET /api/livestreams/active'] },
        { icon: '🔴', name: 'LiveStudioComponent', desc: 'Broadcaster studio with overlays', uses: ['POST /api/livestudio/{id}/overlay'] },
        { icon: '💬', name: 'LiveChatOverlayComponent', desc: 'Real-time chat during stream', uses: ['POST /api/livestreams/{id}/chat'] },
        { icon: '🎨', name: 'OverlayCanvasComponent', desc: 'Drawing + emoji + filters', uses: ['POST /api/livestudio/{id}/overlay'] },
      ],
    },
    {
      name: 'Messages & Calls', icon: '💬',
      components: [
        { icon: '📥', name: 'InboxComponent', desc: 'DM conversation list', uses: ['GET /api/directmessages/inbox'] },
        { icon: '💬', name: 'ChatWindowComponent', desc: 'Real-time messaging', uses: ['GET /api/directmessages/{userId}', 'POST /api/directmessages'] },
        { icon: '📞', name: 'IncomingCallModalComponent', desc: 'Answer/reject incoming call', uses: ['POST /api/calls/{id}/answer'] },
        { icon: '🎥', name: 'VideoCallComponent', desc: 'WebRTC video call UI', uses: ['POST /api/calls/initiate'] },
        { icon: '📞', name: 'MissedCallsComponent', desc: 'Missed calls list', uses: ['GET /api/calls/missed'] },
      ],
    },
    {
      name: 'Profiles & Identity', icon: '👤',
      components: [
        { icon: '👤', name: 'PlatformProfileComponent', desc: 'Twitter/IG/TikTok profile view', uses: ['GET /api/profiles/{userId}/{platform}'] },
        { icon: '🎭', name: 'UnifiedProfileComponent', desc: 'All platforms in one view', uses: ['GET /api/profiles/my'] },
        { icon: '🖼️', name: 'AvatarUploaderComponent', desc: 'Avatar upload + crop', uses: ['POST /api/profiles/avatar'] },
        { icon: '🔔', name: 'NotificationBellComponent', desc: 'Notification dropdown', uses: ['GET /api/notifications'] },
        { icon: '🔔', name: 'SmartNotificationsCenterComponent', desc: 'AI-grouped notifications', uses: ['GET /api/smartnotifications'] },
      ],
    },
    {
      name: 'Social Graph', icon: '🕸',
      components: [
        { icon: '➕', name: 'FollowButtonComponent', desc: 'Follow/unfollow with animation', uses: ['POST /api/follows/{userId}', 'DELETE /api/follows/{userId}'] },
        { icon: '👥', name: 'FollowersListComponent', desc: 'Followers/following tabs', uses: ['GET /api/follows/followers', 'GET /api/follows/following'] },
        { icon: '🚫', name: 'BlockUserButtonComponent', desc: 'Block with confirm', uses: ['POST /api/blocks'] },
        { icon: '🔇', name: 'MuteUserButtonComponent', desc: 'Mute without unfollow', uses: ['POST /api/mutedusers'] },
        { icon: '⭐', name: 'ImportantPeopleListComponent', desc: 'Priority accounts', uses: ['GET /api/importantpeople'] },
      ],
    },
    {
      name: 'Bookmarks & Collections', icon: '🔖',
      components: [
        { icon: '🔖', name: 'BookmarkButtonComponent', desc: 'Save/unsave with toast', uses: ['POST /api/bookmarks/{postId}'] },
        { icon: '📚', name: 'CollectionsListComponent', desc: 'Custom collections', uses: ['GET /api/collections'] },
        { icon: '🎨', name: 'CollectionDetailComponent', desc: 'Collection items + manage', uses: ['GET /api/collections/{id}/items'] },
        { icon: '🧠', name: 'SmartCollectionsGroupedComponent', desc: 'AI-grouped bookmarks', uses: ['GET /api/smartcollections/grouped'] },
      ],
    },
    {
      name: 'AI & Smart Features', icon: '🤖',
      components: [
        { icon: '🔍', name: 'SmartSearchAssistantComponent', desc: 'Natural language search', uses: ['POST /api/smartsearchassistant/ask'] },
        { icon: '💾', name: 'SavedSearchesListComponent', desc: 'Save + replay searches', uses: ['GET /api/savedsearch'] },
        { icon: '🖼️', name: 'AltTextGeneratorComponent', desc: 'AI alt text for images', uses: ['POST /api/alttext/generate'] },
        { icon: '🔮', name: 'FutureRoutePredictionComponent', desc: 'Best posting time chart', uses: ['GET /api/futurerouteprediction/best-posting-time'] },
      ],
    },
    {
      name: 'Analytics & Insights', icon: '📊',
      components: [
        { icon: '📈', name: 'AnalyticsDashboardComponent', desc: 'Charts + KPIs', uses: ['GET /api/analytics/overview'] },
        { icon: '👣', name: 'ProfileVisitsWidgetComponent', desc: 'Recent visitors', uses: ['GET /api/profilevisits'] },
        { icon: '⏰', name: 'TimeMachineComponent', desc: 'Historical feed browser', uses: ['GET /api/socialtimemachine/{date}'] },
        { icon: '💚', name: 'SocialHealthDashboardComponent', desc: 'Wellbeing metrics', uses: ['GET /api/socialhealthdashboard'] },
        { icon: '📊', name: 'UsageSummaryComponent', desc: 'Time tracking insights', uses: ['GET /api/usagetracking/summary'] },
      ],
    },
    {
      name: 'Safety & Moderation', icon: '🛡',
      components: [
        { icon: '🚩', name: 'ReportModalComponent', desc: 'Report post/user', uses: ['POST /api/reports'] },
        { icon: '🌙', name: 'QuietHoursSettingsComponent', desc: 'DND schedule', uses: ['PUT /api/quiethours'] },
        { icon: '⚠️', name: 'ContentWarningBadgeComponent', desc: 'Warning overlay on post', uses: ['GET /api/contentwarnings/{postId}'] },
      ],
    },
    {
      name: 'Gamification', icon: '🏆',
      components: [
        { icon: '🔥', name: 'StreaksLeaderboardComponent', desc: 'Top posting streaks', uses: ['GET /api/postingstreaks/leaderboard'] },
        { icon: '⭐', name: 'KarmaLeaderboardComponent', desc: 'Karma ranking', uses: ['GET /api/karma/leaderboard'] },
        { icon: '📸', name: 'MemoriesCountBadgeComponent', desc: 'Memories badge count', uses: ['GET /api/memories/count'] },
        { icon: '🧩', name: 'SocialPuzzleWidgetComponent', desc: 'Shared interests game', uses: ['GET /api/socialpuzzle/shared-interests-now'] },
      ],
    },
    {
      name: 'Music & TikTok', icon: '🎵',
      components: [
        { icon: '🎵', name: 'MusicSearchComponent', desc: 'Track library search', uses: ['GET /api/music/search'] },
        { icon: '🎬', name: 'TikTokFeedComponent', desc: 'Vertical reel player', uses: ['GET /api/tiktokfeed/trending'] },
        { icon: '🔍', name: 'TikTokFeedFiltersComponent', desc: 'Following/Trending/Hashtag tabs', uses: ['GET /api/tiktokfeed/following'] },
      ],
    },
    {
      name: 'Misc Features', icon: '✨',
      components: [
        { icon: '🎛', name: 'PostRemixesDisplayComponent', desc: 'Remixes of a post', uses: ['GET /api/postremix/of/{postId}'] },
        { icon: '🤝', name: 'CoAuthorsDisplayComponent', desc: 'Collab post authors', uses: ['GET /api/collabposts/{id}/coauthors'] },
        { icon: '📜', name: 'PostEditHistoryBadgeComponent', desc: 'Was edited indicator', uses: ['GET /api/postedithistory/post/{postId}/was-edited'] },
        { icon: '↗', name: 'SharesActionsMenuComponent', desc: 'Share actions menu', uses: ['POST /api/shares', 'POST /api/shares/{id}/publish-now'] },
        { icon: '🤫', name: 'AnonymousConfessionsFeedComponent', desc: 'Anonymous posts', uses: ['GET /api/anonymousconfessions'] },
        { icon: '💭', name: 'CommentThreadComponent', desc: 'Threaded comments', uses: ['GET /api/comments/{postId}', 'POST /api/comments'] },
      ],
    },
  ];

  readonly dbTables = [
    { name: 'AspNetUsers', columns: 22, description: 'Extended with Bio, AvatarPath, GoogleId', group: 'identity', icon: '👤' },
    { name: 'AspNetRoles', columns: 4, description: 'Admin, Moderator, Creator, User', group: 'identity', icon: '🎭' },
    { name: 'AspNetUserRoles', columns: 2, description: 'User-Role mapping', group: 'identity', icon: '🔗' },
    { name: 'AspNetUserClaims', columns: 4, description: 'Custom claims', group: 'identity', icon: '🎫' },
    { name: 'AspNetUserTokens', columns: 5, description: 'Refresh tokens', group: 'identity', icon: '🎟' },
    { name: 'Posts', columns: 18, description: 'Text, Design, Type, Status, AuthorId, Stats', group: 'core', icon: '📝' },
    { name: 'PlatformPosts', columns: 8, description: 'Per-platform variant (Twitter/IG/TikTok)', group: 'core', icon: '📱' },
    { name: 'Stories', columns: 10, description: '24h ephemeral content with music', group: 'core', icon: '📸' },
    { name: 'Reels', columns: 12, description: 'Short-form videos with TikTok-style', group: 'core', icon: '🎬' },
    { name: 'LiveStreams', columns: 14, description: 'Live sessions with WebRTC tokens', group: 'core', icon: '📡' },
    { name: 'LiveStreamParticipants', columns: 6, description: 'Viewers who joined', group: 'core', icon: '👥' },
    { name: 'LiveOverlays', columns: 7, description: 'Drawing/emoji/filter overlays', group: 'core', icon: '🎨' },
    { name: 'DirectMessages', columns: 9, description: 'DM conversations + read receipts', group: 'core', icon: '💬' },
    { name: 'Calls', columns: 11, description: 'Voice/video call records', group: 'core', icon: '📞' },
    { name: 'PlatformProfiles', columns: 9, description: 'Twitter/IG/TikTok handle + bio', group: 'core', icon: '🎭' },
    { name: 'Follows', columns: 4, description: 'Follower graph', group: 'core', icon: '➕' },
    { name: 'Blocks', columns: 4, description: 'Blocked users', group: 'core', icon: '🚫' },
    { name: 'MutedUsers', columns: 4, description: 'Muted accounts', group: 'core', icon: '🔇' },
    { name: 'Hashtags', columns: 5, description: 'Tag with usage counter', group: 'core', icon: '#️⃣' },
    { name: 'HashtagPosts', columns: 2, description: 'Post-Hashtag join', group: 'core', icon: '🔗' },
    { name: 'Bookmarks', columns: 4, description: 'Saved posts', group: 'core', icon: '🔖' },
    { name: 'Collections', columns: 5, description: 'Custom bookmark folders', group: 'core', icon: '📚' },
    { name: 'CollectionItems', columns: 4, description: 'Collection-post mapping', group: 'core', icon: '🔗' },
    { name: 'Comments', columns: 9, description: 'Threaded comments', group: 'core', icon: '💭' },
    { name: 'Polls', columns: 6, description: 'Post-attached polls', group: 'core', icon: '📊' },
    { name: 'PollVotes', columns: 5, description: 'Vote records', group: 'core', icon: '🗳' },
    { name: 'Notifications', columns: 8, description: 'All notifications', group: 'core', icon: '🔔' },
    { name: 'Reports', columns: 8, description: 'Content reports + moderation', group: 'core', icon: '🚩' },
    { name: 'ContentWarnings', columns: 4, description: 'Warning tags', group: 'core', icon: '⚠️' },
    { name: 'Shares', columns: 8, description: 'Scheduled cross-posts', group: 'core', icon: '↗' },
    { name: 'PostRemixes', columns: 5, description: 'Remix relationships', group: 'core', icon: '🎛' },
    { name: 'CollabPosts', columns: 5, description: 'Multi-author posts', group: 'core', icon: '🤝' },
    { name: 'PostEditHistory', columns: 7, description: 'Full edit history', group: 'core', icon: '📜' },
    { name: 'SmartCollections', columns: 5, description: 'AI-suggested categories', group: 'ai', icon: '🧠' },
    { name: 'SavedSearches', columns: 6, description: 'Saved search queries', group: 'ai', icon: '🔍' },
    { name: 'DuplicateChecks', columns: 5, description: 'Duplicate detection cache', group: 'ai', icon: '🔍' },
    { name: 'PostQualityScores', columns: 6, description: 'AI score + tips', group: 'ai', icon: '✨' },
    { name: 'AltTextSuggestions', columns: 5, description: 'AI-generated alt text', group: 'ai', icon: '🖼' },
    { name: 'ProfileVisits', columns: 5, description: 'Who viewed profile', group: 'ai', icon: '👣' },
    { name: 'UsageTracking', columns: 7, description: 'Activity time tracking', group: 'ai', icon: '📊' },
    { name: 'SocialHealthMetrics', columns: 8, description: 'Wellbeing scores + tips', group: 'ai', icon: '💚' },
    { name: 'Streaks', columns: 6, description: 'Posting streak records', group: 'ai', icon: '🔥' },
    { name: 'Karma', columns: 5, description: 'Community karma score', group: 'ai', icon: '⭐' },
    { name: 'FutureRoutePredictions', columns: 6, description: 'Best posting times', group: 'ai', icon: '🔮' },
    { name: 'QuietHours', columns: 5, description: 'DND schedules', group: 'ai', icon: '🌙' },
  ];

  readonly dbContextSnippet = `using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OmniSocial.Domain.Entities;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<Post> Posts => Set<Post>();
    public DbSet<PlatformPost> PlatformPosts => Set<PlatformPost>();
    public DbSet<Story> Stories => Set<Story>();
    public DbSet<Reel> Reels => Set<Reel>();
    public DbSet<LiveStream> LiveStreams => Set<LiveStream>();
    public DbSet<DirectMessage> DirectMessages => Set<DirectMessage>();
    public DbSet<Call> Calls => Set<Call>();
    public DbSet<PlatformProfile> PlatformProfiles => Set<PlatformProfile>();
    public DbSet<Follow> Follows => Set<Follow>();
    public DbSet<Block> Blocks => Set<Block>();
    public DbSet<Hashtag> Hashtags => Set<Hashtag>();
    public DbSet<Bookmark> Bookmarks => Set<Bookmark>();
    public DbSet<Collection> Collections => Set<Collection>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Poll> Polls => Set<Poll>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Report> Reports => Set<Report>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}`;

  readonly signalRHubs = [
    {
      icon: '📰', name: 'FeedHub', path: '/hubs/feed', color: '#007aff',
      description: 'Real-time feed updates + new post notifications',
      serverEvents: ['newPost', 'postUpdated', 'postDeleted', 'trendingChanged'],
      clientMethods: ['JoinFeed', 'LeaveFeed', 'FilterByPlatform'],
    },
    {
      icon: '📡', name: 'LiveStreamHub', path: '/hubs/live', color: '#ff3b30',
      description: 'Live stream events + WebRTC signaling + live chat',
      serverEvents: ['streamStarted', 'streamEnded', 'peerJoined', 'peerLeft', 'chatMessage', 'overlayAdded'],
      clientMethods: ['JoinStream', 'LeaveStream', 'SendChat', 'SendSignal', 'AddOverlay'],
    },
    {
      icon: '💬', name: 'ChatHub', path: '/hubs/chat', color: '#af52de',
      description: 'Direct messages + typing indicators + read receipts',
      serverEvents: ['newMessage', 'userTyping', 'messageRead', 'messageDeleted'],
      clientMethods: ['JoinConversation', 'SendMessage', 'Typing', 'MarkRead'],
    },
    {
      icon: '📞', name: 'CallHub', path: '/hubs/calls', color: '#34c759',
      description: 'Voice/video call signaling',
      serverEvents: ['incomingCall', 'callAnswered', 'callEnded', 'iceCandidate'],
      clientMethods: ['InitiateCall', 'AnswerCall', 'EndCall', 'SendIceCandidate'],
    },
    {
      icon: '🔔', name: 'NotificationHub', path: '/hubs/notifications', color: '#ff9500',
      description: 'Real-time push notifications',
      serverEvents: ['notification', 'mentionReceived', 'likeReceived', 'followReceived'],
      clientMethods: ['Subscribe', 'MarkRead', 'Snooze'],
    },
    {
      icon: '👥', name: 'PresenceHub', path: '/hubs/presence', color: '#5856d6',
      description: 'Online status + typing presence',
      serverEvents: ['userOnline', 'userOffline', 'presenceChanged'],
      clientMethods: ['GoOnline', 'GoOffline', 'SetStatus'],
    },
  ];

  readonly signalRClientSetup = `import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private feedHub!: signalR.HubConnection;
  private chatHub!: signalR.HubConnection;

  async connectFeed(token: string): Promise<void> {
    this.feedHub = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7123/hubs/feed', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.feedHub.on('newPost', (post) => console.log('New post:', post));
    this.feedHub.on('trendingChanged', (tags) => console.log('Trending:', tags));

    await this.feedHub.start();
    await this.feedHub.invoke('JoinFeed');
  }
}`;

  readonly authMethods = [
    { icon: '📧', name: 'Email + Password', desc: 'Standard Identity with lockout', status: 'Active' },
    { icon: '🔑', name: 'JWT Bearer Tokens', desc: '15-min access + 7-day refresh', status: 'Active' },
    { icon: '🌐', name: 'Google Sign-In', desc: 'OAuth 2.0 via Google.Apis.Auth', status: 'Active' },
    { icon: '📱', name: 'Two-Factor Auth', desc: 'TOTP authenticator app', status: 'Optional' },
    { icon: '🍪', name: 'Refresh Cookies', desc: 'HttpOnly + SameSite=Strict', status: 'Active' },
    { icon: '🎫', name: 'API Keys', desc: 'For third-party integrations', status: 'Planned' },
  ];

  readonly roles = [
    { icon: '👑', name: 'Admin', desc: 'Full platform control + moderation', permissions: 47, color: '#ff3b30' },
    { icon: '🛡', name: 'Moderator', desc: 'Content review + reports resolution', permissions: 18, color: '#ff9500' },
    { icon: '✨', name: 'Creator', desc: 'Verified creators with analytics', permissions: 12, color: '#af52de' },
    { icon: '👤', name: 'User', desc: 'Standard user access', permissions: 8, color: '#007aff' },
  ];

  readonly safetyFeatures = [
    { icon: '🚫', name: 'Block System', desc: 'Bidirectional blocking' },
    { icon: '🔇', name: 'Mute Users', desc: 'Hide without unfollowing' },
    { icon: '🌙', name: 'Quiet Hours', desc: 'DND schedule' },
    { icon: '⚠️', name: 'Content Warnings', desc: 'Post-level warnings' },
    { icon: '🚩', name: 'Reports', desc: 'User-submitted reports' },
    { icon: '🤖', name: 'Auto-Moderation', desc: 'AI content filter' },
    { icon: '🔒', name: 'Privacy Controls', desc: 'Per-platform privacy' },
    { icon: '✅', name: 'Email Verification', desc: 'Required for actions' },
  ];

  readonly jwtConfig = `builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = config["Jwt:Issuer"],
            ValidAudience = config["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(config["Jwt:Key"]!)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", p => p.RequireRole("Admin"));
    options.AddPolicy("CreatorOnly", p => p.RequireRole("Creator", "Admin"));
    options.AddPolicy("ModeratorOnly", p => p.RequireRole("Moderator", "Admin"));
});`;

  readonly setupSteps = [
    {
      num: 1, title: 'Clone the repository',
      desc: 'Get the source code from GitHub',
      code: 'git clone https://github.com/IbrahimShafiq4/OmniSocial.git\ncd OmniSocial',
    },
    {
      num: 2, title: 'Configure secrets',
      desc: 'Set up JWT key and Google credentials',
      code: 'cd OmniSocial.API\ndotnet user-secrets init\ndotnet user-secrets set "Jwt:Key" "your-32-char-random-key-here"\ndotnet user-secrets set "Google:ClientId" "your-google-client-id"',
    },
    {
      num: 3, title: 'Apply migrations',
      desc: 'Create database schema',
      code: 'dotnet ef migrations add InitialCreate --project ../OmniSocial.Infrastructure --startup-project .\ndotnet ef database update --project ../OmniSocial.Infrastructure --startup-project .',
    },
    {
      num: 4, title: 'Run backend',
      desc: 'Start the API server',
      code: 'dotnet run\n# Server: https://localhost:7123\n# Swagger: https://localhost:7123/swagger',
    },
    {
      num: 5, title: 'Run frontend',
      desc: 'Start Angular dev server',
      code: 'cd omnisocial-frontend\nnpm install\nng serve\n# App: http://localhost:4200',
    },
    {
      num: 6, title: 'Create admin account',
      desc: 'Register then assign Admin role via SQL',
      code: `INSERT INTO AspNetRoles (Id, Name, NormalizedName)
VALUES (NEWID(), 'Admin', 'ADMIN');

INSERT INTO AspNetUserRoles (UserId, RoleId)
SELECT u.Id, r.Id FROM AspNetUsers u, AspNetRoles r
WHERE u.Email = 'your-email@example.com' AND r.Name = 'Admin';`,
    },
  ];

  readonly smokeTests = [
    { step: 1, page: '/register', check: 'Create account → verify 3 platform profiles auto-created' },
    { step: 2, page: '/add-post', check: 'Post with 1 platform → original design. With 2 → merged. With 3 → Premium.' },
    { step: 3, page: '/feed', check: 'Filter between platforms + TikTok mode toggle' },
    { step: 4, page: '/profile/{id}/twitter vs /unified', check: 'Content filters correctly per platform' },
    { step: 5, page: '/chat/{id}', check: 'Test voice/video call between two browsers' },
    { step: 6, page: '/live-lobby → /live-studio/{id}', check: 'Start broadcast, test drawing/emoji/filters' },
    { step: 7, page: '/stories/upload', check: 'Upload story with music' },
    { step: 8, page: '/admin', check: 'Requires Admin role assigned via SQL' },
  ];

  readonly adminRoleSql = `INSERT INTO AspNetRoles (Id, Name, NormalizedName)
VALUES (NEWID(), 'Admin', 'ADMIN');

INSERT INTO AspNetUserRoles (UserId, RoleId)
SELECT u.Id, r.Id FROM AspNetUsers u, AspNetRoles r
WHERE u.Email = 'your-email@example.com' AND r.Name = 'Admin';`;

  readonly filteredControllers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const f = this.featureFilter();
    let list = OMNISOCIAL_CONTROLLERS;
    if (f !== 'all') list = list.filter(c => c.feature === f);
    if (q) list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.endpoints.some(e =>
        e.route.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      )
    );
    return list;
  });

  readonly filteredEndpointCount = computed(() =>
    this.filteredControllers().reduce((sum, c) => sum + c.endpoints.length, 0)
  );

  readonly activeFeatures = computed(() => {
    const f = this.featureFilter();
    if (f === 'all') return this.features;
    return this.features.filter(x => x.id === f);
  });

  onNav(id: string): void {
    this.active.set(id);
    this.searchQuery.set('');
    this.featureFilter.set('all');
  }

  onSearch(q: string): void { this.searchQuery.set(q); }

  onClose(): void { this.toast.info('OmniSocial preview closed'); }

  onNotifClick(n: PreviewNotification): void { this.toast.info(n.title, n.body); }

  openFeature(featureId: string): void {
    this.active.set('endpoints');
    this.featureFilter.set(featureId);
    this.endpointView.set('features');
  }

  countByFeature(featureId: string): number {
    return OMNISOCIAL_CONTROLLERS.filter(c => c.feature === featureId).length;
  }

  controllersByFeature(featureId: string): OsController[] {
    return OMNISOCIAL_CONTROLLERS.filter(c => c.feature === featureId);
  }

  toggleController(id: string): void {
    this.expandedControllers.update(list =>
      list.includes(id) ? list.filter(x => x !== id) : [...list, id]
    );
  }

  selectController(c: OsController): void {
    this.selectedController.set(c);
  }

  inspectEndpoint(ev: MouseEvent, ep: OsEndpoint): void {
    ev.stopPropagation();
    this.toast.info(`${ep.method} ${ep.route}`, `${ep.action} → ${ep.returns}`, '🔌');
  }

  onControllerContext(ev: MouseEvent, c: OsController): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'open', label: 'Open controller', icon: '📂', action: () => this.selectedController.set(c) },
      {
        id: 'copy-name', label: 'Copy controller name', icon: '📋',
        action: () => { navigator.clipboard?.writeText(c.name); this.toast.success('Copied'); }
      },
      {
        id: 'copy-all', label: 'Copy all routes', icon: '📄',
        action: () => {
          const routes = c.endpoints.map(e => `${e.method} ${e.route}`).join('\n');
          navigator.clipboard?.writeText(routes);
          this.toast.success(`Copied ${c.endpoints.length} routes`);
        }
      },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'swagger', label: 'Open in Swagger', icon: '🔍',
        action: () => this.toast.info('Swagger UI opened')
      },
      {
        id: 'tests', label: 'Generate integration tests', icon: '🧪',
        action: () => this.toast.success(`Generated ${c.endpoints.length} test stubs`)
      },
    ]);
  }

  showComponent(comp: { name: string; desc: string; uses: string[] }): void {
    this.toast.info(comp.name, comp.desc, '🧩');
  }

  testHub(h: { name: string; path: string }): void {
    this.toast.success(`Testing ${h.name}`, `${h.path} · WebSocket handshake`, '📡');
  }

  markSetupStep(i: number): void {
    this.setupProgress.set(i + 1);
  }
}