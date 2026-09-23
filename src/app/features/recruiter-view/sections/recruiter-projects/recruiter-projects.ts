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
          <div class="head-left">
            <div class="eyebrow">
              <span class="eyebrow-num">§02</span>
              <span class="eyebrow-line"></span>
              <span class="eyebrow-label">CLASSIFIEDS · SHIPPED WORK</span>
            </div>
            <h2 class="section-title">Selected <em>Projects</em></h2>
            <p class="section-sub">Every entry below shipped to production and served real users.</p>
          </div>

          <div class="head-right">
            <div class="counter">
              <span class="counter-num">{{ filteredProjects().length }}</span>
              <span class="counter-label">ENTRIES</span>
            </div>
          </div>
        </header>

        <div class="filter-bar">
          @for (f of filters; track f.id) {
            <button
              class="filter-btn"
              [class.active]="activeFilter() === f.id"
              (click)="activeFilter.set(f.id)"
            >
              <span class="fb-icon">{{ f.icon }}</span>
              <span class="fb-label">{{ f.label }}</span>
              <span class="fb-count">{{ countBy(f.id) }}</span>
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
                  <div>
                    <span class="ad-meta-val">{{ p.impact.targetAudience.toLocaleString() }}</span>
                    <small>{{ p.impact.audienceLabel }}</small>
                  </div>
                </div>
                <div class="ad-meta-item">
                  <span class="ad-meta-icon">🎯</span>
                  <div>
                    <span class="ad-meta-val">{{ p.impact.realUsage }}</span>
                    <small>Usage</small>
                  </div>
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
    :host { display: block; }

    .projects {
      padding: 100px 24px;
      background: var(--rv-bg-0);
      border-top: 3px double var(--rv-copper);
    }

    .container { max-width: 1180px; margin: 0 auto; }

    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 24px;
      margin-bottom: 40px;
      width: 100%;
    }

    .head-left {
      flex: 1 1 480px;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .head-right {
      flex: 0 0 auto;
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
    }

    .counter {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      padding: 12px 20px;
      border-left: 3px solid var(--rv-copper);
    }

    .counter-num {
      font-family: var(--rv-display);
      font-weight: 900;
      font-size: 40px;
      line-height: 1;
      letter-spacing: -0.04em;
      color: var(--rv-copper);
      font-variant-numeric: tabular-nums;
    }

    .counter-label {
      font-family: var(--rv-pixel);
      font-size: 8px;
      letter-spacing: 0.15em;
      color: var(--rv-paper);
      opacity: 0.6;
    }

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

    .eyebrow-line {
      flex: 1;
      height: 1px;
      background: var(--rv-copper);
      max-width: 60px;
    }

    .section-title {
      font-family: var(--rv-display);
      font-weight: 900;
      font-size: clamp(36px, 5vw, 68px);
      line-height: 1;
      letter-spacing: -0.03em;
      color: var(--rv-paper);
    }

    .section-title em {
      font-style: italic;
      font-weight: 400;
      color: var(--rv-copper);
    }

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
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 16px 24px;
      margin: 0 -24px 40px -24px;
      background: rgba(6, 10, 6, 0.88);
      backdrop-filter: blur(14px) saturate(140%);
      -webkit-backdrop-filter: blur(14px) saturate(140%);
      border-bottom: 2px solid var(--rv-copper);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    }

    .filter-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
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
      white-space: nowrap;
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

    .fb-count {
      font-family: var(--rv-terminal);
      font-size: 14px;
      padding: 0 6px;
      background: var(--rv-bg-0);
      color: var(--rv-green);
      letter-spacing: 0.05em;
    }

    .filter-btn.active .fb-count {
      background: var(--rv-ink);
      color: var(--rv-gold);
    }

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
      min-width: 0;
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
      gap: 10px;
      flex-wrap: wrap;
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
      white-space: nowrap;
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
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding: 10px 12px;
      background: var(--rv-paper-2);
      border-left: 4px solid var(--rv-copper);
    }

    .ad-meta-item {
      flex: 1 1 100px;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .ad-meta-icon { font-size: 16px; flex-shrink: 0; }

    .ad-meta-item > div { min-width: 0; }

    .ad-meta-val {
      display: block;
      font-family: var(--rv-display);
      font-weight: 900;
      font-size: 18px;
      color: var(--rv-ink);
      line-height: 1;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
    }

    .ad-meta-item small {
      display: block;
      font-family: var(--rv-mono);
      font-size: 8px;
      letter-spacing: 0.1em;
      color: var(--rv-ink-soft);
      text-transform: uppercase;
      margin-top: 2px;
    }

    .ad-metrics {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 0;
    }

    .ad-metric {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
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
      flex-shrink: 0;
    }

    .ad-metric[data-trend='down'] .am-val { color: #1a8a2a; }

    .am-label {
      flex: 1;
      font-family: var(--rv-mono);
      font-size: 9px;
      letter-spacing: 0.1em;
      color: var(--rv-ink-soft);
      text-transform: uppercase;
      text-align: right;
    }

    .am-arrow {
      font-family: var(--rv-terminal);
      font-size: 14px;
      color: var(--rv-red);
      flex-shrink: 0;
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
      flex-wrap: wrap;
      gap: 8px;
      margin-top: auto;
      padding-top: 12px;
      border-top: 2px solid var(--rv-ink);
    }

    .ad-btn {
      flex: 1 1 120px;
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

    @media (max-width: 900px) {
      .section-head {
        align-items: flex-start;
      }
      .counter-num { font-size: 32px; }
    }

    @media (max-width: 720px) {

      .projects {
        padding: 60px 12px !important;
        width: 100% !important;
        max-width: 100vw !important;
        box-sizing: border-box !important;
      }

      .container {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        box-sizing: border-box !important;
      }

      .section-head {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 14px !important;
        margin-bottom: 22px !important;
      }

      .head-left,
      .head-right {
        width: 100% !important;
        flex: 1 1 100% !important;
        min-width: 0 !important;
      }

      .counter {
        display: inline-flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 10px !important;
        padding: 8px 14px !important;
        border-left: 3px solid var(--rv-copper) !important;
      }

      .counter-num { font-size: 26px !important; }
      .counter-label { font-size: 7px !important; }

      .eyebrow {
        gap: 8px !important;
        font-size: 9px !important;
        margin-bottom: 10px !important;
        flex-wrap: wrap !important;
      }

      .eyebrow-num { font-size: 9px !important; }
      .eyebrow-line { max-width: 30px !important; }

      .section-title {
        font-size: clamp(26px, 8.5vw, 40px) !important;
        line-height: 1.05 !important;
      }

      .section-sub {
        font-size: 13px !important;
        line-height: 1.55 !important;
        margin-top: 8px !important;
        max-width: 100% !important;
      }

      .filter-bar {
        padding: 12px 12px !important;
        margin: 0 -12px 20px -12px !important;
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 6px !important;
        backdrop-filter: blur(10px) saturate(140%) !important;
        -webkit-backdrop-filter: blur(10px) saturate(140%) !important;
        background: rgba(6, 10, 6, 0.92) !important;
      }

      .filter-btn {
        padding: 8px 10px !important;
        font-size: 10px !important;
        justify-content: center !important;
        min-width: 0 !important;
        overflow: hidden !important;
        gap: 4px !important;
        box-sizing: border-box !important;
      }

      .fb-icon { font-size: 11px !important; flex-shrink: 0 !important; }
      .fb-label {
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        min-width: 0 !important;
      }
      .fb-count { font-size: 11px !important; padding: 0 5px !important; flex-shrink: 0 !important; }

      .classifieds {
        display: flex !important;
        flex-direction: column !important;
        gap: 14px !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
      }

      .ad {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        flex: none !important;
        padding: 16px !important;
        box-sizing: border-box !important;
        overflow: visible !important;
        word-break: break-word !important;
        overflow-wrap: anywhere !important;
        box-shadow: 4px 4px 0 0 var(--rv-ink) !important;
        gap: 10px !important;
      }

      .ad-head {
        flex-wrap: wrap !important;
        gap: 8px !important;
        align-items: center !important;
      }

      .ad-num {
        font-size: 14px !important;
        line-height: 1 !important;
      }

      .ad-tech {
        font-family: var(--rv-mono) !important;
        font-size: 10px !important;
        font-weight: 700 !important;
        padding: 4px 9px !important;
        letter-spacing: 0.05em !important;
        line-height: 1.2 !important;
        border-width: 2px !important;
        white-space: nowrap !important;
      }

      .ad-title {
        font-size: 18px !important;
        line-height: 1.2 !important;
        letter-spacing: -0.015em !important;
        word-break: break-word !important;
        overflow-wrap: anywhere !important;
      }

      .ad-tagline {
        font-size: 13px !important;
        line-height: 1.5 !important;
        word-break: break-word !important;
        overflow-wrap: anywhere !important;
        white-space: normal !important;
      }

      .ad-rule {
        margin: 2px 0 !important;
        height: 1px !important;
      }

      .ad-meta {
        flex-direction: column !important;
        gap: 8px !important;
        padding: 10px 12px !important;
        border-left-width: 3px !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      .ad-meta-item {
        flex: 1 1 100% !important;
        min-width: 0 !important;
        gap: 8px !important;
        align-items: flex-start !important;
      }

      .ad-meta-icon {
        font-size: 15px !important;
        margin-top: 2px !important;
        flex-shrink: 0 !important;
      }

      .ad-meta-item > div {
        min-width: 0 !important;
        flex: 1 !important;
      }

      .ad-meta-val {
        font-size: 16px !important;
        line-height: 1.1 !important;
        word-break: break-word !important;
        overflow-wrap: anywhere !important;
      }

      .ad-meta-item small {
        font-size: 10px !important;
        line-height: 1.3 !important;
        letter-spacing: 0.07em !important;
        word-break: break-word !important;
      }

      .ad-metrics {
        gap: 4px !important;
        padding: 4px 0 !important;
        width: 100% !important;
      }

      .ad-metric {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 8px 0 !important;
        min-width: 0 !important;
        width: 100% !important;
      }

      .am-val {
        font-size: 16px !important;
        flex-shrink: 0 !important;
        line-height: 1 !important;
      }

      .am-label {
        font-family: var(--rv-mono) !important;
        font-size: 10px !important;
        line-height: 1.3 !important;
        text-align: right !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        min-width: 0 !important;
        flex: 1 !important;
      }

      .am-arrow {
        font-size: 14px !important;
        flex-shrink: 0 !important;
      }

      .ad-stack {
        gap: 4px !important;
        margin-top: 4px !important;
        flex-wrap: wrap !important;
      }

      .ad-stack-chip {
        font-family: var(--rv-mono) !important;
        font-size: 10px !important;
        padding: 4px 8px !important;
        white-space: nowrap !important;
        word-break: keep-all !important;
      }

      .ad-foot {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 8px !important;
        padding-top: 12px !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      .ad-btn {
        width: 100% !important;
        flex: none !important;
        min-width: 0 !important;
        padding: 12px 14px !important;
        font-family: var(--rv-mono) !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        letter-spacing: 0.08em !important;
        text-align: center !important;
        box-sizing: border-box !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }

      .ad-btn.ghost {
        width: 100% !important;
        flex: none !important;
      }
    }

    @media (max-width: 380px) {
      .projects { padding: 50px 10px !important; }

      .section-title { font-size: 24px !important; }

      .filter-bar {
        padding: 10px 10px !important;
        margin: 0 -10px 16px -10px !important;
        grid-template-columns: 1fr !important;
      }

      .filter-btn {
        font-size: 10px !important;
        padding: 8px 10px !important;
      }

      .classifieds { gap: 12px !important; }

      .ad {
        padding: 14px !important;
        gap: 8px !important;
      }

      .ad-title { font-size: 16px !important; }
      .ad-tagline { font-size: 12px !important; }
      .am-val { font-size: 15px !important; }
      .am-label { font-size: 9px !important; }

      .ad-btn {
        font-size: 10px !important;
        padding: 11px 12px !important;
      }
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

  countBy(id: string): number {
    const all = this.svc.projects;
    if (id === 'all') return all.length;
    return all.filter(p => p.category === id).length;
  }

  techLabel(tech: string): string {
    return tech === 'both' ? 'A | .NET' : tech === 'angular' ? 'ANGULAR' : '.NET';
  }

  scrollTo(section: string): void {
    const el = document.querySelector(`app-recruiter-${section}`);
    el?.scrollIntoView({ behavior: 'smooth' });
  }
}