import {
  ChangeDetectionStrategy, Component, computed, inject, signal,
} from '@angular/core';
import { ProjectsService } from '../../../../core/services/projects.service';

@Component({
  selector: 'app-recruiter-projects',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="projects">
      <div class="container">

        <header class="section-head">
          <div class="eyebrow">
            <span class="eyebrow-num">§02</span>
            <span class="eyebrow-line"></span>
            <span class="eyebrow-label">CLASSIFIEDS · SHIPPED WORK</span>
          </div>
          <h2 class="section-title">Selected <em>Projects</em></h2>
          <p class="section-sub">Every entry below shipped to production and served real users.</p>
        </header>

        <div class="filter-bar">
          @for (f of filters; track f.id) {
            <button class="filter-btn" [class.active]="activeFilter() === f.id" (click)="activeFilter.set(f.id)">
              <span class="fb-icon">{{ f.icon }}</span>
              <span>{{ f.label }}</span>
            </button>
          }
        </div>

        <div class="classifieds">
          @for (p of filteredProjects(); track p.id; let i = $index) {
            <article class="ad" [attr.data-cat]="p.category">
              <div class="ad-head">
                <span class="ad-num">№{{ (i + 1).toString().padStart(3, '0') }}</span>
                <span class="ad-tech" [attr.data-t]="p.tech">{{ techLabel(p.tech) }}</span>
              </div>

              <h3 class="ad-title">{{ p.name }}</h3>
              <p class="ad-tagline">{{ p.tagline }}</p>

              <div class="ad-rule"></div>

              <div class="ad-meta">
                <div class="ad-meta-item">
                  <span class="ad-meta-icon">👥</span>
                  <span class="ad-meta-val">{{ p.impact.targetAudience.toLocaleString() }}</span>
                  <small>{{ p.impact.audienceLabel }}</small>
                </div>
                <div class="ad-meta-item">
                  <span class="ad-meta-icon">🎯</span>
                  <span class="ad-meta-val">{{ p.impact.realUsage }}</span>
                  <small>Usage</small>
                </div>
              </div>

              <ul class="ad-metrics">
                @for (m of p.impact.metrics.slice(0, 2); track m.label) {
                  <li class="ad-metric" [attr.data-trend]="m.trend">
                    <span class="am-val">{{ m.value }}</span>
                    <span class="am-label">{{ m.label }}</span>
                    <span class="am-arrow">{{ m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '·' }}</span>
                  </li>
                }
              </ul>

              <div class="ad-stack">
                @for (s of p.stack.slice(0, 3); track s) {
                  <span class="ad-stack-chip">{{ s }}</span>
                }
                @if (p.stack.length > 3) {
                  <span class="ad-stack-chip more">+{{ p.stack.length - 3 }}</span>
                }
              </div>

              <footer class="ad-foot">
                @if (p.demo) {
                  <button class="ad-btn" (click)="scrollTo('contact')">
                    ▸ VIEW
                  </button>
                }
                <button class="ad-btn ghost" (click)="scrollTo('contact')">
                  DETAILS →
                </button>
              </footer>
            </article>
          }
        </div>

      </div>
    </section>
  `,
  styles: [`
    /* نفس الـ styles القديمة — مفيش تعديل */
    :host { display: block; }

    .projects {
      padding: 100px 24px;
      background: var(--rv-bg-0);
      border-top: 3px double var(--rv-copper);
    }

    .container { max-width: 1180px; margin: 0 auto; }

    .section-head { margin-bottom: 40px; }

    .eyebrow {
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: var(--rv-mono);
      font-size: 10px;
      letter-spacing: 0.2em;
      color: var(--rv-copper);
      margin-bottom: 20px;
    }
    .eyebrow-num {
      font-family: var(--rv-pixel);
      font-size: 10px;
      color: var(--rv-green);
      text-shadow: 0 0 6px var(--rv-green);
    }
    .eyebrow-line { flex: 1; height: 1px; background: var(--rv-copper); max-width: 60px; }

    .section-title {
      font-family: var(--rv-display);
      font-weight: 900;
      font-size: clamp(36px, 5vw, 68px);
      line-height: 1;
      letter-spacing: -0.03em;
      color: var(--rv-paper);
    }
    .section-title em { font-style: italic; font-weight: 400; color: var(--rv-copper); }

    .section-sub {
      margin-top: 14px;
      font-family: var(--rv-display);
      font-style: italic;
      font-size: 16px;
      color: var(--rv-paper);
      opacity: 0.7;
      max-width: 560px;
    }

    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 40px;
    }

    .filter-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: transparent;
      border: 2px solid var(--rv-copper);
      color: var(--rv-paper);
      font-family: var(--rv-mono);
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 120ms ease-out;
    }

    .filter-btn:hover {
      background: var(--rv-copper);
      color: var(--rv-ink);
    }

    .filter-btn.active {
      background: var(--rv-red);
      border-color: var(--rv-red);
      color: var(--rv-paper);
      box-shadow: 4px 4px 0 0 var(--rv-ink);
    }

    .fb-icon { font-size: 14px; }

    .classifieds {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .ad {
      background: var(--rv-paper);
      border: 3px solid var(--rv-ink);
      box-shadow: 6px 6px 0 0 var(--rv-ink);
      padding: 20px;
      color: var(--rv-ink);
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: transform 120ms ease-out, box-shadow 120ms ease-out;
      position: relative;
    }

    .ad:hover {
      transform: translate(-2px, -2px);
      box-shadow: 8px 8px 0 0 var(--rv-red);
    }

    .ad[data-cat='FullStack'] { border-top: 6px solid var(--rv-red); }
    .ad[data-cat='Backend']   { border-top: 6px solid #512bd4; }
    .ad[data-cat='Frontend']  { border-top: 6px solid #dd0031; }
    .ad[data-cat='MVC']       { border-top: 6px solid var(--rv-copper); }

    .ad-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .ad-num {
      font-family: var(--rv-terminal);
      font-size: 16px;
      color: var(--rv-ink-soft);
      letter-spacing: 0.05em;
    }

    .ad-tech {
      font-family: var(--rv-pixel);
      font-size: 7px;
      letter-spacing: 0.1em;
      padding: 4px 8px;
      border: 2px solid var(--rv-ink);
    }
    .ad-tech[data-t='angular'] { background: #dd0031; color: white; border-color: #dd0031; }
    .ad-tech[data-t='dotnet']  { background: #512bd4; color: white; border-color: #512bd4; }
    .ad-tech[data-t='both']    { background: linear-gradient(90deg, #dd0031 0 50%, #512bd4 50% 100%); color: white; border-color: var(--rv-ink); }

    .ad-title {
      font-family: var(--rv-display);
      font-weight: 900;
      font-size: 22px;
      line-height: 1.1;
      letter-spacing: -0.02em;
      color: var(--rv-ink);
    }

    .ad-tagline {
      font-family: var(--rv-display);
      font-style: italic;
      font-size: 14px;
      color: var(--rv-red);
      line-height: 1.3;
    }

    .ad-rule {
      height: 2px;
      background: repeating-linear-gradient(
        90deg,
        var(--rv-ink) 0, var(--rv-ink) 6px,
        transparent 6px, transparent 10px
      );
      margin: 4px 0;
    }

    .ad-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      padding: 10px 12px;
      background: var(--rv-paper-2);
      border-left: 4px solid var(--rv-copper);
    }

    .ad-meta-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }

    .ad-meta-icon { font-size: 14px; }

    .ad-meta-val {
      font-family: var(--rv-display);
      font-weight: 900;
      font-size: 18px;
      color: var(--rv-ink);
      line-height: 1;
      letter-spacing: -0.02em;
    }

    .ad-meta-item small {
      font-family: var(--rv-mono);
      font-size: 8px;
      letter-spacing: 0.1em;
      color: var(--rv-ink-soft);
      text-transform: uppercase;
    }

    .ad-metrics {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 0;
    }

    .ad-metric {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 8px;
      align-items: baseline;
      padding: 4px 0;
      border-bottom: 1px dotted var(--rv-ink-soft);
    }
    .ad-metric:last-child { border-bottom: 0; }

    .am-val {
      font-family: var(--rv-display);
      font-weight: 900;
      font-size: 16px;
      color: var(--rv-red);
      line-height: 1;
    }

    .ad-metric[data-trend='down'] .am-val { color: #1a8a2a; }

    .am-label {
      font-family: var(--rv-mono);
      font-size: 9px;
      letter-spacing: 0.1em;
      color: var(--rv-ink-soft);
      text-transform: uppercase;
    }

    .am-arrow {
      font-family: var(--rv-terminal);
      font-size: 14px;
      color: var(--rv-red);
    }
    .ad-metric[data-trend='down'] .am-arrow { color: #1a8a2a; }

    .ad-stack {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
    }

    .ad-stack-chip {
      font-family: var(--rv-mono);
      font-size: 9px;
      padding: 3px 8px;
      background: var(--rv-ink);
      color: var(--rv-paper);
      letter-spacing: 0.06em;
    }

    .ad-stack-chip.more {
      background: var(--rv-red);
      color: var(--rv-paper);
    }

    .ad-foot {
      display: flex;
      gap: 8px;
      margin-top: auto;
      padding-top: 12px;
      border-top: 2px solid var(--rv-ink);
    }

    .ad-btn {
      flex: 1;
      padding: 10px 12px;
      background: var(--rv-ink);
      color: var(--rv-paper);
      border: 2px solid var(--rv-ink);
      font-family: var(--rv-pixel);
      font-size: 8px;
      letter-spacing: 0.08em;
      cursor: pointer;
      transition: all 120ms ease-out;
    }

    .ad-btn:hover {
      background: var(--rv-red);
      border-color: var(--rv-red);
      transform: translate(-1px, -1px);
      box-shadow: 3px 3px 0 0 var(--rv-ink);
    }

    .ad-btn.ghost {
      background: var(--rv-paper);
      color: var(--rv-ink);
    }
    .ad-btn.ghost:hover { background: var(--rv-paper-2); }

    @media (max-width: 640px) {
      .projects { padding: 60px 16px; }
      .classifieds { gap: 16px; }
      .ad { padding: 16px; box-shadow: 4px 4px 0 0 var(--rv-ink); }
      .ad:hover { box-shadow: 6px 6px 0 0 var(--rv-red); }
      .ad-title { font-size: 18px; }
      .filter-btn { padding: 8px 12px; font-size: 10px; }
    }
  `],
})
export class RecruiterProjectsComponent {
  readonly svc = inject(ProjectsService);

  readonly activeFilter = signal<string>('all');

  readonly filters = [
    { id: 'all', label: 'All', icon: '◆' },
    { id: 'FullStack', label: 'Full Stack', icon: '◆' },
    { id: 'Backend', label: '.NET', icon: '◆' },
    { id: 'Frontend', label: 'Angular', icon: '◆' },
    { id: 'MVC', label: 'MVC', icon: '◆' },
  ];

  readonly filteredProjects = computed(() => {
    const f = this.activeFilter();
    const all = this.svc.projects;
    if (f === 'all') return all;
    return all.filter(p => p.category === f);
  });

  techLabel(tech: string): string {
    return tech === 'both' ? 'A | .NET' : tech === 'angular' ? 'ANGULAR' : '.NET';
  }

  scrollTo(section: string): void {
    const el = document.querySelector(`app-recruiter-${section}`);
    el?.scrollIntoView({ behavior: 'smooth' });
  }
}