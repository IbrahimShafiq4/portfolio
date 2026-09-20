import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DummyDataEditorComponent } from '../../shared/dummy-data-editor/dummy-data-editor';
import { PreviewShellComponent, PreviewNavItem, ToolbarAction } from '../../shared/preview-shell/preview-shell';

interface Soldier {
  id: string;
  name: string;
  sector: string;
  unit: string;
  status: 'Active' | 'Transfer' | 'Leave' | 'Training';
  rank: string;
  enlisted: string;
  bloodType: string;
  phone: string;
  lastCheckIn: string;
  missions: number;
  photo?: string;
}

@Component({
  selector: 'app-enlisted-preview',
  standalone: true,
  imports: [PreviewShellComponent, FormsModule, DummyDataEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="📋"
      title="Enlisted Management"
      subtitle="FOE · Personnel"
      [nav]="nav()"
      [active]="active()"
      (activeChange)="active.set($any($event))"
      [toolbarActions]="toolbar()"
      [notifications]="notifs()"
      [searchPlaceholder]="active() === 'registry' ? 'Search by name, ID, sector…' : ''"
    >
      <!-- ============== REGISTRY ============== -->
      @if (active() === 'registry') {
        <div class="view">
          <app-dummy-data-editor projectId="enlisted" />

          <!-- KPI Row -->
          <div class="kpis">
            @for (k of kpis(); track k.label) {
              <article class="kpi" [style.--c]="k.color" (click)="filterByStatus(k.filterKey)">
                <div class="kpi-head">
                  <span class="kpi-icon">{{ k.icon }}</span>
                  <span class="kpi-trend" [class.up]="k.up" [class.down]="!k.up">
                    {{ k.up ? '▲' : '▼' }} {{ k.delta }}%
                  </span>
                </div>
                <b class="kpi-val">{{ k.value }}</b>
                <span class="kpi-label">{{ k.label }}</span>
                <div class="kpi-bar">
                  <div class="kpi-fill" [style.width.%]="k.pct"></div>
                </div>
              </article>
            }
          </div>

          <!-- Filter Bar -->
          <div class="filter-bar">
            <div class="filter-tabs">
              @for (f of statusFilters; track f.id) {
                <button class="ftab"
                        [class.active]="statusFilter() === f.id"
                        (click)="statusFilter.set(f.id)">
                  <span>{{ f.icon }}</span>
                  <span>{{ f.label }}</span>
                  <span class="ftab-count">{{ countByStatus(f.id) }}</span>
                </button>
              }
            </div>
            <div class="view-toggle">
              <button class="vt" [class.active]="viewMode() === 'table'"
                      (click)="viewMode.set('table')" title="Table view">☰</button>
              <button class="vt" [class.active]="viewMode() === 'cards'"
                      (click)="viewMode.set('cards')" title="Cards view">▦</button>
            </div>
          </div>

          <!-- Data -->
          @if (viewMode() === 'table') {
            <div class="table-wrap">
              <header class="thead">
                <span class="th check"></span>
                <span class="th sortable" (click)="sortBy('id')">ID {{ sortIcon('id') }}</span>
                <span class="th sortable" (click)="sortBy('name')">Name {{ sortIcon('name') }}</span>
                <span class="th sortable" (click)="sortBy('rank')">Rank {{ sortIcon('rank') }}</span>
                <span class="th">Unit</span>
                <span class="th sortable" (click)="sortBy('sector')">Sector {{ sortIcon('sector') }}</span>
                <span class="th sortable" (click)="sortBy('missions')">Missions {{ sortIcon('missions') }}</span>
                <span class="th">Status</span>
                <span class="th"></span>
              </header>

              @for (s of paged(); track s.id) {
                <div class="trow"
                     [class.selected]="selectedIds().includes(s.id)"
                     (click)="toggleSelect(s.id)">
                  <span class="td check">
                    <input type="checkbox" [checked]="selectedIds().includes(s.id)"
                           (click)="$event.stopPropagation(); toggleSelect(s.id)" />
                  </span>
                  <span class="td mono">{{ s.id }}</span>
                  <span class="td name-cell">
                    <span class="avatar-s">{{ initials(s.name) }}</span>
                    <b>{{ s.name }}</b>
                  </span>
                  <span class="td">{{ s.rank }}</span>
                  <span class="td small">{{ s.unit }}</span>
                  <span class="td">
                    <span class="sector-pill">📍 {{ s.sector }}</span>
                  </span>
                  <span class="td mono">{{ s.missions }}</span>
                  <span class="td">
                    <span class="st" [attr.data-s]="s.status">{{ s.status }}</span>
                  </span>
                  <span class="td actions-cell">
                    <button class="row-action" title="View details"
                            (click)="$event.stopPropagation(); openDetail(s.id)">👁</button>
                    <button class="row-action" title="Edit"
                            (click)="$event.stopPropagation(); toast('Editing ' + s.name)">✎</button>
                    <button class="row-action danger" title="Delete"
                            (click)="$event.stopPropagation(); removeSoldier(s.id)">🗑</button>
                  </span>
                </div>
              } @empty {
                <div class="empty-state">
                  <span>📭</span>
                  <b>No soldiers found</b>
                  <small>Try a different filter or search query</small>
                </div>
              }
            </div>

            <!-- Pagination -->
            @if (filtered().length > pageSize) {
              <footer class="pagination">
                <span class="page-info">
                  Showing {{ (page() - 1) * pageSize + 1 }}–{{ Math.min(page() * pageSize, filtered().length) }}
                  of {{ filtered().length }}
                </span>
                <div class="page-controls">
                  <button class="pg-btn" [disabled]="page() === 1"
                          (click)="page.set(page() - 1)">‹ Prev</button>
                  @for (p of pageNumbers(); track p) {
                    <button class="pg-btn" [class.active]="page() === p"
                            (click)="page.set(p)">{{ p }}</button>
                  }
                  <button class="pg-btn" [disabled]="page() === lastPage()"
                          (click)="page.set(page() + 1)">Next ›</button>
                </div>
              </footer>
            }
          } @else {
            <!-- Cards view -->
            <div class="card-grid">
              @for (s of paged(); track s.id) {
                <article class="soldier-card" (click)="openDetail(s.id)">
                  <header class="sc-head">
                    <span class="sc-avatar">{{ initials(s.name) }}</span>
                    <div class="sc-name">
                      <b>{{ s.name }}</b>
                      <small class="mono">{{ s.id }}</small>
                    </div>
                    <span class="st" [attr.data-s]="s.status">{{ s.status }}</span>
                  </header>
                  <div class="sc-body">
                    <div class="sc-row">
                      <span>🎖 Rank</span><b>{{ s.rank }}</b>
                    </div>
                    <div class="sc-row">
                      <span>🏢 Unit</span><b>{{ s.unit }}</b>
                    </div>
                    <div class="sc-row">
                      <span>📍 Sector</span><b>{{ s.sector }}</b>
                    </div>
                    <div class="sc-row">
                      <span>📞 Phone</span><b class="mono">{{ s.phone }}</b>
                    </div>
                  </div>
                  <footer class="sc-foot">
                    <span class="sc-missions">🎯 {{ s.missions }} missions</span>
                    <button class="sc-open">Details →</button>
                  </footer>
                </article>
              }
            </div>
          }

          <!-- Bulk actions bar -->
          @if (selectedIds().length) {
            <div class="bulk-bar">
              <span class="bulk-count">{{ selectedIds().length }} selected</span>
              <div class="bulk-actions">
                <button class="bulk-btn" (click)="bulkAction('export')">📥 Export</button>
                <button class="bulk-btn" (click)="bulkAction('transfer')">🔀 Transfer</button>
                <button class="bulk-btn danger" (click)="bulkDelete()">🗑 Delete</button>
                <button class="bulk-btn ghost" (click)="selectedIds.set([])">✕</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ============== DETAIL VIEW ============== -->
      @else if (active() === 'detail' && detailSoldier(); as s) {
        <div class="detail-view">
          <button class="back-btn" (click)="active.set('registry')">← Back to registry</button>

          <header class="dv-hero">
            <div class="dv-avatar">{{ initials(s.name) }}</div>
            <div class="dv-info">
              <h2>{{ s.name }}</h2>
              <p class="dv-sub">{{ s.rank }} · {{ s.unit }}</p>
              <div class="dv-meta">
                <span class="mono">{{ s.id }}</span>
                <span>·</span>
                <span>{{ s.sector }}</span>
                <span>·</span>
                <span>Enlisted {{ s.enlisted }}</span>
              </div>
            </div>
            <div class="dv-actions">
              <button class="pill" (click)="toast('📄 Opening dossier…')">📄 Full dossier</button>
              <button class="pill" (click)="toast('🖨 Preparing print…')">🖨 Print card</button>
              <button class="pill primary" (click)="toast('✉️ Message sent to ' + s.name)">
                ✉️ Send message
              </button>
            </div>
          </header>

          <!-- Quick stats -->
          <div class="dv-stats">
            <div class="dvs">
              <span class="dvs-icon">🎯</span>
              <b>{{ s.missions }}</b>
              <small>Missions</small>
            </div>
            <div class="dvs">
              <span class="dvs-icon">📅</span>
              <b>{{ monthsSince(s.enlisted) }}</b>
              <small>Months served</small>
            </div>
            <div class="dvs">
              <span class="dvs-icon">⚕️</span>
              <b>{{ s.bloodType }}</b>
              <small>Blood type</small>
            </div>
            <div class="dvs">
              <span class="dvs-icon">📍</span>
              <b>{{ s.lastCheckIn }}</b>
              <small>Last check-in</small>
            </div>
          </div>

          <!-- Tabs -->
          <div class="dv-tabs">
            @for (t of detailTabs; track t.id) {
              <button class="dv-tab" [class.active]="detailTab() === t.id" (click)="detailTab.set(t.id)">
                {{ t.icon }} {{ t.label }}
              </button>
            }
          </div>

          <div class="dv-panel">
            @switch (detailTab()) {
              @case ('overview') {
                <div class="dv-grid">
                  <section class="dv-card">
                    <h4>📋 Personal info</h4>
                    <div class="info-row"><span>Full name</span><b>{{ s.name }}</b></div>
                    <div class="info-row"><span>Military ID</span><b class="mono">{{ s.id }}</b></div>
                    <div class="info-row"><span>Rank</span><b>{{ s.rank }}</b></div>
                    <div class="info-row"><span>Blood type</span><b>{{ s.bloodType }}</b></div>
                    <div class="info-row"><span>Phone</span><b class="mono">{{ s.phone }}</b></div>
                    <div class="info-row"><span>Enlisted</span><b>{{ s.enlisted }}</b></div>
                  </section>
                  <section class="dv-card">
                    <h4>🏢 Assignment</h4>
                    <div class="info-row"><span>Current unit</span><b>{{ s.unit }}</b></div>
                    <div class="info-row"><span>Sector</span><b>{{ s.sector }}</b></div>
                    <div class="info-row"><span>Status</span>
                      <b><span class="st" [attr.data-s]="s.status">{{ s.status }}</span></b>
                    </div>
                    <div class="info-row"><span>Missions completed</span><b>{{ s.missions }}</b></div>
                  </section>
                </div>
              }

              @case ('missions') {
                <section class="dv-card">
                  <h4>🎯 Mission history</h4>
                  @for (m of missionHistory(s); track m.id) {
                    <div class="mission-row">
                      <span class="m-icon">{{ m.icon }}</span>
                      <div class="m-info">
                        <b>{{ m.title }}</b>
                        <small>{{ m.desc }}</small>
                      </div>
                      <span class="m-date mono">{{ m.date }}</span>
                      <span class="m-status" [attr.data-s]="m.status">{{ m.status }}</span>
                    </div>
                  }
                </section>
              }

              @case ('training') {
                <section class="dv-card">
                  <h4>🎓 Training & certifications</h4>
                  @for (t of training(s); track t.id) {
                    <div class="training-row">
                      <span class="t-icon">{{ t.icon }}</span>
                      <div class="t-info">
                        <b>{{ t.name }}</b>
                        <small>{{ t.provider }}</small>
                      </div>
                      <div class="t-score">
                        <b>{{ t.score }}%</b>
                        <small>Score</small>
                      </div>
                      <span class="t-date mono">{{ t.date }}</span>
                    </div>
                  }
                </section>
              }

              @case ('timeline') {
                <section class="dv-card">
                  <h4>📅 Service timeline</h4>
                  <div class="timeline">
                    @for (e of timeline(s); track $index) {
                      <div class="tl-item">
                        <span class="tl-dot" [class.active]="e.active"></span>
                        <div class="tl-body">
                          <b>{{ e.title }}</b>
                          <small>{{ e.desc }}</small>
                        </div>
                        <span class="tl-date mono">{{ e.date }}</span>
                      </div>
                    }
                  </div>
                </section>
              }

              @case ('documents') {
                <section class="dv-card">
                  <h4>📄 Documents</h4>
                  @for (d of documents(); track d.id) {
                    <div class="doc-row">
                      <span class="doc-icon">{{ d.icon }}</span>
                      <div class="doc-info">
                        <b>{{ d.name }}</b>
                        <small>{{ d.size }} · {{ d.type }}</small>
                      </div>
                      <button class="doc-btn" (click)="toast('⬇ Downloading ' + d.name)">⬇</button>
                    </div>
                  }
                </section>
              }
            }
          </div>
        </div>
      }

      <!-- ============== DISTRIBUTION ============== -->
      @else if (active() === 'distribution') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Sector Distribution</h3>
              <p>Personnel spread across {{ sectorStats.length }} sectors</p>
            </div>
            <button class="pill" (click)="toast('🗺 Opening full map view…')">🗺 Map view</button>
          </header>

          <div class="sector-grid">
            @for (s of sectorStats; track s.name) {
              <article class="sec-card" (click)="toast('Filtered by ' + s.name)">
                <header>
                  <div>
                    <b>{{ s.name }}</b>
                    <small>{{ s.units }} units</small>
                  </div>
                  <span class="sec-total mono">{{ s.total }}</span>
                </header>

                <div class="sec-breakdown">
                  @for (b of s.breakdown; track b.label) {
                    <div class="sb-row">
                      <span class="sb-dot" [style.background]="b.color"></span>
                      <span class="sb-label">{{ b.label }}</span>
                      <span class="sb-val mono">{{ b.count }}</span>
                    </div>
                  }
                </div>

                <div class="sec-bar">
                  @for (b of s.breakdown; track b.label) {
                    <div class="sb-seg"
                         [style.width.%]="b.pct"
                         [style.background]="b.color"
                         [title]="b.label + ': ' + b.count"></div>
                  }
                </div>

                <footer class="sec-foot">
                  <span>Readiness {{ s.readiness }}%</span>
                  <span class="readiness-bar">
                    <span class="readiness-fill" [style.width.%]="s.readiness"></span>
                  </span>
                </footer>
              </article>
            }
          </div>

          <!-- Sector comparison chart -->
          <section class="chart-card">
            <header>
              <h4>Personnel by sector</h4>
              <span class="mono muted">Total: {{ totalPersonnel() }}</span>
            </header>
            <div class="chart-bars">
              @for (s of sectorStats; track s.name) {
                <div class="cb-wrap" (mouseenter)="hoverSector.set(s.name)" (mouseleave)="hoverSector.set('')">
                  @if (hoverSector() === s.name) {
                    <div class="cb-tip">{{ s.total }}</div>
                  }
                  <div class="cb"
                       [style.height.%]="(s.total / maxSectorTotal()) * 100"
                       [class.active]="hoverSector() === s.name"></div>
                  <span class="cb-label">{{ s.name.split(' ')[0] }}</span>
                </div>
              }
            </div>
          </section>
        </div>
      }

      <!-- ============== IMPORT ============== -->
      @else if (active() === 'import') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Bulk Import</h3>
              <p>Upload CSV/XLSX to add multiple soldiers at once</p>
            </div>
          </header>

          @if (importStep() === 1) {
            <div class="drop-zone" (click)="startImport()"
                 (dragover)="$event.preventDefault()" (drop)="startImport()">
              <span class="dz-icon">📥</span>
              <b>Drop your file here</b>
              <small>or click to browse · CSV, XLSX up to 50MB</small>
              <div class="dz-formats">
                <span class="fmt">.csv</span>
                <span class="fmt">.xlsx</span>
                <span class="fmt">.xls</span>
              </div>
            </div>

            <section class="template-card">
              <header>
                <b>📋 Download template</b>
                <small>Use our template to make sure your columns match</small>
              </header>
              <button class="pill primary" (click)="toast('⬇ Template downloaded')">
                ⬇ soldiers_template.xlsx
              </button>
            </section>
          } @else if (importStep() === 2) {
            <section class="preview-card">
              <header>
                <div>
                  <b>Preview: soldiers_batch_12.xlsx</b>
                  <small>2,847 rows detected</small>
                </div>
                <span class="badge-ok">✓ Valid format</span>
              </header>

              <div class="preview-table">
                <header class="pt-row head">
                  <span>ID</span><span>Name</span><span>Rank</span>
                  <span>Sector</span><span>Status</span>
                </header>
                @for (r of importPreview; track r.id) {
                  <div class="pt-row">
                    <span class="mono">{{ r.id }}</span>
                    <span>{{ r.name }}</span>
                    <span>{{ r.rank }}</span>
                    <span>{{ r.sector }}</span>
                    <span class="pt-status">{{ r.status }}</span>
                  </div>
                }
              </div>

              <footer class="preview-foot">
                <span class="mono muted">Showing 5 of 2,847 rows</span>
                <div class="import-actions">
                  <button class="pill" (click)="importStep.set(1)">← Back</button>
                  <button class="pill primary" (click)="runImport()">
                    {{ importing() ? '⟳ Importing ' + importProgress() + '%' : '✓ Import 2,847 soldiers' }}
                  </button>
                </div>
              </footer>

              @if (importing()) {
                <div class="import-progress">
                  <div class="ip-fill" [style.width.%]="importProgress()"></div>
                </div>
              }
            </section>
          }
        </div>
      }

      <!-- ============== EXPORT ============== -->
      @else if (active() === 'export') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Export Data</h3>
              <p>Download personnel data in your preferred format</p>
            </div>
          </header>

          <div class="export-grid">
            @for (f of exportFormats; track f.id) {
              <button class="export-card" (click)="toast('📥 Exported as ' + f.label)">
                <span class="exp-icon">{{ f.icon }}</span>
                <b>{{ f.label }}</b>
                <small>{{ f.desc }}</small>
                <span class="exp-size mono">{{ f.size }}</span>
              </button>
            }
          </div>

          <section class="export-filters">
            <h4>Filters</h4>
            <div class="exf-row">
              <label class="exf">
                <span>Status</span>
                <select><option>All</option><option>Active</option><option>Transfer</option></select>
              </label>
              <label class="exf">
                <span>Sector</span>
                <select><option>All</option><option>Cairo</option><option>Alex</option></select>
              </label>
              <label class="exf">
                <span>Date range</span>
                <select><option>All time</option><option>Last year</option><option>Custom</option></select>
              </label>
            </div>
          </section>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .muted { color: var(--label-2); }

    .view { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

    /* ========== KPI ROW ========== */
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
    .kpi {
      padding: 16px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      border-left: 3px solid var(--c);
      cursor: pointer;
      transition: all var(--t-base) var(--ease-spring);
    }
    .kpi:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .kpi-head { display: flex; justify-content: space-between; align-items: center;
                margin-bottom: 8px; }
    .kpi-icon { font-size: 18px; }
    .kpi-trend { font-size: 10px; font-weight: 700; }
    .kpi-trend.up { color: #34c759; }
    .kpi-trend.down { color: #ff9500; }
    .kpi-val { display: block; font-size: var(--fs-2xl); font-weight: 800;
               letter-spacing: -0.03em; line-height: 1;
               font-variant-numeric: tabular-nums; }
    .kpi-label { display: block; font-size: var(--fs-2xs); color: var(--label-2);
                 text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;
                 margin-top: 4px; }
    .kpi-bar { height: 3px; background: var(--bg-fill-2); border-radius: var(--r-pill);
               margin-top: 10px; overflow: hidden; }
    .kpi-fill { height: 100%; background: var(--c); border-radius: var(--r-pill);
                transition: width 600ms var(--ease-out); }

    /* ========== FILTER BAR ========== */
    .filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .filter-tabs { display: flex; gap: 4px; padding: 4px; background: var(--bg-fill-2);
                   border-radius: var(--r-sm); flex-wrap: wrap; }
    .ftab {
      padding: 7px 12px;
      border-radius: calc(var(--r-sm) - 4px);
      font-size: var(--fs-xs);
      font-weight: 500;
      color: var(--label-2);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all var(--t-base) var(--ease-smooth);
    }
    .ftab:hover { color: var(--label); }
    .ftab.active {
      background: var(--bg-surface-solid);
      color: var(--label);
      box-shadow: var(--shadow-xs);
      font-weight: 600;
    }
    .ftab-count {
      background: var(--bg-fill-2);
      padding: 1px 7px;
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .ftab.active .ftab-count { background: var(--accent-soft); color: var(--accent); }

    .view-toggle { display: flex; gap: 2px; padding: 3px; background: var(--bg-fill-2);
                   border-radius: var(--r-sm); }
    .vt {
      width: 30px; height: 30px;
      display: grid; place-items: center;
      border-radius: calc(var(--r-sm) - 4px);
      color: var(--label-2);
      font-size: 13px;
      transition: all var(--t-fast);
    }
    .vt:hover { color: var(--label); }
    .vt.active { background: var(--bg-surface-solid); color: var(--label);
                 box-shadow: var(--shadow-xs); }

    /* ========== TABLE ========== */
    .table-wrap {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
    }
    .thead, .trow {
      display: grid;
      grid-template-columns: 36px 90px 1.6fr 80px 1.1fr 140px 80px 100px 100px;
      gap: 12px;
      padding: 12px 16px;
      align-items: center;
      font-size: var(--fs-xs);
    }
    .thead {
      background: var(--bg-fill-2);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--label-2);
      font-weight: 700;
    }
    .trow {
      border-top: 0.5px solid var(--separator);
      cursor: pointer;
      transition: background var(--t-fast);
      animation: rowIn 260ms var(--ease-out);
    }
    @keyframes rowIn {
      from { opacity: 0; transform: translateY(-2px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .trow:hover { background: var(--bg-hover); }
    .trow.selected { background: var(--bg-selected); }
    .sortable { cursor: pointer; user-select: none; }
    .sortable:hover { color: var(--accent); }
    .check { display: grid; place-items: center; }
    .check input { accent-color: var(--accent); cursor: pointer; }
    .name-cell { display: flex; align-items: center; gap: 10px; }
    .avatar-s {
      width: 28px; height: 28px;
      display: grid; place-items: center;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: 50%;
      font-size: 11px;
      font-weight: 800;
      flex-shrink: 0;
    }
    .name-cell b { font-size: var(--fs-xs); font-weight: 600; }
    .sector-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 9px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 600;
      color: var(--label-2);
    }
    .st {
      padding: 3px 9px;
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      text-align: center;
      display: inline-block;
    }
    .st[data-s='Active']   { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='Transfer'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='Leave']    { background: var(--bg-fill-2); color: var(--label-2); }
    .st[data-s='Training'] { background: var(--accent-soft); color: var(--accent); }

    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; }
    .row-action {
      width: 28px; height: 28px;
      display: grid; place-items: center;
      border-radius: var(--r-xs);
      color: var(--label-3);
      font-size: 13px;
      transition: all var(--t-fast);
    }
    .row-action:hover { background: var(--bg-fill-2); color: var(--label); }
    .row-action.danger:hover { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

    .empty-state {
      padding: 60px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .empty-state span { font-size: 40px; opacity: 0.4; }
    .empty-state b { font-size: var(--fs-base); }
    .empty-state small { font-size: var(--fs-xs); color: var(--label-2); }

    /* ========== PAGINATION ========== */
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 14px 4px;
      flex-wrap: wrap;
    }
    .page-info { font-size: var(--fs-2xs); color: var(--label-2);
                 font-variant-numeric: tabular-nums; }
    .page-controls { display: flex; gap: 4px; }
    .pg-btn {
      min-width: 32px; height: 32px;
      padding: 0 10px;
      display: grid; place-items: center;
      border-radius: var(--r-sm);
      background: var(--bg-fill-2);
      color: var(--label-2);
      font-size: var(--fs-xs);
      font-weight: 600;
      transition: all var(--t-fast);
    }
    .pg-btn:hover:not(:disabled) { background: var(--bg-fill-3); color: var(--label); }
    .pg-btn.active { background: var(--accent); color: var(--accent-contrast); }
    .pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ========== CARDS ========== */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }
    .soldier-card {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      padding: 16px;
      cursor: pointer;
      transition: all var(--t-base) var(--ease-spring);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .soldier-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md);
                          border-color: var(--accent); }
    .sc-head { display: flex; align-items: center; gap: 10px; }
    .sc-avatar {
      width: 44px; height: 44px;
      display: grid; place-items: center;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: 50%;
      font-size: 15px;
      font-weight: 800;
    }
    .sc-name { flex: 1; min-width: 0; }
    .sc-name b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .sc-name small { font-size: 10px; color: var(--label-2); }
    .sc-body { display: flex; flex-direction: column; gap: 6px; }
    .sc-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--fs-xs);
      padding: 5px 0;
      border-bottom: 0.5px solid var(--separator);
    }
    .sc-row:last-child { border-bottom: 0; }
    .sc-row span { color: var(--label-2); }
    .sc-row b { font-weight: 600; }
    .sc-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 0.5px solid var(--separator);
    }
    .sc-missions { font-size: 10px; color: var(--label-2); font-weight: 600; }
    .sc-open { font-size: 10px; color: var(--accent); font-weight: 700; }

    /* ========== BULK BAR ========== */
    .bulk-bar {
      position: sticky;
      bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 12px 18px;
      background: var(--bg-elevated);
      backdrop-filter: var(--blur-thick);
      -webkit-backdrop-filter: var(--blur-thick);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-pill);
      box-shadow: var(--shadow-lg);
      animation: bulkIn 280ms var(--ease-spring);
      z-index: 5;
    }
    @keyframes bulkIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .bulk-count {
      font-size: var(--fs-xs);
      font-weight: 700;
      color: var(--accent);
      padding: 4px 12px;
      background: var(--accent-soft);
      border-radius: var(--r-pill);
    }
    .bulk-actions { display: flex; gap: 6px; }
    .bulk-btn {
      padding: 7px 14px;
      background: var(--bg-fill-2);
      color: var(--label);
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-weight: 600;
      transition: all var(--t-fast);
    }
    .bulk-btn:hover { background: var(--bg-fill-3); }
    .bulk-btn.danger { background: rgba(255, 59, 48, 0.12); color: #ff3b30; }
    .bulk-btn.danger:hover { background: rgba(255, 59, 48, 0.2); }
    .bulk-btn.ghost { background: transparent; padding: 7px 10px; }

    /* ========== DETAIL VIEW ========== */
    .detail-view { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .back-btn {
      align-self: flex-start;
      padding: 6px 12px;
      border-radius: var(--r-pill);
      background: var(--bg-fill-2);
      color: var(--label-2);
      font-size: var(--fs-xs);
      font-weight: 600;
    }
    .back-btn:hover { background: var(--bg-fill-3); color: var(--label); }

    .dv-hero {
      display: flex;
      gap: 20px;
      align-items: center;
      padding: 24px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
      flex-wrap: wrap;
    }
    .dv-avatar {
      width: 80px; height: 80px;
      display: grid; place-items: center;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: 50%;
      font-size: 28px;
      font-weight: 800;
    }
    .dv-info { flex: 1; min-width: 200px; }
    .dv-info h2 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .dv-sub { font-size: var(--fs-sm); color: var(--accent); font-weight: 600; margin: 4px 0; }
    .dv-meta { display: flex; gap: 8px; align-items: center; font-size: var(--fs-xs);
               color: var(--label-2); flex-wrap: wrap; }
    .dv-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    .pill {
      padding: 7px 14px;
      background: var(--bg-fill-2);
      color: var(--label);
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-weight: 600;
      transition: all var(--t-fast);
    }
    .pill:hover { background: var(--bg-fill-3); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }

    .dv-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 720px) { .dv-stats { grid-template-columns: repeat(2, 1fr); } }
    .dvs {
      padding: 16px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .dvs-icon { font-size: 20px; margin-bottom: 4px; }
    .dvs b { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em;
             font-variant-numeric: tabular-nums; }
    .dvs small { font-size: var(--fs-2xs); color: var(--label-2);
                 text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    .dv-tabs {
      display: flex;
      gap: 4px;
      padding: 4px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      overflow-x: auto;
    }
    .dv-tab {
      padding: 8px 14px;
      border-radius: calc(var(--r-sm) - 4px);
      font-size: var(--fs-xs);
      font-weight: 500;
      color: var(--label-2);
      white-space: nowrap;
      transition: all var(--t-base);
    }
    .dv-tab.active {
      background: var(--bg-surface-solid);
      color: var(--label);
      box-shadow: var(--shadow-xs);
      font-weight: 600;
    }

    .dv-panel { animation: fadeIn 260ms var(--ease-out); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .dv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 720px) { .dv-grid { grid-template-columns: 1fr; } }

    .dv-card {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .dv-card h4 { font-size: var(--fs-sm); font-weight: 700; margin-bottom: 14px; }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 0.5px solid var(--separator);
      font-size: var(--fs-xs);
    }
    .info-row:last-child { border-bottom: 0; }
    .info-row span { color: var(--label-2); }
    .info-row b { font-weight: 600; }

    .mission-row, .training-row, .doc-row {
      display: grid;
      grid-template-columns: 36px 1fr auto auto;
      gap: 12px;
      align-items: center;
      padding: 12px 0;
      border-bottom: 0.5px solid var(--separator);
    }
    .mission-row:last-child, .training-row:last-child, .doc-row:last-child { border-bottom: 0; }
    .m-icon, .t-icon, .doc-icon { font-size: 20px; text-align: center; }
    .m-info b, .t-info b, .doc-info b { font-size: var(--fs-xs); font-weight: 600; display: block; }
    .m-info small, .t-info small, .doc-info small { font-size: 10px; color: var(--label-2); }
    .m-date, .t-date { font-size: 10px; color: var(--label-3); }
    .m-status {
      padding: 3px 9px;
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .m-status[data-s='done'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .m-status[data-s='active'] { background: var(--accent-soft); color: var(--accent); }
    .t-score { text-align: right; }
    .t-score b { font-size: var(--fs-sm); font-weight: 800; color: #34c759; display: block;
                 font-variant-numeric: tabular-nums; }
    .t-score small { font-size: 9px; color: var(--label-3); text-transform: uppercase;
                     letter-spacing: 0.06em; font-weight: 700; }
    .doc-btn {
      width: 30px; height: 30px;
      display: grid; place-items: center;
      border-radius: var(--r-xs);
      background: var(--bg-fill-2);
      color: var(--label);
      font-weight: 700;
    }
    .doc-btn:hover { background: var(--accent-soft); color: var(--accent); }

    .timeline { display: flex; flex-direction: column; gap: 16px; position: relative; padding: 8px 0; }
    .tl-item {
      display: grid;
      grid-template-columns: 20px 1fr auto;
      gap: 14px;
      align-items: flex-start;
      position: relative;
    }
    .tl-item::before {
      content: '';
      position: absolute;
      left: 9px; top: 20px; bottom: -16px;
      width: 1.5px;
      background: var(--separator);
    }
    .tl-item:last-child::before { display: none; }
    .tl-dot {
      width: 20px; height: 20px;
      background: var(--bg-fill-3);
      border-radius: 50%;
      border: 3px solid var(--bg-surface-solid);
      box-shadow: 0 0 0 1.5px var(--separator);
      position: relative;
      z-index: 1;
    }
    .tl-dot.active { background: var(--accent); box-shadow: 0 0 0 1.5px var(--accent); }
    .tl-body b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .tl-body small { font-size: 10px; color: var(--label-2); }
    .tl-date { font-size: 10px; color: var(--label-3); }

    /* ========== DISTRIBUTION ========== */
    .view-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
    .view-head h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .view-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }

    .sector-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 14px;
    }
    .sec-card {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      cursor: pointer;
      transition: all var(--t-base) var(--ease-spring);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .sec-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md);
                      border-color: var(--accent); }
    .sec-card header { display: flex; justify-content: space-between; align-items: flex-start; }
    .sec-card header b { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .sec-card header small { font-size: var(--fs-2xs); color: var(--label-2); display: block;
                             margin-top: 2px; }
    .sec-total { font-size: var(--fs-xl); font-weight: 800; color: var(--accent);
                 font-variant-numeric: tabular-nums; }

    .sec-breakdown { display: flex; flex-direction: column; gap: 8px; }
    .sb-row { display: grid; grid-template-columns: 8px 1fr auto; gap: 10px;
              align-items: center; font-size: var(--fs-xs); }
    .sb-dot { width: 8px; height: 8px; border-radius: 50%; }
    .sb-label { color: var(--label-2); }
    .sb-val { font-weight: 700; font-variant-numeric: tabular-nums; }

    .sec-bar {
      display: flex;
      height: 10px;
      border-radius: var(--r-pill);
      overflow: hidden;
      gap: 1px;
    }
    .sb-seg { transition: all var(--t-base); }
    .sb-seg:hover { filter: brightness(1.2); }

    .sec-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--fs-2xs);
      color: var(--label-2);
      padding-top: 12px;
      border-top: 0.5px solid var(--separator);
    }
    .readiness-bar {
      width: 80px;
      height: 4px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      overflow: hidden;
    }
    .readiness-fill {
      display: block;
      height: 100%;
      background: #34c759;
      border-radius: var(--r-pill);
    }

    .chart-card {
      padding: 24px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .chart-card header { display: flex; justify-content: space-between; align-items: baseline;
                         margin-bottom: 20px; }
    .chart-card h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .chart-bars { display: flex; gap: 12px; height: 200px; align-items: flex-end; }
    .cb-wrap {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      position: relative;
      cursor: pointer;
    }
    .cb {
      width: 100%;
      background: var(--accent);
      border-radius: var(--r-sm) var(--r-sm) 4px 4px;
      transition: all var(--t-base);
      animation: grow 500ms var(--ease-spring);
      opacity: 0.85;
    }
    .cb.active { opacity: 1; transform: translateY(-3px); }
    @keyframes grow { from { height: 0; } }
    .cb-tip {
      position: absolute;
      top: -24px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--accent);
      color: var(--accent-contrast);
      padding: 3px 10px;
      border-radius: var(--r-xs);
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
    }
    .cb-label { font-size: 10px; color: var(--label-2); font-weight: 600; }

    /* ========== IMPORT ========== */
    .drop-zone {
      padding: 60px 24px;
      background: var(--bg-surface-solid);
      border: 2px dashed var(--separator);
      border-radius: var(--r-lg);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: all var(--t-base);
    }
    .drop-zone:hover { border-color: var(--accent); background: var(--accent-soft); }
    .dz-icon { font-size: 56px; }
    .drop-zone b { font-size: var(--fs-lg); font-weight: 700; }
    .drop-zone small { font-size: var(--fs-sm); color: var(--label-2); }
    .dz-formats { display: flex; gap: 6px; margin-top: 8px; }
    .fmt {
      padding: 4px 12px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-family: var(--sf-mono);
      font-weight: 700;
      color: var(--label-2);
    }

    .template-card {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .template-card b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .template-card small { font-size: var(--fs-2xs); color: var(--label-2); }

    .preview-card {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
    }
    .preview-card > header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding-bottom: 16px;
      border-bottom: 0.5px solid var(--separator);
      margin-bottom: 16px;
    }
    .preview-card > header b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .preview-card > header small { font-size: var(--fs-2xs); color: var(--label-2); }
    .badge-ok {
      padding: 4px 12px;
      background: rgba(52, 199, 89, 0.15);
      color: #34c759;
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
    }

    .preview-table { margin-bottom: 16px; }
    .pt-row {
      display: grid;
      grid-template-columns: 90px 1.5fr 80px 100px 100px;
      gap: 14px;
      padding: 10px 0;
      border-bottom: 0.5px solid var(--separator);
      font-size: var(--fs-xs);
      align-items: center;
    }
    .pt-row.head {
      padding: 10px 0;
      border-bottom: 1px solid var(--separator);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--label-2);
      font-weight: 700;
    }
    .pt-status {
      padding: 2px 8px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 600;
      text-align: center;
    }

    .preview-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 0.5px solid var(--separator);
      flex-wrap: wrap;
      gap: 12px;
    }
    .import-actions { display: flex; gap: 8px; }

    .import-progress {
      height: 4px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      margin-top: 16px;
      overflow: hidden;
    }
    .ip-fill {
      height: 100%;
      background: var(--accent);
      border-radius: var(--r-pill);
      transition: width 200ms;
    }

    /* ========== EXPORT ========== */
    .export-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 14px;
    }
    .export-card {
      padding: 24px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      display: flex;
      flex-direction: column;
      gap: 8px;
      text-align: left;
      transition: all var(--t-base) var(--ease-spring);
      cursor: pointer;
    }
    .export-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md);
                         border-color: var(--accent); }
    .exp-icon { font-size: 32px; }
    .export-card b { font-size: var(--fs-base); font-weight: 700; }
    .export-card small { font-size: var(--fs-2xs); color: var(--label-2); line-height: 1.5; }
    .exp-size { font-size: 10px; color: var(--accent); font-weight: 700; margin-top: 6px;
                padding-top: 8px; border-top: 0.5px solid var(--separator); }

    .export-filters {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .export-filters h4 { font-size: var(--fs-sm); font-weight: 700; margin-bottom: 14px; }
    .exf-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    @media (max-width: 720px) { .exf-row { grid-template-columns: 1fr; } }
    .exf { display: flex; flex-direction: column; gap: 6px; }
    .exf span { font-size: var(--fs-2xs); font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.06em; color: var(--label-3); }
    .exf select {
      padding: 9px 12px;
      background: var(--bg-input);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-sm);
      font-size: var(--fs-sm);
      color: var(--label);
      outline: none;
      font-family: inherit;
    }
    .exf select:focus { border-color: var(--accent); }
  `],
})
export class EnlistedPreviewComponent {
  readonly Math = Math;

  /* ====== NAV & ACTIVE ====== */
  readonly active = signal('registry');

  readonly nav = computed<PreviewNavItem[]>(() => [
    { id: 'registry', label: 'Registry', icon: '📋', badge: this.filtered().length, group: 'Data' },
    { id: 'distribution', label: 'Distribution', icon: '🗺', group: 'Data' },
    { id: 'import', label: 'Bulk Import', icon: '📥', group: 'Operations' },
    { id: 'export', label: 'Export', icon: '📤', group: 'Operations' },
  ]);

  /* ====== NOTIFICATIONS ====== */
  readonly notifs = signal([
    { id: 1, icon: '⚠️', title: 'Transfer pending', body: '3 soldiers awaiting approval', time: '2m' },
    { id: 2, icon: '✅', title: 'Import completed', body: '2,847 records added', time: '1h' },
    { id: 3, icon: '📊', title: 'Q4 report ready', body: 'Sector B summary', time: '3h' },
  ]);

  /* ====== TOOLBAR ====== */
  readonly toolbar = computed<ToolbarAction[]>(() => {
    if (this.active() === 'registry') {
      return [
        { id: 'refresh', label: 'Refresh', icon: '⟳', action: () => this.toast('✓ Data refreshed') },
        { id: 'import', label: 'Import', icon: '📥', action: () => this.active.set('import') },
        { id: 'add', label: 'Add soldier', icon: '＋', primary: true, action: () => this.addSoldier() },
      ];
    }
    if (this.active() === 'import') {
      return [
        { id: 'back', label: 'Back', icon: '←', action: () => this.importStep.set(1) },
      ];
    }
    if (this.active() === 'export') {
      return [
        { id: 'all', label: 'Export all', icon: '📤', primary: true, action: () => this.toast('✓ Exported all') },
      ];
    }
    return [];
  });

  /* ====== DATA ====== */
  readonly soldiers = signal<Soldier[]>([
    { id: 'M-001', name: 'Ahmed Mohamed Kamal', sector: 'Cairo', unit: 'Battalion 3', status: 'Active', rank: 'Sgt.', enlisted: '2022-03', bloodType: 'O+', phone: '+20 100 111 0001', lastCheckIn: '2h ago', missions: 42 },
    { id: 'M-002', name: 'Youssef Khaled Adel', sector: 'Giza', unit: 'Battalion 5', status: 'Active', rank: 'Cpl.', enlisted: '2022-09', bloodType: 'A+', phone: '+20 100 111 0002', lastCheckIn: '5h ago', missions: 38 },
    { id: 'M-003', name: 'Omar Samir Hassan', sector: 'Alex', unit: 'Battalion 1', status: 'Transfer', rank: 'Pvt.', enlisted: '2023-01', bloodType: 'B+', phone: '+20 100 111 0003', lastCheckIn: '1d ago', missions: 24 },
    { id: 'M-004', name: 'Karim Hany Tarek', sector: 'Luxor', unit: 'Battalion 7', status: 'Active', rank: 'Sgt.', enlisted: '2022-06', bloodType: 'AB+', phone: '+20 100 111 0004', lastCheckIn: '3h ago', missions: 51 },
    { id: 'M-005', name: 'Tarek Nabil Sami', sector: 'Aswan', unit: 'Battalion 2', status: 'Training', rank: 'Pvt.', enlisted: '2023-04', bloodType: 'O-', phone: '+20 100 111 0005', lastCheckIn: '30m ago', missions: 12 },
    { id: 'M-006', name: 'Hassan Mohamed Ali', sector: 'Cairo', unit: 'Battalion 3', status: 'Leave', rank: 'Cpl.', enlisted: '2022-11', bloodType: 'A-', phone: '+20 100 111 0006', lastCheckIn: '2d ago', missions: 33 },
    { id: 'M-007', name: 'Sami Ibrahim Adel', sector: 'Delta', unit: 'Battalion 6', status: 'Active', rank: 'Sgt.', enlisted: '2022-07', bloodType: 'B+', phone: '+20 100 111 0007', lastCheckIn: '1h ago', missions: 47 },
    { id: 'M-008', name: 'Mostafa Ayman Hosny', sector: 'Cairo', unit: 'Battalion 4', status: 'Active', rank: 'Maj.', enlisted: '2021-05', bloodType: 'O+', phone: '+20 100 111 0008', lastCheckIn: '15m ago', missions: 68 },
    { id: 'M-009', name: 'Amr Hossam Salah', sector: 'Giza', unit: 'Battalion 5', status: 'Active', rank: 'Cpl.', enlisted: '2022-10', bloodType: 'A+', phone: '+20 100 111 0009', lastCheckIn: '4h ago', missions: 29 },
    { id: 'M-010', name: 'Mahmoud Reda Fathy', sector: 'Alex', unit: 'Battalion 1', status: 'Transfer', rank: 'Pvt.', enlisted: '2023-02', bloodType: 'AB-', phone: '+20 100 111 0010', lastCheckIn: '6h ago', missions: 18 },
  ]);

  /* ====== FILTERS ====== */
  readonly statusFilter = signal<string>('all');
  readonly viewMode = signal<'table' | 'cards'>('table');

  readonly statusFilters = [
    { id: 'all', label: 'All', icon: '📁' },
    { id: 'Active', label: 'Active', icon: '✅' },
    { id: 'Transfer', label: 'Transfer', icon: '🔀' },
    { id: 'Leave', label: 'Leave', icon: '🏖' },
    { id: 'Training', label: 'Training', icon: '🎓' },
  ];

  readonly sortKey = signal<keyof Soldier>('id');
  readonly sortDir = signal<1 | -1>(1);

  readonly filtered = computed(() => {
    const f = this.statusFilter();
    let list = this.soldiers();
    if (f !== 'all') list = list.filter(s => s.status === f);
    const key = this.sortKey();
    const dir = this.sortDir();
    return [...list].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  });

  /* ====== PAGINATION ====== */
  readonly pageSize = 6;
  readonly page = signal(1);
  readonly lastPage = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  readonly paged = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.lastPage() }, (_, i) => i + 1)
  );

  /* ====== SELECTION ====== */
  readonly selectedIds = signal<string[]>([]);
  toggleSelect(id: string): void {
    this.selectedIds.update(list =>
      list.includes(id) ? list.filter(x => x !== id) : [...list, id]
    );
  }

  /* ====== DETAIL ====== */
  readonly detailSoldier = computed(() =>
    this.soldiers().find(s => s.id === this.selectedIds()[0])
  );
  readonly detailTab = signal('overview');

  readonly detailTabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'missions', label: 'Missions', icon: '🎯' },
    { id: 'training', label: 'Training', icon: '🎓' },
    { id: 'timeline', label: 'Timeline', icon: '📅' },
    { id: 'documents', label: 'Documents', icon: '📄' },
  ];

  openDetail(id: string): void {
    this.selectedIds.set([id]);
    this.active.set('detail');
    this.detailTab.set('overview');
  }

  /* ====== KPIs ====== */
  readonly kpis = computed(() => {
    const all = this.soldiers();
    const total = all.length;
    return [
      { icon: '👥', label: 'Total personnel', value: total, delta: 4, up: true, color: '#007aff', pct: 100, filterKey: 'all' },
      { icon: '✅', label: 'Active duty', value: all.filter(s => s.status === 'Active').length, delta: 8, up: true, color: '#34c759', pct: 78, filterKey: 'Active' },
      { icon: '🔀', label: 'Pending transfer', value: all.filter(s => s.status === 'Transfer').length, delta: 2, up: false, color: '#ff9500', pct: 22, filterKey: 'Transfer' },
      { icon: '🎓', label: 'In training', value: all.filter(s => s.status === 'Training').length, delta: 15, up: true, color: '#af52de', pct: 14, filterKey: 'Training' },
    ];
  });

  /* ====== SECTORS ====== */
  readonly sectorStats = [
    {
      name: 'Cairo', total: 412, units: 8, readiness: 92,
      breakdown: [
        { label: 'Active', count: 320, pct: 78, color: '#34c759' },
        { label: 'Transfer', count: 42, pct: 10, color: '#ff9500' },
        { label: 'Leave', count: 50, pct: 12, color: '#8e8e93' },
      ]
    },
    {
      name: 'Alexandria', total: 287, units: 6, readiness: 87,
      breakdown: [
        { label: 'Active', count: 210, pct: 73, color: '#34c759' },
        { label: 'Transfer', count: 47, pct: 16, color: '#ff9500' },
        { label: 'Leave', count: 30, pct: 11, color: '#8e8e93' },
      ]
    },
    {
      name: 'Delta', total: 189, units: 4, readiness: 90,
      breakdown: [
        { label: 'Active', count: 152, pct: 80, color: '#34c759' },
        { label: 'Transfer', count: 22, pct: 12, color: '#ff9500' },
        { label: 'Leave', count: 15, pct: 8, color: '#8e8e93' },
      ]
    },
    {
      name: 'Upper Egypt', total: 245, units: 5, readiness: 84,
      breakdown: [
        { label: 'Active', count: 190, pct: 78, color: '#34c759' },
        { label: 'Transfer', count: 38, pct: 15, color: '#ff9500' },
        { label: 'Leave', count: 17, pct: 7, color: '#8e8e93' },
      ]
    },
  ];

  readonly totalPersonnel = computed(() =>
    this.sectorStats.reduce((sum, s) => sum + s.total, 0)
  );
  readonly maxSectorTotal = computed(() =>
    Math.max(...this.sectorStats.map(s => s.total))
  );
  readonly hoverSector = signal('');

  /* ====== IMPORT ====== */
  readonly importStep = signal<1 | 2>(1);
  readonly importing = signal(false);
  readonly importProgress = signal(0);

  readonly importPreview = [
    { id: 'M-1001', name: 'Ali Mohamed', rank: 'Pvt.', sector: 'Cairo', status: 'Active' },
    { id: 'M-1002', name: 'Hassan Adel', rank: 'Cpl.', sector: 'Alex', status: 'Active' },
    { id: 'M-1003', name: 'Youssef Sami', rank: 'Sgt.', sector: 'Giza', status: 'Training' },
    { id: 'M-1004', name: 'Omar Khaled', rank: 'Pvt.', sector: 'Delta', status: 'Active' },
    { id: 'M-1005', name: 'Sami Tarek', rank: 'Cpl.', sector: 'Luxor', status: 'Transfer' },
  ];

  startImport(): void {
    this.importStep.set(2);
  }

  runImport(): void {
    if (this.importing()) return;
    this.importing.set(true);
    this.importProgress.set(0);
    const tick = setInterval(() => {
      const p = this.importProgress();
      if (p >= 100) {
        clearInterval(tick);
        this.importing.set(false);
        this.toast('✅ Imported 2,847 soldiers successfully');
        setTimeout(() => this.importStep.set(1), 1500);
        return;
      }
      this.importProgress.set(Math.min(p + 6, 100));
    }, 90);
  }

  /* ====== EXPORT ====== */
  readonly exportFormats = [
    { id: 'csv', icon: '📄', label: 'CSV', desc: 'Comma-separated — opens in Excel', size: '2.4 MB' },
    { id: 'xlsx', icon: '📊', label: 'XLSX', desc: 'Excel workbook with formatting', size: '3.1 MB' },
    { id: 'pdf', icon: '📕', label: 'PDF', desc: 'Print-ready formatted report', size: '1.8 MB' },
    { id: 'json', icon: '🔧', label: 'JSON', desc: 'Structured data for integrations', size: '920 KB' },
  ];

  /* ====== METHODS ====== */
  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n.charAt(0)).join('');
  }

  monthsSince(date: string): number {
    const [y, m] = date.split('-').map(Number);
    const now = new Date();
    return (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  }

  countByStatus(id: string): number {
    if (id === 'all') return this.soldiers().length;
    return this.soldiers().filter(s => s.status === id).length;
  }

  filterByStatus(key: string): void {
    this.statusFilter.set(key === 'all' ? 'all' : key);
    this.page.set(1);
  }

  sortBy(key: keyof Soldier): void {
    if (this.sortKey() === key) this.sortDir.update(d => d === 1 ? -1 : 1);
    else { this.sortKey.set(key); this.sortDir.set(1); }
  }
  sortIcon(key: string): string {
    return this.sortKey() === key ? (this.sortDir() === 1 ? '▲' : '▼') : '';
  }

  addSoldier(): void {
    const id = `M-${String(this.soldiers().length + 1).padStart(3, '0')}`;
    this.soldiers.update(list => [
      {
        id,
        name: 'New Soldier',
        sector: 'Cairo',
        unit: 'Battalion 3',
        status: 'Training',
        rank: 'Pvt.',
        enlisted: new Date().toISOString().slice(0, 7),
        bloodType: 'O+',
        phone: '+20 100 000 0000',
        lastCheckIn: 'just now',
        missions: 0,
      },
      ...list,
    ]);
    this.toast(`✓ Added ${id}`);
  }

  removeSoldier(id: string): void {
    this.soldiers.update(list => list.filter(s => s.id !== id));
    this.toast(`🗑 Removed ${id}`);
  }

  bulkAction(kind: string): void {
    const n = this.selectedIds().length;
    this.toast(`${kind === 'export' ? '📥 Exporting' : '🔀 Transferring'} ${n} soldier(s)`);
    if (kind === 'transfer') {
      this.soldiers.update(list => list.map(s =>
        this.selectedIds().includes(s.id) ? { ...s, status: 'Transfer' as const } : s
      ));
    }
    this.selectedIds.set([]);
  }

  bulkDelete(): void {
    const n = this.selectedIds().length;
    this.soldiers.update(list => list.filter(s => !this.selectedIds().includes(s.id)));
    this.selectedIds.set([]);
    this.toast(`🗑 Removed ${n} soldier(s)`);
  }

  missionHistory(s: Soldier) {
    const icons = ['🎯', '🚁', '🚢', '🛡', '⚡'];
    return Array.from({ length: Math.min(5, Math.max(1, Math.floor(s.missions / 10))) }, (_, i) => ({
      id: i,
      icon: icons[i % icons.length],
      title: `Operation ${['Delta', 'Storm', 'Eagle', 'Shield', 'Thunder'][i % 5]}`,
      desc: `${s.sector} · 48h · ${20 + i * 5} personnel`,
      date: `2024-${String(11 - i).padStart(2, '0')}-${10 + i}`,
      status: i === 0 ? 'active' : 'done',
    }));
  }

  training(s: Soldier) {
    return [
      { id: 1, icon: '🎓', name: 'Basic Infantry Course', provider: 'Military Academy', score: 94, date: '2022-06' },
      { id: 2, icon: '🎯', name: 'Advanced Marksmanship', provider: 'Sector B Training', score: 88, date: '2023-01' },
      { id: 3, icon: '⚡', name: 'Tactical Communications', provider: 'Signal Corps', score: 91, date: '2023-08' },
      { id: 4, icon: '🛡', name: 'First Aid & Combat Medic', provider: 'Medical Corps', score: 96, date: '2024-03' },
    ];
  }

  timeline(s: Soldier) {
    const startYear = parseInt(s.enlisted.split('-')[0]);
    return [
      { title: 'Enlisted', desc: 'Joined basic training camp', date: s.enlisted, active: false },
      { title: 'Completed basic training', desc: 'Assigned to ' + s.unit, date: `${startYear}-09`, active: false },
      { title: 'Promoted to ' + s.rank, desc: 'Recognized for service', date: `${startYear + 1}-03`, active: false },
      { title: 'Current assignment', desc: s.unit + ' · ' + s.sector, date: `${startYear + 2}-01`, active: true },
    ];
  }

  readonly documents = signal([
    { id: 1, icon: '📄', name: 'Enlistment Record', size: '240 KB', type: 'PDF' },
    { id: 2, icon: '📄', name: 'Medical Clearance', size: '180 KB', type: 'PDF' },
    { id: 3, icon: '📄', name: 'Training Certificates', size: '520 KB', type: 'PDF' },
    { id: 4, icon: '🖼', name: 'ID Photo', size: '95 KB', type: 'PNG' },
    { id: 5, icon: '📊', name: 'Service Record', size: '320 KB', type: 'XLSX' },
  ]);

  readonly toastMsg = signal('');
  toast(msg: string): void {
    this.toastMsg.set(msg);
    setTimeout(() => this.toastMsg.set(''), 2400);
  }
}