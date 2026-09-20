import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PreviewNavItem, PreviewShellComponent } from '../../shared/preview-shell/preview-shell';
import { DummyDataEditorComponent } from '../../shared/dummy-data-editor/dummy-data-editor';
import { NgTemplateOutlet } from '@angular/common';

interface Order {
  id: string; soldier: string; soldierId: string;
  from: string; to: string;
  status: 'pending' | 'approved' | 'executed' | 'rejected';
  date: string;
}

@Component({
  selector: 'app-transfer-orders-preview',
  standalone: true,
  imports: [PreviewShellComponent, DummyDataEditorComponent, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🎖️"
      title="Transfer Orders"
      subtitle="FOE · Confidential"
      [nav]="nav"
      [active]="active()"
    >
      <div actions class="badge-conf">🔒 Confidential Build</div>

      <div class="preview-note">
        <app-dummy-data-editor projectId="transfer-orders" />
      </div>

      @switch (active()) {
        @case ('orders')   { <ng-container *ngTemplateOutlet="ordersTpl" /> }
        @case ('soldier')  { <ng-container *ngTemplateOutlet="soldierTpl" /> }
        @case ('report')   { <ng-container *ngTemplateOutlet="reportTpl" /> }
      }
    </app-preview-shell>

    <ng-template #ordersTpl>
      <div class="orders">
        <div class="filters">
          @for (f of statuses; track f.id) {
            <button class="seg" [class.active]="filter() === f.id" (click)="filter.set(f.id)">
              {{ f.icon }} {{ f.label }}
              <span class="cnt">{{ countBy(f.id) }}</span>
            </button>
          }
        </div>

        <div class="table">
          <header class="thead">
            <span>Order</span><span>Soldier</span><span>From</span><span>To</span><span>Status</span><span></span>
          </header>
          @for (o of visibleOrders(); track o.id) {
            <div class="trow" [class.open]="openOrder() === o.id" (click)="openOrder.set(o.id)">
              <span class="mono">{{ o.id }}</span>
              <span>{{ o.soldier }} <small class="mono">{{ o.soldierId }}</small></span>
              <span>{{ o.from }}</span>
              <span>{{ o.to }}</span>
              <span class="status" [attr.data-s]="o.status">{{ statusLabel(o.status) }}</span>
              <span class="chev">›</span>
            </div>

            @if (openOrder() === o.id) {
              <div class="tdetail">
                <div class="doc">
                  <div class="doc-head">
                    <span class="doc-mark">◆</span>
                    <div>
                      <b>MILITARY TRANSFER ORDER</b>
                      <small class="mono">Ref: {{ o.id }} · {{ o.date }}</small>
                    </div>
                  </div>
                  <div class="doc-body">
                    <p>By order of the sector commander, the soldier <b>{{ o.soldier }}</b> (ID <span class="mono">{{ o.soldierId }}</span>) is hereby transferred from <b>{{ o.from }}</b> to <b>{{ o.to }}</b>, effective immediately.</p>
                    <div class="doc-sign">
                      <div class="sig-line"></div>
                      <small>Colonel — Sector Command</small>
                    </div>
                  </div>
                  <div class="doc-actions">
                    <button class="pill">🖨 Print</button>
                    <button class="pill">📄 Export PDF</button>
                    @if (o.status === 'pending') {
                      <button class="pill primary" (click)="$event.stopPropagation(); approve(o.id)">
                        ✓ Approve & Execute
                      </button>
                    } @else if (o.status === 'approved') {
                      <button class="pill primary" (click)="$event.stopPropagation(); execute(o.id)">
                        ▶ Execute
                      </button>
                    } @else {
                      <button class="pill" disabled>Completed</button>
                    }
                  </div>
                </div>
                <ul class="timeline">
                  @for (t of timelineFor(o); track t.t) {
                    <li class="tl-item" [class.done]="t.done">
                      <span class="tl-dot"></span>
                      <div>
                        <b>{{ t.t }}</b>
                        <small>{{ t.time }}</small>
                      </div>
                    </li>
                  }
                </ul>
              </div>
            }
          }
        </div>
      </div>
    </ng-template>

    <ng-template #soldierTpl>
      <div class="soldier">
        <div class="soldier-card">
          <div class="soldier-photo">M</div>
          <div class="soldier-info">
            <h3>Mohamed Ahmed Kamal</h3>
            <p class="mono">ID · M-88102</p>
            <div class="soldier-meta">
              <span><b>Rank</b> Sergeant</span>
              <span><b>Unit</b> Battalion 3</span>
              <span><b>Enlisted</b> 2022</span>
            </div>
          </div>
          <div class="soldier-actions">
            <button class="pill">📋 Transfer</button>
            <button class="pill">🖨 Print Card</button>
          </div>
        </div>

        <div class="soldier-grid">
          <section class="card-sm">
            <h4>Assignment History</h4>
            <ul class="history">
              @for (a of assignments; track a.id) {
                <li>
                  <span class="dot-a"></span>
                  <div>
                    <b>{{ a.unit }}</b>
                    <small>{{ a.from }} — {{ a.to }}</small>
                  </div>
                  <span class="pill-sm">{{ a.role }}</span>
                </li>
              }
            </ul>
          </section>
          <section class="card-sm">
            <h4>Documents</h4>
            <ul class="docs">
              @for (d of documents; track d.id) {
                <li>
                  <span class="doc-icon">{{ d.icon }}</span>
                  <span>{{ d.label }}</span>
                  <span class="mono small">{{ d.size }}</span>
                </li>
              }
            </ul>
          </section>
        </div>
      </div>
    </ng-template>

    <ng-template #reportTpl>
      <div class="report">
        <header class="report-head">
          <h3>Q4 2024 — Operations Report</h3>
          <span class="mono">Generated: {{ today() }}</span>
        </header>
        <div class="kpis">
          @for (k of kpis; track k.label) {
            <div class="kpi">
              <span>{{ k.label }}</span>
              <b>{{ k.value }}</b>
              <span class="trend" [class.up]="k.up">{{ k.up ? '▲' : '▼' }} {{ k.delta }}%</span>
            </div>
          }
        </div>
        <section class="chart-card">
          <h4>Transfers by Sector</h4>
          <div class="chart-bars">
            @for (s of sectors; track s.name) {
              <div class="sector-row">
                <span class="sector-name">{{ s.name }}</span>
                <div class="sector-bar"><div [style.width.%]="s.pct"></div></div>
                <span class="sector-val mono">{{ s.value }}</span>
              </div>
            }
          </div>
        </section>
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .preview-note { margin-bottom: 20px; }

    .badge-conf {
      padding: 5px 12px;
      background: rgba(255, 149, 0, 0.15);
      color: #ff9500;
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .pill { padding: 7px 14px; background: var(--bg-fill); color: var(--label);
            border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600;
            transition: all var(--t-fast); }
    .pill:hover:not(:disabled) { background: var(--bg-fill-3); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }
    .pill:disabled { opacity: 0.5; cursor: default; }

    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .mono.small { font-size: var(--fs-2xs); }
    small.mono { font-size: 11px; color: var(--label-3); margin-left: 4px; }

    .orders { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

    .filters { display: flex; gap: 6px; padding: 4px; background: var(--bg-fill-2);
               border-radius: var(--r-sm); width: fit-content; }
    .seg { padding: 7px 12px; border-radius: calc(var(--r-sm) - 4px);
           font-size: var(--fs-xs); font-weight: 500; color: var(--label-2);
           display: inline-flex; align-items: center; gap: 6px;
           transition: all var(--t-base) var(--ease-smooth); }
    .seg.active { background: var(--bg-surface-solid); color: var(--label);
                  box-shadow: var(--shadow-xs); font-weight: 600; }
    .cnt {
      background: var(--bg-fill-2);
      padding: 1px 6px;
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
      color: var(--label-2);
    }
    .seg.active .cnt { background: var(--accent-soft); color: var(--accent); }

    .table {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
    }
    .thead, .trow {
      display: grid;
      grid-template-columns: 100px 1.4fr 1fr 1fr 110px 24px;
      gap: 16px;
      padding: 14px 18px;
      align-items: center;
      font-size: var(--fs-sm);
    }
    .thead { background: var(--bg-fill-2); font-size: var(--fs-2xs); text-transform: uppercase;
             letter-spacing: 0.06em; color: var(--label-2); font-weight: 600; }
    .trow { border-top: 0.5px solid var(--separator); cursor: pointer;
            transition: background var(--t-fast); }
    .trow:hover { background: var(--bg-hover); }
    .trow.open { background: var(--bg-hover); }
    .trow .chev { color: var(--label-3); text-align: right;
                  transition: transform var(--t-base) var(--ease-spring); }
    .trow.open .chev { transform: rotate(90deg); color: var(--accent); }

    .status {
      display: inline-block;
      padding: 3px 10px;
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .status[data-s='pending']  { background: rgba(255, 149, 0, 0.16); color: #ff9500; }
    .status[data-s='approved'] { background: rgba(0, 122, 255, 0.16); color: #007aff; }
    .status[data-s='executed'] { background: rgba(52, 199, 89, 0.16); color: #34c759; }
    .status[data-s='rejected'] { background: rgba(255, 59, 48, 0.16); color: #ff3b30; }

    .tdetail {
      display: grid;
      grid-template-columns: 1fr 240px;
      gap: 16px;
      padding: 20px;
      background: var(--bg-fill-2);
      border-top: 0.5px solid var(--separator);
      animation: detailIn 300ms var(--ease-spring);
    }
    @keyframes detailIn {
      from { opacity: 0; max-height: 0; }
      to   { opacity: 1; max-height: 600px; }
    }
    @media (max-width: 800px) { .tdetail { grid-template-columns: 1fr; } }

    .doc {
      background: #fff;
      color: #1a1a1a;
      border-radius: var(--r-sm);
      padding: 24px;
      box-shadow: var(--shadow-sm);
    }
    .doc-head { display: flex; align-items: center; gap: 12px;
                padding-bottom: 14px; margin-bottom: 18px;
                border-bottom: 1.5px solid #1a1a1a; }
    .doc-mark { font-size: 22px; }
    .doc-head b { font-size: 13px; letter-spacing: 0.06em; }
    .doc-head small { display: block; color: #666; margin-top: 2px; }
    .doc-body p { font-size: 13px; line-height: 1.7; color: #222; }
    .doc-body p b { color: #1a1a1a; }
    .doc-sign { margin-top: 32px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
    .sig-line { width: 180px; border-top: 1.5px solid #1a1a1a; }
    .doc-sign small { font-size: 11px; color: #666; letter-spacing: 0.04em; text-transform: uppercase; }
    .doc-actions { display: flex; gap: 8px; margin-top: 20px; padding-top: 16px;
                   border-top: 0.5px solid rgba(0,0,0,.12); }
    .doc-actions .pill { background: #e8e0d3; color: #1a1a1a; }
    .doc-actions .pill:hover { background: #d8ceb8; }
    .doc-actions .pill.primary { background: #007aff; color: #fff; }

    .timeline { list-style: none; display: flex; flex-direction: column; gap: 16px;
                padding: 8px 0; }
    .tl-item { display: flex; gap: 12px; position: relative; padding-left: 24px; }
    .tl-item::before {
      content: '';
      position: absolute;
      left: 6px; top: 16px; bottom: -16px;
      width: 1px;
      background: var(--separator);
    }
    .tl-item:last-child::before { display: none; }
    .tl-dot {
      position: absolute; left: 0; top: 6px;
      width: 13px; height: 13px;
      border-radius: 50%;
      background: var(--bg-fill-3);
      border: 2px solid var(--bg-surface-solid);
      box-shadow: 0 0 0 1px var(--separator);
    }
    .tl-item.done .tl-dot { background: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .tl-item b { font-size: var(--fs-xs); font-weight: 600; display: block; }
    .tl-item small { font-size: var(--fs-2xs); color: var(--label-2); }

    .soldier { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .soldier-card {
      display: flex; gap: 20px; align-items: center;
      padding: 24px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
    }
    @media (max-width: 640px) { .soldier-card { flex-direction: column; text-align: center; } }
    .soldier-photo {
      width: 80px; height: 80px;
      display: grid; place-items: center;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: var(--r-md);
      font-size: 32px;
      font-weight: 800;
    }
    .soldier-info { flex: 1; }
    .soldier-info h3 { font-size: var(--fs-xl); font-weight: 700; letter-spacing: -0.02em; }
    .soldier-info p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 2px; }
    .soldier-meta { display: flex; gap: 20px; margin-top: 12px; flex-wrap: wrap; }
    .soldier-meta span { font-size: var(--fs-xs); color: var(--label-2); }
    .soldier-meta b { display: block; font-size: var(--fs-2xs); text-transform: uppercase;
                      letter-spacing: 0.06em; color: var(--label-3); margin-bottom: 2px; }
    .soldier-actions { display: flex; flex-direction: column; gap: 8px; }

    .soldier-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 720px) { .soldier-grid { grid-template-columns: 1fr; } }
    .card-sm {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .card-sm h4 { font-size: var(--fs-xs); font-weight: 700; text-transform: uppercase;
                  letter-spacing: 0.06em; color: var(--label-3); margin-bottom: 14px; }

    .history { list-style: none; display: flex; flex-direction: column; gap: 12px; }
    .history li { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; }
    .dot-a { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
    .history b { font-size: var(--fs-xs); font-weight: 600; display: block; }
    .history small { font-size: var(--fs-2xs); color: var(--label-2); }
    .pill-sm { padding: 2px 8px; background: var(--bg-fill-2); border-radius: var(--r-pill);
               font-size: 10px; color: var(--label-2); }

    .docs { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .docs li { display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center;
               font-size: var(--fs-xs); }
    .doc-icon { font-size: 16px; }

    .report { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .report-head { display: flex; justify-content: space-between; align-items: baseline; }
    .report-head h3 { font-size: var(--fs-xl); font-weight: 700; letter-spacing: -0.02em; }
    .report-head span { font-size: var(--fs-xs); color: var(--label-2); }

    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 700px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
    .kpi { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
           border-radius: var(--r-md); display: flex; flex-direction: column; gap: 4px; }
    .kpi span { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase;
                letter-spacing: 0.06em; font-weight: 600; }
    .kpi b { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em;
             font-variant-numeric: tabular-nums; }
    .trend { font-size: var(--fs-2xs); font-weight: 600; }
    .trend.up { color: #34c759; }
    .trend:not(.up) { color: #ff3b30; }

    .chart-card { padding: 20px; background: var(--bg-surface-solid);
                  border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .chart-card h4 { font-size: var(--fs-sm); font-weight: 700; margin-bottom: 16px; }
    .sector-row { display: grid; grid-template-columns: 120px 1fr 60px; gap: 14px;
                  align-items: center; margin-bottom: 12px; }
    .sector-name { font-size: var(--fs-xs); font-weight: 500; }
    .sector-bar { height: 10px; background: var(--bg-fill-2); border-radius: var(--r-pill);
                  overflow: hidden; }
    .sector-bar div { height: 100%; background: var(--accent); border-radius: var(--r-pill);
                      transition: width 600ms var(--ease-out); }
    .sector-val { text-align: right; font-size: var(--fs-xs); color: var(--label-2); }
  `],
})
export class TransferOrdersPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'soldier', label: 'Soldier Card', icon: '🎖️' },
    { id: 'report', label: 'Reports', icon: '📊' },
  ];

  readonly active = signal('orders');
  readonly filter = signal<string>('all');
  readonly openOrder = signal<string | null>(null);

  readonly statuses = [
    { id: 'all', label: 'All', icon: '📁' },
    { id: 'pending', label: 'Pending', icon: '⏳' },
    { id: 'approved', label: 'Approved', icon: '✓' },
    { id: 'executed', label: 'Executed', icon: '✅' },
  ];

  readonly orders = signal<Order[]>([
    { id: 'A-1029', soldier: 'Mohamed Ahmed Kamal', soldierId: 'M-88102', from: 'Battalion 3', to: 'Battalion 7', status: 'pending', date: '2024-12-08' },
    { id: 'A-1030', soldier: 'Youssef Khaled Adel', soldierId: 'M-88103', from: 'Battalion 5', to: 'Battalion 2', status: 'approved', date: '2024-12-08' },
    { id: 'A-1031', soldier: 'Omar Samir Hassan', soldierId: 'M-88104', from: 'Battalion 1', to: 'Battalion 4', status: 'executed', date: '2024-12-07' },
    { id: 'A-1032', soldier: 'Karim Hany Tarek', soldierId: 'M-88105', from: 'Battalion 7', to: 'Battalion 3', status: 'pending', date: '2024-12-08' },
    { id: 'A-1033', soldier: 'Tarek Nabil Sami', soldierId: 'M-88106', from: 'Battalion 2', to: 'Battalion 6', status: 'rejected', date: '2024-12-06' },
  ]);

  readonly visibleOrders = computed(() => {
    const f = this.filter();
    if (f === 'all') return this.orders();
    return this.orders().filter(o => o.status === f);
  });

  readonly assignments = [
    { id: 1, unit: 'Battalion 3 — Infantry', from: '2023-06', to: 'Present', role: 'Active' },
    { id: 2, unit: 'Battalion 5 — Training', from: '2022-09', to: '2023-06', role: 'Training' },
    { id: 3, unit: 'Basic Training Camp', from: '2022-03', to: '2022-09', role: 'Recruit' },
  ];

  readonly documents = [
    { id: 1, icon: '📄', label: 'Enlistment Record', size: '240 KB' },
    { id: 2, icon: '📄', label: 'Medical Clearance', size: '180 KB' },
    { id: 3, icon: '📄', label: 'Training Certificate', size: '320 KB' },
    { id: 4, icon: '📄', label: 'Current Transfer Order', size: '95 KB' },
  ];

  readonly kpis = [
    { label: 'Total Transfers', value: '1,247', up: true, delta: 12 },
    { label: 'Avg. Approval', value: '4.2h', up: true, delta: 18 },
    { label: 'Pending Review', value: '38', up: false, delta: 6 },
    { label: 'Compliance', value: '99.4%', up: true, delta: 1 },
  ];

  readonly sectors = [
    { name: 'Cairo', value: 412, pct: 82 },
    { name: 'Alexandria', value: 287, pct: 61 },
    { name: 'Giza', value: 245, pct: 52 },
    { name: 'Delta', value: 189, pct: 42 },
    { name: 'Upper Egypt', value: 114, pct: 28 },
  ];

  today = () => new Date().toLocaleDateString();

  countBy(status: string): number {
    if (status === 'all') return this.orders().length;
    return this.orders().filter(o => o.status === status).length;
  }

  statusLabel(s: Order['status']): string {
    return { pending: 'Pending', approved: 'Approved', executed: 'Executed', rejected: 'Rejected' }[s];
  }

  timelineFor(o: Order) {
    return [
      { t: 'Order created', time: o.date, done: true },
      { t: 'Reviewed by HQ', time: '2 hours later', done: ['approved', 'executed'].includes(o.status) },
      { t: 'Approved', time: '—', done: ['approved', 'executed'].includes(o.status) },
      { t: 'Executed', time: '—', done: o.status === 'executed' },
    ];
  }

  approve(id: string): void {
    this.orders.update(list => list.map(o => o.id === id ? { ...o, status: 'approved' } : o));
  }
  execute(id: string): void {
    this.orders.update(list => list.map(o => o.id === id ? { ...o, status: 'executed' } : o));
  }
}