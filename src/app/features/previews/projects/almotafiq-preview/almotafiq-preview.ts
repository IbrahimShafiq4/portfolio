import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PreviewNavItem, PreviewShellComponent } from '../../shared/preview-shell/preview-shell';
import { FormsModule } from '@angular/forms';

interface Course { id: number; title: string; teacher: string; lessons: number; progress: number; emoji: string; }
interface ClassRoom { id: number; name: string; students: number; subject: string; }

@Component({
  selector: 'app-almotafiq-preview',
  standalone: true,
  imports: [PreviewShellComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="📚"
      title="Al-Motafiq"
      subtitle="Learning platform"
      [nav]="nav"
      [active]="active()"
      (activeChange)="active.set($any($event))"
    >
      @if (active() === 'student') {
        <div class="student-view">
          <section class="welcome-card">
            <div class="welcome-text">
              <span class="hello">Good evening 👋</span>
              <h3>Continue learning</h3>
              <p>You're 78% through Angular Advanced. Keep going!</p>
            </div>
            <div class="progress-ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-fill-2)" stroke-width="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent)" stroke-width="8"
                        stroke-linecap="round" stroke-dasharray="264"
                        [attr.stroke-dashoffset]="264 - (264 * 0.78)"
                        transform="rotate(-90 50 50)" />
              </svg>
              <span class="ring-num">78%</span>
            </div>
          </section>

          <section class="courses">
            <h4>My Courses</h4>
            <div class="course-grid">
              @for (c of courses; track c.id) {
                <article class="course-card">
                  <div class="course-img">{{ c.emoji }}</div>
                  <div class="course-body">
                    <b>{{ c.title }}</b>
                    <small>👨‍🏫 {{ c.teacher }}</small>
                    <div class="course-progress">
                      <div class="cp-bar"><div class="cp-fill" [style.width.%]="c.progress"></div></div>
                      <span class="mono">{{ c.progress }}%</span>
                    </div>
                    <div class="course-foot">
                      <span>📚 {{ c.lessons }} lessons</span>
                      <button class="resume-btn">Resume →</button>
                    </div>
                  </div>
                </article>
              }
            </div>
          </section>

          <section class="upcoming">
            <h4>Upcoming Live Classes</h4>
            @for (u of upcoming; track u.id) {
              <div class="up-row">
                <div class="up-time">
                  <b>{{ u.time }}</b>
                  <small>{{ u.day }}</small>
                </div>
                <div class="up-info">
                  <b>{{ u.title }}</b>
                  <small>👨‍🏫 {{ u.teacher }}</small>
                </div>
                <span class="up-badge" [class.live]="u.live">{{ u.live ? '● LIVE' : u.when }}</span>
                <button class="up-join" [class.live]="u.live">{{ u.live ? 'Join now' : 'Remind me' }}</button>
              </div>
            }
          </section>
        </div>
      } @else if (active() === 'classroom') {
        <div class="classroom-view">
          <header class="cr-head">
            <div>
              <span class="eyebrow">Live session</span>
              <h3>{{ currentClass().name }}</h3>
              <p>{{ currentClass().subject }} · {{ currentClass().students }} students</p>
            </div>
            <button class="pill primary" (click)="endClass()">End session</button>
          </header>

          <div class="cr-grid">
            <section class="video-panel">
              <div class="main-video">
                <div class="mv-avatar">👨‍🏫</div>
                <div class="mv-overlay">
                  <span class="live-tag">● LIVE</span>
                  <span class="mv-name">Mr. Ahmed Ali</span>
                </div>
                <div class="mv-controls">
                  <button class="ctrl" [class.muted]="muted()" (click)="muted.set(!muted())">{{ muted() ? '🔇' : '🎙' }}</button>
                  <button class="ctrl">📹</button>
                  <button class="ctrl">🖥</button>
                  <button class="ctrl danger">✕</button>
                </div>
              </div>
              <div class="students-strip">
                @for (s of studentsInClass; track s.id) {
                  <div class="student-tile" [class.hand]="s.handRaised">
                    <span class="st-avatar">{{ s.emoji }}</span>
                    <span class="st-name">{{ s.name }}</span>
                    @if (s.handRaised) { <span class="hand-badge">✋</span> }
                  </div>
                }
              </div>
            </section>

            <aside class="side-panel">
              <div class="tabs-mini">
                @for (t of ['Chat', 'Participants', 'Materials']; track t) {
                  <button class="tm" [class.active]="crTab() === t" (click)="crTab.set(t)">{{ t }}</button>
                }
              </div>

              @if (crTab() === 'Chat') {
                <div class="chat-body">
                  @for (m of messages(); track m.id) {
                    <div class="chat-msg">
                      <b>{{ m.who }}</b>
                      <span>{{ m.text }}</span>
                    </div>
                  }
                </div>
                <div class="chat-input">
                  <input placeholder="Type…" [(ngModel)]="draft" (keydown.enter)="send()" />
                  <button class="send-btn" (click)="send()">↵</button>
                </div>
              } @else if (crTab() === 'Participants') {
                <ul class="part-list">
                  @for (s of studentsInClass; track s.id) {
                    <li class="part-row">
                      <span class="pt-av">{{ s.emoji }}</span>
                      <span>{{ s.name }}</span>
                      @if (s.handRaised) { <span class="hand-badge">✋</span> }
                      <span class="dot-on"></span>
                    </li>
                  }
                </ul>
              } @else {
                <ul class="materials-list">
                  @for (m of materials; track m.id) {
                    <li class="mat-row">
                      <span class="mat-icon">{{ m.icon }}</span>
                      <div>
                        <b>{{ m.name }}</b>
                        <small>{{ m.size }}</small>
                      </div>
                      <button class="dl-btn">⬇</button>
                    </li>
                  }
                </ul>
              }
            </aside>
          </div>
        </div>
      } @else {
        <div class="teacher-view">
          <h3>Teacher Dashboard</h3>
          <div class="kpis">
            <div class="kpi"><span>Active students</span><b>142</b></div>
            <div class="kpi"><span>Classes today</span><b>4</b></div>
            <div class="kpi"><span>Avg engagement</span><b>87%</b></div>
            <div class="kpi"><span>Hours taught</span><b>28h</b></div>
          </div>
          <section class="class-list">
            <h4>Today's Classes</h4>
            @for (c of todayClasses; track c.id) {
              <div class="class-row">
                <div class="cr-time">{{ c.time }}</div>
                <div class="cr-info">
                  <b>{{ c.title }}</b>
                  <small>{{ c.students }} students · {{ c.duration }}</small>
                </div>
                <span class="cr-status" [class.live]="c.live">{{ c.live ? '● LIVE' : c.status }}</span>
                <button class="cr-start">{{ c.live ? 'Join' : 'Start' }}</button>
              </div>
            }
          </section>
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
    .eyebrow { display: block; font-size: var(--fs-2xs); font-weight: 700;
               text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent);
               margin-bottom: 4px; }

    /* STUDENT */
    .student-view { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
    .welcome-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      padding: 28px 32px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
      flex-wrap: wrap;
    }
    .hello { font-size: var(--fs-2xs); font-weight: 700; text-transform: uppercase;
             letter-spacing: 0.1em; color: var(--accent); }
    .welcome-text h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em;
                       margin: 6px 0 4px; }
    .welcome-text p { font-size: var(--fs-sm); color: var(--label-2); }
    .progress-ring { position: relative; width: 100px; height: 100px; }
    .progress-ring svg { width: 100%; height: 100%; }
    .ring-num {
      position: absolute; inset: 0;
      display: grid; place-items: center;
      font-size: var(--fs-lg); font-weight: 800;
      font-variant-numeric: tabular-nums;
    }

    .courses h4 { font-size: var(--fs-base); font-weight: 700; margin-bottom: 14px; }
    .course-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
    .course-card {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
      transition: all var(--t-base) var(--ease-spring);
    }
    .course-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .course-img {
      height: 100px;
      background: var(--bg-fill-2);
      display: grid; place-items: center;
      font-size: 48px;
    }
    .course-body { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .course-body b { font-size: var(--fs-sm); font-weight: 700; }
    .course-body small { font-size: var(--fs-2xs); color: var(--label-2); }
    .course-progress { display: flex; align-items: center; gap: 8px; }
    .cp-bar { flex: 1; height: 5px; background: var(--bg-fill-2); border-radius: var(--r-pill);
              overflow: hidden; }
    .cp-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill);
               transition: width 500ms var(--ease-out); }
    .course-progress .mono { font-size: var(--fs-2xs); color: var(--label-2); }
    .course-foot { display: flex; justify-content: space-between; align-items: center;
                   padding-top: 6px; font-size: var(--fs-2xs); color: var(--label-2); }
    .resume-btn { color: var(--accent); font-weight: 700; font-size: var(--fs-2xs); }

    .upcoming h4 { font-size: var(--fs-base); font-weight: 700; margin-bottom: 14px; }
    .up-row {
      display: grid;
      grid-template-columns: 80px 1fr auto auto;
      gap: 16px;
      align-items: center;
      padding: 14px 18px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      margin-bottom: 8px;
    }
    .up-time { text-align: center; }
    .up-time b { display: block; font-size: var(--fs-base); font-weight: 800;
                 font-variant-numeric: tabular-nums; }
    .up-time small { font-size: var(--fs-2xs); color: var(--label-2); }
    .up-info b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .up-info small { font-size: var(--fs-2xs); color: var(--label-2); }
    .up-badge {
      padding: 4px 10px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
      color: var(--label-2);
    }
    .up-badge.live { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .up-join {
      padding: 7px 14px;
      background: var(--bg-fill-2);
      color: var(--label);
      border-radius: var(--r-pill);
      font-size: var(--fs-xs);
      font-weight: 600;
    }
    .up-join.live { background: var(--accent); color: var(--accent-contrast); }

    /* CLASSROOM */
    .classroom-view { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .cr-head { display: flex; justify-content: space-between; align-items: flex-end; }
    .cr-head h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .cr-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }
    .cr-grid { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
    @media (max-width: 960px) { .cr-grid { grid-template-columns: 1fr; } }

    .main-video {
      position: relative;
      aspect-ratio: 16 / 9;
      background: #000;
      border-radius: var(--r-md);
      overflow: hidden;
      display: grid; place-items: center;
    }
    .mv-avatar { font-size: 96px; }
    .mv-overlay {
      position: absolute; top: 14px; left: 14px; right: 14px;
      display: flex; justify-content: space-between;
    }
    .live-tag {
      background: #ff3b30;
      color: #fff;
      padding: 4px 10px;
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      animation: pulseLive 1.6s infinite;
    }
    @keyframes pulseLive { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
    .mv-name {
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(10px);
      color: #fff;
      padding: 4px 12px;
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-weight: 600;
    }
    .mv-controls {
      position: absolute;
      bottom: 14px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 8px;
    }
    .ctrl {
      width: 40px; height: 40px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      color: #fff;
      border-radius: 50%;
      font-size: 16px;
      transition: all var(--t-fast);
    }
    .ctrl:hover { background: rgba(255, 255, 255, 0.25); }
    .ctrl.muted { background: rgba(255, 59, 48, 0.8); }
    .ctrl.danger { background: #ff3b30; }
    .ctrl.danger:hover { background: #d70015; }

    .students-strip {
      display: flex;
      gap: 8px;
      padding: 12px;
      overflow-x: auto;
      background: var(--bg-surface-solid);
      border-radius: var(--r-md);
      border: 0.5px solid var(--separator);
      margin-top: 12px;
    }
    .student-tile {
      flex-shrink: 0;
      width: 100px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      position: relative;
    }
    .student-tile.hand { box-shadow: 0 0 0 2px #ff9500; }
    .st-avatar { font-size: 24px; }
    .st-name { font-size: 10px; font-weight: 600; color: var(--label); text-align: center; }
    .hand-badge {
      position: absolute;
      top: 4px; right: 4px;
      font-size: 12px;
      animation: wave 1s infinite;
    }
    @keyframes wave { 0%,100% { transform: rotate(0); } 50% { transform: rotate(15deg); } }

    .side-panel {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      display: flex;
      flex-direction: column;
      max-height: 560px;
      overflow: hidden;
    }
    .tabs-mini { display: flex; padding: 10px 12px 0; gap: 4px; border-bottom: 0.5px solid var(--separator); }
    .tm {
      padding: 8px 12px;
      font-size: var(--fs-2xs);
      font-weight: 600;
      color: var(--label-2);
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: all var(--t-fast);
    }
    .tm.active { color: var(--accent); border-bottom-color: var(--accent); }

    .chat-body { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column;
                 gap: 8px; }
    .chat-msg { display: flex; gap: 6px; font-size: var(--fs-xs); line-height: 1.4; }
    .chat-msg b { color: var(--accent); flex-shrink: 0; }
    .chat-input { display: flex; gap: 6px; padding: 10px; border-top: 0.5px solid var(--separator); }
    .chat-input input { flex: 1; background: var(--bg-input); border: 0; border-radius: var(--r-pill);
                        padding: 8px 14px; font-size: var(--fs-xs); outline: none; }
    .send-btn { width: 32px; height: 32px; background: var(--accent); color: var(--accent-contrast);
                border-radius: 50%; font-size: 14px; font-weight: 700; }

    .part-list, .materials-list { list-style: none; padding: 12px; overflow-y: auto; }
    .part-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 6px;
      font-size: var(--fs-xs);
    }
    .pt-av { font-size: 20px; }
    .part-row > span:nth-child(2) { flex: 1; }
    .dot-on { width: 6px; height: 6px; border-radius: 50%; background: #34c759; }

    .mat-row {
      display: grid;
      grid-template-columns: 32px 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 10px 6px;
      font-size: var(--fs-xs);
    }
    .mat-icon { font-size: 20px; }
    .mat-row b { font-weight: 600; display: block; }
    .mat-row small { font-size: var(--fs-2xs); color: var(--label-2); }
    .dl-btn { width: 26px; height: 26px; border-radius: var(--r-xs);
              background: var(--bg-fill-2); color: var(--label); font-weight: 700; }
    .dl-btn:hover { background: var(--accent-soft); color: var(--accent); }

    /* TEACHER */
    .teacher-view { max-width: 1000px; margin: 0 auto; }
    .teacher-view h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 20px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    @media (max-width: 780px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
    .kpi { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
           border-radius: var(--r-md); }
    .kpi span { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase;
                letter-spacing: 0.06em; font-weight: 600; }
    .kpi b { display: block; font-size: var(--fs-2xl); font-weight: 800;
             letter-spacing: -0.03em; margin-top: 4px; font-variant-numeric: tabular-nums; }

    .class-list { background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
                  border-radius: var(--r-md); padding: 20px; }
    .class-list h4 { font-size: var(--fs-sm); font-weight: 700; margin-bottom: 14px; }
    .class-row { display: grid; grid-template-columns: 80px 1fr auto auto; gap: 16px;
                 align-items: center; padding: 12px 0;
                 border-bottom: 0.5px solid var(--separator); font-size: var(--fs-xs); }
    .class-row:last-child { border-bottom: 0; }
    .cr-time { font-size: var(--fs-base); font-weight: 800; color: var(--label);
               font-variant-numeric: tabular-nums; }
    .cr-info b { font-weight: 600; display: block; }
    .cr-info small { font-size: var(--fs-2xs); color: var(--label-2); }
    .cr-status { padding: 3px 10px; border-radius: var(--r-pill); font-size: 10px;
                 font-weight: 700; background: var(--bg-fill-2); color: var(--label-2);
                 text-transform: uppercase; letter-spacing: 0.04em; }
    .cr-status.live { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .cr-start { padding: 6px 14px; background: var(--accent); color: var(--accent-contrast);
                border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 700; }
  `],
})
export class AlMotafiqPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'student', label: 'Student', icon: '🎓' },
    { id: 'classroom', label: 'Live Class', icon: '📡' },
    { id: 'teacher', label: 'Teacher', icon: '👨‍🏫' },
  ];
  readonly active = signal('student');

  readonly courses: Course[] = [
    { id: 1, title: 'Angular Advanced', teacher: 'Mr. Ahmed', lessons: 24, progress: 78, emoji: '🅰️' },
    { id: 2, title: 'TypeScript Deep Dive', teacher: 'Ms. Sara', lessons: 18, progress: 45, emoji: '📘' },
    { id: 3, title: 'RxJS Mastery', teacher: 'Mr. Khaled', lessons: 16, progress: 92, emoji: '⚡' },
  ];

  readonly upcoming = [
    { id: 1, time: '7:00 PM', day: 'Today', title: 'Angular Signals Workshop', teacher: 'Mr. Ahmed', live: true, when: 'Soon' },
    { id: 2, time: '9:00 AM', day: 'Tomorrow', title: 'TypeScript Generics', teacher: 'Ms. Sara', live: false, when: 'Tomorrow' },
  ];

  readonly currentClass = signal<ClassRoom>({ id: 1, name: 'Angular Signals Deep Dive', students: 24, subject: 'Frontend Architecture' });

  readonly muted = signal(false);
  readonly crTab = signal('Chat');
  draft = '';

  readonly studentsInClass = [
    { id: 1, name: 'Sara A.', emoji: '👧', handRaised: false },
    { id: 2, name: 'Omar K.', emoji: '👦', handRaised: true },
    { id: 3, name: 'Layla H.', emoji: '👧', handRaised: false },
    { id: 4, name: 'Khaled M.', emoji: '👦', handRaised: false },
    { id: 5, name: 'Nour I.', emoji: '👧', handRaised: false },
  ];

  readonly messages = signal([
    { id: 1, who: 'Sara', text: 'Can you explain signals vs observables?' },
    { id: 2, who: 'Mr. Ahmed', text: 'Great question! Signals are synchronous, observables are async streams.' },
    { id: 3, who: 'Omar', text: 'This is so much cleaner than the old approach 🔥' },
  ]);

  readonly materials = [
    { id: 1, icon: '📄', name: 'Slides — Signals Deep Dive', size: '2.4 MB' },
    { id: 2, icon: '💻', name: 'Starter Code', size: '340 KB' },
    { id: 3, icon: '🎥', name: 'Recording (previous class)', size: '482 MB' },
  ];

  send(): void {
    if (!this.draft.trim()) return;
    this.messages.update(m => [...m, { id: Date.now(), who: 'You', text: this.draft.trim() }]);
    this.draft = '';
  }

  endClass(): void {
    this.active.set('teacher');
  }

  readonly todayClasses = [
    { id: 1, time: '5:00 PM', title: 'Angular Signals Deep Dive', students: 24, duration: '90 min', live: true, status: '' },
    { id: 2, time: '7:30 PM', title: 'TypeScript Generics', students: 18, duration: '60 min', live: false, status: 'Soon' },
    { id: 3, time: '9:00 PM', title: 'RxJS Advanced Patterns', students: 12, duration: '75 min', live: false, status: 'Scheduled' },
  ];
}