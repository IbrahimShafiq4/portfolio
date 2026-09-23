import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AR_SOURCES, AR_PRODUCTS, AR_JOBS, AR_MATCHES, ScrapedProduct, ScrapedSource } from '../../../../data/ar-room.data';
import { CodeViewerComponent } from '../../shared/code-viewer.component/code-viewer.component';
import { DummyDataEditorComponent } from '../../shared/dummy-data-editor/dummy-data-editor';
import { PreviewShellComponent, PreviewNavItem, ToolbarAction, PreviewNotification } from '../../shared/preview-shell/preview-shell';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-ar-room-preview',
  standalone: true,
  imports: [PreviewShellComponent, FormsModule, CodeViewerComponent, DummyDataEditorComponent, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🔍"
      title="AR-Room"
      subtitle="X-BLEND · Product Aggregator"
      [nav]="nav()"
      [active]="active()"
      (activeChange)="onNav($any($event))"
      [toolbarActions]="toolbar()"
      [notifications]="notifs()"
      [searchPlaceholder]="searchPlaceholder()"
      (searchChange)="onSearch($event)"
    >
      <app-dummy-data-editor projectId="ar-room" />

      @if (active() === 'overview') {
        <div class="view">
          <header class="hero-card">
            <div class="hero-content">
              <span class="hero-badge">🚀 X-BLEND · v2.4</span>
              <h1>AR-Room</h1>
              <p class="hero-lede">
                Web-scraping aggregator that pulls products from 7 Egyptian e-commerce
                platforms in parallel. One search, unified results, ranked by match score.
              </p>
              <div class="hero-cta">
                <button class="pill primary" (click)="active.set('search')">🔍 Try Search</button>
                <button class="pill" (click)="active.set('source')">📄 Source Code</button>
                <button class="pill" (click)="active.set('api')">🔌 API Docs</button>
              </div>
            </div>
            <div class="hero-stats">
              <div class="hs"><b>{{ sources.length }}</b><small>Sources</small></div>
              <div class="hs"><b>88.4K</b><small>Products</small></div>
              <div class="hs"><b>2.4s</b><small>Avg search</small></div>
              <div class="hs"><b>+30%</b><small>Engagement</small></div>
            </div>
          </header>

          <div class="kpis">
            @for (k of kpis(); track k.label) {
              <article class="kpi" [style.--c]="k.color">
                <span class="kpi-icon">{{ k.icon }}</span>
                <b class="kpi-val">{{ k.value }}</b>
                <span class="kpi-label">{{ k.label }}</span>
                <div class="kpi-bar"><div class="kpi-fill" [style.width.%]="k.pct"></div></div>
              </article>
            }
          </div>

          <section class="chart-card">
            <header><h4>Scraper Architecture</h4></header>
            <pre class="arch-diagram">{{ architecture }}</pre>
          </section>
        </div>
      }

      @else if (active() === 'search') {
        <div class="view">
          <header class="search-hero">
            <h2>🔍 Product Search</h2>
            <p>Search across all connected platforms</p>
            <div class="search-input-wrap">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="9" cy="9" r="6" /><path d="m17 17-3.5-3.5" />
              </svg>
              <input
                placeholder="Search for a product…"
                [value]="query()"
                (input)="query.set($any($event.target).value)"
                (keydown.enter)="runSearch()"
              />
              <button class="search-btn" (click)="runSearch()" [disabled]="scraping()">
                {{ scraping() ? '⟳ Scraping…' : 'Search' }}
              </button>
            </div>
          </header>

          @if (scraping() || progress() > 0) {
            <section class="progress-card">
              <header>
                <b>Scraping in progress</b>
                <span class="mono">{{ progress() }}%</span>
              </header>
              <div class="progress-track">
                <div class="progress-fill" [style.width.%]="progress()"></div>
              </div>
              <div class="src-chips">
                @for (s of sources; track s.id) {
                  <span class="src-chip" [class.done]="srcDone(s.id)">
                    {{ s.icon }} {{ s.name }} {{ srcDone(s.id) ? '✓' : '⟳' }}
                  </span>
                }
              </div>
            </section>
          }

          @if (results().length > 0) {
            <section class="results">
              <header class="results-head">
                <div>
                  <b>{{ results().length }} matches</b>
                  <small>Sorted by match score</small>
                </div>
                <span class="badge">🎯 {{ bestScore() }}% best</span>
              </header>
              <ul class="result-list">
                @for (r of results(); track r.id) {
                  <li class="result-row" [class.best]="r.matchScore >= 95" (click)="openProduct(r)">
                    <span class="rr-img">{{ r.image }}</span>
                    <div class="rr-body">
                      <div class="rr-top">
                        <b>{{ r.name }}</b>
                        @if (r.matchScore >= 95) { <span class="rr-best">🎯 Best</span> }
                      </div>
                      <div class="rr-meta">
                        <span class="rr-source" [style.color]="sourceColor(r.sourceId)">
                          {{ sourceIcon(r.sourceId) }} {{ sourceName(r.sourceId) }}
                        </span>
                        <span>★ {{ r.rating }}</span>
                        <span>{{ r.reviews }} reviews</span>
                        <span [class.ok]="r.inStock" [class.neg]="!r.inStock">
                          {{ r.inStock ? 'In stock' : 'Out of stock' }}
                        </span>
                        <span class="match">Match: {{ r.matchScore }}%</span>
                      </div>
                    </div>
                    <div class="rr-price">
                      <b>{{ r.price | number }} EGP</b>
                      @if (r.oldPrice) { <s>{{ r.oldPrice | number }} EGP</s> }
                    </div>
                  </li>
                }
              </ul>
            </section>
          }
        </div>
      }

      @else if (active() === 'source') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Source Code</h3>
              <p>Real implementation snippets from the AR-Room codebase</p>
            </div>
          </header>
          <app-code-viewer [files]="sourceFiles" />
        </div>
      }

      @else if (active() === 'terminal') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Terminal Playground</h3>
              <p>Interactive shell simulating the backend environment</p>
            </div>
          </header>

          <section class="term-box">
            <header class="term-head">
              <span class="term-dot red"></span><span class="term-dot yellow"></span><span class="term-dot green"></span>
              <span class="term-title">arroom-backend — bash</span>
            </header>
            <div class="term-body">
              @for (line of termLines(); track $index) {
                <div class="term-line" [class]="line.kind">{{ line.text }}</div>
              }
            </div>
          </section>

          <section class="term-commands">
            <h4>Try these commands</h4>
            <div class="cmd-grid">
              @for (c of termCommands; track c.cmd) {
                <button class="cmd-chip" (click)="runTermCmd(c.cmd)">
                  <code>{{ c.cmd }}</code>
                  <small>{{ c.desc }}</small>
                </button>
              }
            </div>
          </section>
        </div>
      }

      @else if (active() === 'api') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>API Reference</h3>
              <p>REST endpoints exposed by the AR-Room backend</p>
            </div>
          </header>

          <div class="endpoint-list">
            @for (ep of endpoints(); track ep.id) {
              <article class="endpoint-row" (click)="inspectEndpoint(ep)">
                <span class="method" [attr.data-m]="ep.method">{{ ep.method }}</span>
                <code class="route">{{ ep.route }}</code>
                <span class="desc">{{ ep.description }}</span>
                <span class="auth" [class.public]="ep.auth === 'public'">{{ ep.auth }}</span>
              </article>
            }
          </div>

          @if (selectedEndpoint(); as ep) {
            <section class="endpoint-detail">
              <header>
                <span class="method" [attr.data-m]="ep.method">{{ ep.method }}</span>
                <code>{{ ep.route }}</code>
              </header>
              <app-code-viewer [files]="endpointFiles(ep)" />
            </section>
          }
        </div>
      }

      @else if (active() === 'jobs') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Scrape Jobs</h3>
              <p>{{ jobs.length }} recent jobs</p>
            </div>
            <button class="pill primary" (click)="newJob()">＋ New Job</button>
          </header>

          <div class="table-wrap">
            <header class="thead">
              <span>Job ID</span>
              <span>Query</span>
              <span>Status</span>
              <span>Progress</span>
              <span>Sources</span>
              <span>Found</span>
              <span>Duration</span>
            </header>
            @for (j of jobs; track j.id) {
              <div class="trow">
                <span class="mono">{{ j.id }}</span>
                <span class="mono">{{ j.query }}</span>
                <span class="st" [attr.data-s]="j.status">{{ j.status }}</span>
                <span class="progress-cell">
                  <div class="prog-bar"><div class="prog-fill" [style.width.%]="j.progress"></div></div>
                  <span class="mono">{{ j.progress }}%</span>
                </span>
                <span class="mono">{{ j.sources.length }}</span>
                <span class="mono">{{ j.productsFound }}</span>
                <span class="mono">{{ j.duration }}</span>
              </div>
            }
          </div>
        </div>
      }

      @else if (active() === 'sources') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Connected Sources</h3>
              <p>{{ sources.length }} platforms · {{ totalProducts() | number }} products indexed</p>
            </div>
          </header>

          <div class="sources-grid">
            @for (s of sources; track s.id) {
              <article class="source-card" [style.--c]="s.color" (contextmenu)="onSourceContext($event, s)">
                <header>
                  <span class="sc-icon">{{ s.icon }}</span>
                  <div>
                    <b>{{ s.name }}</b>
                    <span class="sc-status" [attr.data-s]="s.status">{{ s.status }}</span>
                  </div>
                </header>
                <div class="sc-stats">
                  <div><b>{{ s.products | number }}</b><small>Products</small></div>
                  <div><b>{{ s.latency }}ms</b><small>Latency</small></div>
                  <div><b>{{ s.uptime }}%</b><small>Uptime</small></div>
                </div>
                <div class="sc-bar"><div class="sc-fill" [style.width.%]="s.uptime"></div></div>
              </article>
            }
          </div>
        </div>
      }

      @if (selectedProduct(); as p) {
        <div class="modal-backdrop" (click)="selectedProduct.set(null)">
          <div class="modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon" [style.background]="sourceColor(p.sourceId) + '22'" [style.color]="sourceColor(p.sourceId)">
                {{ p.image }}
              </span>
              <div>
                <h3>{{ p.name }}</h3>
                <p dir="rtl">{{ p.nameAr }}</p>
              </div>
              <span class="modal-match">{{ p.matchScore }}%</span>
              <button class="modal-close" (click)="selectedProduct.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="price-row">
                <b class="price">{{ p.price | number }} {{ p.currency }}</b>
                @if (p.oldPrice) { <s>{{ p.oldPrice | number }} {{ p.currency }}</s> }
              </div>
              <div class="om-grid">
                <div class="om-section"><span class="om-label">Source</span><b>{{ sourceName(p.sourceId) }}</b></div>
                <div class="om-section"><span class="om-label">Category</span><b>{{ p.category }}</b></div>
                <div class="om-section"><span class="om-label">Rating</span><b>★ {{ p.rating }} ({{ p.reviews }})</b></div>
                <div class="om-section"><span class="om-label">Status</span>
                  <b [class.ok]="p.inStock" [class.neg]="!p.inStock">{{ p.inStock ? 'In stock' : 'Out of stock' }}</b>
                </div>
                <div class="om-section"><span class="om-label">Scraped at</span><b class="mono">{{ formatDate(p.scrapedAt) }}</b></div>
                <div class="om-section"><span class="om-label">URL</span>
                  <a [href]="p.url" target="_blank" class="url">{{ p.url }}</a>
                </div>
              </div>
            </div>
            <footer class="modal-foot">
              <a class="mf-btn primary" [href]="p.url" target="_blank">🌐 Open Product</a>
              <button class="mf-btn" (click)="selectedProduct.set(null)">Close</button>
            </footer>
          </div>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; }
    .mono { font-family: var(--sf-mono); }
    .ok { color: #34c759; }
    .neg { color: #ff3b30; }
    .view { max-width: 1180px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

    .hero-card { padding: 32px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-lg); }
    .hero-badge { display: inline-block; padding: 5px 12px; background: var(--accent-soft); color: var(--accent); border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 700; letter-spacing: 0.08em; margin-bottom: 14px; }
    .hero-content h1 { font-size: var(--fs-4xl); font-weight: 800; letter-spacing: -0.03em; margin-bottom: 12px; }
    .hero-lede { font-size: var(--fs-base); line-height: 1.6; color: var(--label-2); margin-bottom: 24px; max-width: 720px; }
    .hero-cta { display: flex; gap: 10px; flex-wrap: wrap; }
    .pill { padding: 9px 16px; background: var(--bg-fill-2); color: var(--label); border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600; cursor: pointer; border: 0; transition: all 140ms; }
    .pill:hover { background: var(--bg-fill-3); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .hero-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 32px; padding-top: 24px; border-top: 0.5px solid var(--separator); }
    .hs b { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em; display: block; font-variant-numeric: tabular-nums; }
    .hs small { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }

    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .kpi { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-left: 3px solid var(--c); display: flex; flex-direction: column; gap: 6px; }
    .kpi-icon { font-size: 20px; }
    .kpi-val { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; line-height: 1; }
    .kpi-label { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .kpi-bar { height: 3px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; margin-top: 4px; }
    .kpi-fill { height: 100%; background: var(--c); border-radius: var(--r-pill); }

    .chart-card { padding: 24px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .chart-card h4 { font-size: var(--fs-base); font-weight: 700; margin-bottom: 16px; }
    .arch-diagram { padding: 18px 20px; background: var(--bg-code); border-radius: var(--r-sm); font-family: var(--sf-mono); font-size: var(--fs-2xs); line-height: 1.7; overflow-x: auto; color: var(--label); white-space: pre; }

    .search-hero { padding: 32px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-lg); text-align: center; }
    .search-hero h2 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px; }
    .search-hero p { font-size: var(--fs-sm); color: var(--label-2); margin-bottom: 20px; }
    .search-input-wrap { display: flex; align-items: center; gap: 10px; max-width: 620px; margin: 0 auto; padding: 6px 6px 6px 16px; background: var(--bg-input); border: 1px solid var(--separator); border-radius: var(--r-pill); transition: border-color 140ms; }
    .search-input-wrap:focus-within { border-color: var(--accent); }
    .search-input-wrap svg { width: 16px; height: 16px; color: var(--label-3); }
    .search-input-wrap input { flex: 1; background: transparent; border: 0; outline: none; font-size: var(--fs-sm); color: var(--label); font-family: inherit; min-width: 0; }
    .search-btn { padding: 8px 20px; background: var(--accent); color: var(--accent-contrast); border: 0; border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 700; cursor: pointer; }
    .search-btn:disabled { opacity: 0.6; cursor: wait; }

    .progress-card { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .progress-card header { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: var(--fs-sm); font-weight: 700; }
    .progress-track { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; margin-bottom: 14px; }
    .progress-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill); transition: width 200ms; }
    .src-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .src-chip { padding: 6px 12px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 600; transition: all 200ms; }
    .src-chip.done { background: rgba(52, 199, 89, 0.15); color: #34c759; }

    .results { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .results-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .results-head b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .results-head small { font-size: 10px; color: var(--label-2); }
    .badge { padding: 4px 12px; background: rgba(52, 199, 89, 0.15); color: #34c759; border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 700; }

    .result-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .result-row { display: grid; grid-template-columns: 52px 1fr auto; gap: 14px; align-items: center; padding: 14px; background: var(--bg-fill-2); border-radius: var(--r-sm); cursor: pointer; transition: all 140ms; }
    .result-row:hover { background: var(--bg-fill-3); transform: translateX(3px); }
    .result-row.best { border-left: 3px solid #34c759; }
    .rr-img { width: 52px; height: 52px; display: grid; place-items: center; background: var(--bg-surface-solid); border-radius: var(--r-sm); font-size: 24px; }
    .rr-top { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
    .rr-top b { font-size: var(--fs-sm); font-weight: 600; }
    .rr-best { padding: 2px 8px; background: rgba(52, 199, 89, 0.15); color: #34c759; border-radius: var(--r-pill); font-size: 9px; font-weight: 700; }
    .rr-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: var(--fs-2xs); color: var(--label-2); }
    .match { color: var(--accent); font-weight: 700; }
    .rr-price { text-align: right; }
    .rr-price b { font-size: var(--fs-base); font-weight: 800; color: var(--accent); font-variant-numeric: tabular-nums; display: block; }
    .rr-price s { font-size: 10px; color: var(--label-3); }

    .term-box { background: #0d0d0f; border: 1px solid var(--separator); border-radius: var(--r-md); overflow: hidden; }
    .term-head { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
    .term-dot { width: 12px; height: 12px; border-radius: 50%; }
    .term-dot.red { background: #ff5f57; } .term-dot.yellow { background: #febc2e; } .term-dot.green { background: #28c840; }
    .term-title { margin-left: 8px; font-family: var(--sf-mono); font-size: 11px; color: rgba(255, 255, 255, 0.6); }
    .term-body { padding: 14px 18px; font-family: var(--sf-mono); font-size: 12px; line-height: 1.7; color: #e5e5e7; min-height: 280px; }
    .term-line { white-space: pre-wrap; }
    .term-line.cmd { color: #7ec699; }
    .term-line.out { color: #d4d4d4; }
    .term-line.ok { color: #7ee787; }
    .term-line.err { color: #ff7b72; }
    .term-line.dim { color: rgba(255, 255, 255, 0.42); }

    .term-commands { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .term-commands h4 { font-size: var(--fs-sm); font-weight: 700; margin-bottom: 12px; }
    .cmd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
    .cmd-chip { padding: 12px; background: var(--bg-fill-2); border: 1px solid var(--separator); border-radius: var(--r-sm); text-align: left; cursor: pointer; transition: all 140ms; display: flex; flex-direction: column; gap: 4px; }
    .cmd-chip:hover { border-color: var(--accent); background: var(--accent-soft); }
    .cmd-chip code { font-family: var(--sf-mono); font-size: var(--fs-xs); color: var(--accent); font-weight: 700; }
    .cmd-chip small { font-size: 10px; color: var(--label-2); }

    .endpoint-list { display: flex; flex-direction: column; gap: 6px; }
    .endpoint-row { display: grid; grid-template-columns: 70px 260px 1fr 80px; gap: 14px; align-items: center; padding: 12px 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-sm); cursor: pointer; transition: all 140ms; }
    .endpoint-row:hover { border-color: var(--accent); transform: translateX(3px); }
    .method { font-family: var(--sf-mono); font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); color: #fff; text-align: center; }
    .method[data-m='GET'] { background: #007aff; }
    .method[data-m='POST'] { background: #34c759; }
    .method[data-m='PUT'] { background: #ff9500; }
    .method[data-m='DELETE'] { background: #ff3b30; }
    .route { font-family: var(--sf-mono); font-size: var(--fs-xs); color: var(--accent); font-weight: 600; }
    .desc { font-size: var(--fs-xs); color: var(--label-2); }
    .auth { font-size: 10px; font-weight: 700; padding: 3px 10px; background: var(--bg-fill-2); color: var(--label-2); border-radius: var(--r-pill); text-align: center; }
    .auth.public { background: rgba(52, 199, 89, 0.15); color: #34c759; }

    .endpoint-detail { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .endpoint-detail header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .endpoint-detail code { font-family: var(--sf-mono); font-size: var(--fs-sm); color: var(--accent); font-weight: 600; }

    .table-wrap { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; }
    .thead, .trow { display: grid; grid-template-columns: 100px 1.4fr 100px 180px 90px 80px 100px; gap: 14px; padding: 12px 16px; align-items: center; font-size: var(--fs-xs); }
    .thead { background: var(--bg-fill-2); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-2); font-weight: 700; }
    .trow { border-top: 0.5px solid var(--separator); }
    .st { padding: 3px 10px; border-radius: var(--r-pill); font-size: 10px; font-weight: 700; text-transform: uppercase; text-align: center; }
    .st[data-s='completed'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='running'] { background: var(--accent-soft); color: var(--accent); }
    .st[data-s='queued'] { background: var(--bg-fill-2); color: var(--label-2); }
    .st[data-s='failed'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .progress-cell { display: flex; align-items: center; gap: 8px; }
    .prog-bar { flex: 1; height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .prog-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill); }

    .sources-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
    .source-card { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-top: 3px solid var(--c); display: flex; flex-direction: column; gap: 14px; transition: all 180ms; }
    .source-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .source-card header { display: flex; align-items: center; gap: 12px; }
    .sc-icon { width: 44px; height: 44px; display: grid; place-items: center; background: color-mix(in srgb, var(--c) 15%, transparent); border-radius: var(--r-sm); font-size: 22px; }
    .source-card header > div { flex: 1; }
    .source-card header b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .sc-status { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; padding: 3px 9px; border-radius: var(--r-pill); }
    .sc-status[data-s='online'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .sc-status[data-s='rate-limited'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .sc-status[data-s='offline'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .sc-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .sc-stats > div { padding: 8px; background: var(--bg-fill-2); border-radius: var(--r-xs); text-align: center; }
    .sc-stats b { font-size: var(--fs-sm); font-weight: 800; font-variant-numeric: tabular-nums; display: block; }
    .sc-stats small { font-size: 9px; color: var(--label-3); text-transform: uppercase; }
    .sc-bar { height: 4px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .sc-fill { height: 100%; background: var(--c); border-radius: var(--r-pill); }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); z-index: 9990; display: grid; place-items: center; padding: 20px; animation: fadeIn 200ms; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal { max-width: 720px; width: 100%; max-height: 85vh; background: var(--bg-elevated); border: 0.5px solid var(--separator); border-radius: var(--r-lg); box-shadow: var(--shadow-xl); display: flex; flex-direction: column; overflow: hidden; animation: modalIn 300ms var(--ease-spring); }
    @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .modal-head { display: flex; align-items: center; gap: 14px; padding: 20px 24px; border-bottom: 0.5px solid var(--separator); }
    .modal-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: var(--r-md); font-size: 22px; }
    .modal-head > div { flex: 1; }
    .modal-head h3 { font-size: var(--fs-lg); font-weight: 700; }
    .modal-head p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 2px; }
    .modal-match { padding: 6px 14px; background: rgba(52, 199, 89, 0.15); color: #34c759; border-radius: var(--r-pill); font-size: var(--fs-sm); font-weight: 800; }
    .modal-close { width: 32px; height: 32px; display: grid; place-items: center; border-radius: var(--r-xs); color: var(--label-3); font-size: 16px; background: transparent; border: 0; cursor: pointer; }
    .modal-body { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .price-row { display: flex; align-items: baseline; gap: 12px; padding: 16px; background: var(--bg-fill-2); border-radius: var(--r-md); }
    .price { font-size: var(--fs-2xl); font-weight: 800; color: var(--accent); font-variant-numeric: tabular-nums; }
    .price-row s { color: var(--label-3); font-size: var(--fs-sm); }
    .om-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .om-section { display: flex; flex-direction: column; gap: 3px; }
    .om-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--label-3); }
    .om-section b { font-size: var(--fs-sm); font-weight: 700; }
    .url { font-family: var(--sf-mono); font-size: var(--fs-2xs); color: var(--accent); word-break: break-all; }
    .modal-foot { padding: 16px 24px; border-top: 0.5px solid var(--separator); display: flex; gap: 8px; justify-content: flex-end; }
    .mf-btn { padding: 9px 16px; background: var(--bg-fill-2); color: var(--label); border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600; border: 0; cursor: pointer; text-decoration: none; }
    .mf-btn.primary { background: var(--accent); color: var(--accent-contrast); }

    @media (max-width: 720px) {
      .kpis, .hero-stats { grid-template-columns: repeat(2, 1fr); }
      .result-row { grid-template-columns: 44px 1fr; }
      .rr-price { grid-column: 1 / -1; text-align: left; }
      .endpoint-row { grid-template-columns: 60px 1fr; gap: 8px; }
      .endpoint-row .desc, .endpoint-row .auth { grid-column: 1 / -1; }
      .thead, .trow { grid-template-columns: 80px 1fr 80px; gap: 8px; }
      .thead span:nth-child(n+4), .trow span:nth-child(n+4) { display: none; }
      .om-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class ArRoomPreviewComponent {
  readonly sources = AR_SOURCES;
  readonly products = AR_PRODUCTS;
  readonly jobs = AR_JOBS;
  readonly matches = AR_MATCHES;

  readonly active = signal('overview');
  readonly query = signal('');
  readonly scraping = signal(false);
  readonly progress = signal(0);
  readonly results = signal<ScrapedProduct[]>([]);
  readonly selectedProduct = signal<ScrapedProduct | null>(null);
  readonly selectedEndpoint = signal<any>(null);
  readonly termLines = signal<{ text: string; kind: string; }[]>([]);

  private doneSources = signal<string[]>([]);

  private toast = inject(ToastService);
  private menu = inject(ContextMenuService);

  readonly architecture = `
┌─────────────────────────────────────────────────────────────┐
│  Angular Frontend (PrimeNG + SCSS)                          │
│  ┌───────────┐  ┌─────────────┐  ┌───────────────────────┐  │
│  │ Search UI │  │ Results Grid│  │  Job Monitor Widget   │  │
│  └─────┬─────┘  └──────┬──────┘  └───────────┬───────────┘  │
└────────┼───────────────┼─────────────────────┼──────────────┘
         │               │                     │
         ▼               ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│  ASP.NET Core Web API (.NET 9)                              │
│  ┌───────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │ /api/search   │  │ /api/jobs       │  │ /api/sources  │  │
│  └───────┬───────┘  └────────┬────────┘  └───────┬───────┘  │
│          │                   │                   │          │
│          ▼                   ▼                   ▼          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Scraper Orchestrator (Scoped)              │   │
│  │   - Parallel Scrapers via Task.WhenAll               │   │
│  │   - Rate Limiter (per source)                        │   │
│  │   - Retry Policy (Polly)                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Scrapers (7 concurrent workers)                                    │
│ 🛒 Amazon  📦 Noon  🏬 Jumia  🛍️ Souq  📱 OLX  ⚡ BTECH  🏪 2B  |
└─────────────────────────────────────────────────────────────────────┘
`;

  readonly sourceFiles = [
    {
      name: 'scraper-orchestrator.ts',
      language: 'typescript' as const,
      code: `export interface ScraperResult {
  sourceId: string;
  products: ScrapedProduct[];
  duration: number;
  errors: string[];
}

export class ScraperOrchestrator {
  private readonly scrapers: Map<string, ProductScraper> = new Map();
  private readonly rateLimiter: RateLimiter;

  constructor(scrapers: ProductScraper[]) {
    scrapers.forEach(s => this.scrapers.set(s.sourceId, s));
    this.rateLimiter = new RateLimiter({ maxPerSecond: 5 });
  }

  async search(query: string, sourceIds?: string[]): Promise<ScraperResult[]> {
    const targets = sourceIds
      ? sourceIds.map(id => this.scrapers.get(id)).filter(Boolean)
      : Array.from(this.scrapers.values());

    const tasks = targets.map(scraper =>
      this.runWithLimiter(scraper as ProductScraper, query)
    );

    return Promise.allSettled(tasks).then(results =>
      results.map((r, i) => {
        if (r.status === 'fulfilled') return r.value;
        return {
          sourceId: (targets[i] as ProductScraper).sourceId,
          products: [],
          duration: 0,
          errors: [String(r.reason)],
        };
      })
    );
  }

  private async runWithLimiter(
    scraper: ProductScraper,
    query: string
  ): Promise<ScraperResult> {
    await this.rateLimiter.acquire(scraper.sourceId);
    const start = performance.now();
    try {
      const products = await scraper.scrape(query);
      return {
        sourceId: scraper.sourceId,
        products,
        duration: performance.now() - start,
        errors: [],
      };
    } catch (err) {
      return {
        sourceId: scraper.sourceId,
        products: [],
        duration: performance.now() - start,
        errors: [String(err)],
      };
    }
  }
}`,
    },
    {
      name: 'rate-limiter.ts',
      language: 'typescript' as const,
      code: `export interface RateLimiterConfig {
  maxPerSecond: number;
  burstSize?: number;
}

export class RateLimiter {
  private tokens: Map<string, number> = new Map();
  private lastRefill: Map<string, number> = new Map();
  private readonly max: number;

  constructor(private readonly config: RateLimiterConfig) {
    this.max = config.burstSize ?? config.maxPerSecond;
  }

  async acquire(key: string): Promise<void> {
    this.refill(key);

    const available = this.tokens.get(key) ?? this.max;
    if (available <= 0) {
      const waitMs = 1000 / this.config.maxPerSecond;
      await new Promise(resolve => setTimeout(resolve, waitMs));
      return this.acquire(key);
    }

    this.tokens.set(key, available - 1);
  }

  private refill(key: string): void {
    const now = Date.now();
    const last = this.lastRefill.get(key) ?? now;
    const elapsed = (now - last) / 1000;

    const refillAmount = elapsed * this.config.maxPerSecond;
    const current = this.tokens.get(key) ?? this.max;
    const next = Math.min(current + refillAmount, this.max);

    this.tokens.set(key, next);
    this.lastRefill.set(key, now);
  }
}`,
    },
    {
      name: 'match-scorer.cs',
      language: 'csharp' as const,
      code: `public class ProductMatchScorer : IProductMatchScorer
{
    private readonly IFuzzyMatcher _matcher;

    public ProductMatchScorer(IFuzzyMatcher matcher)
    {
        _matcher = matcher;
    }

    public double CalculateScore(Product a, Product b)
    {
        var nameScore = _matcher.Similarity(a.Name, b.Name);
        var brandScore = a.Brand == b.Brand ? 1.0 : 0.0;
        var priceScore = CalculatePriceProximity(a.Price, b.Price);
        var categoryScore = a.Category == b.Category ? 1.0 : 0.0;

        return nameScore * 0.50
             + brandScore * 0.20
             + priceScore * 0.15
             + categoryScore * 0.15;
    }

    private static double CalculatePriceProximity(decimal a, decimal b)
    {
        if (a == 0 || b == 0) return 0;
        var diff = Math.Abs(a - b);
        var avg = (a + b) / 2;
        return Math.Max(0, 1 - (double)(diff / avg));
    }
}`,
    },
    {
      name: 'Program.cs',
      language: 'csharp' as const,
      code: `var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<IProductMatchScorer, ProductMatchScorer>();
builder.Services.AddScoped<IFuzzyMatcher, LevenshteinMatcher>();
builder.Services.AddSingleton<RateLimiter>(_ => new RateLimiter(new()
{
    MaxPerSecond = 5,
    BurstSize = 10
}));

builder.Services.AddScoped<ProductScraper, AmazonScraper>();
builder.Services.AddScoped<ProductScraper, NoonScraper>();
builder.Services.AddScoped<ProductScraper, JumiaScraper>();
builder.Services.AddScoped<ProductScraper, SouqScraper>();
builder.Services.AddScoped<ProductScraper, OlxScraper>();
builder.Services.AddScoped<ScraperOrchestrator>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();`,
    },
    {
      name: 'SearchController.cs',
      language: 'csharp' as const,
      code: `[ApiController]
[Route("api/[controller]")]
public class SearchController : ControllerBase
{
    private readonly ScraperOrchestrator _orchestrator;
    private readonly IProductMatchScorer _scorer;

    public SearchController(
        ScraperOrchestrator orchestrator,
        IProductMatchScorer scorer)
    {
        _orchestrator = orchestrator;
        _scorer = scorer;
    }

    [HttpPost]
    public async Task<ActionResult<SearchResultDto>> Search(
        [FromBody] SearchRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Query))
            return BadRequest("Query is required");

        var results = await _orchestrator.Search(request.Query, request.SourceIds);

        var allProducts = results
            .SelectMany(r => r.Products)
            .OrderByDescending(p => p.MatchScore)
            .ToList();

        return Ok(new SearchResultDto
        {
            Query = request.Query,
            TotalFound = allProducts.Count,
            SourcesQueried = results.Count,
            Duration = results.Sum(r => r.Duration),
            Products = allProducts
        });
    }
}`,
    },
  ];

  readonly termCommands = [
    { cmd: 'help', desc: 'Show available commands' },
    { cmd: 'search sony', desc: 'Search for a product' },
    { cmd: 'sources', desc: 'List all sources' },
    { cmd: 'status', desc: 'Backend health check' },
    { cmd: 'bench 100', desc: 'Benchmark 100 concurrent requests' },
    { cmd: 'clear', desc: 'Clear terminal' },
  ];

  readonly nav = computed<PreviewNavItem[]>(() => [
    { id: 'overview', label: 'Overview',   icon: '📋', group: 'Project' },
    { id: 'search',   label: 'Live Search',icon: '🔍', group: 'Demo' },
    { id: 'source',   label: 'Source',     icon: '📄', group: 'Technical' },
    { id: 'terminal', label: 'Terminal',   icon: '⌨️', group: 'Technical' },
    { id: 'api',      label: 'API',        icon: '🔌', group: 'Technical' },
    { id: 'jobs',     label: 'Jobs',       icon: '⚙️', group: 'Operations' },
    { id: 'sources',  label: 'Sources',    icon: '🌐', group: 'Operations' },
  ]);

  readonly toolbar = computed<ToolbarAction[]>(() => [
    { id: 'refresh', label: 'Refresh', icon: '⟳', action: () => this.toast.success('Refreshed') },
    { id: 'run', label: 'Run Scraper', icon: '▶', primary: true, action: () => { this.active.set('search'); this.runSearch(); } },
  ]);

  readonly notifs = signal<PreviewNotification[]>([
    { id: 1, icon: '✅', title: 'Job J-001 completed', body: '47 products found', time: '5m' },
    { id: 2, icon: '⚠️', title: 'Souq rate-limited', body: 'Backing off for 60s', time: '12m' },
    { id: 3, icon: '🎯', title: 'Best match 98%', body: 'Sony WH-1000XM5', time: '30m' },
  ]);

  constructor() {
    this.bootTerminal();
  }

  readonly searchPlaceholder = computed(() =>
    this.active() === 'search' ? 'Type a product name…' :
    this.active() === 'sources' ? 'Search sources…' : ''
  );

  readonly kpis = computed(() => [
    { icon: '🌐', label: 'Sources', value: this.sources.length.toString(), color: '#007aff', pct: 100 },
    { icon: '📦', label: 'Products', value: '88.4K', color: '#34c759', pct: 88 },
    { icon: '⚡', label: 'Avg Latency', value: '270ms', color: '#ff9500', pct: 65 },
    { icon: '🎯', label: 'Match Rate', value: '96.4%', color: '#af52de', pct: 96 },
  ]);

  readonly totalProducts = computed(() =>
    this.sources.reduce((sum, s) => sum + s.products, 0)
  );

  readonly bestScore = computed(() =>
    Math.max(...this.results().map(r => r.matchScore), 0)
  );

  readonly endpoints = computed(() => [
    { id: '1', method: 'POST', route: '/api/search', description: 'Search across all sources', auth: 'public', body: { query: 'Sony WH-1000XM5', sources: ['amazon', 'noon'] }, response: { totalFound: 47, duration: 3.4, products: [] } },
    { id: '2', method: 'GET',  route: '/api/sources', description: 'List connected sources', auth: 'public' },
    { id: '3', method: 'GET',  route: '/api/jobs', description: 'List scrape jobs', auth: 'bearer' },
    { id: '4', method: 'POST', route: '/api/jobs', description: 'Create a new scrape job', auth: 'bearer' },
    { id: '5', method: 'GET',  route: '/api/jobs/{id}', description: 'Get job details', auth: 'bearer' },
    { id: '6', method: 'GET',  route: '/api/products/{id}', description: 'Get product details', auth: 'public' },
    { id: '7', method: 'GET',  route: '/api/matches/{productId}', description: 'Get matches for a product', auth: 'public' },
    { id: '8', method: 'DELETE', route: '/api/jobs/{id}', description: 'Cancel a job', auth: 'bearer' },
  ]);

  onNav(id: string): void { this.active.set(id); }
  onSearch(q: string): void { this.query.set(q); }

  srcDone(id: string): boolean { return this.doneSources().includes(id); }
  sourceIcon(id: string): string { return this.sources.find(s => s.id === id)?.icon ?? '📦'; }
  sourceName(id: string): string { return this.sources.find(s => s.id === id)?.name ?? id; }
  sourceColor(id: string): string { return this.sources.find(s => s.id === id)?.color ?? '#888'; }

  formatDate(d: string): string {
    return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  openProduct(p: ScrapedProduct): void { this.selectedProduct.set(p); }

  inspectEndpoint(ep: any): void { this.selectedEndpoint.set(ep); }

  endpointFiles(ep: any): { name: string; language: 'json' | 'bash'; code: string; }[] {
    return [
      {
        name: 'request.json',
        language: 'json',
        code: ep.body ? JSON.stringify(ep.body, null, 2) : `// GET ${ep.route} — no body`,
      },
      {
        name: 'curl.sh',
        language: 'bash',
        code: `curl -X ${ep.method} \\
  https://api.arroom.dev${ep.route} \\
  -H "Content-Type: application/json" \\${ep.auth === 'bearer' ? `\n  -H "Authorization: Bearer $TOKEN" \\` : ''}
  ${ep.body ? `-d '${JSON.stringify(ep.body)}'` : ''}`,
      },
      {
        name: 'response.json',
        language: 'json',
        code: ep.response ? JSON.stringify(ep.response, null, 2) : `{\n  "status": 200,\n  "data": []\n}`,
      },
    ];
  }

  runSearch(): void {
    if (this.scraping()) return;
    if (!this.query()) this.query.set('Sony WH-1000XM5');

    this.results.set([]);
    this.scraping.set(true);
    this.progress.set(0);
    this.doneSources.set([]);

    const tick = setInterval(() => {
      const p = this.progress();
      const next = Math.min(p + 3, 100);
      this.progress.set(next);

      const doneCount = Math.floor(next / 14);
      const newDone = this.sources.slice(0, doneCount).map(s => s.id);
      this.doneSources.set(newDone);

      if (next >= 100) {
        clearInterval(tick);
        this.scraping.set(false);
        this.doneSources.set(this.sources.map(s => s.id));
        this.results.set(this.products.filter(p => this.query() ? p.name.toLowerCase().includes(this.query().toLowerCase()) || this.query().toLowerCase().includes('sony') : true));
        if (this.results().length === 0) {
          this.results.set(this.products.slice(0, 5));
        }
        this.toast.success('Search complete', `${this.results().length} products found`);
      }
    }, 60);
  }

  newJob(): void {
    this.toast.success('Job created', 'Queued for scraping', '⚙️');
  }

  onSourceContext(ev: MouseEvent, s: ScrapedSource): void {
    ev.preventDefault();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'refresh', label: `Refresh ${s.name}`, icon: '⟳', action: () => this.toast.success(`Refreshing ${s.name}`) },
      { id: 'stats', label: 'View stats', icon: '📊', action: () => this.toast.info(`${s.name} stats`, `${s.products} products`) },
      { id: 'sep', label: '', separatorBefore: true, action: () => {} },
      { id: 'disable', label: 'Disable source', icon: '🚫', danger: true, action: () => this.toast.warning(`${s.name} disabled`) },
    ]);
  }

  private bootTerminal(): void {
    const lines = [
      { text: 'arroom-backend v2.4.1 — Node 20.11.0', kind: 'dim' },
      { text: 'Connected to 7 sources · Redis cache: OK', kind: 'ok' },
      { text: '', kind: 'dim' },
      { text: 'Type "help" to see available commands.', kind: 'dim' },
    ];
    this.termLines.set(lines);
  }

  runTermCmd(cmd: string): void {
    this.termLines.update(list => [...list, { text: `$ ${cmd}`, kind: 'cmd' }]);

    const responses: Record<string, { text: string; kind: string; }[]> = {
      help: [
        { text: '  search <query>     Search products', kind: 'out' },
        { text: '  sources            List all sources', kind: 'out' },
        { text: '  status             Backend health check', kind: 'out' },
        { text: '  bench <n>          Benchmark n requests', kind: 'out' },
        { text: '  clear              Clear output', kind: 'out' },
      ],
      sources: this.sources.map(s => ({
        text: `  ${s.icon} ${s.name.padEnd(18)} ${s.status.padEnd(14)} ${s.latency}ms  ${s.products} products`,
        kind: s.status === 'online' ? 'ok' : s.status === 'rate-limited' ? 'dim' : 'err',
      })),
      status: [
        { text: '✓ API Server           OK       uptime 99.8%', kind: 'ok' },
        { text: '✓ Database             OK       12ms    284K rows', kind: 'ok' },
        { text: '✓ Redis Cache          OK       2ms     hit rate 94%', kind: 'ok' },
        { text: '⚠ Souq Source          DEGRADED 480ms   rate-limited', kind: 'err' },
        { text: '✓ 6/7 Sources healthy', kind: 'ok' },
      ],
      clear: [],
    };

    if (cmd === 'clear') {
      this.termLines.set(this.termLines().slice(0, 4));
      return;
    }

    if (cmd.startsWith('search ')) {
      const q = cmd.replace('search ', '');
      this.termLines.update(list => [
        ...list,
        { text: `Scraping ${this.sources.length} sources for "${q}"…`, kind: 'dim' },
        { text: '✓ Amazon   47 matches in 240ms', kind: 'ok' },
        { text: '✓ Noon     38 matches in 180ms', kind: 'ok' },
        { text: '✓ Jumia    24 matches in 320ms', kind: 'ok' },
        { text: '⚠ Souq     rate-limited, skipped', kind: 'err' },
        { text: '✓ OLX      12 matches in 210ms', kind: 'ok' },
        { text: '', kind: 'dim' },
        { text: 'Total: 121 products, best match 98%', kind: 'ok' },
      ]);
      return;
    }

    if (cmd.startsWith('bench ')) {
      const n = cmd.replace('bench ', '');
      this.termLines.update(list => [
        ...list,
        { text: `Running ${n} concurrent requests…`, kind: 'dim' },
        { text: `p50: 240ms  p90: 380ms  p99: 620ms`, kind: 'out' },
        { text: `Throughput: 142 req/s  Errors: 0`, kind: 'ok' },
      ]);
      return;
    }

    const res = responses[cmd];
    if (res) {
      this.termLines.update(list => [...list, ...res]);
    } else {
      this.termLines.update(list => [
        ...list,
        { text: `command not found: ${cmd}`, kind: 'err' },
      ]);
    }
  }
}