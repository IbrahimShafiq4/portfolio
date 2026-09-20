import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PreviewNavItem, PreviewShellComponent } from '../../shared/preview-shell/preview-shell';
import { NgTemplateOutlet } from '@angular/common';

interface Question {
  id: number; q: string;
  opts: { id: string; text: string; correct: boolean }[];
  category: string;
}
interface Attempt {
  id: number; student: string; score: number; total: number; date: string; passed: boolean;
}

@Component({
  selector: 'app-quiz-preview',
  standalone: true,
  imports: [PreviewShellComponent, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🎓"
      title="Quiz App"
      subtitle="Student & Instructor"
      [nav]="nav"
      [active]="active()"
    >
      @switch (active()) {
        @case ('student')    { <ng-container *ngTemplateOutlet="studentTpl" /> }
        @case ('instructor') { <ng-container *ngTemplateOutlet="instructorTpl" /> }
        @case ('results')    { <ng-container *ngTemplateOutlet="resultsTpl" /> }
      }
    </app-preview-shell>

    <ng-template #studentTpl>
      <div class="quiz-wrap">
        <div class="quiz-head">
          <div class="progress-meta">
            <span>Question {{ currentIdx() + 1 }} / {{ questions.length }}</span>
            <span class="score-pill">Score {{ score() }}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" [style.width.%]="progressPct()"></div>
          </div>
        </div>

        @if (!finished()) {
          <div class="question-card">
            <span class="category">{{ current().category }}</span>
            <h3>{{ current().q }}</h3>

            <ul class="options">
              @for (o of current().opts; track o.id) {
                <li
                  class="option"
                  [class.correct]="answered() && o.correct"
                  [class.wrong]="answered() && !o.correct && picked() === o.id"
                  [class.disabled]="answered()"
                  (click)="pick(o.id, o.correct)"
                >
                  <span class="opt-letter">{{ o.id.toUpperCase() }}</span>
                  <span class="opt-text">{{ o.text }}</span>
                  @if (answered() && o.correct) { <span class="opt-check">✓</span> }
                  @if (answered() && !o.correct && picked() === o.id) { <span class="opt-x">✕</span> }
                </li>
              }
            </ul>

            @if (answered()) {
              <div class="feedback" [class.good]="lastCorrect()" [class.bad]="!lastCorrect()">
                {{ lastCorrect() ? '✓ Correct!' : '✕ Not quite — see the right answer above' }}
              </div>
            }

            <div class="quiz-actions">
              @if (answered() && currentIdx() < questions.length - 1) {
                <button class="pill primary" (click)="next()">Next question →</button>
              }
              @if (answered() && currentIdx() === questions.length - 1) {
                <button class="pill primary" (click)="finish()">See results →</button>
              }
            </div>
          </div>
        } @else {
          <div class="done-card">
            <div class="done-icon">{{ score() >= 4 ? '🎉' : score() >= 2 ? '👍' : '📚' }}</div>
            <h3>Quiz complete!</h3>
            <p>You scored <b>{{ score() }}</b> out of {{ questions.length }}</p>
            <div class="done-stats">
              <div><b>{{ score() }}</b><small>correct</small></div>
              <div><b>{{ questions.length - score() }}</b><small>missed</small></div>
              <div><b>{{ pct() }}%</b><small>accuracy</small></div>
            </div>
            <button class="pill primary" (click)="restart()">Try again</button>
          </div>
        }
      </div>
    </ng-template>

    <ng-template #instructorTpl>
      <div class="instr">
        <header class="instr-head">
          <div>
            <h3>Your Quizzes</h3>
            <p>{{ quizzes.length }} quizzes · {{ totalAttempts }} attempts</p>
          </div>
          <button class="pill primary">＋ New Quiz</button>
        </header>

        <div class="quiz-grid">
          @for (q of quizzes; track q.id) {
            <article class="q-card">
              <header>
                <span class="q-badge" [class]="q.status">{{ q.status }}</span>
                <b>{{ q.title }}</b>
              </header>
              <p>{{ q.questions }} questions · {{ q.duration }} min</p>
              <div class="q-stats">
                <div><b>{{ q.attempts }}</b><small>attempts</small></div>
                <div><b>{{ q.avg }}%</b><small>avg score</small></div>
                <div><b>{{ q.pass }}%</b><small>pass rate</small></div>
              </div>
            </article>
          }
        </div>
      </div>
    </ng-template>

    <ng-template #resultsTpl>
      <div class="results">
        <header class="res-head">
          <h3>Recent Attempts</h3>
          <span class="mono">Live · last 24h</span>
        </header>
        <div class="res-table">
          <header class="res-row head">
            <span>Student</span>
            <span>Score</span>
            <span>Progress</span>
            <span>Date</span>
            <span>Status</span>
          </header>
          @for (a of attempts; track a.id) {
            <div class="res-row">
              <span class="student-cell">
                <span class="avatar-s">{{ a.student.charAt(0) }}</span>
                {{ a.student }}
              </span>
              <span class="mono">{{ a.score }}/{{ a.total }}</span>
              <span class="mini-prog">
                <div class="mini-track"><div class="mini-fill" [style.width.%]="(a.score/a.total)*100"></div></div>
                <span class="mono">{{ ((a.score/a.total)*100).toFixed(0) }}%</span>
              </span>
              <span class="mono small">{{ a.date }}</span>
              <span class="status" [class.pass]="a.passed" [class.fail]="!a.passed">
                {{ a.passed ? 'PASS' : 'FAIL' }}
              </span>
            </div>
          }
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .pill { padding: 9px 18px; background: var(--bg-fill-2); color: var(--label);
            border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600;
            transition: all var(--t-fast); }
    .pill:hover { background: var(--bg-fill-3); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .mono.small { font-size: var(--fs-2xs); }

    /* STUDENT */
    .quiz-wrap { max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .quiz-head { display: flex; flex-direction: column; gap: 10px; }
    .progress-meta { display: flex; justify-content: space-between; align-items: center;
                     font-size: var(--fs-xs); color: var(--label-2); font-weight: 500; }
    .score-pill { background: var(--accent-soft); color: var(--accent);
                  padding: 3px 10px; border-radius: var(--r-pill);
                  font-size: var(--fs-2xs); font-weight: 700; }
    .progress-track { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill);
                      overflow: hidden; }
    .progress-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill);
                     transition: width var(--t-slow) var(--ease-out); }

    .question-card { padding: 28px; background: var(--bg-surface-solid);
                     border: 0.5px solid var(--separator); border-radius: var(--r-lg);
                     display: flex; flex-direction: column; gap: 20px;
                     animation: qIn 320ms var(--ease-spring); }
    @keyframes qIn {
      from { opacity: 0; transform: translateY(10px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .category { font-size: var(--fs-2xs); text-transform: uppercase; letter-spacing: 0.1em;
                color: var(--accent); font-weight: 700; }
    .question-card h3 { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.015em;
                        line-height: 1.35; }

    .options { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .option {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      border: 1.5px solid transparent;
      font-size: var(--fs-sm);
      cursor: pointer;
      transition: all var(--t-base) var(--ease-spring);
    }
    .option:not(.disabled):hover { background: var(--bg-fill-3); transform: translateX(2px); }
    .option.correct { background: rgba(52, 199, 89, 0.15); border-color: #34c759; color: #34c759;
                      font-weight: 600; }
    .option.wrong { background: rgba(255, 59, 48, 0.14); border-color: #ff3b30; color: #ff3b30; }
    .option.disabled { cursor: default; }
    .opt-letter {
      width: 26px; height: 26px;
      display: grid; place-items: center;
      border-radius: 50%;
      background: var(--bg-surface-solid);
      font-size: var(--fs-xs);
      font-weight: 700;
      flex-shrink: 0;
    }
    .opt-text { flex: 1; }
    .opt-check, .opt-x { font-size: 16px; font-weight: 700; }

    .feedback {
      padding: 12px 16px;
      border-radius: var(--r-sm);
      font-size: var(--fs-sm);
      font-weight: 500;
      animation: fadeIn 240ms var(--ease-out);
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .feedback.good { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .feedback.bad { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

    .quiz-actions { display: flex; justify-content: flex-end; }

    .done-card {
      padding: 40px 28px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
      display: flex; flex-direction: column; align-items: center; gap: 14px;
      text-align: center;
      animation: qIn 400ms var(--ease-spring);
    }
    .done-icon { font-size: 60px; }
    .done-card h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .done-card p { font-size: var(--fs-sm); color: var(--label-2); }
    .done-card p b { color: var(--accent); font-weight: 800; font-size: var(--fs-md); }
    .done-stats { display: flex; gap: 32px; padding: 16px 0; margin: 6px 0; }
    .done-stats div { display: flex; flex-direction: column; gap: 2px; }
    .done-stats b { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.03em;
                    font-variant-numeric: tabular-nums; }
    .done-stats small { font-size: var(--fs-2xs); color: var(--label-3);
                        text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }

    /* INSTRUCTOR */
    .instr { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .instr-head { display: flex; justify-content: space-between; align-items: flex-end; }
    .instr-head h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .instr-head p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 4px; }

    .quiz-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
    .q-card {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      display: flex; flex-direction: column; gap: 10px;
      transition: all var(--t-base) var(--ease-spring);
    }
    .q-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .q-card header { display: flex; align-items: center; gap: 8px; }
    .q-badge { padding: 2px 8px; border-radius: var(--r-pill); font-size: 10px; font-weight: 700;
               text-transform: uppercase; letter-spacing: 0.04em; }
    .q-badge.published { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .q-badge.draft { background: var(--bg-fill-2); color: var(--label-2); }
    .q-card b { font-size: var(--fs-sm); font-weight: 700; }
    .q-card > p { font-size: var(--fs-2xs); color: var(--label-2); }
    .q-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-top: 12px;
               border-top: 0.5px solid var(--separator); }
    .q-stats div { display: flex; flex-direction: column; gap: 2px; }
    .q-stats b { font-size: var(--fs-base); font-weight: 700; font-variant-numeric: tabular-nums; }
    .q-stats small { font-size: 10px; color: var(--label-3); text-transform: uppercase;
                     letter-spacing: 0.04em; }

    /* RESULTS */
    .results { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .res-head { display: flex; justify-content: space-between; align-items: baseline; }
    .res-head h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }

    .res-table { background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
                 border-radius: var(--r-md); overflow: hidden; }
    .res-row { display: grid;
               grid-template-columns: 1.4fr 80px 1fr 130px 90px;
               gap: 16px; align-items: center;
               padding: 14px 18px;
               font-size: var(--fs-sm);
               border-top: 0.5px solid var(--separator); }
    .res-row.head { background: var(--bg-fill-2); border-top: 0;
                    font-size: var(--fs-2xs); text-transform: uppercase;
                    letter-spacing: 0.06em; color: var(--label-2); font-weight: 600; }
    .student-cell { display: flex; align-items: center; gap: 10px; font-weight: 500; }
    .avatar-s {
      width: 28px; height: 28px;
      display: grid; place-items: center;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: 50%;
      font-size: var(--fs-xs);
      font-weight: 700;
      flex-shrink: 0;
    }
    .mini-prog { display: flex; align-items: center; gap: 8px; }
    .mini-track { flex: 1; height: 5px; background: var(--bg-fill-2); border-radius: var(--r-pill);
                  overflow: hidden; }
    .mini-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill);
                 transition: width 500ms var(--ease-out); }
    .status { padding: 3px 10px; border-radius: var(--r-pill); font-size: 10px; font-weight: 700;
              text-transform: uppercase; letter-spacing: 0.04em; text-align: center; }
    .status.pass { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .status.fail { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    @media (max-width: 720px) {
      .res-row { grid-template-columns: 1fr 60px; }
      .res-row > span:nth-child(n+3) { display: none; }
    }
  `],
})
export class QuizPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'student', label: 'Student Portal', icon: '🎓' },
    { id: 'instructor', label: 'Instructor', icon: '👨‍🏫' },
    { id: 'results', label: 'Results', icon: '📊' },
  ];

  readonly active = signal('student');
  readonly currentIdx = signal(0);
  readonly picked = signal<string | null>(null);
  readonly answered = signal(false);
  readonly lastCorrect = signal(false);
  readonly score = signal(0);
  readonly finished = signal(false);

  readonly questions: Question[] = [
    {
      id: 1, category: 'ASP.NET Core',
      q: 'What does ASP.NET Core use for state and object management?',
      opts: [
        { id: 'a', text: 'Sessions only', correct: false },
        { id: 'b', text: 'Dependency Injection container', correct: true },
        { id: 'c', text: 'Global variables', correct: false },
        { id: 'd', text: 'Cookies only', correct: false },
      ]
    },
    {
      id: 2, category: 'Angular 22',
      q: 'Which decorator replaced @Injectable({providedIn: "root"}) in Angular 22?',
      opts: [
        { id: 'a', text: '@Service()', correct: true },
        { id: 'b', text: '@Singleton()', correct: false },
        { id: 'c', text: '@Shared()', correct: false },
        { id: 'd', text: '@Provider()', correct: false },
      ]
    },
    {
      id: 3, category: 'EF Core',
      q: 'How do you apply pending migrations to a database?',
      opts: [
        { id: 'a', text: 'dotnet run', correct: false },
        { id: 'b', text: 'dotnet ef database update', correct: true },
        { id: 'c', text: 'ng update', correct: false },
        { id: 'd', text: 'npm install', correct: false },
      ]
    },
    {
      id: 4, category: 'C#',
      q: 'Which keyword ensures a variable is immutable at compile time?',
      opts: [
        { id: 'a', text: 'static', correct: false },
        { id: 'b', text: 'readonly', correct: false },
        { id: 'c', text: 'const', correct: true },
        { id: 'd', text: 'sealed', correct: false },
      ]
    },
    {
      id: 5, category: 'Signals',
      q: 'Which Angular primitive creates a reactive computed value?',
      opts: [
        { id: 'a', text: 'signal()', correct: false },
        { id: 'b', text: 'computed()', correct: true },
        { id: 'c', text: 'effect()', correct: false },
        { id: 'd', text: 'input()', correct: false },
      ]
    },
  ];

  readonly current = computed(() => this.questions[this.currentIdx()]);
  readonly progressPct = computed(() =>
    ((this.currentIdx() + (this.answered() ? 1 : 0)) / this.questions.length) * 100
  );
  readonly pct = computed(() => Math.round((this.score() / this.questions.length) * 100));

  pick(id: string, correct: boolean): void {
    if (this.answered()) return;
    this.picked.set(id);
    this.answered.set(true);
    this.lastCorrect.set(correct);
    if (correct) this.score.update(s => s + 1);
  }
  next(): void {
    this.currentIdx.update(i => i + 1);
    this.picked.set(null);
    this.answered.set(false);
  }
  finish(): void { this.finished.set(true); }
  restart(): void {
    this.currentIdx.set(0);
    this.picked.set(null);
    this.answered.set(false);
    this.score.set(0);
    this.finished.set(false);
  }

  readonly quizzes = [
    { id: 1, title: 'Angular Fundamentals', status: 'published', questions: 20, duration: 30, attempts: 142, avg: 78, pass: 82 },
    { id: 2, title: 'ASP.NET Core Web API', status: 'published', questions: 25, duration: 40, attempts: 98, avg: 84, pass: 88 },
    { id: 3, title: 'EF Core Deep Dive', status: 'draft', questions: 15, duration: 20, attempts: 0, avg: 0, pass: 0 },
    { id: 4, title: 'TypeScript Advanced', status: 'published', questions: 18, duration: 25, attempts: 203, avg: 76, pass: 79 },
  ];
  readonly totalAttempts = 443;

  readonly attempts: Attempt[] = [
    { id: 1, student: 'Sara Ahmed', score: 18, total: 20, date: '10:24', passed: true },
    { id: 2, student: 'Omar Khaled', score: 15, total: 20, date: '10:12', passed: true },
    { id: 3, student: 'Layla Hassan', score: 12, total: 20, date: '09:58', passed: false },
    { id: 4, student: 'Khaled Mostafa', score: 19, total: 20, date: '09:41', passed: true },
    { id: 5, student: 'Nour Ibrahim', score: 14, total: 20, date: '09:30', passed: true },
  ];
}