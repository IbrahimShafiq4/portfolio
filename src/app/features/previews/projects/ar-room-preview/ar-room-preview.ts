import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CodeViewerComponent } from '../../shared/code-viewer.component/code-viewer.component';
import { PreviewShellComponent, PreviewNavItem, ToolbarAction, PreviewNotification } from '../../shared/preview-shell/preview-shell';

type ARView =
  | 'dashboard' | 'live' | 'analytics'
  | 'search' | 'categories' | 'trending' | 'deals'
  | 'watchlist' | 'compare' | 'history' | 'saved'
  | 'sources' | 'jobs' | 'health'
  | 'alerts' | 'notifications'
  | 'logs' | 'api' | 'architecture' | 'settings';

interface ARProduct {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  image: string;
  brand: string;
  rating: number;
  reviews: number;
  sources: ARSourcePrice[];
  bestPrice: number;
  worstPrice: number;
  avgPrice: number;
  lowestEver: number;
  discount: number;
  trend: 'up' | 'down' | 'stable';
  trendPct: number;
  inStock: boolean;
  matchScore: number;
  tags: string[];
  addedAt: string;
  views: number;
  searches: number;
}

interface ARSourcePrice {
  sourceId: string;
  price: number;
  oldPrice?: number;
  inStock: boolean;
  url: string;
  shipping: number;
  deliveryDays: number;
  scrapedAt: string;
}

interface ARSource {
  id: string;
  name: string;
  icon: string;
  color: string;
  status: 'online' | 'degraded' | 'offline';
  products: number;
  latency: number;
  uptime: number;
  lastSync: string;
  rateLimit: number;
  used: number;
  requestsToday: number;
  errors24h: number;
  enabled: boolean;
}

interface ARJob {
  id: string;
  query: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  sources: string[];
  productsFound: number;
  startedAt: string;
  duration: string;
  errors: number;
  worker: string;
}

interface ARAlert {
  id: string;
  productId: string;
  productName: string;
  targetPrice: number;
  currentPrice: number;
  status: 'active' | 'triggered' | 'paused';
  createdAt: string;
  triggeredAt?: string;
}

interface ARLogEntry {
  id: number;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  source: string;
  message: string;
}

interface ARWatchItem {
  productId: string;
  addedAt: string;
  note: string;
  priceWhenAdded: number;
}

@Component({
  selector: 'app-ar-room-preview',
  standalone: true,
  imports: [PreviewShellComponent, CodeViewerComponent, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🔍"
      title="AR-Room"
      subtitle="Home Lab · Price Aggregator · {{ sources.length }} sources"
      [nav]="nav()"
      [active]="active()"
      (activeChange)="onNav($any($event))"
      [toolbarActions]="toolbar()"
      [notifications]="notifs()"
      [searchPlaceholder]="searchPlaceholder()"
      (searchChange)="onSearch($event)"
    >
      @switch (active()) {

        @case ('dashboard') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Overview</span>
                <h3>Dashboard</h3>
                <p>Real-time snapshot of your price aggregation engine</p>
              </div>
              <div class="view-actions">
                <button class="pill" (click)="active.set('live')">🔴 Live</button>
                <button class="pill primary" (click)="runQuickScan()">▶ Run scan</button>
              </div>
            </header>

            @if (criticalSources() > 0) {
              <div class="banner warn">
                <span class="banner-icon">⚠️</span>
                <div>
                  <b>{{ criticalSources() }} source(s) need attention</b>
                  <small>Check the health monitor for details</small>
                </div>
                <button class="banner-action" (click)="active.set('health')">Open health</button>
              </div>
            }

            <section class="kpis">
              @for (k of dashboardKpis(); track k.label) {
                <article class="kpi" [style.--c]="k.color" (click)="k.go()">
                  <span class="kpi-icon">{{ k.icon }}</span>
                  <b class="kpi-val">{{ k.value }}</b>
                  <span class="kpi-label">{{ k.label }}</span>
                  <div class="kpi-trend" [class.up]="k.trendUp" [class.down]="!k.trendUp">
                    {{ k.trendUp ? '▲' : '▼' }} {{ k.trend }}
                  </div>
                </article>
              }
            </section>

            <div class="grid-2">
              <section class="card">
                <header class="card-head">
                  <div>
                    <h4>Live scrape feed</h4>
                    <small>{{ recentJobs().length }} active · last 24h</small>
                  </div>
                  <button class="pill-sm" (click)="active.set('jobs')">View all</button>
                </header>
                <ul class="feed">
                  @for (j of recentJobs().slice(0, 6); track j.id) {
                    <li class="feed-item" (click)="openJob(j.id)">
                      <span class="fi-icon" [attr.data-s]="j.status">{{ statusIcon(j.status) }}</span>
                      <div class="fi-body">
                        <div class="fi-row">
                          <b>{{ j.query }}</b>
                          <span class="fi-status" [attr.data-s]="j.status">{{ j.status }}</span>
                        </div>
                        <div class="fi-meta">
                          <span>{{ j.sources.length }} sources</span>
                          <span>{{ j.productsFound }} found</span>
                          <span>{{ j.duration }}</span>
                        </div>
                      </div>
                    </li>
                  }
                </ul>
              </section>

              <section class="card">
                <header class="card-head">
                  <div>
                    <h4>Price drops</h4>
                    <small>Detected in the last 24 hours</small>
                  </div>
                </header>
                <ul class="drops">
                  @for (d of priceDrops(); track d.product.id) {
                    <li class="drop-item" (click)="openProduct(d.product.id)">
                      <span class="drop-icon">{{ d.product.image }}</span>
                      <div class="drop-body">
                        <b>{{ d.product.name }}</b>
                        <small>{{ d.product.brand }} · {{ d.product.category }}</small>
                      </div>
                      <div class="drop-price">
                        <s>{{ d.oldPrice | number }} EGP</s>
                        <b>{{ d.product.bestPrice | number }} EGP</b>
                        <span class="drop-pct">−{{ d.pct }}%</span>
                      </div>
                    </li>
                  }
                </ul>
              </section>
            </div>

            <section class="card">
              <header class="card-head">
                <div>
                  <h4>Top sources</h4>
                  <small>{{ sources.length }} connected · {{ onlineSources() }} online</small>
                </div>
                <button class="pill-sm" (click)="active.set('sources')">Manage</button>
              </header>
              <div class="sources-row">
                @for (s of topSources(); track s.id) {
                  <div class="source-mini" [style.--c]="s.color" (click)="openSource(s.id)">
                    <span class="sm-icon">{{ s.icon }}</span>
                    <div class="sm-body">
                      <b>{{ s.name }}</b>
                      <small>{{ s.products | number }} products</small>
                    </div>
                    <div class="sm-health">
                      <div class="sm-bar"><div class="sm-fill" [style.width.%]="s.uptime"></div></div>
                      <span>{{ s.uptime }}%</span>
                    </div>
                  </div>
                }
              </div>
            </section>

            <div class="grid-2">
              <section class="card">
                <header class="card-head"><h4>Popular categories</h4></header>
                <div class="cat-bars">
                  @for (c of categoryStats(); track c.name) {
                    <div class="cat-bar">
                      <span class="cb-icon">{{ c.icon }}</span>
                      <span class="cb-name">{{ c.name }}</span>
                      <div class="cb-track"><div class="cb-fill" [style.width.%]="c.pct" [style.background]="c.color"></div></div>
                      <span class="cb-count mono">{{ c.count }}</span>
                    </div>
                  }
                </div>
              </section>

              <section class="card">
                <header class="card-head"><h4>System status</h4></header>
                <ul class="status-list">
                  @for (s of systemStatus(); track s.label) {
                    <li class="status-row">
                      <span class="status-dot" [attr.data-s]="s.status"></span>
                      <div>
                        <b>{{ s.label }}</b>
                        <small>{{ s.value }}</small>
                      </div>
                      <span class="status-tag" [attr.data-s]="s.status">{{ s.tag }}</span>
                    </li>
                  }
                </ul>
              </section>
            </div>
          </div>
        }

        @case ('live') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Real-time</span>
                <h3>Live Monitor</h3>
                <p>Watch the scraper fleet work in real time</p>
              </div>
              <div class="view-actions">
                <span class="live-badge"><span class="pulse"></span> LIVE</span>
              </div>
            </header>

            <section class="workers">
              @for (w of workers(); track w.id) {
                <article class="worker" [attr.data-s]="w.status">
                  <header>
                    <span class="worker-icon">{{ w.icon }}</span>
                    <div>
                      <b>{{ w.name }}</b>
                      <small>{{ w.currentTask }}</small>
                    </div>
                    <span class="worker-badge" [attr.data-s]="w.status">{{ w.status }}</span>
                  </header>
                  <div class="worker-progress">
                    <div class="wp-track"><div class="wp-fill" [style.width.%]="w.progress"></div></div>
                    <span class="mono">{{ w.progress }}%</span>
                  </div>
                  <footer class="worker-foot">
                    <span>⏱ {{ w.elapsed }}</span>
                    <span>📦 {{ w.found }} items</span>
                    <span>⚡ {{ w.rps }} req/s</span>
                  </footer>
                </article>
              }
            </section>

            <section class="card terminal-card">
              <header class="card-head">
                <div>
                  <h4>Live log tail</h4>
                  <small>Auto-scrolling · last 40 events</small>
                </div>
                <button class="pill-sm" (click)="active.set('logs')">Full logs</button>
              </header>
              <div class="log-tail">
                @for (log of liveLogs(); track log.id) {
                  <div class="log-line" [attr.data-l]="log.level">
                    <span class="ll-time mono">{{ log.time }}</span>
                    <span class="ll-level" [attr.data-l]="log.level">{{ log.level }}</span>
                    <span class="ll-source">[{{ log.source }}]</span>
                    <span class="ll-msg">{{ log.message }}</span>
                  </div>
                }
              </div>
            </section>

            <section class="card">
              <header class="card-head"><h4>Concurrent requests</h4></header>
              <div class="req-chart">
                @for (r of requestHistory; track $index) {
                  <div class="req-bar" [style.height.%]="r" [title]="r + ' req/s'"></div>
                }
              </div>
              <div class="req-axis">
                <span>30s ago</span>
                <span>Now</span>
              </div>
            </section>
          </div>
        }

        @case ('analytics') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Insights</span>
                <h3>Analytics</h3>
                <p>Trends and performance across the entire scraping fleet</p>
              </div>
              <div class="view-actions">
                <select class="sel" [value]="analyticsRange()" (change)="analyticsRange.set($any($event.target).value)">
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
            </header>

            <section class="kpis">
              @for (k of analyticsKpis(); track k.label) {
                <article class="kpi" [style.--c]="k.color">
                  <span class="kpi-icon">{{ k.icon }}</span>
                  <b class="kpi-val">{{ k.value }}</b>
                  <span class="kpi-label">{{ k.label }}</span>
                </article>
              }
            </section>

            <section class="card">
              <header class="card-head">
                <h4>Search volume</h4>
                <span class="muted mono">{{ analyticsRange() }}</span>
              </header>
              <div class="line-chart">
                @for (v of searchVolume(); track $index) {
                  <div class="lc-col">
                    <div class="lc-bar" [style.height.%]="v"></div>
                  </div>
                }
              </div>
              <div class="lc-axis">
                @for (l of analyticsLabels(); track l) {
                  <span>{{ l }}</span>
                }
              </div>
            </section>

            <div class="grid-2">
              <section class="card">
                <header class="card-head"><h4>Source performance</h4></header>
                <div class="perf-list">
                  @for (s of sourcePerformance(); track s.id) {
                    <div class="perf-row">
                      <span class="pr-icon" [style.background]="s.color + '22'" [style.color]="s.color">{{ s.icon }}</span>
                      <span class="pr-name">{{ s.name }}</span>
                      <div class="pr-track"><div class="pr-fill" [style.width.%]="s.score" [style.background]="s.color"></div></div>
                      <span class="pr-score mono">{{ s.score }}%</span>
                    </div>
                  }
                </div>
              </section>

              <section class="card">
                <header class="card-head"><h4>By category</h4></header>
                <div class="pie-list">
                  @for (c of categoryStats(); track c.name) {
                    <div class="pie-row">
                      <span class="pie-dot" [style.background]="c.color"></span>
                      <span class="pie-name">{{ c.name }}</span>
                      <span class="pie-pct mono">{{ c.pct }}%</span>
                    </div>
                  }
                </div>
              </section>
            </div>

            <section class="card">
              <header class="card-head"><h4>Top searches</h4></header>
              <div class="table-wrap">
                <header class="thead cols-4">
                  <span>#</span>
                  <span>Query</span>
                  <span>Volume</span>
                  <span>Trend</span>
                </header>
                @for (t of topSearches(); track t.query; let i = $index) {
                  <div class="trow cols-4">
                    <span class="mono">{{ i + 1 }}</span>
                    <span class="cell-name">{{ t.query }}</span>
                    <span class="mono">{{ t.volume | number }}</span>
                    <span class="trend" [class.up]="t.trend > 0" [class.down]="t.trend < 0">
                      {{ t.trend > 0 ? '▲' : t.trend < 0 ? '▼' : '·' }} {{ t.trend }}%
                    </span>
                  </div>
                }
              </div>
            </section>
          </div>
        }

        @case ('search') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Discovery</span>
                <h3>Search</h3>
                <p>Aggregate results across {{ sources.length }} sources</p>
              </div>
            </header>

            <section class="search-hero">
              <div class="search-box">
                <span class="sb-icon">🔍</span>
                <input
                  placeholder="Search any product, brand, or category…"
                  [value]="query()"
                  (input)="query.set($any($event.target).value)"
                  (keydown.enter)="runSearch()"
                />
                @if (query()) {
                  <button class="sb-clear" (click)="query.set('')">✕</button>
                }
                <button class="sb-go" (click)="runSearch()" [disabled]="scraping()">
                  {{ scraping() ? 'Scraping…' : 'Search' }}
                </button>
              </div>

              <div class="search-suggestions">
                <span class="ss-label">Popular:</span>
                @for (s of popularSearches; track s) {
                  <button class="ss-chip" (click)="quickSearch(s)">{{ s }}</button>
                }
              </div>
            </section>

            <div class="search-layout">
              <aside class="filters-panel">
                <header class="fp-head">
                  <b>Filters</b>
                  <button class="fp-reset" (click)="resetFilters()">Reset</button>
                </header>

                <div class="fp-group">
                  <label>Category</label>
                  <select class="sel" [value]="filterCategory()" (change)="filterCategory.set($any($event.target).value)">
                    <option value="all">All categories</option>
                    @for (c of allCategories; track c) {
                      <option [value]="c">{{ c }}</option>
                    }
                  </select>
                </div>

                <div class="fp-group">
                  <label>Price range (EGP)</label>
                  <div class="range-row">
                    <input type="number" class="input-sm" placeholder="Min" [value]="priceMin()" (input)="priceMin.set(+$any($event.target).value)" />
                    <span>—</span>
                    <input type="number" class="input-sm" placeholder="Max" [value]="priceMax()" (input)="priceMax.set(+$any($event.target).value)" />
                  </div>
                </div>

                <div class="fp-group">
                  <label>Rating</label>
                  <div class="stars-row">
                    @for (r of [4, 3, 2, 1]; track r) {
                      <button class="star-btn" [class.active]="minRating() === r" (click)="minRating.set(r)">
                        {{ r }}+ ★
                      </button>
                    }
                  </div>
                </div>

                <div class="fp-group">
                  <label>Sources</label>
                  <div class="sources-checks">
                    @for (s of sources; track s.id) {
                      <label class="src-check">
                        <input type="checkbox" [checked]="selectedSources().includes(s.id)" (change)="toggleSourceFilter(s.id)" />
                        <span class="sc-icon">{{ s.icon }}</span>
                        <span>{{ s.name }}</span>
                      </label>
                    }
                  </div>
                </div>

                <div class="fp-group">
                  <label class="check-row">
                    <input type="checkbox" [checked]="inStockOnly()" (change)="inStockOnly.set(!inStockOnly())" />
                    <span>In stock only</span>
                  </label>
                  <label class="check-row">
                    <input type="checkbox" [checked]="withDiscount()" (change)="withDiscount.set(!withDiscount())" />
                    <span>On sale only</span>
                  </label>
                </div>

                <div class="fp-group">
                  <label>Sort by</label>
                  <select class="sel" [value]="sortBy()" (change)="sortBy.set($any($event.target).value)">
                    <option value="match">Best match</option>
                    <option value="price-asc">Price low → high</option>
                    <option value="price-desc">Price high → low</option>
                    <option value="rating">Rating</option>
                    <option value="discount">Biggest discount</option>
                    <option value="reviews">Most reviews</option>
                  </select>
                </div>
              </aside>

              <main class="results-area">
                @if (scraping()) {
                  <div class="progress-card">
                    <header>
                      <b>Scraping in progress</b>
                      <span class="mono">{{ progress() }}%</span>
                    </header>
                    <div class="progress-track"><div class="progress-fill" [style.width.%]="progress()"></div></div>
                    <div class="src-chips">
                      @for (s of sources; track s.id) {
                        <span class="src-chip" [class.done]="srcDone(s.id)">
                          {{ s.icon }} {{ s.name }} {{ srcDone(s.id) ? '✓' : '⟳' }}
                        </span>
                      }
                    </div>
                  </div>
                }

                <header class="results-head">
                  <div>
                    <b>{{ filteredProducts().length }} results</b>
                    @if (query()) { <small>for "{{ query() }}"</small> }
                  </div>
                  <div class="view-toggle">
                    <button class="vt" [class.active]="resultView() === 'grid'" (click)="resultView.set('grid')">▦</button>
                    <button class="vt" [class.active]="resultView() === 'list'" (click)="resultView.set('list')">☰</button>
                  </div>
                </header>

                @if (resultView() === 'grid') {
                  <div class="product-grid">
                    @for (p of filteredProducts(); track p.id) {
                      <article class="product" (click)="openProduct(p.id)" (contextmenu)="onProductContext($event, p)">
                        <div class="p-image" [style.background]="gradientFor(p)">
                          <span class="p-emoji">{{ p.image }}</span>
                          @if (p.discount > 0) {
                            <span class="p-discount">−{{ p.discount }}%</span>
                          }
                          @if (watchlist().some(w => w.productId === p.id)) {
                            <span class="p-watched">★</span>
                          }
                        </div>
                        <div class="p-body">
                          <span class="p-brand">{{ p.brand }}</span>
                          <b class="p-name">{{ p.name }}</b>
                          <div class="p-rating">
                            <span class="stars">★★★★★</span>
                            <span>{{ p.rating }}</span>
                            <span class="muted">({{ p.reviews }})</span>
                          </div>
                          <div class="p-prices">
                            <b class="p-price">{{ p.bestPrice | number }} EGP</b>
                            @if (p.worstPrice > p.bestPrice) {
                              <s>{{ p.worstPrice | number }}</s>
                            }
                          </div>
                          <div class="p-sources">
                            @for (sp of p.sources.slice(0, 4); track sp.sourceId) {
                              <span class="p-src" [style.background]="sourceColor(sp.sourceId) + '22'" [style.color]="sourceColor(sp.sourceId)" [title]="sourceName(sp.sourceId)">
                                {{ sourceIcon(sp.sourceId) }}
                              </span>
                            }
                            @if (p.sources.length > 4) {
                              <span class="p-src more">+{{ p.sources.length - 4 }}</span>
                            }
                          </div>
                          <div class="p-foot">
                            <span class="p-match">Match {{ p.matchScore }}%</span>
                            <span class="p-trend" [attr.data-t]="p.trend">
                              {{ p.trend === 'up' ? '↑' : p.trend === 'down' ? '↓' : '·' }} {{ p.trendPct }}%
                            </span>
                          </div>
                        </div>
                      </article>
                    } @empty {
                      <div class="empty-state">
                        <span>🔍</span>
                        <b>No products match your filters</b>
                        <small>Try adjusting the price range or sources</small>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="product-list">
                    @for (p of filteredProducts(); track p.id) {
                      <article class="product-row" (click)="openProduct(p.id)">
                        <span class="pr-img" [style.background]="gradientFor(p)">{{ p.image }}</span>
                        <div class="pr-body">
                          <div class="pr-top">
                            <b>{{ p.name }}</b>
                            <span class="pr-brand">{{ p.brand }}</span>
                          </div>
                          <div class="pr-meta">
                            <span>★ {{ p.rating }} ({{ p.reviews }})</span>
                            <span>·</span>
                            <span>{{ p.category }}</span>
                            <span>·</span>
                            <span>Match {{ p.matchScore }}%</span>
                          </div>
                        </div>
                        <div class="pr-price">
                          <b>{{ p.bestPrice | number }} EGP</b>
                          @if (p.discount > 0) {
                            <span class="pr-disc">−{{ p.discount }}%</span>
                          }
                        </div>
                      </article>
                    }
                  </div>
                }
              </main>
            </div>
          </div>
        }

        @case ('categories') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Browse</span>
                <h3>Categories</h3>
                <p>{{ allCategories.length }} categories across the catalog</p>
              </div>
            </header>

            <section class="categories-grid">
              @for (c of categoryDetails(); track c.name) {
                <article class="cat-card" [style.--c]="c.color" (click)="quickSearch(c.name)">
                  <header>
                    <span class="cc-icon">{{ c.icon }}</span>
                    <div>
                      <b>{{ c.name }}</b>
                      <small>{{ c.count }} products</small>
                    </div>
                  </header>
                  <div class="cc-stats">
                    <div><small>Avg price</small><b>{{ c.avgPrice | number }} EGP</b></div>
                    <div><small>Best deal</small><b class="accent">{{ c.bestDeal | number }} EGP</b></div>
                    <div><small>Trend</small><b [class.up]="c.trend > 0" [class.down]="c.trend < 0">{{ c.trend > 0 ? '+' : '' }}{{ c.trend }}%</b></div>
                  </div>
                  <div class="cc-top">
                    @for (p of c.topProducts.slice(0, 3); track p.id) {
                      <span class="cc-chip">{{ p.image }} {{ p.brand }}</span>
                    }
                  </div>
                </article>
              }
            </section>
          </div>
        }

        @case ('trending') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Hot</span>
                <h3>Trending Now</h3>
                <p>What's rising across all sources this week</p>
              </div>
            </header>

            <section class="card">
              <header class="card-head">
                <h4>🔥 Most searched</h4>
                <small>Last 7 days</small>
              </header>
              <div class="trending-list">
                @for (t of trendingSearches(); track t.query; let i = $index) {
                  <div class="trending-row" (click)="quickSearch(t.query)">
                    <span class="tr-rank" [class.top]="i < 3">{{ i + 1 }}</span>
                    <div class="tr-body">
                      <b>{{ t.query }}</b>
                      <small>{{ t.category }}</small>
                    </div>
                    <div class="tr-chart">
                      @for (v of t.sparkline; track $index) {
                        <span class="tr-bar" [style.height.%]="v"></span>
                      }
                    </div>
                    <span class="tr-count mono">{{ t.volume | number }}</span>
                    <span class="tr-trend" [class.up]="t.trend > 0" [class.down]="t.trend < 0">
                      {{ t.trend > 0 ? '▲' : '▼' }} {{ t.trend }}%
                    </span>
                  </div>
                }
              </div>
            </section>

            <section class="card">
              <header class="card-head">
                <h4>⚡ Rising stars</h4>
                <small>Biggest gainers</small>
              </header>
              <div class="rising-grid">
                @for (p of risingStars(); track p.id) {
                  <article class="rising-card" (click)="openProduct(p.id)">
                    <span class="rc-emoji">{{ p.image }}</span>
                    <b>{{ p.name }}</b>
                    <small>{{ p.brand }}</small>
                    <div class="rc-meta">
                      <span class="up">▲ {{ p.trendPct }}%</span>
                      <span class="mono">{{ p.bestPrice | number }} EGP</span>
                    </div>
                  </article>
                }
              </div>
            </section>
          </div>
        }

        @case ('deals') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Save</span>
                <h3>Best Deals</h3>
                <p>Hand-picked discounts across every source</p>
              </div>
            </header>

            <section class="deal-filters">
              <button class="df-chip" [class.active]="dealMin() === 10" (click)="dealMin.set(10)">10%+</button>
              <button class="df-chip" [class.active]="dealMin() === 20" (click)="dealMin.set(20)">20%+</button>
              <button class="df-chip" [class.active]="dealMin() === 30" (click)="dealMin.set(30)">30%+</button>
              <button class="df-chip" [class.active]="dealMin() === 50" (click)="dealMin.set(50)">50%+</button>
            </section>

            <section class="deals-grid">
              @for (p of topDeals(); track p.id) {
                <article class="deal-card" (click)="openProduct(p.id)">
                  <div class="dc-img" [style.background]="gradientFor(p)">
                    <span class="dc-emoji">{{ p.image }}</span>
                    <span class="dc-badge">−{{ p.discount }}%</span>
                  </div>
                  <div class="dc-body">
                    <span class="dc-brand">{{ p.brand }}</span>
                    <b>{{ p.name }}</b>
                    <div class="dc-price">
                      <b>{{ p.bestPrice | number }} EGP</b>
                      @if (p.worstPrice > p.bestPrice) {
                        <s>{{ p.worstPrice | number }}</s>
                      }
                    </div>
                    <div class="dc-save">
                      Save {{ (p.worstPrice - p.bestPrice) | number }} EGP
                    </div>
                    <div class="dc-sources">
                      @for (sp of p.sources.slice(0, 3); track sp.sourceId) {
                        <span class="dc-src" [style.color]="sourceColor(sp.sourceId)">{{ sourceIcon(sp.sourceId) }}</span>
                      }
                    </div>
                  </div>
                </article>
              }
            </section>
          </div>
        }

        @case ('watchlist') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Saved</span>
                <h3>Watchlist</h3>
                <p>{{ watchlist().length }} products you're tracking</p>
              </div>
              <button class="pill" (click)="active.set('alerts')">🔔 Manage alerts</button>
            </header>

            @if (watchlist().length === 0) {
              <div class="empty-state">
                <span>⭐</span>
                <b>Your watchlist is empty</b>
                <small>Add products from search results to track them here</small>
                <button class="pill primary" (click)="active.set('search')">Browse products</button>
              </div>
            } @else {
              <div class="table-wrap">
                <header class="thead cols-6">
                  <span>Product</span>
                  <span>Added</span>
                  <span>Price then</span>
                  <span>Price now</span>
                  <span>Change</span>
                  <span></span>
                </header>
                @for (w of watchlist(); track w.productId) {
                  <div class="trow cols-6">
                    <span class="cell-product" (click)="openProduct(w.productId)">
                      <span class="cp-emoji">{{ productById(w.productId)?.image }}</span>
                      <div>
                        <b>{{ productById(w.productId)?.name }}</b>
                        <small>{{ productById(w.productId)?.brand }}</small>
                      </div>
                    </span>
                    <span class="mono small">{{ w.addedAt }}</span>
                    <span class="mono">{{ w.priceWhenAdded | number }}</span>
                    <span class="mono accent">{{ productById(w.productId)?.bestPrice | number }}</span>
                    <span class="change" [class.up]="priceChange(w) < 0" [class.down]="priceChange(w) > 0">
                      {{ priceChange(w) > 0 ? '↑' : priceChange(w) < 0 ? '↓' : '·' }} {{ absNum(priceChange(w)) | number }}
                    </span>
                    <span class="row-actions">
                      <button class="row-action" title="Buy" (click)="buyProduct(w.productId)">🛒</button>
                      <button class="row-action danger" title="Remove" (click)="removeWatch(w.productId)">✕</button>
                    </span>
                  </div>
                }
              </div>
            }
          </div>
        }

        @case ('compare') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Analyze</span>
                <h3>Compare Products</h3>
                <p>Side-by-side comparison across up to 4 products</p>
              </div>
              <button class="pill" (click)="clearCompare()">Clear all</button>
            </header>

            @if (compareList().length === 0) {
              <div class="empty-state">
                <span>⚖️</span>
                <b>No products to compare</b>
                <small>Add products from search results to compare them here</small>
                <button class="pill primary" (click)="active.set('search')">Add products</button>
              </div>
            } @else {
              <div class="compare-table">
                <div class="compare-head">
                  @for (p of compareList(); track p.id) {
                    <div class="cmp-col">
                      <span class="cmp-emoji">{{ p.image }}</span>
                      <b>{{ p.name }}</b>
                      <small>{{ p.brand }}</small>
                      <button class="cmp-remove" (click)="removeCompare(p.id)">✕</button>
                    </div>
                  }
                </div>
                <div class="compare-rows">
                  @for (row of compareRows(); track row.label) {
                    <div class="cmp-row">
                      <span class="cmp-label">{{ row.label }}</span>
                      @for (v of row.values; track $index) {
                        <span class="cmp-val" [class.best]="v.best" [class.worst]="v.worst">{{ v.value }}</span>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        @case ('history') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Track</span>
                <h3>Price History</h3>
                <p>See how prices evolved over time</p>
              </div>
              <select class="sel" [value]="historyProductId()" (change)="historyProductId.set($any($event.target).value)">
                @for (p of products; track p.id) {
                  <option [value]="p.id">{{ p.name }}</option>
                }
              </select>
            </header>

            @if (historyProduct(); as p) {
              <section class="card">
                <header class="card-head">
                  <div>
                    <h4>{{ p.name }}</h4>
                    <small>{{ p.brand }} · {{ p.category }}</small>
                  </div>
                  <span class="pill-sm accent">{{ p.bestPrice | number }} EGP</span>
                </header>
                <div class="history-chart">
                  <svg viewBox="0 0 600 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.35"/>
                        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
                      </linearGradient>
                    </defs>
                    <path [attr.d]="historyAreaPath()" fill="url(#hg)"/>
                    <path [attr.d]="historyLinePath()" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    @for (pt of historyPoints(); track $index) {
                      <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3.5" fill="var(--accent)" stroke="var(--bg-surface-solid)" stroke-width="2"/>
                    }
                  </svg>
                  <div class="hc-axis">
                    @for (l of historyLabels; track l) {
                      <span>{{ l }}</span>
                    }
                  </div>
                </div>
              </section>

              <section class="kpis">
                @for (s of historyStats(); track s.label) {
                  <article class="kpi" [style.--c]="s.color">
                    <b class="kpi-val">{{ s.value }}</b>
                    <span class="kpi-label">{{ s.label }}</span>
                  </article>
                }
              </section>

              <section class="card">
                <header class="card-head"><h4>Recent changes</h4></header>
                <ul class="history-log">
                  @for (h of historyLog(); track $index) {
                    <li class="hl-row">
                      <span class="hl-date mono">{{ h.date }}</span>
                      <span class="hl-source">{{ sourceIcon(h.sourceId) }} {{ sourceName(h.sourceId) }}</span>
                      <span class="hl-old mono">{{ h.oldPrice | number }} EGP</span>
                      <span class="hl-arrow">→</span>
                      <span class="hl-new mono" [class.up]="h.newPrice > h.oldPrice" [class.down]="h.newPrice < h.oldPrice">
                        {{ h.newPrice | number }} EGP
                      </span>
                      <span class="hl-pct" [class.up]="h.newPrice > h.oldPrice" [class.down]="h.newPrice < h.oldPrice">
                        {{ h.newPrice > h.oldPrice ? '+' : '' }}{{ pct(h.oldPrice, h.newPrice) }}%
                      </span>
                    </li>
                  }
                </ul>
              </section>
            }
          </div>
        }

        @case ('saved') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Shortcuts</span>
                <h3>Saved Searches</h3>
                <p>{{ savedSearches().length }} saved queries</p>
              </div>
              <button class="pill primary" (click)="saveCurrentSearch()">＋ Save current</button>
            </header>

            <section class="saved-grid">
              @for (s of savedSearches(); track s.id) {
                <article class="saved-card" (click)="quickSearch(s.query)">
                  <header>
                    <span class="sc-icon">💾</span>
                    <div>
                      <b>{{ s.query }}</b>
                      <small>{{ s.filters }}</small>
                    </div>
                    <button class="sc-del" (click)="$event.stopPropagation(); deleteSaved(s.id)">✕</button>
                  </header>
                  <div class="sc-meta">
                    <span>🕐 {{ s.savedAt }}</span>
                    <span>📦 {{ s.resultCount }} results</span>
                  </div>
                </article>
              }
            </section>
          </div>
        }

        @case ('sources') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Fleet</span>
                <h3>Sources</h3>
                <p>{{ onlineSources() }} of {{ sources.length }} sources online</p>
              </div>
              <button class="pill primary" (click)="toast.success('Add source', 'Feature coming soon')">＋ Add source</button>
            </header>

            <section class="sources-grid">
              @for (s of sources; track s.id) {
                <article class="source-card" [style.--c]="s.color" [attr.data-s]="s.status" (contextmenu)="onSourceContext($event, s)">
                  <header class="src-head">
                    <span class="src-icon" [style.background]="s.color + '22'" [style.color]="s.color">{{ s.icon }}</span>
                    <div>
                      <b>{{ s.name }}</b>
                      <span class="src-status" [attr.data-s]="s.status">{{ s.status }}</span>
                    </div>
                    <button class="src-toggle" [class.on]="s.enabled" (click)="toggleSource(s.id)">
                      <span class="knob"></span>
                    </button>
                  </header>
                  <div class="src-stats">
                    <div><b class="mono">{{ s.products | number }}</b><small>Products</small></div>
                    <div><b class="mono">{{ s.latency }}ms</b><small>Latency</small></div>
                    <div><b class="mono">{{ s.uptime }}%</b><small>Uptime</small></div>
                  </div>
                  <div class="src-ratelimit">
                    <div class="rl-head">
                      <span>Rate limit</span>
                      <span class="mono">{{ s.used }}/{{ s.rateLimit }}</span>
                    </div>
                    <div class="rl-track">
                      <div class="rl-fill" [style.width.%]="(s.used / s.rateLimit) * 100" [class.hot]="(s.used / s.rateLimit) > 0.8"></div>
                    </div>
                  </div>
                  <footer class="src-foot">
                    <span>🕐 {{ s.lastSync }}</span>
                    <span>❌ {{ s.errors24h }} errors</span>
                    <button class="src-open" (click)="openSource(s.id)">Open →</button>
                  </footer>
                </article>
              }
            </section>
          </div>
        }

        @case ('jobs') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Queue</span>
                <h3>Scrape Jobs</h3>
                <p>{{ jobs.length }} jobs total · {{ runningJobs() }} running</p>
              </div>
              <button class="pill primary" (click)="runQuickScan()">＋ New job</button>
            </header>

            <section class="job-stats">
              @for (s of jobStats(); track s.label) {
                <div class="js-card" [style.--c]="s.color">
                  <b class="mono">{{ s.value }}</b>
                  <small>{{ s.label }}</small>
                </div>
              }
            </section>

            @if (runningJobs() > 0) {
              <section class="card">
                <header class="card-head"><h4>Active jobs</h4></header>
                <div class="active-jobs">
                  @for (j of jobs.filter(j => j.status === 'running' || j.status === 'queued'); track j.id) {
                    <article class="job-card" [attr.data-s]="j.status">
                      <header>
                        <span class="job-icon" [attr.data-s]="j.status">{{ statusIcon(j.status) }}</span>
                        <div>
                          <b>{{ j.query }}</b>
                          <small>{{ j.sources.length }} sources · worker {{ j.worker }}</small>
                        </div>
                        <span class="job-badge" [attr.data-s]="j.status">{{ j.status }}</span>
                      </header>
                      <div class="job-progress">
                        <div class="jp-track"><div class="jp-fill" [style.width.%]="j.progress"></div></div>
                        <span class="mono">{{ j.progress }}%</span>
                      </div>
                      <footer class="job-foot">
                        <span>📦 {{ j.productsFound }} found</span>
                        <span>⏱ {{ j.duration }}</span>
                        <span>❌ {{ j.errors }}</span>
                      </footer>
                    </article>
                  }
                </div>
              </section>
            }

            <section class="card">
              <header class="card-head"><h4>All jobs</h4></header>
              <div class="table-wrap">
                <header class="thead cols-6">
                  <span>ID</span>
                  <span>Query</span>
                  <span>Status</span>
                  <span>Progress</span>
                  <span>Found</span>
                  <span>Duration</span>
                </header>
                @for (j of jobs; track j.id) {
                  <div class="trow cols-6" (click)="openJob(j.id)">
                    <span class="mono">{{ j.id }}</span>
                    <span class="cell-name">{{ j.query }}</span>
                    <span><span class="st" [attr.data-s]="j.status">{{ j.status }}</span></span>
                    <span class="mono">{{ j.progress }}%</span>
                    <span class="mono">{{ j.productsFound }}</span>
                    <span class="mono">{{ j.duration }}</span>
                  </div>
                }
              </div>
            </section>
          </div>
        }

        @case ('health') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Monitor</span>
                <h3>Health Monitor</h3>
                <p>Source availability, latency, and error tracking</p>
              </div>
            </header>

            <section class="health-overview">
              <div class="ho-main" [attr.data-s]="overallHealth().status">
                <span class="ho-icon">{{ overallHealth().icon }}</span>
                <div>
                  <b>{{ overallHealth().label }}</b>
                  <small>{{ overallHealth().message }}</small>
                </div>
              </div>
              <div class="ho-stats">
                <div><b class="mono">{{ onlineSources() }}</b><small>Online</small></div>
                <div><b class="mono warn">{{ degradedSources() }}</b><small>Degraded</small></div>
                <div><b class="mono danger">{{ offlineSources() }}</b><small>Offline</small></div>
              </div>
            </section>

            <section class="card">
              <header class="card-head"><h4>Per-source health</h4></header>
              <div class="health-list">
                @for (s of sources; track s.id) {
                  <div class="health-row" [attr.data-s]="s.status">
                    <span class="hr-icon" [style.background]="s.color + '22'" [style.color]="s.color">{{ s.icon }}</span>
                    <div class="hr-body">
                      <div class="hr-top">
                        <b>{{ s.name }}</b>
                        <span class="hr-status" [attr.data-s]="s.status">{{ s.status }}</span>
                      </div>
                      <div class="hr-bars">
                        <div class="hr-bar">
                          <span class="hr-bar-label">Uptime</span>
                          <div class="hr-track"><div class="hr-fill green" [style.width.%]="s.uptime"></div></div>
                          <span class="mono small">{{ s.uptime }}%</span>
                        </div>
                        <div class="hr-bar">
                          <span class="hr-bar-label">Latency</span>
                          <div class="hr-track"><div class="hr-fill" [style.width.%]="(s.latency / 500) * 100" [class.warn]="s.latency > 300" [class.danger]="s.latency > 450"></div></div>
                          <span class="mono small">{{ s.latency }}ms</span>
                        </div>
                      </div>
                    </div>
                    <div class="hr-meta">
                      <small>{{ s.requestsToday | number }} req today</small>
                      <small class="mono">{{ s.errors24h }} errors</small>
                    </div>
                  </div>
                }
              </div>
            </section>

            <section class="card">
              <header class="card-head"><h4>Error rate</h4></header>
              <div class="error-chart">
                @for (v of errorRates; track $index) {
                  <div class="ec-col">
                    <div class="ec-bar" [style.height.%]="v" [class.high]="v > 5"></div>
                  </div>
                }
              </div>
            </section>
          </div>
        }

        @case ('alerts') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Watch</span>
                <h3>Price Alerts</h3>
                <p>{{ alerts().length }} rules · {{ triggeredAlerts() }} triggered</p>
              </div>
              <button class="pill primary" (click)="toast.success('Create alert', 'Pick a product from search')">＋ New alert</button>
            </header>

            @if (triggeredAlerts() > 0) {
              <div class="banner success">
                <span class="banner-icon">🎉</span>
                <div>
                  <b>{{ triggeredAlerts() }} alert(s) triggered</b>
                  <small>Target prices reached — act fast!</small>
                </div>
              </div>
            }

            <section class="card">
              <header class="card-head"><h4>Active alerts</h4></header>
              <div class="table-wrap">
                <header class="thead cols-6">
                  <span>Product</span>
                  <span>Target</span>
                  <span>Current</span>
                  <span>Status</span>
                  <span>Created</span>
                  <span></span>
                </header>
                @for (a of alerts(); track a.id) {
                  <div class="trow cols-6">
                    <span class="cell-name" (click)="openProduct(a.productId)">{{ a.productName }}</span>
                    <span class="mono">{{ a.targetPrice | number }} EGP</span>
                    <span class="mono accent">{{ a.currentPrice | number }} EGP</span>
                    <span><span class="st" [attr.data-s]="a.status">{{ a.status }}</span></span>
                    <span class="mono small">{{ a.createdAt }}</span>
                    <span class="row-actions">
                      <button class="row-action" title="Pause" (click)="toggleAlert(a.id)">⏸</button>
                      <button class="row-action danger" title="Delete" (click)="deleteAlert(a.id)">✕</button>
                    </span>
                  </div>
                }
              </div>
            </section>

            <section class="card">
              <header class="card-head"><h4>Triggered history</h4></header>
              <ul class="triggered-list">
                @for (t of triggeredAlertsList(); track t.id) {
                  <li class="tg-row">
                    <span class="tg-icon">🎯</span>
                    <div class="tg-body">
                      <b>{{ t.productName }}</b>
                      <small>Target {{ t.targetPrice | number }} EGP · hit at {{ t.triggeredAt }}</small>
                    </div>
                    <button class="pill-sm" (click)="openProduct(t.productId)">View</button>
                  </li>
                }
              </ul>
            </section>
          </div>
        }

        @case ('notifications') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Inbox</span>
                <h3>Notifications</h3>
                <p>{{ notifItems().length }} unread</p>
              </div>
              <button class="pill" (click)="markAllRead()">✓ Mark all read</button>
            </header>

            <section class="card">
              <ul class="notif-list">
                @for (n of notifItems(); track n.id) {
                  <li class="notif-row" [class.unread]="!n.read" (click)="markRead(n.id)">
                    <span class="nt-icon" [style.background]="n.color + '22'" [style.color]="n.color">{{ n.icon }}</span>
                    <div class="nt-body">
                      <b>{{ n.title }}</b>
                      <p>{{ n.message }}</p>
                      <small class="mono">{{ n.time }}</small>
                    </div>
                    <span class="nt-type" [style.color]="n.color">{{ n.type }}</span>
                  </li>
                }
              </ul>
            </section>
          </div>
        }

        @case ('logs') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Debug</span>
                <h3>Live Logs</h3>
                <p>{{ filteredLogs().length }} entries</p>
              </div>
              <div class="view-actions">
                <select class="sel" [value]="logLevel()" (change)="logLevel.set($any($event.target).value)">
                  <option value="all">All levels</option>
                  <option value="INFO">INFO</option>
                  <option value="WARN">WARN</option>
                  <option value="ERROR">ERROR</option>
                  <option value="DEBUG">DEBUG</option>
                </select>
                <button class="pill" (click)="clearLogs()">Clear</button>
              </div>
            </header>

            <div class="log-viewer">
              <header class="lv-head">
                <span class="lv-dot red"></span>
                <span class="lv-dot yellow"></span>
                <span class="lv-dot green"></span>
                <span class="lv-title">arroom-engine · tail -f</span>
                <label class="lv-toggle">
                  <input type="checkbox" [checked]="autoScroll()" (change)="autoScroll.set(!autoScroll())" />
                  <span>Auto-scroll</span>
                </label>
              </header>
              <div class="lv-body">
                @for (log of filteredLogs(); track log.id) {
                  <div class="lv-line" [attr.data-l]="log.level">
                    <span class="lv-time mono">{{ log.time }}</span>
                    <span class="lv-level" [attr.data-l]="log.level">{{ log.level }}</span>
                    <span class="lv-source">[{{ log.source }}]</span>
                    <span class="lv-msg">{{ log.message }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        @case ('api') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Reference</span>
                <h3>API Reference</h3>
                <p>{{ endpoints.length }} endpoints</p>
              </div>
              <button class="pill" (click)="toast.success('Copied', 'Base URL copied')">Copy base URL</button>
            </header>

            <section class="card">
              <div class="api-base">
                <span class="api-base-label">Base URL</span>
                <code class="api-base-url">https://api.arroom.local/v1</code>
              </div>
            </section>

            <section class="api-list">
              @for (ep of endpoints; track ep.id) {
                <article class="api-row" (click)="inspectEndpoint(ep)">
                  <span class="method" [attr.data-m]="ep.method">{{ ep.method }}</span>
                  <code class="route">{{ ep.route }}</code>
                  <span class="desc">{{ ep.description }}</span>
                  <span class="auth" [class.public]="ep.auth === 'public'">{{ ep.auth }}</span>
                </article>
              }
            </section>

            @if (selectedEndpoint(); as ep) {
              <section class="card">
                <header class="card-head">
                  <div>
                    <span class="method" [attr.data-m]="ep.method">{{ ep.method }}</span>
                    <code class="route">{{ ep.route }}</code>
                  </div>
                </header>
                <app-code-viewer [files]="endpointFiles(ep)" />
              </section>
            }
          </div>
        }

        @case ('architecture') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">System</span>
                <h3>Architecture</h3>
                <p>How AR-Room works under the hood</p>
              </div>
            </header>

            <section class="card">
              <header class="card-head"><h4>System diagram</h4></header>
              <pre class="arch-diagram">{{ architecture }}</pre>
            </section>

            <div class="grid-2">
              <section class="card">
                <header class="card-head"><h4>Stack</h4></header>
                <ul class="stack-list">
                  @for (s of stack; track s.name) {
                    <li class="stack-row">
                      <span class="stack-icon">{{ s.icon }}</span>
                      <div>
                        <b>{{ s.name }}</b>
                        <small>{{ s.desc }}</small>
                      </div>
                      <span class="stack-ver mono">{{ s.version }}</span>
                    </li>
                  }
                </ul>
              </section>

              <section class="card">
                <header class="card-head"><h4>Components</h4></header>
                <ul class="arch-list">
                  @for (c of archComponents; track c.name) {
                    <li class="arch-row">
                      <span class="ac-icon">{{ c.icon }}</span>
                      <div>
                        <b>{{ c.name }}</b>
                        <small>{{ c.desc }}</small>
                      </div>
                    </li>
                  }
                </ul>
              </section>
            </div>

            <section class="card">
              <header class="card-head"><h4>Deployment</h4></header>
              <div class="deploy-info">
                <div class="di-row"><span>Host</span><code>home-lab · proxmox-node-01</code></div>
                <div class="di-row"><span>Runtime</span><code>Docker Compose · 4 containers</code></div>
                <div class="di-row"><span>Database</span><code>PostgreSQL 16 · pgvector extension</code></div>
                <div class="di-row"><span>Cache</span><code>Redis 7 · 15 min TTL</code></div>
                <div class="di-row"><span>Reverse proxy</span><code>Caddy · auto-TLS</code></div>
                <div class="di-row"><span>Monitoring</span><code>Grafana + Prometheus</code></div>
              </div>
            </section>
          </div>
        }

        @case ('settings') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Config</span>
                <h3>Settings</h3>
                <p>Tune the scraper engine to your preferences</p>
              </div>
              <button class="pill primary" (click)="saveSettings()">💾 Save</button>
            </header>

            <section class="card">
              <header class="card-head"><h4>Scraping</h4></header>
              <div class="settings-list">
                @for (s of scrapingSettings; track s.key) {
                  <div class="setting-row">
                    <div>
                      <b>{{ s.label }}</b>
                      <small>{{ s.desc }}</small>
                    </div>
                    @if (s.type === 'number') {
                      <input type="number" class="input-sm" [value]="s.value" (input)="updateSetting(s.key, $any($event.target).value)" />
                    } @else if (s.type === 'toggle') {
                      <button class="toggle" [class.on]="s.value" (click)="updateSetting(s.key, !s.value)">
                        <span class="knob"></span>
                      </button>
                    } @else {
                      <input class="input-sm" [value]="s.value" (input)="updateSetting(s.key, $any($event.target).value)" />
                    }
                  </div>
                }
              </div>
            </section>

            <section class="card">
              <header class="card-head"><h4>Notifications</h4></header>
              <div class="settings-list">
                @for (s of notyfSettings; track s.key) {
                  <div class="setting-row">
                    <div>
                      <b>{{ s.label }}</b>
                      <small>{{ s.desc }}</small>
                    </div>
                    <button class="toggle" [class.on]="s.value" (click)="updateNotifSetting(s.key, !s.value)">
                      <span class="knob"></span>
                    </button>
                  </div>
                }
              </div>
            </section>

            <section class="card">
              <header class="card-head"><h4>Data</h4></header>
              <div class="settings-list">
                @for (s of dataSetting; track s.key) {
                  <div class="setting-row">
                    <div>
                      <b>{{ s.label }}</b>
                      <small>{{ s.desc }}</small>
                    </div>
                    <input type="number" class="input-sm" [value]="s.value" (input)="updateDataSetting(s.key, $any($event.target).value)" />
                  </div>
                }
              </div>
            </section>

            <section class="card danger-zone">
              <header class="card-head">
                <h4>⚠️ Danger zone</h4>
                <small>Irreversible operations</small>
              </header>
              <div class="dz-actions">
                <button class="pill danger" (click)="clearCache()">Clear cache</button>
                <button class="pill danger" (click)="resetAll()">Reset all data</button>
              </div>
            </section>
          </div>
        }
      }

      @if (selectedProduct(); as p) {
        <div class="modal-backdrop" (click)="closeProduct()">
          <div class="modal product-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon" [style.background]="gradientFor(p)">{{ p.image }}</span>
              <div>
                <h3>{{ p.name }}</h3>
                <p>{{ p.nameAr }} · {{ p.brand }}</p>
              </div>
              <span class="modal-badge">{{ p.matchScore }}% match</span>
              <button class="modal-close" (click)="closeProduct()">✕</button>
            </header>

            <div class="modal-body">
              <div class="product-hero">
                <div class="ph-price">
                  <small>Best price</small>
                  <b>{{ p.bestPrice | number }} EGP</b>
                  @if (p.discount > 0) {
                    <span class="ph-discount">−{{ p.discount }}%</span>
                  }
                </div>
                <div class="ph-stats">
                  <div><small>Avg</small><b class="mono">{{ p.avgPrice | number }}</b></div>
                  <div><small>Lowest ever</small><b class="mono accent">{{ p.lowestEver | number }}</b></div>
                  <div><small>Rating</small><b class="mono">★ {{ p.rating }}</b></div>
                </div>
              </div>

              <div class="product-sources">
                <h4>Available at {{ p.sources.length }} sources</h4>
                <ul>
                  @for (sp of p.sources; track sp.sourceId) {
                    <li class="ps-row" [class.best]="sp.price === p.bestPrice">
                      <span class="ps-icon" [style.background]="sourceColor(sp.sourceId) + '22'" [style.color]="sourceColor(sp.sourceId)">
                        {{ sourceIcon(sp.sourceId) }}
                      </span>
                      <div class="ps-body">
                        <b>{{ sourceName(sp.sourceId) }}</b>
                        <small>
                          {{ sp.inStock ? '✓ In stock' : '✕ Out of stock' }} ·
                          +{{ sp.shipping }} EGP shipping ·
                          {{ sp.deliveryDays }} days
                        </small>
                      </div>
                      <div class="ps-price">
                        <b>{{ sp.price | number }} EGP</b>
                        @if (sp.oldPrice) { <s>{{ sp.oldPrice | number }}</s> }
                        @if (sp.price === p.bestPrice) {
                          <span class="ps-badge">Best</span>
                        }
                      </div>
                      <a class="ps-buy" [href]="sp.url" target="_blank" (click)="$event.stopPropagation()">Buy →</a>
                    </li>
                  }
                </ul>
              </div>

              <div class="product-tags">
                @for (t of p.tags; track t) {
                  <span class="tag">{{ t }}</span>
                }
              </div>

              <div class="product-actions">
                <button class="pill primary" (click)="addToWatchlist(p.id)">
                  {{ watchlist().some(w => w.productId === p?.id) ? '★ Watching' : '☆ Add to watchlist' }}
                </button>
                <button class="pill" (click)="addToCompare(p.id)">
                  {{ compareList().some(c => c.id === p?.id) ? '⚖️ In compare' : '⚖️ Compare' }}
                </button>
                <button class="pill" (click)="createAlert(p.id)">🔔 Price alert</button>
              </div>
            </div>
          </div>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .view { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .small { font-size: 10px; }
    .accent { color: var(--accent); }
    .up { color: #34c759; }
    .down { color: #ff3b30; }
    .warn { color: #ff9500; }
    .danger { color: #ff3b30; }
    .muted { color: var(--label-2); }

    .view-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
    .view-head h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .view-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }
    .eyebrow { display: block; font-size: var(--fs-2xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); margin-bottom: 6px; }
    .view-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

    .pill { padding: 8px 16px; background: var(--bg-fill-2); color: var(--label); border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600; border: 0; cursor: pointer; transition: all 140ms; }
    .pill:hover { background: var(--bg-fill-3); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }
    .pill.danger { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .pill.danger:hover { background: rgba(255, 59, 48, 0.25); }
    .pill-sm { padding: 6px 12px; background: var(--bg-fill-2); color: var(--label); border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 600; border: 0; cursor: pointer; }
    .pill-sm:hover { background: var(--bg-fill-3); }
    .pill-sm.accent { background: var(--accent-soft); color: var(--accent); }

    .sel { padding: 7px 12px; background: var(--bg-input); color: var(--label); border: 0.5px solid var(--separator); border-radius: var(--r-sm); font-size: var(--fs-xs); cursor: pointer; outline: none; font-family: inherit; }
    .input-sm { padding: 6px 10px; background: var(--bg-input); color: var(--label); border: 0.5px solid var(--separator); border-radius: var(--r-xs); font-size: var(--fs-xs); outline: none; font-family: inherit; min-width: 80px; }

    .banner { display: flex; align-items: center; gap: 14px; padding: 14px 20px; border-radius: var(--r-md); }
    .banner.warn { background: rgba(255, 149, 0, 0.08); border: 1px solid rgba(255, 149, 0, 0.25); }
    .banner.success { background: rgba(52, 199, 89, 0.08); border: 1px solid rgba(52, 199, 89, 0.25); }
    .banner-icon { font-size: 22px; }
    .banner b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .banner small { font-size: var(--fs-2xs); color: var(--label-2); }
    .banner-action { margin-left: auto; padding: 6px 14px; background: rgba(255, 149, 0, 0.15); color: #ff9500; border: 0; border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 700; cursor: pointer; }

    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
    .kpi { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-left: 3px solid var(--c, var(--accent)); cursor: pointer; transition: all 180ms; display: flex; flex-direction: column; gap: 4px; }
    .kpi:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .kpi-icon { font-size: 20px; }
    .kpi-val { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
    .kpi-label { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .kpi-trend { font-size: 10px; font-weight: 700; margin-top: 4px; }
    .kpi-trend.up { color: #34c759; }
    .kpi-trend.down { color: #ff3b30; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 820px) { .grid-2 { grid-template-columns: 1fr; } }

    .card { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 14px; }
    .card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .card-head h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .card-head small { font-size: var(--fs-2xs); color: var(--label-2); display: block; margin-top: 2px; }
    .card.danger-zone { border-left: 3px solid #ff3b30; }

    .feed { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .feed-item { display: grid; grid-template-columns: 32px 1fr; gap: 10px; align-items: center; padding: 10px; background: var(--bg-fill-2); border-radius: var(--r-sm); cursor: pointer; transition: all 140ms; }
    .feed-item:hover { background: var(--bg-fill-3); }
    .fi-icon { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; background: var(--bg-surface-solid); font-size: 14px; }
    .fi-icon[data-s='completed'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .fi-icon[data-s='running'] { background: var(--accent-soft); color: var(--accent); }
    .fi-icon[data-s='failed'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .fi-icon[data-s='queued'] { background: var(--bg-fill-3); color: var(--label-2); }
    .fi-body { min-width: 0; }
    .fi-row { display: flex; align-items: center; gap: 8px; }
    .fi-row b { font-size: var(--fs-xs); font-weight: 700; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .fi-status { font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: var(--r-pill); text-transform: uppercase; }
    .fi-status[data-s='completed'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .fi-status[data-s='running'] { background: var(--accent-soft); color: var(--accent); }
    .fi-status[data-s='failed'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .fi-status[data-s='queued'] { background: var(--bg-fill-3); color: var(--label-2); }
    .fi-meta { display: flex; gap: 10px; font-size: 10px; color: var(--label-3); margin-top: 3px; }

    .drops { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .drop-item { display: grid; grid-template-columns: 40px 1fr auto; gap: 12px; align-items: center; padding: 10px; background: var(--bg-fill-2); border-radius: var(--r-sm); cursor: pointer; transition: all 140ms; }
    .drop-item:hover { background: var(--bg-fill-3); }
    .drop-icon { font-size: 24px; text-align: center; }
    .drop-body b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .drop-body small { font-size: 10px; color: var(--label-2); }
    .drop-price { text-align: right; display: flex; flex-direction: column; gap: 2px; }
    .drop-price s { font-size: 10px; color: var(--label-3); }
    .drop-price b { font-size: var(--fs-sm); font-weight: 800; color: var(--accent); font-variant-numeric: tabular-nums; }
    .drop-pct { font-size: 9px; font-weight: 800; color: #34c759; background: rgba(52, 199, 89, 0.15); padding: 1px 6px; border-radius: var(--r-pill); align-self: flex-end; }

    .sources-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; }
    .source-mini { display: grid; grid-template-columns: 32px 1fr auto; gap: 10px; align-items: center; padding: 10px; background: var(--bg-fill-2); border-radius: var(--r-sm); border-left: 3px solid var(--c); cursor: pointer; transition: all 140ms; }
    .source-mini:hover { background: var(--bg-fill-3); transform: translateX(2px); }
    .sm-icon { font-size: 20px; text-align: center; }
    .sm-body b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .sm-body small { font-size: 10px; color: var(--label-2); }
    .sm-health { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; min-width: 60px; }
    .sm-bar { width: 50px; height: 4px; background: var(--bg-surface-solid); border-radius: var(--r-pill); overflow: hidden; }
    .sm-fill { height: 100%; background: var(--c); border-radius: var(--r-pill); }
    .sm-health span { font-size: 9px; color: var(--label-3); font-family: var(--sf-mono); }

    .cat-bars { display: flex; flex-direction: column; gap: 8px; }
    .cat-bar { display: grid; grid-template-columns: 24px 100px 1fr 50px; gap: 10px; align-items: center; font-size: var(--fs-xs); }
    .cb-icon { font-size: 16px; text-align: center; }
    .cb-name { color: var(--label-2); }
    .cb-track { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .cb-fill { height: 100%; border-radius: var(--r-pill); }
    .cb-count { text-align: right; font-weight: 700; }

    .status-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .status-row { display: grid; grid-template-columns: 12px 1fr auto; gap: 12px; align-items: center; padding: 8px 0; border-bottom: 0.5px solid var(--separator); }
    .status-row:last-child { border-bottom: 0; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; }
    .status-dot[data-s='ok'] { background: #34c759; box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.2); }
    .status-dot[data-s='warn'] { background: #ff9500; box-shadow: 0 0 0 3px rgba(255, 149, 0, 0.2); }
    .status-dot[data-s='err'] { background: #ff3b30; box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.2); }
    .status-row b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .status-row small { font-size: 10px; color: var(--label-2); }
    .status-tag { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); text-transform: uppercase; }
    .status-tag[data-s='ok'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .status-tag[data-s='warn'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .status-tag[data-s='err'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

    .live-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: rgba(255, 59, 48, 0.15); color: #ff3b30; border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 800; letter-spacing: 0.08em; }
    .pulse { width: 8px; height: 8px; border-radius: 50%; background: #ff3b30; animation: pulse 1.6s infinite; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.5); } 50% { box-shadow: 0 0 0 8px rgba(255, 59, 48, 0); } }

    .workers { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .worker { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 12px; }
    .worker[data-s='active'] { border-left: 3px solid #34c759; }
    .worker[data-s='idle'] { border-left: 3px solid var(--label-3); }
    .worker[data-s='error'] { border-left: 3px solid #ff3b30; }
    .worker > header { display: flex; align-items: center; gap: 10px; }
    .worker-icon { font-size: 24px; }
    .worker > header > div { flex: 1; min-width: 0; }
    .worker b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .worker small { font-size: 10px; color: var(--label-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
    .worker-badge { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); text-transform: uppercase; }
    .worker-badge[data-s='active'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .worker-badge[data-s='idle'] { background: var(--bg-fill-3); color: var(--label-2); }
    .worker-badge[data-s='error'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .worker-progress { display: flex; align-items: center; gap: 10px; }
    .wp-track { flex: 1; height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .wp-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill); transition: width 400ms; }
    .worker-foot { display: flex; justify-content: space-between; padding-top: 10px; border-top: 0.5px solid var(--separator); font-size: 10px; color: var(--label-3); }

    .terminal-card { padding-bottom: 0; }
    .log-tail { background: #0d0d0f; border-radius: var(--r-sm); padding: 14px; font-family: var(--sf-mono); font-size: 11px; line-height: 1.7; max-height: 320px; overflow-y: auto; }
    .log-line { display: grid; grid-template-columns: 70px 50px 100px 1fr; gap: 10px; padding: 2px 0; }
    .ll-time { color: rgba(255, 255, 255, 0.4); }
    .ll-level { font-weight: 700; }
    .ll-level[data-l='INFO'] { color: #7ee787; }
    .ll-level[data-l='WARN'] { color: #ff9500; }
    .ll-level[data-l='ERROR'] { color: #ff7b72; }
    .ll-level[data-l='DEBUG'] { color: #79c0ff; }
    .ll-source { color: #a5d6ff; }
    .ll-msg { color: #e5e5e7; }

    .req-chart { display: flex; align-items: flex-end; gap: 3px; height: 100px; padding: 4px 0; }
    .req-bar { flex: 1; background: var(--accent); border-radius: 2px; min-height: 3px; transition: opacity 140ms; }
    .req-bar:hover { opacity: 0.7; }
    .req-axis { display: flex; justify-content: space-between; font-size: 10px; color: var(--label-3); font-family: var(--sf-mono); }

    .line-chart { display: flex; align-items: flex-end; gap: 2px; height: 180px; padding: 4px 0; }
    .lc-col { flex: 1; height: 100%; display: flex; align-items: flex-end; }
    .lc-bar { width: 100%; background: var(--accent); border-radius: 2px 2px 0 0; min-height: 2px; }
    .lc-axis { display: flex; justify-content: space-between; font-size: 9px; color: var(--label-3); font-family: var(--sf-mono); padding-top: 6px; }

    .perf-list { display: flex; flex-direction: column; gap: 10px; }
    .perf-row { display: grid; grid-template-columns: 32px 100px 1fr 50px; gap: 10px; align-items: center; font-size: var(--fs-xs); }
    .pr-icon { width: 32px; height: 32px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 16px; }
    .pr-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pr-track { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .pr-fill { height: 100%; border-radius: var(--r-pill); }
    .pr-score { text-align: right; font-weight: 700; }

    .pie-list { display: flex; flex-direction: column; gap: 8px; }
    .pie-row { display: grid; grid-template-columns: 12px 1fr 50px; gap: 12px; align-items: center; font-size: var(--fs-xs); }
    .pie-dot { width: 10px; height: 10px; border-radius: 50%; }
    .pie-name { color: var(--label-2); }
    .pie-pct { text-align: right; font-weight: 700; }

    .table-wrap { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; }
    .thead, .trow { display: grid; gap: 12px; padding: 12px 16px; align-items: center; font-size: var(--fs-xs); }
    .thead { background: var(--bg-fill-2); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-2); font-weight: 700; }
    .trow { border-top: 0.5px solid var(--separator); cursor: pointer; transition: background 140ms; }
    .trow:hover { background: var(--bg-hover); }
    .cols-4 { grid-template-columns: 40px 1fr 120px 120px; }
    .cols-6 { grid-template-columns: 2fr 100px 100px 100px 100px 100px; }
    .cell-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cell-product { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .cp-emoji { font-size: 22px; flex-shrink: 0; }
    .cell-product > div { min-width: 0; }
    .cell-product b { font-size: var(--fs-xs); font-weight: 700; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cell-product small { font-size: 10px; color: var(--label-2); }
    .trend { font-weight: 700; }
    .trend.up { color: #34c759; }
    .trend.down { color: #ff3b30; }
    .change.up { color: #34c759; font-weight: 700; }
    .change.down { color: #ff3b30; font-weight: 700; }
    .row-actions { display: flex; gap: 4px; justify-content: flex-end; }
    .row-action { width: 26px; height: 26px; display: grid; place-items: center; border-radius: var(--r-xs); background: transparent; border: 0; color: var(--label-3); font-size: 12px; cursor: pointer; }
    .row-action:hover { background: var(--bg-fill-2); color: var(--label); }
    .row-action.danger:hover { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .st { padding: 3px 10px; border-radius: var(--r-pill); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; display: inline-block; }
    .st[data-s='pending'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='confirmed'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='overdue'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .st[data-s='escalated'] { background: rgba(175, 82, 222, 0.15); color: #af52de; }
    .st[data-s='dismissed'] { background: var(--bg-fill-3); color: var(--label-2); }
    .st[data-s='queued'] { background: var(--bg-fill-3); color: var(--label-2); }
    .st[data-s='running'] { background: var(--accent-soft); color: var(--accent); }
    .st[data-s='completed'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='failed'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .st[data-s='active'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='triggered'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='paused'] { background: var(--bg-fill-3); color: var(--label-2); }

    .search-hero { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 14px; }
    .search-box { display: flex; align-items: center; gap: 10px; padding: 8px 8px 8px 16px; background: var(--bg-input); border: 1px solid var(--separator); border-radius: var(--r-pill); transition: border 140ms; }
    .search-box:focus-within { border-color: var(--accent); }
    .sb-icon { font-size: 18px; flex-shrink: 0; }
    .search-box input { flex: 1; background: transparent; border: 0; outline: none; font-size: var(--fs-base); color: var(--label); font-family: inherit; min-width: 0; }
    .sb-clear { width: 22px; height: 22px; display: grid; place-items: center; border-radius: 50%; background: var(--bg-fill-3); color: var(--label-2); border: 0; cursor: pointer; font-size: 11px; }
    .sb-go { padding: 10px 22px; background: var(--accent); color: var(--accent-contrast); border: 0; border-radius: var(--r-pill); font-size: var(--fs-sm); font-weight: 700; cursor: pointer; }
    .sb-go:disabled { opacity: 0.6; cursor: wait; }
    .search-suggestions { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .ss-label { font-size: var(--fs-2xs); color: var(--label-3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
    .ss-chip { padding: 5px 12px; background: var(--bg-fill-2); color: var(--label-2); border: 0; border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 600; cursor: pointer; transition: all 140ms; }
    .ss-chip:hover { background: var(--accent-soft); color: var(--accent); }

    .search-layout { display: grid; grid-template-columns: 260px 1fr; gap: 20px; }
    @media (max-width: 900px) { .search-layout { grid-template-columns: 1fr; } }

    .filters-panel { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 16px; height: fit-content; position: sticky; top: 12px; }
    .fp-head { display: flex; justify-content: space-between; align-items: center; }
    .fp-head b { font-size: var(--fs-sm); font-weight: 700; }
    .fp-reset { font-size: 10px; color: var(--accent); background: none; border: 0; cursor: pointer; font-weight: 700; }
    .fp-group { display: flex; flex-direction: column; gap: 6px; }
    .fp-group > label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-3); }
    .fp-group .sel, .fp-group .input-sm { width: 100%; }
    .range-row { display: flex; align-items: center; gap: 6px; }
    .range-row span { color: var(--label-3); font-size: 11px; }
    .stars-row { display: flex; gap: 4px; flex-wrap: wrap; }
    .star-btn { padding: 5px 10px; background: var(--bg-fill-2); border: 0; border-radius: var(--r-pill); font-size: 10px; font-weight: 600; color: var(--label-2); cursor: pointer; }
    .star-btn.active { background: var(--accent); color: var(--accent-contrast); }
    .sources-checks { display: flex; flex-direction: column; gap: 4px; }
    .src-check { display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: var(--bg-fill-2); border-radius: var(--r-xs); cursor: pointer; font-size: var(--fs-2xs); }
    .src-check input { accent-color: var(--accent); }
    .sc-icon { font-size: 14px; }
    .check-row { display: flex; align-items: center; gap: 8px; font-size: var(--fs-xs); cursor: pointer; padding: 4px 0; }
    .check-row input { accent-color: var(--accent); }

    .results-area { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
    .results-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .results-head b { font-size: var(--fs-sm); font-weight: 700; }
    .results-head small { font-size: var(--fs-2xs); color: var(--label-2); margin-left: 6px; }
    .view-toggle { display: flex; gap: 2px; padding: 3px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .vt { width: 30px; height: 30px; display: grid; place-items: center; border-radius: calc(var(--r-sm) - 4px); color: var(--label-2); border: 0; cursor: pointer; font-size: 13px; background: transparent; }
    .vt.active { background: var(--bg-surface-solid); color: var(--label); box-shadow: var(--shadow-xs); }

    .progress-card { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 12px; }
    .progress-card header { display: flex; justify-content: space-between; align-items: center; font-size: var(--fs-sm); font-weight: 700; }
    .progress-track { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .progress-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill); transition: width 200ms; }
    .src-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .src-chip { padding: 5px 11px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-size: 10px; font-weight: 600; transition: all 200ms; }
    .src-chip.done { background: rgba(52, 199, 89, 0.15); color: #34c759; }

    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
    .product { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; cursor: pointer; transition: all 200ms; display: flex; flex-direction: column; }
    .product:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    .p-image { height: 130px; display: grid; place-items: center; position: relative; }
    .p-emoji { font-size: 48px; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.2)); }
    .p-discount { position: absolute; top: 10px; left: 10px; background: #ff3b30; color: #fff; font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); }
    .p-watched { position: absolute; top: 10px; right: 10px; font-size: 16px; }
    .p-body { padding: 14px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .p-brand { font-size: 10px; color: var(--label-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .p-name { font-size: var(--fs-sm); font-weight: 700; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .p-rating { display: flex; align-items: center; gap: 6px; font-size: 10px; }
    .stars { color: #ff9500; font-size: 11px; letter-spacing: 0.5px; }
    .p-prices { display: flex; align-items: baseline; gap: 8px; margin-top: 4px; }
    .p-price { font-size: var(--fs-md); font-weight: 800; color: var(--accent); font-variant-numeric: tabular-nums; }
    .p-prices s { font-size: 10px; color: var(--label-3); }
    .p-sources { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 4px; }
    .p-src { width: 22px; height: 22px; display: grid; place-items: center; border-radius: 50%; font-size: 11px; }
    .p-src.more { background: var(--bg-fill-2); color: var(--label-2); font-size: 9px; font-weight: 700; }
    .p-foot { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 8px; border-top: 0.5px solid var(--separator); font-size: 10px; }
    .p-match { color: var(--accent); font-weight: 700; }
    .p-trend[data-t='up'] { color: #ff3b30; font-weight: 700; }
    .p-trend[data-t='down'] { color: #34c759; font-weight: 700; }
    .p-trend[data-t='stable'] { color: var(--label-3); }

    .product-list { display: flex; flex-direction: column; gap: 8px; }
    .product-row { display: grid; grid-template-columns: 60px 1fr auto; gap: 14px; align-items: center; padding: 14px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); cursor: pointer; transition: all 140ms; }
    .product-row:hover { background: var(--bg-hover); transform: translateX(3px); }
    .pr-img { width: 60px; height: 60px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 28px; }
    .pr-body { min-width: 0; }
    .pr-top b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .pr-brand { font-size: 10px; color: var(--label-3); }
    .pr-meta { display: flex; gap: 6px; font-size: 10px; color: var(--label-2); margin-top: 4px; }
    .pr-price { text-align: right; }
    .pr-price b { font-size: var(--fs-md); font-weight: 800; color: var(--accent); font-variant-numeric: tabular-nums; display: block; }
    .pr-disc { font-size: 9px; font-weight: 800; color: #34c759; background: rgba(52, 199, 89, 0.15); padding: 1px 6px; border-radius: var(--r-pill); }

    .empty-state { padding: 60px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; grid-column: 1 / -1; }
    .empty-state span { font-size: 48px; opacity: 0.5; }
    .empty-state b { font-size: var(--fs-base); font-weight: 700; }
    .empty-state small { font-size: var(--fs-xs); color: var(--label-2); }

    .categories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
    .cat-card { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-top: 3px solid var(--c); cursor: pointer; transition: all 200ms; display: flex; flex-direction: column; gap: 12px; }
    .cat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .cat-card > header { display: flex; align-items: center; gap: 12px; }
    .cc-icon { width: 44px; height: 44px; display: grid; place-items: center; background: var(--c); color: #fff; border-radius: var(--r-sm); font-size: 22px; flex-shrink: 0; }
    .cat-card header b { font-size: var(--fs-base); font-weight: 700; display: block; }
    .cat-card header small { font-size: var(--fs-2xs); color: var(--label-2); }
    .cc-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .cc-stats > div { padding: 8px; background: var(--bg-fill-2); border-radius: var(--r-xs); text-align: center; }
    .cc-stats small { font-size: 9px; color: var(--label-3); text-transform: uppercase; display: block; }
    .cc-stats b { font-size: var(--fs-sm); font-weight: 800; font-variant-numeric: tabular-nums; display: block; margin-top: 2px; }
    .cc-top { display: flex; gap: 4px; flex-wrap: wrap; }
    .cc-chip { padding: 4px 10px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-size: 10px; }

    .trending-list { display: flex; flex-direction: column; gap: 4px; }
    .trending-row { display: grid; grid-template-columns: 32px 1fr 100px 80px 70px; gap: 12px; align-items: center; padding: 10px 12px; border-radius: var(--r-sm); cursor: pointer; transition: background 140ms; }
    .trending-row:hover { background: var(--bg-fill-2); }
    .tr-rank { width: 28px; height: 28px; display: grid; place-items: center; background: var(--bg-fill-2); color: var(--label-2); border-radius: 50%; font-size: 12px; font-weight: 800; }
    .tr-rank.top { background: var(--accent); color: var(--accent-contrast); }
    .tr-body b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .tr-body small { font-size: 10px; color: var(--label-2); }
    .tr-chart { display: flex; align-items: flex-end; gap: 2px; height: 24px; }
    .tr-bar { flex: 1; background: var(--accent); border-radius: 1px; min-height: 2px; opacity: 0.6; }
    .tr-count { text-align: right; font-weight: 700; font-size: var(--fs-xs); }
    .tr-trend { text-align: right; font-weight: 700; font-size: var(--fs-xs); }

    .rising-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
    .rising-card { padding: 14px; background: var(--bg-fill-2); border-radius: var(--r-sm); cursor: pointer; transition: all 140ms; display: flex; flex-direction: column; gap: 6px; align-items: center; text-align: center; }
    .rising-card:hover { background: var(--bg-fill-3); transform: translateY(-2px); }
    .rc-emoji { font-size: 32px; }
    .rising-card b { font-size: var(--fs-xs); font-weight: 700; }
    .rising-card small { font-size: 10px; color: var(--label-2); }
    .rc-meta { display: flex; gap: 8px; margin-top: 4px; font-size: 10px; }

    .deal-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .df-chip { padding: 8px 16px; background: var(--bg-fill-2); color: var(--label-2); border: 0; border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 700; cursor: pointer; }
    .df-chip.active { background: var(--accent); color: var(--accent-contrast); }

    .deals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
    .deal-card { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; cursor: pointer; transition: all 200ms; }
    .deal-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    .dc-img { height: 120px; display: grid; place-items: center; position: relative; }
    .dc-emoji { font-size: 44px; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.2)); }
    .dc-badge { position: absolute; top: 10px; left: 10px; background: #ff3b30; color: #fff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: var(--r-pill); }
    .dc-body { padding: 14px; display: flex; flex-direction: column; gap: 6px; }
    .dc-brand { font-size: 10px; color: var(--label-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .dc-body b { font-size: var(--fs-sm); font-weight: 700; }
    .dc-price { display: flex; align-items: baseline; gap: 8px; }
    .dc-price b { font-size: var(--fs-md); font-weight: 800; color: var(--accent); }
    .dc-price s { font-size: 11px; color: var(--label-3); }
    .dc-save { font-size: 10px; font-weight: 700; color: #34c759; }
    .dc-sources { display: flex; gap: 6px; }
    .dc-src { font-size: 14px; }

    .saved-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .saved-card { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); cursor: pointer; transition: all 140ms; display: flex; flex-direction: column; gap: 10px; }
    .saved-card:hover { border-color: var(--accent); }
    .saved-card > header { display: flex; align-items: flex-start; gap: 10px; }
    .sc-icon { font-size: 22px; }
    .saved-card header > div { flex: 1; min-width: 0; }
    .saved-card header b { font-size: var(--fs-sm); font-weight: 700; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .saved-card header small { font-size: 10px; color: var(--label-2); }
    .sc-del { width: 22px; height: 22px; display: grid; place-items: center; border-radius: var(--r-xs); background: transparent; border: 0; color: var(--label-3); cursor: pointer; font-size: 11px; }
    .sc-del:hover { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .sc-meta { display: flex; gap: 12px; font-size: 10px; color: var(--label-3); }

    .sources-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
    .source-card { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-top: 3px solid var(--c); display: flex; flex-direction: column; gap: 14px; transition: all 140ms; }
    .source-card:hover { transform: translateY(-2px); }
    .source-card[data-s='degraded'] { border-top-color: #ff9500; }
    .source-card[data-s='offline'] { border-top-color: #ff3b30; opacity: 0.7; }
    .src-head { display: flex; align-items: center; gap: 12px; }
    .src-icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 22px; flex-shrink: 0; }
    .src-head > div { flex: 1; min-width: 0; }
    .src-head b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .src-status { font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: var(--r-pill); text-transform: uppercase; display: inline-block; margin-top: 2px; }
    .src-status[data-s='online'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .src-status[data-s='degraded'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .src-status[data-s='offline'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .src-toggle { position: relative; width: 40px; height: 24px; border-radius: var(--r-pill); background: var(--bg-fill-3); border: 0; cursor: pointer; transition: background 200ms; flex-shrink: 0; }
    .src-toggle.on { background: #34c759; }
    .knob { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: #fff; border-radius: 50%; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); transition: transform 200ms; }
    .src-toggle.on .knob { transform: translateX(16px); }
    .src-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .src-stats > div { padding: 8px; background: var(--bg-fill-2); border-radius: var(--r-xs); text-align: center; }
    .src-stats b { font-size: var(--fs-sm); font-weight: 800; display: block; }
    .src-stats small { font-size: 9px; color: var(--label-3); text-transform: uppercase; }
    .src-ratelimit { display: flex; flex-direction: column; gap: 6px; }
    .rl-head { display: flex; justify-content: space-between; font-size: 10px; color: var(--label-2); }
    .rl-track { height: 4px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .rl-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill); }
    .rl-fill.hot { background: #ff3b30; }
    .src-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 0.5px solid var(--separator); font-size: 10px; color: var(--label-3); flex-wrap: wrap; gap: 8px; }
    .src-open { color: var(--accent); font-weight: 700; background: none; border: 0; cursor: pointer; font-size: 10px; }

    .job-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
    .js-card { padding: 14px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-left: 3px solid var(--c); }
    .js-card b { font-size: var(--fs-xl); font-weight: 800; display: block; }
    .js-card small { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    .active-jobs { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
    .job-card { padding: 14px; background: var(--bg-fill-2); border-radius: var(--r-sm); display: flex; flex-direction: column; gap: 10px; }
    .job-card[data-s='running'] { border-left: 3px solid var(--accent); }
    .job-card[data-s='queued'] { border-left: 3px solid var(--label-3); }
    .job-card > header { display: flex; align-items: center; gap: 10px; }
    .job-icon { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; background: var(--bg-surface-solid); font-size: 14px; }
    .job-card header > div { flex: 1; min-width: 0; }
    .job-card b { font-size: var(--fs-xs); font-weight: 700; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .job-card small { font-size: 10px; color: var(--label-2); }
    .job-badge { font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: var(--r-pill); text-transform: uppercase; }
    .job-badge[data-s='running'] { background: var(--accent-soft); color: var(--accent); }
    .job-badge[data-s='queued'] { background: var(--bg-fill-3); color: var(--label-2); }
    .job-progress { display: flex; align-items: center; gap: 10px; }
    .jp-track { flex: 1; height: 5px; background: var(--bg-surface-solid); border-radius: var(--r-pill); overflow: hidden; }
    .jp-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill); }
    .job-foot { display: flex; justify-content: space-between; font-size: 10px; color: var(--label-3); }

    .health-overview { display: grid; grid-template-columns: 1fr auto; gap: 20px; padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); align-items: center; }
    .ho-main { display: flex; align-items: center; gap: 16px; }
    .ho-icon { font-size: 40px; }
    .ho-main b { font-size: var(--fs-lg); font-weight: 800; display: block; letter-spacing: -0.02em; }
    .ho-main small { font-size: var(--fs-xs); color: var(--label-2); }
    .ho-main[data-s='ok'] .ho-icon { color: #34c759; }
    .ho-main[data-s='warn'] .ho-icon { color: #ff9500; }
    .ho-main[data-s='err'] .ho-icon { color: #ff3b30; }
    .ho-stats { display: flex; gap: 20px; }
    .ho-stats > div { text-align: center; }
    .ho-stats b { font-size: var(--fs-xl); font-weight: 800; display: block; }
    .ho-stats small { font-size: 10px; color: var(--label-3); text-transform: uppercase; }

    .health-list { display: flex; flex-direction: column; gap: 10px; }
    .health-row { display: grid; grid-template-columns: 40px 1fr auto; gap: 14px; padding: 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); align-items: center; }
    .health-row[data-s='offline'] { border-left: 3px solid #ff3b30; }
    .health-row[data-s='degraded'] { border-left: 3px solid #ff9500; }
    .hr-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 18px; }
    .hr-body { min-width: 0; }
    .hr-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .hr-top b { font-size: var(--fs-sm); font-weight: 700; }
    .hr-status { font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: var(--r-pill); text-transform: uppercase; }
    .hr-status[data-s='online'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .hr-status[data-s='degraded'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .hr-status[data-s='offline'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .hr-bars { display: flex; flex-direction: column; gap: 6px; }
    .hr-bar { display: grid; grid-template-columns: 60px 1fr 60px; gap: 10px; align-items: center; font-size: 10px; }
    .hr-bar-label { color: var(--label-3); }
    .hr-track { height: 5px; background: var(--bg-surface-solid); border-radius: var(--r-pill); overflow: hidden; }
    .hr-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill); }
    .hr-fill.green { background: #34c759; }
    .hr-fill.warn { background: #ff9500; }
    .hr-fill.danger { background: #ff3b30; }
    .hr-bar span.mono { text-align: right; }
    .hr-meta { text-align: right; }
    .hr-meta small { font-size: 10px; color: var(--label-3); display: block; }

    .error-chart { display: flex; align-items: flex-end; gap: 4px; height: 100px; }
    .ec-col { flex: 1; height: 100%; display: flex; align-items: flex-end; }
    .ec-bar { width: 100%; background: #34c759; border-radius: 2px 2px 0 0; min-height: 3px; }
    .ec-bar.high { background: #ff3b30; }

    .triggered-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .tg-row { display: grid; grid-template-columns: 32px 1fr auto; gap: 12px; align-items: center; padding: 10px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .tg-icon { font-size: 20px; }
    .tg-body b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .tg-body small { font-size: 10px; color: var(--label-2); }

    .notif-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .notif-row { display: grid; grid-template-columns: 40px 1fr auto; gap: 14px; align-items: flex-start; padding: 14px; background: var(--bg-fill-2); border-radius: var(--r-sm); cursor: pointer; transition: background 140ms; }
    .notif-row:hover { background: var(--bg-fill-3); }
    .notif-row.unread { border-left: 3px solid var(--accent); }
    .nt-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 18px; }
    .nt-body b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .nt-body p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5; margin: 4px 0; }
    .nt-body small { font-size: 10px; color: var(--label-3); }
    .nt-type { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }

    .log-viewer { background: #0d0d0f; border-radius: var(--r-md); overflow: hidden; }
    .lv-head { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
    .lv-dot { width: 12px; height: 12px; border-radius: 50%; }
    .lv-dot.red { background: #ff5f57; }
    .lv-dot.yellow { background: #febc2e; }
    .lv-dot.green { background: #28c840; }
    .lv-title { margin-left: 8px; font-family: var(--sf-mono); font-size: 11px; color: rgba(255, 255, 255, 0.6); flex: 1; }
    .lv-toggle { display: flex; align-items: center; gap: 6px; font-size: 10px; color: rgba(255, 255, 255, 0.5); font-family: var(--sf-mono); }
    .lv-toggle input { accent-color: var(--accent); }
    .lv-body { padding: 12px 16px; max-height: 500px; overflow-y: auto; font-family: var(--sf-mono); font-size: 11.5px; line-height: 1.7; }
    .lv-line { display: grid; grid-template-columns: 70px 55px 110px 1fr; gap: 10px; padding: 2px 0; }
    .lv-time { color: rgba(255, 255, 255, 0.35); }
    .lv-level { font-weight: 800; }
    .lv-level[data-l='INFO'] { color: #7ee787; }
    .lv-level[data-l='WARN'] { color: #ff9500; }
    .lv-level[data-l='ERROR'] { color: #ff7b72; }
    .lv-level[data-l='DEBUG'] { color: #79c0ff; }
    .lv-source { color: #a5d6ff; }
    .lv-msg { color: #e5e5e7; }

    .api-base { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .api-base-label { font-size: 10px; color: var(--label-3); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; }
    .api-base-url { font-family: var(--sf-mono); font-size: var(--fs-xs); color: var(--accent); font-weight: 600; }

    .api-list { display: flex; flex-direction: column; gap: 6px; }
    .api-row { display: grid; grid-template-columns: 70px 280px 1fr 90px; gap: 14px; align-items: center; padding: 12px 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-sm); cursor: pointer; transition: all 140ms; }
    .api-row:hover { border-color: var(--accent); transform: translateX(3px); }
    .method { font-family: var(--sf-mono); font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); color: #fff; text-align: center; }
    .method[data-m='GET'] { background: #007aff; }
    .method[data-m='POST'] { background: #34c759; }
    .method[data-m='PUT'] { background: #ff9500; }
    .method[data-m='PATCH'] { background: #af52de; }
    .method[data-m='DELETE'] { background: #ff3b30; }
    .route { font-family: var(--sf-mono); font-size: var(--fs-xs); color: var(--accent); font-weight: 600; }
    .desc { font-size: var(--fs-xs); color: var(--label-2); }
    .auth { font-size: 10px; font-weight: 700; padding: 3px 10px; background: rgba(255, 149, 0, 0.15); color: #ff9500; border-radius: var(--r-pill); text-align: center; }
    .auth.public { background: rgba(52, 199, 89, 0.15); color: #34c759; }

    .arch-diagram { padding: 18px 20px; background: var(--bg-code); border: 0.5px solid var(--separator); border-radius: var(--r-sm); font-family: var(--sf-mono); font-size: var(--fs-2xs); line-height: 1.7; overflow-x: auto; color: var(--label); white-space: pre; margin: 0; }

    .stack-list, .arch-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .stack-row, .arch-row { display: grid; grid-template-columns: 32px 1fr auto; gap: 12px; align-items: center; padding: 8px 0; border-bottom: 0.5px solid var(--separator); }
    .stack-row:last-child, .arch-row:last-child { border-bottom: 0; }
    .stack-icon, .ac-icon { font-size: 20px; text-align: center; }
    .stack-row b, .arch-row b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .stack-row small, .arch-row small { font-size: 10px; color: var(--label-2); }
    .stack-ver { font-size: 10px; color: var(--label-3); }

    .deploy-info { display: flex; flex-direction: column; gap: 8px; }
    .di-row { display: grid; grid-template-columns: 120px 1fr; gap: 12px; align-items: center; padding: 8px 12px; background: var(--bg-fill-2); border-radius: var(--r-xs); }
    .di-row span { font-size: 10px; font-weight: 700; color: var(--label-3); text-transform: uppercase; letter-spacing: 0.06em; }
    .di-row code { font-family: var(--sf-mono); font-size: var(--fs-2xs); color: var(--accent); }

    .settings-list { display: flex; flex-direction: column; gap: 4px; }
    .setting-row { display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: center; padding: 12px 0; border-bottom: 0.5px solid var(--separator); }
    .setting-row:last-child { border-bottom: 0; }
    .setting-row b { font-size: var(--fs-sm); font-weight: 600; display: block; }
    .setting-row small { font-size: var(--fs-2xs); color: var(--label-2); }

    .toggle { position: relative; width: 44px; height: 26px; border-radius: var(--r-pill); background: var(--bg-fill-3); border: 0; cursor: pointer; transition: background 200ms; flex-shrink: 0; }
    .toggle.on { background: #34c759; }
    .toggle .knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: #fff; border-radius: 50%; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); transition: transform 200ms; }
    .toggle.on .knob { transform: translateX(18px); }

    .dz-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); z-index: 9990; display: grid; place-items: center; padding: 20px; animation: fadeIn 200ms; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal { max-width: 720px; width: 100%; max-height: 88vh; background: var(--bg-elevated); border: 0.5px solid var(--separator); border-radius: var(--r-lg); box-shadow: var(--shadow-xl); display: flex; flex-direction: column; overflow: hidden; animation: modalIn 300ms var(--ease-spring); }
    .modal.product-modal { max-width: 780px; }
    @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .modal-head { display: flex; align-items: center; gap: 14px; padding: 20px 24px; border-bottom: 0.5px solid var(--separator); }
    .modal-icon { width: 56px; height: 56px; display: grid; place-items: center; border-radius: var(--r-md); font-size: 28px; flex-shrink: 0; }
    .modal-head > div { flex: 1; min-width: 0; }
    .modal-head h3 { font-size: var(--fs-lg); font-weight: 700; }
    .modal-head p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 2px; }
    .modal-badge { padding: 4px 12px; background: rgba(52, 199, 89, 0.15); color: #34c759; border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 800; }
    .modal-close { width: 32px; height: 32px; display: grid; place-items: center; border-radius: var(--r-xs); background: transparent; border: 0; color: var(--label-3); font-size: 16px; cursor: pointer; }
    .modal-close:hover { background: var(--bg-hover); color: var(--label); }
    .modal-body { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }

    .product-hero { display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center; padding: 18px 22px; background: var(--bg-fill-2); border-radius: var(--r-md); }
    .ph-price small { font-size: 10px; color: var(--label-3); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; display: block; }
    .ph-price b { font-size: var(--fs-3xl); font-weight: 800; color: var(--accent); letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
    .ph-discount { display: inline-block; margin-left: 10px; padding: 4px 10px; background: rgba(52, 199, 89, 0.15); color: #34c759; border-radius: var(--r-pill); font-size: 11px; font-weight: 800; vertical-align: middle; }
    .ph-stats { display: flex; gap: 20px; }
    .ph-stats > div { text-align: right; }
    .ph-stats small { font-size: 9px; color: var(--label-3); text-transform: uppercase; display: block; }
    .ph-stats b { font-size: var(--fs-sm); font-weight: 800; }

    .product-sources h4 { font-size: var(--fs-sm); font-weight: 700; margin-bottom: 12px; }
    .product-sources ul { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .ps-row { display: grid; grid-template-columns: 40px 1fr auto auto; gap: 14px; align-items: center; padding: 12px 14px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .ps-row.best { border-left: 3px solid #34c759; background: rgba(52, 199, 89, 0.06); }
    .ps-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 18px; }
    .ps-body b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .ps-body small { font-size: 10px; color: var(--label-2); }
    .ps-price { text-align: right; }
    .ps-price b { font-size: var(--fs-sm); font-weight: 800; color: var(--accent); display: block; }
    .ps-price s { font-size: 10px; color: var(--label-3); }
    .ps-badge { display: inline-block; margin-top: 2px; padding: 1px 6px; background: #34c759; color: #fff; font-size: 9px; font-weight: 800; border-radius: var(--r-pill); }
    .ps-buy { padding: 8px 14px; background: var(--accent); color: var(--accent-contrast); border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 700; text-decoration: none; white-space: nowrap; }
    .ps-buy:hover { background: var(--accent-hover); }

    .product-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag { padding: 4px 10px; background: var(--bg-fill-2); color: var(--label-2); border-radius: var(--r-pill); font-size: 10px; font-weight: 600; }

    .product-actions { display: flex; gap: 8px; flex-wrap: wrap; padding-top: 8px; border-top: 0.5px solid var(--separator); }
  `],
})
export class ArRoomPreviewComponent {
  public toast = inject(ToastService);
  private menu = inject(ContextMenuService);

  readonly active = signal<ARView>('dashboard');
  readonly query = signal('');
  readonly resultView = signal<'grid' | 'list'>('grid');
  readonly scraping = signal(false);
  readonly progress = signal(0);
  readonly doneSources = signal<string[]>([]);
  readonly selectedProduct = signal<ARProduct | null>(null);
  readonly selectedEndpoint = signal<any>(null);
  readonly searchQuery = signal('');

  readonly filterCategory = signal<string>('all');
  readonly priceMin = signal(0);
  readonly priceMax = signal(99999);
  readonly minRating = signal(0);
  readonly selectedSources = signal<string[]>(['amazon', 'noon', 'jumia', 'souq', 'olx', 'btech', '2b']);
  readonly inStockOnly = signal(false);
  readonly withDiscount = signal(false);
  readonly sortBy = signal('match');
  readonly analyticsRange = signal<'7d' | '30d' | '90d'>('7d');
  readonly dealMin = signal(20);
  readonly logLevel = signal<string>('all');
  readonly autoScroll = signal(true);
  readonly historyProductId = signal('P-001');

  readonly popularSearches = ['Sony WH-1000XM5', 'iPhone 15 Pro', 'PS5 Controller', 'Air Fryer', 'Nike Shoes', 'Samsung TV'];

  readonly allCategories = ['Headphones', 'Earbuds', 'Smartphones', 'Consoles', 'Home Appliances', 'Shoes', 'TVs', 'Laptops'];

  readonly sources: ARSource[] = [
    { id: 'amazon', name: 'Amazon Egypt', icon: '🛒', color: '#ff9900', status: 'online', products: 18420, latency: 240, uptime: 99.8, lastSync: '2m ago', rateLimit: 100, used: 42, requestsToday: 12480, errors24h: 3, enabled: true },
    { id: 'noon', name: 'Noon', icon: '📦', color: '#feee00', status: 'online', products: 12104, latency: 180, uptime: 99.5, lastSync: '1m ago', rateLimit: 120, used: 68, requestsToday: 9840, errors24h: 1, enabled: true },
    { id: 'jumia', name: 'Jumia', icon: '🏬', color: '#f68b1e', status: 'online', products: 8902, latency: 320, uptime: 98.2, lastSync: '4m ago', rateLimit: 80, used: 31, requestsToday: 6210, errors24h: 12, enabled: true },
    { id: 'souq', name: 'Souq', icon: '🛍️', color: '#f7a200', status: 'degraded', products: 4210, latency: 480, uptime: 94.1, lastSync: '12m ago', rateLimit: 60, used: 58, requestsToday: 2890, errors24h: 47, enabled: true },
    { id: 'olx', name: 'OLX Egypt', icon: '📱', color: '#23e5db', status: 'online', products: 23810, latency: 210, uptime: 99.2, lastSync: '1m ago', rateLimit: 90, used: 22, requestsToday: 15230, errors24h: 2, enabled: true },
    { id: 'btech', name: 'B.TECH', icon: '⚡', color: '#e30613', status: 'online', products: 6740, latency: 290, uptime: 97.8, lastSync: '3m ago', rateLimit: 70, used: 45, requestsToday: 4180, errors24h: 8, enabled: true },
    { id: '2b', name: '2B', icon: '🏪', color: '#ff2d55', status: 'offline', products: 3180, latency: 0, uptime: 88.4, lastSync: '2h ago', rateLimit: 50, used: 0, requestsToday: 0, errors24h: 128, enabled: false },
  ];

  readonly products: ARProduct[] = [
    this.buildProduct('P-001', 'Sony WH-1000XM5 Headphones', 'سماعة سوني WH-1000XM5', '🎧', 'Sony', 'Headphones', 4.8, 2847, 98, ['Wireless', 'Noise Cancelling', 'Premium', 'Over-ear'], 12480, 18400),
    this.buildProduct('P-002', 'Apple AirPods Pro 2', 'إيربودز برو 2', '🎵', 'Apple', 'Earbuds', 4.9, 4521, 100, ['Wireless', 'ANC', 'Apple', 'Premium'], 8490, 18920),
    this.buildProduct('P-003', 'Samsung Galaxy Buds 2 Pro', 'سامسونج جالاكسي بادز 2 برو', '🎵', 'Samsung', 'Earbuds', 4.5, 1284, 100, ['Wireless', 'ANC', 'Samsung'], 5490, 8940),
    this.buildProduct('P-004', 'Sony WF-1000XM5', 'سوني WF-1000XM5', '🎵', 'Sony', 'Earbuds', 4.7, 2104, 100, ['Wireless', 'ANC', 'Sony'], 7490, 14200),
    this.buildProduct('P-005', 'iPhone 15 Pro Max', 'آيفون 15 برو ماكس', '📱', 'Apple', 'Smartphones', 4.9, 8921, 100, ['5G', 'Premium', 'Apple'], 54990, 78400),
    this.buildProduct('P-006', 'PlayStation 5 Controller', 'يد تحكم بلايستيشن 5', '🎮', 'Sony', 'Consoles', 4.6, 3421, 95, ['Gaming', 'Sony', 'Wireless'], 3490, 5990),
    this.buildProduct('P-007', 'Nike Air Max 270', 'نايك اير ماكس 270', '👟', 'Nike', 'Shoes', 4.7, 2145, 92, ['Sports', 'Nike', 'Running'], 4290, 6800),
    this.buildProduct('P-008', 'Samsung 55" QLED TV', 'سامسونج 55 بوصة QLED', '📺', 'Samsung', 'TVs', 4.8, 1284, 96, ['QLED', '4K', 'Smart TV'], 28490, 38900),
    this.buildProduct('P-009', 'Air Fryer 5.5L', 'قلاية هوائية 5.5 لتر', '🍳', 'Philips', 'Home Appliances', 4.5, 847, 88, ['Kitchen', 'Philips', 'Healthy'], 4290, 5890),
    this.buildProduct('P-010', 'MacBook Air M3', 'ماك بوك اير M3', '💻', 'Apple', 'Laptops', 4.9, 6521, 100, ['Laptop', 'Apple', 'M3'], 48990, 62900),
    this.buildProduct('P-011', 'Dell XPS 13 Plus', 'ديل XPS 13 بلس', '💻', 'Dell', 'Laptops', 4.6, 1923, 94, ['Laptop', 'Dell', 'Ultrabook'], 42990, 55900),
    this.buildProduct('P-012', 'Canon EOS R50', 'كانون EOS R50', '📷', 'Canon', 'Cameras', 4.7, 842, 91, ['Camera', 'Mirrorless', 'Canon'], 34990, 42900),
  ];

  readonly jobs: ARJob[] = [
    { id: 'J-001', query: 'Sony WH-1000XM5', status: 'completed', progress: 100, sources: ['amazon', 'noon', 'jumia'], productsFound: 47, startedAt: '10:30', duration: '3.4s', errors: 0, worker: 'w-1' },
    { id: 'J-002', query: 'iPhone 15 Pro', status: 'completed', progress: 100, sources: ['amazon', 'noon', 'jumia', 'btech'], productsFound: 128, startedAt: '10:15', duration: '5.2s', errors: 1, worker: 'w-2' },
    { id: 'J-003', query: 'PS5 Controller', status: 'running', progress: 68, sources: ['amazon', 'noon', 'olx', 'btech'], productsFound: 34, startedAt: '10:45', duration: '—', errors: 0, worker: 'w-3' },
    { id: 'J-004', query: 'Air Fryer', status: 'queued', progress: 0, sources: ['amazon', 'noon'], productsFound: 0, startedAt: '10:48', duration: '—', errors: 0, worker: '—' },
    { id: 'J-005', query: 'Running Shoes Nike', status: 'failed', progress: 42, sources: ['amazon', 'souq'], productsFound: 12, startedAt: '10:00', duration: '2.1s', errors: 3, worker: 'w-1' },
    { id: 'J-006', query: 'Samsung TV 55', status: 'completed', progress: 100, sources: ['amazon', 'noon', 'btech'], productsFound: 64, startedAt: '09:45', duration: '4.1s', errors: 0, worker: 'w-2' },
    { id: 'J-007', query: 'MacBook Air', status: 'completed', progress: 100, sources: ['amazon', 'noon'], productsFound: 22, startedAt: '09:20', duration: '2.8s', errors: 0, worker: 'w-3' },
  ];

  readonly alerts = signal<ARAlert[]>([
    { id: 'AL-001', productId: 'P-001', productName: 'Sony WH-1000XM5', targetPrice: 11000, currentPrice: 12480, status: 'active', createdAt: '2024-12-05' },
    { id: 'AL-002', productId: 'P-005', productName: 'iPhone 15 Pro Max', targetPrice: 50000, currentPrice: 54990, status: 'active', createdAt: '2024-12-06' },
    { id: 'AL-003', productId: 'P-002', productName: 'Apple AirPods Pro 2', targetPrice: 9000, currentPrice: 8490, status: 'triggered', createdAt: '2024-12-01', triggeredAt: '2024-12-08 14:32' },
    { id: 'AL-004', productId: 'P-010', productName: 'MacBook Air M3', targetPrice: 45000, currentPrice: 48990, status: 'active', createdAt: '2024-12-07' },
    { id: 'AL-005', productId: 'P-008', productName: 'Samsung 55" QLED TV', targetPrice: 30000, currentPrice: 28490, status: 'triggered', createdAt: '2024-11-28', triggeredAt: '2024-12-07 09:15' },
  ]);

  readonly watchlist = signal<ARWatchItem[]>([
    { productId: 'P-001', addedAt: '2024-12-01', note: 'Waiting for price drop', priceWhenAdded: 14400 },
    { productId: 'P-005', addedAt: '2024-12-03', note: 'For my sister', priceWhenAdded: 59990 },
    { productId: 'P-010', addedAt: '2024-12-05', note: '', priceWhenAdded: 52990 },
  ]);

  readonly compareList = signal<ARProduct[]>([]);

  readonly savedSearches = signal([
    { id: 'SS-001', query: 'Sony XM5 under 12000', filters: 'Category: Headphones · Max 12000', savedAt: '2h ago', resultCount: 8 },
    { id: 'SS-002', query: 'Apple products on sale', filters: 'Brand: Apple · Discount 20%+', savedAt: '1d ago', resultCount: 24 },
    { id: 'SS-003', query: 'PS5 games', filters: 'Category: Consoles · Rating 4.5+', savedAt: '3d ago', resultCount: 41 },
  ]);

  readonly notifItems = signal([
    { id: 1, icon: '📉', color: '#34c759', title: 'Price dropped!', message: 'Apple AirPods Pro 2 dropped to 8,490 EGP (−12%)', time: '2 min ago', type: 'alert', read: false },
    { id: 2, icon: '🎯', color: '#007aff', title: 'Target reached', message: 'Samsung 55" QLED hit your target of 30,000 EGP', time: '15 min ago', type: 'alert', read: false },
    { id: 3, icon: '✅', color: '#34c759', title: 'Job completed', message: 'Scrape job J-002 finished with 128 products found', time: '1h ago', type: 'system', read: false },
    { id: 4, icon: '⚠️', color: '#ff9500', title: 'Source degraded', message: 'Souq latency is above threshold (480ms)', time: '3h ago', type: 'system', read: true },
    { id: 5, icon: '❌', color: '#ff3b30', title: 'Job failed', message: 'Scrape job J-005 failed with 3 errors', time: '1d ago', type: 'system', read: true },
  ]);

  readonly logs = signal<ARLogEntry[]>([
    { id: 1, time: '14:32:08', level: 'INFO', source: 'amazon', message: 'Scraping Sony WH-1000XM5…' },
    { id: 2, time: '14:32:09', level: 'INFO', source: 'amazon', message: 'Found 12 products (240ms)' },
    { id: 3, time: '14:32:09', level: 'INFO', source: 'noon', message: 'Scraping Sony WH-1000XM5…' },
    { id: 4, time: '14:32:10', level: 'INFO', source: 'noon', message: 'Found 8 products (180ms)' },
    { id: 5, time: '14:32:10', level: 'WARN', source: 'souq', message: 'Rate limit approaching (58/60)' },
    { id: 6, time: '14:32:11', level: 'INFO', source: 'jumia', message: 'Found 6 products (320ms)' },
    { id: 7, time: '14:32:12', level: 'INFO', source: 'engine', message: 'Merged 26 products, 12 unique' },
    { id: 8, time: '14:32:12', level: 'INFO', source: 'engine', message: 'Match score computed: 96% best' },
    { id: 9, time: '14:32:13', level: 'DEBUG', source: 'cache', message: 'Cached result for 15 minutes' },
    { id: 10, time: '14:32:14', level: 'INFO', source: 'amazon', message: 'Scraping Apple AirPods Pro 2…' },
    { id: 11, time: '14:32:15', level: 'INFO', source: 'amazon', message: 'Found 15 products (220ms)' },
    { id: 12, time: '14:32:16', level: 'ERROR', source: '2b', message: 'Connection timeout — source unreachable' },
    { id: 13, time: '14:32:17', level: 'INFO', source: 'noon', message: 'Found 11 products (195ms)' },
    { id: 14, time: '14:32:18', level: 'INFO', source: 'engine', message: 'Broadcast to 3 subscribers via WebSocket' },
    { id: 15, time: '14:32:20', level: 'INFO', source: 'olx', message: 'Found 22 products (210ms)' },
    { id: 16, time: '14:32:21', level: 'INFO', source: 'engine', message: 'Cache hit rate 94% (last 100 requests)' },
    { id: 17, time: '14:32:22', level: 'WARN', source: 'jumia', message: 'Retry #2 for request to /search?q=ps5' },
    { id: 18, time: '14:32:23', level: 'INFO', source: 'engine', message: 'Batch merged 47 → 26 unique products' },
    { id: 19, time: '14:32:25', level: 'DEBUG', source: 'scheduler', message: 'Next cron scan in 4m 35s' },
    { id: 20, time: '14:32:26', level: 'INFO', source: 'btech', message: 'Found 5 products (290ms)' },
  ]);

  readonly endpoints = [
    { id: 'E1', method: 'POST', route: '/api/search', description: 'Search across all enabled sources', auth: 'public' },
    { id: 'E2', method: 'GET', route: '/api/sources', description: 'List all configured sources', auth: 'public' },
    { id: 'E3', method: 'GET', route: '/api/sources/:id', description: 'Get single source details', auth: 'public' },
    { id: 'E4', method: 'PUT', route: '/api/sources/:id', description: 'Update source config', auth: 'bearer' },
    { id: 'E5', method: 'GET', route: '/api/products', description: 'List aggregated products', auth: 'public' },
    { id: 'E6', method: 'GET', route: '/api/products/:id', description: 'Product detail with sources', auth: 'public' },
    { id: 'E7', method: 'GET', route: '/api/products/:id/history', description: 'Price history timeline', auth: 'public' },
    { id: 'E8', method: 'GET', route: '/api/jobs', description: 'List scrape jobs', auth: 'bearer' },
    { id: 'E9', method: 'POST', route: '/api/jobs', description: 'Enqueue a new scrape job', auth: 'bearer' },
    { id: 'E10', method: 'DELETE', route: '/api/jobs/:id', description: 'Cancel a running job', auth: 'bearer' },
    { id: 'E11', method: 'GET', route: '/api/alerts', description: 'List price alerts', auth: 'bearer' },
    { id: 'E12', method: 'POST', route: '/api/alerts', description: 'Create a new alert', auth: 'bearer' },
    { id: 'E13', method: 'PATCH', route: '/api/alerts/:id', description: 'Pause or resume alert', auth: 'bearer' },
    { id: 'E14', method: 'DELETE', route: '/api/alerts/:id', description: 'Delete an alert', auth: 'bearer' },
    { id: 'E15', method: 'GET', route: '/api/watchlist', description: 'Get watchlist items', auth: 'bearer' },
    { id: 'E16', method: 'POST', route: '/api/watchlist', description: 'Add product to watchlist', auth: 'bearer' },
    { id: 'E17', method: 'DELETE', route: '/api/watchlist/:productId', description: 'Remove from watchlist', auth: 'bearer' },
    { id: 'E18', method: 'GET', route: '/api/analytics/summary', description: 'Dashboard analytics', auth: 'bearer' },
    { id: 'E19', method: 'GET', route: '/api/analytics/trends', description: 'Search volume trends', auth: 'bearer' },
    { id: 'E20', method: 'GET', route: '/api/health', description: 'System health check', auth: 'public' },
  ];

  readonly sourceFiles = [
    {
      name: 'orchestrator.ts',
      language: 'typescript' as const,
      code: `export class ScraperOrchestrator {\n  private readonly scrapers = new Map<string, ProductScraper>();\n  private readonly limiter = new RateLimiter({ maxPerSecond: 5 });\n\n  async search(query: string, sourceIds?: string[]): Promise<ScraperResult[]> {\n    const targets = sourceIds\n      ? sourceIds.map(id => this.scrapers.get(id)).filter(Boolean)\n      : Array.from(this.scrapers.values());\n\n    const tasks = targets.map(s => this.runWithLimiter(s as ProductScraper, query));\n    return Promise.allSettled(tasks).then(results =>\n      results.map((r, i) => r.status === 'fulfilled' ? r.value : {\n        sourceId: (targets[i] as ProductScraper).sourceId,\n        products: [], duration: 0, errors: [String(r.reason)],\n      })\n    );\n  }\n\n  private async runWithLimiter(scraper: ProductScraper, query: string): Promise<ScraperResult> {\n    await this.limiter.acquire(scraper.sourceId);\n    const start = performance.now();\n    try {\n      const products = await scraper.scrape(query);\n      return { sourceId: scraper.sourceId, products, duration: performance.now() - start, errors: [] };\n    } catch (err) {\n      return { sourceId: scraper.sourceId, products: [], duration: performance.now() - start, errors: [String(err)] };\n    }\n  }\n}`,
    },
    {
      name: 'rate-limiter.ts',
      language: 'typescript' as const,
      code: `export class RateLimiter {\n  private tokens = new Map<string, number>();\n  private lastRefill = new Map<string, number>();\n  private readonly max: number;\n\n  constructor(private readonly config: { maxPerSecond: number; burstSize?: number }) {\n    this.max = config.burstSize ?? config.maxPerSecond;\n  }\n\n  async acquire(key: string): Promise<void> {\n    this.refill(key);\n    const available = this.tokens.get(key) ?? this.max;\n    if (available <= 0) {\n      await new Promise(r => setTimeout(r, 1000 / this.config.maxPerSecond));\n      return this.acquire(key);\n    }\n    this.tokens.set(key, available - 1);\n  }\n\n  private refill(key: string): void {\n    const now = Date.now();\n    const last = this.lastRefill.get(key) ?? now;\n    const elapsed = (now - last) / 1000;\n    const next = Math.min((this.tokens.get(key) ?? this.max) + elapsed * this.config.maxPerSecond, this.max);\n    this.tokens.set(key, next);\n    this.lastRefill.set(key, now);\n  }\n}`,
    },
    {
      name: 'match-scorer.cs',
      language: 'csharp' as const,
      code: `public class ProductMatchScorer : IProductMatchScorer\n{\n    private readonly IFuzzyMatcher _matcher;\n\n    public double CalculateScore(Product a, Product b)\n    {\n        var nameScore = _matcher.Similarity(a.Name, b.Name);\n        var brandScore = a.Brand == b.Brand ? 1.0 : 0.0;\n        var priceScore = CalculatePriceProximity(a.Price, b.Price);\n        return nameScore * 0.50 + brandScore * 0.20 + priceScore * 0.30;\n    }\n\n    private static double CalculatePriceProximity(decimal a, decimal b)\n    {\n        if (a == 0 || b == 0) return 0;\n        var diff = Math.Abs(a - b);\n        var avg = (a + b) / 2;\n        return Math.Max(0, 1 - (double)(diff / avg));\n    }\n}`,
    },
  ];

  readonly architecture = `
┌─────────────────────────────────────────────────────────────────────┐
│  Angular 22 Client (Signals + Standalone)                           │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────────────┐   │
│  │ Search UI  │  │  Watchlist   │  │   Live Monitor (WebSocket) │   │
│  └─────┬──────┘  └──────┬───────┘  └───────────┬────────────────┘   │
└────────┼────────────────┼──────────────────────┼────────────────────┘
         │                │                      │
         ▼                ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Node.js Orchestrator (Fastify + BullMQ)                            │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────────────┐   │
│  │ POST /search│  │  Job Queue   │  │  WebSocket Hub (ws)       │   │
│  └─────┬──────┘  └──────┬───────┘  └────────────────────────────┘   │
│        │                │                                           │
│        ▼                ▼                                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │           Scraper Orchestrator (concurrent workers)          │   │
│  │    • Rate Limiter per source (token bucket)                  │   │
│  │    • Retry with exponential backoff                          │   │
│  │    • Circuit breaker on repeated failures                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│  8 Scrapers in parallel (Puppeteer + Cheerio)                        │
│  🛒 Amazon  📦 Noon  🏬 Jumia  🛍️ Souq  📱 OLX  ⚡ BTECH  🏪 2B  │
└──────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Storage Layer                                                       │
│  ┌───────────────┐  ┌──────────┐  ┌──────────────────────────────┐   │
│  │ PostgreSQL 16 │  │ Redis 7  │  │  File Store (thumbnails)     │   │
│  │  + pgvector   │  │  cache   │  │  S3-compatible (MinIO)       │   │
│  └───────────────┘  └──────────┘  └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Observability: Prometheus + Grafana + Loki                          │
└──────────────────────────────────────────────────────────────────────┘
  `;

  readonly stack = [
    { name: 'Angular', version: '22.0', icon: '🅰️', desc: 'Signals, standalone, SSR' },
    { name: 'Node.js', version: '20.x', icon: '🟢', desc: 'Fastify, ws, bullmq' },
    { name: 'Puppeteer', version: '23.x', icon: '🎭', desc: 'Headless browser' },
    { name: 'PostgreSQL', version: '16', icon: '🐘', desc: 'Primary datastore + pgvector' },
    { name: 'Redis', version: '7.2', icon: '🔴', desc: 'Cache + job queue' },
    { name: 'Docker', version: '26', icon: '🐳', desc: 'Container runtime' },
    { name: 'Caddy', version: '2.8', icon: '🔒', desc: 'Reverse proxy + auto-TLS' },
    { name: 'Grafana', version: '11', icon: '📊', desc: 'Dashboards + alerts' },
  ];

  readonly archComponents = [
    { name: 'Orchestrator', icon: '🎛', desc: 'Coordinates parallel scrapers, handles retries' },
    { name: 'RateLimiter', icon: '⏱', desc: 'Token bucket per source, prevents bans' },
    { name: 'MatchEngine', icon: '🧠', desc: 'Fuzzy matching + price proximity scoring' },
    { name: 'JobQueue', icon: '📦', desc: 'BullMQ-based, 3 concurrent workers' },
    { name: 'CacheLayer', icon: '⚡', desc: 'Redis, 15-min TTL, 94% hit rate' },
    { name: 'WsHub', icon: '📡', desc: 'Real-time broadcast to subscribers' },
  ];

  readonly scrapingSettings = [
    { key: 'concurrency', label: 'Concurrency', desc: 'Parallel workers per source', type: 'number', value: 3 },
    { key: 'timeout', label: 'Request timeout (ms)', desc: 'Max time per HTTP request', type: 'number', value: 15000 },
    { key: 'retries', label: 'Max retries', desc: 'Retry failed requests with backoff', type: 'number', value: 3 },
    { key: 'cacheTtl', label: 'Cache TTL (min)', desc: 'How long to cache search results', type: 'number', value: 15 },
    { key: 'headless', label: 'Headless mode', desc: 'Run browser without UI', type: 'toggle', value: true },
    { key: 'respectRobots', label: 'Respect robots.txt', desc: 'Skip disallowed paths', type: 'toggle', value: true },
  ];

  readonly notyfSettings = [
    { key: 'priceDrops', label: 'Price drop alerts', desc: 'Notify when prices drop significantly', value: true },
    { key: 'targetReached', label: 'Target reached', desc: 'Notify when target prices are hit', value: true },
    { key: 'systemIssues', label: 'System issues', desc: 'Notify on source failures', value: true },
    { key: 'jobFinished', label: 'Job completion', desc: 'Notify when scrape jobs finish', value: false },
    { key: 'weeklyReport', label: 'Weekly report', desc: 'Email summary every Monday', value: true },
  ];

  readonly dataSetting = [
    { key: 'retention', label: 'Price history (days)', desc: 'How long to keep historical data', value: 365 },
    { key: 'maxJobs', label: 'Max job history', desc: 'Number of jobs to retain', value: 1000 },
    { key: 'maxWatch', label: 'Max watchlist size', desc: 'Maximum products to watch', value: 200 },
  ];

  private settingsStore = signal<Record<string, any>>({
    concurrency: 3, timeout: 15000, retries: 3, cacheTtl: 15, headless: true, respectRobots: true,
  });

  private notifStore = signal<Record<string, boolean>>({
    priceDrops: true, targetReached: true, systemIssues: true, jobFinished: false, weeklyReport: true,
  });

  private dataStore = signal<Record<string, number>>({
    retention: 365, maxJobs: 1000, maxWatch: 200,
  });

  readonly nav = computed<PreviewNavItem[]>(() => [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', group: 'Overview' },
    { id: 'live', label: 'Live Monitor', icon: '🔴', group: 'Overview' },
    { id: 'analytics', label: 'Analytics', icon: '📈', group: 'Overview' },
    { id: 'search', label: 'Search', icon: '🔍', group: 'Discovery' },
    { id: 'categories', label: 'Categories', icon: '📁', group: 'Discovery' },
    { id: 'trending', label: 'Trending', icon: '🔥', group: 'Discovery' },
    { id: 'deals', label: 'Best Deals', icon: '💰', group: 'Discovery', badge: 12 },
    { id: 'watchlist', label: 'Watchlist', icon: '⭐', badge: this.watchlist().length, group: 'Products' },
    { id: 'compare', label: 'Compare', icon: '⚖️', badge: this.compareList().length, group: 'Products' },
    { id: 'history', label: 'Price History', icon: '📉', group: 'Products' },
    { id: 'saved', label: 'Saved Searches', icon: '💾', badge: this.savedSearches().length, group: 'Products' },
    { id: 'sources', label: 'Sources', icon: '🌐', badge: this.sources.length, group: 'Fleet' },
    { id: 'jobs', label: 'Scrape Jobs', icon: '⚙️', badge: this.runningJobs(), group: 'Fleet' },
    { id: 'health', label: 'Health', icon: '💚', group: 'Fleet' },
    { id: 'alerts', label: 'Price Alerts', icon: '🔔', badge: this.triggeredAlerts(), group: 'Alerts' },
    { id: 'notifications', label: 'Notifications', icon: '📬', badge: this.unreadNotifs(), group: 'Alerts' },
    { id: 'logs', label: 'Live Logs', icon: '📜', group: 'System' },
    { id: 'api', label: 'API', icon: '🔌', group: 'System' },
    { id: 'architecture', label: 'Architecture', icon: '🏗', group: 'System' },
    { id: 'settings', label: 'Settings', icon: '⚙️', group: 'System' },
  ]);

  readonly toolbar = computed<ToolbarAction[]>(() => [
    { id: 'refresh', label: 'Refresh', icon: '⟳', action: () => this.toast.success('Refreshed') },
    { id: 'run', label: 'New scan', icon: '▶', primary: true, action: () => this.runQuickScan() },
  ]);

  readonly notifs = signal<PreviewNotification[]>([
    { id: 1, icon: '📉', title: 'AirPods Pro dropped 12%', body: 'Now 8,490 EGP on Amazon', time: '2m' },
    { id: 2, icon: '🎯', title: 'Samsung TV hit target', body: 'Your alert triggered at 28,490 EGP', time: '15m' },
    { id: 3, icon: '⚠️', title: 'Souq is slow', body: 'Latency above 480ms', time: '1h' },
    { id: 4, icon: '✅', title: 'Job J-002 complete', body: '128 products found', time: '2h' },
  ]);

  readonly searchPlaceholder = computed(() =>
    this.active() === 'search' ? 'Search products…' :
      this.active() === 'logs' ? 'Filter logs…' : ''
  );

  readonly requestHistory = Array.from({ length: 40 }, () => Math.floor(Math.random() * 80) + 15);
  readonly errorRates = Array.from({ length: 20 }, () => Math.random() * 12);
  readonly historyLabels = ['6 months ago', '5m', '4m', '3m', '2m', 'Last month', 'Now'];

  readonly workers = signal([
    { id: 'w-1', name: 'Worker 1', icon: '⚙️', status: 'active', currentTask: 'Scraping Sony WH-1000XM5', progress: 68, elapsed: '2.1s', found: 34, rps: 12 },
    { id: 'w-2', name: 'Worker 2', icon: '⚙️', status: 'active', currentTask: 'Scraping iPhone 15 Pro', progress: 42, elapsed: '1.8s', found: 21, rps: 9 },
    { id: 'w-3', name: 'Worker 3', icon: '⚙️', status: 'idle', currentTask: 'Waiting for next job', progress: 0, elapsed: '—', found: 0, rps: 0 },
    { id: 'w-4', name: 'Worker 4', icon: '⚙️', status: 'error', currentTask: 'Connection failed to 2B', progress: 12, elapsed: '0.4s', found: 0, rps: 0 },
  ]);

  readonly liveLogs = computed(() => this.logs().slice(-8).reverse());

  readonly productById = (id: string) => this.products.find(p => p.id === id);

  readonly sourceById = (id: string) => this.sources.find(s => s.id === id);

  readonly onlineSources = computed(() => this.sources.filter(s => s.status === 'online' && s.enabled).length);
  readonly degradedSources = computed(() => this.sources.filter(s => s.status === 'degraded').length);
  readonly offlineSources = computed(() => this.sources.filter(s => s.status === 'offline').length);
  readonly criticalSources = computed(() => this.degradedSources() + this.offlineSources());
  readonly runningJobs = computed(() => this.jobs.filter(j => j.status === 'running' || j.status === 'queued').length);
  readonly triggeredAlerts = computed(() => this.alerts().filter(a => a.status === 'triggered').length);
  readonly unreadNotifs = computed(() => this.notifItems().filter(n => !n.read).length);

  readonly topSources = computed(() => [...this.sources].filter(s => s.enabled).sort((a, b) => b.uptime - a.uptime).slice(0, 4));

  readonly recentJobs = computed(() => [...this.jobs].sort((a, b) => b.startedAt.localeCompare(a.startedAt)));

  readonly priceDrops = computed(() => {
    return this.products.slice(0, 5).map(p => ({
      product: p,
      oldPrice: p.worstPrice,
      pct: Math.round(((p.worstPrice - p.bestPrice) / p.worstPrice) * 100),
    }));
  });

  readonly categoryStats = computed(() => {
    const map = new Map<string, number>();
    this.products.forEach(p => map.set(p.category, (map.get(p.category) ?? 0) + 1));
    const total = this.products.length;
    const colors = ['#007aff', '#34c759', '#ff9500', '#af52de', '#ff2d55', '#00c7be', '#ffcc00', '#5856d6'];
    const icons: Record<string, string> = { Headphones: '🎧', Earbuds: '🎵', Smartphones: '📱', Consoles: '🎮', Shoes: '👟', TVs: '📺', 'Home Appliances': '🍳', Laptops: '💻', Cameras: '📷' };
    return Array.from(map.entries()).map(([name, count], i) => ({
      name, count,
      pct: Math.round((count / total) * 100),
      color: colors[i % colors.length],
      icon: icons[name] ?? '📦',
    }));
  });

  readonly systemStatus = computed(() => [
    { label: 'Scraper Engine', value: '3 active workers', status: 'ok', tag: 'OK' },
    { label: 'Database', value: '12ms avg query time', status: 'ok', tag: 'OK' },
    { label: 'Redis Cache', value: '94% hit rate', status: 'ok', tag: 'OK' },
    { label: 'WebSocket Hub', value: '3 connected clients', status: 'ok', tag: 'OK' },
    { label: 'Souq Source', value: 'High latency (480ms)', status: 'warn', tag: 'WARN' },
    { label: '2B Source', value: 'Offline for 2h', status: 'err', tag: 'ERR' },
  ]);

  readonly dashboardKpis = computed(() => [
    { icon: '📦', label: 'Products Indexed', value: (this.sources.reduce((s, x) => s + x.products, 0) / 1000).toFixed(1) + 'K', color: '#007aff', trend: '+4.2%', trendUp: true, go: () => this.active.set('search') },
    { icon: '🌐', label: 'Sources Online', value: `${this.onlineSources()}/${this.sources.length}`, color: '#34c759', trend: '+1', trendUp: true, go: () => this.active.set('sources') },
    { icon: '🔔', label: 'Active Alerts', value: this.alerts().filter(a => a.status === 'active').length.toString(), color: '#ff9500', trend: '+2', trendUp: true, go: () => this.active.set('alerts') },
    { icon: '📉', label: 'Best Deal Today', value: '−38%', color: '#af52de', trend: 'Sony XM5', trendUp: false, go: () => this.active.set('deals') },
  ]);

  readonly analyticsKpis = computed(() => [
    { icon: '🔍', label: 'Total Searches', value: '12,847', color: '#007aff' },
    { icon: '📦', label: 'Products Found', value: '48.2K', color: '#34c759' },
    { icon: '⚡', label: 'Avg Response', value: '2.4s', color: '#ff9500' },
    { icon: '🎯', label: 'Match Accuracy', value: '96.4%', color: '#af52de' },
  ]);

  readonly searchVolume = computed(() => {
    const len = this.analyticsRange() === '7d' ? 7 : this.analyticsRange() === '30d' ? 30 : 90;
    return Array.from({ length: len }, (_, i) => 30 + Math.sin(i / 3) * 20 + Math.random() * 30);
  });

  readonly analyticsLabels = computed(() => {
    const len = this.analyticsRange() === '7d' ? 7 : this.analyticsRange() === '30d' ? 30 : 90;
    return Array.from({ length: len }, (_, i) => i === 0 ? 'Start' : i === len - 1 ? 'Now' : '');
  });

  readonly sourcePerformance = computed(() => this.sources.filter(s => s.enabled).map(s => ({
    id: s.id, name: s.name, icon: s.icon, color: s.color,
    score: Math.round(s.uptime * 0.6 + (100 - Math.min(s.latency / 5, 100)) * 0.4),
  })));

  readonly topSearches = computed(() => [
    { query: 'Sony WH-1000XM5', volume: 1247, trend: 12 },
    { query: 'iPhone 15 Pro', volume: 982, trend: 8 },
    { query: 'PS5 Controller', volume: 741, trend: -3 },
    { query: 'Air Fryer', volume: 621, trend: 24 },
    { query: 'Nike Air Max', volume: 542, trend: 15 },
    { query: 'Samsung 55 TV', volume: 487, trend: -7 },
    { query: 'MacBook Air M3', volume: 412, trend: 32 },
    { query: 'Sony WF-1000XM5', volume: 387, trend: 5 },
  ]);

  readonly trendingSearches = computed(() => [
    { query: 'Sony WH-1000XM5', category: 'Headphones', volume: 1247, trend: 12, sparkline: this.sparkline(8, 20) },
    { query: 'iPhone 15 Pro', category: 'Smartphones', volume: 982, trend: 8, sparkline: this.sparkline(10, 18) },
    { query: 'MacBook Air M3', category: 'Laptops', volume: 412, trend: 32, sparkline: this.sparkline(5, 22) },
    { query: 'Air Fryer 5.5L', category: 'Home Appliances', volume: 621, trend: 24, sparkline: this.sparkline(6, 19) },
    { query: 'Nike Air Max 270', category: 'Shoes', volume: 542, trend: 15, sparkline: this.sparkline(7, 17) },
  ]);

  readonly risingStars = computed(() => [...this.products].sort((a, b) => b.trendPct - a.trendPct).slice(0, 6));

  readonly filteredProducts = computed(() => {
    let list = this.products;
    const cat = this.filterCategory();
    if (cat !== 'all') list = list.filter(p => p.category === cat);
    const min = this.priceMin();
    const max = this.priceMax();
    if (min > 0) list = list.filter(p => p.bestPrice >= min);
    if (max < 99999) list = list.filter(p => p.bestPrice <= max);
    const r = this.minRating();
    if (r > 0) list = list.filter(p => p.rating >= r);
    if (this.inStockOnly()) list = list.filter(p => p.inStock);
    if (this.withDiscount()) list = list.filter(p => p.discount > 0);
    const q = this.query().toLowerCase().trim();
    if (q) list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
    const sort = this.sortBy();
    return [...list].sort((a, b) => {
      if (sort === 'price-asc') return a.bestPrice - b.bestPrice;
      if (sort === 'price-desc') return b.bestPrice - a.bestPrice;
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'discount') return b.discount - a.discount;
      if (sort === 'reviews') return b.reviews - a.reviews;
      return b.matchScore - a.matchScore;
    });
  });

  readonly topDeals = computed(() => [...this.products].filter(p => p.discount >= this.dealMin()).sort((a, b) => b.discount - a.discount));

  readonly categoryDetails = computed(() => this.categoryStats().map(c => {
    const inCat = this.products.filter(p => p.category === c.name);
    const prices = inCat.map(p => p.bestPrice);
    return {
      ...c,
      avgPrice: Math.round(prices.reduce((s, x) => s + x, 0) / prices.length),
      bestDeal: Math.min(...prices),
      trend: Math.round(Math.random() * 20 - 5),
      topProducts: inCat.slice(0, 3),
    };
  }));

  readonly filteredLogs = computed(() => {
    const lvl = this.logLevel();
    if (lvl === 'all') return this.logs();
    return this.logs().filter(l => l.level === lvl);
  });

  readonly triggeredAlertsList = computed(() => this.alerts().filter(a => a.status === 'triggered'));

  readonly jobStats = computed(() => [
    { label: 'Total', value: this.jobs.length, color: '#007aff' },
    { label: 'Running', value: this.jobs.filter(j => j.status === 'running').length, color: '#34c759' },
    { label: 'Queued', value: this.jobs.filter(j => j.status === 'queued').length, color: '#ff9500' },
    { label: 'Completed', value: this.jobs.filter(j => j.status === 'completed').length, color: '#af52de' },
    { label: 'Failed', value: this.jobs.filter(j => j.status === 'failed').length, color: '#ff3b30' },
  ]);

  readonly overallHealth = computed(() => {
    if (this.offlineSources() > 0) return { status: 'err', icon: '⛔', label: 'Degraded', message: `${this.offlineSources()} source(s) offline` };
    if (this.degradedSources() > 0) return { status: 'warn', icon: '⚠️', label: 'Warning', message: `${this.degradedSources()} source(s) degraded` };
    return { status: 'ok', icon: '✅', label: 'All systems operational', message: 'All sources responding normally' };
  });

  readonly historyProduct = computed(() => this.productById(this.historyProductId()));

  readonly historyStats = computed(() => {
    const p = this.historyProduct();
    if (!p) return [];
    return [
      { label: 'Current', value: p.bestPrice.toLocaleString() + ' EGP', color: '#007aff' },
      { label: 'Lowest ever', value: p.lowestEver.toLocaleString() + ' EGP', color: '#34c759' },
      { label: 'Highest', value: p.worstPrice.toLocaleString() + ' EGP', color: '#ff3b30' },
      { label: 'Average', value: p.avgPrice.toLocaleString() + ' EGP', color: '#ff9500' },
    ];
  });

  readonly historyPoints = computed(() => {
    const pts = Array.from({ length: 7 }, (_, i) => {
      const x = (i / 6) * 600;
      const base = this.historyProduct()?.avgPrice ?? 10000;
      const variance = Math.sin(i * 1.7) * base * 0.12 + (i - 3) * base * 0.02;
      const y = 100 + variance / 100;
      return { x, y: Math.max(20, Math.min(180, y)) };
    });
    return pts;
  });

  readonly historyLinePath = computed(() => {
    const pts = this.historyPoints();
    return 'M ' + pts.map(p => `${p.x},${p.y}`).join(' L ');
  });

  readonly historyAreaPath = computed(() => {
    const pts = this.historyPoints();
    return 'M ' + pts.map(p => `${p.x},${p.y}`).join(' L ') + ' L 600,200 L 0,200 Z';
  });

  readonly historyLog = computed(() => {
    const p = this.historyProduct();
    if (!p) return [];
    const sources = ['amazon', 'noon', 'jumia', 'btech', 'olx'];
    return Array.from({ length: 6 }, (_, i) => {
      const base = p.avgPrice;
      const oldPrice = Math.round(base * (1 + Math.random() * 0.15 - 0.05));
      const newPrice = Math.round(base * (1 + Math.random() * 0.15 - 0.1));
      return {
        date: `Dec ${String(8 - i).padStart(2, '0')}`,
        sourceId: sources[i % sources.length],
        oldPrice,
        newPrice,
      };
    });
  });

  readonly compareRows = computed(() => {
    const list = this.compareList();
    if (list.length === 0) return [];
    const getBest = (values: number[], direction: 'min' | 'max') =>
      direction === 'min' ? Math.min(...values) : Math.max(...values);
    const rows: { label: string; values: { value: string; best: boolean; worst: boolean; }[] }[] = [];

    const prices = list.map(p => p.bestPrice);
    rows.push({ label: 'Best price', values: list.map(p => ({ value: p.bestPrice.toLocaleString() + ' EGP', best: p.bestPrice === getBest(prices, 'min'), worst: p.bestPrice === getBest(prices, 'max') })) });

    const ratings = list.map(p => p.rating);
    rows.push({ label: 'Rating', values: list.map(p => ({ value: '★ ' + p.rating, best: p.rating === getBest(ratings, 'max'), worst: p.rating === getBest(ratings, 'min') })) });

    const reviews = list.map(p => p.reviews);
    rows.push({ label: 'Reviews', values: list.map(p => ({ value: p.reviews.toLocaleString(), best: p.reviews === getBest(reviews, 'max'), worst: p.reviews === getBest(reviews, 'min') })) });

    const matches = list.map(p => p.matchScore);
    rows.push({ label: 'Match score', values: list.map(p => ({ value: p.matchScore + '%', best: p.matchScore === getBest(matches, 'max'), worst: p.matchScore === getBest(matches, 'min') })) });

    rows.push({ label: 'Brand', values: list.map(p => ({ value: p.brand, best: false, worst: false })) });
    rows.push({ label: 'Category', values: list.map(p => ({ value: p.category, best: false, worst: false })) });
    rows.push({ label: 'Sources', values: list.map(p => ({ value: p.sources.length.toString(), best: p.sources.length === getBest(list.map(x => x.sources.length), 'max'), worst: false })) });
    rows.push({ label: 'In stock', values: list.map(p => ({ value: p.inStock ? '✓ Yes' : '✕ No', best: p.inStock, worst: !p.inStock })) });

    return rows;
  });

  onNav(id: string): void {
    this.active.set(id as ARView);
    if (id === 'logs' || id === 'live') {
      this.logs.update(list => [...list]);
    }
  }

  onSearch(q: string): void {
    this.searchQuery.set(q);
    if (this.active() === 'logs') this.logLevel.set(q || 'all');
  }

  runQuickScan(): void {
    this.active.set('search');
    this.query.set(this.query() || 'Sony WH-1000XM5');
    this.runSearch();
  }

  runSearch(): void {
    if (this.scraping()) return;
    if (!this.query()) this.query.set('Sony WH-1000XM5');
    this.scraping.set(true);
    this.progress.set(0);
    this.doneSources.set([]);
    const enabled = this.sources.filter(s => s.enabled).map(s => s.id);
    const tick = setInterval(() => {
      const p = this.progress();
      const next = Math.min(p + 3, 100);
      this.progress.set(next);
      const doneCount = Math.floor((next / 100) * enabled.length);
      this.doneSources.set(enabled.slice(0, doneCount));
      if (next >= 100) {
        clearInterval(tick);
        this.scraping.set(false);
        this.toast.success('Search complete', `${this.filteredProducts().length} products found`);
      }
    }, 60);
  }

  quickSearch(q: string): void {
    this.query.set(q);
    this.active.set('search');
    this.runSearch();
  }

  resetFilters(): void {
    this.filterCategory.set('all');
    this.priceMin.set(0);
    this.priceMax.set(99999);
    this.minRating.set(0);
    this.inStockOnly.set(false);
    this.withDiscount.set(false);
    this.sortBy.set('match');
  }

  toggleSourceFilter(id: string): void {
    this.selectedSources.update(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  }

  srcDone(id: string): boolean {
    return this.doneSources().includes(id);
  }

  sourceIcon(id: string): string {
    return this.sourceById(id)?.icon ?? '📦';
  }

  sourceName(id: string): string {
    return this.sourceById(id)?.name ?? id;
  }

  sourceColor(id: string): string {
    return this.sourceById(id)?.color ?? '#8e8e93';
  }

  gradientFor(p: ARProduct): string {
    const palettes: Record<string, string> = {
      Headphones: 'linear-gradient(135deg, #ff9500, #ffcc00)',
      Earbuds: 'linear-gradient(135deg, #34c759, #00c7be)',
      Smartphones: 'linear-gradient(135deg, #007aff, #5856d6)',
      Consoles: 'linear-gradient(135deg, #007aff, #af52de)',
      Shoes: 'linear-gradient(135deg, #ff2d55, #ff9500)',
      TVs: 'linear-gradient(135deg, #5856d6, #af52de)',
      'Home Appliances': 'linear-gradient(135deg, #ff9500, #ff3b30)',
      Laptops: 'linear-gradient(135deg, #5856d6, #007aff)',
      Cameras: 'linear-gradient(135deg, #34c759, #ffcc00)',
    };
    return palettes[p.category] ?? 'linear-gradient(135deg, #8e8e93, #48484a)';
  }

  statusIcon(s: string): string {
    return { queued: '⏳', running: '▶', completed: '✓', failed: '✕' }[s] ?? '•';
  }

  openProduct(id: string): void {
    const p = this.productById(id);
    if (p) this.selectedProduct.set(p);
  }

  closeProduct(): void {
    this.selectedProduct.set(null);
  }

  openSource(id: string): void {
    const s = this.sourceById(id);
    if (s) this.toast.info(s.name, `${s.products.toLocaleString()} products · ${s.uptime}% uptime`);
  }

  openJob(id: string): void {
    const j = this.jobs.find(x => x.id === id);
    if (j) this.toast.info(`Job ${j.id}`, `${j.query} · ${j.status}`);
  }

  openEndpoint(ep: any): void {
    this.selectedEndpoint.set(ep);
  }

  inspectEndpoint(ep: any): void {
    this.selectedEndpoint.set(ep);
  }

  toggleSource(id: string): void {
    const s = this.sourceById(id);
    if (!s) return;
    s.enabled = !s.enabled;
    this.sources[this.sources.indexOf(s)] = { ...s };
    this.toast.success(`${s.name} ${s.enabled ? 'enabled' : 'disabled'}`);
  }

  addToWatchlist(id: string): void {
    if (this.watchlist().some(w => w.productId === id)) {
      this.toast.info('Already in watchlist');
      return;
    }
    const p = this.productById(id);
    if (!p) return;
    this.watchlist.update(list => [...list, { productId: id, addedAt: new Date().toISOString().slice(0, 10), note: '', priceWhenAdded: p.bestPrice }]);
    this.toast.success('Added to watchlist', p.name, '⭐');
  }

  removeWatch(id: string): void {
    this.watchlist.update(list => list.filter(w => w.productId !== id));
    this.toast.info('Removed from watchlist');
  }

  priceChange(w: ARWatchItem): number {
    const p = this.productById(w.productId);
    if (!p) return 0;
    return p.bestPrice - w.priceWhenAdded;
  }

  buyProduct(id: string): void {
    const p = this.productById(id);
    if (!p) return;
    const best = p.sources.reduce((a, b) => a.price < b.price ? a : b);
    window.open(best.url, '_blank');
  }

  addToCompare(id: string): void {
    const p = this.productById(id);
    if (!p) return;
    if (this.compareList().some(c => c.id === id)) {
      this.toast.info('Already in comparison');
      return;
    }
    if (this.compareList().length >= 4) {
      this.toast.warning('Max 4 products', 'Remove one first');
      return;
    }
    this.compareList.update(list => [...list, p]);
    this.toast.success('Added to comparison', p.name, '⚖️');
  }

  removeCompare(id: string): void {
    this.compareList.update(list => list.filter(c => c.id !== id));
  }

  clearCompare(): void {
    this.compareList.set([]);
  }

  createAlert(id: string): void {
    const p = this.productById(id);
    if (!p) return;
    this.toast.success('Alert created', `${p.name} → ${(p.bestPrice * 0.9).toFixed(0)} EGP`, '🔔');
  }

  toggleAlert(id: string): void {
    this.alerts.update(list => list.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a));
  }

  deleteAlert(id: string): void {
    this.alerts.update(list => list.filter(a => a.id !== id));
    this.toast.info('Alert deleted');
  }

  markRead(id: number): void {
    this.notifItems.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
  }

  markAllRead(): void {
    this.notifItems.update(list => list.map(n => ({ ...n, read: true })));
    this.toast.success('All marked as read');
  }

  clearLogs(): void {
    this.logs.set([]);
  }

  saveCurrentSearch(): void {
    const q = this.query() || 'Sony WH-1000XM5';
    const filters = `Category: ${this.filterCategory()} · Rating: ${this.minRating()}+`;
    this.savedSearches.update(list => [{ id: 'SS-' + Date.now(), query: q, filters, savedAt: 'just now', resultCount: this.filteredProducts().length }, ...list]);
    this.toast.success('Search saved', q, '💾');
  }

  deleteSaved(id: string): void {
    this.savedSearches.update(list => list.filter(s => s.id !== id));
  }

  pct(oldP: number, newP: number): number {
    return Math.round(((newP - oldP) / oldP) * 100);
  }

  updateSetting(key: string, value: any): void {
    this.settingsStore.update(s => ({ ...s, [key]: value }));
  }

  updateNotifSetting(key: string, value: boolean): void {
    this.notifStore.update(s => ({ ...s, [key]: value }));
    this.toast.success(`${key}: ${value ? 'ON' : 'OFF'}`);
  }

  updateDataSetting(key: string, value: any): void {
    this.dataStore.update(s => ({ ...s, [key]: +value }));
  }

  saveSettings(): void {
    this.toast.success('Settings saved', 'Applied to running engine', '💾');
  }

  clearCache(): void {
    this.toast.warning('Cache cleared', 'All sources will refetch on next query');
  }

  resetAll(): void {
    this.watchlist.set([]);
    this.alerts.set([]);
    this.savedSearches.set([]);
    this.compareList.set([]);
    this.toast.warning('All data reset', 'Fresh start');
  }

  endpointFiles(ep: any): { name: string; language: any; code: string; }[] {
    const baseUrl = 'https://api.arroom.local/v1';
    return [
      {
        name: 'request.http',
        language: 'bash',
        code: `${ep.method} ${baseUrl}${ep.route}\nContent-Type: application/json\n${ep.auth === 'bearer' ? 'Authorization: Bearer <token>' : ''}`,
      },
      {
        name: 'curl.sh',
        language: 'bash',
        code: `curl -X ${ep.method} \\\n  ${baseUrl}${ep.route} \\\n  -H "Content-Type: application/json" \\${ep.auth === 'bearer' ? '\n  -H "Authorization: Bearer $TOKEN"' : ''}`,
      },
      {
        name: 'response.json',
        language: 'json',
        code: JSON.stringify({ status: 200, data: { ok: true } }, null, 2),
      },
    ];
  }

  onProductContext(ev: MouseEvent, p: ARProduct): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: 'View details', icon: '👁', action: () => this.openProduct(p.id) },
      { id: 'watch', label: 'Add to watchlist', icon: '⭐', action: () => this.addToWatchlist(p.id) },
      { id: 'compare', label: 'Add to compare', icon: '⚖️', action: () => this.addToCompare(p.id) },
      { id: 'alert', label: 'Create alert', icon: '🔔', action: () => this.createAlert(p.id) },
      { id: 'sep', label: '', separatorBefore: true },
      { id: 'copy', label: 'Copy product name', icon: '📋', action: () => { navigator.clipboard?.writeText(p.name); this.toast.success('Copied'); } },
    ]);
  }

  onSourceContext(ev: MouseEvent, s: ARSource): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'open', label: 'Open source', icon: '📂', action: () => this.openSource(s.id) },
      { id: 'toggle', label: s.enabled ? 'Disable source' : 'Enable source', icon: s.enabled ? '⏸' : '▶', action: () => this.toggleSource(s.id) },
      { id: 'sep', label: '', separatorBefore: true },
      { id: 'health', label: 'Check health', icon: '💚', action: () => this.toast.info(s.name, `${s.uptime}% uptime · ${s.latency}ms`) },
    ]);
  }

  private buildProduct(id: string, name: string, nameAr: string, image: string, brand: string, category: string, rating: number, reviews: number, matchScore: number, tags: string[], bestPrice: number, worstPrice: number): ARProduct {
    const lowestEver = Math.round(bestPrice * 0.88);
    const avgPrice = Math.round((bestPrice + worstPrice) / 2);
    const discount = Math.round(((worstPrice - bestPrice) / worstPrice) * 100);
    const trendPct = Math.round(Math.random() * 20 - 10);
    const sourceIds = ['amazon', 'noon', 'jumia', 'btech', 'olx'];
    const sources: ARSourcePrice[] = sourceIds.slice(0, 3 + Math.floor(Math.random() * 3)).map((sid, i) => ({
      sourceId: sid,
      price: Math.round(bestPrice + (i * 150) + Math.random() * 300),
      oldPrice: i === 0 ? Math.round(worstPrice) : undefined,
      inStock: Math.random() > 0.15,
      url: `https://${sid}.com/product/${id}`,
      shipping: Math.floor(Math.random() * 50),
      deliveryDays: 1 + Math.floor(Math.random() * 7),
      scrapedAt: new Date().toISOString(),
    })).sort((a, b) => a.price - b.price);
    return {
      id, name, nameAr, image, brand, category, rating, reviews, matchScore, tags,
      sources,
      bestPrice: sources[0]?.price ?? bestPrice,
      worstPrice: sources[sources.length - 1]?.price ?? worstPrice,
      avgPrice,
      lowestEver,
      discount,
      trend: trendPct > 2 ? 'up' : trendPct < -2 ? 'down' : 'stable',
      trendPct: Math.abs(trendPct),
      inStock: sources.some(s => s.inStock),
      addedAt: '2024-12-08',
      views: Math.floor(Math.random() * 5000) + 100,
      searches: Math.floor(Math.random() * 2000) + 50,
    };
  }

  private sparkline(min: number, max: number): number[] {
    return Array.from({ length: 12 }, () => Math.floor(Math.random() * (max - min)) + min);
  }

  private get notifSettings(): { key: string; label: string; desc: string; value: boolean; }[] {
    const s = this.notifStore();
    return [
      { key: 'priceDrops', label: 'Price drop alerts', desc: 'Notify when prices drop significantly', value: s['priceDrops'] },
      { key: 'targetReached', label: 'Target reached', desc: 'Notify when target prices are hit', value: s['targetReached'] },
      { key: 'systemIssues', label: 'System issues', desc: 'Notify on source failures', value: s['systemIssues'] },
      { key: 'jobFinished', label: 'Job completion', desc: 'Notify when scrape jobs finish', value: s['jobFinished'] },
      { key: 'weeklyReport', label: 'Weekly report', desc: 'Email summary every Monday', value: s['weeklyReport'] },
    ];
  }

  private get dataSettings(): { key: string; label: string; desc: string; value: number; }[] {
    const s = this.dataStore();
    return [
      { key: 'retention', label: 'Price history (days)', desc: 'How long to keep historical data', value: s['retention'] },
      { key: 'maxJobs', label: 'Max job history', desc: 'Number of jobs to retain', value: s['maxJobs'] },
      { key: 'maxWatch', label: 'Max watchlist size', desc: 'Maximum products to watch', value: s['maxWatch'] },
    ];
  }

  absNum(num: any) {
    return Math.abs(num);
  }
}