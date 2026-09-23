import { ChangeDetectionStrategy, Component, computed, inject, Resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { OPS_SECTORS, RESOURCES, Operation, OPERATIONS, Incident, INCIDENTS, SectorReport, REPORTS, OpsLogEntry, OPS_LOG, OpsSector, SectorResource } from '../../../../data/sector-operations.data';
import { DummyDataEditorComponent } from '../../shared/dummy-data-editor/dummy-data-editor';
import { PreviewShellComponent, PreviewNavItem, ToolbarAction, PreviewNotification } from '../../shared/preview-shell/preview-shell';


@Component({
  selector: 'app-sector-reports-preview',
  standalone: true,
  imports: [PreviewShellComponent, FormsModule, DummyDataEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="📊"
      title="Sector Operations"
      subtitle="FOE · {{ sectors.length }} sectors · {{ operations().length }} ops"
      [nav]="nav()"
      [active]="active()"
      (activeChange)="active.set($any($event))"
      [toolbarActions]="toolbar()"
      [notifications]="notifs()"
      [searchPlaceholder]="searchPlaceholder()"
      (searchChange)="onSearch($event)"
    >
      <div class="preview-note">
        <app-dummy-data-editor projectId="sectorreports" />
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

          @if (criticalCount() > 0) {
            <div class="alert-banner">
              <span class="ab-icon">🚨</span>
              <div class="ab-body">
                <b>{{ criticalCount() }} critical incident{{ criticalCount() > 1 ? 's' : '' }} need immediate attention</b>
                <small>High priority response required</small>
              </div>
              <button class="ab-action" (click)="active.set('incidents')">View incidents</button>
            </div>
          }

          <div class="grid-2">
            <section class="chart-card">
              <header>
                <div>
                  <h4>Operations status</h4>
                  <span class="muted mono">{{ operations().length }} total</span>
                </div>
              </header>
              <div class="status-donut">
                @for (s of statusSummary(); track s.label) {
                  <div class="donut-row" (click)="filterByStatus(s.id)">
                    <span class="dr-dot" [style.background]="s.color"></span>
                    <span class="dr-label">{{ s.label }}</span>
                    <div class="dr-bar"><div class="dr-fill" [style.width.%]="s.pct" [style.background]="s.color"></div></div>
                    <span class="dr-count mono">{{ s.count }}</span>
                  </div>
                }
              </div>
            </section>

            <section class="chart-card">
              <header>
                <div>
                  <h4>Operations by type</h4>
                  <span class="muted mono">{{ operations().length }} total</span>
                </div>
              </header>
              <div class="status-donut">
                @for (t of typeSummary(); track t.label) {
                  <div class="donut-row">
                    <span class="dr-icon">{{ t.icon }}</span>
                    <span class="dr-label">{{ t.label }}</span>
                    <div class="dr-bar"><div class="dr-fill" [style.width.%]="t.pct" style="background:var(--accent)"></div></div>
                    <span class="dr-count mono">{{ t.count }}</span>
                  </div>
                }
              </div>
            </section>
          </div>

          <section class="live-feed">
            <header class="lf-head">
              <div>
                <h4>Recent activity</h4>
                <span class="muted">Live operational log</span>
              </div>
              <button class="pill-sm" (click)="active.set('activity')">View all →</button>
            </header>
            <div class="lf-list">
              @for (a of log().slice(0, 6); track a.id) {
                <div class="lf-item">
                  <span class="lf-icon" [style.background]="a.color + '22'" [style.color]="a.color">{{ a.icon }}</span>
                  <div class="lf-body">
                    <div class="lf-title-row">
                      <b>{{ sectorName(a.sectorId) }}</b>
                      <span class="lf-action" [style.color]="a.color">{{ a.action }}</span>
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

          <section class="ops-grid">
            <header class="og-head">
              <div>
                <h4>Active operations</h4>
                <span class="muted">{{ activeOps().length }} in progress</span>
              </div>
              <button class="pill-sm" (click)="active.set('operations')">View all →</button>
            </header>
            <div class="og-grid">
              @for (op of activeOps().slice(0, 6); track op.id) {
                <article class="op-mini" [style.--c]="sectorColor(op.sectorId)" (click)="openOperation(op.id)">
                  <header>
                    <span class="op-code mono">{{ op.code }}</span>
                    <span class="pri-badge" [attr.data-p]="op.priority">{{ op.priority }}</span>
                  </header>
                  <b>{{ op.name }}</b>
                  <p class="op-sector">📍 {{ sectorName(op.sectorId) }}</p>
                  <div class="op-progress">
                    <div class="opp-bar"><div class="opp-fill" [style.width.%]="op.progress" [style.background]="sectorColor(op.sectorId)"></div></div>
                    <span class="mono">{{ op.progress }}%</span>
                  </div>
                  <footer class="op-foot">
                    <span>👥 {{ op.personnel }}</span>
                    <span>🚗 {{ op.vehicles }}</span>
                  </footer>
                </article>
              }
            </div>
          </section>

          <div class="grid-2">
            <section class="info-card">
              <header><h4>Recent incidents</h4></header>
              @for (i of recentIncidents().slice(0, 5); track i.id) {
                <div class="incident-row" (click)="openIncident(i.id)">
                  <span class="ir-sev" [attr.data-s]="i.severity">{{ i.severity.charAt(0).toUpperCase() }}</span>
                  <div class="ir-info">
                    <b>{{ i.title }}</b>
                    <small>{{ sectorName(i.sectorId) }} · {{ timeAgo(i.reportedAt) }}</small>
                  </div>
                  <span class="ir-status" [attr.data-s]="i.status">{{ i.status }}</span>
                </div>
              }
            </section>

            <section class="info-card">
              <header><h4>Sector readiness</h4></header>
              @for (s of sectors.slice(0, 5); track s.id) {
                <div class="sector-row" (click)="openSector(s.id)">
                  <span class="sr-icon" [style.background]="s.color + '22'" [style.color]="s.color">{{ s.icon }}</span>
                  <div class="sr-info">
                    <b>{{ s.name }}</b>
                    <small class="mono">{{ s.code }} · {{ s.activeOps }} ops</small>
                  </div>
                  <div class="sr-bar-mini">
                    <div class="sr-fill" [style.width.%]="s.readiness" [style.background]="s.color"></div>
                  </div>
                  <span class="sr-pct mono">{{ s.readiness }}%</span>
                </div>
              }
            </section>
          </div>
        </div>
      }

      @else if (active() === 'operations') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Operations Center</h3>
              <p>{{ filteredOperations().length }} of {{ operations().length }} operations</p>
            </div>
            <div class="view-toggle">
              <button class="vt" [class.active]="opsView() === 'table'" (click)="opsView.set('table')" title="Table">☰</button>
              <button class="vt" [class.active]="opsView() === 'cards'" (click)="opsView.set('cards')" title="Cards">▦</button>
            </div>
          </header>

          <div class="filter-row">
            <div class="filter-tabs">
              @for (f of statusFilters; track f.id) {
                <button class="ftab" [class.active]="statusFilter() === f.id" (click)="statusFilter.set(f.id)">
                  <span>{{ f.icon }}</span>
                  <span>{{ f.label }}</span>
                  <span class="ftab-count">{{ countOpsByStatus(f.id) }}</span>
                </button>
              }
            </div>
            <div class="chip-filters">
              <select class="sel" [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)">
                @for (t of typeFilters; track t.id) {
                  <option [value]="t.id">{{ t.icon }} {{ t.label }}</option>
                }
              </select>
              <select class="sel" [ngModel]="sectorFilter()" (ngModelChange)="sectorFilter.set($event)">
                <option value="all">All sectors</option>
                @for (s of sectors; track s.id) {
                  <option [value]="s.id">{{ s.icon }} {{ s.name }}</option>
                }
              </select>
              <select class="sel" [ngModel]="priorityFilter()" (ngModelChange)="priorityFilter.set($event)">
                <option value="all">All priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          @if (opsView() === 'table') {
            <div class="table-wrap">
              <header class="thead">
                <span class="th">Code</span>
                <span class="th sortable" (click)="sortBy('name')">Operation {{ sortIcon('name') }}</span>
                <span class="th">Sector</span>
                <span class="th">Type</span>
                <span class="th">Priority</span>
                <span class="th sortable" (click)="sortBy('progress')">Progress {{ sortIcon('progress') }}</span>
                <span class="th">Status</span>
                <span class="th"></span>
              </header>
              @for (op of pagedOps(); track op.id) {
                <div class="trow" (click)="openOperation(op.id)" (contextmenu)="onOperationContext($event, op)">
                  <span class="td mono op-code-cell">{{ op.code }}</span>
                  <span class="td name-cell">
                    <span class="avatar-m" [style.background]="sectorColor(op.sectorId) + '22'" [style.color]="sectorColor(op.sectorId)">
                      {{ op.name.charAt(0) }}
                    </span>
                    <div>
                      <b>{{ op.name }}</b>
                      <small>{{ op.location }}</small>
                    </div>
                  </span>
                  <span class="td"><span class="sector-tag" [style.--c]="sectorColor(op.sectorId)">{{ sectorCode(op.sectorId) }}</span></span>
                  <span class="td"><span class="type-tag">{{ typeIcon(op.type) }} {{ op.type }}</span></span>
                  <span class="td"><span class="pri-badge" [attr.data-p]="op.priority">{{ op.priority }}</span></span>
                  <span class="td progress-cell">
                    <div class="prog-bar"><div class="prog-fill" [style.width.%]="op.progress" [style.background]="sectorColor(op.sectorId)"></div></div>
                    <span class="mono">{{ op.progress }}%</span>
                  </span>
                  <span class="td"><span class="st" [attr.data-s]="op.status">{{ op.status }}</span></span>
                  <span class="td actions-cell">
                    <button class="row-action" title="View" (click)="$event.stopPropagation(); openOperation(op.id)">👁</button>
                    <button class="row-action" title="Edit" (click)="$event.stopPropagation(); editOperation(op)">✎</button>
                  </span>
                </div>
              } @empty {
                <div class="empty-mini">No operations match your filters</div>
              }
            </div>

            @if (filteredOperations().length > pageSize) {
              <footer class="pagination">
                <span class="page-info">
                  Showing {{ (page() - 1) * pageSize + 1 }}–{{ Math.min(page() * pageSize, filteredOperations().length) }}
                  of {{ filteredOperations().length }}
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
            <div class="ops-card-grid">
              @for (op of pagedOps(); track op.id) {
                <article class="op-card" [attr.data-p]="op.priority" (click)="openOperation(op.id)" (contextmenu)="onOperationContext($event, op)">
                  <header class="oc-head">
                    <span class="oc-code mono">{{ op.code }}</span>
                    <span class="pri-badge" [attr.data-p]="op.priority">{{ op.priority }}</span>
                  </header>
                  <b class="oc-name">{{ op.name }}</b>
                  <p class="oc-ar" dir="rtl">{{ op.nameAr }}</p>
                  <div class="oc-meta">
                    <span>📍 {{ sectorName(op.sectorId) }}</span>
                    <span>👤 {{ op.commander }}</span>
                  </div>
                  <div class="oc-progress">
                    <div class="ocp-bar"><div class="ocp-fill" [style.width.%]="op.progress" [style.background]="sectorColor(op.sectorId)"></div></div>
                    <span class="mono">{{ op.progress }}%</span>
                  </div>
                  <div class="oc-stats">
                    <div class="oc-stat"><span>👥</span><b>{{ op.personnel }}</b><small>Personnel</small></div>
                    <div class="oc-stat"><span>🚗</span><b>{{ op.vehicles }}</b><small>Vehicles</small></div>
                  </div>
                  <footer class="oc-foot">
                    <span class="st small" [attr.data-s]="op.status">{{ op.status }}</span>
                    <span class="mono small">📅 {{ op.startDate }}</span>
                  </footer>
                </article>
              }
            </div>
          }
        </div>
      }

      @else if (active() === 'incidents') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Incident Reports</h3>
              <p>{{ filteredIncidents().length }} of {{ incidents().length }} incidents</p>
            </div>
          </header>

          <div class="filter-tabs">
            @for (f of incidentStatusFilters; track f.id) {
              <button class="ftab" [class.active]="incidentStatusFilter() === f.id" (click)="incidentStatusFilter.set(f.id)">
                <span>{{ f.icon }}</span>
                <span>{{ f.label }}</span>
                <span class="ftab-count">{{ countIncidentsBy(f.id) }}</span>
              </button>
            }
          </div>

          <div class="severity-filters">
            @for (s of severityFilters; track s.id) {
              <button class="sev-chip" [class.active]="severityFilter() === s.id" [attr.data-s]="s.id" (click)="severityFilter.set(s.id)">
                <span>{{ s.icon }}</span>
                <span>{{ s.label }}</span>
                <span class="sev-count">{{ countIncidentsBySeverity(s.id) }}</span>
              </button>
            }
          </div>

          <div class="incidents-list">
            @for (i of filteredIncidents(); track i.id) {
              <article class="incident-card" [attr.data-s]="i.severity" (click)="openIncident(i.id)" (contextmenu)="onIncidentContext($event, i)">
                <div class="ic-left" [style.background]="severityColor(i.severity) + '15'">
                  <span class="ic-sev-icon">{{ severityIcon(i.severity) }}</span>
                  <span class="ic-id mono">{{ i.id }}</span>
                </div>
                <div class="ic-body">
                  <div class="ic-head">
                    <b>{{ i.title }}</b>
                    <div class="ic-tags">
                      <span class="sev-badge" [attr.data-s]="i.severity">{{ i.severity }}</span>
                      <span class="st" [attr.data-s]="i.status">{{ i.status }}</span>
                    </div>
                  </div>
                  <p>{{ i.description }}</p>
                  <div class="ic-meta">
                    <span class="ic-meta-item">
                      <span class="avatar-m">{{ initials(i.reportedBy) }}</span>
                      {{ i.reportedBy }}
                    </span>
                    <span class="ic-meta-item">📍 {{ i.location }}</span>
                    <span class="ic-meta-item">🏛 {{ sectorName(i.sectorId) }}</span>
                    <span class="ic-meta-item">🕐 {{ timeAgo(i.reportedAt) }}</span>
                  </div>
                </div>
                <div class="ic-actions">
                  @if (i.status === 'reported') {
                    <button class="ic-btn warn" (click)="$event.stopPropagation(); investigateIncident(i.id)" title="Investigate">🔍</button>
                  }
                  @if (i.status !== 'resolved' && i.status !== 'closed') {
                    <button class="ic-btn ok" (click)="$event.stopPropagation(); resolveIncident(i.id)" title="Resolve">✓</button>
                  }
                  <button class="ic-btn" (click)="$event.stopPropagation(); openIncident(i.id)" title="View">👁</button>
                </div>
              </article>
            } @empty {
              <div class="empty-mini full">No incidents match your filters</div>
            }
          </div>
        </div>
      }

      @else if (active() === 'reports') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Reports Center</h3>
              <p>{{ filteredReports().length }} of {{ reports().length }} reports</p>
            </div>
            <button class="pill primary" (click)="createReport()">＋ New Report</button>
          </header>

          <div class="filter-row">
            <div class="filter-tabs">
              @for (f of reportStatusFilters; track f.id) {
                <button class="ftab" [class.active]="reportStatusFilter() === f.id" (click)="reportStatusFilter.set(f.id)">
                  <span>{{ f.icon }}</span>
                  <span>{{ f.label }}</span>
                  <span class="ftab-count">{{ countReportsBy(f.id) }}</span>
                </button>
              }
            </div>
            <div class="chip-filters">
              <select class="sel" [ngModel]="reportTypeFilter()" (ngModelChange)="reportTypeFilter.set($event)">
                @for (t of reportTypeFilters; track t.id) {
                  <option [value]="t.id">{{ t.icon }} {{ t.label }}</option>
                }
              </select>
            </div>
          </div>

          <div class="reports-grid">
            @for (r of filteredReports(); track r.id) {
              <article class="report-card" [attr.data-c]="r.classification" (click)="openReport(r.id)" (contextmenu)="onReportContext($event, r)">
                <header class="rc-head">
                  <span class="rc-icon" [style.background]="classificationColor(r.classification) + '22'" [style.color]="classificationColor(r.classification)">
                    📄
                  </span>
                  <div>
                    <b>{{ r.title }}</b>
                    <p class="rc-ar" dir="rtl">{{ r.titleAr }}</p>
                  </div>
                  <span class="rc-class" [attr.data-c]="r.classification">{{ r.classification }}</span>
                </header>
                <div class="rc-meta">
                  <span>📁 {{ sectorName(r.sectorId) }}</span>
                  <span>📄 {{ r.pages }} pages</span>
                  <span>👤 {{ r.author }}</span>
                </div>
                <p class="rc-summary">{{ r.summary }}</p>
                <footer class="rc-foot">
                  <span class="st small" [attr.data-s]="r.status">{{ r.status }}</span>
                  <span class="mono small">🕐 {{ timeAgo(r.createdAt) }}</span>
                </footer>
              </article>
            } @empty {
              <div class="empty-mini full">No reports match your filters</div>
            }
          </div>
        </div>
      }

      @else if (active() === 'resources') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Resources & Assets</h3>
              <p>{{ resources.length }} resource categories · {{ totalResourceUnits() }} total units</p>
            </div>
          </header>

          <div class="resource-filters">
            @for (t of resourceTypeFilters; track t.id) {
              <button class="rf-chip" [class.active]="resourceTypeFilter() === t.id" (click)="resourceTypeFilter.set(t.id)">
                <span>{{ t.icon }}</span>
                <span>{{ t.label }}</span>
                <span class="rf-count">{{ countResourcesByType(t.id) }}</span>
              </button>
            }
          </div>

          <div class="resource-kpis">
            <div class="res-kpi"><span class="rk-icon">📦</span><b>{{ totalResourceUnits() }}</b><small>Total units</small></div>
            <div class="res-kpi ok"><span class="rk-icon">✅</span><b>{{ operationalCount() }}</b><small>Operational</small></div>
            <div class="res-kpi warn"><span class="rk-icon">⚠️</span><b>{{ limitedCount() }}</b><small>Limited</small></div>
            <div class="res-kpi danger"><span class="rk-icon">🚫</span><b>{{ criticalResourceCount() }}</b><small>Critical</small></div>
          </div>

          <div class="resource-grid">
            @for (r of filteredResources(); track r.id) {
              <article class="resource-card" [attr.data-s]="r.status" (click)="openResource(r.id)" (contextmenu)="onResourceContext($event, r)">
                <header class="res-head">
                  <span class="res-icon" [style.background]="sectorColor(r.sectorId) + '22'" [style.color]="sectorColor(r.sectorId)">
                    {{ typeIconRes(r.type) }}
                  </span>
                  <div>
                    <b>{{ r.name }}</b>
                    <small>{{ sectorName(r.sectorId) }}</small>
                  </div>
                  <span class="res-status" [attr.data-s]="r.status">{{ r.status }}</span>
                </header>
                <div class="res-stats">
                  <div class="res-stat">
                    <span class="rs-num mono">{{ r.quantity }}</span>
                    <small>Total</small>
                  </div>
                  <div class="res-stat ok">
                    <span class="rs-num mono">{{ r.available }}</span>
                    <small>Available</small>
                  </div>
                  <div class="res-stat warn">
                    <span class="rs-num mono">{{ r.deployed }}</span>
                    <small>Deployed</small>
                  </div>
                  <div class="res-stat">
                    <span class="rs-num mono">{{ r.maintenance }}</span>
                    <small>Repair</small>
                  </div>
                </div>
                <div class="res-progress">
                  <div class="rp-bar">
                    <div class="rp-fill ok" [style.width.%]="(r.available / r.quantity) * 100"></div>
                    <div class="rp-fill warn" [style.width.%]="(r.deployed / r.quantity) * 100"></div>
                    <div class="rp-fill danger" [style.width.%]="(r.maintenance / r.quantity) * 100"></div>
                  </div>
                  <span class="mono">{{ Math.round((r.available / r.quantity) * 100) }}% available</span>
                </div>
              </article>
            }
          </div>
        </div>
      }

      @else if (active() === 'activity') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Activity Log</h3>
              <p>{{ log().length }} events · Complete audit trail</p>
            </div>
          </header>

          <div class="activity-filters">
            @for (f of activityFilters; track f.id) {
              <button class="af-chip" [class.active]="activityFilter() === f.id" (click)="activityFilter.set(f.id)">
                <span>{{ f.icon }}</span>
                <span>{{ f.label }}</span>
                <span class="af-count">{{ countActivityBy(f.id) }}</span>
              </button>
            }
          </div>

          <div class="activity-timeline">
            @for (a of filteredActivity(); track a.id) {
              <div class="timeline-item">
                <span class="tl-time mono">{{ timeAgo(a.timestamp) }}</span>
                <span class="tl-dot" [style.background]="a.color"></span>
                <div class="tl-body">
                  <div class="tl-head">
                    <span class="tl-icon" [style.background]="a.color + '22'" [style.color]="a.color">{{ a.icon }}</span>
                    <div>
                      <b>{{ sectorName(a.sectorId) }}</b>
                      <span class="tl-action" [style.color]="a.color">{{ a.action }}</span>
                    </div>
                  </div>
                  <p>{{ a.description }}</p>
                  <div class="tl-meta">
                    <span>👤 {{ a.by }}</span>
                    <span>·</span>
                    <span class="mono">{{ formatDate(a.timestamp) }}</span>
                    @if (a.operationId) {
                      <span>·</span>
                      <span class="mono">OP: {{ a.operationId }}</span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      @else if (active() === 'analytics') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Analytics & Reports</h3>
              <p>Comprehensive operations insights</p>
            </div>
            <button class="pill primary" (click)="generatePdfReport()">📄 Generate PDF</button>
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
            <header><h4>Operations by sector</h4></header>
            @for (s of sectors; track s.id) {
              <div class="sector-chart-row" (click)="openSector(s.id)">
                <span class="scr-name">{{ s.name }}</span>
                <div class="scr-bar">
                  <div class="scr-fill" [style.width.%]="(opsInSector(s.id).length / maxSectorOps()) * 100" [style.background]="s.color"></div>
                </div>
                <span class="scr-count mono">{{ opsInSector(s.id).length }}</span>
                <span class="scr-pct mono" [style.color]="s.color">{{ s.readiness }}%</span>
              </div>
            }
          </section>

          <div class="grid-2">
            <section class="info-card">
              <header><h4>Priority breakdown</h4></header>
              @for (p of priorityBreakdown(); track p.label) {
                <div class="breakdown-row">
                  <span class="bd-dot" [style.background]="p.color"></span>
                  <span class="bd-label">{{ p.label }}</span>
                  <div class="bd-bar"><div class="bd-fill" [style.width.%]="p.pct" [style.background]="p.color"></div></div>
                  <span class="bd-val mono">{{ p.count }}</span>
                </div>
              }
            </section>

            <section class="info-card">
              <header><h4>Incident severity</h4></header>
              @for (s of severityBreakdown(); track s.label) {
                <div class="breakdown-row">
                  <span class="bd-icon" [style.color]="s.color">{{ s.icon }}</span>
                  <span class="bd-label">{{ s.label }}</span>
                  <div class="bd-bar"><div class="bd-fill" [style.width.%]="s.pct" [style.background]="s.color"></div></div>
                  <span class="bd-val mono">{{ s.count }}</span>
                </div>
              }
            </section>
          </div>

          <div class="grid-2">
            <section class="info-card">
              <header><h4>Report classifications</h4></header>
              @for (c of classificationBreakdown(); track c.label) {
                <div class="breakdown-row">
                  <span class="bd-icon">📄</span>
                  <span class="bd-label">{{ c.label }}</span>
                  <div class="bd-bar"><div class="bd-fill" [style.width.%]="c.pct" [style.background]="c.color"></div></div>
                  <span class="bd-val mono">{{ c.count }}</span>
                </div>
              }
            </section>

            <section class="info-card">
              <header><h4>Resource status</h4></header>
              @for (r of resourceStatusBreakdown(); track r.label) {
                <div class="breakdown-row">
                  <span class="bd-icon">{{ r.icon }}</span>
                  <span class="bd-label">{{ r.label }}</span>
                  <div class="bd-bar"><div class="bd-fill" [style.width.%]="r.pct" [style.background]="r.color"></div></div>
                  <span class="bd-val mono">{{ r.count }}</span>
                </div>
              }
            </section>
          </div>

          <section class="info-card">
            <header><h4>Top active sectors</h4></header>
            @for (s of topActiveSectors(); track s.sector.id; let i = $index) {
              <div class="top-row" (click)="openSector(s.sector.id)">
                <span class="top-rank">{{ i + 1 }}</span>
                <span class="avatar-m" [style.background]="s.sector.color + '22'" [style.color]="s.sector.color">{{ s.sector.icon }}</span>
                <div>
                  <b>{{ s.sector.name }}</b>
                  <small>{{ s.sector.commander }}</small>
                </div>
                <span class="top-count mono">{{ s.ops }} ops</span>
              </div>
            }
          </section>
        </div>
      }

      @if (selectedOperation(); as op) {
        <div class="modal-backdrop" (click)="selectedOperation.set(null)">
          <div class="modal op-modal" (click)="$event.stopPropagation()">
            <header class="modal-head" [style.borderBottomColor]="sectorColor(op.sectorId)">
              <span class="modal-icon" [style.background]="sectorColor(op.sectorId) + '22'" [style.color]="sectorColor(op.sectorId)">
                {{ typeIcon(op.type) }}
              </span>
              <div>
                <h3>{{ op.name }}</h3>
                <p class="mono">{{ op.code }} · {{ op.location }}</p>
              </div>
              <span class="pri-badge" [attr.data-p]="op.priority">{{ op.priority }}</span>
              <button class="modal-close" (click)="selectedOperation.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="om-progress-bar">
                <div class="omb-head">
                  <span>Progress</span>
                  <b class="mono">{{ op.progress }}%</b>
                </div>
                <div class="omb-track">
                  <div class="omb-fill" [style.width.%]="op.progress" [style.background]="sectorColor(op.sectorId)"></div>
                </div>
              </div>

              <div class="om-grid">
                <div class="om-section"><span class="om-label">Operation Name (AR)</span><b dir="rtl">{{ op.nameAr }}</b></div>
                <div class="om-section"><span class="om-label">Commander</span><b>{{ op.commander }}</b></div>
                <div class="om-section"><span class="om-label">Sector</span><b>{{ sectorName(op.sectorId) }}</b></div>
                <div class="om-section"><span class="om-label">Type</span><b>{{ typeIcon(op.type) }} {{ op.type }}</b></div>
                <div class="om-section"><span class="om-label">Start date</span><b class="mono">{{ op.startDate }}</b></div>
                <div class="om-section"><span class="om-label">End date</span><b class="mono">{{ op.endDate }}</b></div>
                <div class="om-section"><span class="om-label">Personnel</span><b>{{ op.personnel }}</b></div>
                <div class="om-section"><span class="om-label">Vehicles</span><b>{{ op.vehicles }}</b></div>
                <div class="om-section"><span class="om-label">Status</span><span class="st" [attr.data-s]="op.status">{{ op.status }}</span></div>
                <div class="om-section"><span class="om-label">Coordinates</span><b class="mono">{{ op.coordinates.lat.toFixed(3) }}, {{ op.coordinates.lng.toFixed(3) }}</b></div>
              </div>

              <div class="om-block">
                <span class="om-label">Description</span>
                <p>{{ op.description }}</p>
              </div>

              <div class="om-block">
                <span class="om-label">Objectives</span>
                <ul class="objectives-list">
                  @for (o of op.objectives; track o) {
                    <li><span class="obj-check">✓</span> {{ o }}</li>
                  }
                </ul>
              </div>

              <div class="om-block">
                <span class="om-label">Resources</span>
                <div class="resources-chips">
                  @for (r of op.resources; track r) {
                    <span class="res-chip">{{ r }}</span>
                  }
                </div>
              </div>

              @if (incidentsForOperation(op.id).length) {
                <div class="om-block">
                  <span class="om-label">Related incidents ({{ incidentsForOperation(op.id).length }})</span>
                  @for (i of incidentsForOperation(op.id); track i.id) {
                    <div class="mini-incident" (click)="openIncident(i.id)">
                      <span class="mi-sev" [attr.data-s]="i.severity">{{ i.severity.charAt(0).toUpperCase() }}</span>
                      <span class="mi-title">{{ i.title }}</span>
                      <span class="st small" [attr.data-s]="i.status">{{ i.status }}</span>
                    </div>
                  }
                </div>
              }
            </div>
            <footer class="modal-foot">
              @if (op.status === 'planned') {
                <button class="mf-btn primary" (click)="startOperation(op.id)">▶ Start Operation</button>
              } @else if (op.status === 'active') {
                <button class="mf-btn warn" (click)="pauseOperation(op.id)">⏸ Pause</button>
                <button class="mf-btn ok" (click)="completeOperation(op.id)">✓ Complete</button>
              } @else if (op.status === 'paused') {
                <button class="mf-btn primary" (click)="resumeOperation(op.id)">▶ Resume</button>
              }
              <button class="mf-btn" (click)="printOperation(op)">🖨 Print</button>
              <button class="mf-btn" (click)="exportOperation(op)">📄 Export</button>
            </footer>
          </div>
        </div>
      }

      @if (selectedIncident(); as i) {
        <div class="modal-backdrop" (click)="selectedIncident.set(null)">
          <div class="modal inc-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon" [style.background]="severityColor(i.severity) + '22'" [style.color]="severityColor(i.severity)">
                {{ severityIcon(i.severity) }}
              </span>
              <div>
                <h3>{{ i.title }}</h3>
                <p class="mono">{{ i.id }} · {{ i.location }}</p>
              </div>
              <span class="sev-badge" [attr.data-s]="i.severity">{{ i.severity }}</span>
              <button class="modal-close" (click)="selectedIncident.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="om-grid">
                <div class="om-section"><span class="om-label">Type</span><b>{{ i.type }}</b></div>
                <div class="om-section"><span class="om-label">Severity</span><span class="sev-badge" [attr.data-s]="i.severity">{{ i.severity }}</span></div>
                <div class="om-section"><span class="om-label">Sector</span><b>{{ sectorName(i.sectorId) }}</b></div>
                <div class="om-section"><span class="om-label">Reported by</span><b>{{ i.reportedBy }}</b></div>
                <div class="om-section"><span class="om-label">Reported at</span><b class="mono">{{ formatDate(i.reportedAt) }}</b></div>
                <div class="om-section"><span class="om-label">Status</span><span class="st" [attr.data-s]="i.status">{{ i.status }}</span></div>
                @if (i.resolvedAt) {
                  <div class="om-section"><span class="om-label">Resolved at</span><b class="mono">{{ formatDate(i.resolvedAt) }}</b></div>
                }
              </div>

              <div class="om-block">
                <span class="om-label">Description</span>
                <p>{{ i.description }}</p>
              </div>

              @if (operationById(i.operationId); as op) {
                <div class="om-block">
                  <span class="om-label">Related operation</span>
                  <div class="related-op" (click)="openOperation(op.id)">
                    <span class="mono ro-code">{{ op.code }}</span>
                    <b>{{ op.name }}</b>
                    <span class="st small" [attr.data-s]="op.status">{{ op.status }}</span>
                  </div>
                </div>
              }
            </div>
            <footer class="modal-foot">
              @if (i.status === 'reported') {
                <button class="mf-btn warn" (click)="investigateIncident(i.id)">🔍 Investigate</button>
              }
              @if (i.status !== 'resolved' && i.status !== 'closed') {
                <button class="mf-btn ok" (click)="resolveIncident(i.id)">✓ Resolve</button>
              }
              @if (i.status === 'resolved') {
                <button class="mf-btn" (click)="closeIncident(i.id)">🔒 Close</button>
              }
            </footer>
          </div>
        </div>
      }

      @if (selectedReport(); as r) {
        <div class="modal-backdrop" (click)="selectedReport.set(null)">
          <div class="modal rpt-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon" [style.background]="classificationColor(r.classification) + '22'" [style.color]="classificationColor(r.classification)">
                📄
              </span>
              <div>
                <h3>{{ r.title }}</h3>
                <p dir="rtl">{{ r.titleAr }}</p>
              </div>
              <span class="rc-class" [attr.data-c]="r.classification">{{ r.classification }}</span>
              <button class="modal-close" (click)="selectedReport.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="om-grid">
                <div class="om-section"><span class="om-label">Report ID</span><b class="mono">{{ r.id }}</b></div>
                <div class="om-section"><span class="om-label">Type</span><b>{{ r.type }}</b></div>
                <div class="om-section"><span class="om-label">Sector</span><b>{{ sectorName(r.sectorId) }}</b></div>
                <div class="om-section"><span class="om-label">Author</span><b>{{ r.author }}</b></div>
                <div class="om-section"><span class="om-label">Created</span><b class="mono">{{ formatDate(r.createdAt) }}</b></div>
                <div class="om-section"><span class="om-label">Pages</span><b>{{ r.pages }}</b></div>
                @if (r.submittedAt) {
                  <div class="om-section"><span class="om-label">Submitted</span><b class="mono">{{ formatDate(r.submittedAt) }}</b></div>
                }
                @if (r.approvedAt) {
                  <div class="om-section"><span class="om-label">Approved</span><b class="mono">{{ formatDate(r.approvedAt) }}</b></div>
                }
              </div>

              <div class="om-block">
                <span class="om-label">Summary</span>
                <p>{{ r.summary }}</p>
              </div>
            </div>
            <footer class="modal-foot">
              @if (r.status === 'draft') {
                <button class="mf-btn primary" (click)="submitReport(r.id)">📤 Submit Report</button>
              }
              @if (r.status === 'submitted') {
                <button class="mf-btn ok" (click)="approveReport(r.id)">✓ Approve</button>
              }
              <button class="mf-btn" (click)="downloadReport(r)">📥 Download</button>
            </footer>
          </div>
        </div>
      }

      @if (selectedResource(); as r) {
        <div class="modal-backdrop" (click)="selectedResource.set(null)">
          <div class="modal res-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon" [style.background]="sectorColor(r.sectorId) + '22'" [style.color]="sectorColor(r.sectorId)">
                {{ typeIconRes(r.type) }}
              </span>
              <div>
                <h3>{{ r.name }}</h3>
                <p>{{ sectorName(r.sectorId) }} · {{ r.type }}</p>
              </div>
              <span class="res-status" [attr.data-s]="r.status">{{ r.status }}</span>
              <button class="modal-close" (click)="selectedResource.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="sec-stats">
                <div class="sec-stat"><b>{{ r.quantity }}</b><small>Total</small></div>
                <div class="sec-stat ok"><b>{{ r.available }}</b><small>Available</small></div>
                <div class="sec-stat warn"><b>{{ r.deployed }}</b><small>Deployed</small></div>
                <div class="sec-stat danger"><b>{{ r.maintenance }}</b><small>Repair</small></div>
              </div>
              <div class="om-block">
                <span class="om-label">Utilization</span>
                <div class="res-progress">
                  <div class="rp-bar">
                    <div class="rp-fill ok" [style.width.%]="(r.available / r.quantity) * 100"></div>
                    <div class="rp-fill warn" [style.width.%]="(r.deployed / r.quantity) * 100"></div>
                    <div class="rp-fill danger" [style.width.%]="(r.maintenance / r.quantity) * 100"></div>
                  </div>
                </div>
                <div class="legend-row">
                  <span><i class="dot" style="background:#34c759"></i> Available</span>
                  <span><i class="dot" style="background:#ff9500"></i> Deployed</span>
                  <span><i class="dot" style="background:#ff3b30"></i> Maintenance</span>
                </div>
              </div>
            </div>
            <footer class="modal-foot">
              <button class="mf-btn primary" (click)="requestResource(r.id)">📦 Request More</button>
              <button class="mf-btn" (click)="scheduleMaintenance(r.id)">🔧 Schedule Repair</button>
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
                <div class="sec-stat"><b>{{ s.activeOps }}</b><small>Active ops</small></div>
                <div class="sec-stat"><b>{{ s.personnelDeployed }}</b><small>Personnel</small></div>
                <div class="sec-stat"><b>{{ s.readiness }}%</b><small>Readiness</small></div>
                <div class="sec-stat"><b>{{ opsInSector(s.id).length }}</b><small>Total ops</small></div>
              </div>

              <div class="sec-info">
                <div class="si-row"><span>Commander</span><b>{{ s.commander }}</b></div>
                <div class="si-row"><span>Region</span><b>{{ s.region }}</b></div>
              </div>

              <div class="om-block">
                <span class="om-label">Active operations ({{ opsInSector(s.id).length }})</span>
                @for (op of opsInSector(s.id).slice(0, 6); track op.id) {
                  <div class="mini-incident" (click)="openOperation(op.id)">
                    <span class="mono mi-sev-2">{{ op.code }}</span>
                    <span class="mi-title">{{ op.name }}</span>
                    <span class="st small" [attr.data-s]="op.status">{{ op.status }}</span>
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
    .danger { color: #ff3b30; }
    .preview-note { margin-bottom: 20px; }
    .view { max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
    .kpi { padding: 16px; background: var(--bg-surface-solid);
           border: 0.5px solid var(--separator); border-radius: var(--r-md);
           border-left: 3px solid var(--c); cursor: pointer;
           transition: transform var(--t-base), box-shadow var(--t-base); }
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

    .alert-banner { display: flex; align-items: center; gap: 14px; padding: 16px 20px;
                    background: rgba(255, 59, 48, 0.08);
                    border: 1px solid rgba(255, 59, 48, 0.25);
                    border-radius: var(--r-md);
                    animation: pulse-banner 2s infinite; }
    @keyframes pulse-banner {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.3); }
      50% { box-shadow: 0 0 0 8px rgba(255, 59, 48, 0); }
    }
    .ab-icon { font-size: 24px; }
    .ab-body { flex: 1; }
    .ab-body b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .ab-body small { font-size: var(--fs-2xs); color: var(--label-2); }
    .ab-action { padding: 8px 16px; background: #ff3b30; color: #fff;
                 border: 0; border-radius: var(--r-pill);
                 font-size: var(--fs-xs); font-weight: 700; cursor: pointer; }
    .ab-action:hover { background: #d70015; }

    .chart-card { padding: 24px; background: var(--bg-surface-solid);
                  border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .chart-card > header { margin-bottom: 20px; }
    .chart-card h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .chart-card header .muted { font-size: var(--fs-2xs); display: block; margin-top: 3px; }
    .status-donut { display: flex; flex-direction: column; gap: 12px; }
    .donut-row { display: grid; grid-template-columns: 20px 110px 1fr 40px;
                 gap: 12px; align-items: center; font-size: var(--fs-xs);
                 cursor: pointer; padding: 4px 6px; border-radius: var(--r-xs);
                 transition: background var(--t-fast); }
    .donut-row:hover { background: var(--bg-hover); }
    .dr-dot { width: 10px; height: 10px; border-radius: 50%; }
    .dr-icon { font-size: 16px; text-align: center; }
    .dr-label { color: var(--label-2); }
    .dr-bar { height: 8px; background: var(--bg-fill-2); border-radius: var(--r-pill);
              overflow: hidden; }
    .dr-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms var(--ease-out); }
    .dr-count { text-align: right; font-weight: 700; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 820px) { .grid-2 { grid-template-columns: 1fr; } }

    .live-feed { padding: 24px; background: var(--bg-surface-solid);
                 border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .lf-head { display: flex; justify-content: space-between; align-items: flex-end;
               margin-bottom: 14px; flex-wrap: wrap; gap: 12px; }
    .lf-head h4 { font-size: var(--fs-base); font-weight: 700; }
    .lf-head .muted { font-size: var(--fs-2xs); display: block; margin-top: 3px; }
    .lf-list { display: flex; flex-direction: column; gap: 6px; }
    .lf-item { display: grid; grid-template-columns: 44px 1fr;
               gap: 12px; align-items: center; padding: 12px;
               background: var(--bg-fill-2); border-radius: var(--r-sm);
               transition: background var(--t-base); }
    .lf-item:hover { background: var(--bg-fill-3); }
    .lf-icon { width: 44px; height: 44px; display: grid; place-items: center;
               border-radius: var(--r-sm); font-size: 20px; }
    .lf-body { min-width: 0; }
    .lf-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
    .lf-title-row b { font-size: var(--fs-xs); font-weight: 700; }
    .lf-action { font-size: 9px; font-weight: 800; text-transform: uppercase;
                 letter-spacing: 0.04em; }
    .lf-body p { font-size: 10px; color: var(--label-2); margin-bottom: 4px; }
    .lf-meta { display: flex; gap: 12px; font-size: 10px; color: var(--label-3); }

    .ops-grid { padding: 24px; background: var(--bg-surface-solid);
                border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .og-head { display: flex; justify-content: space-between; align-items: flex-end;
               margin-bottom: 14px; flex-wrap: wrap; gap: 12px; }
    .og-head h4 { font-size: var(--fs-base); font-weight: 700; }
    .og-head .muted { font-size: var(--fs-2xs); display: block; margin-top: 3px; }
    .og-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
    .op-mini { padding: 14px; background: var(--bg-fill-2); border-radius: var(--r-sm);
               border-left: 3px solid var(--c); cursor: pointer;
               transition: all var(--t-base); display: flex; flex-direction: column; gap: 8px; }
    .op-mini:hover { background: var(--bg-fill-3); transform: translateY(-2px); }
    .op-mini header { display: flex; justify-content: space-between; align-items: center; }
    .op-code { font-size: 10px; font-weight: 800; color: var(--c); }
    .op-mini b { font-size: var(--fs-sm); font-weight: 700; }
    .op-sector { font-size: 10px; color: var(--label-3); }
    .op-progress { display: flex; align-items: center; gap: 8px; }
    .opp-bar { flex: 1; height: 4px; background: var(--bg-surface-solid);
               border-radius: var(--r-pill); overflow: hidden; }
    .opp-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms var(--ease-out); }
    .op-progress .mono { font-size: 10px; color: var(--label-2); }
    .op-foot { display: flex; justify-content: space-between; font-size: 10px;
               color: var(--label-3); padding-top: 6px;
               border-top: 0.5px solid var(--separator); }

    .info-card { padding: 20px; background: var(--bg-surface-solid);
                 border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .info-card > header { margin-bottom: 14px; }
    .info-card h4 { font-size: var(--fs-sm); font-weight: 700; }

    .incident-row { display: grid; grid-template-columns: 32px 1fr auto;
                    gap: 12px; align-items: center; padding: 10px 0;
                    border-bottom: 0.5px solid var(--separator);
                    cursor: pointer; transition: background var(--t-fast); }
    .incident-row:last-child { border-bottom: 0; }
    .incident-row:hover { background: var(--bg-hover); margin: 0 -10px; padding: 10px;
                          border-radius: var(--r-xs); }
    .ir-sev { width: 28px; height: 28px; display: grid; place-items: center;
              border-radius: 50%; font-size: 11px; font-weight: 800; color: #fff; }
    .ir-sev[data-s='minor']    { background: #34c759; }
    .ir-sev[data-s='moderate'] { background: #ff9500; }
    .ir-sev[data-s='major']    { background: #ff3b30; }
    .ir-sev[data-s='critical'] { background: #8b0000; }
    .ir-info b { font-size: var(--fs-xs); font-weight: 700; display: block;
                 overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ir-info small { font-size: 10px; color: var(--label-3); }
    .ir-status { font-size: 9px; font-weight: 800; padding: 3px 9px;
                 border-radius: var(--r-pill); text-transform: uppercase;
                 letter-spacing: 0.04em; }
    .ir-status[data-s='reported']     { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .ir-status[data-s='investigating'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .ir-status[data-s='resolved']     { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .ir-status[data-s='closed']       { background: var(--bg-fill-3); color: var(--label-2); }

    .sector-row { display: grid; grid-template-columns: 40px 1fr 80px 50px;
                  gap: 12px; align-items: center; padding: 10px 0;
                  border-bottom: 0.5px solid var(--separator);
                  cursor: pointer; transition: background var(--t-fast); }
    .sector-row:last-child { border-bottom: 0; }
    .sector-row:hover { background: var(--bg-hover); margin: 0 -10px; padding: 10px;
                        border-radius: var(--r-xs); }
    .sr-icon { width: 40px; height: 40px; display: grid; place-items: center;
               border-radius: var(--r-sm); font-size: 18px; }
    .sr-info b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .sr-info small { font-size: 10px; color: var(--label-3); }
    .sr-bar-mini { height: 4px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .sr-fill { height: 100%; border-radius: var(--r-pill); }
    .sr-pct { text-align: right; font-size: 11px; font-weight: 700; }

    .view-head { display: flex; justify-content: space-between; align-items: flex-end;
                 gap: 16px; flex-wrap: wrap; }
    .view-head h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .view-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }
    .view-toggle { display: flex; gap: 2px; padding: 3px; background: var(--bg-fill-2);
                   border-radius: var(--r-sm); }
    .vt { width: 34px; height: 34px; display: grid; place-items: center;
          border-radius: calc(var(--r-sm) - 4px); color: var(--label-2);
          font-size: 14px; background: transparent; border: 0; cursor: pointer;
          transition: all var(--t-fast); }
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
    .sel { padding: 7px 12px; background: var(--bg-input); color: var(--label);
           border: 0.5px solid var(--separator); border-radius: var(--r-sm);
           font-size: var(--fs-xs); font-family: inherit; cursor: pointer; outline: none; }
    .sel:focus { border-color: var(--accent); }

    .table-wrap { background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
                  border-radius: var(--r-md); overflow: hidden; }
    .thead, .trow {
      display: grid;
      grid-template-columns: 90px 1.6fr 90px 120px 90px 140px 100px 90px;
      gap: 12px; padding: 12px 16px; align-items: center; font-size: var(--fs-xs);
    }
    .thead { background: var(--bg-fill-2); font-size: 10px; text-transform: uppercase;
             letter-spacing: 0.06em; color: var(--label-2); font-weight: 700; }
    .th.sortable { cursor: pointer; user-select: none; }
    .th.sortable:hover { color: var(--accent); }
    .trow { border-top: 0.5px solid var(--separator); cursor: pointer;
            transition: background var(--t-fast); }
    .trow:hover { background: var(--bg-hover); }
    .op-code-cell { color: var(--accent); font-weight: 700; }
    .name-cell { display: flex; align-items: center; gap: 10px; }
    .avatar-m { width: 28px; height: 28px; display: grid; place-items: center;
                border-radius: 50%; font-size: 11px; font-weight: 800; flex-shrink: 0; }
    .name-cell b { font-size: var(--fs-xs); font-weight: 600; display: block;
                   overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .name-cell small { font-size: 9px; color: var(--label-3);
                       overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sector-tag { font-family: var(--sf-mono); font-size: 10px; font-weight: 700;
                  padding: 3px 8px; background: color-mix(in srgb, var(--c) 15%, transparent);
                  color: var(--c); border-radius: var(--r-pill); }
    .type-tag { font-size: 10px; padding: 3px 8px; background: var(--bg-fill-2);
                color: var(--label-2); border-radius: var(--r-pill); text-transform: capitalize;
                font-weight: 600; }
    .pri-badge { font-size: 10px; font-weight: 800; padding: 3px 10px;
                 border-radius: var(--r-pill); text-transform: uppercase;
                 letter-spacing: 0.04em; }
    .pri-badge[data-p='critical'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .pri-badge[data-p='high']     { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .pri-badge[data-p='normal']   { background: var(--accent-soft); color: var(--accent); }
    .pri-badge[data-p='low']      { background: var(--bg-fill-3); color: var(--label-2); }
    .progress-cell { display: flex; align-items: center; gap: 8px; }
    .prog-bar { flex: 1; height: 6px; background: var(--bg-fill-2);
                border-radius: var(--r-pill); overflow: hidden; }
    .prog-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms var(--ease-out); }
    .progress-cell .mono { font-size: 10px; color: var(--label-2); min-width: 30px; text-align: right; }
    .st { padding: 3px 10px; border-radius: var(--r-pill); font-size: 10px;
          font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
          text-align: center; display: inline-block; }
    .st.small { font-size: 9px; padding: 2px 8px; }
    .st[data-s='planned']   { background: rgba(0, 122, 255, 0.15); color: #007aff; }
    .st[data-s='active']    { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='paused']    { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='completed'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='cancelled'] { background: var(--bg-fill-3); color: var(--label-2); }
    .st[data-s='reported']     { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .st[data-s='investigating']{ background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='resolved']     { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='closed']       { background: var(--bg-fill-3); color: var(--label-2); }
    .st[data-s='draft']     { background: var(--bg-fill-3); color: var(--label-2); }
    .st[data-s='submitted'] { background: rgba(0, 122, 255, 0.15); color: #007aff; }
    .st[data-s='approved']  { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='archived']  { background: var(--bg-fill-3); color: var(--label-3); }
    .actions-cell { display: flex; gap: 4px; justify-content: flex-end; }
    .row-action { width: 26px; height: 26px; display: grid; place-items: center;
                  border-radius: var(--r-xs); background: transparent; border: 0;
                  color: var(--label-3); font-size: 12px; cursor: pointer;
                  transition: all var(--t-fast); }
    .row-action:hover { background: var(--bg-fill-2); color: var(--label); }

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

    .ops-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
    .op-card { background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
               border-radius: var(--r-md); padding: 16px; cursor: pointer;
               transition: all var(--t-base); display: flex; flex-direction: column; gap: 8px; }
    .op-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .op-card[data-p='critical'] { border-left: 3px solid #ff3b30; }
    .op-card[data-p='high']     { border-left: 3px solid #ff9500; }
    .op-card[data-p='normal']   { border-left: 3px solid #007aff; }
    .op-card[data-p='low']      { border-left: 3px solid #8e8e93; }
    .oc-head { display: flex; justify-content: space-between; align-items: center; }
    .oc-code { font-size: 10px; font-weight: 800; color: var(--accent); }
    .oc-name { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .oc-ar { font-size: 10px; color: var(--label-2); }
    .oc-meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 10px; color: var(--label-3); }
    .oc-progress { display: flex; align-items: center; gap: 8px; }
    .ocp-bar { flex: 1; height: 6px; background: var(--bg-fill-2);
               border-radius: var(--r-pill); overflow: hidden; }
    .ocp-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms var(--ease-out); }
    .oc-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .oc-stat { padding: 8px; background: var(--bg-fill-2); border-radius: var(--r-sm);
               display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .oc-stat span { font-size: 14px; }
    .oc-stat b { font-size: var(--fs-base); font-weight: 800; font-variant-numeric: tabular-nums; }
    .oc-stat small { font-size: 9px; color: var(--label-3); text-transform: uppercase;
                     letter-spacing: 0.04em; font-weight: 700; }
    .oc-foot { display: flex; justify-content: space-between; align-items: center;
               padding-top: 8px; border-top: 0.5px solid var(--separator); }

    .severity-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .sev-chip { padding: 6px 12px; background: var(--bg-fill-2); color: var(--label-2);
                border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 600;
                border: 0; cursor: pointer; display: inline-flex; align-items: center;
                gap: 6px; transition: all var(--t-fast); }
    .sev-chip:hover { background: var(--bg-fill-3); color: var(--label); }
    .sev-chip.active { color: #fff; }
    .sev-chip.active[data-s='all']      { background: var(--accent); }
    .sev-chip.active[data-s='minor']    { background: #34c759; }
    .sev-chip.active[data-s='moderate'] { background: #ff9500; }
    .sev-chip.active[data-s='major']    { background: #ff3b30; }
    .sev-chip.active[data-s='critical'] { background: #8b0000; }
    .sev-count { background: rgba(255,255,255,0.18); padding: 0 5px;
                 border-radius: var(--r-pill); font-size: 9px;
                 font-variant-numeric: tabular-nums; }

    .incidents-list { display: flex; flex-direction: column; gap: 10px; }
    .incident-card { display: grid; grid-template-columns: 80px 1fr auto;
                     gap: 14px; align-items: stretch;
                     background: var(--bg-surface-solid);
                     border: 0.5px solid var(--separator);
                     border-radius: var(--r-md); overflow: hidden;
                     cursor: pointer; transition: all var(--t-base); }
    .incident-card:hover { transform: translateX(3px); box-shadow: var(--shadow-md); }
    .incident-card[data-s='minor']    { border-left: 3px solid #34c759; }
    .incident-card[data-s='moderate'] { border-left: 3px solid #ff9500; }
    .incident-card[data-s='major']    { border-left: 3px solid #ff3b30; }
    .incident-card[data-s='critical'] { border-left: 3px solid #8b0000; }
    .ic-left { display: flex; flex-direction: column; align-items: center;
               justify-content: center; gap: 6px; padding: 14px; }
    .ic-sev-icon { font-size: 22px; }
    .ic-id { font-size: 9px; color: var(--label-3); }
    .ic-body { padding: 14px 14px 14px 0; min-width: 0; }
    .ic-head { display: flex; justify-content: space-between; align-items: flex-start;
               gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
    .ic-head b { font-size: var(--fs-sm); font-weight: 700; }
    .ic-tags { display: flex; gap: 6px; flex-shrink: 0; }
    .sev-badge { font-size: 9px; font-weight: 800; padding: 3px 9px;
                 border-radius: var(--r-pill); text-transform: uppercase;
                 letter-spacing: 0.04em; }
    .sev-badge[data-s='minor']    { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .sev-badge[data-s='moderate'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .sev-badge[data-s='major']    { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .sev-badge[data-s='critical'] { background: rgba(139, 0, 0, 0.15); color: #8b0000; }
    .ic-body p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5;
                 margin-bottom: 8px; }
    .ic-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 10px;
               color: var(--label-3); align-items: center; }
    .ic-meta-item { display: inline-flex; align-items: center; gap: 4px; }
    .ic-actions { display: flex; flex-direction: column; gap: 4px;
                  padding: 14px; justify-content: center; }
    .ic-btn { width: 32px; height: 32px; display: grid; place-items: center;
              background: var(--bg-fill-2); border: 0; border-radius: var(--r-sm);
              color: var(--label-2); font-size: 14px; cursor: pointer;
              transition: all var(--t-fast); }
    .ic-btn:hover { background: var(--bg-fill-3); color: var(--label); }
    .ic-btn.ok:hover { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .ic-btn.warn:hover { background: rgba(255, 149, 0, 0.15); color: #ff9500; }

    .reports-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
    .report-card { background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
                   border-radius: var(--r-md); padding: 16px; cursor: pointer;
                   transition: all var(--t-base); display: flex; flex-direction: column; gap: 10px; }
    .report-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .report-card[data-c='public']       { border-top: 3px solid #34c759; }
    .report-card[data-c='internal']     { border-top: 3px solid #007aff; }
    .report-card[data-c='confidential'] { border-top: 3px solid #ff9500; }
    .report-card[data-c='top-secret']   { border-top: 3px solid #ff3b30; }
    .rc-head { display: flex; align-items: flex-start; gap: 10px; }
    .rc-icon { width: 36px; height: 36px; display: grid; place-items: center;
               border-radius: var(--r-sm); font-size: 18px; flex-shrink: 0; }
    .rc-head > div { flex: 1; min-width: 0; }
    .rc-head b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .rc-ar { font-size: 10px; color: var(--label-2); margin-top: 2px; }
    .rc-class { font-size: 9px; font-weight: 800; padding: 3px 9px;
                border-radius: var(--r-pill); text-transform: uppercase;
                letter-spacing: 0.04em; flex-shrink: 0; }
    .rc-class[data-c='public']       { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .rc-class[data-c='internal']     { background: rgba(0, 122, 255, 0.15); color: #007aff; }
    .rc-class[data-c='confidential'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .rc-class[data-c='top-secret']   { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .rc-meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 10px; color: var(--label-3); }
    .rc-summary { font-size: 11px; color: var(--label-2); line-height: 1.5;
                  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
                  overflow: hidden; }
    .rc-foot { display: flex; justify-content: space-between; align-items: center;
               padding-top: 8px; border-top: 0.5px solid var(--separator); }

    .resource-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .rf-chip { padding: 6px 12px; background: var(--bg-fill-2); color: var(--label-2);
               border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 600;
               border: 0; cursor: pointer; display: inline-flex; align-items: center;
               gap: 6px; transition: all var(--t-fast); }
    .rf-chip:hover { background: var(--bg-fill-3); color: var(--label); }
    .rf-chip.active { background: var(--accent); color: var(--accent-contrast); }
    .rf-count { background: rgba(255,255,255,0.18); padding: 0 5px;
                border-radius: var(--r-pill); font-size: 9px;
                font-variant-numeric: tabular-nums; }

    .resource-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .resource-kpis { grid-template-columns: repeat(2, 1fr); } }
    .res-kpi { padding: 16px; background: var(--bg-surface-solid);
               border: 0.5px solid var(--separator); border-radius: var(--r-md);
               display: flex; flex-direction: column; gap: 4px; }
    .res-kpi.ok { border-left: 3px solid #34c759; }
    .res-kpi.warn { border-left: 3px solid #ff9500; }
    .res-kpi.danger { border-left: 3px solid #ff3b30; }
    .res-kpi .rk-icon { font-size: 18px; }
    .res-kpi b { font-size: var(--fs-2xl); font-weight: 800;
                 font-variant-numeric: tabular-nums; line-height: 1; }
    .res-kpi small { font-size: var(--fs-2xs); color: var(--label-2);
                     text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    .resource-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .resource-card { background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
                     border-radius: var(--r-md); padding: 14px; cursor: pointer;
                     transition: all var(--t-base); display: flex; flex-direction: column; gap: 12px; }
    .resource-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .resource-card[data-s='operational'] { border-left: 3px solid #34c759; }
    .resource-card[data-s='limited']     { border-left: 3px solid #ff9500; }
    .resource-card[data-s='critical']    { border-left: 3px solid #ff3b30; }
    .resource-card[data-s='maintenance'] { border-left: 3px solid #8e8e93; }
    .res-head { display: flex; align-items: center; gap: 10px; }
    .res-icon { width: 40px; height: 40px; display: grid; place-items: center;
                border-radius: var(--r-sm); font-size: 18px; flex-shrink: 0; }
    .res-head > div { flex: 1; min-width: 0; }
    .res-head b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .res-head small { font-size: 10px; color: var(--label-3); }
    .res-status { font-size: 9px; font-weight: 800; padding: 3px 9px;
                  border-radius: var(--r-pill); text-transform: uppercase;
                  letter-spacing: 0.04em; }
    .res-status[data-s='operational'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .res-status[data-s='limited']     { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .res-status[data-s='critical']    { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .res-status[data-s='maintenance'] { background: var(--bg-fill-3); color: var(--label-2); }
    .res-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .res-stat { padding: 8px 4px; background: var(--bg-fill-2); border-radius: var(--r-xs);
                text-align: center; }
    .res-stat.ok   { background: rgba(52, 199, 89, 0.1); }
    .res-stat.warn { background: rgba(255, 149, 0, 0.1); }
    .rs-num { display: block; font-size: var(--fs-sm); font-weight: 800;
              font-variant-numeric: tabular-nums; }
    .res-stat small { font-size: 9px; color: var(--label-3);
                      text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; }
    .res-progress { display: flex; flex-direction: column; gap: 6px; }
    .res-progress .mono { font-size: 10px; color: var(--label-2); }
    .rp-bar { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill);
              overflow: hidden; display: flex; }
    .rp-fill { height: 100%; }
    .rp-fill.ok { background: #34c759; }
    .rp-fill.warn { background: #ff9500; }
    .rp-fill.danger { background: #ff3b30; }

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
    .timeline-item::before { content: ''; position: absolute; left: 101px; top: 24px;
                             bottom: -10px; width: 1px; background: var(--separator); }
    .timeline-item:last-child::before { display: none; }
    .tl-time { font-size: 10px; color: var(--label-3);
               font-family: var(--sf-mono); text-align: right; padding-top: 5px; }
    .tl-dot { width: 14px; height: 14px; border-radius: 50%;
              margin-top: 3px; border: 3px solid var(--bg-surface-solid);
              box-shadow: 0 0 0 1px var(--separator); position: relative; z-index: 1; }
    .tl-body { padding: 6px 12px; border-radius: var(--r-xs); min-width: 0; }
    .tl-head { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
    .tl-icon { width: 28px; height: 28px; display: grid; place-items: center;
               border-radius: var(--r-sm); font-size: 14px; }
    .tl-head b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .tl-action { font-size: 9px; font-weight: 800; text-transform: uppercase;
                 letter-spacing: 0.04em; }
    .tl-body p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5; }
    .tl-meta { display: flex; gap: 6px; font-size: 10px; color: var(--label-3); margin-top: 4px; }

    .report-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .report-kpis { grid-template-columns: repeat(2, 1fr); } }
    .report-kpi { padding: 18px; background: var(--bg-surface-solid);
                  border: 0.5px solid var(--separator); border-radius: var(--r-md);
                  border-left: 3px solid var(--c); }
    .report-kpi .rk-icon { font-size: 20px; }
    .rk-val { display: block; font-size: var(--fs-2xl); font-weight: 800;
              letter-spacing: -0.03em; font-variant-numeric: tabular-nums;
              line-height: 1; margin-top: 6px; }
    .rk-label { display: block; font-size: var(--fs-2xs); color: var(--label-2);
                text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;
                margin-top: 4px; }

    .sector-chart-row { display: grid; grid-template-columns: 140px 1fr 50px 50px;
                        gap: 12px; align-items: center; font-size: var(--fs-xs);
                        padding: 6px 8px; border-radius: var(--r-xs);
                        cursor: pointer; transition: background var(--t-fast); }
    .sector-chart-row:hover { background: var(--bg-hover); }
    .scr-name { font-weight: 600; }
    .scr-bar { height: 8px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .scr-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms var(--ease-out); }
    .scr-count { text-align: right; font-weight: 700; }
    .scr-pct { text-align: right; font-weight: 800; }

    .breakdown-row { display: grid; grid-template-columns: 24px 110px 1fr 100px;
                     gap: 12px; align-items: center; padding: 10px 0;
                     border-bottom: 0.5px solid var(--separator); font-size: var(--fs-xs); }
    .breakdown-row:last-child { border-bottom: 0; }
    .bd-dot { width: 10px; height: 10px; border-radius: 50%; }
    .bd-icon { font-size: 16px; text-align: center; }
    .bd-label { color: var(--label-2); }
    .bd-bar { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .bd-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms var(--ease-out); }
    .bd-val { text-align: right; font-weight: 700; font-size: 10px; }

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
    .avatar-m { width: 32px; height: 32px; display: grid; place-items: center;
                border-radius: 50%; font-size: 16px; }
    .top-row b { font-weight: 600; display: block; }
    .top-row small { font-size: 10px; color: var(--label-2); }
    .top-count { color: var(--accent); font-weight: 700; }

    .modal-backdrop { position: fixed; inset: 0;
                      background: rgba(0, 0, 0, 0.55);
                      backdrop-filter: blur(8px); z-index: 9990;
                      display: grid; place-items: center; padding: 40px 20px;
                      animation: fadeIn 200ms var(--ease-out); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal { max-width: 720px; width: 100%; max-height: 85vh;
             background: var(--bg-elevated); border: 0.5px solid var(--separator);
             border-radius: var(--r-lg); box-shadow: var(--shadow-xl);
             display: flex; flex-direction: column; overflow: hidden;
             animation: modalIn 300ms var(--ease-spring); }
    .modal.op-modal { max-width: 780px; }
    .modal.inc-modal { max-width: 700px; }
    .modal.rpt-modal { max-width: 720px; }
    .modal.res-modal { max-width: 620px; }
    .modal.sector-modal { max-width: 720px; }
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

    .om-progress-bar { padding: 14px 16px; background: var(--bg-fill-2);
                       border-radius: var(--r-sm); }
    .omb-head { display: flex; justify-content: space-between; margin-bottom: 8px;
                font-size: var(--fs-xs); }
    .omb-head b { color: var(--accent); font-weight: 800; }
    .omb-track { height: 8px; background: var(--bg-surface-solid);
                 border-radius: var(--r-pill); overflow: hidden; }
    .omb-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms var(--ease-out); }

    .om-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 600px) { .om-grid { grid-template-columns: 1fr; } }
    .om-section { display: flex; flex-direction: column; gap: 3px; }
    .om-label { font-size: 9px; font-weight: 800; text-transform: uppercase;
                letter-spacing: 0.08em; color: var(--label-3); margin-bottom: 2px; }
    .om-section b { font-size: var(--fs-sm); font-weight: 700; }
    .om-block { display: flex; flex-direction: column; gap: 8px; }
    .om-block p { font-size: var(--fs-sm); line-height: 1.55; color: var(--label); }

    .objectives-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .objectives-list li { display: flex; align-items: flex-start; gap: 8px;
                          font-size: var(--fs-xs); }
    .obj-check { color: #34c759; font-weight: 800; }

    .resources-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .res-chip { font-size: 10px; padding: 4px 10px; background: var(--bg-fill-2);
                border-radius: var(--r-pill); color: var(--label-2);
                font-family: var(--sf-mono); }

    .mini-incident { display: grid; grid-template-columns: 32px 1fr auto;
                     gap: 10px; align-items: center; padding: 8px 12px;
                     background: var(--bg-fill-2); border-radius: var(--r-xs);
                     font-size: 10px; cursor: pointer; transition: background var(--t-fast); }
    .mini-incident:hover { background: var(--bg-fill-3); }
    .mi-sev { width: 24px; height: 24px; display: grid; place-items: center;
              border-radius: 50%; font-size: 9px; font-weight: 800; color: #fff; }
    .mi-sev[data-s='minor']    { background: #34c759; }
    .mi-sev[data-s='moderate'] { background: #ff9500; }
    .mi-sev[data-s='major']    { background: #ff3b30; }
    .mi-sev[data-s='critical'] { background: #8b0000; }
    .mi-sev-2 { color: var(--accent); font-weight: 700; font-size: 10px; }
    .mi-title { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .related-op { display: grid; grid-template-columns: auto 1fr auto;
                  gap: 10px; align-items: center; padding: 10px 12px;
                  background: var(--bg-fill-2); border-radius: var(--r-sm);
                  font-size: var(--fs-xs); cursor: pointer;
                  transition: background var(--t-fast); }
    .related-op:hover { background: var(--bg-fill-3); }
    .ro-code { color: var(--accent); font-weight: 700; }

    .modal-foot { padding: 16px 24px; border-top: 0.5px solid var(--separator);
                  display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
    .mf-btn { padding: 9px 16px; background: var(--bg-fill-2); color: var(--label);
              border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600;
              border: 0; cursor: pointer; transition: all var(--t-fast); }
    .mf-btn:hover { background: var(--bg-fill-3); }
    .mf-btn.primary { background: var(--accent); color: var(--accent-contrast); }
    .mf-btn.primary:hover { background: var(--accent-hover); }
    .mf-btn.ok { background: #34c759; color: #fff; }
    .mf-btn.ok:hover { background: #2eb14e; }
    .mf-btn.warn { background: #ff9500; color: #fff; }
    .mf-btn.warn:hover { background: #e08600; }

    .sec-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 600px) { .sec-stats { grid-template-columns: repeat(2, 1fr); } }
    .sec-stat { padding: 14px; background: var(--bg-fill-2); border-radius: var(--r-sm);
                text-align: center; }
    .sec-stat.ok   { background: rgba(52, 199, 89, 0.1); }
    .sec-stat.warn { background: rgba(255, 149, 0, 0.1); }
    .sec-stat.danger { background: rgba(255, 59, 48, 0.1); }
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

    .legend-row { display: flex; gap: 16px; font-size: 10px; color: var(--label-2);
                  margin-top: 8px; }
    .legend-row span { display: inline-flex; align-items: center; gap: 5px; }
    .legend-row .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  `],
})
export class SectorReportsPreviewComponent {
  readonly Math = Math;
  private menu = inject(ContextMenuService);
  private toast = inject(ToastService);

  readonly sectors = OPS_SECTORS;
  readonly resources = RESOURCES;
  readonly operations = signal<Operation[]>([...OPERATIONS]);
  readonly incidents = signal<Incident[]>([...INCIDENTS]);
  readonly reports = signal<SectorReport[]>([...REPORTS]);
  readonly log = signal<OpsLogEntry[]>([...OPS_LOG]);

  readonly active = signal('dashboard');
  readonly opsView = signal<'table' | 'cards'>('table');
  readonly statusFilter = signal<string>('all');
  readonly typeFilter = signal<string>('all');
  readonly sectorFilter = signal<string>('all');
  readonly priorityFilter = signal<string>('all');
  readonly incidentStatusFilter = signal<string>('all');
  readonly severityFilter = signal<string>('all');
  readonly reportStatusFilter = signal<string>('all');
  readonly reportTypeFilter = signal<string>('all');
  readonly resourceTypeFilter = signal<string>('all');
  readonly activityFilter = signal<string>('all');
  readonly searchQuery = signal('');

  readonly selectedOperation = signal<Operation | null>(null);
  readonly selectedIncident = signal<Incident | null>(null);
  readonly selectedReport = signal<SectorReport | null>(null);
  readonly selectedResource = signal<SectorResource  | null>(null);
  readonly selectedSector = signal<OpsSector | null>(null);

  readonly sortKey = signal<keyof Operation>('name');
  readonly sortDir = signal<1 | -1>(1);
  readonly pageSize = 8;
  readonly page = signal(1);

  readonly statusFilters = [
    { id: 'all', label: 'All', icon: '📁' },
    { id: 'active', label: 'Active', icon: '▶' },
    { id: 'planned', label: 'Planned', icon: '📅' },
    { id: 'paused', label: 'Paused', icon: '⏸' },
    { id: 'completed', label: 'Completed', icon: '✅' },
  ];

  readonly typeFilters = [
    { id: 'all', label: 'All types', icon: '📁' },
    { id: 'patrol', label: 'Patrol', icon: '👁' },
    { id: 'recon', label: 'Recon', icon: '🔍' },
    { id: 'training', label: 'Training', icon: '🎓' },
    { id: 'logistics', label: 'Logistics', icon: '📦' },
    { id: 'medical', label: 'Medical', icon: '⚕️' },
    { id: 'security', label: 'Security', icon: '🛡' },
    { id: 'emergency', label: 'Emergency', icon: '🚨' },
    { id: 'special', label: 'Special', icon: '🎖' },
  ];

  readonly incidentStatusFilters = [
    { id: 'all', label: 'All', icon: '📁' },
    { id: 'reported', label: 'Reported', icon: '📢' },
    { id: 'investigating', label: 'Investigating', icon: '🔍' },
    { id: 'resolved', label: 'Resolved', icon: '✅' },
    { id: 'closed', label: 'Closed', icon: '🔒' },
  ];

  readonly severityFilters = [
    { id: 'all', label: 'All', icon: '📁' },
    { id: 'minor', label: 'Minor', icon: '🟢' },
    { id: 'moderate', label: 'Moderate', icon: '🟡' },
    { id: 'major', label: 'Major', icon: '🟠' },
    { id: 'critical', label: 'Critical', icon: '🔴' },
  ];

  readonly reportStatusFilters = [
    { id: 'all', label: 'All', icon: '📁' },
    { id: 'draft', label: 'Draft', icon: '✎' },
    { id: 'submitted', label: 'Submitted', icon: '📤' },
    { id: 'approved', label: 'Approved', icon: '✅' },
    { id: 'archived', label: 'Archived', icon: '📦' },
  ];

  readonly reportTypeFilters = [
    { id: 'all', label: 'All types', icon: '📁' },
    { id: 'daily', label: 'Daily', icon: '📅' },
    { id: 'weekly', label: 'Weekly', icon: '📆' },
    { id: 'monthly', label: 'Monthly', icon: '🗓' },
    { id: 'incident', label: 'Incident', icon: '🚨' },
    { id: 'assessment', label: 'Assessment', icon: '📊' },
    { id: 'special', label: 'Special', icon: '⭐' },
  ];

  readonly resourceTypeFilters = [
    { id: 'all', label: 'All', icon: '📁' },
    { id: 'vehicle', label: 'Vehicles', icon: '🚗' },
    { id: 'weapon', label: 'Weapons', icon: '🔫' },
    { id: 'equipment', label: 'Equipment', icon: '🔧' },
    { id: 'medical', label: 'Medical', icon: '⚕️' },
    { id: 'communication', label: 'Communication', icon: '📡' },
    { id: 'fuel', label: 'Fuel', icon: '⛽' },
  ];

  readonly activityFilters = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'created', label: 'Created', icon: '📝' },
    { id: 'started', label: 'Started', icon: '▶' },
    { id: 'paused', label: 'Paused', icon: '⏸' },
    { id: 'completed', label: 'Completed', icon: '✅' },
    { id: 'incident', label: 'Incidents', icon: '🚨' },
    { id: 'report', label: 'Reports', icon: '📄' },
    { id: 'resource', label: 'Resources', icon: '📦' },
  ];

  readonly nav = computed<PreviewNavItem[]>(() => [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', group: 'Command' },
    { id: 'operations', label: 'Operations', icon: '⚔️', badge: this.operations().length, group: 'Operations' },
    { id: 'incidents', label: 'Incidents', icon: '🚨', badge: this.activeIncidentsCount(), group: 'Operations' },
    { id: 'reports', label: 'Reports', icon: '📄', badge: this.reports().length, group: 'Operations' },
    { id: 'resources', label: 'Resources', icon: '📦', badge: this.resources.length, group: 'Logistics' },
    { id: 'activity', label: 'Activity Log', icon: '📜', group: 'Analytics' },
    { id: 'analytics', label: 'Analytics', icon: '📈', group: 'Analytics' },
  ]);

  readonly toolbar = computed<ToolbarAction[]>(() => [
    { id: 'refresh', label: 'Refresh', icon: '⟳', action: () => this.toast.success('Data refreshed') },
    { id: 'report', label: 'Generate Report', icon: '📄', action: () => this.generatePdfReport() },
    { id: 'create', label: 'New Operation', icon: '＋', primary: true, action: () => this.createOperation() },
  ]);

  readonly notifs = signal<PreviewNotification[]>([
    { id: 1, icon: '🚨', title: '2 critical incidents active', body: 'Border contact + perimeter alert', time: '2m' },
    { id: 2, icon: '⚠️', title: 'Operation paused', body: 'Giza Security Sweep under review', time: '30m' },
    { id: 3, icon: '✅', title: 'Medical evacuation completed', body: 'Sinai Forward Base', time: '2h' },
    { id: 4, icon: '📊', title: 'Weekly readiness report ready', body: 'All sectors assessment', time: '4h' },
  ]);

  readonly searchPlaceholder = computed(() => {
    if (this.active() === 'operations') return 'Search operations, codes, commanders…';
    if (this.active() === 'incidents') return 'Search incidents…';
    if (this.active() === 'reports') return 'Search reports…';
    if (this.active() === 'resources') return 'Search resources…';
    return '';
  });

  readonly filteredOperations = computed(() => {
    let list = this.operations();
    const s = this.statusFilter();
    if (s !== 'all') list = list.filter(o => o.status === s);
    const t = this.typeFilter();
    if (t !== 'all') list = list.filter(o => o.type === t);
    const sec = this.sectorFilter();
    if (sec !== 'all') list = list.filter(o => o.sectorId === sec);
    const p = this.priorityFilter();
    if (p !== 'all') list = list.filter(o => o.priority === p);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(o =>
      o.name.toLowerCase().includes(q) ||
      o.code.toLowerCase().includes(q) ||
      o.commander.toLowerCase().includes(q) ||
      o.location.toLowerCase().includes(q)
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

  readonly pagedOps = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredOperations().slice(start, start + this.pageSize);
  });

  readonly lastPage = computed(() =>
    Math.max(1, Math.ceil(this.filteredOperations().length / this.pageSize))
  );
  readonly pageNumbers = computed(() => Array.from({ length: this.lastPage() }, (_, i) => i + 1));

  readonly filteredIncidents = computed(() => {
    let list = this.incidents();
    const s = this.incidentStatusFilter();
    if (s !== 'all') list = list.filter(i => i.status === s);
    const sv = this.severityFilter();
    if (sv !== 'all') list = list.filter(i => i.severity === sv);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q)
    );
    return [...list].sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
  });

  readonly filteredReports = computed(() => {
    let list = this.reports();
    const s = this.reportStatusFilter();
    if (s !== 'all') list = list.filter(r => r.status === s);
    const t = this.reportTypeFilter();
    if (t !== 'all') list = list.filter(r => r.type === t);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q)
    );
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  readonly filteredResources = computed(() => {
    const t = this.resourceTypeFilter();
    let list = this.resources;
    if (t !== 'all') list = list.filter(r => r.type === t);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(r => r.name.toLowerCase().includes(q));
    return list;
  });

  readonly filteredActivity = computed(() => {
    const f = this.activityFilter();
    if (f === 'all') return this.log();
    return this.log().filter(a => a.action === f);
  });

  readonly activeOps = computed(() => this.operations().filter(o => o.status === 'active'));
  readonly recentIncidents = computed(() =>
    [...this.incidents()].sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
  );
  readonly activeIncidentsCount = computed(() =>
    this.incidents().filter(i => i.status === 'reported' || i.status === 'investigating').length
  );
  readonly criticalCount = computed(() =>
    this.incidents().filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length
  );

  readonly kpis = computed(() => {
    const ops = this.operations();
    const active = ops.filter(o => o.status === 'active').length;
    const incidents = this.incidents().filter(i => i.status !== 'resolved' && i.status !== 'closed').length;
    const totalPersonnel = this.sectors.reduce((s, x) => s + x.personnelDeployed, 0);
    return [
      { icon: '⚔️', label: 'Total Operations', value: ops.length.toString(), color: '#007aff', pct: 100, trend: '+8%', up: true, action: () => this.active.set('operations') },
      { icon: '▶', label: 'Active Now', value: active.toString(), color: '#34c759', pct: (active / ops.length) * 100, trend: '+2', up: true, action: () => { this.statusFilter.set('active'); this.active.set('operations'); } },
      { icon: '🚨', label: 'Open Incidents', value: incidents.toString(), color: '#ff3b30', pct: (incidents / ops.length) * 100, trend: '-1', up: false, action: () => this.active.set('incidents') },
      { icon: '👥', label: 'Total Personnel', value: totalPersonnel.toLocaleString(), color: '#af52de', pct: 100, trend: '+3%', up: true, action: () => this.active.set('analytics') },
    ];
  });

  readonly statusSummary = computed(() => {
    const total = this.operations().length;
    const statuses = [
      { id: 'active', label: 'Active', color: '#34c759' },
      { id: 'planned', label: 'Planned', color: '#007aff' },
      { id: 'paused', label: 'Paused', color: '#ff9500' },
      { id: 'completed', label: 'Completed', color: '#8e8e93' },
      { id: 'cancelled', label: 'Cancelled', color: '#ff3b30' },
    ];
    return statuses.map(s => {
      const count = this.operations().filter(o => o.status === s.id).length;
      return { ...s, count, pct: (count / total) * 100 };
    });
  });

  readonly typeSummary = computed(() => {
    const total = this.operations().length;
    const types = [
      { id: 'patrol', label: 'Patrol', icon: '👁' },
      { id: 'recon', label: 'Recon', icon: '🔍' },
      { id: 'training', label: 'Training', icon: '🎓' },
      { id: 'logistics', label: 'Logistics', icon: '📦' },
      { id: 'medical', label: 'Medical', icon: '⚕️' },
      { id: 'security', label: 'Security', icon: '🛡' },
      { id: 'emergency', label: 'Emergency', icon: '🚨' },
      { id: 'special', label: 'Special', icon: '🎖' },
    ];
    return types.map(t => {
      const count = this.operations().filter(o => o.type === t.id).length;
      return { ...t, count, pct: (count / total) * 100 };
    }).filter(t => t.count > 0);
  });

  readonly totalResourceUnits = computed(() =>
    this.resources.reduce((s, r) => s + r.quantity, 0)
  );
  readonly operationalCount = computed(() =>
    this.resources.filter(r => r.status === 'operational').length
  );
  readonly limitedCount = computed(() =>
    this.resources.filter(r => r.status === 'limited').length
  );
  readonly criticalResourceCount = computed(() =>
    this.resources.filter(r => r.status === 'critical').length
  );

  readonly maxSectorOps = computed(() =>
    Math.max(...this.sectors.map(s => this.opsInSector(s.id).length))
  );

  readonly reportKpis = computed(() => {
    const ops = this.operations();
    const completed = ops.filter(o => o.status === 'completed').length;
    const successRate = Math.round((completed / ops.length) * 100);
    const avgProgress = Math.round(ops.reduce((s, x) => s + x.progress, 0) / ops.length);
    const resolvedIncidents = this.incidents().filter(i => i.status === 'resolved' || i.status === 'closed').length;
    return [
      { icon: '📋', label: 'Total operations', value: ops.length.toString(), color: '#007aff' },
      { icon: '✅', label: 'Success rate', value: `${successRate}%`, color: '#34c759' },
      { icon: '📈', label: 'Avg progress', value: `${avgProgress}%`, color: '#ff9500' },
      { icon: '🎯', label: 'Incidents resolved', value: resolvedIncidents.toString(), color: '#af52de' },
    ];
  });

  readonly priorityBreakdown = computed(() => {
    const total = this.operations().length;
    const colors: Record<string, string> = {
      critical: '#ff3b30', high: '#ff9500', normal: '#007aff', low: '#8e8e93',
    };
    return ['critical', 'high', 'normal', 'low'].map(p => {
      const count = this.operations().filter(o => o.priority === p).length;
      return { label: p.charAt(0).toUpperCase() + p.slice(1), count, pct: (count / total) * 100, color: colors[p] };
    });
  });

  readonly severityBreakdown = computed(() => {
    const total = this.incidents().length;
    const map = [
      { id: 'critical', label: 'Critical', icon: '🔴', color: '#8b0000' },
      { id: 'major', label: 'Major', icon: '🟠', color: '#ff3b30' },
      { id: 'moderate', label: 'Moderate', icon: '🟡', color: '#ff9500' },
      { id: 'minor', label: 'Minor', icon: '🟢', color: '#34c759' },
    ];
    return map.map(m => {
      const count = this.incidents().filter(i => i.severity === m.id).length;
      return { label: m.label, icon: m.icon, color: m.color, count, pct: (count / total) * 100 };
    });
  });

  readonly classificationBreakdown = computed(() => {
    const total = this.reports().length;
    const map = [
      { id: 'top-secret', label: 'Top Secret', color: '#ff3b30' },
      { id: 'confidential', label: 'Confidential', color: '#ff9500' },
      { id: 'internal', label: 'Internal', color: '#007aff' },
      { id: 'public', label: 'Public', color: '#34c759' },
    ];
    return map.map(m => {
      const count = this.reports().filter(r => r.classification === m.id).length;
      return { label: m.label, color: m.color, count, pct: (count / total) * 100 };
    });
  });

  readonly resourceStatusBreakdown = computed(() => {
    const total = this.resources.length;
    const map = [
      { id: 'operational', label: 'Operational', icon: '✅', color: '#34c759' },
      { id: 'limited', label: 'Limited', icon: '⚠️', color: '#ff9500' },
      { id: 'critical', label: 'Critical', icon: '🚫', color: '#ff3b30' },
    ];
    return map.map(m => {
      const count = this.resources.filter(r => r.status === m.id).length;
      return { label: m.label, icon: m.icon, color: m.color, count, pct: (count / total) * 100 };
    });
  });

  readonly topActiveSectors = computed(() => {
    return this.sectors
      .map(s => ({ sector: s, ops: this.opsInSector(s.id).length }))
      .sort((a, b) => b.ops - a.ops)
      .slice(0, 5);
  });

  onSearch(q: string): void {
    this.searchQuery.set(q);
    this.page.set(1);
  }

  countOpsByStatus(id: string): number {
    if (id === 'all') return this.operations().length;
    return this.operations().filter(o => o.status === id).length;
  }

  countIncidentsBy(id: string): number {
    if (id === 'all') return this.incidents().length;
    return this.incidents().filter(i => i.status === id).length;
  }

  countIncidentsBySeverity(id: string): number {
    if (id === 'all') return this.incidents().length;
    return this.incidents().filter(i => i.severity === id).length;
  }

  countReportsBy(id: string): number {
    if (id === 'all') return this.reports().length;
    return this.reports().filter(r => r.status === id).length;
  }

  countResourcesByType(id: string): number {
    if (id === 'all') return this.resources.length;
    return this.resources.filter(r => r.type === id).length;
  }

  countActivityBy(action: string): number {
    if (action === 'all') return this.log().length;
    return this.log().filter(a => a.action === action).length;
  }

  opsInSector(sectorId: string): Operation[] {
    return this.operations().filter(o => o.sectorId === sectorId);
  }

  incidentsForOperation(id: string): Incident[] {
    return this.incidents().filter(i => i.operationId === id);
  }

  operationById(id: string): Operation | undefined {
    return this.operations().find(o => o.id === id);
  }

  sectorById(id: string): OpsSector | undefined {
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

  typeIcon(type: string): string {
    const map: Record<string, string> = {
      patrol: '👁', recon: '🔍', training: '🎓', logistics: '📦',
      medical: '⚕️', security: '🛡', emergency: '🚨', special: '🎖',
    };
    return map[type] ?? '⚔️';
  }

  typeIconRes(type: string): string {
    const map: Record<string, string> = {
      vehicle: '🚗', weapon: '🔫', equipment: '🔧', medical: '⚕️',
      communication: '📡', fuel: '⛽',
    };
    return map[type] ?? '📦';
  }

  severityColor(sev: string): string {
    return { minor: '#34c759', moderate: '#ff9500', major: '#ff3b30', critical: '#8b0000' }[sev] ?? '#8e8e93';
  }

  severityIcon(sev: string): string {
    return { minor: '🟢', moderate: '🟡', major: '🟠', critical: '🔴' }[sev] ?? '⚪';
  }

  classificationColor(c: string): string {
    return { public: '#34c759', internal: '#007aff', confidential: '#ff9500', 'top-secret': '#ff3b30' }[c] ?? '#8e8e93';
  }

  sortBy(key: keyof Operation): void {
    if (this.sortKey() === key) this.sortDir.update(d => d === 1 ? -1 : 1);
    else { this.sortKey.set(key); this.sortDir.set(1); }
  }

  sortIcon(key: string): string {
    return this.sortKey() === key ? (this.sortDir() === 1 ? '▲' : '▼') : '';
  }

  filterByStatus(id: string): void {
    this.statusFilter.set(id);
    this.active.set('operations');
  }

  openOperation(id: string): void {
    const o = this.operations().find(x => x.id === id);
    if (o) this.selectedOperation.set(o);
  }

  openIncident(id: string): void {
    const i = this.incidents().find(x => x.id === id);
    if (i) this.selectedIncident.set(i);
  }

  openReport(id: string): void {
    const r = this.reports().find(x => x.id === id);
    if (r) this.selectedReport.set(r);
  }

  openResource(id: string): void {
    const r = this.resources.find(x => x.id === id);
    if (r) this.selectedResource.set(r);
  }

  openSector(id: string): void {
    const s = this.sectorById(id);
    if (s) this.selectedSector.set(s);
  }

  startOperation(id: string): void {
    this.operations.update(list => list.map(o =>
      o.id === id ? { ...o, status: 'active' as const, updatedAt: new Date().toISOString().slice(0, 10) } : o
    ));
    this.selectedOperation.update(cur => cur && cur.id === id ? { ...cur, status: 'active' as const } : cur);
    this.toast.success(`Operation ${id} started`, 'Now active', '▶');
  }

  pauseOperation(id: string): void {
    this.operations.update(list => list.map(o =>
      o.id === id ? { ...o, status: 'paused' as const, updatedAt: new Date().toISOString().slice(0, 10) } : o
    ));
    this.selectedOperation.update(cur => cur && cur.id === id ? { ...cur, status: 'paused' as const } : cur);
    this.toast.warning(`Operation ${id} paused`, 'Awaiting resume', '⏸');
  }

  resumeOperation(id: string): void {
    this.operations.update(list => list.map(o =>
      o.id === id ? { ...o, status: 'active' as const, updatedAt: new Date().toISOString().slice(0, 10) } : o
    ));
    this.selectedOperation.update(cur => cur && cur.id === id ? { ...cur, status: 'active' as const } : cur);
    this.toast.success(`Operation ${id} resumed`, 'Back to active', '▶');
  }

  completeOperation(id: string): void {
    this.operations.update(list => list.map(o =>
      o.id === id ? { ...o, status: 'completed' as const, progress: 100, updatedAt: new Date().toISOString().slice(0, 10) } : o
    ));
    this.selectedOperation.set(null);
    this.toast.success(`Operation ${id} completed`, 'Successful mission', '✅');
  }

  editOperation(op: Operation): void {
    this.toast.info('Editing operation', op.name, '✎');
  }

  printOperation(op: Operation): void {
    this.toast.success('Printing operation', op.code, '🖨');
  }

  exportOperation(op: Operation): void {
    this.toast.success('Exported PDF', op.code, '📄');
  }

  investigateIncident(id: string): void {
    this.incidents.update(list => list.map(i =>
      i.id === id ? { ...i, status: 'investigating' as const } : i
    ));
    this.selectedIncident.update(cur => cur && cur.id === id ? { ...cur, status: 'investigating' as const } : cur);
    this.toast.info(`Incident ${id} under investigation`, 'Team dispatched', '🔍');
  }

  resolveIncident(id: string): void {
    this.incidents.update(list => list.map(i =>
      i.id === id ? { ...i, status: 'resolved' as const, resolvedAt: new Date().toISOString() } : i
    ));
    this.selectedIncident.update(cur => cur && cur.id === id
      ? { ...cur, status: 'resolved' as const, resolvedAt: new Date().toISOString() }
      : cur);
    this.toast.success(`Incident ${id} resolved`, 'Closed successfully', '✅');
  }

  closeIncident(id: string): void {
    this.incidents.update(list => list.map(i =>
      i.id === id ? { ...i, status: 'closed' as const } : i
    ));
    this.selectedIncident.set(null);
    this.toast.info(`Incident ${id} closed`, 'Archived', '🔒');
  }

  createReport(): void {
    const id = `RPT-${3000 + this.reports().length + 1}`;
    const newReport: SectorReport = {
      id,
      title: 'New Report',
      titleAr: 'تقرير جديد',
      sectorId: 'sector_1',
      type: 'daily',
      status: 'draft',
      author: 'Current User',
      createdAt: new Date().toISOString(),
      summary: 'Newly created report — pending content',
      pages: 1,
      classification: 'internal',
    };
    this.reports.update(list => [newReport, ...list]);
    this.active.set('reports');
    this.toast.success(`Report ${id} created`, 'Draft saved', '📄');
  }

  submitReport(id: string): void {
    this.reports.update(list => list.map(r =>
      r.id === id ? { ...r, status: 'submitted' as const, submittedAt: new Date().toISOString() } : r
    ));
    this.selectedReport.update(cur => cur && cur.id === id
      ? { ...cur, status: 'submitted' as const, submittedAt: new Date().toISOString() }
      : cur);
    this.toast.success(`Report ${id} submitted`, 'Awaiting approval', '📤');
  }

  approveReport(id: string): void {
    this.reports.update(list => list.map(r =>
      r.id === id ? { ...r, status: 'approved' as const, approvedAt: new Date().toISOString() } : r
    ));
    this.selectedReport.set(null);
    this.toast.success(`Report ${id} approved`, 'Filed successfully', '✅');
  }

  downloadReport(r: SectorReport): void {
    this.toast.success(`Downloading ${r.id}`, `${r.pages} pages PDF`, '📥');
  }

  requestResource(id: string): void {
    this.toast.success(`Resource request submitted`, id, '📦');
  }

  scheduleMaintenance(id: string): void {
    this.toast.info(`Maintenance scheduled`, id, '🔧');
  }

  createOperation(): void {
    const id = `OP-${2000 + this.operations().length + 1}`;
    const newOp: Operation = {
      id,
      code: `OP-NEW-${this.operations().length + 1}`,
      name: 'New Operation',
      nameAr: 'عملية جديدة',
      sectorId: 'sector_1',
      type: 'patrol',
      priority: 'normal',
      status: 'planned',
      commander: 'TBD',
      personnel: 20,
      vehicles: 4,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      progress: 0,
      location: 'TBD',
      coordinates: { lat: 30.0561, lng: 31.3445 },
      objectives: ['To be defined'],
      description: 'New operation pending details',
      resources: ['TBD'],
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    this.operations.update(list => [newOp, ...list]);
    this.active.set('operations');
    this.toast.success(`Operation ${id} created`, 'Draft saved', '⚔️');
  }

  generatePdfReport(): void {
    this.toast.success('Generating PDF report', 'All operations summary', '📄');
  }

  onOperationContext(ev: MouseEvent, op: Operation): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: 'View details', icon: '👁', action: () => this.openOperation(op.id) },
      { id: 'edit', label: 'Edit operation', icon: '✎', action: () => this.editOperation(op) },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      ...(op.status === 'planned' ? [{ id: 'start', label: 'Start operation', icon: '▶', action: () => this.startOperation(op.id) }] : []),
      ...(op.status === 'active' ? [
        { id: 'pause', label: 'Pause operation', icon: '⏸', action: () => this.pauseOperation(op.id) },
        { id: 'complete', label: 'Mark complete', icon: '✓', action: () => this.completeOperation(op.id) },
      ] : []),
      ...(op.status === 'paused' ? [{ id: 'resume', label: 'Resume operation', icon: '▶', action: () => this.resumeOperation(op.id) }] : []),
      { id: 'sep-2', label: '', separatorBefore: true, action: () => { } },
      { id: 'print', label: 'Print briefing', icon: '🖨', action: () => this.printOperation(op) },
      { id: 'export', label: 'Export PDF', icon: '📄', action: () => this.exportOperation(op) },
      {
        id: 'copy', label: 'Copy operation code', icon: '📋',
        action: () => { navigator.clipboard?.writeText(op.code); this.toast.success('Copied ' + op.code); }
      },
    ]);
  }

  onIncidentContext(ev: MouseEvent, i: Incident): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: 'View incident', icon: '👁', action: () => this.openIncident(i.id) },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      ...(i.status === 'reported' ? [{ id: 'investigate', label: 'Start investigation', icon: '🔍', action: () => this.investigateIncident(i.id) }] : []),
      ...(i.status !== 'resolved' && i.status !== 'closed' ? [{ id: 'resolve', label: 'Resolve', icon: '✓', action: () => this.resolveIncident(i.id) }] : []),
      ...(i.status === 'resolved' ? [{ id: 'close', label: 'Close case', icon: '🔒', action: () => this.closeIncident(i.id) }] : []),
      { id: 'sep-2', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'copy', label: 'Copy incident ID', icon: '📋',
        action: () => { navigator.clipboard?.writeText(i.id); this.toast.success('Copied ' + i.id); }
      },
    ]);
  }

  onReportContext(ev: MouseEvent, r: SectorReport): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: 'View report', icon: '👁', action: () => this.openReport(r.id) },
      { id: 'download', label: 'Download PDF', icon: '📥', action: () => this.downloadReport(r) },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      ...(r.status === 'draft' ? [{ id: 'submit', label: 'Submit report', icon: '📤', action: () => this.submitReport(r.id) }] : []),
      ...(r.status === 'submitted' ? [{ id: 'approve', label: 'Approve report', icon: '✓', action: () => this.approveReport(r.id) }] : []),
      { id: 'sep-2', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'copy', label: 'Copy report ID', icon: '📋',
        action: () => { navigator.clipboard?.writeText(r.id); this.toast.success('Copied ' + r.id); }
      },
    ]);
  }

  onResourceContext(ev: MouseEvent, r: SectorResource ): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: 'View details', icon: '👁', action: () => this.openResource(r.id) },
      { id: 'sep-1', label: '', separatorBefore: true, action: () => { } },
      { id: 'request', label: 'Request more', icon: '📦', action: () => this.requestResource(r.id) },
      { id: 'maintenance', label: 'Schedule maintenance', icon: '🔧', action: () => this.scheduleMaintenance(r.id) },
      { id: 'sep-2', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'copy', label: 'Copy resource name', icon: '📋',
        action: () => { navigator.clipboard?.writeText(r.name); this.toast.success('Copied'); }
      },
    ]);
  }
}