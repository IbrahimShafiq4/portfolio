import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PreviewNavItem, PreviewShellComponent } from '../../shared/preview-shell/preview-shell';
import { DecimalPipe } from '@angular/common';

interface Transaction { id: number; date: string; desc: string; category: string; amount: number; type: 'in' | 'out'; }

@Component({
  selector: 'app-az-accounting-preview',
  standalone: true,
  imports: [PreviewShellComponent, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="💰"
      title="AZ Accounting"
      subtitle="Financial tracking"
      [nav]="nav"
      [active]="active()"
    >
      <div actions>
        <button class="pill primary">＋ New Entry</button>
      </div>

      @if (active() === 'overview') {
        <div class="overview">
          <div class="kpis">
            @for (k of kpis; track k.label) {
              <div class="kpi" [style.--c]="k.color">
                <span class="kpi-label">{{ k.label }}</span>
                <b class="kpi-value">{{ k.value }}</b>
                <span class="kpi-trend" [class.up]="k.up" [class.down]="!k.up">
                  {{ k.up ? '▲' : '▼' }} {{ k.delta }}%
                </span>
              </div>
            }
          </div>

          <section class="chart-card">
            <header>
              <h4>Cash Flow — Last 6 months</h4>
              <div class="legend">
                <span><i class="dot in"></i> Income</span>
                <span><i class="dot out"></i> Expenses</span>
              </div>
            </header>
            <div class="chart-bars">
              @for (m of months; track m) {
                <div class="bar-group">
                  <div class="bar in" [style.height.%]="monthlyIncome[$index]"></div>
                  <div class="bar out" [style.height.%]="monthlyExpense[$index]"></div>
                  <span class="bar-label">{{ m }}</span>
                </div>
              }
            </div>
          </section>

          <div class="grid-2">
            <section class="card">
              <header class="card-head">
                <h4>Categories</h4>
              </header>
              @for (c of categories; track c.label) {
                <div class="cat-row">
                  <span class="cat-emoji">{{ c.icon }}</span>
                  <span class="cat-label">{{ c.label }}</span>
                  <div class="cat-bar"><div class="cat-fill" [style.width.%]="c.pct" [style.background]="c.color"></div></div>
                  <span class="cat-amount mono">$ {{ c.amount }}</span>
                </div>
              }
            </section>

            <section class="card">
              <header class="card-head">
                <h4>Recent Activity</h4>
              </header>
              <ul class="tx-list">
                @for (t of recentTx(); track t.id) {
                  <li class="tx-row">
                    <span class="tx-icon" [class.in]="t.type === 'in'" [class.out]="t.type === 'out'">
                      {{ t.type === 'in' ? '↑' : '↓' }}
                    </span>
                    <div class="tx-info">
                      <b>{{ t.desc }}</b>
                      <small>{{ t.category }} · {{ t.date }}</small>
                    </div>
                    <span class="tx-amount mono" [class.pos]="t.type === 'in'" [class.neg]="t.type === 'out'">
                      {{ t.type === 'in' ? '+' : '-' }}$ {{ t.amount | number }}
                    </span>
                  </li>
                }
              </ul>
            </section>
          </div>
        </div>
      } @else if (active() === 'transactions') {
        <div class="transactions">
          <header class="tx-head">
            <h3>All Transactions</h3>
            <div class="tx-filters">
              @for (f of ['All', 'Income', 'Expense']; track f) {
                <button class="f-chip" [class.active]="txFilter() === f" (click)="txFilter.set(f)">{{ f }}</button>
              }
            </div>
          </header>
          <div class="tx-table">
            <header class="tx-tr head">
              <span>Date</span><span>Description</span><span>Category</span><span>Type</span><span>Amount</span>
            </header>
            @for (t of filteredTx(); track t.id) {
              <div class="tx-tr">
                <span class="mono">{{ t.date }}</span>
                <span>{{ t.desc }}</span>
                <span class="tag">{{ t.category }}</span>
                <span class="type" [class.in]="t.type === 'in'" [class.out]="t.type === 'out'">
                  {{ t.type === 'in' ? 'Income' : 'Expense' }}
                </span>
                <span class="mono amount" [class.pos]="t.type === 'in'" [class.neg]="t.type === 'out'">
                  {{ t.type === 'in' ? '+' : '-' }}$ {{ t.amount | number }}
                </span>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="budgets">
          <h3>Budget Management</h3>
          <div class="budget-grid">
            @for (b of budgets; track b.id) {
              <article class="budget-card">
                <header>
                  <span class="b-icon">{{ b.icon }}</span>
                  <div>
                    <b>{{ b.label }}</b>
                    <small>Monthly budget</small>
                  </div>
                  <span class="b-pct" [class.over]="b.spent > b.limit">
                    {{ Math.round(b.spent / b.limit * 100) }}%
                  </span>
                </header>
                <div class="b-bar">
                  <div class="b-fill" [class.over]="b.spent > b.limit"
                       [style.width.%]="Math.min(100, b.spent / b.limit * 100)"></div>
                </div>
                <div class="b-stats">
                  <span><b>$ {{ b.spent | number }}</b> spent</span>
                  <span class="mono">/ $ {{ b.limit | number }}</span>
                </div>
              </article>
            }
          </div>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .pill { padding: 8px 16px; background: var(--bg-fill-2); color: var(--label);
            border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600; }
    .pill:hover { background: var(--bg-fill-3); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .pos { color: #34c759; }
    .neg { color: #ff3b30; }

    .overview { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 780px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
    .kpi {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      border-left: 3px solid var(--c);
      position: relative;
    }
    .kpi-label { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase;
                 letter-spacing: 0.06em; font-weight: 700; }
    .kpi-value { display: block; font-size: var(--fs-2xl); font-weight: 800;
                 letter-spacing: -0.03em; margin: 6px 0 4px;
                 font-variant-numeric: tabular-nums; }
    .kpi-trend { font-size: var(--fs-2xs); font-weight: 700; }
    .kpi-trend.up { color: #34c759; }
    .kpi-trend.down { color: #ff3b30; }

    .chart-card {
      padding: 24px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .chart-card header { display: flex; justify-content: space-between; align-items: baseline;
                         margin-bottom: 20px; }
    .chart-card h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .legend { display: flex; gap: 16px; font-size: var(--fs-2xs); color: var(--label-2); }
    .legend span { display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .dot.in { background: #34c759; }
    .dot.out { background: #ff3b30; }
    .chart-bars { display: flex; gap: 12px; height: 180px; align-items: flex-end; }
    .bar-group {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      justify-content: flex-end;
    }
    .bar-group::before {
      content: '';
      display: flex;
      gap: 4px;
      height: 100%;
      width: 100%;
    }
    .bar {
      width: 45%;
      border-radius: var(--r-xs) var(--r-xs) 2px 2px;
      transition: all var(--t-base) var(--ease-spring);
      animation: growBar 500ms var(--ease-spring);
    }
    @keyframes growBar { from { height: 0; } }
    .bar.in { background: #34c759; }
    .bar.out { background: #ff3b30; }
    .bar-group { position: relative; }
    .bar-group .bar { position: absolute; bottom: 24px; }
    .bar-group .bar.in { left: 10%; }
    .bar-group .bar.out { right: 10%; }
    .bar-label { position: absolute; bottom: 0; font-size: var(--fs-2xs);
                 color: var(--label-2); font-weight: 600; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 800px) { .grid-2 { grid-template-columns: 1fr; } }
    .card {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .card-head { margin-bottom: 14px; }
    .card-head h4 { font-size: var(--fs-sm); font-weight: 700; }

    .cat-row { display: grid; grid-template-columns: 28px 90px 1fr 90px; gap: 12px;
               align-items: center; padding: 8px 0; font-size: var(--fs-xs); }
    .cat-emoji { font-size: 18px; }
    .cat-label { font-weight: 600; }
    .cat-bar { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill);
               overflow: hidden; }
    .cat-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms var(--ease-out); }
    .cat-amount { text-align: right; font-weight: 700; }

    .tx-list { list-style: none; display: flex; flex-direction: column; gap: 4px; }
    .tx-row { display: grid; grid-template-columns: 32px 1fr auto; gap: 12px;
              align-items: center; padding: 10px 0;
              border-bottom: 0.5px solid var(--separator); }
    .tx-row:last-child { border-bottom: 0; }
    .tx-icon {
      width: 32px; height: 32px;
      display: grid; place-items: center;
      border-radius: 50%;
      font-weight: 700;
      font-size: 14px;
    }
    .tx-icon.in { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .tx-icon.out { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .tx-info b { font-size: var(--fs-xs); font-weight: 600; display: block; }
    .tx-info small { font-size: var(--fs-2xs); color: var(--label-2); }
    .tx-amount { font-size: var(--fs-xs); font-weight: 700; }

    /* TRANSACTIONS */
    .transactions { max-width: 1080px; margin: 0 auto; }
    .tx-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .tx-head h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .tx-filters { display: flex; gap: 4px; padding: 4px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .f-chip { padding: 6px 14px; border-radius: calc(var(--r-sm) - 4px); font-size: var(--fs-xs);
              font-weight: 500; color: var(--label-2); transition: all var(--t-base); }
    .f-chip.active { background: var(--bg-surface-solid); color: var(--label);
                     box-shadow: var(--shadow-xs); font-weight: 600; }

    .tx-table {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
    }
    .tx-tr {
      display: grid;
      grid-template-columns: 100px 1fr 120px 90px 110px;
      gap: 16px;
      padding: 14px 18px;
      align-items: center;
      font-size: var(--fs-xs);
    }
    .tx-tr.head { background: var(--bg-fill-2); font-size: var(--fs-2xs); text-transform: uppercase;
                  letter-spacing: 0.06em; color: var(--label-2); font-weight: 700; }
    .tx-tr:not(.head) { border-top: 0.5px solid var(--separator); }
    .tag { display: inline-block; padding: 2px 8px; background: var(--bg-fill-2);
           border-radius: var(--r-pill); font-size: 10px; color: var(--label-2); }
    .type { padding: 3px 10px; border-radius: var(--r-pill); font-size: 10px; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.04em; display: inline-block; }
    .type.in { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .type.out { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .amount { text-align: right; font-weight: 700; }

    /* BUDGETS */
    .budgets { max-width: 1000px; margin: 0 auto; }
    .budgets h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 20px; }
    .budget-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
    .budget-card { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
                   border-radius: var(--r-md); display: flex; flex-direction: column; gap: 14px; }
    .budget-card header { display: flex; align-items: center; gap: 12px; }
    .b-icon { font-size: 24px; }
    .budget-card header > div { flex: 1; }
    .budget-card b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .budget-card small { font-size: var(--fs-2xs); color: var(--label-2); }
    .b-pct { font-size: var(--fs-base); font-weight: 800; color: var(--accent);
             font-variant-numeric: tabular-nums; }
    .b-pct.over { color: #ff3b30; }
    .b-bar { height: 8px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .b-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill);
              transition: width 500ms var(--ease-out); }
    .b-fill.over { background: #ff3b30; }
    .b-stats { display: flex; justify-content: space-between; align-items: baseline; font-size: var(--fs-2xs); }
    .b-stats b { font-size: var(--fs-xs); }
    .b-stats .mono { color: var(--label-3); }
  `],
  providers: [],
})
export class AzAccountingPreviewComponent {
  readonly Math = Math;
  readonly nav: PreviewNavItem[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'transactions', label: 'Transactions', icon: '💳' },
    { id: 'budgets', label: 'Budgets', icon: '🎯' },
  ];
  readonly active = signal('overview');

  readonly kpis = [
    { label: 'Total Balance', value: '$2,847,330', up: true, delta: 12, color: '#007aff' },
    { label: 'Income (Dec)', value: '$1,240,000', up: true, delta: 8, color: '#34c759' },
    { label: 'Expenses (Dec)', value: '$600,500', up: false, delta: 5, color: '#ff3b30' },
    { label: 'Net', value: '$639,500', up: true, delta: 22, color: '#af52de' },
  ];

  readonly months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  readonly monthlyIncome = [65, 78, 72, 88, 82, 95];
  readonly monthlyExpense = [48, 52, 45, 55, 58, 42];

  readonly categories = [
    { label: 'Salaries', icon: '👥', amount: '480,000', pct: 80, color: '#007aff' },
    { label: 'Supplies', icon: '📦', amount: '120,500', pct: 30, color: '#af52de' },
    { label: 'Marketing', icon: '📢', amount: '85,200', pct: 22, color: '#ff9500' },
    { label: 'Operations', icon: '⚙️', amount: '62,000', pct: 18, color: '#34c759' },
  ];

  readonly allTx: Transaction[] = [
    { id: 1, date: '2024-12-08', desc: 'Client payment — Project Beta', category: 'Revenue', amount: 45000, type: 'in' },
    { id: 2, date: '2024-12-07', desc: 'Monthly salaries', category: 'Salaries', amount: 48000, type: 'out' },
    { id: 3, date: '2024-12-06', desc: 'AWS bill', category: 'Infrastructure', amount: 3200, type: 'out' },
    { id: 4, date: '2024-12-05', desc: 'Client payment — Project Alpha', category: 'Revenue', amount: 38000, type: 'in' },
    { id: 5, date: '2024-12-04', desc: 'Office supplies', category: 'Operations', amount: 2400, type: 'out' },
    { id: 6, date: '2024-12-03', desc: 'Marketing ads', category: 'Marketing', amount: 5800, type: 'out' },
    { id: 7, date: '2024-12-02', desc: 'Consulting — FinBank', category: 'Revenue', amount: 22000, type: 'in' },
    { id: 8, date: '2024-12-01', desc: 'Legal fees', category: 'Operations', amount: 4500, type: 'out' },
  ];

  readonly txFilter = signal('All');

  readonly filteredTx = computed(() => {
    const f = this.txFilter();
    if (f === 'All') return this.allTx;
    return this.allTx.filter(t => t.type === (f === 'Income' ? 'in' : 'out'));
  });

  readonly recentTx = computed(() => this.allTx.slice(0, 4));

  readonly budgets = [
    { id: 1, label: 'Salaries', icon: '👥', limit: 50000, spent: 48000 },
    { id: 2, label: 'Marketing', icon: '📢', limit: 8000, spent: 5800 },
    { id: 3, label: 'Infrastructure', icon: '☁️', limit: 4000, spent: 3200 },
    { id: 4, label: 'Operations', icon: '⚙️', limit: 6000, spent: 6900 },
  ];
}