import {
  ChangeDetectionStrategy, Component, inject,
} from '@angular/core';

@Component({
  selector: 'app-recruiter-experience',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="experience">
      <div class="container">

        <header class="section-head">
          <div class="eyebrow">
            <span class="eyebrow-num">§03</span>
            <span class="eyebrow-line"></span>
            <span class="eyebrow-label">CAREER LOG · MOUNTED COMPONENTS</span>
          </div>
          <h2 class="section-title">Service <em>Record</em></h2>
          <p class="section-sub">Each entry is a module mounted on the board — replaced, upgraded, shipped.</p>
        </header>

        <div class="board">
          @for (exp of experiences; track exp.company; let i = $index) {
            <article class="chip">
              <div class="pins">
                @for (p of [1,2,3,4,5,6]; track p) {
                  <span class="pin"></span>
                }
              </div>

              <div class="chip-body">
                <header class="chip-head">
                  <div class="chip-id">
                    <span class="chip-num">0{{ i + 1 }}</span>
                    <span class="chip-icon">{{ exp.icon }}</span>
                  </div>
                  <span class="chip-period">{{ exp.period }}</span>
                </header>

                <h3 class="chip-title">{{ exp.company }}</h3>
                <p class="chip-role">{{ exp.role }}</p>

                <div class="trace"></div>

                <p class="chip-desc">{{ exp.description }}</p>

                <div class="chip-stats">
                  @for (h of exp.highlights; track h.label) {
                    <div class="stat">
                      <span class="stat-val">{{ h.value }}</span>
                      <span class="stat-label">{{ h.label }}</span>
                    </div>
                  }
                </div>

                <div class="chip-projects">
                  <span class="cp-label">SHIPPED</span>
                  @for (p of exp.projects; track p) {
                    <span class="cp-chip">{{ p }}</span>
                  }
                </div>

                <div class="chip-stack">
                  @for (s of exp.stack; track s) {
                    <span class="stack-chip">{{ s }}</span>
                  }
                </div>
              </div>
            </article>
          }
        </div>

      </div>
    </section>
  `,
  styles: [`
    /* نفس الـ styles القديمة */
    :host { display: block; }

    .experience {
      padding: 100px 24px;
      background: var(--rv-bg-0);
      border-top: 3px double var(--rv-copper);
    }

    .container { max-width: 1000px; margin: 0 auto; }

    .section-head { margin-bottom: 60px; }
    .eyebrow {
      display: flex; align-items: center; gap: 12px;
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

    .board {
      display: flex;
      flex-direction: column;
      gap: 0;
      position: relative;
    }

    .board::before {
      content: '';
      position: absolute;
      left: 40px;
      top: 0;
      bottom: 0;
      width: 3px;
      background: repeating-linear-gradient(
        180deg,
        var(--rv-copper) 0, var(--rv-copper) 12px,
        transparent 12px, transparent 20px
      );
    }

    .chip {
      display: grid;
      grid-template-columns: 80px 1fr;
      gap: 0;
      margin-bottom: 40px;
      position: relative;
    }

    .chip::before {
      content: '';
      position: absolute;
      left: 28px;
      top: 40px;
      width: 28px;
      height: 3px;
      background: var(--rv-copper);
    }

    .pins {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 6px;
      padding-top: 8px;
    }

    .pin {
      width: 20px;
      height: 4px;
      background: var(--rv-gold);
      box-shadow: 0 0 4px var(--rv-gold);
    }

    .chip-body {
      background: var(--rv-paper);
      border: 3px solid var(--rv-ink);
      box-shadow: 8px 8px 0 0 var(--rv-ink);
      padding: 24px 28px;
      color: var(--rv-ink);
      position: relative;
    }

    .chip-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--rv-ink);
      margin-bottom: 16px;
    }

    .chip-id {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .chip-num {
      font-family: var(--rv-terminal);
      font-size: 22px;
      color: var(--rv-red);
      line-height: 1;
    }

    .chip-icon { font-size: 24px; }

    .chip-period {
      font-family: var(--rv-mono);
      font-size: 10px;
      letter-spacing: 0.12em;
      color: var(--rv-ink-soft);
      padding: 4px 10px;
      background: var(--rv-paper-2);
      border: 1px solid var(--rv-ink-soft);
    }

    .chip-title {
      font-family: var(--rv-display);
      font-weight: 900;
      font-size: clamp(22px, 3vw, 30px);
      line-height: 1.1;
      letter-spacing: -0.02em;
      color: var(--rv-ink);
    }

    .chip-role {
      font-family: var(--rv-display);
      font-style: italic;
      font-size: 15px;
      color: var(--rv-red);
      margin-top: 4px;
    }

    .trace {
      height: 2px;
      background: repeating-linear-gradient(
        90deg,
        var(--rv-ink) 0, var(--rv-ink) 4px,
        transparent 4px, transparent 8px
      );
      margin: 16px 0;
      opacity: 0.4;
    }

    .chip-desc {
      font-family: var(--rv-display);
      font-size: 15px;
      line-height: 1.6;
      color: var(--rv-ink-2);
      margin-bottom: 16px;
    }

    .chip-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      padding: 12px;
      background: var(--rv-paper-2);
      border-left: 4px solid var(--rv-copper);
      margin-bottom: 16px;
    }

    .stat { display: flex; flex-direction: column; gap: 2px; }

    .stat-val {
      font-family: var(--rv-display);
      font-weight: 900;
      font-size: 22px;
      color: var(--rv-red);
      line-height: 1;
      letter-spacing: -0.02em;
    }

    .stat-label {
      font-family: var(--rv-mono);
      font-size: 9px;
      letter-spacing: 0.1em;
      color: var(--rv-ink-soft);
      text-transform: uppercase;
    }

    .chip-projects {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px dotted var(--rv-ink-soft);
    }

    .cp-label {
      font-family: var(--rv-pixel);
      font-size: 8px;
      letter-spacing: 0.1em;
      color: var(--rv-copper-dark);
      margin-right: 6px;
    }

    .cp-chip {
      font-family: var(--rv-mono);
      font-size: 10px;
      padding: 3px 10px;
      background: var(--rv-ink);
      color: var(--rv-paper);
      letter-spacing: 0.05em;
    }

    .chip-stack {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .stack-chip {
      font-family: var(--rv-mono);
      font-size: 9px;
      padding: 3px 8px;
      background: var(--rv-paper-2);
      border: 1px solid var(--rv-ink);
      color: var(--rv-ink);
      letter-spacing: 0.05em;
    }

    @media (max-width: 640px) {
      .experience { padding: 60px 16px; }
      .board::before { left: 20px; }
      .chip { grid-template-columns: 40px 1fr; margin-bottom: 24px; }
      .chip::before { left: 12px; width: 16px; }
      .pins { gap: 4px; }
      .pin { width: 14px; height: 3px; }
      .chip-body { padding: 16px; box-shadow: 4px 4px 0 0 var(--rv-ink); }
      .chip-title { font-size: 20px; }
      .chip-stats { grid-template-columns: 1fr; gap: 8px; }
      .chip-head { flex-direction: column; align-items: flex-start; gap: 10px; }
    }
  `],
})
export class RecruiterExperienceComponent {
  readonly experiences = [
    {
      company: 'X-BLEND',
      role: 'Front-End Developer (Angular)',
      period: '10/2024 – 03/2026',
      icon: '🚀',
      description: 'Delivered Angular-based front-end solutions across multiple client projects in a fast-paced startup environment. Owned features end-to-end from Figma handoff to production deploys.',
      highlights: [
        { value: '+30%', label: 'Engagement' },
        { value: '05', label: 'Projects' },
        { value: '-20%', label: 'Cycle time' },
      ],
      projects: ['AR-Room', 'Al-Motafiq', 'AZ-Accounting', 'BWT', 'Business Step'],
      stack: ['Angular', 'NgRx', 'PrimeNG', 'SCSS', 'RxJS'],
    },
    {
      company: 'FOE — Military Service',
      role: 'Full-Stack Developer (Angular & .NET)',
      period: 'Military Service',
      icon: '🎖',
      description: 'End-to-end full-stack ownership during mandatory service. Built mission-critical operational systems used across military sectors — from document generation to data normalization.',
      highlights: [
        { value: '05', label: 'Systems' },
        { value: '10+', label: 'Sectors' },
        { value: '10K', label: 'Users served' },
      ],
      projects: ['Transfer Orders', 'Reminder', 'Enlisted Mgmt', 'Sector Reports', 'Normalization'],
      stack: ['Angular', 'ASP.NET Core', 'Firebase', 'SQL Server'],
    },
    {
      company: 'Freelance',
      role: 'Full-Stack Developer (Angular & .NET)',
      period: 'Ongoing',
      icon: '💼',
      description: 'Delivered full-stack web applications for clients across industries — job platforms and e-commerce. Complete ownership of architecture, implementation, and deployment.',
      highlights: [
        { value: '02', label: 'Products' },
        { value: '5.0', label: 'Rating' },
        { value: '100%', label: 'On-time' },
      ],
      projects: ['Afkar Platform', 'Ennwy E-Commerce'],
      stack: ['Angular', 'ASP.NET Core', 'EF Core', 'JWT'],
    },
  ];
}