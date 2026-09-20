import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DummyDataEditorComponent } from '../../shared/dummy-data-editor/dummy-data-editor';
import { PreviewShellComponent, PreviewNavItem } from '../../shared/preview-shell/preview-shell';

interface Note { id: number; name: string; note: string; done: boolean; time: string; }
interface Officer { id: number; name: string; rank: string; sector: string; online: boolean; }

@Component({
  selector: 'app-reminder-preview',
  standalone: true,
  imports: [PreviewShellComponent, DummyDataEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🔔"
      title="Reminder"
      subtitle="FOE · Field ops"
      [nav]="nav"
      [active]="active()"
    >
      <div actions class="conf-badge">🔒 Confidential</div>

      <div class="preview-note">
        <app-dummy-data-editor projectId="reminder" />
      </div>

      @if (active() === 'feed') {
        <div class="feed">
          <header class="feed-head">
            <div>
              <h3>Live notifications</h3>
              <p>{{ pending().length }} pending · {{ done().length }} confirmed</p>
            </div>
            <button class="pill primary" (click)="addNote()">＋ Add</button>
          </header>

          <section class="stat-row">
            <div class="stat">
              <span class="s-icon ok">✓</span>
              <div><b>{{ done().length }}</b><small>Confirmed</small></div>
            </div>
            <div class="stat">
              <span class="s-icon warn">⏳</span>
              <div><b>{{ pending().length }}</b><small>Pending</small></div>
            </div>
            <div class="stat">
              <span class="s-icon info">🎖</span>
              <div><b>{{ officers.length }}</b><small>Officers</small></div>
            </div>
          </section>

          <ul class="notif-list">
            @for (n of notes(); track n.id) {
              <li class="notif" [class.done]="n.done" (click)="toggle(n.id)">
                <span class="n-avatar" [class.done]="n.done">{{ n.done ? '✓' : '!' }}</span>
                <div class="n-body">
                  <b>{{ n.name }}</b>
                  <span>{{ n.note }}</span>
                </div>
                <span class="n-time">{{ n.time }}</span>
              </li>
            }
          </ul>
        </div>
      } @else if (active() === 'officers') {
        <div class="officers">
          <h3>Officers Online</h3>
          <div class="officer-grid">
            @for (o of officers; track o.id) {
              <article class="officer-card">
                <span class="o-avatar">🎖️</span>
                <div class="o-info">
                  <b>{{ o.rank }} {{ o.name }}</b>
                  <small>{{ o.sector }}</small>
                </div>
                <span class="o-status" [class.on]="o.online">{{ o.online ? 'Online' : 'Offline' }}</span>
              </article>
            }
          </div>
        </div>
      } @else {
        <div class="history">
          <h3>History (last 24h)</h3>
          <div class="hist-table">
            <header class="hr-row head">
              <span>Time</span><span>Soldier</span><span>Action</span><span>Officer</span>
            </header>
            @for (h of history; track h.id) {
              <div class="hr-row">
                <span class="mono">{{ h.time }}</span>
                <span>{{ h.soldier }}</span>
                <span class="tag" [class.ok]="h.ok">{{ h.action }}</span>
                <span>{{ h.officer }}</span>
              </div>
            }
          </div>
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
    .mono { font-family: var(--sf-mono); }

    .feed { max-width: 720px; margin: 0 auto; }
    .feed-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 18px; }
    .feed-head h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .feed-head p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 4px; }

    .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .stat {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .s-icon {
      width: 40px; height: 40px;
      display: grid; place-items: center;
      border-radius: 50%;
      font-size: 18px;
      font-weight: 800;
    }
    .s-icon.ok   { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .s-icon.warn { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .s-icon.info { background: var(--accent-soft); color: var(--accent); }
    .stat b { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em;
              font-variant-numeric: tabular-nums; display: block; }
    .stat small { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase;
                  letter-spacing: 0.06em; font-weight: 600; }

    .notif-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .notif {
      display: grid;
      grid-template-columns: 44px 1fr auto;
      gap: 14px;
      align-items: center;
      padding: 14px 16px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      cursor: pointer;
      transition: all var(--t-base);
      animation: notifIn 280ms var(--ease-spring);
    }
    @keyframes notifIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    .notif:hover { border-color: var(--accent); transform: translateX(2px); }
    .notif.done { opacity: 0.6; }
    .notif.done .n-body b { text-decoration: line-through; }
    .n-avatar {
      width: 40px; height: 40px;
      display: grid; place-items: center;
      background: rgba(255, 149, 0, 0.15);
      color: #ff9500;
      border-radius: 50%;
      font-size: 18px;
      font-weight: 800;
    }
    .n-avatar.done { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .n-body b { font-size: var(--fs-sm); font-weight: 700; display: block; margin-bottom: 2px; }
    .n-body span { font-size: var(--fs-xs); color: var(--label-2); }
    .n-time { font-size: var(--fs-2xs); color: var(--label-3); font-family: var(--sf-mono); }

    .officers { max-width: 900px; margin: 0 auto; }
    .officers h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em;
                   margin-bottom: 20px; }
    .officer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                    gap: 12px; }
    .officer-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .o-avatar {
      width: 44px; height: 44px;
      display: grid; place-items: center;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: 50%;
      font-size: 22px;
    }
    .o-info { flex: 1; }
    .o-info b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .o-info small { font-size: var(--fs-2xs); color: var(--label-2); }
    .o-status { font-size: var(--fs-2xs); font-weight: 700; color: var(--label-3);
                text-transform: uppercase; letter-spacing: 0.04em; }
    .o-status.on { color: #34c759; }

    .history { max-width: 900px; margin: 0 auto; }
    .history h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em;
                  margin-bottom: 20px; }
    .hist-table {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
    }
    .hr-row {
      display: grid;
      grid-template-columns: 100px 1fr 140px 1fr;
      gap: 16px;
      padding: 12px 18px;
      align-items: center;
      font-size: var(--fs-xs);
    }
    .hr-row.head {
      background: var(--bg-fill-2);
      font-size: var(--fs-2xs);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--label-2);
      font-weight: 700;
    }
    .hr-row:not(.head) { border-top: 0.5px solid var(--separator); }
    .tag { padding: 3px 10px; border-radius: var(--r-pill); font-size: 10px;
           font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
           background: rgba(255, 149, 0, 0.15); color: #ff9500; display: inline-block; }
    .tag.ok { background: rgba(52, 199, 89, 0.15); color: #34c759; }
  `],
})
export class ReminderPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'feed', label: 'Notifications', icon: '🔔' },
    { id: 'officers', label: 'Officers', icon: '🎖' },
    { id: 'history', label: 'History', icon: '📜' },
  ];
  readonly active = signal('feed');

  readonly notes = signal<Note[]>([
    { id: 1, name: 'Sgt. Mohamed Kamal', note: 'Returned from Sector B mission', done: false, time: '10:42' },
    { id: 2, name: 'Cpl. Adel Hassan', note: 'Confirmed at Battalion 7', done: false, time: '10:28' },
    { id: 3, name: 'Pvt. Hassan Sami', note: 'Awaiting confirmation', done: false, time: '10:12' },
    { id: 4, name: 'Cpl. Youssef Ali', note: 'Movement completed', done: true, time: '09:58' },
    { id: 5, name: 'Sgt. Karim Nabil', note: 'Safe return', done: true, time: '09:34' },
  ]);

  readonly pending = computed(() => this.notes().filter(n => !n.done));
  readonly done = computed(() => this.notes().filter(n => n.done));

  readonly officers: Officer[] = [
    { id: 1, name: 'Ahmed Ali', rank: 'Col.', sector: 'Sector B', online: true },
    { id: 2, name: 'Khaled Samir', rank: 'Maj.', sector: 'Sector A', online: true },
    { id: 3, name: 'Omar Ibrahim', rank: 'Capt.', sector: 'Sector C', online: false },
    { id: 4, name: 'Tarek Hussein', rank: 'Lt.', sector: 'HQ', online: true },
  ];

  readonly history = [
    { id: 1, time: '10:42', soldier: 'Sgt. Mohamed Kamal', action: 'Confirmed', officer: 'Col. Ahmed Ali', ok: true },
    { id: 2, time: '10:12', soldier: 'Pvt. Hassan Sami', action: 'Pending', officer: 'Capt. Omar Ibrahim', ok: false },
    { id: 3, time: '09:58', soldier: 'Cpl. Youssef Ali', action: 'Confirmed', officer: 'Maj. Khaled Samir', ok: true },
    { id: 4, time: '09:34', soldier: 'Sgt. Karim Nabil', action: 'Confirmed', officer: 'Col. Ahmed Ali', ok: true },
    { id: 5, time: '09:12', soldier: 'Pvt. Sami Adel', action: 'Pending', officer: 'Lt. Tarek Hussein', ok: false },
  ];

  toggle(id: number): void {
    this.notes.update(list => list.map(n => n.id === id ? { ...n, done: !n.done } : n));
  }

  addNote(): void {
    this.notes.update(list => [
      {
        id: Date.now(), name: 'New soldier', note: 'Awaiting confirmation',
        done: false, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...list,
    ]);
  }
}