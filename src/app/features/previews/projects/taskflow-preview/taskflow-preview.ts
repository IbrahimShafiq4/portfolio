import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PreviewNavItem, PreviewShellComponent } from '../../shared/preview-shell/preview-shell';
import { NgTemplateOutlet } from '@angular/common';

interface Task { id: number; title: string; done: boolean; priority: 'low' | 'mid' | 'high'; tag: string; }
interface Habit { id: number; name: string; done: boolean; streak: number; }

@Component({
  selector: 'app-taskflow-preview',
  standalone: true,
  imports: [PreviewShellComponent, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🔥"
      title="TaskFlow"
      subtitle="Habits · Streaks · Focus"
      [nav]="nav"
      [active]="active()"
    >
      <div actions>
        <button class="pill primary" (click)="addTask()">＋ New Task</button>
      </div>

      @switch (active()) {
        @case ('today')    { <ng-container *ngTemplateOutlet="today" /> }
        @case ('habits')   { <ng-container *ngTemplateOutlet="habitsView" /> }
        @case ('stats')    { <ng-container *ngTemplateOutlet="stats" /> }
        @case ('settings') { <ng-container *ngTemplateOutlet="settings" /> }
      }
    </app-preview-shell>

    <ng-template #today>
      <div class="today">
        <div class="streak-hero">
          <div class="streak-flame">🔥</div>
          <div class="streak-meta">
            <span class="streak-label">Current streak</span>
            <b class="streak-value">{{ streak() }} <small>days</small></b>
            <span class="streak-record">Record: 34 days</span>
          </div>
          <div class="streak-ring">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-fill-2)" stroke-width="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--accent)" stroke-width="8"
                stroke-linecap="round"
                [attr.stroke-dasharray]="327"
                [attr.stroke-dashoffset]="327 - (327 * completionPct() / 100)"
                transform="rotate(-90 60 60)"
                style="transition: stroke-dashoffset 500ms cubic-bezier(0.32,0.72,0,1);" />
            </svg>
            <div class="ring-label">{{ completionPct() }}%</div>
          </div>
        </div>

        <div class="filters">
          @for (f of filters; track f) {
            <button class="seg" [class.active]="filter() === f" (click)="filter.set(f)">
              {{ f === 'all' ? '📋 All' : f === 'active' ? '⚡ Active' : '✓ Done' }}
            </button>
          }
        </div>

        <ul class="tasks">
          @for (t of visibleTasks(); track t.id) {
            <li class="task" [class.done]="t.done">
              <button class="check" (click)="toggle(t.id)">
                @if (t.done) { <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m3 7 3 3 5-6" /></svg> }
              </button>
              <div class="t-body">
                <span class="t-title">{{ t.title }}</span>
                <span class="t-meta">
                  <span class="tag">{{ t.tag }}</span>
                  <span class="pri" [attr.data-p]="t.priority">{{ t.priority }}</span>
                </span>
              </div>
              <button class="del" (click)="remove(t.id)" title="Delete">✕</button>
            </li>
          } @empty {
            <li class="empty">
              <span>✨</span>
              <b>All clear</b>
              <small>No tasks in this view</small>
            </li>
          }
        </ul>
      </div>
    </ng-template>

    <ng-template #habitsView>
      <div class="habits">
        <header class="h-head">
          <h3>Weekly Habit Tracker</h3>
          <p>Keep the chain going — miss a day, break the streak.</p>
        </header>

        <div class="h-grid">
          @for (h of habits(); track h.id) {
            <div class="habit">
              <div class="habit-top">
                <span class="habit-name">{{ h.name }}</span>
                <span class="habit-streak">🔥 {{ h.streak }}</span>
              </div>
              <div class="habit-days">
                @for (d of weekDays; track d; let i = $index) {
                  <button class="day" [class.on]="h.done ? i < h.streak : i < h.streak"
                          [class.today]="i === 6"
                          (click)="toggleHabitDay(h.id, i)">
                    <span>{{ d.charAt(0) }}</span>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </ng-template>

    <ng-template #stats>
      <div class="stats">
        <div class="kpis">
          <div class="kpi"><span>Total done</span><b>142</b></div>
          <div class="kpi"><span>This week</span><b>23</b></div>
          <div class="kpi"><span>Best day</span><b>Thu</b></div>
          <div class="kpi"><span>Avg / day</span><b>4.2</b></div>
        </div>

        <section class="chart-card">
          <h4>Completion — Last 14 days</h4>
          <div class="chart-bars">
            @for (v of chart14; track $index) {
              <div class="cb" [style.height.%]="v" [attr.data-v]="v"></div>
            }
          </div>
          <div class="chart-legend">
            <span>14 days ago</span><span>Today</span>
          </div>
        </section>

        <section class="heatmap">
          <h4>Consistency Heatmap</h4>
          <div class="heat-grid">
            @for (w of heat; track $index) {
              <div class="heat-week">
                @for (d of w; track $index) {
                  <div class="heat-cell" [style.background]="heatColor(d)" [title]="d + ' tasks'"></div>
                }
              </div>
            }
          </div>
          <div class="heat-legend">
            <span>Less</span>
            @for (l of [0,1,2,3,4]; track l) {
              <div class="heat-cell" [style.background]="heatColor(l * 3)"></div>
            }
            <span>More</span>
          </div>
        </section>
      </div>
    </ng-template>

    <ng-template #settings>
      <div class="settings-panel">
        <h3>Preferences</h3>
        <div class="pref">
          <div>
            <b>Daily reminder</b>
            <small>Get notified at 9:00 AM</small>
          </div>
          <button class="toggle" [class.on]="reminder()" (click)="reminder.set(!reminder())">
            <span class="knob"></span>
          </button>
        </div>
        <div class="pref">
          <div>
            <b>Weekend mode</b>
            <small>Pause streak on Sat/Sun</small>
          </div>
          <button class="toggle" [class.on]="weekend()" (click)="weekend.set(!weekend())">
            <span class="knob"></span>
          </button>
        </div>
        <div class="pref">
          <div>
            <b>Focus mode</b>
            <small>Hide notifications during tasks</small>
          </div>
          <button class="toggle" [class.on]="focus()" (click)="focus.set(!focus())">
            <span class="knob"></span>
          </button>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .pill { padding: 7px 14px; background: var(--accent); color: var(--accent-contrast);
            border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600;
            transition: all var(--t-fast) var(--ease-smooth); }
    .pill:hover { background: var(--accent-hover); }
    .pill.primary { background: var(--accent); }

    /* TODAY */
    .today { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

    .streak-hero {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 20px;
      padding: 24px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
    }
    .streak-flame { font-size: 52px; animation: flick 2s ease-in-out infinite; }
    @keyframes flick { 0%,100% { transform: scale(1) rotate(-2deg); } 50% { transform: scale(1.08) rotate(2deg); } }
    .streak-meta { display: flex; flex-direction: column; gap: 2px; }
    .streak-label { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase;
                    letter-spacing: 0.08em; font-weight: 600; }
    .streak-value { font-size: var(--fs-4xl); font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
    .streak-value small { font-size: var(--fs-base); font-weight: 500; color: var(--label-2); }
    .streak-record { font-size: var(--fs-2xs); color: var(--label-3); }

    .streak-ring { position: relative; width: 100px; height: 100px; }
    .streak-ring svg { width: 100%; height: 100%; }
    .ring-label {
      position: absolute; inset: 0;
      display: grid; place-items: center;
      font-size: var(--fs-md);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--label);
    }

    .filters { display: flex; gap: 4px; padding: 4px; background: var(--bg-fill-2);
               border-radius: var(--r-sm); }
    .seg { flex: 1; padding: 8px; border-radius: calc(var(--r-sm) - 4px);
           font-size: var(--fs-xs); color: var(--label-2); font-weight: 500;
           transition: all var(--t-base) var(--ease-smooth); }
    .seg.active { background: var(--bg-surface-solid); color: var(--label);
                  box-shadow: var(--shadow-xs); font-weight: 600; }

    .tasks { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .task {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      transition: all var(--t-base) var(--ease-smooth);
      animation: taskIn 300ms var(--ease-out);
    }
    @keyframes taskIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    .task:hover { box-shadow: var(--shadow-sm); transform: translateX(2px); }
    .task.done .t-title { text-decoration: line-through; color: var(--label-3); }
    .task.done .check { background: #34c759; border-color: #34c759; color: #fff; }

    .check {
      width: 22px; height: 22px;
      border: 2px solid var(--label-3);
      border-radius: 50%;
      display: grid; place-items: center;
      background: transparent;
      transition: all var(--t-base) var(--ease-spring);
      flex-shrink: 0;
    }
    .check svg { width: 12px; height: 12px; }
    .check:hover { border-color: var(--accent); transform: scale(1.08); }

    .t-body { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .t-title { font-size: var(--fs-sm); font-weight: 500; }
    .t-meta { display: flex; gap: 6px; align-items: center; }
    .tag {
      padding: 2px 8px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      font-size: 10px;
      color: var(--label-2);
      font-weight: 500;
    }
    .pri { padding: 2px 8px; border-radius: var(--r-pill); font-size: 10px; font-weight: 600;
           text-transform: uppercase; letter-spacing: 0.04em; }
    .pri[data-p='high'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .pri[data-p='mid']  { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .pri[data-p='low']  { background: rgba(52, 199, 89, 0.15); color: #34c759; }

    .del {
      width: 26px; height: 26px;
      display: grid; place-items: center;
      border-radius: var(--r-xs);
      color: var(--label-3);
      opacity: 0;
      transition: all var(--t-fast);
    }
    .task:hover .del { opacity: 1; }
    .del:hover { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

    .empty {
      padding: 60px 20px;
      text-align: center;
      display: flex; flex-direction: column; gap: 6px; align-items: center;
      background: var(--bg-surface-solid);
      border: 0.5px dashed var(--separator);
      border-radius: var(--r-md);
      list-style: none;
    }
    .empty span { font-size: 40px; opacity: 0.5; }
    .empty b { font-size: var(--fs-sm); }
    .empty small { font-size: var(--fs-xs); color: var(--label-2); }

    /* HABITS */
    .habits { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .h-head h3 { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.02em; }
    .h-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }
    .h-grid { display: flex; flex-direction: column; gap: 12px; }
    .habit {
      padding: 16px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .habit-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .habit-name { font-size: var(--fs-sm); font-weight: 600; }
    .habit-streak { font-size: var(--fs-xs); font-weight: 600; color: #ff9500; }
    .habit-days { display: flex; gap: 6px; }
    .day {
      flex: 1;
      aspect-ratio: 1;
      display: grid; place-items: center;
      background: var(--bg-fill-2);
      border-radius: var(--r-xs);
      font-size: var(--fs-2xs);
      font-weight: 600;
      color: var(--label-3);
      transition: all var(--t-base) var(--ease-spring);
    }
    .day.on { background: #34c759; color: #fff; }
    .day.today { box-shadow: 0 0 0 2px var(--accent); }
    .day:hover { transform: scale(1.06); }

    /* STATS */
    .stats { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 700px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
    .kpi {
      padding: 18px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      display: flex; flex-direction: column; gap: 4px;
    }
    .kpi span { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase;
                letter-spacing: 0.06em; font-weight: 600; }
    .kpi b { font-size: var(--fs-3xl); font-weight: 800; letter-spacing: -0.03em;
             font-variant-numeric: tabular-nums; }

    .chart-card {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .chart-card h4 { font-size: var(--fs-sm); font-weight: 700; margin-bottom: 16px; }
    .chart-bars { display: flex; align-items: flex-end; gap: 6px; height: 140px; }
    .cb {
      flex: 1;
      background: var(--accent);
      border-radius: var(--r-xs) var(--r-xs) 3px 3px;
      transition: transform var(--t-base) var(--ease-spring), opacity var(--t-base);
      opacity: 0.85;
      animation: grow 500ms var(--ease-spring);
    }
    .cb:hover { opacity: 1; transform: translateY(-3px); }
    @keyframes grow { from { height: 0; } }
    .chart-legend { display: flex; justify-content: space-between; margin-top: 8px;
                    font-size: var(--fs-2xs); color: var(--label-2); }

    .heatmap { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
               border-radius: var(--r-md); }
    .heatmap h4 { font-size: var(--fs-sm); font-weight: 700; margin-bottom: 16px; }
    .heat-grid { display: flex; gap: 4px; }
    .heat-week { display: flex; flex-direction: column; gap: 4px; }
    .heat-cell {
      width: 14px; height: 14px;
      border-radius: 3px;
      transition: transform var(--t-fast);
    }
    .heat-cell:hover { transform: scale(1.3); }
    .heat-legend { display: flex; align-items: center; gap: 6px; margin-top: 12px;
                   font-size: var(--fs-2xs); color: var(--label-2); }

    /* SETTINGS */
    .settings-panel {
      max-width: 620px; margin: 0 auto;
      padding: 24px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      display: flex; flex-direction: column; gap: 4px;
    }
    .settings-panel h3 { font-size: var(--fs-lg); font-weight: 700; margin-bottom: 16px; letter-spacing: -0.02em; }
    .pref { display: flex; justify-content: space-between; align-items: center;
            padding: 14px 0; border-bottom: 0.5px solid var(--separator); }
    .pref:last-child { border-bottom: 0; }
    .pref b { font-size: var(--fs-sm); font-weight: 600; }
    .pref small { font-size: var(--fs-2xs); color: var(--label-2); display: block; margin-top: 2px; }

    .toggle {
      position: relative;
      width: 44px; height: 26px;
      border-radius: var(--r-pill);
      background: var(--bg-fill-3);
      transition: background var(--t-base) var(--ease-smooth);
      flex-shrink: 0;
    }
    .toggle.on { background: #34c759; }
    .knob {
      position: absolute;
      top: 3px; left: 3px;
      width: 20px; height: 20px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,.2);
      transition: transform var(--t-base) var(--ease-spring);
    }
    .toggle.on .knob { transform: translateX(18px); }
  `],
})
export class TaskFlowPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'today', label: 'Today', icon: '📋' },
    { id: 'habits', label: 'Habits', icon: '🎯' },
    { id: 'stats', label: 'Statistics', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  readonly active = signal('today');
  readonly filter = signal<'all' | 'active' | 'done'>('all');
  readonly weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  readonly tasks = signal<Task[]>([
    { id: 1, title: 'Morning workout', done: true, priority: 'high', tag: 'health' },
    { id: 2, title: 'Read 20 pages', done: true, priority: 'mid', tag: 'learning' },
    { id: 3, title: 'Code review — PR #142', done: false, priority: 'high', tag: 'work' },
    { id: 4, title: 'Write OmniSocial blog post', done: false, priority: 'mid', tag: 'writing' },
    { id: 5, title: 'Walk 6,000 steps', done: false, priority: 'low', tag: 'health' },
  ]);

  readonly visibleTasks = computed(() => {
    const f = this.filter();
    const list = this.tasks();
    if (f === 'active') return list.filter(t => !t.done);
    if (f === 'done') return list.filter(t => t.done);
    return list;
  });

  readonly doneCount = computed(() => this.tasks().filter(t => t.done).length);
  readonly completionPct = computed(() =>
    this.tasks().length ? Math.round((this.doneCount() / this.tasks().length) * 100) : 0
  );
  readonly streak = computed(() => 10 + this.doneCount());
  readonly filters: Array<'all' | 'active' | 'done'> = ['all', 'active', 'done'];

  readonly habits = signal<Habit[]>([
    { id: 1, name: 'Exercise 30 min', done: false, streak: 5 },
    { id: 2, name: 'Read 20 pages', done: true, streak: 12 },
    { id: 3, name: 'Meditate', done: false, streak: 3 },
    { id: 4, name: 'Code 1 hour', done: true, streak: 22 },
  ]);

  readonly chart14 = [4, 3, 5, 2, 6, 4, 5, 3, 6, 5, 4, 5, 6, 4];
  readonly heat = [
    [2, 3, 1, 4, 0, 2, 3],
    [3, 4, 2, 5, 3, 4, 5],
    [5, 3, 4, 5, 4, 5, 3],
    [4, 5, 3, 6, 5, 4, 5],
  ];

  readonly reminder = signal(true);
  readonly weekend = signal(false);
  readonly focus = signal(false);

  toggle(id: number): void {
    this.tasks.update(list => list.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }
  remove(id: number): void {
    this.tasks.update(list => list.filter(t => t.id !== id));
  }
  addTask(): void {
    const id = Date.now();
    this.tasks.update(list => [
      { id, title: 'New task — tap to edit', done: false, priority: 'mid', tag: 'inbox' },
      ...list,
    ]);
  }
  toggleHabitDay(id: number, _i: number): void {
    this.habits.update(list => list.map(h => h.id === id ? { ...h, done: !h.done } : h));
  }

  heatColor(v: number): string {
    const level = Math.min(4, Math.floor(v / 1.5));
    return ['var(--bg-fill-2)', 'rgba(52,199,89,.25)', 'rgba(52,199,89,.5)', 'rgba(52,199,89,.75)', '#34c759'][level];
  }
}