import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-recruiter-skills',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="skills">
      <div class="container">

        <header class="section-head">
          <div class="eyebrow">
            <span class="eyebrow-num">§04</span>
            <span class="eyebrow-line"></span>
            <span class="eyebrow-label">SILICON STACK · CAPABILITIES</span>
          </div>
          <h2 class="section-title">Technical <em>Inventory</em></h2>
          <p class="section-sub">Every cell below represents a verified capability — hands-on, production-grade.</p>
        </header>

        <div class="bays">
          @for (g of skillGroups; track g.key; let gi = $index) {
            <div class="bay">
              <header class="bay-head">
                <span class="bay-num">B{{ (gi + 1).toString().padStart(2, '0') }}</span>
                <span class="bay-icon">{{ g.icon }}</span>
                <span class="bay-label">{{ g.label }}</span>
                <span class="bay-total">{{ g.items.length }}×</span>
              </header>

              <div class="ram-bank">
                @for (s of g.items; track s.name; let si = $index) {
                  <div class="ram-row">
                    <span class="ram-id">{{ (si + 1).toString().padStart(2, '0') }}</span>
                    <span class="ram-name">{{ s.name }}</span>
                    <div class="ram-bar">
                      <div class="ram-fill" [attr.data-level]="s.level" [style.width.%]="s.level"></div>
                    </div>
                    <span class="ram-val">{{ s.level }}%</span>
                    <span class="ram-led"></span>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <div class="chip-footer">
          <div class="cf-left">
            <span class="cf-dot"></span>
            <span class="cf-label">ALL CHANNELS ACTIVE</span>
          </div>
          <div class="cf-right">
            <span>REV 3.0</span>
            <span>·</span>
            <span>{{ totalSkills }} MODULES</span>
          </div>
        </div>

      </div>
    </section>
  `,
  styles: [`
    /* نفس الـ styles القديمة */
    :host { display: block; }

    .skills {
      padding: 100px 24px;
      background: var(--rv-bg-0);
      border-top: 3px double var(--rv-copper);
    }

    .container { max-width: 1180px; margin: 0 auto; }

    .section-head { margin-bottom: 56px; }
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

    .bays {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 24px;
    }

    .bay {
      background: var(--rv-bg-1);
      border: 3px solid var(--rv-pcb-trace);
      box-shadow: 6px 6px 0 0 var(--rv-ink);
      padding: 18px;
      position: relative;
    }

    .bay::before,
    .bay::after {
      content: '';
      position: absolute;
      left: 10%;
      right: 10%;
      height: 3px;
      background: repeating-linear-gradient(
        90deg,
        var(--rv-gold) 0, var(--rv-gold) 4px,
        transparent 4px, transparent 10px
      );
    }
    .bay::before { top: -3px; }
    .bay::after { bottom: -3px; }

    .bay-head {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 12px;
      border-bottom: 2px dashed var(--rv-copper-dark);
      margin-bottom: 14px;
    }

    .bay-num {
      font-family: var(--rv-terminal);
      font-size: 18px;
      color: var(--rv-copper);
      letter-spacing: 0.05em;
    }

    .bay-icon { font-size: 22px; }

    .bay-label {
      flex: 1;
      font-family: var(--rv-display);
      font-weight: 700;
      font-size: 17px;
      color: var(--rv-paper);
      letter-spacing: -0.01em;
    }

    .bay-total {
      font-family: var(--rv-pixel);
      font-size: 9px;
      color: var(--rv-green);
      letter-spacing: 0.1em;
      text-shadow: 0 0 4px var(--rv-green);
    }

    .ram-bank {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ram-row {
      display: grid;
      grid-template-columns: 24px 1fr 90px 40px 12px;
      gap: 10px;
      align-items: center;
      padding: 6px 8px;
      background: var(--rv-bg-2);
      border: 1px solid var(--rv-pcb-trace);
      position: relative;
    }

    .ram-row::after {
      content: '';
      position: absolute;
      right: -4px;
      top: 3px; bottom: 3px;
      width: 3px;
      background: repeating-linear-gradient(
        180deg,
        var(--rv-gold) 0, var(--rv-gold) 1px,
        transparent 1px, transparent 2px
      );
    }

    .ram-id {
      font-family: var(--rv-terminal);
      font-size: 14px;
      color: var(--rv-copper);
    }

    .ram-name {
      font-family: var(--rv-mono);
      font-size: 12px;
      color: var(--rv-paper);
      letter-spacing: 0.02em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ram-bar {
      height: 8px;
      background: var(--rv-bg-0);
      border: 1px solid var(--rv-pcb-trace);
      overflow: hidden;
      position: relative;
    }

    .ram-bar::before {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        90deg,
        transparent 0, transparent 3px,
        var(--rv-pcb-line) 3px, var(--rv-pcb-line) 4px
      );
      pointer-events: none;
      z-index: 2;
    }

    .ram-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--rv-green-dim), var(--rv-green));
      box-shadow: 0 0 8px var(--rv-green);
      transition: width 1.2s cubic-bezier(0.32, 0.72, 0, 1);
      position: relative;
      z-index: 1;
    }

    .ram-val {
      font-family: var(--rv-terminal);
      font-size: 16px;
      color: var(--rv-green);
      text-align: right;
      text-shadow: 0 0 4px var(--rv-green);
    }

    .ram-led {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--rv-green);
      box-shadow: 0 0 6px var(--rv-green);
      animation: rv-blink 1.6s steps(1) infinite;
    }

    .chip-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 40px;
      padding: 16px 20px;
      background: var(--rv-bg-1);
      border: 2px solid var(--rv-copper);
      font-family: var(--rv-mono);
      font-size: 10px;
      letter-spacing: 0.15em;
      color: var(--rv-copper);
      flex-wrap: wrap;
      gap: 12px;
    }

    .cf-left { display: flex; align-items: center; gap: 8px; }
    .cf-right { display: flex; gap: 10px; }

    .cf-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--rv-green);
      box-shadow: 0 0 6px var(--rv-green);
      animation: rv-blink 1s steps(1) infinite;
    }

    @media (max-width: 640px) {
      .skills { padding: 60px 16px; }
      .bays { grid-template-columns: 1fr; gap: 16px; }
      .bay { padding: 14px; box-shadow: 4px 4px 0 0 var(--rv-ink); }
      .ram-row { grid-template-columns: 20px 1fr 60px 34px 10px; gap: 6px; padding: 5px 6px; }
      .ram-name { font-size: 10px; }
      .ram-val { font-size: 13px; }
    }
  `],
})
export class RecruiterSkillsComponent {
  readonly skillGroups = [
    {
      key: 'angular', label: 'Angular & Frontend', icon: '🅰',
      items: [
        { name: 'Angular 17+', level: 95 },
        { name: 'TypeScript', level: 92 },
        { name: 'RxJS / Signals', level: 88 },
        { name: 'NgRx', level: 82 },
        { name: 'SCSS / Tailwind', level: 90 },
      ],
    },
    {
      key: 'dotnet', label: '.NET & Backend', icon: '🟪',
      items: [
        { name: 'C# / .NET 9', level: 92 },
        { name: 'ASP.NET Core Web API', level: 90 },
        { name: 'EF Core', level: 88 },
        { name: 'Identity / JWT', level: 85 },
        { name: 'SignalR', level: 78 },
      ],
    },
    {
      key: 'db', label: 'Database & Data', icon: '🗄',
      items: [
        { name: 'SQL Server', level: 88 },
        { name: 'LINQ', level: 90 },
        { name: 'Migrations & Schema', level: 85 },
        { name: 'Redis', level: 70 },
      ],
    },
    {
      key: 'arch', label: 'Architecture', icon: '🏛',
      items: [
        { name: 'Clean Architecture', level: 88 },
        { name: 'SOLID Principles', level: 92 },
        { name: 'Design Patterns', level: 85 },
        { name: 'Repository + UoW', level: 90 },
      ],
    },
    {
      key: 'tools', label: 'Tools & Workflow', icon: '🔧',
      items: [
        { name: 'Git / GitHub', level: 92 },
        { name: 'Docker', level: 75 },
        { name: 'Azure DevOps', level: 72 },
        { name: 'VS Code / VS', level: 95 },
      ],
    },
    {
      key: 'soft', label: 'Soft Skills', icon: '💡',
      items: [
        { name: 'Problem Solving', level: 95 },
        { name: 'Communication', level: 88 },
        { name: 'Team Collaboration', level: 90 },
        { name: 'Fast Learning', level: 94 },
      ],
    },
  ];

  get totalSkills(): number {
    return this.skillGroups.reduce((sum, g) => sum + g.items.length, 0);
  }
}