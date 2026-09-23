import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SECTORS, SOLDIERS, OFFICERS, TransferOrder, TRANSFER_ORDERS, Soldier, Sector } from '../../../../data/transfer-orders.data';
import { DummyDataEditorComponent } from '../../shared/dummy-data-editor/dummy-data-editor';
import { PreviewShellComponent, PreviewNavItem, ToolbarAction, PreviewNotification } from '../../shared/preview-shell/preview-shell';

@Component({
  selector: 'app-transfer-orders-preview',
  standalone: true,
  imports: [PreviewShellComponent, FormsModule, DummyDataEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🎖️"
      title="Transfer Orders"
      subtitle="FOE · 10 sectors · {{ soldiers.length }} personnel"
      [nav]="nav()"
      [active]="active()"
      (activeChange)="active.set($any($event))"
      [toolbarActions]="toolbar()"
      [notifications]="notifs()"
      [searchPlaceholder]="searchPlaceholder()"
      (searchChange)="onSearch($event)"
    >
      <div class="preview-note">
        <app-dummy-data-editor projectId="transfer-orders" />
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

          <section class="chart-card">
            <header>
              <div>
                <h4>Transfer activity — last 14 days</h4>
                <span class="muted mono">Total: {{ orders().length }} orders</span>
              </div>
              <div class="legend">
                <span><i class="dot" style="background:#34c759"></i> Executed</span>
                <span><i class="dot" style="background:#007aff"></i> Approved</span>
                <span><i class="dot" style="background:#ff9500"></i> Pending</span>
              </div>
            </header>
            <div class="chart-bars">
              @for (d of activityData; track $index) {
                <div class="bar-group" (mouseenter)="hoverBar.set($index)" (mouseleave)="hoverBar.set(-1)">
                  @if (hoverBar() === $index) {
                    <div class="bar-tip">{{ d.executed + d.approved + d.pending }} orders</div>
                  }
                  <div class="bar-seg" [style.height.%]="d.executed * 5" style="background:#34c759"></div>
                  <div class="bar-seg" [style.height.%]="d.approved * 5" style="background:#007aff"></div>
                  <div class="bar-seg" [style.height.%]="d.pending * 5" style="background:#ff9500"></div>
                  <span class="bar-label">{{ d.day }}</span>
                </div>
              }
            </div>
          </section>

          <section class="sectors-preview">
            <header class="sp-head">
              <div>
                <h4>Sector strength overview</h4>
                <span class="muted">{{ sectors.length }} sectors · {{ totalStrength() }} total personnel</span>
              </div>
              <button class="pill-sm" (click)="active.set('sectors')">View all →</button>
            </header>
            <div class="sp-grid">
              @for (s of sectors; track s.id) {
                <article class="sp-card" [style.--c]="s.color" (click)="openSector(s.id)">
                  <header>
                    <span class="sp-icon">{{ s.icon }}</span>
                    <div>
                      <b>{{ s.name }}</b>
                      <small class="mono">{{ s.code }}</small>
                    </div>
                    <span class="sp-readiness">{{ s.readiness }}%</span>
                  </header>
                  <div class="sp-stats">
                    <span><b>{{ s.strength }}</b> personnel</span>
                    <span><b>{{ s.units }}</b> units</span>
                  </div>
                  <div class="sp-bar">
                    <div class="sp-fill" [style.width.%]="(s.strength / maxStrength()) * 100"></div>
                  </div>
                </article>
              }
            </div>
          </section>

          <div class="grid-2">
            <section class="info-card">
              <header><h4>Recent pending approvals</h4></header>
              @for (o of pendingOrders().slice(0, 5); track o.id) {
                <div class="recent-row" (click)="openOrder(o.id)">
                  <span class="ro-priority" [attr.data-p]="o.priority">{{ o.priority }}</span>
                  <div class="ro-info">
                    <b>{{ orderId(o.id) }} — {{ soldierName(o.soldierId) }}</b>
                    <small>{{ sectorName(o.fromSector) }} → {{ sectorName(o.toSector) }}</small>
                  </div>
                  <span class="mono small">{{ o.createdAt }}</span>
                </div>
              } @empty {
                <div class="empty-mini">No pending approvals</div>
              }
            </section>

            <section class="info-card">
              <header><h4>Officers online</h4></header>
              @for (o of onlineOfficers(); track o.id) {
                <div class="recent-row" (click)="toast.info(o.rank + ' ' + o.name, o.role)">
                  <span class="o-rank">{{ o.rankAr }}</span>
                  <div class="ro-info">
                    <b>{{ o.rank }} {{ o.name }}</b>
                    <small>{{ sectorName(o.sectorId) }} · {{ o.role }}</small>
                  </div>
                  <span class="online-dot"></span>
                </div>
              }
            </section>
          </div>
        </div>
      }

      @else if (active() === 'orders') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Transfer Orders</h3>
              <p>{{ filteredOrders().length }} of {{ orders().length }} orders</p>
            </div>
            <button class="pill primary" (click)="createOrder()">＋ New Order</button>
          </header>

          <div class="filter-row">
            <div class="filter-tabs">
              @for (f of orderFilters; track f.id) {
                <button class="ftab" [class.active]="orderFilter() === f.id" (click)="orderFilter.set(f.id)">
                  <span>{{ f.icon }}</span>
                  <span>{{ f.label }}</span>
                  <span class="ftab-count">{{ countOrdersBy(f.id) }}</span>
                </button>
              }
            </div>
            <div class="priority-filter">
              @for (p of priorities; track p.id) {
                <button class="pf-chip" [class.active]="priorityFilter() === p.id" [attr.data-p]="p.id" (click)="priorityFilter.set(p.id)">
                  {{ p.label }}
                </button>
              }
            </div>
          </div>

          <div class="table-wrap">
            <header class="thead">
              <span class="th" (click)="sortOrders('id')">Order {{ sortIcon('id', orderSort()) }}</span>
              <span class="th" (click)="sortOrders('soldierId')">Soldier {{ sortIcon('soldierId', orderSort()) }}</span>
              <span class="th">Route</span>
              <span class="th">Priority</span>
              <span class="th" (click)="sortOrders('status')">Status {{ sortIcon('status', orderSort()) }}</span>
              <span class="th" (click)="sortOrders('createdAt')">Created {{ sortIcon('createdAt', orderSort()) }}</span>
              <span class="th"></span>
            </header>
            @for (o of filteredOrders(); track o.id) {
              <div class="trow" (click)="openOrder(o.id)" (contextmenu)="onOrderContext($event, o)">
                <span class="mono order-id">{{ o.id }}</span>
                <span class="soldier-cell">
                  <span class="avatar-m">{{ initials(soldierName(o.soldierId)) }}</span>
                  <div>
                    <b>{{ soldierName(o.soldierId) }}</b>
                    <small class="mono">{{ o.soldierId }}</small>
                  </div>
                </span>
                <span class="route-cell">
                  <span class="sector-tag" [style.--c]="sectorColor(o.fromSector)">{{ sectorCode(o.fromSector) }}</span>
                  <span class="arrow">→</span>
                  <span class="sector-tag" [style.--c]="sectorColor(o.toSector)">{{ sectorCode(o.toSector) }}</span>
                </span>
                <span><span class="pri-badge" [attr.data-p]="o.priority">{{ o.priority }}</span></span>
                <span><span class="st" [attr.data-s]="o.status">{{ o.status }}</span></span>
                <span class="mono small">{{ o.createdAt }}</span>
                <span class="row-actions">
                  <button class="row-action" title="View" (click)="$event.stopPropagation(); openOrder(o.id)">👁</button>
                  @if (o.status === 'pending') {
                    <button class="row-action ok" title="Approve" (click)="$event.stopPropagation(); approve(o.id)">✓</button>
                  }
                  @if (o.status === 'approved') {
                    <button class="row-action ok" title="Execute" (click)="$event.stopPropagation(); execute(o.id)">▶</button>
                  }
                </span>
              </div>
            } @empty {
              <div class="empty-mini">No orders match this filter</div>
            }
          </div>
        </div>
      }

      @else if (active() === 'sectors') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Sectors Directory</h3>
              <p>{{ sectors.length }} operational sectors nationwide</p>
            </div>
          </header>

          <div class="sector-list">
            @for (s of sectors; track s.id) {
              <article class="sector-card" [style.--c]="s.color" (click)="openSector(s.id)" (contextmenu)="onSectorContext($event, s)">
                <header class="sc-head">
                  <div class="sc-icon-wrap">
                    <span class="sc-icon">{{ s.icon }}</span>
                  </div>
                  <div class="sc-title">
                    <div class="sc-row">
                      <h4>{{ s.name }}</h4>
                      <span class="sc-code mono">{{ s.code }}</span>
                    </div>
                    <p class="sc-ar" dir="rtl">{{ s.nameAr }}</p>
                    <p class="sc-meta">📍 {{ s.location }} · Established {{ s.established }}</p>
                  </div>
                  <div class="sc-readiness">
                    <b>{{ s.readiness }}%</b>
                    <small>Readiness</small>
                  </div>
                </header>

                <div class="sc-body">
                  <div class="sc-stats">
                    <div class="sc-stat">
                      <span class="sc-stat-icon">👥</span>
                      <div>
                        <b>{{ s.strength }}</b>
                        <small>Personnel</small>
                      </div>
                    </div>
                    <div class="sc-stat">
                      <span class="sc-stat-icon">🏢</span>
                      <div>
                        <b>{{ s.units }}</b>
                        <small>Units</small>
                      </div>
                    </div>
                    <div class="sc-stat">
                      <span class="sc-stat-icon">🎖</span>
                      <div>
                        <b>{{ soldiersInSector(s.id).length }}</b>
                        <small>Tracked</small>
                      </div>
                    </div>
                    <div class="sc-stat">
                      <span class="sc-stat-icon">📋</span>
                      <div>
                        <b>{{ ordersFromSector(s.id).length }}</b>
                        <small>Transfers</small>
                      </div>
                    </div>
                  </div>

                  <div class="sc-commander">
                    <span class="sc-c-icon">👤</span>
                    <div>
                      <small>Commander</small>
                      <b>{{ s.commander }}</b>
                    </div>
                  </div>

                  <div class="sc-bar">
                    <div class="sc-fill" [style.width.%]="(s.strength / maxStrength()) * 100"></div>
                  </div>
                </div>

                <footer class="sc-foot">
                  <span class="sc-region">🌍 {{ s.region }} region</span>
                  <span class="sc-open">Open sector →</span>
                </footer>
              </article>
            }
          </div>
        </div>
      }

      @else if (active() === 'soldiers') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Personnel Registry</h3>
              <p>{{ filteredSoldiers().length }} of {{ soldiers.length }} soldiers</p>
            </div>
            <button class="pill" (click)="toast.info('Exporting personnel data…', 'CSV download')">📥 Export</button>
          </header>

          <div class="soldier-filters">
            <div class="sf-chip-row">
              @for (r of rankFilters; track r) {
                <button class="sf-chip" [class.active]="rankFilter() === r" (click)="rankFilter.set(r)">
                  {{ r === 'all' ? 'All ranks' : r }}
                </button>
              }
            </div>
            <div class="sf-chip-row">
              @for (s of sectorFilters(); track s.id) {
                <button class="sf-chip" [class.active]="sectorFilter() === s.id" [style.--c]="s.color" (click)="sectorFilter.set(s.id)">
                  {{ s.icon }} {{ s.label }}
                </button>
              }
            </div>
          </div>

          <div class="soldier-grid">
            @for (s of filteredSoldiers(); track s.id) {
              <article class="soldier-card" (click)="openSoldier(s.id)" (contextmenu)="onSoldierContext($event, s)">
                <header class="soldier-head">
                  <div class="soldier-avatar" [style.background]="sectorColor(s.sectorId) + '22'" [style.color]="sectorColor(s.sectorId)">
                    {{ initials(s.name) }}
                  </div>
                  <div class="soldier-info">
                    <b>{{ s.name }}</b>
                    <p class="soldier-ar" dir="rtl">{{ s.nameAr }}</p>
                    <span class="mono soldier-id">{{ s.id }}</span>
                  </div>
                  <span class="st" [attr.data-s]="s.status">{{ s.status }}</span>
                </header>

                <div class="soldier-body">
                  <div class="soldier-row">
                    <span>🎖 Rank</span>
                    <b>{{ s.rank }}</b>
                  </div>
                  <div class="soldier-row">
                    <span>📍 Sector</span>
                    <b>{{ sectorName(s.sectorId) }}</b>
                  </div>
                  <div class="soldier-row">
                    <span>🏢 Unit</span>
                    <b>{{ s.unit }}</b>
                  </div>
                  <div class="soldier-row">
                    <span>🩸 Blood</span>
                    <b>{{ s.bloodType }}</b>
                  </div>
                  <div class="soldier-row">
                    <span>🎯 Speciality</span>
                    <b>{{ s.speciality }}</b>
                  </div>
                </div>

                <footer class="soldier-foot">
                  <span class="soldier-stat">🎯 {{ s.missions }} missions</span>
                  <span class="soldier-stat">🏅 {{ s.medals }} medals</span>
                </footer>
              </article>
            } @empty {
              <div class="empty-mini full">No soldiers match your filters</div>
            }
          </div>
        </div>
      }

      @else if (active() === 'reports') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Analytics & Reports</h3>
              <p>Operational insights across all sectors</p>
            </div>
            <button class="pill primary" (click)="generateReport()">📄 Generate PDF</button>
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
            <header>
              <div>
                <h4>Transfers by sector</h4>
                <span class="muted">Distribution across all 10 sectors</span>
              </div>
            </header>
            <div class="sector-chart">
              @for (s of sectors; track s.id) {
                <div class="sector-row" (click)="openSector(s.id)">
                  <span class="sr-name">{{ s.name }}</span>
                  <div class="sr-bar">
                    <div class="sr-fill" [style.width.%]="(ordersFromSector(s.id).length / maxSectorOrders()) * 100" [style.background]="s.color"></div>
                  </div>
                  <span class="sr-val mono">{{ ordersFromSector(s.id).length }}</span>
                </div>
              }
            </div>
          </section>

          <div class="grid-2">
            <section class="info-card">
              <header><h4>Status breakdown</h4></header>
              @for (s of statusBreakdown(); track s.label) {
                <div class="breakdown-row">
                  <span class="bd-dot" [style.background]="s.color"></span>
                  <span class="bd-label">{{ s.label }}</span>
                  <div class="bd-bar"><div class="bd-fill" [style.width.%]="s.pct" [style.background]="s.color"></div></div>
                  <span class="bd-val mono">{{ s.count }} ({{ s.pct }}%)</span>
                </div>
              }
            </section>

            <section class="info-card">
              <header><h4>Priority distribution</h4></header>
              @for (p of priorityBreakdown(); track p.label) {
                <div class="breakdown-row">
                  <span class="bd-dot" [style.background]="p.color"></span>
                  <span class="bd-label">{{ p.label }}</span>
                  <div class="bd-bar"><div class="bd-fill" [style.width.%]="p.pct" [style.background]="p.color"></div></div>
                  <span class="bd-val mono">{{ p.count }}</span>
                </div>
              }
            </section>
          </div>

          <section class="info-card">
            <header><h4>Top 5 most transferred soldiers</h4></header>
            @for (s of topTransferred(); track s.soldier.id; let i = $index) {
              <div class="top-row">
                <span class="top-rank">{{ i + 1 }}</span>
                <span class="avatar-m">{{ initials(s.soldier.name) }}</span>
                <div>
                  <b>{{ s.soldier.name }}</b>
                  <small class="mono">{{ s.soldier.id }} · {{ s.soldier.rank }}</small>
                </div>
                <span class="top-count mono">{{ s.count }} transfers</span>
              </div>
            }
          </section>
        </div>
      }

      @if (selectedOrder(); as o) {
        <div class="modal-backdrop" (click)="selectedOrder.set(null)">
          <div class="modal order-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon" [style.background]="statusColor(o.status) + '22'" [style.color]="statusColor(o.status)">
                {{ statusIcon(o.status) }}
              </span>
              <div>
                <h3>Order {{ o.id }}</h3>
                <p>{{ soldierName(o.soldierId) }} · {{ sectorName(o.fromSector) }} → {{ sectorName(o.toSector) }}</p>
              </div>
              <span class="modal-badge" [attr.data-s]="o.status">{{ o.status }}</span>
              <button class="modal-close" (click)="selectedOrder.set(null)">✕</button>
            </header>

            <div class="modal-body">
              <div class="om-grid">
                <div class="om-section">
                  <span class="om-label">Soldier</span>
                  <b>{{ soldierName(o.soldierId) }}</b>
                  <small class="mono">{{ o.soldierId }}</small>
                </div>
                <div class="om-section">
                  <span class="om-label">Priority</span>
                  <span class="pri-badge" [attr.data-p]="o.priority">{{ o.priority }}</span>
                </div>
                <div class="om-section">
                  <span class="om-label">From</span>
                  <b>{{ sectorName(o.fromSector) }}</b>
                  <small>{{ o.fromUnit }}</small>
                </div>
                <div class="om-section">
                  <span class="om-label">To</span>
                  <b>{{ sectorName(o.toSector) }}</b>
                  <small>{{ o.toUnit }}</small>
                </div>
                <div class="om-section">
                  <span class="om-label">Created by</span>
                  <b>{{ o.createdBy }}</b>
                  <small class="mono">{{ o.createdAt }}</small>
                </div>
                <div class="om-section">
                  <span class="om-label">Effective date</span>
                  <b>{{ o.effectiveDate }}</b>
                </div>
                @if (o.approvedBy) {
                  <div class="om-section">
                    <span class="om-label">Approved by</span>
                    <b>{{ o.approvedBy }}</b>
                    <small class="mono">{{ o.approvedAt }}</small>
                  </div>
                }
                @if (o.executedBy) {
                  <div class="om-section">
                    <span class="om-label">Executed by</span>
                    <b>{{ o.executedBy }}</b>
                    <small class="mono">{{ o.executedAt }}</small>
                  </div>
                }
              </div>

              <div class="om-reason">
                <span class="om-label">Reason</span>
                <p>{{ o.reason }}</p>
              </div>

              @if (o.notes) {
                <div class="om-reason">
                  <span class="om-label">Notes</span>
                  <p>{{ o.notes }}</p>
                </div>
              }

              <div class="om-timeline">
                <div class="tl-item" [class.done]="true">
                  <span class="tl-dot"></span>
                  <div>
                    <b>Order created</b>
                    <small class="mono">{{ o.createdAt }} · {{ o.createdBy }}</small>
                  </div>
                </div>
                <div class="tl-item" [class.done]="!!o.approvedAt">
                  <span class="tl-dot"></span>
                  <div>
                    <b>Approved</b>
                    <small class="mono">{{ o.approvedAt || '—' }}{{ o.approvedBy ? ' · ' + o.approvedBy : '' }}</small>
                  </div>
                </div>
                <div class="tl-item" [class.done]="!!o.executedAt">
                  <span class="tl-dot"></span>
                  <div>
                    <b>Executed</b>
                    <small class="mono">{{ o.executedAt || '—' }}{{ o.executedBy ? ' · ' + o.executedBy : '' }}</small>
                  </div>
                </div>
              </div>
            </div>

            <footer class="modal-foot">
              <button class="mf-btn" (click)="printOrder(o)">🖨 Print</button>
              <button class="mf-btn" (click)="exportOrder(o)">📄 Export PDF</button>
              @if (o.status === 'pending') {
                <button class="mf-btn ok" (click)="approve(o.id); selectedOrder.set(null)">✓ Approve &amp; Execute</button>
              } @else if (o.status === 'approved') {
                <button class="mf-btn ok" (click)="execute(o.id); selectedOrder.set(null)">▶ Execute</button>
              } @else {
                <span class="mf-done">✓ Completed</span>
              }
            </footer>
          </div>
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
              <button class="modal-close" (click)="selectedSoldier.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="sm-grid">
                <div class="sm-section"><span class="om-label">ID</span><b class="mono">{{ s.id }}</b></div>
                <div class="sm-section"><span class="om-label">Rank</span><b>{{ s.rank }}</b></div>
                <div class="sm-section"><span class="om-label">Status</span><span class="st" [attr.data-s]="s.status">{{ s.status }}</span></div>
                <div class="sm-section"><span class="om-label">Sector</span><b>{{ sectorName(s.sectorId) }}</b></div>
                <div class="sm-section"><span class="om-label">Unit</span><b>{{ s.unit }}</b></div>
                <div class="sm-section"><span class="om-label">Age</span><b>{{ s.age }}</b></div>
                <div class="sm-section"><span class="om-label">Blood type</span><b>{{ s.bloodType }}</b></div>
                <div class="sm-section"><span class="om-label">City</span><b>{{ s.city }}</b></div>
                <div class="sm-section"><span class="om-label">Phone</span><b class="mono">{{ s.phone }}</b></div>
                <div class="sm-section"><span class="om-label">Enlisted</span><b>{{ s.enlisted }}</b></div>
                <div class="sm-section"><span class="om-label">Speciality</span><b>{{ s.speciality }}</b></div>
                <div class="sm-section"><span class="om-label">Last check-in</span><b>{{ s.lastCheckIn }}</b></div>
              </div>

              <div class="sm-stats">
                <div class="sm-stat"><span>🎯</span><b>{{ s.missions }}</b><small>Missions</small></div>
                <div class="sm-stat"><span>🏅</span><b>{{ s.medals }}</b><small>Medals</small></div>
                <div class="sm-stat"><span>📋</span><b>{{ ordersOfSoldier(s.id).length }}</b><small>Transfers</small></div>
              </div>

              @if (ordersOfSoldier(s.id).length) {
                <div class="sm-orders">
                  <span class="om-label">Transfer history</span>
                  @for (o of ordersOfSoldier(s.id); track o.id) {
                    <div class="sm-order-row" (click)="openOrder(o.id)">
                      <span class="mono">{{ o.id }}</span>
                      <span class="arrow">{{ sectorCode(o.fromSector) }} → {{ sectorCode(o.toSector) }}</span>
                      <span class="st small" [attr.data-s]="o.status">{{ o.status }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      @if (selectedSector(); as s) {
        <div class="modal-backdrop" (click)="selectedSector.set(null)">
          <div class="modal sector-modal" (click)="$event.stopPropagation()">
            <header class="modal-head" [style.borderBottomColor]="s.color">
              <span class="modal-icon" [style.background]="s.color + '22'" [style.color]="s.color">
                {{ s.icon }}
              </span>
              <div>
                <h3>{{ s.name }}</h3>
                <p>{{ s.nameAr }} · {{ s.code }}</p>
              </div>
              <button class="modal-close" (click)="selectedSector.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="sec-stats">
                <div class="sec-stat"><b>{{ s.strength }}</b><small>Personnel</small></div>
                <div class="sec-stat"><b>{{ s.units }}</b><small>Units</small></div>
                <div class="sec-stat"><b>{{ s.readiness }}%</b><small>Readiness</small></div>
                <div class="sec-stat"><b>{{ soldiersInSector(s.id).length }}</b><small>Tracked</small></div>
              </div>

              <div class="sec-info">
                <div class="si-row"><span>Commander</span><b>{{ s.commander }}</b></div>
                <div class="si-row"><span>Region</span><b>{{ s.region }}</b></div>
                <div class="si-row"><span>Location</span><b>{{ s.location }}</b></div>
                <div class="si-row"><span>Established</span><b>{{ s.established }}</b></div>
              </div>

              <div class="sec-soldiers">
                <span class="om-label">Personnel in this sector</span>
                @for (sol of soldiersInSector(s.id); track sol.id) {
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
    .preview-note { margin-bottom: 20px; }
    .view { max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
    .kpi {
      padding: 16px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      border-left: 3px solid var(--c);
      cursor: pointer;
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

    .chart-card {
      padding: 24px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .chart-card > header { display: flex; justify-content: space-between; align-items: baseline;
                           margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .chart-card h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .chart-card header .muted { font-size: var(--fs-2xs); display: block; margin-top: 3px; }
    .legend { display: flex; gap: 16px; font-size: var(--fs-2xs); color: var(--label-2); }
    .legend span { display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .chart-bars { display: flex; align-items: flex-end; gap: 8px; height: 200px; }
    .bar-group {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column-reverse;
      gap: 2px;
      position: relative;
      cursor: pointer;
      align-items: stretch;
    }
    .bar-seg { width: 100%; border-radius: 2px; transition: opacity var(--t-fast); }
    .bar-group:hover .bar-seg { opacity: 0.75; }
    .bar-label {
      position: absolute; bottom: -22px; left: 0; right: 0;
      text-align: center; font-size: 10px; color: var(--label-2);
      font-weight: 600;
    }
    .bar-tip {
      position: absolute;
      top: -28px; left: 50%; transform: translateX(-50%);
      background: var(--accent); color: var(--accent-contrast);
      padding: 3px 10px; border-radius: var(--r-xs);
      font-size: 10px; font-weight: 700; white-space: nowrap;
    }

    .sectors-preview {
      padding: 24px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .sp-head { display: flex; justify-content: space-between; align-items: flex-end;
               margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .sp-head h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .sp-head .muted { font-size: var(--fs-2xs); display: block; margin-top: 3px; }
    .sp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
    .sp-card {
      padding: 14px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      border-left: 3px solid var(--c);
      cursor: pointer;
      transition: all var(--t-base);
    }
    .sp-card:hover { background: var(--bg-fill-3); transform: translateX(3px); }
    .sp-card > header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .sp-icon { font-size: 22px; }
    .sp-card > header > div { flex: 1; min-width: 0; }
    .sp-card b { font-size: var(--fs-xs); font-weight: 700; display: block;
                 overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sp-card small { font-size: 9px; color: var(--label-3); }
    .sp-readiness { font-size: 11px; font-weight: 800; color: var(--c);
                    font-variant-numeric: tabular-nums; }
    .sp-stats { display: flex; gap: 14px; font-size: var(--fs-2xs); color: var(--label-2);
                margin-bottom: 8px; }
    .sp-stats b { color: var(--label); font-weight: 700; }
    .sp-bar { height: 3px; background: var(--bg-surface-solid); border-radius: var(--r-pill); overflow: hidden; }
    .sp-fill { height: 100%; background: var(--c); border-radius: var(--r-pill); }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 820px) { .grid-2 { grid-template-columns: 1fr; } }

    .info-card { padding: 20px; background: var(--bg-surface-solid);
                 border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .info-card > header { margin-bottom: 14px; }
    .info-card h4 { font-size: var(--fs-sm); font-weight: 700; }

    .recent-row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 10px 0;
      border-bottom: 0.5px solid var(--separator);
      cursor: pointer;
      transition: background var(--t-fast);
    }
    .recent-row:last-child { border-bottom: 0; }
    .recent-row:hover { background: var(--bg-hover); margin: 0 -10px; padding: 10px; border-radius: var(--r-xs); }
    .ro-priority {
      font-size: 9px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: var(--r-pill);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .ro-priority[data-p='urgent'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .ro-priority[data-p='high']   { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .ro-priority[data-p='normal'] { background: var(--accent-soft); color: var(--accent); }
    .ro-priority[data-p='low']    { background: var(--bg-fill-3); color: var(--label-2); }
    .ro-info { min-width: 0; }
    .ro-info b { font-size: var(--fs-xs); font-weight: 600; display: block;
                 overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ro-info small { font-size: var(--fs-2xs); color: var(--label-2);
                     overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
    .o-rank {
      font-size: 10px; font-weight: 700;
      padding: 3px 9px; background: var(--accent-soft); color: var(--accent);
      border-radius: var(--r-pill);
      direction: rtl;
    }
    .online-dot { width: 8px; height: 8px; border-radius: 50%; background: #34c759;
                  box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.2); }

    .empty-mini { padding: 40px 20px; text-align: center;
                  color: var(--label-3); font-size: var(--fs-xs); }
    .empty-mini.full { grid-column: 1 / -1; }

    .view-head { display: flex; justify-content: space-between; align-items: flex-end;
                 gap: 16px; flex-wrap: wrap; }
    .view-head h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .view-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }

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

    .priority-filter { display: flex; gap: 4px; }
    .pf-chip {
      padding: 6px 12px; border-radius: var(--r-pill);
      background: var(--bg-fill-2); color: var(--label-2);
      font-size: var(--fs-2xs); font-weight: 600; border: 0; cursor: pointer;
      text-transform: capitalize;
      transition: all var(--t-fast);
    }
    .pf-chip:hover { background: var(--bg-fill-3); color: var(--label); }
    .pf-chip.active { background: var(--accent); color: var(--accent-contrast); }

    .table-wrap {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
    }
    .thead, .trow {
      display: grid;
      grid-template-columns: 90px 1.4fr 200px 90px 100px 100px 90px;
      gap: 14px;
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
    .th { cursor: pointer; user-select: none; }
    .th:hover { color: var(--accent); }
    .trow {
      border-top: 0.5px solid var(--separator);
      cursor: pointer;
      transition: background var(--t-fast);
    }
    .trow:hover { background: var(--bg-hover); }
    .order-id { color: var(--accent); font-weight: 700; }
    .soldier-cell { display: flex; align-items: center; gap: 10px; }
    .avatar-m {
      width: 28px; height: 28px; display: grid; place-items: center;
      background: var(--accent-soft); color: var(--accent);
      border-radius: 50%; font-size: 10px; font-weight: 800; flex-shrink: 0;
    }
    .soldier-cell b { font-size: var(--fs-xs); font-weight: 600; display: block;
                      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .soldier-cell small { font-size: 10px; color: var(--label-3); }
    .route-cell { display: flex; align-items: center; gap: 6px; }
    .sector-tag {
      font-family: var(--sf-mono);
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      background: color-mix(in srgb, var(--c) 15%, transparent);
      color: var(--c);
      border-radius: var(--r-pill);
    }
    .arrow { color: var(--label-3); font-weight: 700; }
    .pri-badge {
      font-size: 10px; font-weight: 800;
      padding: 3px 10px; border-radius: var(--r-pill);
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .pri-badge[data-p='urgent'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .pri-badge[data-p='high']   { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .pri-badge[data-p='normal'] { background: var(--accent-soft); color: var(--accent); }
    .pri-badge[data-p='low']    { background: var(--bg-fill-3); color: var(--label-2); }

    .st {
      padding: 3px 10px; border-radius: var(--r-pill);
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.04em; text-align: center; display: inline-block;
    }
    .st.small { font-size: 9px; padding: 2px 8px; }
    .st[data-s='pending']   { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='approved']  { background: var(--accent-soft); color: var(--accent); }
    .st[data-s='executed']  { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='rejected']  { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .st[data-s='cancelled'] { background: var(--bg-fill-3); color: var(--label-2); }
    .st[data-s='Active']    { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='Transfer']  { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='Leave']     { background: var(--bg-fill-3); color: var(--label-2); }
    .st[data-s='Training']  { background: var(--accent-soft); color: var(--accent); }
    .st[data-s='Medical']   { background: rgba(175, 82, 222, 0.15); color: #af52de; }
    .st[data-s='Retired']   { background: var(--bg-fill-3); color: var(--label-2); }

    .row-actions { display: flex; gap: 4px; justify-content: flex-end; }
    .row-action {
      width: 26px; height: 26px; display: grid; place-items: center;
      border-radius: var(--r-xs); background: transparent; border: 0;
      color: var(--label-3); font-size: 12px; cursor: pointer;
      transition: all var(--t-fast);
    }
    .row-action:hover { background: var(--bg-fill-2); color: var(--label); }
    .row-action.ok:hover { background: rgba(52, 199, 89, 0.15); color: #34c759; }

    .sector-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 14px; }
    .sector-card {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
      cursor: pointer;
      transition: all var(--t-base);
      display: flex;
      flex-direction: column;
      border-top: 3px solid var(--c);
    }
    .sector-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .sc-head { display: flex; align-items: center; gap: 14px; padding: 18px; }
    .sc-icon-wrap {
      width: 48px; height: 48px;
      display: grid; place-items: center;
      background: color-mix(in srgb, var(--c) 15%, transparent);
      border-radius: var(--r-sm);
      flex-shrink: 0;
    }
    .sc-icon { font-size: 24px; }
    .sc-title { flex: 1; min-width: 0; }
    .sc-row { display: flex; align-items: center; gap: 8px; }
    .sc-row h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .sc-code { font-size: 10px; padding: 2px 8px; background: var(--bg-fill-2);
               color: var(--label-2); border-radius: var(--r-pill); font-weight: 700; }
    .sc-ar { font-size: var(--fs-xs); color: var(--label-2); margin: 3px 0; }
    .sc-meta { font-size: 10px; color: var(--label-3); }
    .sc-readiness { text-align: right; }
    .sc-readiness b { font-size: var(--fs-lg); font-weight: 800; color: var(--c);
                      font-variant-numeric: tabular-nums; display: block; line-height: 1; }
    .sc-readiness small { font-size: 9px; color: var(--label-3);
                          text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .sc-body { padding: 0 18px 14px; display: flex; flex-direction: column; gap: 12px; }
    .sc-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .sc-stat {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; background: var(--bg-fill-2); border-radius: var(--r-sm);
    }
    .sc-stat-icon { font-size: 14px; }
    .sc-stat b { font-size: var(--fs-sm); font-weight: 800; display: block;
                 font-variant-numeric: tabular-nums; line-height: 1; }
    .sc-stat small { font-size: 9px; color: var(--label-3);
                     text-transform: uppercase; letter-spacing: 0.04em; }
    .sc-commander {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; background: var(--bg-fill-2); border-radius: var(--r-sm);
    }
    .sc-c-icon { font-size: 16px; }
    .sc-commander small { font-size: 9px; color: var(--label-3);
                          text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;
                          display: block; }
    .sc-commander b { font-size: var(--fs-xs); font-weight: 700; }
    .sc-bar { height: 4px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .sc-fill { height: 100%; background: var(--c); border-radius: var(--r-pill); }
    .sc-foot {
      padding: 12px 18px; border-top: 0.5px solid var(--separator);
      display: flex; justify-content: space-between; align-items: center;
      font-size: 10px; color: var(--label-3);
    }
    .sc-open { color: var(--c); font-weight: 700; }

    .soldier-filters { display: flex; flex-direction: column; gap: 8px; }
    .sf-chip-row { display: flex; gap: 4px; flex-wrap: wrap; }
    .sf-chip {
      padding: 5px 11px; border-radius: var(--r-pill);
      background: var(--bg-fill-2); color: var(--label-2);
      font-size: var(--fs-2xs); font-weight: 600; border: 0; cursor: pointer;
      display: inline-flex; align-items: center; gap: 5px;
      transition: all var(--t-fast);
    }
    .sf-chip:hover { background: var(--bg-fill-3); color: var(--label); }
    .sf-chip.active {
      background: var(--accent); color: var(--accent-contrast);
    }
    .sf-chip[style*='--c'] { border-left: 3px solid var(--c); }

    .soldier-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .soldier-card {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      padding: 14px;
      cursor: pointer;
      transition: all var(--t-base);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .soldier-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md);
                          border-color: var(--accent); }
    .soldier-head { display: flex; align-items: center; gap: 10px; }
    .soldier-avatar {
      width: 44px; height: 44px; display: grid; place-items: center;
      border-radius: 50%; font-size: 15px; font-weight: 800; flex-shrink: 0;
    }
    .soldier-info { flex: 1; min-width: 0; }
    .soldier-info b { font-size: var(--fs-xs); font-weight: 700; display: block;
                      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .soldier-ar { font-size: 10px; color: var(--label-2); margin: 2px 0; }
    .soldier-id { font-size: 9px; color: var(--label-3); }
    .soldier-body { display: flex; flex-direction: column; gap: 4px; }
    .soldier-row { display: flex; justify-content: space-between; align-items: center;
                   padding: 5px 0; font-size: 10px; border-bottom: 0.5px solid var(--separator); }
    .soldier-row:last-child { border-bottom: 0; }
    .soldier-row span { color: var(--label-3); }
    .soldier-row b { font-weight: 700; color: var(--label); }
    .soldier-foot { display: flex; justify-content: space-between; padding-top: 8px;
                    border-top: 0.5px solid var(--separator); }
    .soldier-stat { font-size: 10px; color: var(--label-2); font-weight: 600; }

    .report-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .report-kpis { grid-template-columns: repeat(2, 1fr); } }
    .report-kpi {
      padding: 18px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md);
      border-left: 3px solid var(--c);
    }
    .rk-icon { font-size: 20px; }
    .rk-val { display: block; font-size: var(--fs-2xl); font-weight: 800;
              letter-spacing: -0.03em; font-variant-numeric: tabular-nums;
              line-height: 1; margin-top: 6px; }
    .rk-label { display: block; font-size: var(--fs-2xs); color: var(--label-2);
                text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;
                margin-top: 4px; }

    .sector-chart { display: flex; flex-direction: column; gap: 10px; }
    .sector-row { display: grid; grid-template-columns: 160px 1fr 50px; gap: 14px;
                  align-items: center; cursor: pointer; padding: 4px 8px;
                  border-radius: var(--r-xs); transition: background var(--t-fast); }
    .sector-row:hover { background: var(--bg-hover); }
    .sr-name { font-size: var(--fs-xs); font-weight: 600; }
    .sr-bar { height: 8px; background: var(--bg-fill-2); border-radius: var(--r-pill);
              overflow: hidden; }
    .sr-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms var(--ease-out); }
    .sr-val { text-align: right; font-size: var(--fs-xs); font-weight: 700; }

    .breakdown-row { display: grid; grid-template-columns: 12px 100px 1fr 100px;
                     gap: 12px; align-items: center; padding: 10px 0;
                     border-bottom: 0.5px solid var(--separator); font-size: var(--fs-xs); }
    .breakdown-row:last-child { border-bottom: 0; }
    .bd-dot { width: 10px; height: 10px; border-radius: 50%; }
    .bd-label { color: var(--label-2); }
    .bd-bar { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill);
              overflow: hidden; }
    .bd-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms var(--ease-out); }
    .bd-val { text-align: right; font-weight: 700; }

    .top-row {
      display: grid;
      grid-template-columns: 32px 40px 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 10px 0;
      border-bottom: 0.5px solid var(--separator);
      font-size: var(--fs-xs);
    }
    .top-row:last-child { border-bottom: 0; }
    .top-rank {
      width: 24px; height: 24px; display: grid; place-items: center;
      background: var(--accent-soft); color: var(--accent);
      border-radius: 50%; font-size: 11px; font-weight: 800;
    }
    .top-row b { font-weight: 600; display: block; }
    .top-row small { font-size: 10px; color: var(--label-2); }
    .top-count { color: var(--accent); font-weight: 700; }

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
      max-width: 720px; width: 100%; max-height: 85vh;
      background: var(--bg-elevated);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
      box-shadow: var(--shadow-xl);
      display: flex; flex-direction: column;
      overflow: hidden;
      animation: modalIn 300ms var(--ease-spring);
    }
    .modal.soldier-modal { max-width: 640px; }
    .modal.sector-modal { max-width: 760px; }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-head {
      display: flex; align-items: center; gap: 14px;
      padding: 20px 24px;
      border-bottom: 0.5px solid var(--separator);
    }
    .modal-icon {
      width: 48px; height: 48px; display: grid; place-items: center;
      border-radius: var(--r-md); font-size: 20px; flex-shrink: 0;
      font-weight: 800;
    }
    .modal-head > div { flex: 1; }
    .modal-head h3 { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.015em; }
    .modal-head p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 2px; }
    .modal-badge {
      padding: 4px 12px; border-radius: var(--r-pill);
      font-size: 10px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .modal-badge[data-s='pending']   { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .modal-badge[data-s='approved']  { background: var(--accent-soft); color: var(--accent); }
    .modal-badge[data-s='executed']  { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .modal-badge[data-s='rejected']  { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .modal-badge[data-s='cancelled'] { background: var(--bg-fill-3); color: var(--label-2); }
    .modal-close {
      width: 32px; height: 32px; display: grid; place-items: center;
      border-radius: var(--r-xs); color: var(--label-3); font-size: 16px;
      background: transparent; border: 0; cursor: pointer;
      transition: all var(--t-fast);
    }
    .modal-close:hover { background: var(--bg-hover); color: var(--label); }
    .modal-body { flex: 1; overflow-y: auto; padding: 24px;
                  display: flex; flex-direction: column; gap: 20px; }

    .om-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 600px) { .om-grid { grid-template-columns: 1fr; } }
    .om-section { display: flex; flex-direction: column; gap: 3px; }
    .om-label {
      font-size: 9px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--label-3);
      margin-bottom: 2px;
    }
    .om-section b { font-size: var(--fs-sm); font-weight: 700; }
    .om-section small { font-size: 10px; color: var(--label-2); }

    .om-reason { display: flex; flex-direction: column; gap: 4px; }
    .om-reason p { font-size: var(--fs-sm); line-height: 1.5; color: var(--label); }

    .om-timeline { display: flex; flex-direction: column; gap: 14px;
                   padding: 14px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .tl-item { display: flex; gap: 12px; align-items: flex-start; position: relative; }
    .tl-item::before {
      content: ''; position: absolute;
      left: 6px; top: 20px; bottom: -14px;
      width: 1px; background: var(--separator);
    }
    .tl-item:last-child::before { display: none; }
    .tl-dot {
      width: 13px; height: 13px; border-radius: 50%;
      background: var(--bg-fill-3); margin-top: 3px;
      border: 2px solid var(--bg-surface-solid);
      box-shadow: 0 0 0 1px var(--separator);
      flex-shrink: 0;
    }
    .tl-item.done .tl-dot { background: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .tl-item b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .tl-item small { font-size: 10px; color: var(--label-2); }

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
    .mf-btn.ok { background: #34c759; color: #fff; }
    .mf-btn.ok:hover { background: #2eb14e; }
    .mf-done {
      padding: 9px 16px; background: rgba(52, 199, 89, 0.15); color: #34c759;
      border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 700;
    }

    .sm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 600px) { .sm-grid { grid-template-columns: 1fr; } }
    .sm-section { display: flex; flex-direction: column; gap: 2px; }
    .sm-section b { font-size: var(--fs-sm); font-weight: 700; }
    .sm-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .sm-stat {
      padding: 14px; background: var(--bg-fill-2); border-radius: var(--r-sm);
      display: flex; flex-direction: column; align-items: center; gap: 2px;
    }
    .sm-stat span { font-size: 20px; }
    .sm-stat b { font-size: var(--fs-xl); font-weight: 800;
                 font-variant-numeric: tabular-nums; }
    .sm-stat small { font-size: 10px; color: var(--label-2);
                     text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .sm-orders { display: flex; flex-direction: column; gap: 6px; }
    .sm-order-row {
      display: grid; grid-template-columns: auto auto 1fr auto;
      gap: 10px; align-items: center;
      padding: 8px 12px; background: var(--bg-fill-2);
      border-radius: var(--r-xs); font-size: 10px;
      cursor: pointer; transition: background var(--t-fast);
    }
    .sm-order-row:hover { background: var(--bg-fill-3); }
    .avatar-s {
      width: 22px; height: 22px; display: grid; place-items: center;
      background: var(--accent-soft); color: var(--accent);
      border-radius: 50%; font-size: 9px; font-weight: 800;
    }

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
  `],
})
export class TransferOrdersPreviewComponent {
  private menu = inject(ContextMenuService);
  public toast = inject(ToastService);

  readonly sectors = SECTORS;
  readonly soldiers = SOLDIERS;
  readonly officers = OFFICERS;

  readonly orders = signal<TransferOrder[]>([...TRANSFER_ORDERS]);

  readonly active = signal('dashboard');
  readonly orderFilter = signal<string>('all');
  readonly priorityFilter = signal<string>('all');
  readonly rankFilter = signal<string>('all');
  readonly sectorFilter = signal<string>('all');
  readonly searchQuery = signal('');
  readonly hoverBar = signal(-1);
  readonly selectedOrder = signal<TransferOrder | null>(null);
  readonly selectedSoldier = signal<Soldier | null>(null);
  readonly selectedSector = signal<Sector | null>(null);
  readonly orderSort = signal<{ key: keyof TransferOrder; dir: 1 | -1 }>({ key: 'createdAt', dir: -1 });

  readonly nav = computed<PreviewNavItem[]>(() => [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', group: 'Command' },
    { id: 'orders', label: 'Orders', icon: '📋', badge: this.orders().length, group: 'Operations' },
    { id: 'sectors', label: 'Sectors', icon: '🗺', badge: this.sectors.length, group: 'Operations' },
    { id: 'soldiers', label: 'Personnel', icon: '👥', badge: this.soldiers.length, group: 'Operations' },
    { id: 'reports', label: 'Reports', icon: '📈', group: 'Analytics' },
  ]);

  readonly toolbar = computed<ToolbarAction[]>(() => [
    { id: 'refresh', label: 'Refresh', icon: '⟳', action: () => this.toast.success('Data refreshed') },
    { id: 'create', label: 'New Order', icon: '＋', primary: true, action: () => this.createOrder() },
  ]);

  readonly notifs = signal<PreviewNotification[]>([
    { id: 1, icon: '🔴', title: '3 urgent transfers pending', body: 'Requires immediate approval', time: '2m' },
    { id: 2, icon: '✅', title: 'Order A-1047 executed', body: 'Soldier successfully transferred', time: '1h' },
    { id: 3, icon: '📊', title: 'Q4 report ready', body: 'Sector performance summary', time: '3h' },
    { id: 4, icon: '⚠️', title: 'Sector 6 at 98% readiness', body: 'Highest readiness in network', time: '5h' },
  ]);

  readonly searchPlaceholder = computed(() =>
    this.active() === 'orders' ? 'Search orders, soldiers, sectors…' :
      this.active() === 'soldiers' ? 'Search by name, ID, speciality…' : ''
  );

  readonly priorities = [
    { id: 'all', label: 'All' },
    { id: 'urgent', label: 'Urgent' },
    { id: 'high', label: 'High' },
    { id: 'normal', label: 'Normal' },
    { id: 'low', label: 'Low' },
  ];

  readonly rankFilters = ['all', 'Private', 'Corporal', 'Sergeant', 'Staff Sergeant', 'Warrant Officer', 'Lieutenant', 'First Lieutenant', 'Captain', 'Major'];

  readonly sectorFilters = computed(() => [
    { id: 'all', label: 'All', icon: '🌍', color: 'var(--label-2)' },
    ...this.sectors.map(s => ({ id: s.id, label: s.code, icon: s.icon, color: s.color })),
  ]);

  readonly orderFilters = [
    { id: 'all', label: 'All', icon: '📁' },
    { id: 'pending', label: 'Pending', icon: '⏳' },
    { id: 'approved', label: 'Approved', icon: '✓' },
    { id: 'executed', label: 'Executed', icon: '✅' },
    { id: 'rejected', label: 'Rejected', icon: '✕' },
    { id: 'cancelled', label: 'Cancelled', icon: '🚫' },
  ];

  readonly activityData = Array.from({ length: 14 }, (_, i) => ({
    day: `${i + 1}`,
    executed: Math.floor(Math.random() * 5) + 1,
    approved: Math.floor(Math.random() * 4),
    pending: Math.floor(Math.random() * 3),
  }));

  readonly kpis = computed(() => {
    const orders = this.orders();
    const total = orders.length;
    const executed = orders.filter(o => o.status === 'executed').length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const totalStrength = this.sectors.reduce((s, x) => s + x.strength, 0);
    return [
      { icon: '📋', label: 'Total Orders', value: total.toString(), color: '#007aff', pct: 100, trend: '+12%', up: true, action: () => this.active.set('orders') },
      { icon: '✅', label: 'Executed', value: executed.toString(), color: '#34c759', pct: (executed / total) * 100, trend: '+8%', up: true, action: () => { this.orderFilter.set('executed'); this.active.set('orders'); } },
      { icon: '⏳', label: 'Pending', value: pending.toString(), color: '#ff9500', pct: (pending / total) * 100, trend: '+3', up: false, action: () => { this.orderFilter.set('pending'); this.active.set('orders'); } },
      { icon: '👥', label: 'Total Personnel', value: totalStrength.toLocaleString(), color: '#af52de', pct: 100, trend: '+2%', up: true, action: () => this.active.set('sectors') },
    ];
  });

  readonly filteredOrders = computed(() => {
    let list = this.orders();
    const f = this.orderFilter();
    if (f !== 'all') list = list.filter(o => o.status === f);
    const p = this.priorityFilter();
    if (p !== 'all') list = list.filter(o => o.priority === p);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(o =>
      o.id.toLowerCase().includes(q) ||
      this.soldierName(o.soldierId).toLowerCase().includes(q) ||
      o.reason.toLowerCase().includes(q) ||
      this.sectorName(o.fromSector).toLowerCase().includes(q) ||
      this.sectorName(o.toSector).toLowerCase().includes(q)
    );
    const { key, dir } = this.orderSort();
    return [...list].sort((a, b) => {
      const av = a[key] ?? '';
      const bv = b[key] ?? '';
      return String(av).localeCompare(String(bv)) * dir;
    });
  });

  readonly filteredSoldiers = computed(() => {
    let list = this.soldiers;
    const r = this.rankFilter();
    if (r !== 'all') list = list.filter(s => s.rank === r);
    const sec = this.sectorFilter();
    if (sec !== 'all') list = list.filter(s => s.sectorId === sec);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.speciality.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q)
    );
    return list;
  });

  readonly pendingOrders = computed(() => this.orders().filter(o => o.status === 'pending'));
  readonly onlineOfficers = computed(() => this.officers.filter(o => o.online));
  readonly totalStrength = computed(() => this.sectors.reduce((s, x) => s + x.strength, 0));
  readonly maxStrength = computed(() => Math.max(...this.sectors.map(s => s.strength)));
  readonly maxSectorOrders = computed(() =>
    Math.max(...this.sectors.map(s => this.ordersFromSector(s.id).length))
  );

  readonly statusBreakdown = computed(() => {
    const total = this.orders().length;
    const colors: Record<string, string> = {
      pending: '#ff9500', approved: '#007aff', executed: '#34c759',
      rejected: '#ff3b30', cancelled: '#8e8e93',
    };
    return this.orderFilters.slice(1).map(f => {
      const count = this.orders().filter(o => o.status === f.id).length;
      return { label: f.label, count, pct: (count / total) * 100, color: colors[f.id] };
    });
  });

  readonly priorityBreakdown = computed(() => {
    const total = this.orders().length;
    const colors: Record<string, string> = {
      urgent: '#ff3b30', high: '#ff9500', normal: '#007aff', low: '#8e8e93',
    };
    return this.priorities.slice(1).map(p => {
      const count = this.orders().filter(o => o.priority === p.id).length;
      return { label: p.label, count, pct: (count / total) * 100, color: colors[p.id] };
    });
  });

  readonly reportKpis = computed(() => [
    { icon: '📋', label: 'Total transfers', value: this.orders().length.toString(), color: '#007aff' },
    { icon: '✅', label: 'Success rate', value: `${Math.round((this.orders().filter(o => o.status === 'executed').length / this.orders().length) * 100)}%`, color: '#34c759' },
    { icon: '⚡', label: 'Avg approval time', value: '4.2h', color: '#ff9500' },
    { icon: '🛡', label: 'Compliance', value: '99.4%', color: '#af52de' },
  ]);

  readonly topTransferred = computed(() => {
    const counts = new Map<string, number>();
    this.orders().forEach(o => counts.set(o.soldierId, (counts.get(o.soldierId) ?? 0) + 1));
    return Array.from(counts.entries())
      .map(([id, count]) => ({ soldier: this.soldiers.find(s => s.id === id)!, count }))
      .filter(x => x.soldier)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  onSearch(q: string): void { this.searchQuery.set(q); }

  soldierName(id: string): string {
    return this.soldiers.find(s => s.id === id)?.name ?? id;
  }

  soldierById(id: string): Soldier | undefined {
    return this.soldiers.find(s => s.id === id);
  }

  sectorById(id: string): Sector | undefined {
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

  orderId(id: string): string {
    return id;
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n.charAt(0)).join('');
  }

  countOrdersBy(status: string): number {
    if (status === 'all') return this.orders().length;
    return this.orders().filter(o => o.status === status).length;
  }

  soldiersInSector(id: string): Soldier[] {
    return this.soldiers.filter(s => s.sectorId === id);
  }

  ordersFromSector(id: string): TransferOrder[] {
    return this.orders().filter(o => o.fromSector === id);
  }

  ordersOfSoldier(id: string): TransferOrder[] {
    return this.orders().filter(o => o.soldierId === id);
  }

  sortOrders(key: keyof TransferOrder): void {
    this.orderSort.update(s => s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 });
  }

  sortIcon(key: string, sort: { key: string; dir: 1 | -1 }): string {
    return sort.key === key ? (sort.dir === 1 ? '▲' : '▼') : '';
  }

  statusColor(status: string): string {
    return { pending: '#ff9500', approved: '#007aff', executed: '#34c759', rejected: '#ff3b30', cancelled: '#8e8e93' }[status] ?? '#8e8e93';
  }

  statusIcon(status: string): string {
    return { pending: '⏳', approved: '✓', executed: '✅', rejected: '✕', cancelled: '🚫' }[status] ?? '📋';
  }

  openOrder(id: string): void {
    const o = this.orders().find(x => x.id === id);
    if (o) this.selectedOrder.set(o);
  }

  openSoldier(id: string): void {
    const s = this.soldierById(id);
    if (s) this.selectedSoldier.set(s);
  }

  openSector(id: string): void {
    const s = this.sectorById(id);
    if (s) this.selectedSector.set(s);
  }

  approve(id: string): void {
    const order = this.orders().find(o => o.id === id);
    if (!order) return;
    this.orders.update(list => list.map(o =>
      o.id === id ? {
        ...o,
        status: 'approved' as const,
        approvedBy: 'Gen. Mostafa Fahmy',
        approvedAt: new Date().toISOString().slice(0, 10),
      } : o
    ));
    this.toast.success(`Order ${id} approved`, 'Awaiting execution', '✓');
  }

  execute(id: string): void {
    const order = this.orders().find(o => o.id === id);
    if (!order) return;
    this.orders.update(list => list.map(o =>
      o.id === id ? {
        ...o,
        status: 'executed' as const,
        executedBy: 'Maj. Bahaa Adel',
        executedAt: new Date().toISOString().slice(0, 10),
      } : o
    ));
    this.toast.success(`Order ${id} executed`, 'Soldier transferred successfully', '✅');
  }

  createOrder(): void {
    const nextNum = this.orders().length + 1029;
    const newId = `A-${nextNum}`;
    const soldier = this.soldiers[Math.floor(Math.random() * this.soldiers.length)];
    const toSector = this.sectors.find(s => s.id !== soldier.sectorId)!;
    const newOrder: TransferOrder = {
      id: newId,
      soldierId: soldier.id,
      fromSector: soldier.sectorId,
      toSector: toSector.id,
      fromUnit: soldier.unit,
      toUnit: 'Battalion 1',
      status: 'pending',
      priority: 'normal',
      reason: 'Operational need',
      createdBy: 'Current User',
      createdAt: new Date().toISOString().slice(0, 10),
      effectiveDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    };
    this.orders.update(list => [newOrder, ...list]);
    this.orderFilter.set('all');
    this.active.set('orders');
    this.toast.success(`Order ${newId} created`, `For ${soldier.name}`, '📋');
  }

  printOrder(o: TransferOrder): void {
    this.toast.info('Printing order ' + o.id, 'Sending to printer…', '🖨');
  }

  exportOrder(o: TransferOrder): void {
    this.toast.success('Order ' + o.id + ' exported', 'PDF saved', '📄');
  }

  generateReport(): void {
    this.toast.success('Generating PDF report', 'All sectors summary', '📄');
  }

  onOrderContext(ev: MouseEvent, o: TransferOrder): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: 'View details', icon: '👁', action: () => this.openOrder(o.id) },
      { id: 'print', label: 'Print', icon: '🖨', action: () => this.printOrder(o) },
      { id: 'export', label: 'Export PDF', icon: '📄', action: () => this.exportOrder(o) },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'copy', label: 'Copy order ID', icon: '📋',
        action: () => { navigator.clipboard?.writeText(o.id); this.toast.success('Copied ' + o.id); }
      },
      { id: 'sep2', label: '', separatorBefore: true, action: () => { } },
      ...(o.status === 'pending' ? [{ id: 'approve', label: 'Approve order', icon: '✓', action: () => this.approve(o.id) }] : []),
      ...(o.status === 'approved' ? [{ id: 'execute', label: 'Execute now', icon: '▶', action: () => this.execute(o.id) }] : []),
    ]);
  }

  onSoldierContext(ev: MouseEvent, s: Soldier): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: 'View soldier', icon: '👁', action: () => this.openSoldier(s.id) },
      { id: 'transfer', label: 'Create transfer', icon: '🔀', action: () => this.createOrder() },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'copy-id', label: 'Copy ID', icon: '📋',
        action: () => { navigator.clipboard?.writeText(s.id); this.toast.success('Copied ' + s.id); }
      },
      {
        id: 'copy-phone', label: 'Copy phone', icon: '📞',
        action: () => { navigator.clipboard?.writeText(s.phone); this.toast.success('Phone copied'); }
      },
    ]);
  }

  onSectorContext(ev: MouseEvent, s: Sector): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: 'Open sector', icon: '📂', action: () => this.openSector(s.id) },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'copy-code', label: 'Copy sector code', icon: '📋',
        action: () => { navigator.clipboard?.writeText(s.code); this.toast.success('Copied ' + s.code); }
      },
      {
        id: 'filter', label: 'Filter soldiers by sector', icon: '🔍',
        action: () => { this.sectorFilter.set(s.id); this.active.set('soldiers'); }
      },
    ]);
  }
}