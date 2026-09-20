import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PreviewNavItem, PreviewShellComponent } from '../../shared/preview-shell/preview-shell';

interface ScrapedProduct {
  id: number; name: string; price: number; source: string;
  sourceIcon: string; rating: number; inStock: boolean; match: number;
}

@Component({
  selector: 'app-ar-room-preview',
  standalone: true,
  imports: [PreviewShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🔍"
      title="AR-Room"
      subtitle="Product aggregation"
      [nav]="nav"
      [active]="active()"
    >
      @if (active() === 'search') {
        <div class="search-view">
          <div class="hero-search">
            <h3>Aggregate products from anywhere</h3>
            <p>Search once. Get results from 5+ platforms.</p>
            <div class="search-input">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <circle cx="9" cy="9" r="6" /><path d="m17 17-3.5-3.5" />
              </svg>
              <input placeholder="Search for a product…" [value]="query()" (input)="query.set($any($event.target).value)"
                     (keydown.enter)="runSearch()" />
              <button class="search-btn" (click)="runSearch()" [disabled]="scraping()">
                {{ scraping() ? '⟳ Scraping…' : 'Search' }}
              </button>
            </div>
          </div>

          @if (scraping() || progress() > 0) {
            <section class="progress-card">
              <header>
                <b>Scraping sources…</b>
                <span class="mono">{{ progress() }}%</span>
              </header>
              <div class="progress-track">
                <div class="progress-fill" [style.width.%]="progress()"></div>
              </div>
              <div class="sources-list">
                @for (s of sources(); track s.id) {
                  <div class="src-chip" [class.done]="s.done">
                    <span>{{ s.icon }}</span>
                    {{ s.name }}
                    <span class="src-state">{{ s.done ? '✓' : '⟳' }}</span>
                  </div>
                }
              </div>
            </section>
          }

          @if (results().length > 0) {
            <section class="results-card">
              <header class="rc-head">
                <b>{{ results().length }} matches found</b>
                <span class="muted">Sorted by match %</span>
              </header>
              <ul class="result-list">
                @for (r of results(); track r.id) {
                  <li class="result-row" [class.best]="r.match >= 90">
                    <div class="rr-img">{{ r.sourceIcon }}</div>
                    <div class="rr-body">
                      <div class="rr-top">
                        <b>{{ r.name }}</b>
                        @if (r.match >= 90) { <span class="badge best">Best match</span> }
                      </div>
                      <div class="rr-meta">
                        <span class="rr-source">{{ r.source }}</span>
                        <span class="rr-rating">★ {{ r.rating }}</span>
                        <span class="rr-stock" [class.out]="!r.inStock">
                          {{ r.inStock ? 'In stock' : 'Out of stock' }}
                        </span>
                        <span class="rr-match">Match {{ r.match }}%</span>
                      </div>
                    </div>
                    <span class="rr-price">$ {{ r.price }}</span>
                  </li>
                }
              </ul>
            </section>
          }
        </div>
      } @else if (active() === 'sources') {
        <div class="sources-view">
          <h3>Connected Sources</h3>
          <p>Platforms currently being scraped</p>
          <div class="src-grid">
            @for (s of allSources; track s.id) {
              <article class="src-card" [class.active]="s.active">
                <div class="src-header">
                  <span class="src-icon">{{ s.icon }}</span>
                  <b>{{ s.name }}</b>
                  <button class="toggle" [class.on]="s.active" (click)="toggleSource(s.id)">
                    <span class="knob"></span>
                  </button>
                </div>
                <div class="src-stats">
                  <div><b>{{ s.products }}</b><small>products</small></div>
                  <div><b>{{ s.latency }}ms</b><small>avg latency</small></div>
                  <div><b>{{ s.uptime }}%</b><small>uptime</small></div>
                </div>
              </article>
            }
          </div>
        </div>
      } @else {
        <div class="analytics-view">
          <h3>Scraping Analytics</h3>
          <div class="kpis">
            <div class="kpi"><span>Products indexed</span><b>284,512</b></div>
            <div class="kpi"><span>Searches today</span><b>1,847</b></div>
            <div class="kpi"><span>Avg response</span><b>2.4s</b></div>
            <div class="kpi"><span>Success rate</span><b>98.7%</b></div>
          </div>
          <section class="chart-card">
            <h4>Requests — Last 7 days</h4>
            <div class="chart-bars">
              @for (v of weekData; track $index) {
                <div class="cb-wrap">
                  <div class="cb" [style.height.%]="v"></div>
                  <small>{{ days[$index] }}</small>
                </div>
              }
            </div>
          </section>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .muted { font-size: var(--fs-2xs); color: var(--label-2); }

    /* SEARCH */
    .search-view { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .hero-search {
      text-align: center;
      padding: 40px 24px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
    }
    .hero-search h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; margin-bottom: 6px; }
    .hero-search p { font-size: var(--fs-sm); color: var(--label-2); margin-bottom: 24px; }
    .search-input {
      display: flex;
      align-items: center;
      gap: 10px;
      max-width: 520px;
      margin: 0 auto;
      padding: 6px 6px 6px 16px;
      background: var(--bg-input);
      border: 1px solid var(--separator);
      border-radius: var(--r-pill);
      transition: border-color var(--t-fast);
    }
    .search-input:focus-within { border-color: var(--accent); }
    .search-input svg { width: 16px; height: 16px; color: var(--label-3); }
    .search-input input {
      flex: 1;
      background: transparent;
      border: 0;
      outline: none;
      font-size: var(--fs-sm);
      color: var(--label);
    }
    .search-btn {
      padding: 8px 18px;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: var(--r-pill);
      font-size: var(--fs-xs);
      font-weight: 700;
      transition: all var(--t-fast);
    }
    .search-btn:hover:not(:disabled) { background: var(--accent-hover); }
    .search-btn:disabled { opacity: 0.7; cursor: wait; }

    .progress-card, .results-card {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      animation: slideUp 320ms var(--ease-spring);
    }
    @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .progress-card header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 12px;
    }
    .progress-card header b { font-size: var(--fs-sm); font-weight: 700; }
    .progress-track { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill);
                      overflow: hidden; margin-bottom: 16px; }
    .progress-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill);
                     transition: width 200ms var(--ease-out); }
    .sources-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .src-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-weight: 600;
      transition: all var(--t-base);
    }
    .src-chip.done { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .src-state { margin-left: 4px; }

    .rc-head { display: flex; justify-content: space-between; align-items: baseline;
               margin-bottom: 14px; }
    .rc-head b { font-size: var(--fs-sm); font-weight: 700; }
    .result-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .result-row {
      display: grid;
      grid-template-columns: 48px 1fr auto;
      gap: 14px;
      align-items: center;
      padding: 12px 14px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      border-left: 3px solid transparent;
      transition: all var(--t-base);
    }
    .result-row:hover { background: var(--bg-fill-3); }
    .result-row.best { border-left-color: var(--accent); }
    .rr-img {
      width: 48px; height: 48px;
      display: grid; place-items: center;
      background: var(--bg-surface-solid);
      border-radius: var(--r-sm);
      font-size: 22px;
    }
    .rr-top { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .rr-top b { font-size: var(--fs-sm); font-weight: 600; }
    .badge.best {
      background: var(--accent-soft);
      color: var(--accent);
      padding: 2px 8px;
      border-radius: var(--r-pill);
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .rr-meta { display: flex; gap: 14px; font-size: var(--fs-2xs); color: var(--label-2);
               flex-wrap: wrap; }
    .rr-source { color: var(--label); font-weight: 600; }
    .rr-rating { color: #ff9500; font-weight: 600; }
    .rr-stock { color: #34c759; }
    .rr-stock.out { color: #ff3b30; }
    .rr-match { color: var(--accent); font-weight: 700; }
    .rr-price { font-size: var(--fs-md); font-weight: 800; color: var(--accent);
                font-variant-numeric: tabular-nums; }

    /* SOURCES */
    .sources-view { max-width: 900px; margin: 0 auto; }
    .sources-view h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .sources-view > p { font-size: var(--fs-sm); color: var(--label-2); margin: 4px 0 20px; }
    .src-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
    .src-card {
      padding: 18px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      transition: all var(--t-base) var(--ease-spring);
    }
    .src-card:hover { transform: translateY(-2px); }
    .src-card.active { border-color: var(--accent); }
    .src-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .src-icon { font-size: 22px; }
    .src-header b { flex: 1; font-size: var(--fs-sm); font-weight: 700; }
    .toggle {
      position: relative;
      width: 40px; height: 24px;
      border-radius: var(--r-pill);
      background: var(--bg-fill-3);
      transition: background var(--t-base);
    }
    .toggle.on { background: #34c759; }
    .knob {
      position: absolute; top: 3px; left: 3px;
      width: 18px; height: 18px;
      background: #fff; border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      transition: transform var(--t-base) var(--ease-spring);
    }
    .toggle.on .knob { transform: translateX(16px); }
    .src-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
                 padding-top: 12px; border-top: 0.5px solid var(--separator); }
    .src-stats div { display: flex; flex-direction: column; gap: 2px; }
    .src-stats b { font-size: var(--fs-sm); font-weight: 700; font-variant-numeric: tabular-nums; }
    .src-stats small { font-size: 9px; color: var(--label-3); text-transform: uppercase;
                       letter-spacing: 0.04em; }

    /* ANALYTICS */
    .analytics-view { max-width: 900px; margin: 0 auto; }
    .analytics-view h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 20px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    @media (max-width: 780px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
    .kpi { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
           border-radius: var(--r-md); }
    .kpi span { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase;
                letter-spacing: 0.06em; font-weight: 600; }
    .kpi b { display: block; font-size: var(--fs-2xl); font-weight: 800;
             letter-spacing: -0.03em; margin-top: 4px; font-variant-numeric: tabular-nums; }
    .chart-card { padding: 20px; background: var(--bg-surface-solid);
                  border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .chart-card h4 { font-size: var(--fs-sm); font-weight: 700; margin-bottom: 16px; }
    .chart-bars { display: flex; align-items: flex-end; gap: 10px; height: 160px; }
    .cb-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end; }
    .cb { width: 100%; background: var(--accent); border-radius: var(--r-sm) var(--r-sm) 4px 4px;
          transition: transform var(--t-base); animation: grow 500ms var(--ease-spring); }
    .cb:hover { transform: translateY(-3px); }
    @keyframes grow { from { height: 0; } }
    .cb-wrap small { font-size: var(--fs-2xs); color: var(--label-2); }
  `],
})
export class ArRoomPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'search',    label: 'Search',    icon: '🔍' },
    { id: 'sources',   label: 'Sources',   icon: '🔗' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ];
  readonly active = signal('search');

  readonly query = signal('');
  readonly scraping = signal(false);
  readonly progress = signal(0);
  readonly results = signal<ScrapedProduct[]>([]);

  readonly sources = signal([
    { id: 1, name: 'Amazon', icon: '🛒', done: false },
    { id: 2, name: 'Noon',   icon: '📦', done: false },
    { id: 3, name: 'Jumia',  icon: '🏬', done: false },
    { id: 4, name: 'Souq',   icon: '🛍', done: false },
    { id: 5, name: 'OLX',    icon: '📱', done: false },
  ]);

  readonly allSources = [
    { id: 1, name: 'Amazon', icon: '🛒', active: true,  products: 18420, latency: 240, uptime: 99.8 },
    { id: 2, name: 'Noon',   icon: '📦', active: true,  products: 12104, latency: 180, uptime: 99.5 },
    { id: 3, name: 'Jumia',  icon: '🏬', active: true,  products: 8902,  latency: 320, uptime: 98.2 },
    { id: 4, name: 'Souq',   icon: '🛍', active: false, products: 4210,  latency: 480, uptime: 94.1 },
    { id: 5, name: 'OLX',    icon: '📱', active: true,  products: 23810, latency: 210, uptime: 99.2 },
  ];

  readonly days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  readonly weekData = [42, 55, 48, 72, 65, 88, 92];

  runSearch(): void {
    if (this.scraping()) return;
    this.results.set([]);
    this.scraping.set(true);
    this.progress.set(0);
    this.sources.update(list => list.map(s => ({ ...s, done: false })));

    const tick = setInterval(() => {
      const p = this.progress();
      const next = Math.min(p + 4, 100);
      this.progress.set(next);
      const doneCount = Math.floor(next / 20);
      this.sources.update(list => list.map((s, i) => ({ ...s, done: i < doneCount })));

      if (next >= 100) {
        clearInterval(tick);
        this.scraping.set(false);
        this.results.set(this.mockResults());
      }
    }, 120);
  }

  private mockResults(): ScrapedProduct[] {
    return [
      { id: 1, name: 'Wireless Headphones Pro',       price: 189, source: 'Amazon', sourceIcon: '🛒', rating: 4.7, inStock: true,  match: 98 },
      { id: 2, name: 'Noise-Cancelling Headphones',   price: 175, source: 'Noon',   sourceIcon: '📦', rating: 4.6, inStock: true,  match: 94 },
      { id: 3, name: 'Studio Headphones',             price: 210, source: 'Jumia',  sourceIcon: '🏬', rating: 4.8, inStock: false, match: 89 },
      { id: 4, name: 'Compact Headphones',            price: 89,  source: 'OLX',    sourceIcon: '📱', rating: 4.2, inStock: true,  match: 74 },
      { id: 5, name: 'Gaming Headset',                price: 145, source: 'Amazon', sourceIcon: '🛒', rating: 4.5, inStock: true,  match: 82 },
    ];
  }

  toggleSource(id: number): void {
    const idx = this.allSources.findIndex(s => s.id === id);
    if (idx >= 0) this.allSources[idx] = { ...this.allSources[idx], active: !this.allSources[idx].active };
  }
}