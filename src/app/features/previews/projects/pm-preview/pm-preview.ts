import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PreviewNavItem, PreviewShellComponent } from '../../shared/preview-shell/preview-shell';

interface Card { id: number; title: string; tag: string; assignee: string; priority: 'high' | 'mid' | 'low'; listId: string; }
interface List { id: string; title: string; icon: string; }

@Component({
  selector: 'app-pm-preview',
  standalone: true,
  imports: [PreviewShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="📋"
      title="FlowBoard"
      subtitle="Project management"
      [nav]="nav"
      [active]="active()"
    >
      <div actions class="board-actions">
        <span class="member-stack">
          @for (m of members; track m.id) {
            <span class="member-avatar" [style.background]="m.color" [title]="m.name">{{ m.name.charAt(0) }}</span>
          }
        </span>
        <button class="pill primary" (click)="addCard()">＋ Add Card</button>
      </div>

      @if (active() === 'board') {
        <div class="board">
          @for (list of lists; track list.id) {
            <section class="column" (dragover)="onDragOver($event)" (drop)="onDrop(list.id)">
              <header class="col-head">
                <span class="col-icon">{{ list.icon }}</span>
                <span class="col-title">{{ list.title }}</span>
                <span class="col-count">{{ cardsOf(list.id).length }}</span>
                <button class="col-menu">⋯</button>
              </header>
              <div class="col-cards">
                @for (c of cardsOf(list.id); track c.id) {
                  <article
                    class="task-card"
                    draggable="true"
                    (dragstart)="onDragStart(c.id)"
                    (dblclick)="deleteCard(c.id)"
                    [attr.data-p]="c.priority"
                  >
                    <div class="card-tag">{{ c.tag }}</div>
                    <p class="card-title">{{ c.title }}</p>
                    <footer class="card-foot">
                      <span class="assignee" [title]="c.assignee">{{ c.assignee.charAt(0) }}</span>
                      <span class="pri-dot" [attr.data-p]="c.priority"></span>
                    </footer>
                  </article>
                }
                @if (cardsOf(list.id).length === 0) {
                  <div class="empty-col">Drop cards here</div>
                }
              </div>
            </section>
          }
        </div>
        <p class="hint">💡 Drag cards between columns · Double-click to delete</p>
      } @else if (active() === 'timeline') {
        <div class="timeline-view">
          <header class="tl-head">
            <h3>Sprint Timeline</h3>
            <span class="mono">Sprint 12 · Dec 2 – Dec 15</span>
          </header>
          <div class="tl-grid">
            @for (t of timeline; track t.id) {
              <div class="tl-item">
                <div class="tl-info">
                  <b>{{ t.title }}</b>
                  <small>{{ t.assignee }}</small>
                </div>
                <div class="tl-track">
                  <div class="tl-bar" [style.--start]="t.start" [style.--len]="t.len" [attr.data-p]="t.priority"></div>
                </div>
                <span class="tl-status">{{ t.status }}</span>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="team-view">
          <h3>Team</h3>
          <div class="member-grid">
            @for (m of members; track m.id) {
              <article class="member-card">
                <div class="member-photo" [style.background]="m.color">{{ m.name.charAt(0) }}</div>
                <b>{{ m.name }}</b>
                <small>{{ m.role }}</small>
                <div class="member-stats">
                  <span><b>{{ m.tasks }}</b> tasks</span>
                  <span><b>{{ m.done }}</b> done</span>
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
    .pill { padding: 7px 14px; background: var(--bg-fill-2); color: var(--label);
            border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600;
            transition: all var(--t-fast); }
    .pill:hover { background: var(--bg-fill-3); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }
    .mono { font-family: var(--sf-mono); font-size: var(--fs-xs); color: var(--label-2); }

    .board-actions { display: flex; align-items: center; gap: 12px; }
    .member-stack { display: flex; }
    .member-avatar {
      width: 28px; height: 28px;
      border-radius: 50%;
      display: grid; place-items: center;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      border: 2px solid var(--bg-chrome);
      margin-left: -8px;
      transition: transform var(--t-fast) var(--ease-spring);
    }
    .member-avatar:first-child { margin-left: 0; }
    .member-avatar:hover { transform: translateY(-2px) scale(1.1); z-index: 2; position: relative; }

    /* BOARD */
    .board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding: 8px 0;
      min-height: 100%;
    }
    @media (max-width: 900px) {
      .board { grid-template-columns: 1fr; }
    }

    .column {
      background: var(--bg-fill-2);
      border-radius: var(--r-md);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 200px;
    }
    .col-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 6px;
    }
    .col-icon { font-size: 14px; }
    .col-title { font-size: var(--fs-xs); font-weight: 700; flex: 1; }
    .col-count {
      background: var(--bg-surface-solid);
      padding: 1px 8px;
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
      color: var(--label-2);
      font-variant-numeric: tabular-nums;
    }
    .col-menu {
      width: 22px; height: 22px;
      border-radius: var(--r-xs);
      color: var(--label-3);
      font-size: 14px;
      display: grid; place-items: center;
    }
    .col-menu:hover { background: var(--bg-fill-2); color: var(--label); }

    .col-cards { display: flex; flex-direction: column; gap: 8px; min-height: 60px; }

    .task-card {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-sm);
      padding: 12px;
      cursor: grab;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all var(--t-base) var(--ease-spring);
      animation: cardIn 260ms var(--ease-out);
      position: relative;
    }
    .task-card::before {
      content: '';
      position: absolute;
      left: 0; top: 8px; bottom: 8px;
      width: 3px;
      border-radius: 0 3px 3px 0;
    }
    .task-card[data-p='high']::before { background: #ff3b30; }
    .task-card[data-p='mid']::before  { background: #ff9500; }
    .task-card[data-p='low']::before  { background: #34c759; }
    .task-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--accent);
    }
    .task-card:active { cursor: grabbing; }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(-6px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .card-tag {
      font-size: 10px;
      font-weight: 700;
      color: var(--label-3);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .card-title {
      font-size: var(--fs-sm);
      font-weight: 500;
      line-height: 1.4;
      color: var(--label);
    }
    .card-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 4px;
    }
    .assignee {
      width: 22px; height: 22px;
      display: grid; place-items: center;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: 50%;
      font-size: 10px;
      font-weight: 700;
    }
    .pri-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
    }
    .pri-dot[data-p='high'] { background: #ff3b30; }
    .pri-dot[data-p='mid']  { background: #ff9500; }
    .pri-dot[data-p='low']  { background: #34c759; }

    .empty-col {
      padding: 20px;
      text-align: center;
      color: var(--label-3);
      font-size: var(--fs-2xs);
      border: 1.5px dashed var(--separator);
      border-radius: var(--r-sm);
      font-style: italic;
    }

    .hint {
      text-align: center;
      font-size: var(--fs-2xs);
      color: var(--label-3);
      padding: 16px 0;
    }

    /* TIMELINE */
    .timeline-view { max-width: 1000px; margin: 0 auto; }
    .tl-head { display: flex; justify-content: space-between; align-items: baseline;
               margin-bottom: 20px; }
    .tl-head h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .tl-grid { display: flex; flex-direction: column; gap: 12px; }
    .tl-item {
      display: grid;
      grid-template-columns: 200px 1fr 100px;
      gap: 16px;
      align-items: center;
      padding: 14px 16px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-sm);
    }
    .tl-info b { font-size: var(--fs-sm); font-weight: 600; display: block; }
    .tl-info small { font-size: var(--fs-2xs); color: var(--label-2); }
    .tl-track {
      position: relative;
      height: 22px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      overflow: hidden;
    }
    .tl-bar {
      position: absolute;
      top: 3px; bottom: 3px;
      left: calc(var(--start) * 1%);
      width: calc(var(--len) * 1%);
      border-radius: var(--r-pill);
      transition: transform var(--t-base) var(--ease-spring);
    }
    .tl-bar[data-p='high'] { background: #ff3b30; }
    .tl-bar[data-p='mid']  { background: #ff9500; }
    .tl-bar[data-p='low']  { background: #34c759; }
    .tl-bar:hover { transform: scaleY(1.15); }
    .tl-status { font-size: var(--fs-2xs); font-weight: 600; color: var(--label-2); text-align: right; }

    /* TEAM */
    .team-view { max-width: 1000px; margin: 0 auto; }
    .team-view h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em;
                    margin-bottom: 20px; }
    .member-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
    .member-card {
      padding: 22px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      transition: all var(--t-base) var(--ease-spring);
    }
    .member-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .member-photo {
      width: 56px; height: 56px;
      border-radius: 50%;
      display: grid; place-items: center;
      color: #fff;
      font-size: 20px;
      font-weight: 800;
    }
    .member-card b { font-size: var(--fs-sm); font-weight: 700; }
    .member-card small { font-size: var(--fs-2xs); color: var(--label-2); }
    .member-stats {
      display: flex; gap: 12px;
      padding-top: 10px; margin-top: 6px;
      border-top: 0.5px solid var(--separator);
      width: 100%;
      justify-content: center;
      font-size: var(--fs-2xs);
      color: var(--label-2);
    }
    .member-stats b { color: var(--label); font-weight: 700; }
  `],
})
export class PmPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'board', label: 'Board', icon: '📋' },
    { id: 'timeline', label: 'Timeline', icon: '⏱️' },
    { id: 'team', label: 'Team', icon: '👥' },
  ];

  readonly active = signal('board');
  private draggingId = signal<number | null>(null);

  readonly lists: List[] = [
    { id: 'todo', title: 'To Do', icon: '📝' },
    { id: 'doing', title: 'In Progress', icon: '⚙️' },
    { id: 'done', title: 'Done', icon: '✅' },
  ];

  readonly cards = signal<Card[]>([
    { id: 1, title: 'Design database schema for user service', tag: 'backend', assignee: 'Sara', priority: 'high', listId: 'todo' },
    { id: 2, title: 'Implement JWT authentication flow', tag: 'auth', assignee: 'Omar', priority: 'high', listId: 'todo' },
    { id: 3, title: 'Set up SignalR hub for real-time updates', tag: 'realtime', assignee: 'Khaled', priority: 'mid', listId: 'doing' },
    { id: 4, title: 'Write unit tests for auth service', tag: 'testing', assignee: 'Layla', priority: 'mid', listId: 'doing' },
    { id: 5, title: 'Configure CI/CD pipeline', tag: 'devops', assignee: 'Nour', priority: 'low', listId: 'done' },
    { id: 6, title: 'Project scaffolding & folder structure', tag: 'setup', assignee: 'Sara', priority: 'low', listId: 'done' },
  ]);

  cardsOf(listId: string): Card[] {
    return this.cards().filter(c => c.listId === listId);
  }

  onDragStart(id: number): void { this.draggingId.set(id); }
  onDragOver(ev: DragEvent): void { ev.preventDefault(); }
  onDrop(listId: string): void {
    const id = this.draggingId();
    if (!id) return;
    this.cards.update(list => list.map(c => c.id === id ? { ...c, listId } : c));
    this.draggingId.set(null);
  }
  deleteCard(id: number): void {
    this.cards.update(list => list.filter(c => c.id !== id));
  }
  addCard(): void {
    const tags = ['feature', 'bug', 'chore', 'docs'];
    const priorities: Card['priority'][] = ['low', 'mid', 'high'];
    this.cards.update(list => [
      ...list,
      {
        id: Date.now(),
        title: 'New task — drag me around',
        tag: tags[Math.floor(Math.random() * tags.length)],
        assignee: 'You',
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        listId: 'todo',
      },
    ]);
  }

  readonly members = [
    { id: 1, name: 'Sara', role: 'Tech Lead', color: '#af52de', tasks: 12, done: 8 },
    { id: 2, name: 'Omar', role: 'Backend Dev', color: '#ff9500', tasks: 15, done: 11 },
    { id: 3, name: 'Layla', role: 'QA Engineer', color: '#ff2d55', tasks: 9, done: 6 },
    { id: 4, name: 'Khaled', role: 'Frontend Dev', color: '#34c759', tasks: 14, done: 10 },
    { id: 5, name: 'Nour', role: 'DevOps', color: '#007aff', tasks: 7, done: 5 },
  ];

  readonly timeline = [
    { id: 1, title: 'Auth module', assignee: 'Omar', start: 5, len: 30, priority: 'high', status: 'In Progress' },
    { id: 2, title: 'Database layer', assignee: 'Sara', start: 0, len: 25, priority: 'high', status: 'Done' },
    { id: 3, title: 'API endpoints', assignee: 'Khaled', start: 30, len: 35, priority: 'mid', status: 'Planned' },
    { id: 4, title: 'Frontend shell', assignee: 'Khaled', start: 20, len: 40, priority: 'mid', status: 'In Progress' },
    { id: 5, title: 'Testing suite', assignee: 'Layla', start: 50, len: 30, priority: 'low', status: 'Planned' },
  ];
}