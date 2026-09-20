import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DummyDataEditorComponent } from '../../shared/dummy-data-editor/dummy-data-editor';
import { PreviewShellComponent, PreviewNavItem } from '../../shared/preview-shell/preview-shell';

@Component({
  selector: 'app-sector-reports-preview',
  standalone: true,
  imports: [PreviewShellComponent, DummyDataEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="📊"
      title="Sector Reports"
      subtitle="FOE · Operations"
      [nav]="nav"
      [active]="active()"
    >
      <div actions class="conf-badge">🔒 Confidential</div>

      <div class="preview-note">
        <app-dummy-data-editor projectId="sectorreports" />
      </div>

      @if (active() === 'overview') {
        <div class="ov">
          <div class="kpis">
            <div class="kpi"><span>Active missions</span><b>24</b>
              <small class="up">+3 vs yesterday</small></div>
            <div class="kpi"><span>Completion rate</span><b>87%</b>
              <small class="up">+4% WoW</small></div>
            <div class="kpi"><span>Personnel deployed</span><b>1,247</b>
              <small class="down">-12 today</small></div>
            <div class="kpi"><span>Critical alerts</span><b>3</b>
              <small class="down">needs attention</small></div>
          </div>

          <section class="chart-card">
            <header>
              <h4>Mission Activity — Last 30 days</h4>
              <div class="range">Last 30 days ▾</div>
            </header>
            <div class="chart-bars">
              @for (v of missionData; track $index) {
                <div class="cb-wrap" (mouseenter)="hoverIdx.set($index)" (mouseleave)="hoverIdx.set(-1)">
                  @if (hoverIdx() === $index) { <div class="cb-tip">{{ v }}</div> }
                  <div class="cb" [style.height.%]="v" [class.active]="hoverIdx() === $index"></div>
                </div>
              }
            </div>
            <footer class="chart-legend">
              <span>30 days ago</span><span>Today</span>
            </footer>
          </section>

          <div class="grid-2">
            <section class="card">
              <h4>Sector Performance</h4>
              @for (s of sectors; track s.name) {
                <div class="sector-row">
                  <span class="s-name">{{ s.name }}</span>
                  <div class="s-bar">
                    <div class="s-fill" [style.width.%]="s.pct" [style.background]="s.color"></div>
                  </div>
                  <span class="s-pct mono">{{ s.pct }}%</span>
                </div>
              }
            </section>
            <section class="card">
              <h4>Recent Reports</h4>
              @for (r of recent; track r.id) {
                <div class="report-row">
                  <span class="r-icon">📄</span>
                  <div class="r-info">
                    <b>{{ r.title }}</b>
                    <small>{{ r.sector }} · {{ r.date }}</small>
                  </div>
                  <span class="r-badge" [class.alert]="r.alert">{{ r.status }}</span>
                </div>
              }
            </section>
          </div>
        </div>
      } @else if (active() === 'missions') {
        <div class="missions">
          <header class="m-head">
            <h3>Active Missions</h3>
            <button class="pill primary">＋ New report</button>
          </header>
          @for (m of missions; track m.id) {
            <article class="mission-card" [attr.data-s]="m.status">
              <div class="m-icon">{{ m.icon }}</div>
              <div class="m-body">
                <div class="m-top">
                  <b>{{ m.title }}</b>
                  <span class="m-status" [attr.data-s]="m.status">{{ m.status }}</span>
                </div>
                <p class="m-desc">{{ m.desc }}</p>
                <div class="m-meta">
                  <span>📍 {{ m.sector }}</span>
                  <span>👥 {{ m.personnel }} personnel</span>
                  <span>⏱ Started {{ m.started }}</span>
                </div>
                <div class="m-progress">
                  <div class="mp-bar"><div class="mp-fill" [style.width.%]="m.progress"></div></div>
                  <span class="mono">{{ m.progress }}%</span>
                </div>
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="export">
          <h3>Generate Report</h3>
          <p class="sub">Select parameters and generate a formal PDF report.</p>
          <form class="export-form">
            <label class="field">
              <span>Report title</span>
              <input value="Q4 2024 — Sector Operations Summary" />
            </label>
            <div class="row">
              <label class="field">
                <span>Sector</span>
                <select>
                  <option>All sectors</option>
                  <option>Cairo</option>
                  <option>Alexandria</option>
                  <option>Delta</option>
                </select>
              </label>
              <label class="field">
                <span>Date range</span>
                <select>
                  <option>Last 30 days</option>
                  <option>Last quarter</option>
                  <option>Last year</option>
                </select>
              </label>
            </div>
            <fieldset class="fieldset">
              <legend>Sections to include</legend>
              @for (s of sections; track s.id) {
                <label class="sec-check">
                  <input type="checkbox" [checked]="selectedSections().includes(s.id)" (change)="toggleSection(s.id)" />
                  <span>{{ s.label }}</span>
                </label>
              }
            </fieldset>
            <div class="form-actions">
              <button type="button" class="pill">Preview</button>
              <button type="submit" class="pill primary" (click)="$event.preventDefault(); generate()">
                {{ generating() ? '⟳ Generating…' : (generated() ? '✓ Downloaded' : '⬇ Generate PDF') }}
              </button>
            </div>
          </form>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .preview-note { margin-bottom: 20px; }

    .pill { padding: 7px 14px; background: var(--bg-fill-2); color: var(--label);
            border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600; }
    .pill:hover { background: var(--bg-fill-3); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }
    .conf-badge {
      padding: 5px 12px;
      background: rgba(255, 149, 0, 0.15);
      color: #ff9500;
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-weight: 700;
    }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }

    .ov { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 780px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
    .kpi { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
           border-radius: var(--r-md); }
    .kpi span { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase;
                letter-spacing: 0.06em; font-weight: 700; }
    .kpi b { display: block; font-size: var(--fs-3xl); font-weight: 800;
             letter-spacing: -0.035em; margin: 6px 0 2px;
             font-variant-numeric: tabular-nums; }
    .kpi small { font-size: var(--fs-2xs); font-weight: 600; }
    .kpi small.up { color: #34c759; }
    .kpi small.down { color: #ff9500; }

    .chart-card { padding: 24px; background: var(--bg-surface-solid);
                  border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .chart-card header { display: flex; justify-content: space-between; align-items: center;
                         margin-bottom: 20px; }
    .chart-card h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .range { font-size: var(--fs-2xs); color: var(--label-2); background: var(--bg-fill-2);
             padding: 4px 12px; border-radius: var(--r-pill); font-weight: 600; }
    .chart-bars { display: flex; align-items: flex-end; gap: 4px; height: 160px; }
    .cb-wrap { flex: 1; height: 100%; display: flex; align-items: flex-end;
               position: relative; cursor: pointer; }
    .cb { width: 100%; background: var(--accent); border-radius: var(--r-xs) var(--r-xs) 2px 2px;
          transition: all var(--t-base); animation: grow 500ms var(--ease-spring); opacity: 0.85; }
    .cb.active { opacity: 1; transform: translateY(-3px); }
    @keyframes grow { from { height: 0; } }
    .cb-tip {
      position: absolute;
      top: -22px; left: 50%; transform: translateX(-50%);
      background: var(--accent);
      color: var(--accent-contrast);
      padding: 2px 8px;
      border-radius: var(--r-xs);
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
    }
    .chart-legend { display: flex; justify-content: space-between; margin-top: 8px;
                    font-size: var(--fs-2xs); color: var(--label-2); }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 800px) { .grid-2 { grid-template-columns: 1fr; } }
    .card { padding: 20px; background: var(--bg-surface-solid);
            border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .card h4 { font-size: var(--fs-sm); font-weight: 700; margin-bottom: 14px; }

    .sector-row { display: grid; grid-template-columns: 100px 1fr 50px; gap: 14px;
                  align-items: center; padding: 8px 0; font-size: var(--fs-xs); }
    .s-name { font-weight: 600; }
    .s-bar { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .s-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms var(--ease-out); }
    .s-pct { text-align: right; font-weight: 700; }

    .report-row { display: flex; align-items: center; gap: 12px; padding: 10px 0;
                  border-bottom: 0.5px solid var(--separator); }
    .report-row:last-child { border-bottom: 0; }
    .r-icon { font-size: 20px; }
    .r-info { flex: 1; min-width: 0; }
    .r-info b { font-size: var(--fs-xs); font-weight: 600; display: block; }
    .r-info small { font-size: var(--fs-2xs); color: var(--label-2); }
    .r-badge { font-size: 10px; font-weight: 700; padding: 3px 10px;
               border-radius: var(--r-pill); text-transform: uppercase;
               letter-spacing: 0.04em; background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .r-badge.alert { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

    .missions { max-width: 900px; margin: 0 auto; }
    .m-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .m-head h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .mission-card {
      display: grid;
      grid-template-columns: 56px 1fr;
      gap: 16px;
      padding: 18px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      margin-bottom: 12px;
      border-left: 3px solid var(--bg-fill-3);
      transition: all var(--t-base);
    }
    .mission-card[data-s='active']   { border-left-color: #007aff; }
    .mission-card[data-s='critical'] { border-left-color: #ff3b30; }
    .mission-card[data-s='done']     { border-left-color: #34c759; }
    .mission-card:hover { box-shadow: var(--shadow-md); }
    .m-icon { width: 56px; height: 56px; display: grid; place-items: center;
              background: var(--bg-fill-2); border-radius: var(--r-sm); font-size: 24px; }
    .m-body { display: flex; flex-direction: column; gap: 10px; }
    .m-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .m-top b { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .m-status { padding: 3px 10px; border-radius: var(--r-pill); font-size: 10px;
                font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .m-status[data-s='active']   { background: var(--accent-soft); color: var(--accent); }
    .m-status[data-s='critical'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .m-status[data-s='done']     { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .m-desc { font-size: var(--fs-sm); color: var(--label-2); line-height: 1.55; }
    .m-meta { display: flex; gap: 16px; font-size: var(--fs-2xs); color: var(--label-2);
              flex-wrap: wrap; }
    .m-progress { display: flex; align-items: center; gap: 10px; }
    .mp-bar { flex: 1; height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill);
              overflow: hidden; }
    .mp-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill);
               transition: width 500ms var(--ease-out); }
    .m-progress .mono { font-size: var(--fs-2xs); color: var(--label-2); min-width: 36px; }

    .export { max-width: 640px; margin: 0 auto; }
    .export h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .sub { font-size: var(--fs-sm); color: var(--label-2); margin: 4px 0 20px; }
    .export-form {
      padding: 24px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field span { font-size: var(--fs-2xs); font-weight: 700; text-transform: uppercase;
                  letter-spacing: 0.06em; color: var(--label-3); }
    .field input, .field select {
      padding: 11px 14px;
      background: var(--bg-input);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-sm);
      font-size: var(--fs-sm);
      color: var(--label);
      outline: none;
      font-family: inherit;
    }
    .field input:focus, .field select:focus { border-color: var(--accent); }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 600px) { .row { grid-template-columns: 1fr; } }

    .fieldset {
      border: 0.5px solid var(--separator);
      border-radius: var(--r-sm);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .fieldset legend {
      font-size: var(--fs-2xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--label-3);
      padding: 0 6px;
    }
    .sec-check { display: flex; align-items: center; gap: 8px; font-size: var(--fs-xs);
                 cursor: pointer; }
    .sec-check input { accent-color: var(--accent); cursor: pointer; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
  `],
})
export class SectorReportsPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'missions', label: 'Missions', icon: '🎯' },
    { id: 'export', label: 'Export', icon: '📄' },
  ];
  readonly active = signal('overview');

  readonly hoverIdx = signal(-1);

  readonly missionData = [30, 45, 22, 60, 38, 72, 55, 48, 65, 30, 42, 58, 70, 35, 62, 45, 78, 55, 40, 68, 52, 75, 60, 42, 80, 55, 68, 45, 72, 58];

  readonly sectors = [
    { name: 'Cairo', pct: 92, color: '#007aff' },
    { name: 'Alexandria', pct: 78, color: '#34c759' },
    { name: 'Delta', pct: 65, color: '#ff9500' },
    { name: 'Upper Egypt', pct: 54, color: '#af52de' },
  ];

  readonly recent = [
    { id: 1, title: 'Sector B — Night patrol summary', sector: 'Sector B', date: '2h ago', status: 'Completed', alert: false },
    { id: 2, title: 'Civilian affairs report — Q4', sector: 'Sector A', date: '5h ago', status: 'Alert', alert: true },
    { id: 3, title: 'Training deployment update', sector: 'Sector C', date: '1d ago', status: 'Completed', alert: false },
    { id: 4, title: 'Logistics movement log', sector: 'HQ', date: '1d ago', status: 'Completed', alert: false },
  ];

  readonly missions = [
    {
      id: 1, icon: '🎯', title: 'Operation Desert Wind', desc: 'Night reconnaissance across sector B perimeter',
      status: 'active', sector: 'Sector B', personnel: 42, started: '4h ago', progress: 62
    },
    {
      id: 2, icon: '🚨', title: 'Emergency Response — Sector A', desc: 'Immediate deployment following alert',
      status: 'critical', sector: 'Sector A', personnel: 24, started: '35m ago', progress: 22
    },
    {
      id: 3, icon: '📦', title: 'Logistics Transfer', desc: 'Equipment movement from HQ to Delta',
      status: 'active', sector: 'Delta', personnel: 18, started: '6h ago', progress: 78
    },
    {
      id: 4, icon: '✅', title: 'Training Exercise 12-B', desc: 'Quarterly readiness exercise',
      status: 'done', sector: 'Cairo', personnel: 87, started: '2d ago', progress: 100
    },
  ];

  readonly sections = [
    { id: 'summary', label: 'Executive summary' },
    { id: 'missions', label: 'Mission log' },
    { id: 'personnel', label: 'Personnel breakdown' },
    { id: 'logistics', label: 'Logistics report' },
    { id: 'alerts', label: 'Incidents & alerts' },
    { id: 'appendices', label: 'Appendices' },
  ];

  readonly selectedSections = signal<string[]>(['summary', 'missions', 'alerts']);
  readonly generating = signal(false);
  readonly generated = signal(false);

  toggleSection(id: string): void {
    this.selectedSections.update(list =>
      list.includes(id) ? list.filter(x => x !== id) : [...list, id]
    );
  }

  generate(): void {
    this.generating.set(true);
    setTimeout(() => {
      this.generating.set(false);
      this.generated.set(true);
      setTimeout(() => this.generated.set(false), 2500);
    }, 1500);
  }
}