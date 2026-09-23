import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ENLISTED_SECTORS, ENLISTED_UNITS, EnlistedSoldier, ENLISTED_SOLDIERS, TrainingRecord, TRAINING_RECORDS, ImportBatch, IMPORT_BATCHES, ActivityLogEntry, ACTIVITY_LOG, EnlistedSector, EnlistedUnit, RANK_FILTERS, SPECIALITY_FILTERS } from '../../../../data/enlisted.data';
import { DummyDataEditorComponent } from '../../shared/dummy-data-editor/dummy-data-editor';
import { PreviewShellComponent, PreviewNavItem, ToolbarAction, PreviewNotification } from '../../shared/preview-shell/preview-shell';


@Component({
  selector: 'app-enlisted-preview',
  standalone: true,
  imports: [PreviewShellComponent, FormsModule, DummyDataEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="📋"
      title="Enlisted Management"
      subtitle="FOE · {{ sectors.length }} sectors · {{ soldiers().length }} personnel"
      [nav]="nav()"
      [active]="active()"
      (activeChange)="active.set($any($event))"
      [toolbarActions]="toolbar()"
      [notifications]="notifs()"
      [searchPlaceholder]="searchPlaceholder()"
      (searchChange)="onSearch($event)"
    >
      <div class="preview-note">
        <app-dummy-data-editor projectId="enlisted" />
      </div>

      @if (active() === 'dashboard') {
        <div class="view">
          <div class="kpis">
            @for (k of kpis(); track k.label) {
              <article class="kpi" [style.--c]="k.color" (click)="k.action()">
                <div class="kpi-head">
                  <span class="kpi-icon">{{ k.icon }}</span>
                  @if (k.trend) {
                    <span class="kpi-trend" [class.up]="k.up" [class.down]="!k.up">{{ k.trend }}</span>
                  }
                </div>
                <b class="kpi-val">{{ k.value }}</b>
                <span class="kpi-label">{{ k.label }}</span>
                <div class="kpi-bar"><div class="kpi-fill" [style.width.%]="k.pct"></div></div>
              </article>
            }
          </div>

          <div class="grid-2">
            <section class="chart-card">
              <header>
                <div>
                  <h4>Enlistment trend — last 12 months</h4>
                  <span class="muted mono">Total: {{ soldiers().length }} personnel</span>
                </div>
              </header>
              <div class="chart-bars">
                @for (d of enlistmentData; track $index) {
                  <div class="bar-group" (mouseenter)="hoverBar.set($index)" (mouseleave)="hoverBar.set(-1)">
                    @if (hoverBar() === $index) {
                      <div class="bar-tip">{{ d.count }} new</div>
                    }
                    <div class="bar-seg" [style.height.%]="d.count * 3" style="background:var(--accent)"></div>
                    <span class="bar-label">{{ d.month }}</span>
                  </div>
                }
              </div>
            </section>

            <section class="chart-card">
              <header>
                <div>
                  <h4>Rank distribution</h4>
                  <span class="muted mono">{{ soldiers().length }} soldiers</span>
                </div>
              </header>
              <div class="rank-bars">
                @for (r of rankDistribution(); track r.rank) {
                  <div class="rank-row">
                    <span class="rank-name">{{ r.rank }}</span>
                    <div class="rank-bar"><div class="rank-fill" [style.width.%]="r.pct" [style.background]="r.color"></div></div>
                    <span class="rank-count mono">{{ r.count }}</span>
                  </div>
                }
              </div>
            </section>
          </div>

          <section class="live-feed">
            <header class="lf-head">
              <div>
                <h4>Recent activity</h4>
                <span class="muted">Latest personnel actions</span>
              </div>
              <button class="pill-sm" (click)="active.set('activity')">View all →</button>
            </header>
            <div class="lf-list">
              @for (a of activity().slice(0, 6); track a.id) {
                <div class="lf-item" (click)="openSoldier(a.soldierId)">
                  <span class="lf-icon" [style.background]="a.color + '22'" [style.color]="a.color">{{ a.icon }}</span>
                  <div class="lf-body">
                    <div class="lf-title-row">
                      <b>{{ soldierName(a.soldierId) }}</b>
                      <span class="lf-action">{{ a.action }}</span>
                    </div>
                    <p>{{ a.description }}</p>
                    <div class="lf-meta">
                      <span>👤 {{ a.by }}</span>
                      <span>🕐 {{ timeAgo(a.timestamp) }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>

          <div class="grid-2">
            <section class="info-card">
              <header><h4>Sector readiness</h4></header>
              @for (s of sectors.slice(0, 5); track s.id) {
                <div class="sector-row" (click)="openSector(s.id)">
                  <span class="sr-icon" [style.background]="s.color + '22'" [style.color]="s.color">{{ s.icon }}</span>
                  <div class="sr-info">
                    <b>{{ s.name }}</b>
                    <small class="mono">{{ s.code }} · {{ s.strength }} / {{ s.capacity }}</small>
                  </div>
                  <div class="sr-bar-mini">
                    <div class="sr-fill" [style.width.%]="s.readiness" [style.background]="readinessColor(s.readiness)"></div>
                  </div>
                  <span class="sr-pct mono">{{ s.readiness }}%</span>
                </div>
              }
            </section>

            <section class="info-card">
              <header><h4>Training progress</h4></header>
              @for (t of training().slice(0, 5); track t.id) {
                <div class="training-row" (click)="openTraining(t.id)">
                  <span class="tr-status" [attr.data-s]="t.status">{{ t.status.charAt(0).toUpperCase() }}</span>
                  <div class="tr-info">
                    <b>{{ t.title }}</b>
                    <small>{{ t.location }} · {{ t.duration }}</small>
                  </div>
                  <span class="tr-count mono">{{ t.completed }}/{{ t.capacity }}</span>
                </div>
              }
            </section>
          </div>
        </div>
      }

      @else if (active() === 'registry') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Personnel Registry</h3>
              <p>{{ filteredSoldiers().length }} of {{ soldiers().length }} personnel</p>
            </div>
            <div class="view-toggle">
              <button class="vt" [class.active]="registryView() === 'table'" (click)="registryView.set('table')" title="Table">☰</button>
              <button class="vt" [class.active]="registryView() === 'cards'" (click)="registryView.set('cards')" title="Cards">▦</button>
            </div>
          </header>

          <div class="filter-row">
            <div class="filter-tabs">
              @for (f of statusFilters; track f.id) {
                <button class="ftab" [class.active]="statusFilter() === f.id" (click)="statusFilter.set(f.id)">
                  <span>{{ f.icon }}</span>
                  <span>{{ f.label }}</span>
                  <span class="ftab-count">{{ countByStatus(f.id) }}</span>
                </button>
              }
            </div>
            <div class="chip-filters">
              <select class="sel" [ngModel]="rankFilter()" (ngModelChange)="rankFilter.set($event)">
                @for (r of rankFilters; track r) {
                  <option [value]="r">{{ r === 'all' ? 'All ranks' : r }}</option>
                }
              </select>
              <select class="sel" [ngModel]="sectorFilter()" (ngModelChange)="sectorFilter.set($event)">
                <option value="all">All sectors</option>
                @for (s of sectors; track s.id) {
                  <option [value]="s.id">{{ s.icon }} {{ s.name }}</option>
                }
              </select>
              <select class="sel" [ngModel]="specialityFilter()" (ngModelChange)="specialityFilter.set($event)">
                @for (sp of specialityFilters; track sp.id) {
                  <option [value]="sp.id">{{ sp.icon }} {{ sp.label }}</option>
                }
              </select>
            </div>
          </div>

          @if (registryView() === 'table') {
            <div class="table-wrap">
              <header class="thead">
                <span class="th check">
                  <input type="checkbox" [checked]="allSelected()" (change)="toggleSelectAll()" />
                </span>
                <span class="th sortable" (click)="sortBy('id')">ID {{ sortIcon('id') }}</span>
                <span class="th sortable" (click)="sortBy('name')">Name {{ sortIcon('name') }}</span>
                <span class="th sortable" (click)="sortBy('rank')">Rank {{ sortIcon('rank') }}</span>
                <span class="th">Unit</span>
                <span class="th sortable" (click)="sortBy('sectorId')">Sector {{ sortIcon('sectorId') }}</span>
                <span class="th sortable" (click)="sortBy('yearsOfService')">Years {{ sortIcon('yearsOfService') }}</span>
                <span class="th">Status</span>
                <span class="th"></span>
              </header>

              @for (s of paged(); track s.id) {
                <div class="trow" [class.selected]="selectedIds().includes(s.id)" (click)="openSoldier(s.id)" (contextmenu)="onSoldierContext($event, s)">
                  <span class="td check">
                    <input type="checkbox" [checked]="selectedIds().includes(s.id)" (click)="$event.stopPropagation(); toggleSelect(s.id)" />
                  </span>
                  <span class="td mono">{{ s.id }}</span>
                  <span class="td name-cell">
                    <span class="avatar-m" [style.background]="sectorColor(s.sectorId) + '22'" [style.color]="sectorColor(s.sectorId)">
                      {{ initials(s.name) }}
                    </span>
                    <div>
                      <b>{{ s.name }}</b>
                      <small class="mono">{{ s.nationalId }}</small>
                    </div>
                  </span>
                  <span class="td">{{ s.rank }}</span>
                  <span class="td small">{{ unitName(s.unitId) }}</span>
                  <span class="td"><span class="sector-tag" [style.--c]="sectorColor(s.sectorId)">{{ sectorCode(s.sectorId) }}</span></span>
                  <span class="td mono">{{ s.yearsOfService }}y</span>
                  <span class="td"><span class="st" [attr.data-s]="s.status">{{ s.status }}</span></span>
                  <span class="td actions-cell">
                    <button class="row-action" title="View" (click)="$event.stopPropagation(); openSoldier(s.id)">👁</button>
                    <button class="row-action" title="Edit" (click)="$event.stopPropagation(); editSoldier(s)">✎</button>
                    <button class="row-action danger" title="Delete" (click)="$event.stopPropagation(); removeSoldier(s.id)">🗑</button>
                  </span>
                </div>
              } @empty {
                <div class="empty-mini">No soldiers match your filters</div>
              }
            </div>

            @if (filteredSoldiers().length > pageSize) {
              <footer class="pagination">
                <span class="page-info">
                  Showing {{ (page() - 1) * pageSize + 1 }}–{{ Math.min(page() * pageSize, filteredSoldiers().length) }}
                  of {{ filteredSoldiers().length }}
                </span>
                <div class="page-controls">
                  <button class="pg-btn" [disabled]="page() === 1" (click)="page.set(page() - 1)">‹ Prev</button>
                  @for (p of pageNumbers(); track p) {
                    <button class="pg-btn" [class.active]="page() === p" (click)="page.set(p)">{{ p }}</button>
                  }
                  <button class="pg-btn" [disabled]="page() === lastPage()" (click)="page.set(page() + 1)">Next ›</button>
                </div>
              </footer>
            }
          } @else {
            <div class="card-grid">
              @for (s of paged(); track s.id) {
                <article class="soldier-card" (click)="openSoldier(s.id)" (contextmenu)="onSoldierContext($event, s)">
                  <header class="sc-head">
                    <span class="sc-avatar" [style.background]="sectorColor(s.sectorId) + '22'" [style.color]="sectorColor(s.sectorId)">
                      {{ initials(s.name) }}
                    </span>
                    <div class="sc-info">
                      <b>{{ s.name }}</b>
                      <p class="sc-ar" dir="rtl">{{ s.nameAr }}</p>
                      <span class="mono sc-id">{{ s.id }}</span>
                    </div>
                    <span class="st" [attr.data-s]="s.status">{{ s.status }}</span>
                  </header>
                  <div class="sc-body">
                    <div class="sc-row"><span>🎖 Rank</span><b>{{ s.rank }}</b></div>
                    <div class="sc-row"><span>🏢 Unit</span><b>{{ unitName(s.unitId) }}</b></div>
                    <div class="sc-row"><span>📍 Sector</span><b>{{ sectorName(s.sectorId) }}</b></div>
                    <div class="sc-row"><span>🎯 Speciality</span><b>{{ s.speciality }}</b></div>
                    <div class="sc-row"><span>📅 Enlisted</span><b>{{ s.enlistedDate }}</b></div>
                  </div>
                  <footer class="sc-foot">
                    <span class="sc-stat">🎯 {{ s.missions }} missions</span>
                    <span class="sc-stat">🏅 {{ s.medals }} medals</span>
                  </footer>
                </article>
              }
            </div>
          }

          @if (selectedIds().length) {
            <div class="bulk-bar">
              <span class="bulk-count">{{ selectedIds().length }} selected</span>
              <div class="bulk-actions">
                <button class="bulk-btn" (click)="bulkAction('export')">📥 Export</button>
                <button class="bulk-btn" (click)="bulkAction('transfer')">🔀 Transfer</button>
                <button class="bulk-btn" (click)="bulkAction('promote')">⬆ Promote</button>
                <button class="bulk-btn danger" (click)="bulkDelete()">🗑 Delete</button>
                <button class="bulk-btn ghost" (click)="selectedIds.set([])">✕</button>
              </div>
            </div>
          }
        </div>
      }

      @else if (active() === 'distribution') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Sector Distribution</h3>
              <p>{{ sectors.length }} sectors · {{ totalStrength() }} total personnel</p>
            </div>
            <button class="pill" (click)="toast.info('Opening map view…')">🗺 Map view</button>
          </header>

          <div class="dist-stats">
            @for (s of sectors; track s.id) {
              <article class="dist-card" [style.--c]="s.color" (click)="openSector(s.id)">
                <header>
                  <span class="dc-icon" [style.background]="s.color + '22'" [style.color]="s.color">{{ s.icon }}</span>
                  <div>
                    <b>{{ s.name }}</b>
                    <small class="mono">{{ s.code }}</small>
                  </div>
                  <span class="dc-readiness">{{ s.readiness }}%</span>
                </header>
                <div class="dc-stats">
                  <div class="dc-stat">
                    <b>{{ s.strength }}</b>
                    <small>Personnel</small>
                  </div>
                  <div class="dc-stat">
                    <b>{{ unitsInSector(s.id).length }}</b>
                    <small>Units</small>
                  </div>
                  <div class="dc-stat">
                    <b>{{ soldiersInSector(s.id).length }}</b>
                    <small>Tracked</small>
                  </div>
                </div>
                <div class="dc-bar">
                  <div class="dc-fill" [style.width.%]="(s.strength / s.capacity) * 100" [style.background]="s.color"></div>
                </div>
                <footer class="dc-foot">
                  <span>Commander: {{ s.commander }}</span>
                  <span class="dc-open">Open →</span>
                </footer>
              </article>
            }
          </div>

          <section class="chart-card">
            <header>
              <div>
                <h4>Strength by sector</h4>
                <span class="muted">Personnel capacity utilization</span>
              </div>
            </header>
            <div class="sector-chart">
              @for (s of sectors; track s.id) {
                <div class="sector-row-lg" (click)="openSector(s.id)">
                  <span class="srl-name">{{ s.name }}</span>
                  <div class="srl-bar">
                    <div class="srl-fill" [style.width.%]="(s.strength / s.capacity) * 100" [style.background]="s.color"></div>
                  </div>
                  <span class="srl-val mono">{{ s.strength }} / {{ s.capacity }}</span>
                  <span class="srl-pct mono" [style.color]="s.color">{{ Math.round((s.strength / s.capacity) * 100) }}%</span>
                </div>
              }
            </div>
          </section>
        </div>
      }

      @else if (active() === 'units') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Units Overview</h3>
              <p>{{ units.length }} units across all sectors</p>
            </div>
          </header>

          <div class="unit-filters">
            @for (t of unitTypeFilters; track t.id) {
              <button class="uf-chip" [class.active]="unitTypeFilter() === t.id" (click)="unitTypeFilter.set(t.id)">
                <span>{{ t.icon }}</span>
                <span>{{ t.label }}</span>
                <span class="uf-count">{{ countUnitsByType(t.id) }}</span>
              </button>
            }
          </div>

          <div class="unit-grid">
            @for (u of filteredUnits(); track u.id) {
              <article class="unit-card" [style.--c]="sectorColor(u.sectorId)" (click)="openUnit(u.id)" (contextmenu)="onUnitContext($event, u)">
                <header class="uc-head">
                  <span class="uc-code mono">{{ u.code }}</span>
                  <span class="uc-type">{{ typeIcon(u.type) }} {{ u.type }}</span>
                </header>
                <b class="uc-name">{{ u.name }}</b>
                <p class="uc-sector">📍 {{ sectorName(u.sectorId) }}</p>
                <div class="uc-strength">
                  <div class="uc-s-row">
                    <span>Strength</span>
                    <b class="mono">{{ u.strength }} / {{ u.personnelTarget }}</b>
                  </div>
                  <div class="uc-bar">
                    <div class="uc-fill" [style.width.%]="(u.strength / u.personnelTarget) * 100"></div>
                  </div>
                </div>
                <footer class="uc-foot">
                  <span class="uc-commander">👤 {{ u.commander }}</span>
                  <span class="uc-open">View →</span>
                </footer>
              </article>
            }
          </div>
        </div>
      }

      @else if (active() === 'training') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Training Records</h3>
              <p>{{ training().length }} courses · {{ ongoingTrainings().length }} ongoing</p>
            </div>
            <button class="pill primary" (click)="createTraining()">＋ New Course</button>
          </header>

          <div class="training-grid">
            @for (t of training(); track t.id) {
              <article class="training-card" [attr.data-s]="t.status" (click)="openTraining(t.id)" (contextmenu)="onTrainingContext($event, t)">
                <header class="tc-head">
                  <span class="tc-type">{{ typeIcon(t.type) }} {{ t.type }}</span>
                  <span class="tc-status" [attr.data-s]="t.status">{{ t.status }}</span>
                </header>
                <b class="tc-title">{{ t.title }}</b>
                <p class="tc-ar" dir="rtl">{{ t.titleAr }}</p>
                <div class="tc-meta">
                  <span>📍 {{ t.location }}</span>
                  <span>👤 {{ t.instructor }}</span>
                  <span>⏱ {{ t.duration }}</span>
                </div>
                <div class="tc-progress">
                  <div class="tc-bar"><div class="tc-fill" [style.width.%]="(t.completed / t.capacity) * 100"></div></div>
                  <span class="mono">{{ t.completed }} / {{ t.capacity }} completed</span>
                </div>
                <footer class="tc-foot">
                  <span class="mono small">📅 {{ t.startDate }} → {{ t.endDate }}</span>
                  <span class="tc-open">View →</span>
                </footer>
              </article>
            }
          </div>
        </div>
      }

      @else if (active() === 'import') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Bulk Import</h3>
              <p>{{ batches().length }} import batches · {{ completedBatches() }} completed</p>
            </div>
          </header>

          <div class="import-wizard">
            <div class="iw-step" [class.done]="importStep() > 1">
              <span class="iw-num">1</span>
              <div>
                <b>Download template</b>
                <p>Get the Excel template to ensure correct format</p>
                <button class="pill-sm" (click)="downloadTemplate()">⬇ soldiers_template.xlsx</button>
              </div>
            </div>
            <div class="iw-step" [class.done]="importStep() > 2">
              <span class="iw-num">2</span>
              <div>
                <b>Upload file</b>
                <p>Drag & drop your CSV/XLSX file (max 50 MB)</p>
                @if (importStep() <= 2) {
                  <div class="drop-zone" (click)="startImport()" (dragover)="$event.preventDefault()" (drop)="startImport()">
                    <span class="dz-icon">📥</span>
                    <b>Drop file here or click to browse</b>
                    <small>Supports CSV, XLSX, XLS</small>
                  </div>
                }
              </div>
            </div>
            <div class="iw-step" [class.done]="importStep() > 3">
              <span class="iw-num">3</span>
              <div>
                <b>Review & confirm</b>
                <p>Validate rows and confirm the import</p>
                @if (importStep() >= 3) {
                  <div class="import-preview">
                    <header>
                      <b>{{ currentImportName() }}</b>
                      <span class="mono">{{ importProgress() }}%</span>
                    </header>
                    <div class="ip-progress"><div class="ip-fill" [style.width.%]="importProgress()"></div></div>
                    @if (importProgress() === 100) {
                      <div class="ip-success">
                        <span>✓</span>
                        <div>
                          <b>Import complete</b>
                          <small>2,847 rows imported successfully</small>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>

          <section class="batches-section">
            <header class="bs-head">
              <h4>Import history</h4>
            </header>
            <div class="batch-list">
              @for (b of batches(); track b.id) {
                <article class="batch-row" [attr.data-s]="b.status" (click)="openBatch(b.id)" (contextmenu)="onBatchContext($event, b)">
                  <span class="batch-icon">{{ batchIcon(b.status) }}</span>
                  <div class="batch-info">
                    <b>{{ b.fileName }}</b>
                    <small class="mono">{{ b.id }} · {{ b.fileSize }} · {{ b.duration }}</small>
                  </div>
                  <div class="batch-stats">
                    <span class="bs-ok">✓ {{ b.validRows }}</span>
                    @if (b.invalidRows > 0) {
                      <span class="bs-fail">✕ {{ b.invalidRows }}</span>
                    }
                  </div>
                  <span class="batch-status" [attr.data-s]="b.status">{{ b.status }}</span>
                  <span class="mono small">{{ timeAgo(b.importedAt) }}</span>
                </article>
              }
            </div>
          </section>
        </div>
      }

      @else if (active() === 'activity') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Activity Log</h3>
              <p>{{ activity().length }} events · Complete audit trail</p>
            </div>
          </header>

          <div class="activity-filters">
            @for (a of activityTypeFilters; track a.id) {
              <button class="af-chip" [class.active]="activityFilter() === a.id" (click)="activityFilter.set(a.id)">
                <span>{{ a.icon }}</span>
                <span>{{ a.label }}</span>
                <span class="af-count">{{ countActivityBy(a.id) }}</span>
              </button>
            }
          </div>

          <div class="activity-timeline">
            @for (a of filteredActivity(); track a.id) {
              <div class="timeline-item">
                <span class="tl-time mono">{{ timeAgo(a.timestamp) }}</span>
                <span class="tl-dot" [style.background]="a.color"></span>
                <div class="tl-body" (click)="openSoldier(a.soldierId)">
                  <div class="tl-head">
                    <span class="tl-icon" [style.background]="a.color + '22'" [style.color]="a.color">{{ a.icon }}</span>
                    <div>
                      <b>{{ soldierName(a.soldierId) }}</b>
                      <span class="tl-action" [style.color]="a.color">{{ a.action }}</span>
                    </div>
                  </div>
                  <p>{{ a.description }}</p>
                  <div class="tl-meta">
                    <span>👤 {{ a.by }}</span>
                    <span>·</span>
                    <span class="mono">{{ formatDate(a.timestamp) }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      @else if (active() === 'reports') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Reports & Analytics</h3>
              <p>Comprehensive personnel insights</p>
            </div>
            <button class="pill primary" (click)="generateReport()">📄 Generate PDF Report</button>
          </header>

          <div class="report-kpis">
            @for (r of reportKpis(); track r.label) {
              <article class="report-kpi" [style.--c]="r.color">
                <span class="rk-icon">{{ r.icon }}</span>
                <b class="rk-val">{{ r.value }}</b>
                <span class="rk-label">{{ r.label }}</span>
              </article>
            }
          </div>

          <section class="chart-card">
            <header><h4>Status distribution</h4></header>
            @for (s of statusBreakdown(); track s.label) {
              <div class="breakdown-row">
                <span class="bd-dot" [style.background]="s.color"></span>
                <span class="bd-label">{{ s.label }}</span>
                <div class="bd-bar"><div class="bd-fill" [style.width.%]="s.pct" [style.background]="s.color"></div></div>
                <span class="bd-val mono">{{ s.count }} ({{ s.pct }}%)</span>
              </div>
            }
          </section>

          <div class="grid-2">
            <section class="info-card">
              <header><h4>Speciality breakdown</h4></header>
              @for (s of specialityBreakdown().slice(0, 8); track s.label) {
                <div class="breakdown-row">
                  <span class="bd-icon">{{ s.icon }}</span>
                  <span class="bd-label">{{ s.label }}</span>
                  <div class="bd-bar"><div class="bd-fill" [style.width.%]="s.pct" style="background:var(--accent)"></div></div>
                  <span class="bd-val mono">{{ s.count }}</span>
                </div>
              }
            </section>

            <section class="info-card">
              <header><h4>Education levels</h4></header>
              @for (e of educationBreakdown(); track e.label) {
                <div class="breakdown-row">
                  <span class="bd-icon">📚</span>
                  <span class="bd-label">{{ e.label }}</span>
                  <div class="bd-bar"><div class="bd-fill" [style.width.%]="e.pct" style="background:#5856d6"></div></div>
                  <span class="bd-val mono">{{ e.count }}</span>
                </div>
              }
            </section>
          </div>

          <section class="info-card">
            <header><h4>Medical status overview</h4></header>
            <div class="medical-grid">
              @for (m of medicalBreakdown(); track m.label) {
                <div class="medical-card" [style.--c]="m.color">
                  <span class="med-icon">{{ m.icon }}</span>
                  <b>{{ m.count }}</b>
                  <small>{{ m.label }}</small>
                </div>
              }
            </div>
          </section>

          <section class="info-card">
            <header><h4>Top performers</h4></header>
            @for (s of topPerformers(); track s.soldier.id; let i = $index) {
              <div class="top-row" (click)="openSoldier(s.soldier.id)">
                <span class="top-rank">{{ i + 1 }}</span>
                <span class="avatar-m">{{ initials(s.soldier.name) }}</span>
                <div>
                  <b>{{ s.soldier.name }}</b>
                  <small>{{ s.soldier.rank }} · {{ sectorName(s.soldier.sectorId) }}</small>
                </div>
                <span class="top-score mono">{{ s.soldier.lastEvaluation }}%</span>
              </div>
            }
          </section>
        </div>
      }

      @if (selectedSoldier(); as s) {
        <div class="modal-backdrop" (click)="selectedSoldier.set(null)">
          <div class="modal soldier-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon" [style.background]="sectorColor(s.sectorId) + '22'" [style.color]="sectorColor(s.sectorId)">
                {{ initials(s.name) }}
              </span>
              <div>
                <h3>{{ s.name }}</h3>
                <p dir="rtl">{{ s.nameAr }} · {{ s.rankAr }}</p>
              </div>
              <span class="st" [attr.data-s]="s.status">{{ s.status }}</span>
              <button class="modal-close" (click)="selectedSoldier.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="soldier-tabs">
                @for (t of soldierDetailTabs; track t.id) {
                  <button class="sd-tab" [class.active]="soldierTab() === t.id" (click)="soldierTab.set(t.id)">
                    {{ t.icon }} {{ t.label }}
                  </button>
                }
              </div>

              @if (soldierTab() === 'overview') {
                <div class="sm-grid">
                  <div class="sm-section"><span class="om-label">Military ID</span><b class="mono">{{ s.id }}</b></div>
                  <div class="sm-section"><span class="om-label">National ID</span><b class="mono">{{ s.nationalId }}</b></div>
                  <div class="sm-section"><span class="om-label">Rank</span><b>{{ s.rank }}</b></div>
                  <div class="sm-section"><span class="om-label">Sector</span><b>{{ sectorName(s.sectorId) }}</b></div>
                  <div class="sm-section"><span class="om-label">Unit</span><b>{{ unitName(s.unitId) }}</b></div>
                  <div class="sm-section"><span class="om-label">Squad</span><b>{{ s.squad }}</b></div>
                  <div class="sm-section"><span class="om-label">Speciality</span><b>{{ s.speciality }}</b></div>
                  <div class="sm-section"><span class="om-label">Blood type</span><b>{{ s.bloodType }}</b></div>
                  <div class="sm-section"><span class="om-label">Age</span><b>{{ s.age }} years</b></div>
                  <div class="sm-section"><span class="om-label">City</span><b>{{ s.city }}</b></div>
                  <div class="sm-section"><span class="om-label">Governorate</span><b>{{ s.governorate }}</b></div>
                  <div class="sm-section"><span class="om-label">Education</span><b>{{ s.educationLevel }}</b></div>
                </div>
              }

              @if (soldierTab() === 'service') {
                <div class="sm-grid">
                  <div class="sm-section"><span class="om-label">Enlisted</span><b>{{ s.enlistedDate }}</b></div>
                  <div class="sm-section"><span class="om-label">Years of service</span><b>{{ s.yearsOfService }} years</b></div>
                  <div class="sm-section"><span class="om-label">Contract type</span><b>{{ s.contractType }}</b></div>
                  <div class="sm-section"><span class="om-label">Missions</span><b>{{ s.missions }}</b></div>
                  <div class="sm-section"><span class="om-label">Medals</span><b>{{ s.medals }}</b></div>
                  <div class="sm-section"><span class="om-label">Fitness score</span><b>{{ s.fitnessScore }}%</b></div>
                  <div class="sm-section"><span class="om-label">Last evaluation</span><b>{{ s.lastEvaluation }}%</b></div>
                  <div class="sm-section"><span class="om-label">Training status</span><b>{{ s.trainingStatus }}</b></div>
                </div>
              }

              @if (soldierTab() === 'contact') {
                <div class="sm-grid">
                  <div class="sm-section"><span class="om-label">Phone</span><b class="mono">{{ s.phone }}</b></div>
                  <div class="sm-section"><span class="om-label">Emergency contact</span><b>{{ s.emergencyContact }}</b></div>
                  <div class="sm-section"><span class="om-label">Emergency phone</span><b class="mono">{{ s.emergencyPhone }}</b></div>
                  <div class="sm-section"><span class="om-label">Birth date</span><b>{{ s.birthDate }}</b></div>
                  <div class="sm-section"><span class="om-label">Marital status</span><b>{{ s.maritalStatus }}</b></div>
                  <div class="sm-section"><span class="om-label">Children</span><b>{{ s.childrenCount }}</b></div>
                </div>
              }

              @if (soldierTab() === 'medical') {
                <div class="medical-status-card" [attr.data-s]="s.medicalStatus">
                  <span class="ms-icon">{{ s.medicalStatus === 'Fit' ? '✅' : '⚠️' }}</span>
                  <div>
                    <b>{{ s.medicalStatus }}</b>
                    <small>Current medical classification</small>
                  </div>
                </div>
                <div class="sm-grid">
                  <div class="sm-section"><span class="om-label">Blood type</span><b>{{ s.bloodType }}</b></div>
                  <div class="sm-section"><span class="om-label">Fitness score</span><b>{{ s.fitnessScore }}%</b></div>
                </div>
              }

              @if (s.notes.length) {
                <div class="om-notes">
                  <span class="om-label">Notes</span>
                  @for (n of s.notes; track $index) {
                    <div class="note-row">
                      <p>{{ n }}</p>
                    </div>
                  }
                </div>
              }

              <div class="om-actions-grid">
                <button class="om-action-btn" (click)="callSoldier(s)">
                  <span class="oab-icon">📞</span>
                  <b>Call</b>
                  <small>{{ s.phone }}</small>
                </button>
                <button class="om-action-btn" (click)="transferSoldier(s)">
                  <span class="oab-icon">🔀</span>
                  <b>Transfer</b>
                  <small>Change sector</small>
                </button>
                <button class="om-action-btn" (click)="promoteSoldier(s)">
                  <span class="oab-icon">⬆</span>
                  <b>Promote</b>
                  <small>Update rank</small>
                </button>
                <button class="om-action-btn" (click)="printDossier(s)">
                  <span class="oab-icon">📄</span>
                  <b>Dossier</b>
                  <small>Print PDF</small>
                </button>
              </div>
            </div>
            <footer class="modal-foot">
              <button class="mf-btn" (click)="selectedSoldier.set(null)">Close</button>
              <button class="mf-btn primary" (click)="editSoldier(s)">✎ Edit</button>
            </footer>
          </div>
        </div>
      }

      @if (selectedSector(); as s) {
        <div class="modal-backdrop" (click)="selectedSector.set(null)">
          <div class="modal sector-modal" (click)="$event.stopPropagation()">
            <header class="modal-head" [style.borderBottomColor]="s.color">
              <span class="modal-icon" [style.background]="s.color + '22'" [style.color]="s.color">{{ s.icon }}</span>
              <div>
                <h3>{{ s.name }}</h3>
                <p>{{ s.nameAr }} · {{ s.code }}</p>
              </div>
              <button class="modal-close" (click)="selectedSector.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="sec-stats">
                <div class="sec-stat"><b>{{ s.strength }}</b><small>Personnel</small></div>
                <div class="sec-stat"><b>{{ s.capacity }}</b><small>Capacity</small></div>
                <div class="sec-stat"><b>{{ unitsInSector(s.id).length }}</b><small>Units</small></div>
                <div class="sec-stat"><b>{{ s.readiness }}%</b><small>Readiness</small></div>
              </div>

              <div class="sec-info">
                <div class="si-row"><span>Commander</span><b>{{ s.commander }}</b></div>
                <div class="si-row"><span>Region</span><b>{{ s.region }}</b></div>
                <div class="si-row"><span>Established</span><b>{{ s.established }}</b></div>
              </div>

              <div class="sec-soldiers">
                <span class="om-label">Personnel ({{ soldiersInSector(s.id).length }})</span>
                @for (sol of soldiersInSector(s.id).slice(0, 10); track sol.id) {
                  <div class="sm-order-row" (click)="openSoldier(sol.id)">
                    <span class="avatar-s">{{ initials(sol.name) }}</span>
                    <span class="mono">{{ sol.id }}</span>
                    <span>{{ sol.name }}</span>
                    <span class="st small" [attr.data-s]="sol.status">{{ sol.status }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      @if (selectedBatch(); as b) {
        <div class="modal-backdrop" (click)="selectedBatch.set(null)">
          <div class="modal batch-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon" [style.background]="batchColor(b.status) + '22'" [style.color]="batchColor(b.status)">
                {{ batchIcon(b.status) }}
              </span>
              <div>
                <h3>{{ b.fileName }}</h3>
                <p class="mono">{{ b.id }}</p>
              </div>
              <span class="batch-status" [attr.data-s]="b.status">{{ b.status }}</span>
              <button class="modal-close" (click)="selectedBatch.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="sm-grid">
                <div class="sm-section"><span class="om-label">File size</span><b>{{ b.fileSize }}</b></div>
                <div class="sm-section"><span class="om-label">Total rows</span><b>{{ b.totalRows }}</b></div>
                <div class="sm-section"><span class="om-label">Valid rows</span><b class="ok">{{ b.validRows }}</b></div>
                <div class="sm-section"><span class="om-label">Invalid rows</span><b class="warn">{{ b.invalidRows }}</b></div>
                <div class="sm-section"><span class="om-label">Duration</span><b>{{ b.duration }}</b></div>
                <div class="sm-section"><span class="om-label">Imported by</span><b>{{ b.importedBy }}</b></div>
                <div class="sm-section"><span class="om-label">Imported at</span><b class="mono">{{ formatDate(b.importedAt) }}</b></div>
              </div>

              @if (b.errors.length) {
                <div class="om-notes">
                  <span class="om-label">Errors ({{ b.errors.length }})</span>
                  @for (e of b.errors; track $index) {
                    <div class="error-row">
                      <span class="err-row mono">Row {{ e.row }}</span>
                      <span class="err-reason">{{ e.reason }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      @if (selectedTraining(); as t) {
        <div class="modal-backdrop" (click)="selectedTraining.set(null)">
          <div class="modal training-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon" style="background:var(--accent-soft); color:var(--accent)">
                {{ typeIcon(t.type) }}
              </span>
              <div>
                <h3>{{ t.title }}</h3>
                <p dir="rtl">{{ t.titleAr }}</p>
              </div>
              <span class="tc-status" [attr.data-s]="t.status">{{ t.status }}</span>
              <button class="modal-close" (click)="selectedTraining.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="sm-grid">
                <div class="sm-section"><span class="om-label">Type</span><b>{{ t.type }}</b></div>
                <div class="sm-section"><span class="om-label">Duration</span><b>{{ t.duration }}</b></div>
                <div class="sm-section"><span class="om-label">Start</span><b class="mono">{{ t.startDate }}</b></div>
                <div class="sm-section"><span class="om-label">End</span><b class="mono">{{ t.endDate }}</b></div>
                <div class="sm-section"><span class="om-label">Location</span><b>{{ t.location }}</b></div>
                <div class="sm-section"><span class="om-label">Instructor</span><b>{{ t.instructor }}</b></div>
                <div class="sm-section"><span class="om-label">Capacity</span><b>{{ t.capacity }}</b></div>
                <div class="sm-section"><span class="om-label">Enrolled</span><b>{{ t.enrolled }}</b></div>
                <div class="sm-section"><span class="om-label">Completed</span><b class="ok">{{ t.completed }}</b></div>
              </div>
              <div class="tc-progress">
                <div class="tc-bar"><div class="tc-fill" [style.width.%]="(t.completed / t.capacity) * 100"></div></div>
                <span class="mono">{{ Math.round((t.completed / t.capacity) * 100) }}% completion</span>
              </div>
            </div>
            <footer class="modal-foot">
              @if (t.status === 'scheduled') {
                <button class="mf-btn primary" (click)="enrollTraining(t.id)">✎ Enroll soldiers</button>
              }
              <button class="mf-btn" (click)="selectedTraining.set(null)">Close</button>
            </footer>
          </div>
        </div>
      }

      @if (selectedUnit(); as u) {
        <div class="modal-backdrop" (click)="selectedUnit.set(null)">
          <div class="modal unit-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon" [style.background]="sectorColor(u.sectorId) + '22'" [style.color]="sectorColor(u.sectorId)">
                {{ typeIcon(u.type) }}
              </span>
              <div>
                <h3>{{ u.name }}</h3>
                <p class="mono">{{ u.code }} · {{ sectorName(u.sectorId) }}</p>
              </div>
              <button class="modal-close" (click)="selectedUnit.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="sec-stats">
                <div class="sec-stat"><b>{{ u.strength }}</b><small>Personnel</small></div>
                <div class="sec-stat"><b>{{ u.personnelTarget }}</b><small>Target</small></div>
                <div class="sec-stat"><b>{{ soldiersInUnit(u.id).length }}</b><small>Tracked</small></div>
                <div class="sec-stat"><b>{{ typeIcon(u.type) }}</b><small>{{ u.type }}</small></div>
              </div>
              <div class="sec-info">
                <div class="si-row"><span>Commander</span><b>{{ u.commander }}</b></div>
                <div class="si-row"><span>Type</span><b>{{ u.type }}</b></div>
                <div class="si-row"><span>Sector</span><b>{{ sectorName(u.sectorId) }}</b></div>
              </div>
              <div class="sec-soldiers">
                <span class="om-label">Assigned personnel ({{ soldiersInUnit(u.id).length }})</span>
                @for (sol of soldiersInUnit(u.id); track sol.id) {
                  <div class="sm-order-row" (click)="openSoldier(sol.id)">
                    <span class="avatar-s">{{ initials(sol.name) }}</span>
                    <span class="mono">{{ sol.id }}</span>
                    <span>{{ sol.name }}</span>
                    <span class="st small" [attr.data-s]="sol.status">{{ sol.status }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .small { font-size: var(--fs-2xs); }
    .muted { color: var(--label-2); }
    .ok { color: #34c759; }
    .warn { color: #ff9500; }
    .preview-note { margin-bottom: 20px; }
    .view { max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
    .kpi {
      padding: 16px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md);
      border-left: 3px solid var(--c); cursor: pointer;
      transition: transform var(--t-base), box-shadow var(--t-base);
    }
    .kpi:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .kpi-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .kpi-icon { font-size: 18px; }
    .kpi-trend { font-size: 10px; font-weight: 700; }
    .kpi-trend.up { color: #34c759; }
    .kpi-trend.down { color: #ff9500; }
    .kpi-val { display: block; font-size: var(--fs-2xl); font-weight: 800;
               letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
    .kpi-label { display: block; font-size: var(--fs-2xs); color: var(--label-2);
                 text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; margin-top: 4px; }
    .kpi-bar { height: 3px; background: var(--bg-fill-2); border-radius: var(--r-pill);
               margin-top: 10px; overflow: hidden; }
    .kpi-fill { height: 100%; background: var(--c); border-radius: var(--r-pill); }

    .chart-card { padding: 24px; background: var(--bg-surface-solid);
                  border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .chart-card > header { margin-bottom: 20px; }
    .chart-card h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .chart-card header .muted { font-size: var(--fs-2xs); display: block; margin-top: 3px; }
    .chart-bars { display: flex; align-items: flex-end; gap: 8px; height: 180px; }
    .bar-group { flex: 1; height: 100%; display: flex; flex-direction: column-reverse;
                 gap: 2px; position: relative; cursor: pointer; align-items: stretch; }
    .bar-seg { width: 100%; border-radius: 2px; }
    .bar-label { position: absolute; bottom: -22px; left: 0; right: 0;
                 text-align: center; font-size: 9px; color: var(--label-3); font-weight: 600; }
    .bar-tip {
      position: absolute; top: -28px; left: 50%; transform: translateX(-50%);
      background: var(--accent); color: var(--accent-contrast);
      padding: 3px 10px; border-radius: var(--r-xs);
      font-size: 10px; font-weight: 700; white-space: nowrap;
    }

    .rank-bars { display: flex; flex-direction: column; gap: 10px; }
    .rank-row { display: grid; grid-template-columns: 130px 1fr 40px;
                gap: 12px; align-items: center; font-size: var(--fs-xs); }
    .rank-name { color: var(--label-2); font-weight: 600; }
    .rank-bar { height: 8px; background: var(--bg-fill-2); border-radius: var(--r-pill);
                overflow: hidden; }
    .rank-fill { height: 100%; border-radius: var(--r-pill); }
    .rank-count { text-align: right; font-weight: 700; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 820px) { .grid-2 { grid-template-columns: 1fr; } }

    .live-feed { padding: 24px; background: var(--bg-surface-solid);
                 border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .lf-head { display: flex; justify-content: space-between; align-items: flex-end;
               margin-bottom: 14px; flex-wrap: wrap; gap: 12px; }
    .lf-head h4 { font-size: var(--fs-base); font-weight: 700; }
    .lf-head .muted { font-size: var(--fs-2xs); display: block; margin-top: 3px; }
    .lf-list { display: flex; flex-direction: column; gap: 6px; }
    .lf-item {
      display: grid; grid-template-columns: 44px 1fr;
      gap: 12px; align-items: center; padding: 12px;
      background: var(--bg-fill-2); border-radius: var(--r-sm);
      cursor: pointer; transition: all var(--t-base);
    }
    .lf-item:hover { background: var(--bg-fill-3); transform: translateX(3px); }
    .lf-icon { width: 44px; height: 44px; display: grid; place-items: center;
               border-radius: var(--r-sm); font-size: 20px; }
    .lf-body { min-width: 0; }
    .lf-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
    .lf-title-row b { font-size: var(--fs-xs); font-weight: 700; }
    .lf-action {
      font-size: 9px; font-weight: 800;
      padding: 2px 8px; border-radius: var(--r-pill);
      text-transform: uppercase; letter-spacing: 0.04em;
      background: var(--bg-fill-3); color: var(--label-2);
    }
    .lf-body p { font-size: 10px; color: var(--label-2); margin-bottom: 4px; }
    .lf-meta { display: flex; gap: 12px; font-size: 10px; color: var(--label-3); }

    .info-card { padding: 20px; background: var(--bg-surface-solid);
                 border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .info-card > header { margin-bottom: 14px; }
    .info-card h4 { font-size: var(--fs-sm); font-weight: 700; }

    .sector-row {
      display: grid; grid-template-columns: 40px 1fr 80px 50px;
      gap: 12px; align-items: center; padding: 10px 0;
      border-bottom: 0.5px solid var(--separator);
      cursor: pointer; transition: background var(--t-fast);
    }
    .sector-row:last-child { border-bottom: 0; }
    .sector-row:hover { background: var(--bg-hover); margin: 0 -10px; padding: 10px; border-radius: var(--r-xs); }
    .sr-icon { width: 40px; height: 40px; display: grid; place-items: center;
               border-radius: var(--r-sm); font-size: 18px; }
    .sr-info { min-width: 0; }
    .sr-info b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .sr-info small { font-size: 10px; color: var(--label-3); }
    .sr-bar-mini { height: 4px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .sr-fill { height: 100%; border-radius: var(--r-pill); }
    .sr-pct { text-align: right; font-size: 11px; font-weight: 700; }

    .training-row {
      display: grid; grid-template-columns: 32px 1fr auto;
      gap: 12px; align-items: center; padding: 10px 0;
      border-bottom: 0.5px solid var(--separator);
      cursor: pointer; transition: background var(--t-fast);
    }
    .training-row:last-child { border-bottom: 0; }
    .training-row:hover { background: var(--bg-hover); margin: 0 -10px; padding: 10px; border-radius: var(--r-xs); }
    .tr-status {
      width: 28px; height: 28px; display: grid; place-items: center;
      border-radius: 50%; font-size: 11px; font-weight: 800; color: #fff;
    }
    .tr-status[data-s='ongoing']   { background: #007aff; }
    .tr-status[data-s='completed'] { background: #34c759; }
    .tr-status[data-s='scheduled'] { background: #ff9500; }
    .tr-status[data-s='cancelled'] { background: #8e8e93; }
    .tr-info { min-width: 0; }
    .tr-info b { font-size: var(--fs-xs); font-weight: 700; display: block;
                 overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tr-info small { font-size: 10px; color: var(--label-3); }
    .tr-count { font-size: 11px; font-weight: 700; color: var(--label-2); }

    .view-head { display: flex; justify-content: space-between; align-items: flex-end;
                 gap: 16px; flex-wrap: wrap; }
    .view-head h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .view-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }
    .view-toggle { display: flex; gap: 2px; padding: 3px; background: var(--bg-fill-2);
                   border-radius: var(--r-sm); }
    .vt { width: 34px; height: 34px; display: grid; place-items: center;
          border-radius: calc(var(--r-sm) - 4px); color: var(--label-2);
          font-size: 14px; transition: all var(--t-fast); cursor: pointer;
          background: transparent; border: 0; }
    .vt:hover { color: var(--label); }
    .vt.active { background: var(--bg-surface-solid); color: var(--label); box-shadow: var(--shadow-xs); }

    .pill { padding: 8px 16px; background: var(--bg-fill-2); color: var(--label);
            border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600;
            border: 0; cursor: pointer; transition: background var(--t-fast); }
    .pill:hover { background: var(--bg-fill-3); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }
    .pill-sm { padding: 6px 12px; background: var(--bg-fill-2); color: var(--label);
               border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 600;
               border: 0; cursor: pointer; }
    .pill-sm:hover { background: var(--bg-fill-3); }

    .filter-row { display: flex; justify-content: space-between; align-items: center;
                  gap: 12px; flex-wrap: wrap; }
    .filter-tabs { display: flex; gap: 4px; padding: 4px; background: var(--bg-fill-2);
                   border-radius: var(--r-sm); flex-wrap: wrap; }
    .ftab { padding: 7px 12px; border-radius: calc(var(--r-sm) - 4px);
            font-size: var(--fs-xs); font-weight: 500; color: var(--label-2);
            display: inline-flex; align-items: center; gap: 6px;
            background: transparent; border: 0; cursor: pointer;
            transition: all var(--t-base); }
    .ftab:hover { color: var(--label); }
    .ftab.active { background: var(--bg-surface-solid); color: var(--label);
                   box-shadow: var(--shadow-xs); font-weight: 600; }
    .ftab-count { background: var(--bg-fill-2); padding: 1px 7px; border-radius: var(--r-pill);
                  font-size: 10px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .ftab.active .ftab-count { background: var(--accent-soft); color: var(--accent); }

    .chip-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .sel {
      padding: 7px 12px; background: var(--bg-input); color: var(--label);
      border: 0.5px solid var(--separator); border-radius: var(--r-sm);
      font-size: var(--fs-xs); font-family: inherit; cursor: pointer; outline: none;
    }
    .sel:focus { border-color: var(--accent); }

    .table-wrap { background: var(--bg-surface-solid);
                  border: 0.5px solid var(--separator); border-radius: var(--r-md);
                  overflow: hidden; }
    .thead, .trow {
      display: grid;
      grid-template-columns: 36px 90px 1.6fr 90px 1.1fr 110px 70px 100px 100px;
      gap: 12px; padding: 12px 16px; align-items: center; font-size: var(--fs-xs);
    }
    .thead { background: var(--bg-fill-2); font-size: 10px; text-transform: uppercase;
             letter-spacing: 0.06em; color: var(--label-2); font-weight: 700; }
    .th.sortable { cursor: pointer; user-select: none; }
    .th.sortable:hover { color: var(--accent); }
    .check { display: grid; place-items: center; }
    .check input { accent-color: var(--accent); cursor: pointer; }
    .trow { border-top: 0.5px solid var(--separator); cursor: pointer;
            transition: background var(--t-fast); }
    .trow:hover { background: var(--bg-hover); }
    .trow.selected { background: var(--bg-selected); }
    .name-cell { display: flex; align-items: center; gap: 10px; }
    .avatar-m { width: 28px; height: 28px; display: grid; place-items: center;
                border-radius: 50%; font-size: 10px; font-weight: 800; flex-shrink: 0; }
    .name-cell b { font-size: var(--fs-xs); font-weight: 600; display: block;
                   overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .name-cell small { font-size: 9px; color: var(--label-3); }
    .sector-tag {
      font-family: var(--sf-mono); font-size: 10px; font-weight: 700;
      padding: 3px 8px; background: color-mix(in srgb, var(--c) 15%, transparent);
      color: var(--c); border-radius: var(--r-pill);
    }
    .st {
      padding: 3px 10px; border-radius: var(--r-pill);
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.04em; text-align: center; display: inline-block;
    }
    .st.small { font-size: 9px; padding: 2px 8px; }
    .st[data-s='Active']    { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='Training']  { background: var(--accent-soft); color: var(--accent); }
    .st[data-s='Transfer']  { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='Leave']     { background: var(--bg-fill-3); color: var(--label-2); }
    .st[data-s='Medical']   { background: rgba(175, 82, 222, 0.15); color: #af52de; }
    .st[data-s='Reserve']   { background: rgba(0, 199, 190, 0.15); color: #00c7be; }
    .st[data-s='Retired']   { background: var(--bg-fill-3); color: var(--label-3); }

    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; }
    .row-action {
      width: 26px; height: 26px; display: grid; place-items: center;
      border-radius: var(--r-xs); background: transparent; border: 0;
      color: var(--label-3); font-size: 12px; cursor: pointer;
      transition: all var(--t-fast);
    }
    .row-action:hover { background: var(--bg-fill-2); color: var(--label); }
    .row-action.danger:hover { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

    .empty-mini { padding: 40px 20px; text-align: center;
                  color: var(--label-3); font-size: var(--fs-xs); }
    .empty-mini.full { grid-column: 1 / -1; }

    .pagination { display: flex; justify-content: space-between; align-items: center;
                  gap: 16px; padding: 14px 4px; flex-wrap: wrap; }
    .page-info { font-size: var(--fs-2xs); color: var(--label-2); font-variant-numeric: tabular-nums; }
    .page-controls { display: flex; gap: 4px; }
    .pg-btn { min-width: 32px; height: 32px; padding: 0 10px; display: grid;
              place-items: center; border-radius: var(--r-sm);
              background: var(--bg-fill-2); color: var(--label-2);
              font-size: var(--fs-xs); font-weight: 600;
              border: 0; cursor: pointer; transition: all var(--t-fast); }
    .pg-btn:hover:not(:disabled) { background: var(--bg-fill-3); color: var(--label); }
    .pg-btn.active { background: var(--accent); color: var(--accent-contrast); }
    .pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .soldier-card {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md); padding: 14px; cursor: pointer;
      transition: all var(--t-base);
      display: flex; flex-direction: column; gap: 12px;
    }
    .soldier-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md);
                          border-color: var(--accent); }
    .sc-head { display: flex; align-items: center; gap: 10px; }
    .sc-avatar { width: 44px; height: 44px; display: grid; place-items: center;
                 border-radius: 50%; font-size: 15px; font-weight: 800; flex-shrink: 0; }
    .sc-info { flex: 1; min-width: 0; }
    .sc-info b { font-size: var(--fs-xs); font-weight: 700; display: block;
                 overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sc-ar { font-size: 10px; color: var(--label-2); margin: 2px 0; }
    .sc-id { font-size: 9px; color: var(--label-3); }
    .sc-body { display: flex; flex-direction: column; gap: 4px; }
    .sc-row { display: flex; justify-content: space-between; align-items: center;
              padding: 5px 0; font-size: 10px;
              border-bottom: 0.5px solid var(--separator); gap: 8px; }
    .sc-row:last-child { border-bottom: 0; }
    .sc-row span { color: var(--label-3); }
    .sc-row b { font-weight: 700; color: var(--label);
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sc-foot { display: flex; justify-content: space-between; padding-top: 8px;
               border-top: 0.5px solid var(--separator); }
    .sc-stat { font-size: 10px; color: var(--label-2); font-weight: 600; }

    .bulk-bar { position: sticky; bottom: 12px; display: flex; justify-content: space-between;
                align-items: center; gap: 16px; padding: 12px 18px;
                background: var(--bg-elevated); backdrop-filter: var(--blur-thick);
                border: 0.5px solid var(--separator); border-radius: var(--r-pill);
                box-shadow: var(--shadow-lg); animation: bulkIn 280ms var(--ease-spring); z-index: 5; }
    @keyframes bulkIn { from { opacity: 0; transform: translateY(12px); }
                        to { opacity: 1; transform: translateY(0); } }
    .bulk-count { font-size: var(--fs-xs); font-weight: 700; color: var(--accent);
                  padding: 4px 12px; background: var(--accent-soft); border-radius: var(--r-pill); }
    .bulk-actions { display: flex; gap: 6px; }
    .bulk-btn { padding: 7px 14px; background: var(--bg-fill-2); color: var(--label);
                border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 600;
                border: 0; cursor: pointer; transition: all var(--t-fast); }
    .bulk-btn:hover { background: var(--bg-fill-3); }
    .bulk-btn.danger { background: rgba(255, 59, 48, 0.12); color: #ff3b30; }
    .bulk-btn.danger:hover { background: rgba(255, 59, 48, 0.2); }
    .bulk-btn.ghost { background: transparent; padding: 7px 10px; }

    .dist-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }
    .dist-card { background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
                 border-radius: var(--r-md); padding: 16px; cursor: pointer;
                 transition: all var(--t-base); border-top: 3px solid var(--c);
                 display: flex; flex-direction: column; gap: 12px; }
    .dist-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .dc-head, .dist-card > header { display: flex; align-items: center; gap: 12px; }
    .dc-icon { width: 44px; height: 44px; display: grid; place-items: center;
               border-radius: var(--r-sm); font-size: 22px; flex-shrink: 0; }
    .dist-card > header > div { flex: 1; min-width: 0; }
    .dist-card > header b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .dist-card > header small { font-size: 10px; color: var(--label-3); }
    .dc-readiness { font-size: var(--fs-lg); font-weight: 800; color: var(--c);
                    font-variant-numeric: tabular-nums; }
    .dc-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .dc-stat { padding: 8px; background: var(--bg-fill-2); border-radius: var(--r-sm);
               text-align: center; }
    .dc-stat b { font-size: var(--fs-base); font-weight: 800;
                 font-variant-numeric: tabular-nums; display: block; }
    .dc-stat small { font-size: 9px; color: var(--label-3);
                     text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; }
    .dc-bar { height: 4px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .dc-fill { height: 100%; border-radius: var(--r-pill); }
    .dc-foot { display: flex; justify-content: space-between; align-items: center;
               padding-top: 8px; border-top: 0.5px solid var(--separator);
               font-size: 10px; color: var(--label-3); }
    .dc-open { color: var(--c); font-weight: 700; }

    .sector-chart { display: flex; flex-direction: column; gap: 12px; }
    .sector-row-lg { display: grid; grid-template-columns: 140px 1fr 100px 50px;
                     gap: 14px; align-items: center; cursor: pointer; padding: 4px 8px;
                     border-radius: var(--r-xs); transition: background var(--t-fast); }
    .sector-row-lg:hover { background: var(--bg-hover); }
    .srl-name { font-size: var(--fs-xs); font-weight: 600; }
    .srl-bar { height: 10px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .srl-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms var(--ease-out); }
    .srl-val { font-size: 10px; color: var(--label-2); }
    .srl-pct { font-size: 11px; font-weight: 800; text-align: right; }

    .unit-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .uf-chip { padding: 6px 12px; background: var(--bg-fill-2); color: var(--label-2);
               border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 600;
               border: 0; cursor: pointer; display: inline-flex; align-items: center;
               gap: 6px; transition: all var(--t-fast); }
    .uf-chip:hover { background: var(--bg-fill-3); color: var(--label); }
    .uf-chip.active { background: var(--accent); color: var(--accent-contrast); }
    .uf-count { background: rgba(255,255,255,0.18); padding: 0 5px;
                border-radius: var(--r-pill); font-size: 9px;
                font-variant-numeric: tabular-nums; }

    .unit-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
    .unit-card { background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
                 border-radius: var(--r-md); padding: 16px; cursor: pointer;
                 transition: all var(--t-base); border-left: 3px solid var(--c);
                 display: flex; flex-direction: column; gap: 10px; }
    .unit-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .uc-head { display: flex; justify-content: space-between; align-items: center; }
    .uc-code { font-size: 10px; font-weight: 800; color: var(--c);
               padding: 2px 8px; background: color-mix(in srgb, var(--c) 15%, transparent);
               border-radius: var(--r-pill); }
    .uc-type { font-size: 10px; color: var(--label-2); text-transform: capitalize;
               font-weight: 600; }
    .uc-name { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .uc-sector { font-size: 10px; color: var(--label-2); }
    .uc-strength { display: flex; flex-direction: column; gap: 6px; }
    .uc-s-row { display: flex; justify-content: space-between; font-size: 10px;
                color: var(--label-2); }
    .uc-s-row b { color: var(--label); font-weight: 700; }
    .uc-bar { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .uc-fill { height: 100%; background: var(--c); border-radius: var(--r-pill); }
    .uc-foot { display: flex; justify-content: space-between; align-items: center;
               padding-top: 8px; border-top: 0.5px solid var(--separator);
               font-size: 10px; color: var(--label-3); }
    .uc-open { color: var(--c); font-weight: 700; }

    .training-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }
    .training-card { background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
                     border-radius: var(--r-md); padding: 16px; cursor: pointer;
                     transition: all var(--t-base); display: flex; flex-direction: column; gap: 8px; }
    .training-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md);
                           border-color: var(--accent); }
    .training-card[data-s='ongoing']   { border-left: 3px solid #007aff; }
    .training-card[data-s='completed'] { border-left: 3px solid #34c759; }
    .training-card[data-s='scheduled'] { border-left: 3px solid #ff9500; }
    .training-card[data-s='cancelled'] { border-left: 3px solid #8e8e93; }
    .tc-head { display: flex; justify-content: space-between; align-items: center; }
    .tc-type { font-size: 10px; text-transform: capitalize; color: var(--label-2); font-weight: 600; }
    .tc-status { font-size: 9px; font-weight: 800; text-transform: uppercase;
                 letter-spacing: 0.04em; padding: 3px 9px; border-radius: var(--r-pill); }
    .tc-status[data-s='ongoing']   { background: rgba(0, 122, 255, 0.15); color: #007aff; }
    .tc-status[data-s='completed'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .tc-status[data-s='scheduled'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .tc-status[data-s='cancelled'] { background: var(--bg-fill-3); color: var(--label-2); }
    .tc-title { font-size: var(--fs-base); font-weight: 700; }
    .tc-ar { font-size: 10px; color: var(--label-2); }
    .tc-meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 10px;
               color: var(--label-3); }
    .tc-progress { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
    .tc-bar { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .tc-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill);
               transition: width 500ms var(--ease-out); }
    .tc-foot { display: flex; justify-content: space-between; align-items: center;
               padding-top: 8px; border-top: 0.5px solid var(--separator); }
    .tc-open { color: var(--accent); font-weight: 700; font-size: 10px; }

    .import-wizard { display: flex; flex-direction: column; gap: 12px; }
    .iw-step { display: grid; grid-template-columns: 44px 1fr; gap: 16px;
               padding: 20px; background: var(--bg-surface-solid);
               border: 0.5px solid var(--separator); border-radius: var(--r-md);
               transition: all var(--t-base); }
    .iw-step.done { opacity: 0.75; }
    .iw-num { width: 44px; height: 44px; display: grid; place-items: center;
              background: var(--accent-soft); color: var(--accent);
              border-radius: 50%; font-size: var(--fs-base); font-weight: 800;
              flex-shrink: 0; }
    .iw-step.done .iw-num { background: #34c759; color: #fff; }
    .iw-step > div { display: flex; flex-direction: column; gap: 6px; }
    .iw-step b { font-size: var(--fs-base); font-weight: 700; }
    .iw-step p { font-size: var(--fs-xs); color: var(--label-2); }

    .drop-zone { padding: 40px 20px; background: var(--bg-fill-2);
                 border: 2px dashed var(--separator); border-radius: var(--r-md);
                 text-align: center; display: flex; flex-direction: column;
                 align-items: center; gap: 8px; cursor: pointer; margin-top: 8px;
                 transition: all var(--t-base); }
    .drop-zone:hover { border-color: var(--accent); background: var(--accent-soft); }
    .dz-icon { font-size: 40px; }
    .drop-zone b { font-size: var(--fs-sm); font-weight: 700; }
    .drop-zone small { font-size: var(--fs-2xs); color: var(--label-2); }

    .import-preview { padding: 16px; background: var(--bg-fill-2);
                      border-radius: var(--r-sm); margin-top: 8px; }
    .import-preview header { display: flex; justify-content: space-between;
                             align-items: center; margin-bottom: 12px; font-size: var(--fs-xs); }
    .import-preview header b { font-weight: 700; }
    .import-preview header span { color: var(--accent); font-weight: 700; }
    .ip-progress { height: 6px; background: var(--bg-surface-solid); border-radius: var(--r-pill);
                   overflow: hidden; }
    .ip-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill);
               transition: width 200ms; }
    .ip-success { display: flex; align-items: center; gap: 12px; margin-top: 12px;
                  padding: 10px 14px; background: rgba(52, 199, 89, 0.1);
                  border-radius: var(--r-sm); }
    .ip-success span { font-size: 22px; color: #34c759; font-weight: 800; }
    .ip-success b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .ip-success small { font-size: 10px; color: var(--label-2); }

    .batches-section { padding: 20px; background: var(--bg-surface-solid);
                       border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .bs-head { margin-bottom: 14px; }
    .bs-head h4 { font-size: var(--fs-sm); font-weight: 700; }
    .batch-list { display: flex; flex-direction: column; gap: 6px; }
    .batch-row {
      display: grid; grid-template-columns: 40px 1fr auto auto auto;
      gap: 14px; align-items: center; padding: 12px 14px;
      background: var(--bg-fill-2); border-radius: var(--r-sm);
      cursor: pointer; transition: all var(--t-base);
    }
    .batch-row:hover { background: var(--bg-fill-3); transform: translateX(3px); }
    .batch-row[data-s='failed'] { border-left: 3px solid #ff3b30; }
    .batch-row[data-s='processing'] { border-left: 3px solid #007aff; }
    .batch-row[data-s='completed'] { border-left: 3px solid #34c759; }
    .batch-icon { width: 40px; height: 40px; display: grid; place-items: center;
                  border-radius: var(--r-sm); font-size: 18px;
                  background: var(--bg-surface-solid); }
    .batch-info b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .batch-info small { font-size: 10px; color: var(--label-3); }
    .batch-stats { display: flex; gap: 10px; font-size: 11px; font-weight: 700;
                   font-variant-numeric: tabular-nums; }
    .bs-ok { color: #34c759; }
    .bs-fail { color: #ff3b30; }
    .batch-status { font-size: 9px; font-weight: 800; text-transform: uppercase;
                    letter-spacing: 0.04em; padding: 3px 10px; border-radius: var(--r-pill); }
    .batch-status[data-s='completed']  { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .batch-status[data-s='processing'] { background: var(--accent-soft); color: var(--accent); }
    .batch-status[data-s='failed']     { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .batch-status[data-s='pending']    { background: var(--bg-fill-3); color: var(--label-2); }

    .activity-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .af-chip { padding: 6px 12px; background: var(--bg-fill-2); color: var(--label-2);
               border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 600;
               border: 0; cursor: pointer; display: inline-flex; align-items: center;
               gap: 6px; transition: all var(--t-fast); }
    .af-chip:hover { background: var(--bg-fill-3); color: var(--label); }
    .af-chip.active { background: var(--accent); color: var(--accent-contrast); }
    .af-count { background: rgba(255,255,255,0.18); padding: 0 5px;
                border-radius: var(--r-pill); font-size: 9px;
                font-variant-numeric: tabular-nums; }

    .activity-timeline { display: flex; flex-direction: column; gap: 0;
                         padding: 24px; background: var(--bg-surface-solid);
                         border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .timeline-item { display: grid; grid-template-columns: 90px 20px 1fr;
                     gap: 14px; align-items: flex-start; padding: 10px 0;
                     position: relative; }
    .timeline-item::before {
      content: ''; position: absolute; left: 101px; top: 24px; bottom: -10px;
      width: 1px; background: var(--separator);
    }
    .timeline-item:last-child::before { display: none; }
    .tl-time { font-size: 10px; color: var(--label-3);
               font-family: var(--sf-mono); text-align: right; padding-top: 5px; }
    .tl-dot { width: 14px; height: 14px; border-radius: 50%;
              margin-top: 3px; border: 3px solid var(--bg-surface-solid);
              box-shadow: 0 0 0 1px var(--separator); position: relative; z-index: 1; }
    .tl-body { padding: 6px 12px; border-radius: var(--r-xs); cursor: pointer;
               transition: background var(--t-fast); min-width: 0; }
    .tl-body:hover { background: var(--bg-hover); }
    .tl-head { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
    .tl-icon { width: 28px; height: 28px; display: grid; place-items: center;
               border-radius: var(--r-sm); font-size: 14px; }
    .tl-head b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .tl-action { font-size: 9px; font-weight: 800; text-transform: uppercase;
                 letter-spacing: 0.04em; }
    .tl-body p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5; }
    .tl-meta { display: flex; gap: 6px; font-size: 10px; color: var(--label-3);
               margin-top: 4px; }

    .report-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .report-kpis { grid-template-columns: repeat(2, 1fr); } }
    .report-kpi { padding: 18px; background: var(--bg-surface-solid);
                  border: 0.5px solid var(--separator); border-radius: var(--r-md);
                  border-left: 3px solid var(--c); }
    .rk-icon { font-size: 20px; }
    .rk-val { display: block; font-size: var(--fs-2xl); font-weight: 800;
              letter-spacing: -0.03em; font-variant-numeric: tabular-nums;
              line-height: 1; margin-top: 6px; }
    .rk-label { display: block; font-size: var(--fs-2xs); color: var(--label-2);
                text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;
                margin-top: 4px; }

    .breakdown-row { display: grid; grid-template-columns: 28px 100px 1fr 100px;
                     gap: 12px; align-items: center; padding: 10px 0;
                     border-bottom: 0.5px solid var(--separator); font-size: var(--fs-xs); }
    .breakdown-row:last-child { border-bottom: 0; }
    .bd-dot { width: 10px; height: 10px; border-radius: 50%; }
    .bd-icon { font-size: 16px; text-align: center; }
    .bd-label { color: var(--label-2); }
    .bd-bar { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill);
              overflow: hidden; }
    .bd-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms var(--ease-out); }
    .bd-val { text-align: right; font-weight: 700; font-size: 10px; }

    .medical-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .medical-card { padding: 16px; background: var(--bg-fill-2);
                    border-radius: var(--r-sm); border-left: 3px solid var(--c);
                    display: flex; flex-direction: column; gap: 4px; }
    .med-icon { font-size: 20px; }
    .medical-card b { font-size: var(--fs-2xl); font-weight: 800;
                      font-variant-numeric: tabular-nums; line-height: 1; }
    .medical-card small { font-size: 10px; color: var(--label-2);
                          text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    .top-row { display: grid; grid-template-columns: 32px 32px 1fr auto;
               gap: 12px; align-items: center; padding: 10px 0;
               border-bottom: 0.5px solid var(--separator); font-size: var(--fs-xs);
               cursor: pointer; }
    .top-row:last-child { border-bottom: 0; }
    .top-row:hover { background: var(--bg-hover); margin: 0 -10px; padding: 10px;
                     border-radius: var(--r-xs); }
    .top-rank { width: 24px; height: 24px; display: grid; place-items: center;
                background: var(--accent-soft); color: var(--accent);
                border-radius: 50%; font-size: 11px; font-weight: 800; }
    .avatar-s { width: 28px; height: 28px; display: grid; place-items: center;
                background: var(--accent-soft); color: var(--accent);
                border-radius: 50%; font-size: 10px; font-weight: 800; }
    .top-row b { font-weight: 600; display: block; }
    .top-row small { font-size: 10px; color: var(--label-2); }
    .top-score { color: #34c759; font-weight: 700; }

    .modal-backdrop { position: fixed; inset: 0;
                      background: rgba(0, 0, 0, 0.55);
                      backdrop-filter: blur(8px); z-index: 9990;
                      display: grid; place-items: center; padding: 40px 20px;
                      animation: fadeIn 200ms var(--ease-out); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal {
      max-width: 720px; width: 100%; max-height: 85vh;
      background: var(--bg-elevated);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
      box-shadow: var(--shadow-xl);
      display: flex; flex-direction: column; overflow: hidden;
      animation: modalIn 300ms var(--ease-spring);
    }
    .modal.soldier-modal { max-width: 780px; }
    .modal.sector-modal { max-width: 720px; }
    .modal.batch-modal { max-width: 620px; }
    .modal.training-modal { max-width: 640px; }
    .modal.unit-modal { max-width: 720px; }
    @keyframes modalIn { from { opacity: 0; transform: scale(0.95); }
                         to { opacity: 1; transform: scale(1); } }
    .modal-head { display: flex; align-items: center; gap: 14px;
                  padding: 20px 24px; border-bottom: 0.5px solid var(--separator); }
    .modal-icon { width: 48px; height: 48px; display: grid; place-items: center;
                  border-radius: var(--r-md); font-size: 20px; flex-shrink: 0; font-weight: 800; }
    .modal-head > div { flex: 1; }
    .modal-head h3 { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.015em; }
    .modal-head p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 2px; }
    .modal-close { width: 32px; height: 32px; display: grid; place-items: center;
                   border-radius: var(--r-xs); color: var(--label-3); font-size: 16px;
                   background: transparent; border: 0; cursor: pointer;
                   transition: all var(--t-fast); }
    .modal-close:hover { background: var(--bg-hover); color: var(--label); }
    .modal-body { flex: 1; overflow-y: auto; padding: 24px;
                  display: flex; flex-direction: column; gap: 20px; }

    .soldier-tabs { display: flex; gap: 4px; padding: 4px; background: var(--bg-fill-2);
                    border-radius: var(--r-sm); overflow-x: auto; }
    .sd-tab { padding: 8px 14px; border-radius: calc(var(--r-sm) - 4px);
              font-size: var(--fs-xs); font-weight: 500; color: var(--label-2);
              white-space: nowrap; background: transparent; border: 0; cursor: pointer;
              transition: all var(--t-base); }
    .sd-tab.active { background: var(--bg-surface-solid); color: var(--label);
                     box-shadow: var(--shadow-xs); font-weight: 600; }

    .sm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 600px) { .sm-grid { grid-template-columns: 1fr; } }
    .sm-section { display: flex; flex-direction: column; gap: 2px; }
    .sm-section b { font-size: var(--fs-sm); font-weight: 700; }

    .om-label {
      font-size: 9px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--label-3); margin-bottom: 2px;
    }

    .om-notes { display: flex; flex-direction: column; gap: 10px; }
    .note-row { padding: 10px 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .note-row p { font-size: var(--fs-xs); line-height: 1.5; color: var(--label); }

    .medical-status-card { display: flex; align-items: center; gap: 12px;
                           padding: 14px 16px; background: var(--bg-fill-2);
                           border-radius: var(--r-sm); }
    .medical-status-card[data-s='Fit'] { background: rgba(52, 199, 89, 0.08);
                                         border-left: 3px solid #34c759; }
    .medical-status-card[data-s='Temporary Exemption'] { background: rgba(255, 149, 0, 0.08);
                                                         border-left: 3px solid #ff9500; }
    .medical-status-card[data-s='Permanent Exemption'] { background: rgba(255, 59, 48, 0.08);
                                                         border-left: 3px solid #ff3b30; }
    .medical-status-card[data-s='Under Review'] { background: rgba(0, 122, 255, 0.08);
                                                  border-left: 3px solid #007aff; }
    .ms-icon { font-size: 24px; }
    .medical-status-card b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .medical-status-card small { font-size: 10px; color: var(--label-2); }

    .om-actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    @media (max-width: 600px) { .om-actions-grid { grid-template-columns: repeat(2, 1fr); } }
    .om-action-btn {
      padding: 14px 10px; background: var(--bg-fill-2);
      border-radius: var(--r-sm); display: flex; flex-direction: column;
      align-items: center; gap: 4px; text-align: center;
      border: 0; cursor: pointer; transition: all var(--t-fast); color: var(--label);
    }
    .om-action-btn:hover { background: var(--accent-soft); }
    .oab-icon { font-size: 22px; }
    .om-action-btn b { font-size: var(--fs-2xs); font-weight: 700; }
    .om-action-btn small { font-size: 9px; color: var(--label-2); }

    .modal-foot {
      padding: 16px 24px; border-top: 0.5px solid var(--separator);
      display: flex; gap: 8px; justify-content: flex-end;
    }
    .mf-btn {
      padding: 9px 16px; background: var(--bg-fill-2); color: var(--label);
      border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600;
      border: 0; cursor: pointer; transition: all var(--t-fast);
    }
    .mf-btn:hover { background: var(--bg-fill-3); }
    .mf-btn.primary { background: var(--accent); color: var(--accent-contrast); }
    .mf-btn.primary:hover { background: var(--accent-hover); }

    .sec-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 600px) { .sec-stats { grid-template-columns: repeat(2, 1fr); } }
    .sec-stat { padding: 14px; background: var(--bg-fill-2); border-radius: var(--r-sm);
                text-align: center; }
    .sec-stat b { font-size: var(--fs-xl); font-weight: 800;
                  font-variant-numeric: tabular-nums; display: block; }
    .sec-stat small { font-size: 10px; color: var(--label-2);
                      text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .sec-info { display: flex; flex-direction: column; gap: 0; }
    .si-row { display: flex; justify-content: space-between; padding: 10px 0;
              border-bottom: 0.5px solid var(--separator); font-size: var(--fs-xs); }
    .si-row:last-child { border-bottom: 0; }
    .si-row span { color: var(--label-2); }
    .si-row b { font-weight: 700; }
    .sec-soldiers { display: flex; flex-direction: column; gap: 6px; }
    .sm-order-row {
      display: grid; grid-template-columns: auto auto 1fr auto;
      gap: 10px; align-items: center; padding: 8px 12px;
      background: var(--bg-fill-2); border-radius: var(--r-xs);
      font-size: 10px; cursor: pointer; transition: background var(--t-fast);
    }
    .sm-order-row:hover { background: var(--bg-fill-3); }

    .error-row { display: grid; grid-template-columns: 80px 1fr; gap: 10px;
                 padding: 8px 12px; background: rgba(255, 59, 48, 0.08);
                 border-radius: var(--r-xs); font-size: 11px; }
    .err-row { color: var(--accent); font-family: var(--sf-mono); font-weight: 700; }
    .err-reason { color: var(--label-2); }
  `],
})
export class EnlistedPreviewComponent {
  readonly Math = Math;
  private menu = inject(ContextMenuService);
  public toast = inject(ToastService);

  readonly sectors = ENLISTED_SECTORS;
  readonly units = ENLISTED_UNITS;
  readonly soldiers = signal<EnlistedSoldier[]>([...ENLISTED_SOLDIERS]);
  readonly training = signal<TrainingRecord[]>([...TRAINING_RECORDS]);
  readonly batches = signal<ImportBatch[]>([...IMPORT_BATCHES]);
  readonly activity = signal<ActivityLogEntry[]>([...ACTIVITY_LOG]);

  readonly active = signal('dashboard');
  readonly registryView = signal<'table' | 'cards'>('table');
  readonly statusFilter = signal<string>('all');
  readonly rankFilter = signal<string>('all');
  readonly sectorFilter = signal<string>('all');
  readonly specialityFilter = signal<string>('all');
  readonly unitTypeFilter = signal<string>('all');
  readonly activityFilter = signal<string>('all');
  readonly searchQuery = signal('');
  readonly hoverBar = signal(-1);

  readonly soldierTab = signal('overview');
  readonly selectedSoldier = signal<EnlistedSoldier | null>(null);
  readonly selectedSector = signal<EnlistedSector | null>(null);
  readonly selectedUnit = signal<EnlistedUnit | null>(null);
  readonly selectedBatch = signal<ImportBatch | null>(null);
  readonly selectedTraining = signal<TrainingRecord | null>(null);

  readonly pageSize = 8;
  readonly page = signal(1);
  readonly selectedIds = signal<string[]>([]);

  readonly sortKey = signal<keyof EnlistedSoldier>('id');
  readonly sortDir = signal<1 | -1>(1);

  readonly importStep = signal(1);
  readonly importProgress = signal(0);
  readonly currentImportName = signal('soldiers_batch_07.xlsx');

  readonly rankFilters = RANK_FILTERS;
  readonly specialityFilters = SPECIALITY_FILTERS;

  readonly statusFilters = [
    { id: 'all', label: 'All', icon: '📁' },
    { id: 'Active', label: 'Active', icon: '✅' },
    { id: 'Training', label: 'Training', icon: '🎓' },
    { id: 'Transfer', label: 'Transfer', icon: '🔀' },
    { id: 'Leave', label: 'Leave', icon: '🏖' },
    { id: 'Medical', label: 'Medical', icon: '⚕️' },
  ];

  readonly unitTypeFilters = [
    { id: 'all', label: 'All', icon: '📁' },
    { id: 'infantry', label: 'Infantry', icon: '🪖' },
    { id: 'armored', label: 'Armored', icon: '🚙' },
    { id: 'artillery', label: 'Artillery', icon: '💥' },
    { id: 'signals', label: 'Signals', icon: '📡' },
    { id: 'medical', label: 'Medical', icon: '⚕️' },
    { id: 'engineering', label: 'Engineering', icon: '🔧' },
    { id: 'special', label: 'Special', icon: '🎖' },
    { id: 'logistics', label: 'Logistics', icon: '📦' },
  ];

  readonly activityTypeFilters = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'enlisted', label: 'Enlisted', icon: '📝' },
    { id: 'promoted', label: 'Promoted', icon: '⬆' },
    { id: 'transferred', label: 'Transferred', icon: '🔀' },
    { id: 'trained', label: 'Trained', icon: '🎓' },
    { id: 'medaled', label: 'Medaled', icon: '🏅' },
    { id: 'medical', label: 'Medical', icon: '⚕️' },
    { id: 'leave', label: 'Leave', icon: '🏖' },
  ];

  readonly soldierDetailTabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'service', label: 'Service', icon: '🎖' },
    { id: 'contact', label: 'Contact', icon: '📞' },
    { id: 'medical', label: 'Medical', icon: '⚕️' },
  ];

  readonly enlistmentData = [
    { month: 'Jan', count: 42 }, { month: 'Feb', count: 51 }, { month: 'Mar', count: 47 },
    { month: 'Apr', count: 63 }, { month: 'May', count: 58 }, { month: 'Jun', count: 71 },
    { month: 'Jul', count: 55 }, { month: 'Aug', count: 68 }, { month: 'Sep', count: 74 },
    { month: 'Oct', count: 82 }, { month: 'Nov', count: 91 }, { month: 'Dec', count: 78 },
  ];

  readonly nav = computed<PreviewNavItem[]>(() => [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', group: 'Command' },
    { id: 'registry', label: 'Registry', icon: '📋', badge: this.soldiers().length, group: 'Personnel' },
    { id: 'distribution', label: 'Distribution', icon: '🗺', badge: this.sectors.length, group: 'Personnel' },
    { id: 'units', label: 'Units', icon: '🏢', badge: this.units.length, group: 'Personnel' },
    { id: 'training', label: 'Training', icon: '🎓', badge: this.training().length, group: 'Operations' },
    { id: 'import', label: 'Bulk Import', icon: '📥', group: 'Operations' },
    { id: 'activity', label: 'Activity Log', icon: '📜', group: 'Analytics' },
    { id: 'reports', label: 'Reports', icon: '📈', group: 'Analytics' },
  ]);

  readonly toolbar = computed<ToolbarAction[]>(() => [
    { id: 'refresh', label: 'Refresh', icon: '⟳', action: () => this.toast.success('Data refreshed') },
    { id: 'export', label: 'Export', icon: '📥', action: () => this.toast.success('Exported to CSV') },
    { id: 'add', label: 'Add Soldier', icon: '＋', primary: true, action: () => this.addSoldier() },
  ]);

  readonly notifs = signal<PreviewNotification[]>([
    { id: 1, icon: '📥', title: 'Import complete', body: '2,847 soldiers added', time: '5m' },
    { id: 2, icon: '🎓', title: 'Training course starting', body: 'Basic Infantry Course — Sector 1', time: '2h' },
    { id: 3, icon: '⚠️', title: '3 soldiers need review', body: 'Medical evaluation pending', time: '3h' },
    { id: 4, icon: '✅', title: 'Sector 6 at 98% readiness', body: 'Highest in network', time: '5h' },
  ]);

  readonly searchPlaceholder = computed(() => {
    if (this.active() === 'registry') return 'Search by name, ID, national ID…';
    if (this.active() === 'units') return 'Search units…';
    if (this.active() === 'training') return 'Search courses…';
    return '';
  });

  readonly filteredSoldiers = computed(() => {
    let list = this.soldiers();
    const st = this.statusFilter();
    if (st !== 'all') list = list.filter(s => s.status === st);
    const r = this.rankFilter();
    if (r !== 'all') list = list.filter(s => s.rank === r);
    const sec = this.sectorFilter();
    if (sec !== 'all') list = list.filter(s => s.sectorId === sec);
    const sp = this.specialityFilter();
    if (sp !== 'all') list = list.filter(s => s.speciality === sp);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.nationalId.includes(q) ||
      s.city.toLowerCase().includes(q)
    );
    const key = this.sortKey();
    const dir = this.sortDir();
    return [...list].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  });

  readonly paged = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredSoldiers().slice(start, start + this.pageSize);
  });

  readonly lastPage = computed(() => Math.max(1, Math.ceil(this.filteredSoldiers().length / this.pageSize)));
  readonly pageNumbers = computed(() => Array.from({ length: this.lastPage() }, (_, i) => i + 1));
  readonly allSelected = computed(() => this.paged().length > 0 && this.paged().every(s => this.selectedIds().includes(s.id)));

  readonly filteredUnits = computed(() => {
    const t = this.unitTypeFilter();
    const q = this.searchQuery().toLowerCase().trim();
    let list = this.units;
    if (t !== 'all') list = list.filter(u => u.type === t);
    if (q) list = list.filter(u => u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q));
    return list;
  });

  readonly filteredActivity = computed(() => {
    const f = this.activityFilter();
    if (f === 'all') return this.activity();
    return this.activity().filter(a => a.action === f);
  });

  readonly ongoingTrainings = computed(() => this.training().filter(t => t.status === 'ongoing'));
  readonly completedBatches = computed(() => this.batches().filter(b => b.status === 'completed').length);
  readonly totalStrength = computed(() => this.sectors.reduce((s, x) => s + x.strength, 0));

  readonly kpis = computed(() => {
    const all = this.soldiers();
    const active = all.filter(s => s.status === 'Active').length;
    const trainingCount = all.filter(s => s.status === 'Training').length;
    const total = all.length;
    return [
      { icon: '👥', label: 'Total Personnel', value: total.toString(), color: '#007aff', pct: 100, trend: '+6%', up: true, action: () => this.active.set('registry') },
      { icon: '✅', label: 'Active Duty', value: active.toString(), color: '#34c759', pct: (active / total) * 100, trend: '+3', up: true, action: () => { this.statusFilter.set('Active'); this.active.set('registry'); } },
      { icon: '🎓', label: 'In Training', value: trainingCount.toString(), color: '#af52de', pct: (trainingCount / total) * 100, trend: '+2', up: true, action: () => { this.statusFilter.set('Training'); this.active.set('registry'); } },
      { icon: '🏢', label: 'Active Units', value: this.units.length.toString(), color: '#ff9500', pct: 100, trend: '+1', up: true, action: () => this.active.set('units') },
    ];
  });

  readonly rankDistribution = computed(() => {
    const total = this.soldiers().length;
    const map = new Map<string, number>();
    this.soldiers().forEach(s => map.set(s.rank, (map.get(s.rank) ?? 0) + 1));
    const colors = ['#8e8e93', '#007aff', '#34c759', '#ff9500', '#af52de', '#5856d6', '#ffcc00', '#ff2d55', '#ff3b30'];
    return Array.from(map.entries())
      .map(([rank, count], i) => ({ rank, count, pct: (count / total) * 100, color: colors[i % colors.length] }))
      .sort((a, b) => b.count - a.count);
  });

  readonly statusBreakdown = computed(() => {
    const total = this.soldiers().length;
    const statuses = [
      { id: 'Active', color: '#34c759' },
      { id: 'Training', color: '#af52de' },
      { id: 'Transfer', color: '#ff9500' },
      { id: 'Leave', color: '#8e8e93' },
      { id: 'Medical', color: '#ff3b30' },
      { id: 'Reserve', color: '#00c7be' },
    ];
    return statuses.map(s => {
      const count = this.soldiers().filter(x => x.status === s.id).length;
      return { label: s.id, count, pct: (count / total) * 100, color: s.color };
    });
  });

  readonly specialityBreakdown = computed(() => {
    const total = this.soldiers().length;
    const map = new Map<string, number>();
    this.soldiers().forEach(s => map.set(s.speciality, (map.get(s.speciality) ?? 0) + 1));
    return Array.from(map.entries())
      .map(([label, count]) => {
        const found = SPECIALITY_FILTERS.find(x => x.id === label);
        return { label, count, pct: (count / total) * 100, icon: found?.icon ?? '🎯' };
      })
      .sort((a, b) => b.count - a.count);
  });

  readonly educationBreakdown = computed(() => {
    const total = this.soldiers().length;
    const levels = ['Primary', 'Secondary', 'Diploma', 'Bachelor', 'Master'];
    return levels.map(label => {
      const count = this.soldiers().filter(s => s.educationLevel === label).length;
      return { label, count, pct: (count / total) * 100 };
    });
  });

  readonly medicalBreakdown = computed(() => {
    const statuses = [
      { label: 'Fit', icon: '✅', color: '#34c759' },
      { label: 'Temporary Exemption', icon: '⚠️', color: '#ff9500' },
      { label: 'Permanent Exemption', icon: '🚫', color: '#ff3b30' },
      { label: 'Under Review', icon: '🔍', color: '#007aff' },
    ];
    return statuses.map(s => ({
      ...s,
      count: this.soldiers().filter(x => x.medicalStatus === s.label).length,
    }));
  });

  readonly topPerformers = computed(() =>
    this.soldiers()
      .map(s => ({ soldier: s }))
      .sort((a, b) => b.soldier.lastEvaluation - a.soldier.lastEvaluation)
      .slice(0, 5)
  );

  readonly reportKpis = computed(() => {
    const total = this.soldiers().length;
    const avgAge = Math.round(this.soldiers().reduce((s, x) => s + x.age, 0) / total);
    const avgFitness = Math.round(this.soldiers().reduce((s, x) => s + x.fitnessScore, 0) / total);
    const avgService = (this.soldiers().reduce((s, x) => s + x.yearsOfService, 0) / total).toFixed(1);
    return [
      { icon: '📅', label: 'Avg age', value: `${avgAge}y`, color: '#007aff' },
      { icon: '💪', label: 'Avg fitness', value: `${avgFitness}%`, color: '#34c759' },
      { icon: '⏱', label: 'Avg service', value: `${avgService}y`, color: '#ff9500' },
      { icon: '🎯', label: 'Avg missions', value: Math.round(this.soldiers().reduce((s, x) => s + x.missions, 0) / total).toString(), color: '#af52de' },
    ];
  });

  onSearch(q: string): void {
    this.searchQuery.set(q);
    this.page.set(1);
  }

  countByStatus(id: string): number {
    if (id === 'all') return this.soldiers().length;
    return this.soldiers().filter(s => s.status === id).length;
  }

  countUnitsByType(type: string): number {
    if (type === 'all') return this.units.length;
    return this.units.filter(u => u.type === type).length;
  }

  countActivityBy(action: string): number {
    if (action === 'all') return this.activity().length;
    return this.activity().filter(a => a.action === action).length;
  }

  soldiersInSector(id: string): EnlistedSoldier[] {
    return this.soldiers().filter(s => s.sectorId === id);
  }

  soldiersInUnit(id: string): EnlistedSoldier[] {
    return this.soldiers().filter(s => s.unitId === id);
  }

  unitsInSector(id: string): EnlistedUnit[] {
    return this.units.filter(u => u.sectorId === id);
  }

  soldierById(id: string): EnlistedSoldier | undefined {
    return this.soldiers().find(s => s.id === id);
  }

  soldierName(id: string): string {
    return this.soldierById(id)?.name ?? id;
  }

  sectorById(id: string): EnlistedSector | undefined {
    return this.sectors.find(s => s.id === id);
  }

  sectorName(id: string): string {
    return this.sectorById(id)?.name ?? id;
  }

  sectorCode(id: string): string {
    return this.sectorById(id)?.code ?? id;
  }

  sectorColor(id: string): string {
    return this.sectorById(id)?.color ?? '#8e8e93';
  }

  unitById(id: string): EnlistedUnit | undefined {
    return this.units.find(u => u.id === id);
  }

  unitName(id: string): string {
    return this.unitById(id)?.name ?? id;
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n.charAt(0)).join('');
  }

  timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  readinessColor(r: number): string {
    if (r >= 95) return '#34c759';
    if (r >= 85) return '#ff9500';
    return '#ff3b30';
  }

  typeIcon(type: string): string {
    const map: Record<string, string> = {
      infantry: '🪖', armored: '🚙', artillery: '💥', signals: '📡',
      medical: '⚕️', engineering: '🔧', special: '🎖', logistics: '📦', training: '🎓',
      basic: '📚', advanced: '🎯', specialization: '🎖', refresher: '🔄', weapons: '🔫',
    };
    return map[type] ?? '🏢';
  }

  batchIcon(status: string): string {
    return { completed: '✅', processing: '⟳', failed: '❌', pending: '⏳' }[status] ?? '📄';
  }

  batchColor(status: string): string {
    return { completed: '#34c759', processing: '#007aff', failed: '#ff3b30', pending: '#ff9500' }[status] ?? '#8e8e93';
  }

  sortBy(key: keyof EnlistedSoldier): void {
    if (this.sortKey() === key) this.sortDir.update(d => d === 1 ? -1 : 1);
    else { this.sortKey.set(key); this.sortDir.set(1); }
  }

  sortIcon(key: string): string {
    return this.sortKey() === key ? (this.sortDir() === 1 ? '▲' : '▼') : '';
  }

  toggleSelect(id: string): void {
    this.selectedIds.update(list =>
      list.includes(id) ? list.filter(x => x !== id) : [...list, id]
    );
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set([]);
    } else {
      this.selectedIds.set(this.paged().map(s => s.id));
    }
  }

  openSoldier(id: string): void {
    const s = this.soldierById(id);
    if (s) {
      this.selectedSoldier.set(s);
      this.soldierTab.set('overview');
    }
  }

  openSector(id: string): void {
    const s = this.sectorById(id);
    if (s) this.selectedSector.set(s);
  }

  openUnit(id: string): void {
    const u = this.unitById(id);
    if (u) this.selectedUnit.set(u);
  }

  openBatch(id: string): void {
    const b = this.batches().find(x => x.id === id);
    if (b) this.selectedBatch.set(b);
  }

  openTraining(id: string): void {
    const t = this.training().find(x => x.id === id);
    if (t) this.selectedTraining.set(t);
  }

  editSoldier(s: EnlistedSoldier): void {
    this.toast.info('Editing soldier', s.name, '✎');
  }

  removeSoldier(id: string): void {
    const s = this.soldierById(id);
    if (!s) return;
    this.soldiers.update(list => list.filter(x => x.id !== id));
    this.toast.warning(`Removed ${id}`, s.name, '🗑');
  }

  addSoldier(): void {
    const n = this.soldiers().length + 1;
    const id = `M-${String(n).padStart(3, '0')}`;
    const newSoldier: EnlistedSoldier = {
      id,
      nationalId: `${30000000000000 + n}`,
      name: 'New Soldier',
      nameAr: 'جندي جديد',
      rank: 'Private',
      rankAr: 'جندي',
      rankLevel: 1,
      sectorId: 'sector_1',
      unitId: 'unit_1_1',
      squad: 'Squad NEW',
      status: 'Training',
      speciality: 'Basic',
      specialityAr: 'أساسي',
      bloodType: 'O+',
      phone: '+20 100 000 0000',
      emergencyContact: 'Emergency Contact',
      emergencyPhone: '+20 111 000 0000',
      birthDate: '2000-01-01',
      age: 24,
      city: 'Cairo',
      governorate: 'Cairo',
      enlistedDate: new Date().toISOString().slice(0, 10),
      yearsOfService: 0,
      contractType: 'Regular',
      missions: 0,
      medals: 0,
      fitnessScore: 75,
      educationLevel: 'Secondary',
      maritalStatus: 'Single',
      childrenCount: 0,
      medicalStatus: 'Under Review',
      trainingStatus: 'In Progress',
      lastEvaluation: 0,
      notes: ['Newly enlisted'],
    };
    this.soldiers.update(list => [newSoldier, ...list]);
    this.active.set('registry');
    this.toast.success(`Added ${id}`, 'New soldier record created', '➕');
  }

  bulkAction(kind: string): void {
    const n = this.selectedIds().length;
    if (kind === 'transfer') {
      this.soldiers.update(list => list.map(s =>
        this.selectedIds().includes(s.id) ? { ...s, status: 'Transfer' as const } : s
      ));
      this.toast.success(`Transferring ${n} soldier(s)`);
    } else if (kind === 'promote') {
      this.toast.success(`Promoting ${n} soldier(s)`);
    } else {
      this.toast.success(`Exporting ${n} soldier(s)`);
    }
    this.selectedIds.set([]);
  }

  bulkDelete(): void {
    const n = this.selectedIds().length;
    this.soldiers.update(list => list.filter(s => !this.selectedIds().includes(s.id)));
    this.selectedIds.set([]);
    this.toast.warning(`Removed ${n} soldier(s)`);
  }

  callSoldier(s: EnlistedSoldier): void {
    this.toast.info(`Calling ${s.name}`, s.phone, '📞');
  }

  transferSoldier(s: EnlistedSoldier): void {
    this.toast.info('Transfer wizard', `For ${s.name}`, '🔀');
  }

  promoteSoldier(s: EnlistedSoldier): void {
    this.toast.success('Promotion', `${s.name} — pending approval`, '⬆');
  }

  printDossier(s: EnlistedSoldier): void {
    this.toast.success(`Dossier generated`, s.name, '📄');
  }

  downloadTemplate(): void {
    this.toast.success('Template downloaded', 'soldiers_template.xlsx', '📥');
  }

  startImport(): void {
    this.importStep.set(3);
    this.importProgress.set(0);
    const tick = setInterval(() => {
      const p = this.importProgress();
      if (p >= 100) {
        clearInterval(tick);
        const newBatch: ImportBatch = {
          id: `IMP-2024-${String(this.batches().length + 1).padStart(3, '0')}`,
          fileName: this.currentImportName(),
          fileSize: '2.8 MB',
          totalRows: 2847,
          validRows: 2847,
          invalidRows: 0,
          status: 'completed',
          importedAt: new Date().toISOString(),
          importedBy: 'Current User',
          duration: '2m 45s',
          errors: [],
        };
        this.batches.update(list => [newBatch, ...list]);
        this.toast.success('Import complete', '2,847 soldiers added', '✅');
        setTimeout(() => this.importStep.set(1), 2000);
        return;
      }
      this.importProgress.update(p => Math.min(p + 5, 100));
    }, 100);
  }

  createTraining(): void {
    const id = `TR-${String(this.training().length + 1).padStart(3, '0')}`;
    const newTraining: TrainingRecord = {
      id,
      title: 'New Training Course',
      titleAr: 'دورة تدريبية جديدة',
      type: 'basic',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      duration: '4 weeks',
      capacity: 50,
      enrolled: 0,
      completed: 0,
      location: 'Training Camp',
      instructor: 'TBD',
      status: 'scheduled',
    };
    this.training.update(list => [newTraining, ...list]);
    this.toast.success('Course created', id, '🎓');
  }

  enrollTraining(id: string): void {
    this.toast.info(`Enrolling soldiers`, id, '✎');
  }

  generateReport(): void {
    this.toast.success('Generating PDF report', 'Comprehensive personnel analytics', '📄');
  }

  onSoldierContext(ev: MouseEvent, s: EnlistedSoldier): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: 'View details', icon: '👁', action: () => this.openSoldier(s.id) },
      { id: 'edit', label: 'Edit record', icon: '✎', action: () => this.editSoldier(s) },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      { id: 'call', label: 'Call soldier', icon: '📞', action: () => this.callSoldier(s) },
      { id: 'transfer', label: 'Create transfer', icon: '🔀', action: () => this.transferSoldier(s) },
      { id: 'promote', label: 'Promote', icon: '⬆', action: () => this.promoteSoldier(s) },
      { id: 'sep-2', label: '', separatorBefore: true, action: () => { } },
      { id: 'dossier', label: 'Print dossier', icon: '📄', action: () => this.printDossier(s) },
      {
        id: 'copy-id', label: 'Copy ID', icon: '📋',
        action: () => { navigator.clipboard?.writeText(s.id); this.toast.success('Copied ' + s.id); }
      },
      { id: 'sep-3', label: '', separatorBefore: true, action: () => { } },
      { id: 'delete', label: 'Delete record', icon: '🗑', danger: true, action: () => this.removeSoldier(s.id) },
    ]);
  }

  onUnitContext(ev: MouseEvent, u: EnlistedUnit): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: 'Open unit', icon: '📂', action: () => this.openUnit(u.id) },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'copy', label: 'Copy unit code', icon: '📋',
        action: () => { navigator.clipboard?.writeText(u.code); this.toast.success('Copied ' + u.code); }
      },
    ]);
  }

  onBatchContext(ev: MouseEvent, b: ImportBatch): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: 'View details', icon: '👁', action: () => this.openBatch(b.id) },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'download', label: 'Download file', icon: '📥',
        action: () => this.toast.success('Downloading ' + b.fileName)
      },
      {
        id: 'errors', label: 'Download errors', icon: '⚠️',
        action: () => this.toast.info(`${b.errors.length} error rows`)
      },
    ]);
  }

  onTrainingContext(ev: MouseEvent, t: TrainingRecord): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: 'View details', icon: '👁', action: () => this.openTraining(t.id) },
      { id: 'enroll', label: 'Enroll soldiers', icon: '✎', action: () => this.enrollTraining(t.id) },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'roster', label: 'View roster', icon: '📋',
        action: () => this.toast.info('Opening roster', `${t.enrolled} enrolled`)
      },
      {
        id: 'cancel', label: 'Cancel course', icon: '🚫', danger: true,
        action: () => this.toast.warning('Course cancelled', t.id)
      },
    ]);
  }
}