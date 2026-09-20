import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PreviewNavItem, PreviewShellComponent } from '../../shared/preview-shell/preview-shell';

interface Job {
  id: number; title: string; company: string; location: string;
  salary: string; type: 'full' | 'part' | 'remote'; posted: string;
  tags: string[]; applicants: number; logo: string;
}

@Component({
  selector: 'app-afkar-preview',
  standalone: true,
  imports: [PreviewShellComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="💼"
      title="Afkar"
      subtitle="Job platform"
      [nav]="nav"
      [active]="active()"
    >
      @if (active() === 'jobs') {
        <div class="jobs">
          <aside class="filters">
            <section class="f-section">
              <h5>Job type</h5>
              @for (t of types; track t.id) {
                <label class="f-check">
                  <input type="checkbox" [checked]="typeFilter().includes(t.id)" (change)="toggleType(t.id)" />
                  <span>{{ t.label }}</span>
                </label>
              }
            </section>
            <section class="f-section">
              <h5>Salary range</h5>
              <div class="f-range">
                <input type="range" min="0" max="10" [value]="salaryMin()" (input)="salaryMin.set(+$any($event.target).value)" />
                <div class="range-labels">
                  <span>$ {{ salaryMin() }}k</span>
                  <span>$ {{ salaryMin() + 20 }}k+</span>
                </div>
              </div>
            </section>
            <section class="f-section">
              <h5>Location</h5>
              @for (l of locations; track l) {
                <label class="f-check">
                  <input type="radio" name="loc" [checked]="locationFilter() === l" (change)="locationFilter.set(l)" />
                  <span>{{ l }}</span>
                </label>
              }
            </section>
          </aside>

          <div class="job-list">
            <header class="jl-head">
              <div class="search">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                  <circle cx="9" cy="9" r="6" /><path d="m17 17-3.5-3.5" />
                </svg>
                <input placeholder="Search jobs, companies…" [value]="query()" (input)="query.set($any($event.target).value)" />
              </div>
              <div class="sort">
                <span>{{ filtered().length }} jobs</span>
              </div>
            </header>

            @for (j of filtered(); track j.id) {
              <article class="job-card" [class.applied]="applied().includes(j.id)">
                <div class="jc-logo">{{ j.logo }}</div>
                <div class="jc-body">
                  <div class="jc-top">
                    <div>
                      <h4>{{ j.title }}</h4>
                      <p class="jc-company">{{ j.company }} · {{ j.location }}</p>
                    </div>
                    <span class="jc-type" [attr.data-t]="j.type">{{ typeLabel(j.type) }}</span>
                  </div>
                  <div class="jc-tags">
                    @for (t of j.tags; track t) { <span class="tag">{{ t }}</span> }
                  </div>
                  <div class="jc-foot">
                    <span class="jc-salary">{{ j.salary }}</span>
                    <span class="jc-applicants">👥 {{ j.applicants }} applicants</span>
                    <span class="jc-posted">{{ j.posted }}</span>
                    <button class="apply-btn" (click)="apply(j.id)">
                      {{ applied().includes(j.id) ? '✓ Applied' : 'Apply Now' }}
                    </button>
                  </div>
                </div>
              </article>
            } @empty {
              <div class="empty">
                <span>🔍</span>
                <b>No jobs match</b>
                <small>Try clearing filters</small>
              </div>
            }
          </div>
        </div>
      } @else if (active() === 'post') {
        <div class="post-job">
          <h3>Post a new job</h3>
          <p>Fill the details below and reach hundreds of developers.</p>
          <div class="form">
            <label class="field">
              <span>Job title</span>
              <input value="Senior Angular Developer" />
            </label>
            <div class="row">
              <label class="field">
                <span>Company</span>
                <input value="TechCorp" />
              </label>
              <label class="field">
                <span>Location</span>
                <input value="Cairo, EG" />
              </label>
            </div>
            <label class="field">
              <span>Description</span>
              <textarea>We are looking for a Senior Angular Developer to build...</textarea>
            </label>
            <div class="form-actions">
              <button class="pill">Cancel</button>
              <button class="pill primary">Publish job</button>
            </div>
          </div>
        </div>
      } @else {
        <div class="my-apps">
          <h3>My Applications</h3>
          <div class="apps-grid">
            @for (a of applications; track a.id) {
              <article class="app-card">
                <div class="ac-head">
                  <span class="ac-logo">{{ a.logo }}</span>
                  <div>
                    <b>{{ a.title }}</b>
                    <small>{{ a.company }}</small>
                  </div>
                  <span class="status" [class]="a.status">{{ statusLabel(a.status) }}</span>
                </div>
                <div class="ac-progress">
                  @for (s of stages; track s.id) {
                    <div class="stage" [class.done]="stages.indexOf(s) <= stages.findIndex(x => x.id === a.stage)">
                      <span class="stage-dot"></span>
                      <span class="stage-label">{{ s.label }}</span>
                    </div>
                  }
                </div>
                <small class="ac-date">Applied {{ a.date }}</small>
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

    /* JOBS */
    .jobs { display: grid; grid-template-columns: 240px 1fr; gap: 20px; max-width: 1080px; margin: 0 auto; }
    @media (max-width: 820px) { .jobs { grid-template-columns: 1fr; } .filters { display: none; } }

    .filters { display: flex; flex-direction: column; gap: 20px; padding-right: 20px;
               border-right: 0.5px solid var(--separator); }
    .f-section { display: flex; flex-direction: column; gap: 8px; }
    .f-section h5 { font-size: var(--fs-2xs); font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.08em; color: var(--label-3); }
    .f-check {
      display: flex; align-items: center; gap: 8px;
      font-size: var(--fs-xs);
      color: var(--label);
      cursor: pointer;
      padding: 4px 0;
    }
    .f-check input { accent-color: var(--accent); cursor: pointer; }
    .f-range { display: flex; flex-direction: column; gap: 6px; }
    .f-range input { width: 100%; accent-color: var(--accent); cursor: pointer; }
    .range-labels { display: flex; justify-content: space-between; font-size: var(--fs-2xs);
                    color: var(--label-2); font-variant-numeric: tabular-nums; }

    .job-list { display: flex; flex-direction: column; gap: 12px; }
    .jl-head { display: flex; justify-content: space-between; align-items: center; gap: 12px;
               padding: 8px 0; }
    .search {
      flex: 1; display: flex; align-items: center; gap: 8px;
      background: var(--bg-input);
      border-radius: var(--r-pill);
      padding: 8px 14px;
    }
    .search svg { width: 15px; height: 15px; color: var(--label-3); }
    .search input { flex: 1; background: transparent; border: 0; outline: none;
                    font-size: var(--fs-sm); color: var(--label); }
    .sort { font-size: var(--fs-xs); color: var(--label-2); font-weight: 500; }

    .job-card {
      display: grid;
      grid-template-columns: 48px 1fr;
      gap: 14px;
      padding: 18px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      transition: all var(--t-base) var(--ease-spring);
      animation: cardIn 280ms var(--ease-out);
    }
    @keyframes cardIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    .job-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--accent); }
    .job-card.applied { opacity: 0.85; }

    .jc-logo {
      width: 48px; height: 48px;
      display: grid; place-items: center;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      font-size: 24px;
    }
    .jc-body { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
    .jc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .jc-top h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .jc-company { font-size: var(--fs-2xs); color: var(--label-2); margin-top: 3px; }
    .jc-type {
      padding: 3px 10px; border-radius: var(--r-pill);
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.04em;
      flex-shrink: 0;
    }
    .jc-type[data-t='full']   { background: var(--accent-soft); color: var(--accent); }
    .jc-type[data-t='remote'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .jc-type[data-t='part']   { background: rgba(255, 149, 0, 0.15); color: #ff9500; }

    .jc-tags { display: flex; gap: 4px; flex-wrap: wrap; }
    .tag {
      background: var(--bg-fill-2);
      padding: 3px 9px;
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      color: var(--label-2);
      font-family: var(--sf-mono);
    }

    .jc-foot {
      display: flex; align-items: center; gap: 14px;
      padding-top: 10px;
      border-top: 0.5px solid var(--separator);
      font-size: var(--fs-2xs);
      color: var(--label-2);
    }
    .jc-salary { color: var(--accent); font-weight: 700; font-size: var(--fs-sm);
                 font-variant-numeric: tabular-nums; }
    .jc-applicants, .jc-posted { color: var(--label-3); }
    .apply-btn {
      margin-left: auto;
      padding: 7px 16px;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: var(--r-pill);
      font-size: var(--fs-xs);
      font-weight: 700;
      transition: all var(--t-fast);
    }
    .apply-btn:hover { background: var(--accent-hover); }
    .job-card.applied .apply-btn { background: #34c759; }

    .empty { padding: 60px; text-align: center; display: flex; flex-direction: column;
             align-items: center; gap: 8px; grid-column: 1 / -1; }
    .empty span { font-size: 40px; opacity: 0.4; }
    .empty b { font-size: var(--fs-base); }
    .empty small { font-size: var(--fs-xs); color: var(--label-2); }

    /* POST JOB */
    .post-job { max-width: 640px; margin: 0 auto; }
    .post-job h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .post-job > p { font-size: var(--fs-sm); color: var(--label-2); margin: 4px 0 24px; }
    .form { display: flex; flex-direction: column; gap: 16px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 600px) { .row { grid-template-columns: 1fr; } }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field span { font-size: var(--fs-2xs); font-weight: 700; text-transform: uppercase;
                  letter-spacing: 0.06em; color: var(--label-3); }
    .field input, .field textarea {
      padding: 11px 14px;
      background: var(--bg-input);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-sm);
      font-size: var(--fs-sm);
      color: var(--label);
      outline: none;
      transition: border-color var(--t-fast);
    }
    .field input:focus, .field textarea:focus { border-color: var(--accent); }
    .field textarea { min-height: 100px; resize: vertical; font-family: inherit; }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }

    /* MY APPLICATIONS */
    .my-apps { max-width: 900px; margin: 0 auto; }
    .my-apps h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 20px; }
    .apps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
    .app-card {
      padding: 18px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      display: flex; flex-direction: column; gap: 14px;
    }
    .ac-head { display: flex; align-items: center; gap: 12px; }
    .ac-logo { font-size: 28px; }
    .ac-head > div { flex: 1; }
    .ac-head b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .ac-head small { font-size: var(--fs-2xs); color: var(--label-2); }
    .status { padding: 3px 10px; border-radius: var(--r-pill); font-size: 10px; font-weight: 700;
              text-transform: uppercase; letter-spacing: 0.04em; }
    .status.interview { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .status.review    { background: var(--accent-soft); color: var(--accent); }
    .status.offer     { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .status.rejected  { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

    .ac-progress { display: flex; gap: 4px; align-items: center; }
    .stage { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .stage-dot {
      width: 100%; height: 4px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      transition: background var(--t-base);
    }
    .stage.done .stage-dot { background: var(--accent); }
    .stage-label { font-size: 9px; color: var(--label-3); font-weight: 600;
                   text-transform: uppercase; letter-spacing: 0.04em; }
    .stage.done .stage-label { color: var(--accent); }
    .ac-date { font-size: var(--fs-2xs); color: var(--label-3); }
  `],
})
export class AfkarPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'jobs', label: 'Browse Jobs', icon: '🔍' },
    { id: 'post', label: 'Post a Job', icon: '＋' },
    { id: 'apps', label: 'My Applications', icon: '📄' },
  ];
  readonly active = signal('jobs');

  readonly types = [
    { id: 'full', label: 'Full-time' },
    { id: 'part', label: 'Part-time' },
    { id: 'remote', label: 'Remote' },
  ];
  readonly locations = ['Cairo', 'Remote', 'Hybrid', 'Alexandria'];

  readonly typeFilter = signal<string[]>(['full', 'part', 'remote']);
  readonly locationFilter = signal('Cairo');
  readonly salaryMin = signal(3);
  readonly query = signal('');

  readonly jobs: Job[] = [
    { id: 1, title: 'Senior Angular Developer', company: 'TechCorp', location: 'Cairo', salary: '$3k–5k', type: 'full', posted: '2h ago', tags: ['Angular', 'TypeScript', 'RxJS'], applicants: 42, logo: '🚀' },
    { id: 2, title: '.NET Backend Engineer', company: 'StartupX', location: 'Remote', salary: '$2.5k–4k', type: 'remote', posted: '5h ago', tags: ['C#', '.NET', 'EF Core'], applicants: 28, logo: '⚙️' },
    { id: 3, title: 'Full-Stack Engineer', company: 'FinBank', location: 'Hybrid', salary: '$4k–6k', type: 'full', posted: '1d ago', tags: ['Angular', 'ASP.NET', 'SQL'], applicants: 67, logo: '🏦' },
    { id: 4, title: 'Frontend Contract', company: 'Design Studio', location: 'Cairo', salary: '$1.5k', type: 'part', posted: '2d ago', tags: ['Angular', 'SCSS'], applicants: 15, logo: '🎨' },
  ];

  readonly applied = signal<number[]>([]);

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const types = this.typeFilter();
    return this.jobs.filter(j => {
      if (!types.includes(j.type)) return false;
      if (q && !j.title.toLowerCase().includes(q) && !j.company.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  toggleType(id: string): void {
    this.typeFilter.update(list =>
      list.includes(id) ? list.filter(x => x !== id) : [...list, id]
    );
  }

  apply(id: number): void {
    this.applied.update(list => list.includes(id) ? list : [...list, id]);
  }

  typeLabel(t: Job['type']): string {
    return { full: 'Full-time', part: 'Part-time', remote: 'Remote' }[t];
  }

  readonly stages = [
    { id: 1, label: 'Applied' },
    { id: 2, label: 'Review' },
    { id: 3, label: 'Interview' },
    { id: 4, label: 'Offer' },
  ];

  readonly applications = [
    { id: 1, title: 'Senior Angular Dev', company: 'TechCorp', logo: '🚀', status: 'interview', stage: 3, date: '3 days ago' },
    { id: 2, title: '.NET Backend', company: 'StartupX', logo: '⚙️', status: 'review', stage: 2, date: '1 week ago' },
    { id: 3, title: 'Full-Stack Eng', company: 'FinBank', logo: '🏦', status: 'offer', stage: 4, date: '2 weeks ago' },
  ];

  statusLabel(s: string): string {
    return { interview: 'Interview', review: 'In Review', offer: 'Offer!', rejected: 'Rejected' }[s] ?? s;
  }
}