import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-cv-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cv-wrap">
      <header class="cv-bar">
        <div class="cv-tabs">
          <button class="ct" [class.active]="tab() === 'preview'" (click)="tab.set('preview')">
            👁 Preview
          </button>
          <button class="ct" [class.active]="tab() === 'embed'" (click)="tab.set('embed')">
            📄 PDF
          </button>
        </div>
        <div class="cv-actions">
          <button class="pill" (click)="print()">🖨 Print</button>
          <a class="pill primary" href="./../../../../../../assets/Ibrahim-Shafiq-Angular-DotNet-Full-Stack-CV.pdf"
             download="Ibrahim-Shafiq-CV.pdf">⬇ Download PDF</a>
        </div>
      </header>

      <div class="cv-body">
        @if (tab() === 'embed') {
          <iframe
            class="cv-frame"
            src="./../../../../../../assets/Ibrahim-Shafiq-Angular-DotNet-Full-Stack-CV.pdf"
            title="Ibrahim Shafiq CV">
          </iframe>
        } @else {
          <article class="cv-paper">
            <header class="cv-head">
              <div>
                <h1>IBRAHIM SHAFIQ</h1>
                <p class="cv-role">Full-Stack Software Engineer — Angular &amp; .NET</p>
                <p class="cv-meta">Cairo, Egypt · +20 112 846 7654 · ibrahim.shafiq440&#64;gmail.com</p>
                <p class="cv-meta">
                  <a href="https://linkedin.com/in/ibrahim-shafiq" target="_blank">linkedin.com/in/ibrahim-shafiq</a>
                  · <a href="https://github.com/IbrahimShafiq4" target="_blank">github.com/IbrahimShafiq4</a>
                </p>
              </div>
            </header>

            <section class="cv-section">
              <h2>Summary</h2>
              <p>Full-Stack Software Engineer with 3 years of professional experience building and delivering production systems end-to-end with Angular and ASP.NET Core. Comfortable owning features from database and REST API design through to polished, responsive user interfaces. Background spans startup product development, mission-critical full-stack systems built during military service, and freelance full-stack delivery. Strong foundation in Clean Architecture, SOLID principles, and RESTful API design.</p>
            </section>

            <section class="cv-section">
              <h2>Skills</h2>
              <div class="skill-rows">
                @for (s of skills; track s.label) {
                  <div class="skill-row">
                    <b>{{ s.label }}</b>
                    <span>{{ s.value }}</span>
                  </div>
                }
              </div>
            </section>

            <section class="cv-section">
              <h2>Experience</h2>
              @for (e of experience; track e.role) {
                <div class="exp">
                  <header>
                    <div>
                      <b>{{ e.role }}</b>
                      <span> — {{ e.company }}</span>
                    </div>
                    <small>{{ e.period }}</small>
                  </header>
                  <ul>
                    @for (b of e.bullets; track b) { <li>{{ b }}</li> }
                  </ul>
                </div>
              }
            </section>

            <section class="cv-section">
              <h2>Certificates</h2>
              <ul class="certs">
                @for (c of certs; track c) { <li>{{ c }}</li> }
              </ul>
            </section>

            <section class="cv-section">
              <h2>Languages</h2>
              <ul class="langs">
                <li>Arabic — First Language</li>
                <li>English — B2</li>
              </ul>
            </section>
          </article>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .cv-wrap { height: 100%; display: grid; grid-template-rows: 52px 1fr; overflow: hidden; }

    .cv-bar {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0 20px;
      background: var(--bg-chrome);
      backdrop-filter: var(--blur-thin);
      border-bottom: 0.5px solid var(--separator);
    }
    .cv-tabs { display: flex; gap: 4px; padding: 4px; background: var(--bg-fill-2);
               border-radius: var(--r-sm); }
    .ct { padding: 6px 14px; border-radius: calc(var(--r-sm) - 4px);
          font-size: var(--fs-xs); font-weight: 500; color: var(--label-2);
          transition: all var(--t-base) var(--ease-smooth); }
    .ct.active { background: var(--bg-surface-solid); color: var(--label);
                 box-shadow: var(--shadow-xs); font-weight: 600; }
    .cv-actions { display: flex; gap: 8px; }
    .pill { padding: 7px 14px; background: var(--bg-fill); color: var(--label);
            border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600;
            text-decoration: none; transition: all var(--t-fast); cursor: pointer; }
    .pill:hover { background: var(--bg-fill-3); text-decoration: none; }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); text-decoration: none; }

    .cv-body { overflow-y: auto; background: var(--bg-root); padding: 24px; }
    .cv-frame { width: 100%; height: 100%; border: 0; border-radius: var(--r-md);
                background: #fff; }

    .cv-paper {
      max-width: 820px;
      margin: 0 auto;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
      padding: 48px 56px;
      box-shadow: var(--shadow-md);
    }

    .cv-head { padding-bottom: 22px; border-bottom: 2px solid var(--label);
               margin-bottom: 24px; }
    .cv-head h1 { font-size: var(--fs-4xl); font-weight: 800; letter-spacing: -0.03em; }
    .cv-role { font-size: var(--fs-base); color: var(--accent); font-weight: 600;
               margin-top: 6px; letter-spacing: -0.005em; }
    .cv-meta { font-size: var(--fs-xs); color: var(--label-2); margin-top: 6px; }
    .cv-meta a { color: var(--accent); }

    .cv-section { margin-bottom: 28px; }
    .cv-section h2 {
      font-size: var(--fs-xs); font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.12em;
      color: var(--label-3);
      padding-bottom: 8px;
      border-bottom: 1px solid var(--separator);
      margin-bottom: 14px;
    }
    .cv-section p { font-size: var(--fs-sm); line-height: 1.7; color: var(--label); }

    .skill-rows { display: flex; flex-direction: column; gap: 8px; }
    .skill-row {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 16px;
      font-size: var(--fs-xs);
      line-height: 1.55;
    }
    .skill-row b { font-weight: 700; color: var(--label); }
    .skill-row span { color: var(--label-2); }
    @media (max-width: 640px) { .skill-row { grid-template-columns: 1fr; gap: 2px; } }

    .exp { margin-bottom: 18px; }
    .exp header {
      display: flex; justify-content: space-between; align-items: baseline;
      margin-bottom: 6px; gap: 12px; flex-wrap: wrap;
    }
    .exp header b { font-size: var(--fs-sm); font-weight: 700; }
    .exp header span { font-size: var(--fs-sm); color: var(--label-2); }
    .exp header small { font-size: var(--fs-2xs); color: var(--label-3);
                        font-family: var(--sf-mono); }
    .exp ul { list-style: none; display: flex; flex-direction: column; gap: 5px;
              padding-left: 4px; }
    .exp ul li { font-size: var(--fs-xs); line-height: 1.6; color: var(--label-2);
                 padding-left: 18px; position: relative; }
    .exp ul li::before { content: '▸'; position: absolute; left: 0;
                         color: var(--accent); font-weight: 700; }

    .certs, .langs { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .certs li, .langs li { font-size: var(--fs-xs); color: var(--label-2);
                           padding-left: 16px; position: relative; }
    .certs li::before, .langs li::before {
      content: ''; position: absolute; left: 0; top: 7px;
      width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
    }

    @media (max-width: 640px) {
      .cv-paper { padding: 28px 22px; border-radius: var(--r-md); }
      .cv-head h1 { font-size: var(--fs-2xl); }
    }
  `],
})
export class CvViewComponent {
  readonly tab = signal<'preview' | 'embed'>('preview');

  readonly skills = [
    { label: 'Frontend', value: 'Angular, TypeScript, RxJS, NgRx, SSR, Angular Material, PrimeNG, NgBootstrap' },
    { label: 'Backend', value: 'C#, ASP.NET Core, Web API, EF Core, LINQ, Identity, JWT, SignalR, REST APIs, SQL Server' },
    { label: 'Architecture', value: 'N-Tier, Clean Architecture, OOP, SOLID, Design Patterns, DS & Algorithms' },
    { label: 'UI', value: 'HTML5, CSS3, SCSS, Tailwind, Bootstrap, Responsive, GSAP, Anime.js' },
    { label: 'Tools', value: 'Git, GitHub, Gitea, Postman, Swagger, Visual Studio, VS Code' },
  ];

  readonly experience = [
    {
      role: 'Full-Stack Developer',
      company: 'FOE — Military Service',
      period: 'Military Service · Cairo',
      bullets: [
        'End-to-end full-stack ownership: designed and built .NET back-end services and Angular front-ends for real operational systems used across military sectors.',
        'Built full-stack Angular & .NET systems for soldiers transfer orders, including document generation, API-based execution, and automated status-tracking notifications.',
        'Developed "Reminder", a full CRUD web app (Angular, Firebase, SCSS) to notify officers of soldiers locations after missions.',
        'Built enlisted-personnel management systems handling data import, nationwide distribution, and cross-sector integration.',
        'Developed tracking and reporting systems for sector operations and civilian affairs, with full CRUD functionality and structured report generation.',
        'Designed a data-normalization system to standardize and match Arabic-language records across multiple sector systems.',
      ],
    },
    {
      role: 'Full-Stack Developer',
      company: 'Freelance (Angular & ASP.NET Core)',
      period: 'Freelance',
      bullets: [
        'Afkar Platform: Built a full-stack job platform with Angular and ASP.NET Core — RESTful APIs, authentication, job browsing, and job-application workflows.',
        'Ennwy E-Commerce: Built a full-stack e-commerce application with Angular and ASP.NET Core — RESTful APIs, product management, product details, shopping cart, and responsive UI components.',
      ],
    },
    {
      role: 'Front-End Developer (Angular)',
      company: 'X-BLEND',
      period: '10/2024 – 03/2026 · Cairo',
      bullets: [
        'AR-Room: Developed a web-scraping tool in Angular to aggregate products from multiple e-commerce platforms; enhanced UI/UX with PrimeNG and SCSS, driving a 30% increase in user engagement.',
        'Al-Motafiq: Engineered interactive learning features and teacher-student portals using Angular and NgRx for state management, boosting student engagement by 25%.',
        'AZ-Accounting: Built automated financial-tracking and budget-management tools with Angular and Angular Material, reducing accounting processing time by 20%.',
        'Business Step: Designed and built a fully responsive corporate website with Angular and Bootstrap, improving the company\'s online presence and lead generation through optimized contact forms.',
        'BWT: Contributed to an Angular-based platform, focusing on a clean, maintainable codebase following SOLID principles and cross-browser compatibility.',
      ],
    },
  ];

  readonly certs = [
    'Front-End Web Development: Route IT Training Center, ITI IT Training Center, Microsoft IT Training Center',
    'Back-End Development: Route IT Training Center, ITI IT Training Center',
    'Angular Framework Expertise: Maximilian Schwarzmüller — Angular: The Complete Guide; Angular University — Advanced Angular Development (Udemy)',
  ];

  print(): void { window.print(); }
}