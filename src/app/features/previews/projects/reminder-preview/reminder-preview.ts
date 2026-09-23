import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { REMINDER_ZONES, REMINDER_SOLDIERS, REMINDER_OFFICERS, Reminder, REMINDERS, ReminderSoldier, Zone, STATUS_BREAKDOWN, TYPE_LABELS, SECTOR_LOOKUP, ReminderOfficer } from '../../../../data/reminder.data';
import { DummyDataEditorComponent } from '../../shared/dummy-data-editor/dummy-data-editor';
import { PreviewShellComponent, PreviewNavItem, ToolbarAction, PreviewNotification } from '../../shared/preview-shell/preview-shell';


@Component({
  selector: 'app-reminder-preview',
  standalone: true,
  imports: [PreviewShellComponent, FormsModule, DummyDataEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🔔"
      title="Reminder"
      subtitle="FOE · {{ zones.length }} zones · {{ reminders().length }} active"
      [nav]="nav()"
      [active]="active()"
      (activeChange)="active.set($any($event))"
      [toolbarActions]="toolbar()"
      [notifications]="notifs()"
      [searchPlaceholder]="searchPlaceholder()"
      (searchChange)="onSearch($event)"
    >
      <div class="preview-note">
        <app-dummy-data-editor projectId="reminder" />
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

          <div class="live-banner" [class.alert]="criticalCount() > 0">
            <span class="lb-icon">{{ criticalCount() > 0 ? '🚨' : '✅' }}</span>
            <div class="lb-content">
              <b>{{ criticalCount() > 0 ? criticalCount() + ' critical alerts active' : 'All systems normal' }}</b>
              <small>{{ criticalCount() > 0 ? 'Immediate attention required' : 'No critical alerts at this time' }}</small>
            </div>
            @if (criticalCount() > 0) {
              <button class="lb-action" (click)="filterByStatus('escalated')">View all</button>
            }
          </div>

          <section class="chart-card">
            <header>
              <div>
                <h4>Activity — last 14 days</h4>
                <span class="muted mono">{{ reminders().length }} total reminders</span>
              </div>
              <div class="legend">
                <span><i class="dot" style="background:#34c759"></i> Confirmed</span>
                <span><i class="dot" style="background:#ff9500"></i> Pending</span>
                <span><i class="dot" style="background:#ff3b30"></i> Escalated</span>
              </div>
            </header>
            <div class="chart-bars">
              @for (d of activityData; track $index) {
                <div class="bar-group" (mouseenter)="hoverBar.set($index)" (mouseleave)="hoverBar.set(-1)">
                  @if (hoverBar() === $index) {
                    <div class="bar-tip">{{ d.confirmed + d.pending + d.escalated }} reminders</div>
                  }
                  <div class="bar-seg" [style.height.%]="d.confirmed * 4" style="background:#34c759"></div>
                  <div class="bar-seg" [style.height.%]="d.pending * 4" style="background:#ff9500"></div>
                  <div class="bar-seg" [style.height.%]="d.escalated * 4" style="background:#ff3b30"></div>
                  <span class="bar-label">{{ d.day }}</span>
                </div>
              }
            </div>
          </section>

          <section class="live-feed">
            <header class="lf-head">
              <div>
                <h4>Live notification feed</h4>
                <span class="muted">{{ activeReminders().length }} active alerts</span>
              </div>
              <button class="pill-sm" (click)="active.set('feed')">View all →</button>
            </header>
            <div class="lf-list">
              @for (r of activeReminders().slice(0, 6); track r.id) {
                <div class="lf-item" [attr.data-p]="r.priority" (click)="openReminder(r.id)" (contextmenu)="onReminderContext($event, r)">
                  <span class="lf-pulse" [attr.data-p]="r.priority"></span>
                  <div class="lf-icon" [style.background]="typeColor(r.type) + '22'" [style.color]="typeColor(r.type)">
                    {{ typeIcon(r.type) }}
                  </div>
                  <div class="lf-body">
                    <div class="lf-title-row">
                      <b>{{ r.title }}</b>
                      <span class="lf-pri" [attr.data-p]="r.priority">{{ r.priority }}</span>
                    </div>
                    <p>{{ r.description }}</p>
                    <div class="lf-meta">
                      <span>👤 {{ soldierName(r.soldierId) }}</span>
                      <span>📍 {{ r.location }}</span>
                      <span>🕐 {{ timeAgo(r.createdAt) }}</span>
                    </div>
                  </div>
                  @if (r.status === 'pending' || r.status === 'overdue') {
                    <button class="lf-confirm" (click)="$event.stopPropagation(); confirm(r.id)">✓ Confirm</button>
                  }
                </div>
              } @empty {
                <div class="empty-mini">All reminders resolved</div>
              }
            </div>
          </section>

          <div class="grid-2">
            <section class="info-card">
              <header><h4>Active zones</h4></header>
              @for (z of activeZones().slice(0, 5); track z.id) {
                <div class="zone-row" (click)="openZone(z.id)">
                  <span class="zr-icon" [style.background]="z.color + '22'" [style.color]="z.color">{{ z.icon }}</span>
                  <div class="zr-info">
                    <b>{{ z.name }}</b>
                    <small class="mono">{{ z.code }} · {{ z.activeSoldiers }} soldiers</small>
                  </div>
                  <span class="zr-risk" [attr.data-r]="z.riskLevel">{{ z.riskLevel }}</span>
                </div>
              }
            </section>

            <section class="info-card">
              <header><h4>Officers online</h4></header>
              @for (o of onlineOfficers().slice(0, 5); track o.id) {
                <div class="zone-row" (click)="toast.info(o.rank + ' ' + o.name, o.role)">
                  <span class="zr-icon" style="background:var(--accent-soft); color:var(--accent)">👤</span>
                  <div class="zr-info">
                    <b>{{ o.rank }} {{ o.name }}</b>
                    <small>{{ sectorName(o.sectorId) }} · {{ o.role }}</small>
                  </div>
                  <div class="workload-mini">
                    <span class="wl-bar"><span class="wl-fill" [style.width.%]="o.workload" [style.background]="workloadColor(o.workload)"></span></span>
                    <small class="mono">{{ o.workload }}%</small>
                  </div>
                </div>
              }
            </section>
          </div>
        </div>
      }

      @else if (active() === 'feed') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Notification Feed</h3>
              <p>{{ filteredReminders().length }} of {{ reminders().length }} reminders</p>
            </div>
            <button class="pill primary" (click)="createReminder()">＋ New Reminder</button>
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
            <div class="priority-filter">
              @for (p of priorities; track p.id) {
                <button class="pf-chip" [class.active]="priorityFilter() === p.id" [attr.data-p]="p.id" (click)="priorityFilter.set(p.id)">
                  {{ p.label }}
                </button>
              }
            </div>
          </div>

          <div class="type-chips">
            @for (t of typeFilters; track t.id) {
              <button class="tc" [class.active]="typeFilter() === t.id" (click)="typeFilter.set(t.id)">
                <span>{{ t.icon }}</span>
                <span>{{ t.label }}</span>
              </button>
            }
          </div>

          <div class="feed-list">
            @for (r of filteredReminders(); track r.id) {
              <article class="feed-card" [attr.data-p]="r.priority" (click)="openReminder(r.id)" (contextmenu)="onReminderContext($event, r)">
                <div class="fc-left" [style.background]="typeColor(r.type) + '15'" [style.color]="typeColor(r.type)">
                  <span class="fc-icon">{{ typeIcon(r.type) }}</span>
                  <span class="fc-pulse" [attr.data-p]="r.priority"></span>
                </div>
                <div class="fc-body">
                  <div class="fc-head">
                    <b>{{ r.title }}</b>
                    <div class="fc-tags">
                      <span class="pri-badge" [attr.data-p]="r.priority">{{ r.priority }}</span>
                      <span class="st" [attr.data-s]="r.status">{{ r.status }}</span>
                    </div>
                  </div>
                  <p>{{ r.description }}</p>
                  <div class="fc-meta">
                    <span class="fc-meta-item">
                      <span class="avatar-m">{{ initials(soldierName(r.soldierId)) }}</span>
                      {{ soldierName(r.soldierId) }}
                    </span>
                    <span class="fc-meta-item">📍 {{ r.location }}</span>
                    <span class="fc-meta-item">🕐 {{ timeAgo(r.createdAt) }}</span>
                    <span class="fc-meta-item">👤 {{ officerName(r.officerId) }}</span>
                  </div>
                  @if (r.notes.length) {
                    <div class="fc-notes">
                      <span class="notes-count">💬 {{ r.notes.length }} note{{ r.notes.length > 1 ? 's' : '' }}</span>
                    </div>
                  }
                </div>
                <div class="fc-actions">
                  @if (r.status === 'pending') {
                    <button class="fc-btn ok" (click)="$event.stopPropagation(); confirm(r.id)" title="Confirm">✓</button>
                  }
                  @if (r.status === 'pending' || r.status === 'overdue') {
                    <button class="fc-btn warn" (click)="$event.stopPropagation(); escalate(r.id)" title="Escalate">🚨</button>
                  }
                  <button class="fc-btn" (click)="$event.stopPropagation(); openReminder(r.id)" title="View">👁</button>
                </div>
              </article>
            } @empty {
              <div class="empty-mini full">No reminders match your filters</div>
            }
          </div>
        </div>
      }

      @else if (active() === 'zones') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Operational Zones</h3>
              <p>{{ zones.length }} zones across {{ sectorCount() }} sectors</p>
            </div>
          </header>

          <div class="zone-stats-row">
            <div class="zs-card">
              <span class="zs-icon">🟢</span>
              <div><b>{{ zonesByRisk('low').length }}</b><small>Low risk</small></div>
            </div>
            <div class="zs-card">
              <span class="zs-icon">🟡</span>
              <div><b>{{ zonesByRisk('medium').length }}</b><small>Medium</small></div>
            </div>
            <div class="zs-card">
              <span class="zs-icon">🟠</span>
              <div><b>{{ zonesByRisk('high').length }}</b><small>High</small></div>
            </div>
            <div class="zs-card critical">
              <span class="zs-icon">🔴</span>
              <div><b>{{ zonesByRisk('critical').length }}</b><small>Critical</small></div>
            </div>
          </div>

          <div class="zone-grid">
            @for (z of zones; track z.id) {
              <article class="zone-card" [style.--c]="z.color" (click)="openZone(z.id)" (contextmenu)="onZoneContext($event, z)">
                <header class="zc-head">
                  <span class="zc-icon" [style.background]="z.color + '22'" [style.color]="z.color">{{ z.icon }}</span>
                  <div class="zc-title">
                    <div class="zc-row">
                      <b>{{ z.name }}</b>
                      <span class="zc-code mono">{{ z.code }}</span>
                    </div>
                    <p class="zc-ar" dir="rtl">{{ z.nameAr }}</p>
                  </div>
                  <span class="zc-risk" [attr.data-r]="z.riskLevel">{{ z.riskLevel }}</span>
                </header>

                <div class="zc-body">
                  <div class="zc-stats">
                    <div class="zc-stat">
                      <span class="zs-i">👥</span>
                      <b>{{ z.activeSoldiers }}</b>
                      <small>Soldiers</small>
                    </div>
                    <div class="zc-stat">
                      <span class="zs-i">📋</span>
                      <b>{{ remindersInZone(z.id).length }}</b>
                      <small>Reminders</small>
                    </div>
                    <div class="zc-stat">
                      <span class="zs-i">⚠️</span>
                      <b>{{ criticalInZone(z.id) }}</b>
                      <small>Critical</small>
                    </div>
                  </div>

                  <div class="zc-type">
                    <span class="type-chip">{{ typeIconForZone(z.type) }} {{ z.type }}</span>
                    <span class="type-chip">📍 {{ z.coordinates.lat.toFixed(2) }}, {{ z.coordinates.lng.toFixed(2) }}</span>
                  </div>
                </div>

                <footer class="zc-foot">
                  <span class="zc-activity">🕐 {{ z.lastActivity }}</span>
                  <span class="zc-open">Open zone →</span>
                </footer>
              </article>
            }
          </div>
        </div>
      }

      @else if (active() === 'officers') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Officers Command</h3>
              <p>{{ officers.length }} officers · {{ onlineOfficers().length }} online</p>
            </div>
          </header>

          <div class="officer-grid">
            @for (o of officers; track o.id) {
              <article class="officer-card" [class.offline]="!o.online" (click)="toast.info(o.rank + ' ' + o.name, o.role)" (contextmenu)="onOfficerContext($event, o)">
                <header class="oc-head">
                  <div class="oc-avatar">
                    {{ initials(o.name) }}
                    <span class="oc-dot" [class.online]="o.online"></span>
                  </div>
                  <div class="oc-info">
                    <b>{{ o.rank }} {{ o.name }}</b>
                    <p class="oc-ar" dir="rtl">{{ o.rankAr }} {{ o.nameAr }}</p>
                    <small>{{ o.role }}</small>
                  </div>
                </header>
                <div class="oc-body">
                  <div class="oc-row">
                    <span>📍 Sector</span>
                    <b>{{ sectorName(o.sectorId) }}</b>
                  </div>
                  <div class="oc-row">
                    <span>📞 Phone</span>
                    <b class="mono">{{ o.phone }}</b>
                  </div>
                  <div class="oc-row">
                    <span>📧 Email</span>
                    <b class="mono small">{{ o.email }}</b>
                  </div>
                  <div class="oc-row">
                    <span>🎖 Service</span>
                    <b>{{ o.yearsOfService }} years</b>
                  </div>
                </div>
                <div class="oc-workload">
                  <div class="wl-head">
                    <span>Workload</span>
                    <b class="mono">{{ o.workload }}%</b>
                  </div>
                  <div class="wl-bar-lg">
                    <div class="wl-fill" [style.width.%]="o.workload" [style.background]="workloadColor(o.workload)"></div>
                  </div>
                  <div class="wl-foot">
                    <span class="mono small">{{ o.todayActions }} actions today</span>
                    <span class="mono small">{{ assignedReminders(o.id).length }} assigned</span>
                  </div>
                </div>
              </article>
            }
          </div>
        </div>
      }

      @else if (active() === 'soldiers') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Field Personnel</h3>
              <p>{{ filteredSoldiers().length }} of {{ soldiers.length }} soldiers tracked</p>
            </div>
            <button class="pill" (click)="toast.info('Exporting personnel data…')">📥 Export</button>
          </header>

          <div class="sf-chip-row">
            @for (s of soldierStatusFilters; track s.id) {
              <button class="sf-chip" [class.active]="soldierStatusFilter() === s.id" (click)="soldierStatusFilter.set(s.id)">
                <span>{{ s.icon }}</span>
                <span>{{ s.label }}</span>
                <span class="sf-count">{{ countSoldiersBy(s.id) }}</span>
              </button>
            }
          </div>

          <div class="soldier-grid">
            @for (s of filteredSoldiers(); track s.id) {
              <article class="soldier-card" [class.missing]="s.status === 'Missing'" (click)="openSoldier(s.id)" (contextmenu)="onSoldierContext($event, s)">
                <header class="sl-head">
                  <span class="sl-avatar" [style.background]="sectorColor(s.sectorId) + '22'" [style.color]="sectorColor(s.sectorId)">
                    {{ initials(s.name) }}
                  </span>
                  <div class="sl-info">
                    <b>{{ s.name }}</b>
                    <p class="sl-ar" dir="rtl">{{ s.nameAr }}</p>
                    <span class="mono sl-id">{{ s.id }}</span>
                  </div>
                  <span class="st" [attr.data-s]="s.status">{{ s.status }}</span>
                </header>

                <div class="sl-body">
                  <div class="sl-row"><span>🎖 Rank</span><b>{{ s.rank }}</b></div>
                  <div class="sl-row"><span>🏢 Squad</span><b>{{ s.squad }}</b></div>
                  <div class="sl-row"><span>📍 Zone</span><b>{{ zoneName(s.zoneId) }}</b></div>
                  <div class="sl-row"><span>🎯 Mission</span><b>{{ s.currentMission }}</b></div>
                </div>

                <footer class="sl-foot">
                  <span class="sl-stat">🕐 {{ s.lastKnownAt }}</span>
                  <span class="sl-stat" [class.warn]="s.status === 'Missing'">↩ {{ s.expectedReturn }}</span>
                </footer>
              </article>
            } @empty {
              <div class="empty-mini full">No soldiers match this filter</div>
            }
          </div>
        </div>
      }

      @else if (active() === 'history') {
        <div class="view">
          <header class="view-head">
            <div>
              <h3>Timeline & History</h3>
              <p>Complete activity log · {{ reminders().length }} events</p>
            </div>
            <button class="pill primary" (click)="generateReport()">📄 Generate Report</button>
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

          <section class="timeline-section">
            <h4>Recent activity timeline</h4>
            <div class="timeline">
              @for (r of sortedByTime().slice(0, 15); track r.id) {
                <div class="timeline-item" [attr.data-p]="r.priority">
                  <span class="tl-time mono">{{ timeAgo(r.createdAt) }}</span>
                  <span class="tl-dot" [style.background]="typeColor(r.type)"></span>
                  <div class="tl-body" (click)="openReminder(r.id)">
                    <div class="tl-row">
                      <b>{{ typeIcon(r.type) }} {{ r.title }}</b>
                      <span class="st small" [attr.data-s]="r.status">{{ r.status }}</span>
                    </div>
                    <small>{{ r.description }}</small>
                    <div class="tl-meta">
                      <span>{{ soldierName(r.soldierId) }}</span>
                      <span>·</span>
                      <span>{{ r.location }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>

          <div class="grid-2">
            <section class="info-card">
              <header><h4>Status distribution</h4></header>
              @for (s of statusBreakdown(); track s.label) {
                <div class="breakdown-row">
                  <span class="bd-icon" [style.color]="s.color">{{ s.icon }}</span>
                  <span class="bd-label">{{ s.label }}</span>
                  <div class="bd-bar"><div class="bd-fill" [style.width.%]="s.pct" [style.background]="s.color"></div></div>
                  <span class="bd-val mono">{{ s.count }} ({{ s.pct }}%)</span>
                </div>
              }
            </section>

            <section class="info-card">
              <header><h4>By type</h4></header>
              @for (t of typeBreakdown(); track t.label) {
                <div class="breakdown-row">
                  <span class="bd-icon" [style.color]="t.color">{{ t.icon }}</span>
                  <span class="bd-label">{{ t.label }}</span>
                  <div class="bd-bar"><div class="bd-fill" [style.width.%]="t.pct" [style.background]="t.color"></div></div>
                  <span class="bd-val mono">{{ t.count }}</span>
                </div>
              }
            </section>
          </div>

          <section class="info-card">
            <header><h4>Top officers by activity</h4></header>
            @for (o of topOfficers(); track o.officer.id; let i = $index) {
              <div class="top-row">
                <span class="top-rank">{{ i + 1 }}</span>
                <span class="avatar-m">{{ initials(o.officer.name) }}</span>
                <div>
                  <b>{{ o.officer.rank }} {{ o.officer.name }}</b>
                  <small>{{ sectorName(o.officer.sectorId) }} · {{ o.officer.role }}</small>
                </div>
                <span class="top-count mono">{{ o.count }} handled</span>
              </div>
            }
          </section>
        </div>
      }

      @if (selectedReminder(); as r) {
        <div class="modal-backdrop" (click)="selectedReminder.set(null)">
          <div class="modal reminder-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon" [style.background]="typeColor(r.type) + '22'" [style.color]="typeColor(r.type)">
                {{ typeIcon(r.type) }}
              </span>
              <div>
                <h3>{{ r.title }}</h3>
                <p>{{ soldierName(r.soldierId) }} · {{ r.location }}</p>
              </div>
              <span class="modal-badge" [attr.data-s]="r.status">{{ r.status }}</span>
              <button class="modal-close" (click)="selectedReminder.set(null)">✕</button>
            </header>

            <div class="modal-body">
              <div class="om-priority-bar" [attr.data-p]="r.priority">
                <span class="opb-icon">{{ r.priority === 'critical' ? '🚨' : r.priority === 'high' ? '⚠️' : 'ℹ️' }}</span>
                <b>{{ r.priority.toUpperCase() }} PRIORITY</b>
                <span class="opb-time">Due: {{ timeAgo(r.dueAt) }}</span>
              </div>

              <div class="om-grid">
                <div class="om-section">
                  <span class="om-label">Soldier</span>
                  <b>{{ soldierName(r.soldierId) }}</b>
                  <small class="mono">{{ r.soldierId }}</small>
                </div>
                <div class="om-section">
                  <span class="om-label">Officer</span>
                  <b>{{ officerName(r.officerId) }}</b>
                  <small class="mono">{{ r.officerId }}</small>
                </div>
                <div class="om-section">
                  <span class="om-label">Sector</span>
                  <b>{{ sectorName(r.sectorId) }}</b>
                  <small class="mono">{{ sectorCode(r.sectorId) }}</small>
                </div>
                <div class="om-section">
                  <span class="om-label">Zone</span>
                  <b>{{ zoneName(r.zoneId) }}</b>
                  <small class="mono">{{ zoneCode(r.zoneId) }}</small>
                </div>
                <div class="om-section">
                  <span class="om-label">Type</span>
                  <b>{{ typeLabel(r.type) }}</b>
                </div>
                <div class="om-section">
                  <span class="om-label">Created</span>
                  <b class="mono">{{ formatDate(r.createdAt) }}</b>
                </div>
                <div class="om-section">
                  <span class="om-label">Coordinates</span>
                  <b class="mono">{{ r.coordinates.lat.toFixed(3) }}, {{ r.coordinates.lng.toFixed(3) }}</b>
                </div>
                @if (r.confirmedAt) {
                  <div class="om-section">
                    <span class="om-label">Confirmed at</span>
                    <b class="mono">{{ formatDate(r.confirmedAt) }}</b>
                  </div>
                }
                @if (r.escalatedAt) {
                  <div class="om-section">
                    <span class="om-label">Escalated at</span>
                    <b class="mono">{{ formatDate(r.escalatedAt) }}</b>
                  </div>
                }
              </div>

              <div class="om-reason">
                <span class="om-label">Description</span>
                <p>{{ r.description }}</p>
              </div>

              <div class="om-timeline">
                <span class="om-label">Timeline</span>
                <div class="tl-item done">
                  <span class="tl-dot"></span>
                  <div>
                    <b>Reminder created</b>
                    <small class="mono">{{ formatDate(r.createdAt) }} · {{ officerName(r.officerId) }}</small>
                  </div>
                </div>
                @if (r.escalatedAt) {
                  <div class="tl-item done warn">
                    <span class="tl-dot"></span>
                    <div>
                      <b>Escalated</b>
                      <small class="mono">{{ formatDate(r.escalatedAt) }}</small>
                    </div>
                  </div>
                }
                @if (r.confirmedAt) {
                  <div class="tl-item done ok">
                    <span class="tl-dot"></span>
                    <div>
                      <b>Confirmed</b>
                      <small class="mono">{{ formatDate(r.confirmedAt) }}</small>
                    </div>
                  </div>
                }
                @if (!r.confirmedAt && r.status !== 'escalated') {
                  <div class="tl-item">
                    <span class="tl-dot"></span>
                    <div>
                      <b>Awaiting confirmation</b>
                      <small class="mono">Due {{ formatDate(r.dueAt) }}</small>
                    </div>
                  </div>
                }
              </div>

              @if (r.notes.length) {
                <div class="om-notes">
                  <span class="om-label">Notes ({{ r.notes.length }})</span>
                  @for (n of r.notes; track $index) {
                    <div class="note-row">
                      <div class="note-head">
                        <b>{{ n.author }}</b>
                        <small class="mono">{{ formatDate(n.at) }}</small>
                      </div>
                      <p>{{ n.text }}</p>
                    </div>
                  }
                </div>
              }

              <div class="om-actions-grid">
                <button class="om-action-btn" (click)="callSoldier(r)">
                  <span class="oab-icon">📞</span>
                  <b>Call Soldier</b>
                  <small>{{ soldierPhone(r.soldierId) }}</small>
                </button>
                <button class="om-action-btn" (click)="sendSms(r)">
                  <span class="oab-icon">💬</span>
                  <b>Send SMS</b>
                  <small>Quick message</small>
                </button>
                <button class="om-action-btn" (click)="viewOnMap(r)">
                  <span class="oab-icon">🗺</span>
                  <b>View on Map</b>
                  <small>Latest coordinates</small>
                </button>
                <button class="om-action-btn" (click)="addNote(r)">
                  <span class="oab-icon">✎</span>
                  <b>Add Note</b>
                  <small>Log activity</small>
                </button>
              </div>
            </div>

            <footer class="modal-foot">
              <button class="mf-btn" (click)="dismiss(r.id)">🚫 Dismiss</button>
              @if (r.status === 'pending' || r.status === 'overdue') {
                <button class="mf-btn warn" (click)="escalate(r.id); selectedReminder.set(null)">🚨 Escalate</button>
                <button class="mf-btn ok" (click)="confirm(r.id); selectedReminder.set(null)">✓ Confirm</button>
              } @else if (r.status === 'escalated') {
                <button class="mf-btn ok" (click)="confirm(r.id); selectedReminder.set(null)">✓ Resolve</button>
              } @else {
                <span class="mf-done">{{ r.status === 'confirmed' ? '✓ Confirmed' : 'Dismissed' }}</span>
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
              <span class="st" [attr.data-s]="s.status">{{ s.status }}</span>
              <button class="modal-close" (click)="selectedSoldier.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="sm-grid">
                <div class="sm-section"><span class="om-label">ID</span><b class="mono">{{ s.id }}</b></div>
                <div class="sm-section"><span class="om-label">Rank</span><b>{{ s.rank }}</b></div>
                <div class="sm-section"><span class="om-label">Squad</span><b>{{ s.squad }}</b></div>
                <div class="sm-section"><span class="om-label">Sector</span><b>{{ sectorName(s.sectorId) }}</b></div>
                <div class="sm-section"><span class="om-label">Zone</span><b>{{ zoneName(s.zoneId) }}</b></div>
                <div class="sm-section"><span class="om-label">Unit</span><b>{{ s.unit }}</b></div>
                <div class="sm-section"><span class="om-label">Phone</span><b class="mono">{{ s.phone }}</b></div>
                <div class="sm-section"><span class="om-label">Blood type</span><b>{{ s.bloodType }}</b></div>
                <div class="sm-section"><span class="om-label">Current mission</span><b>{{ s.currentMission }}</b></div>
                <div class="sm-section"><span class="om-label">Last known</span><b>{{ s.lastKnownAt }}</b></div>
                <div class="sm-section"><span class="om-label">Expected return</span><b>{{ s.expectedReturn }}</b></div>
              </div>

              <div class="sm-stats">
                <div class="sm-stat"><span>📋</span><b>{{ soldierReminders(s.id).length }}</b><small>Reminders</small></div>
                <div class="sm-stat"><span>✅</span><b>{{ soldierConfirmed(s.id) }}</b><small>Confirmed</small></div>
                <div class="sm-stat"><span>⏳</span><b>{{ soldierPending(s.id) }}</b><small>Pending</small></div>
              </div>

              @if (soldierReminders(s.id).length) {
                <div class="sm-orders">
                  <span class="om-label">Recent reminders</span>
                  @for (r of soldierReminders(s.id).slice(0, 5); track r.id) {
                    <div class="sm-order-row" (click)="openReminder(r.id)">
                      <span class="mono">{{ r.id }}</span>
                      <span class="type-mini">{{ typeIcon(r.type) }} {{ typeLabel(r.type) }}</span>
                      <span class="st small" [attr.data-s]="r.status">{{ r.status }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      @if (selectedZone(); as z) {
        <div class="modal-backdrop" (click)="selectedZone.set(null)">
          <div class="modal zone-modal" (click)="$event.stopPropagation()">
            <header class="modal-head" [style.borderBottomColor]="z.color">
              <span class="modal-icon" [style.background]="z.color + '22'" [style.color]="z.color">
                {{ z.icon }}
              </span>
              <div>
                <h3>{{ z.name }}</h3>
                <p>{{ z.nameAr }} · {{ z.code }}</p>
              </div>
              <span class="zc-risk" [attr.data-r]="z.riskLevel">{{ z.riskLevel }}</span>
              <button class="modal-close" (click)="selectedZone.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="sec-stats">
                <div class="sec-stat"><b>{{ z.activeSoldiers }}</b><small>Soldiers</small></div>
                <div class="sec-stat"><b>{{ remindersInZone(z.id).length }}</b><small>Reminders</small></div>
                <div class="sec-stat"><b>{{ criticalInZone(z.id) }}</b><small>Critical</small></div>
                <div class="sec-stat"><b>{{ zoneTypeLabel(z.type) }}</b><small>Type</small></div>
              </div>

              <div class="sec-info">
                <div class="si-row"><span>Sector</span><b>{{ sectorName(z.sectorId) }}</b></div>
                <div class="si-row"><span>Population</span><b>{{ z.population.toLocaleString() }}</b></div>
                <div class="si-row"><span>Coordinates</span><b class="mono">{{ z.coordinates.lat.toFixed(3) }}, {{ z.coordinates.lng.toFixed(3) }}</b></div>
                <div class="si-row"><span>Last activity</span><b>{{ z.lastActivity }}</b></div>
              </div>

              <div class="sec-soldiers">
                <span class="om-label">Soldiers in this zone ({{ soldiersInZone(z.id).length }})</span>
                @for (s of soldiersInZone(z.id); track s.id) {
                  <div class="sm-order-row" (click)="openSoldier(s.id)">
                    <span class="avatar-s">{{ initials(s.name) }}</span>
                    <span class="mono small">{{ s.id }}</span>
                    <span>{{ s.name }}</span>
                    <span class="st small" [attr.data-s]="s.status">{{ s.status }}</span>
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

    .live-banner {
      display: flex; align-items: center; gap: 14px; padding: 16px 20px;
      background: rgba(52, 199, 89, 0.08);
      border: 1px solid rgba(52, 199, 89, 0.2);
      border-radius: var(--r-md);
    }
    .live-banner.alert {
      background: rgba(255, 59, 48, 0.08);
      border-color: rgba(255, 59, 48, 0.25);
      animation: pulse-banner 2s infinite;
    }
    @keyframes pulse-banner {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.3); }
      50% { box-shadow: 0 0 0 8px rgba(255, 59, 48, 0); }
    }
    .lb-icon { font-size: 24px; }
    .lb-content { flex: 1; }
    .lb-content b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .lb-content small { font-size: var(--fs-2xs); color: var(--label-2); }
    .lb-action {
      padding: 8px 16px; background: #ff3b30; color: #fff;
      border: 0; border-radius: var(--r-pill);
      font-size: var(--fs-xs); font-weight: 700; cursor: pointer;
    }
    .lb-action:hover { background: #d70015; }

    .chart-card { padding: 24px; background: var(--bg-surface-solid);
                  border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .chart-card > header { display: flex; justify-content: space-between; align-items: baseline;
                           margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .chart-card h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .chart-card header .muted { font-size: var(--fs-2xs); display: block; margin-top: 3px; }
    .legend { display: flex; gap: 16px; font-size: var(--fs-2xs); color: var(--label-2); }
    .legend span { display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .chart-bars { display: flex; align-items: flex-end; gap: 8px; height: 200px; }
    .bar-group { flex: 1; height: 100%; display: flex; flex-direction: column-reverse;
                 gap: 2px; position: relative; cursor: pointer; align-items: stretch; }
    .bar-seg { width: 100%; border-radius: 2px; transition: opacity var(--t-fast); }
    .bar-group:hover .bar-seg { opacity: 0.75; }
    .bar-label { position: absolute; bottom: -22px; left: 0; right: 0;
                 text-align: center; font-size: 10px; color: var(--label-2); font-weight: 600; }
    .bar-tip {
      position: absolute; top: -28px; left: 50%; transform: translateX(-50%);
      background: var(--accent); color: var(--accent-contrast);
      padding: 3px 10px; border-radius: var(--r-xs);
      font-size: 10px; font-weight: 700; white-space: nowrap;
    }

    .live-feed { padding: 24px; background: var(--bg-surface-solid);
                 border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .lf-head { display: flex; justify-content: space-between; align-items: flex-end;
               margin-bottom: 14px; flex-wrap: wrap; gap: 12px; }
    .lf-head h4 { font-size: var(--fs-base); font-weight: 700; }
    .lf-head .muted { font-size: var(--fs-2xs); display: block; margin-top: 3px; }
    .lf-list { display: flex; flex-direction: column; gap: 8px; }
    .lf-item {
      display: grid; grid-template-columns: 4px 40px 1fr auto;
      gap: 12px; align-items: center;
      padding: 12px; background: var(--bg-fill-2);
      border-radius: var(--r-sm); cursor: pointer;
      transition: all var(--t-base);
    }
    .lf-item:hover { background: var(--bg-fill-3); transform: translateX(3px); }
    .lf-item[data-p='critical'] { border-left: 2px solid #ff3b30; }
    .lf-item[data-p='high'] { border-left: 2px solid #ff9500; }
    .lf-item[data-p='normal'] { border-left: 2px solid #007aff; }
    .lf-item[data-p='low'] { border-left: 2px solid #8e8e93; }
    .lf-pulse {
      width: 8px; height: 8px; border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .lf-pulse[data-p='critical'] { background: #ff3b30; }
    .lf-pulse[data-p='high'] { background: #ff9500; }
    .lf-pulse[data-p='normal'] { background: #007aff; }
    .lf-pulse[data-p='low'] { background: #8e8e93; }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
      50% { box-shadow: 0 0 0 6px rgba(0,0,0,0); opacity: 0.7; }
    }
    .lf-icon {
      width: 40px; height: 40px; display: grid; place-items: center;
      border-radius: var(--r-sm); font-size: 18px;
    }
    .lf-body { min-width: 0; }
    .lf-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .lf-title-row b { font-size: var(--fs-xs); font-weight: 700;
                      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .lf-pri {
      font-size: 9px; font-weight: 800;
      padding: 2px 7px; border-radius: var(--r-pill);
      text-transform: uppercase; letter-spacing: 0.04em;
      flex-shrink: 0;
    }
    .lf-pri[data-p='critical'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .lf-pri[data-p='high']     { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .lf-pri[data-p='normal']   { background: var(--accent-soft); color: var(--accent); }
    .lf-pri[data-p='low']      { background: var(--bg-fill-3); color: var(--label-2); }
    .lf-body p { font-size: 10px; color: var(--label-2); margin-bottom: 4px;
                 overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .lf-meta { display: flex; gap: 12px; font-size: 10px; color: var(--label-3); flex-wrap: wrap; }
    .lf-confirm {
      padding: 7px 14px; background: #34c759; color: #fff;
      border: 0; border-radius: var(--r-pill);
      font-size: var(--fs-2xs); font-weight: 700; cursor: pointer;
      white-space: nowrap;
    }
    .lf-confirm:hover { background: #2eb14e; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 820px) { .grid-2 { grid-template-columns: 1fr; } }

    .info-card { padding: 20px; background: var(--bg-surface-solid);
                 border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .info-card > header { margin-bottom: 14px; }
    .info-card h4 { font-size: var(--fs-sm); font-weight: 700; }

    .zone-row {
      display: grid; grid-template-columns: 40px 1fr auto;
      gap: 12px; align-items: center; padding: 10px 0;
      border-bottom: 0.5px solid var(--separator);
      cursor: pointer; transition: background var(--t-fast);
    }
    .zone-row:last-child { border-bottom: 0; }
    .zone-row:hover { background: var(--bg-hover); margin: 0 -10px; padding: 10px; border-radius: var(--r-xs); }
    .zr-icon { width: 40px; height: 40px; display: grid; place-items: center;
               border-radius: var(--r-sm); font-size: 18px; }
    .zr-info { min-width: 0; }
    .zr-info b { font-size: var(--fs-xs); font-weight: 700; display: block;
                 overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .zr-info small { font-size: 10px; color: var(--label-2); }
    .zr-risk {
      font-size: 9px; font-weight: 800;
      padding: 3px 10px; border-radius: var(--r-pill);
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .zr-risk[data-r='low']      { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .zr-risk[data-r='medium']   { background: rgba(255, 204, 0, 0.15); color: #b58900; }
    .zr-risk[data-r='high']     { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .zr-risk[data-r='critical'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .workload-mini { display: flex; align-items: center; gap: 8px; min-width: 90px; }
    .wl-bar { width: 60px; height: 4px; background: var(--bg-fill-2);
              border-radius: var(--r-pill); overflow: hidden; display: block; }
    .wl-fill { height: 100%; border-radius: var(--r-pill); }
    .workload-mini small { font-size: 10px; color: var(--label-3); }

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
      text-transform: capitalize; transition: all var(--t-fast);
    }
    .pf-chip:hover { background: var(--bg-fill-3); color: var(--label); }
    .pf-chip.active { background: var(--accent); color: var(--accent-contrast); }

    .type-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .tc { padding: 6px 12px; background: var(--bg-fill-2); color: var(--label-2);
          border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 600;
          border: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
          transition: all var(--t-fast); }
    .tc:hover { background: var(--bg-fill-3); color: var(--label); }
    .tc.active { background: var(--accent); color: var(--accent-contrast); }

    .feed-list { display: flex; flex-direction: column; gap: 10px; }
    .feed-card {
      display: grid; grid-template-columns: 60px 1fr auto;
      gap: 14px; align-items: stretch;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden; cursor: pointer;
      transition: all var(--t-base);
    }
    .feed-card:hover { transform: translateX(3px); box-shadow: var(--shadow-md); }
    .feed-card[data-p='critical'] { border-left: 3px solid #ff3b30; }
    .feed-card[data-p='high'] { border-left: 3px solid #ff9500; }
    .feed-card[data-p='normal'] { border-left: 3px solid #007aff; }
    .feed-card[data-p='low'] { border-left: 3px solid #8e8e93; }
    .fc-left {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 8px; padding: 14px;
    }
    .fc-icon { font-size: 22px; }
    .fc-pulse {
      width: 8px; height: 8px; border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .fc-pulse[data-p='critical'] { background: #ff3b30; }
    .fc-pulse[data-p='high'] { background: #ff9500; }
    .fc-pulse[data-p='normal'] { background: #007aff; }
    .fc-pulse[data-p='low'] { background: #8e8e93; }
    .fc-body { padding: 14px 14px 14px 0; min-width: 0; }
    .fc-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
    .fc-head b { font-size: var(--fs-sm); font-weight: 700; }
    .fc-tags { display: flex; gap: 6px; flex-shrink: 0; }
    .pri-badge { font-size: 9px; font-weight: 800; padding: 3px 9px;
                 border-radius: var(--r-pill); text-transform: uppercase; letter-spacing: 0.04em; }
    .pri-badge[data-p='critical'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .pri-badge[data-p='high']     { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .pri-badge[data-p='normal']   { background: var(--accent-soft); color: var(--accent); }
    .pri-badge[data-p='low']      { background: var(--bg-fill-3); color: var(--label-2); }
    .st { padding: 3px 10px; border-radius: var(--r-pill);
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.04em; text-align: center; display: inline-block; }
    .st.small { font-size: 9px; padding: 2px 8px; }
    .st[data-s='pending']   { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='confirmed'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='overdue']   { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .st[data-s='escalated'] { background: rgba(175, 82, 222, 0.15); color: #af52de; }
    .st[data-s='dismissed'] { background: var(--bg-fill-3); color: var(--label-2); }
    .st[data-s='Active']    { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='On Mission']{ background: var(--accent-soft); color: var(--accent); }
    .st[data-s='Returning'] { background: rgba(0, 199, 190, 0.15); color: #00c7be; }
    .st[data-s='Missing']   { background: rgba(255, 59, 48, 0.15); color: #ff3b30;
                              animation: pulse-badge 1.6s infinite; }
    @keyframes pulse-badge { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    .st[data-s='Medical']   { background: rgba(175, 82, 222, 0.15); color: #af52de; }
    .st[data-s='Rest']      { background: var(--bg-fill-3); color: var(--label-2); }

    .fc-body p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5;
                 margin-bottom: 8px; }
    .fc-meta { display: flex; gap: 12px; font-size: 10px; color: var(--label-3);
               flex-wrap: wrap; align-items: center; }
    .fc-meta-item { display: inline-flex; align-items: center; gap: 4px; }
    .fc-notes { margin-top: 8px; padding-top: 8px; border-top: 0.5px solid var(--separator); }
    .notes-count { font-size: 10px; color: var(--accent); font-weight: 600; }
    .fc-actions { display: flex; flex-direction: column; gap: 4px;
                  padding: 14px 14px; justify-content: center; }
    .fc-btn { width: 32px; height: 32px; display: grid; place-items: center;
              background: var(--bg-fill-2); border: 0; border-radius: var(--r-sm);
              color: var(--label-2); font-size: 14px; cursor: pointer;
              transition: all var(--t-fast); }
    .fc-btn:hover { background: var(--bg-fill-3); color: var(--label); }
    .fc-btn.ok:hover { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .fc-btn.warn:hover { background: rgba(255, 149, 0, 0.15); color: #ff9500; }

    .avatar-m {
      width: 22px; height: 22px; display: grid; place-items: center;
      background: var(--accent-soft); color: var(--accent);
      border-radius: 50%; font-size: 8px; font-weight: 800; flex-shrink: 0;
    }
    .avatar-s {
      width: 22px; height: 22px; display: grid; place-items: center;
      background: var(--accent-soft); color: var(--accent);
      border-radius: 50%; font-size: 9px; font-weight: 800;
    }

    .zone-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .zone-stats-row { grid-template-columns: repeat(2, 1fr); } }
    .zs-card {
      display: flex; align-items: center; gap: 12px;
      padding: 16px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md);
    }
    .zs-card.critical { border-left: 3px solid #ff3b30; }
    .zs-icon { font-size: 22px; }
    .zs-card b { font-size: var(--fs-2xl); font-weight: 800;
                 font-variant-numeric: tabular-nums; display: block; line-height: 1; }
    .zs-card small { font-size: var(--fs-2xs); color: var(--label-2);
                     text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    .zone-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }
    .zone-card {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden; cursor: pointer;
      transition: all var(--t-base);
      border-top: 3px solid var(--c);
    }
    .zone-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .zc-head { display: flex; align-items: center; gap: 12px; padding: 16px; }
    .zc-icon { width: 44px; height: 44px; display: grid; place-items: center;
               border-radius: var(--r-sm); font-size: 22px; flex-shrink: 0; }
    .zc-title { flex: 1; min-width: 0; }
    .zc-row { display: flex; align-items: center; gap: 8px; }
    .zc-row b { font-size: var(--fs-sm); font-weight: 700; }
    .zc-code { font-size: 10px; padding: 2px 8px; background: var(--bg-fill-2);
               color: var(--label-2); border-radius: var(--r-pill); font-weight: 700; }
    .zc-ar { font-size: 10px; color: var(--label-2); margin-top: 3px; }
    .zc-risk {
      font-size: 9px; font-weight: 800;
      padding: 3px 10px; border-radius: var(--r-pill);
      text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0;
    }
    .zc-body { padding: 0 16px 12px; display: flex; flex-direction: column; gap: 12px; }
    .zc-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .zc-stat {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 8px 6px; background: var(--bg-fill-2); border-radius: var(--r-sm);
    }
    .zs-i { font-size: 14px; }
    .zc-stat b { font-size: var(--fs-sm); font-weight: 800;
                 font-variant-numeric: tabular-nums; line-height: 1; }
    .zc-stat small { font-size: 9px; color: var(--label-3);
                     text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; }
    .zc-type { display: flex; gap: 6px; flex-wrap: wrap; }
    .type-chip {
      font-size: 10px; padding: 3px 9px; background: var(--bg-fill-2);
      color: var(--label-2); border-radius: var(--r-pill);
      text-transform: capitalize; font-weight: 600;
    }
    .zc-foot {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; border-top: 0.5px solid var(--separator);
      font-size: 10px; color: var(--label-3);
    }
    .zc-open { color: var(--c); font-weight: 700; }

    .officer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
    .officer-card {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      padding: 16px;
      cursor: pointer;
      transition: all var(--t-base);
      display: flex; flex-direction: column; gap: 14px;
    }
    .officer-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .officer-card.offline { opacity: 0.6; }
    .oc-head { display: flex; align-items: center; gap: 12px; }
    .oc-avatar {
      width: 48px; height: 48px; position: relative;
      display: grid; place-items: center;
      background: var(--accent-soft); color: var(--accent);
      border-radius: 50%; font-size: 16px; font-weight: 800; flex-shrink: 0;
    }
    .oc-dot {
      position: absolute; bottom: 2px; right: 2px;
      width: 12px; height: 12px; border-radius: 50%;
      background: #8e8e93; border: 2px solid var(--bg-surface-solid);
    }
    .oc-dot.online { background: #34c759; }
    .oc-info { min-width: 0; }
    .oc-info b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .oc-ar { font-size: 10px; color: var(--label-2); margin: 2px 0; }
    .oc-info small { font-size: 10px; color: var(--label-3); }
    .oc-body { display: flex; flex-direction: column; gap: 0; }
    .oc-row { display: flex; justify-content: space-between; align-items: center;
              padding: 6px 0; border-bottom: 0.5px solid var(--separator);
              font-size: 10px; gap: 8px; }
    .oc-row:last-child { border-bottom: 0; }
    .oc-row span { color: var(--label-3); }
    .oc-row b { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .oc-workload { display: flex; flex-direction: column; gap: 6px;
                   padding-top: 10px; border-top: 0.5px solid var(--separator); }
    .wl-head { display: flex; justify-content: space-between; font-size: 10px;
               color: var(--label-2); }
    .wl-head b { color: var(--label); font-weight: 700; }
    .wl-bar-lg { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill);
                 overflow: hidden; }
    .wl-foot { display: flex; justify-content: space-between; font-size: 9px; color: var(--label-3); }

    .sf-chip-row { display: flex; gap: 4px; flex-wrap: wrap; }
    .sf-chip {
      padding: 5px 12px; border-radius: var(--r-pill);
      background: var(--bg-fill-2); color: var(--label-2);
      font-size: var(--fs-2xs); font-weight: 600; border: 0; cursor: pointer;
      display: inline-flex; align-items: center; gap: 6px;
      transition: all var(--t-fast);
    }
    .sf-chip:hover { background: var(--bg-fill-3); color: var(--label); }
    .sf-chip.active { background: var(--accent); color: var(--accent-contrast); }
    .sf-count { background: rgba(255, 255, 255, 0.18);
                padding: 0 5px; border-radius: var(--r-pill);
                font-size: 9px; font-variant-numeric: tabular-nums; }

    .soldier-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .soldier-card {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      padding: 14px;
      cursor: pointer;
      transition: all var(--t-base);
      display: flex; flex-direction: column; gap: 12px;
    }
    .soldier-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md);
                          border-color: var(--accent); }
    .soldier-card.missing { border-left: 3px solid #ff3b30; }
    .sl-head { display: flex; align-items: center; gap: 10px; }
    .sl-avatar { width: 44px; height: 44px; display: grid; place-items: center;
                 border-radius: 50%; font-size: 15px; font-weight: 800; flex-shrink: 0; }
    .sl-info { flex: 1; min-width: 0; }
    .sl-info b { font-size: var(--fs-xs); font-weight: 700; display: block;
                 overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sl-ar { font-size: 10px; color: var(--label-2); margin: 2px 0; }
    .sl-id { font-size: 9px; color: var(--label-3); }
    .sl-body { display: flex; flex-direction: column; gap: 4px; }
    .sl-row { display: flex; justify-content: space-between; align-items: center;
              padding: 5px 0; font-size: 10px;
              border-bottom: 0.5px solid var(--separator); gap: 8px; }
    .sl-row:last-child { border-bottom: 0; }
    .sl-row span { color: var(--label-3); }
    .sl-row b { font-weight: 700; color: var(--label);
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sl-foot { display: flex; justify-content: space-between; padding-top: 8px;
               border-top: 0.5px solid var(--separator); }
    .sl-stat { font-size: 10px; color: var(--label-2); font-weight: 600; }
    .sl-stat.warn { color: #ff9500; }

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
                text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; margin-top: 4px; }

    .timeline-section { padding: 24px; background: var(--bg-surface-solid);
                        border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .timeline-section h4 { font-size: var(--fs-sm); font-weight: 700; margin-bottom: 16px; }
    .timeline { display: flex; flex-direction: column; gap: 4px; position: relative; }
    .timeline-item { display: grid; grid-template-columns: 80px 20px 1fr;
                     gap: 12px; align-items: flex-start; padding: 8px 0;
                     position: relative; }
    .timeline-item::before {
      content: ''; position: absolute;
      left: 90px; top: 22px; bottom: -8px;
      width: 1px; background: var(--separator);
    }
    .timeline-item:last-child::before { display: none; }
    .tl-time { font-size: 10px; color: var(--label-3);
               font-family: var(--sf-mono); text-align: right; padding-top: 4px; }
    .tl-dot { width: 14px; height: 14px; border-radius: 50%;
              background: var(--bg-fill-3); margin-top: 3px;
              border: 3px solid var(--bg-surface-solid);
              box-shadow: 0 0 0 1px var(--separator);
              position: relative; z-index: 1; }
    .tl-body { padding: 4px 10px; border-radius: var(--r-xs); cursor: pointer;
               transition: background var(--t-fast); min-width: 0; }
    .tl-body:hover { background: var(--bg-hover); }
    .tl-row { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; flex-wrap: wrap; }
    .tl-row b { font-size: var(--fs-xs); font-weight: 700; }
    .tl-body > small { font-size: 10px; color: var(--label-2); display: block;
                       overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tl-meta { display: flex; gap: 6px; font-size: 10px; color: var(--label-3); margin-top: 3px; }

    .breakdown-row { display: grid; grid-template-columns: 24px 100px 1fr 100px;
                     gap: 12px; align-items: center; padding: 10px 0;
                     border-bottom: 0.5px solid var(--separator); font-size: var(--fs-xs); }
    .breakdown-row:last-child { border-bottom: 0; }
    .bd-icon { font-size: 16px; text-align: center; }
    .bd-label { color: var(--label-2); }
    .bd-bar { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill);
              overflow: hidden; }
    .bd-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms var(--ease-out); }
    .bd-val { text-align: right; font-weight: 700; font-size: 10px; }

    .top-row { display: grid; grid-template-columns: 32px 32px 1fr auto;
               gap: 12px; align-items: center; padding: 10px 0;
               border-bottom: 0.5px solid var(--separator); font-size: var(--fs-xs); }
    .top-row:last-child { border-bottom: 0; }
    .top-rank { width: 24px; height: 24px; display: grid; place-items: center;
                background: var(--accent-soft); color: var(--accent);
                border-radius: 50%; font-size: 11px; font-weight: 800; }
    .top-row b { font-weight: 600; display: block; }
    .top-row small { font-size: 10px; color: var(--label-2); }
    .top-count { color: var(--accent); font-weight: 700; }

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
    .modal.reminder-modal { max-width: 780px; }
    .modal.soldier-modal { max-width: 640px; }
    .modal.zone-modal { max-width: 760px; }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-head { display: flex; align-items: center; gap: 14px;
                  padding: 20px 24px; border-bottom: 0.5px solid var(--separator); }
    .modal-icon { width: 48px; height: 48px; display: grid; place-items: center;
                  border-radius: var(--r-md); font-size: 20px; flex-shrink: 0; font-weight: 800; }
    .modal-head > div { flex: 1; }
    .modal-head h3 { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.015em; }
    .modal-head p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 2px; }
    .modal-badge {
      padding: 4px 12px; border-radius: var(--r-pill);
      font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .modal-badge[data-s='pending']   { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .modal-badge[data-s='confirmed'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .modal-badge[data-s='overdue']   { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .modal-badge[data-s='escalated'] { background: rgba(175, 82, 222, 0.15); color: #af52de; }
    .modal-badge[data-s='dismissed'] { background: var(--bg-fill-3); color: var(--label-2); }
    .modal-close {
      width: 32px; height: 32px; display: grid; place-items: center;
      border-radius: var(--r-xs); color: var(--label-3); font-size: 16px;
      background: transparent; border: 0; cursor: pointer; transition: all var(--t-fast);
    }
    .modal-close:hover { background: var(--bg-hover); color: var(--label); }
    .modal-body { flex: 1; overflow-y: auto; padding: 24px;
                  display: flex; flex-direction: column; gap: 20px; }

    .om-priority-bar { display: flex; align-items: center; gap: 10px;
                       padding: 12px 16px; border-radius: var(--r-sm); }
    .om-priority-bar[data-p='critical'] { background: rgba(255, 59, 48, 0.1);
                                          border: 1px solid rgba(255, 59, 48, 0.25); }
    .om-priority-bar[data-p='high']     { background: rgba(255, 149, 0, 0.1);
                                          border: 1px solid rgba(255, 149, 0, 0.25); }
    .om-priority-bar[data-p='normal']   { background: var(--accent-soft);
                                          border: 1px solid var(--accent-soft); }
    .om-priority-bar[data-p='low']      { background: var(--bg-fill-2);
                                          border: 1px solid var(--separator); }
    .opb-icon { font-size: 18px; }
    .om-priority-bar b { font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.04em; flex: 1; }
    .opb-time { font-size: 10px; color: var(--label-2); font-family: var(--sf-mono); }

    .om-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 600px) { .om-grid { grid-template-columns: 1fr; } }
    .om-section { display: flex; flex-direction: column; gap: 3px; }
    .om-label {
      font-size: 9px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--label-3); margin-bottom: 2px;
    }
    .om-section b { font-size: var(--fs-sm); font-weight: 700; }
    .om-section small { font-size: 10px; color: var(--label-2); }

    .om-reason { display: flex; flex-direction: column; gap: 4px; }
    .om-reason p { font-size: var(--fs-sm); line-height: 1.55; color: var(--label); }

    .om-timeline { display: flex; flex-direction: column; gap: 14px;
                   padding: 14px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .tl-item { display: flex; gap: 12px; align-items: flex-start; position: relative; }
    .tl-item::before {
      content: ''; position: absolute;
      left: 6px; top: 20px; bottom: -14px;
      width: 1px; background: var(--separator);
    }
    .tl-item:last-child::before { display: none; }
    .tl-item .tl-dot {
      width: 13px; height: 13px; border-radius: 50%;
      background: var(--bg-fill-3); margin-top: 3px;
      border: 2px solid var(--bg-surface-solid);
      box-shadow: 0 0 0 1px var(--separator); flex-shrink: 0;
      position: static;
    }
    .tl-item.done .tl-dot { background: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .tl-item.done.warn .tl-dot { background: #ff9500; box-shadow: 0 0 0 1px #ff9500; }
    .tl-item.done.ok .tl-dot { background: #34c759; box-shadow: 0 0 0 1px #34c759; }
    .tl-item b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .tl-item small { font-size: 10px; color: var(--label-2); }

    .om-notes { display: flex; flex-direction: column; gap: 10px; }
    .note-row { padding: 10px 12px; background: var(--bg-fill-2);
                border-radius: var(--r-sm); }
    .note-head { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .note-head b { font-size: var(--fs-2xs); font-weight: 700; }
    .note-head small { font-size: 9px; color: var(--label-3); }
    .note-row p { font-size: 11px; line-height: 1.5; color: var(--label); }

    .om-actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    @media (max-width: 600px) { .om-actions-grid { grid-template-columns: repeat(2, 1fr); } }
    .om-action-btn {
      padding: 14px 10px; background: var(--bg-fill-2);
      border-radius: var(--r-sm); display: flex; flex-direction: column;
      align-items: center; gap: 4px; text-align: center;
      border: 0; cursor: pointer; transition: all var(--t-fast);
      color: var(--label);
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
    .mf-btn.ok { background: #34c759; color: #fff; }
    .mf-btn.ok:hover { background: #2eb14e; }
    .mf-btn.warn { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .mf-btn.warn:hover { background: rgba(255, 149, 0, 0.25); }
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
    .sm-stat b { font-size: var(--fs-xl); font-weight: 800; font-variant-numeric: tabular-nums; }
    .sm-stat small { font-size: 10px; color: var(--label-2);
                     text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .sm-orders { display: flex; flex-direction: column; gap: 6px; }
    .sm-order-row {
      display: grid; grid-template-columns: auto auto 1fr auto;
      gap: 10px; align-items: center; padding: 8px 12px;
      background: var(--bg-fill-2); border-radius: var(--r-xs);
      font-size: 10px; cursor: pointer; transition: background var(--t-fast);
    }
    .sm-order-row:hover { background: var(--bg-fill-3); }
    .type-mini { font-size: 10px; color: var(--label-2); }

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
export class ReminderPreviewComponent {
  private menu = inject(ContextMenuService);
  public toast = inject(ToastService);

  readonly zones = REMINDER_ZONES;
  readonly soldiers = REMINDER_SOLDIERS;
  readonly officers = REMINDER_OFFICERS;
  readonly reminders = signal<Reminder[]>([...REMINDERS]);

  readonly active = signal('dashboard');
  readonly statusFilter = signal<string>('all');
  readonly priorityFilter = signal<string>('all');
  readonly typeFilter = signal<string>('all');
  readonly soldierStatusFilter = signal<string>('all');
  readonly searchQuery = signal('');
  readonly hoverBar = signal(-1);
  readonly selectedReminder = signal<Reminder | null>(null);
  readonly selectedSoldier = signal<ReminderSoldier | null>(null);
  readonly selectedZone = signal<Zone | null>(null);

  readonly nav = computed<PreviewNavItem[]>(() => [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', group: 'Command' },
    { id: 'feed', label: 'Live Feed', icon: '🔔', badge: this.activeReminders().length, group: 'Operations' },
    { id: 'zones', label: 'Zones', icon: '🗺', badge: this.zones.length, group: 'Operations' },
    { id: 'soldiers', label: 'Field Personnel', icon: '👥', badge: this.soldiers.length, group: 'Operations' },
    { id: 'officers', label: 'Officers', icon: '🎖', badge: this.officers.length, group: 'Command' },
    { id: 'history', label: 'History', icon: '📜', group: 'Analytics' },
  ]);

  readonly toolbar = computed<ToolbarAction[]>(() => [
    { id: 'refresh', label: 'Refresh', icon: '⟳', action: () => this.toast.success('Data refreshed') },
    { id: 'create', label: 'New Reminder', icon: '＋', primary: true, action: () => this.createReminder() },
  ]);

  readonly notifs = signal<PreviewNotification[]>([
    { id: 1, icon: '🚨', title: '2 critical alerts', body: 'Soldier missing + patrol overdue', time: '2m' },
    { id: 2, icon: '⚠️', title: 'Desert recon overdue', body: 'Essam Zaki · 30 min past due', time: '15m' },
    { id: 3, icon: '✅', title: 'Border check-in confirmed', body: 'Rami Sherif · Border Zone 1', time: '1h' },
    { id: 4, icon: '📊', title: 'Daily report ready', body: 'All zones summary', time: '3h' },
  ]);

  readonly searchPlaceholder = computed(() =>
    this.active() === 'feed' ? 'Search reminders, soldiers, zones…' :
      this.active() === 'soldiers' ? 'Search by name, ID, mission…' : ''
  );

  readonly priorities = [
    { id: 'all', label: 'All' },
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'normal', label: 'Normal' },
    { id: 'low', label: 'Low' },
  ];

  readonly statusFilters = [
    { id: 'all', label: 'All', icon: '📁' },
    { id: 'pending', label: 'Pending', icon: '⏳' },
    { id: 'confirmed', label: 'Confirmed', icon: '✅' },
    { id: 'overdue', label: 'Overdue', icon: '⚠️' },
    { id: 'escalated', label: 'Escalated', icon: '🚨' },
    { id: 'dismissed', label: 'Dismissed', icon: '🚫' },
  ];

  readonly typeFilters = [
    { id: 'all', label: 'All types', icon: '📋' },
    { id: 'mission_return', label: 'Mission Return', icon: '🏠' },
    { id: 'location_update', label: 'Location', icon: '📍' },
    { id: 'check_in', label: 'Check-in', icon: '✓' },
    { id: 'emergency', label: 'Emergency', icon: '🚨' },
    { id: 'medical', label: 'Medical', icon: '⚕️' },
    { id: 'equipment', label: 'Equipment', icon: '🔧' },
  ];

  readonly soldierStatusFilters = [
    { id: 'all', label: 'All', icon: '📁' },
    { id: 'Active', label: 'Active', icon: '✅' },
    { id: 'On Mission', label: 'On Mission', icon: '🎯' },
    { id: 'Returning', label: 'Returning', icon: '🏠' },
    { id: 'Missing', label: 'Missing', icon: '🚨' },
    { id: 'Medical', label: 'Medical', icon: '⚕️' },
  ];

  readonly activityData = Array.from({ length: 14 }, (_, i) => ({
    day: `${i + 1}`,
    confirmed: Math.floor(Math.random() * 6) + 2,
    pending: Math.floor(Math.random() * 3),
    escalated: Math.random() > 0.7 ? 1 : 0,
  }));

  readonly activeReminders = computed(() =>
    this.reminders().filter(r => r.status === 'pending' || r.status === 'overdue' || r.status === 'escalated')
  );

  readonly criticalCount = computed(() =>
    this.reminders().filter(r => r.priority === 'critical' && r.status !== 'confirmed' && r.status !== 'dismissed').length
  );

  readonly onlineOfficers = computed(() => this.officers.filter(o => o.online));
  readonly sectorCount = computed(() => new Set(this.zones.map(z => z.sectorId)).size);

  readonly kpis = computed(() => {
    const all = this.reminders();
    const confirmed = all.filter(r => r.status === 'confirmed').length;
    const pending = all.filter(r => r.status === 'pending').length;
    const escalated = all.filter(r => r.status === 'escalated').length;
    return [
      { icon: '🔔', label: 'Total Reminders', value: all.length.toString(), color: '#007aff', pct: 100, trend: '+18%', up: true, action: () => this.active.set('feed') },
      { icon: '✅', label: 'Confirmed', value: confirmed.toString(), color: '#34c759', pct: (confirmed / all.length) * 100, trend: '+12%', up: true, action: () => this.filterByStatus('confirmed') },
      { icon: '⏳', label: 'Pending', value: pending.toString(), color: '#ff9500', pct: (pending / all.length) * 100, trend: '+3', up: false, action: () => this.filterByStatus('pending') },
      { icon: '🚨', label: 'Escalated', value: escalated.toString(), color: '#ff3b30', pct: (escalated / all.length) * 100, trend: '+2', up: false, action: () => this.filterByStatus('escalated') },
    ];
  });

  readonly filteredReminders = computed(() => {
    let list = this.reminders();
    const s = this.statusFilter();
    if (s !== 'all') list = list.filter(r => r.status === s);
    const p = this.priorityFilter();
    if (p !== 'all') list = list.filter(r => r.priority === p);
    const t = this.typeFilter();
    if (t !== 'all') list = list.filter(r => r.type === t);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      this.soldierName(r.soldierId).toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q)
    );
    return list;
  });

  readonly filteredSoldiers = computed(() => {
    let list = this.soldiers;
    const s = this.soldierStatusFilter();
    if (s !== 'all') list = list.filter(x => x.status === s);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(x =>
      x.name.toLowerCase().includes(q) ||
      x.id.toLowerCase().includes(q) ||
      x.currentMission.toLowerCase().includes(q)
    );
    return list;
  });

  readonly activeZones = computed(() =>
    this.zones.filter(z => this.remindersInZone(z.id).length > 0)
  );

  readonly statusBreakdown = computed(() => {
    const total = this.reminders().length;
    return STATUS_BREAKDOWN.map(s => {
      const count = this.reminders().filter(r => r.status === s.label.toLowerCase()).length;
      return { label: s.label, count, pct: (count / total) * 100, color: s.color, icon: s.icon };
    });
  });

  readonly typeBreakdown = computed(() => {
    const total = this.reminders().length;
    return Object.entries(TYPE_LABELS).map(([key, val]) => {
      const count = this.reminders().filter(r => r.type === key).length;
      return { label: val.label, count, pct: (count / total) * 100, color: val.color, icon: val.icon };
    });
  });

  readonly reportKpis = computed(() => {
    const all = this.reminders();
    const avgResponse = 4;
    const confirmRate = Math.round((all.filter(r => r.status === 'confirmed').length / all.length) * 100);
    return [
      { icon: '📋', label: 'Total events', value: all.length.toString(), color: '#007aff' },
      { icon: '✅', label: 'Confirm rate', value: `${confirmRate}%`, color: '#34c759' },
      { icon: '⚡', label: 'Avg response', value: `${avgResponse}m`, color: '#ff9500' },
      { icon: '🎯', label: 'On-time rate', value: '94.2%', color: '#af52de' },
    ];
  });

  readonly sortedByTime = computed(() =>
    [...this.reminders()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );

  readonly topOfficers = computed(() => {
    const counts = new Map<string, number>();
    this.reminders().forEach(r => counts.set(r.officerId, (counts.get(r.officerId) ?? 0) + 1));
    return Array.from(counts.entries())
      .map(([id, count]) => ({ officer: this.officers.find(o => o.id === id)!, count }))
      .filter(x => x.officer)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  onSearch(q: string): void { this.searchQuery.set(q); }

  soldierName(id: string): string {
    return this.soldiers.find(s => s.id === id)?.name ?? id;
  }

  soldierPhone(id: string): string {
    return this.soldiers.find(s => s.id === id)?.phone ?? '';
  }

  soldierById(id: string): ReminderSoldier | undefined {
    return this.soldiers.find(s => s.id === id);
  }

  officerName(id: string): string {
    const o = this.officers.find(x => x.id === id);
    return o ? `${o.rank} ${o.name}` : id;
  }

  zoneById(id: string): Zone | undefined {
    return this.zones.find(z => z.id === id);
  }

  zoneName(id: string): string {
    return this.zoneById(id)?.name ?? id;
  }

  zoneCode(id: string): string {
    return this.zoneById(id)?.code ?? id;
  }

  sectorName(id: string): string {
    return SECTOR_LOOKUP[id]?.name ?? id;
  }

  sectorCode(id: string): string {
    return SECTOR_LOOKUP[id]?.code ?? id;
  }

  sectorColor(id: string): string {
    return SECTOR_LOOKUP[id]?.color ?? '#8e8e93';
  }

  typeLabel(type: string): string {
    return (TYPE_LABELS as any)[type]?.label ?? type;
  }

  typeIcon(type: string): string {
    return (TYPE_LABELS as any)[type]?.icon ?? '📋';
  }

  typeColor(type: string): string {
    return (TYPE_LABELS as any)[type]?.color ?? '#8e8e93';
  }

  zoneTypeLabel(type: string): string {
    return { urban: 'Urban', rural: 'Rural', desert: 'Desert', coastal: 'Coastal', border: 'Border', industrial: 'Industrial' }[type] ?? type;
  }

  typeIconForZone(type: string): string {
    return { urban: '🏙', rural: '🌾', desert: '🏜', coastal: '🌊', border: '🛡', industrial: '🏭' }[type] ?? '📍';
  }

  workloadColor(w: number): string {
    if (w >= 85) return '#ff3b30';
    if (w >= 65) return '#ff9500';
    if (w >= 40) return '#34c759';
    return '#007aff';
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
    return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  countByStatus(id: string): number {
    if (id === 'all') return this.reminders().length;
    return this.reminders().filter(r => r.status === id).length;
  }

  countSoldiersBy(id: string): number {
    if (id === 'all') return this.soldiers.length;
    return this.soldiers.filter(s => s.status === id).length;
  }

  zonesByRisk(risk: string): Zone[] {
    return this.zones.filter(z => z.riskLevel === risk);
  }

  remindersInZone(id: string): Reminder[] {
    return this.reminders().filter(r => r.zoneId === id);
  }

  criticalInZone(id: string): number {
    return this.reminders().filter(r => r.zoneId === id && r.priority === 'critical').length;
  }

  soldiersInZone(id: string): ReminderSoldier[] {
    return this.soldiers.filter(s => s.zoneId === id);
  }

  assignedReminders(officerId: string): Reminder[] {
    return this.reminders().filter(r => r.officerId === officerId);
  }

  soldierReminders(id: string): Reminder[] {
    return this.reminders().filter(r => r.soldierId === id);
  }

  soldierConfirmed(id: string): number {
    return this.soldierReminders(id).filter(r => r.status === 'confirmed').length;
  }

  soldierPending(id: string): number {
    return this.soldierReminders(id).filter(r => r.status === 'pending' || r.status === 'overdue').length;
  }

  filterByStatus(status: string): void {
    this.statusFilter.set(status);
    this.active.set('feed');
  }

  openReminder(id: string): void {
    const r = this.reminders().find(x => x.id === id);
    if (r) this.selectedReminder.set(r);
  }

  openSoldier(id: string): void {
    const s = this.soldierById(id);
    if (s) this.selectedSoldier.set(s);
  }

  openZone(id: string): void {
    const z = this.zoneById(id);
    if (z) this.selectedZone.set(z);
  }

  confirm(id: string): void {
    this.reminders.update(list => list.map(r =>
      r.id === id ? { ...r, status: 'confirmed' as const, confirmedAt: new Date().toISOString() } : r
    ));
    const r = this.reminders().find(x => x.id === id);
    this.toast.success(`Reminder ${id} confirmed`, r ? this.soldierName(r.soldierId) : '', '✅');
  }

  escalate(id: string): void {
    this.reminders.update(list => list.map(r =>
      r.id === id ? { ...r, status: 'escalated' as const, escalatedAt: new Date().toISOString() } : r
    ));
    this.toast.warning(`Reminder ${id} escalated`, 'Command notified', '🚨');
  }

  dismiss(id: string): void {
    this.reminders.update(list => list.map(r =>
      r.id === id ? { ...r, status: 'dismissed' as const } : r
    ));
    this.selectedReminder.set(null);
    this.toast.info(`Reminder ${id} dismissed`);
  }

  callSoldier(r: Reminder): void {
    const phone = this.soldierPhone(r.soldierId);
    this.toast.info(`Calling ${this.soldierName(r.soldierId)}`, phone, '📞');
  }

  sendSms(r: Reminder): void {
    this.toast.success(`SMS sent to ${this.soldierName(r.soldierId)}`, 'Message delivered', '💬');
  }

  viewOnMap(r: Reminder): void {
    this.toast.info('Opening map', `${r.coordinates.lat.toFixed(3)}, ${r.coordinates.lng.toFixed(3)}`, '🗺');
  }

  addNote(r: Reminder): void {
    const newNote = {
      author: 'Current User',
      text: 'Note added from Reminder dashboard',
      at: new Date().toISOString(),
    };
    this.reminders.update(list => list.map(x =>
      x.id === r.id ? { ...x, notes: [...x.notes, newNote] } : x
    ));
    this.selectedReminder.update(cur => cur && cur.id === r.id
      ? { ...cur, notes: [...cur.notes, newNote] }
      : cur
    );
    this.toast.success('Note added', r.id, '✎');
  }

  createReminder(): void {
    const soldier = this.soldiers[Math.floor(Math.random() * this.soldiers.length)];
    const officer = this.officers[Math.floor(Math.random() * this.officers.length)];
    const id = `R-${2000 + this.reminders().length + 1}`;
    const newReminder: Reminder = {
      id,
      soldierId: soldier.id,
      officerId: officer.id,
      sectorId: soldier.sectorId,
      zoneId: soldier.zoneId,
      type: 'check_in',
      priority: 'normal',
      status: 'pending',
      title: `New check-in required`,
      description: `Automated reminder for ${soldier.name}`,
      location: this.zoneName(soldier.zoneId),
      coordinates: this.zoneById(soldier.zoneId)?.coordinates ?? { lat: 30, lng: 31 },
      createdAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 3600000).toISOString(),
      notes: [],
    };
    this.reminders.update(list => [newReminder, ...list]);
    this.active.set('feed');
    this.toast.success(`Reminder ${id} created`, soldier.name, '🔔');
  }

  generateReport(): void {
    this.toast.success('Generating PDF report', 'All zones + officers summary', '📄');
  }

  onReminderContext(ev: MouseEvent, r: Reminder): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: 'View details', icon: '👁', action: () => this.openReminder(r.id) },
      { id: 'call', label: 'Call soldier', icon: '📞', action: () => this.callSoldier(r) },
      { id: 'sms', label: 'Send SMS', icon: '💬', action: () => this.sendSms(r) },
      { id: 'map', label: 'View on map', icon: '🗺', action: () => this.viewOnMap(r) },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'copy', label: 'Copy ID', icon: '📋',
        action: () => { navigator.clipboard?.writeText(r.id); this.toast.success('Copied ' + r.id); }
      },
      ...(r.status === 'pending' || r.status === 'overdue' ? [
        { id: 'sep2', label: '', separatorBefore: true, action: () => { } },
        { id: 'confirm', label: 'Confirm', icon: '✓', action: () => this.confirm(r.id) },
        { id: 'escalate', label: 'Escalate', icon: '🚨', action: () => this.escalate(r.id) },
      ] : []),
    ]);
  }

  onSoldierContext(ev: MouseEvent, s: ReminderSoldier): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: 'View soldier', icon: '👁', action: () => this.openSoldier(s.id) },
      { id: 'reminder', label: 'Create reminder', icon: '🔔', action: () => this.createReminder() },
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

  onZoneContext(ev: MouseEvent, z: Zone): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'open', label: 'Open zone', icon: '📂', action: () => this.openZone(z.id) },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'copy-code', label: 'Copy zone code', icon: '📋',
        action: () => { navigator.clipboard?.writeText(z.code); this.toast.success('Copied ' + z.code); }
      },
      {
        id: 'filter', label: 'Filter soldiers in zone', icon: '🔍',
        action: () => { this.active.set('soldiers'); }
      },
    ]);
  }

  onOfficerContext(ev: MouseEvent, o: ReminderOfficer): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      {
        id: 'call', label: 'Call officer', icon: '📞',
        action: () => this.toast.info(`Calling ${o.rank} ${o.name}`, o.phone, '📞')
      },
      {
        id: 'email', label: 'Send email', icon: '📧',
        action: () => this.toast.info('Opening email', o.email, '📧')
      },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      {
        id: 'copy-phone', label: 'Copy phone', icon: '📋',
        action: () => { navigator.clipboard?.writeText(o.phone); this.toast.success('Phone copied'); }
      },
      {
        id: 'filter', label: 'Show assigned reminders', icon: '🔍',
        action: () => this.toast.info(`${this.assignedReminders(o.id).length} reminders assigned`)
      },
    ]);
  }
}