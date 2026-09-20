import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ProjectsService } from '../../../../core/services/projects.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-file-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fv">
      @switch (kind()) {

        @case ('markdown') {
          <article class="md">
            <pre class="md-body">{{ raw() }}</pre>
          </article>
        }

        @case ('contact') {
          <div class="contact-card">
            <div class="cc-avatar">IS</div>
            <h3>{{ contact.name }}</h3>
            <p class="cc-role">{{ contact.title }}</p>
            <p class="cc-loc">📍 {{ contact.location }}</p>
            <div class="cc-links">
              <a [href]="'mailto:' + contact.email">
                <span>✉️</span><b>Email</b><span>{{ contact.email }}</span>
              </a>
              <a [href]="'tel:' + contact.phone.replace(' ', '')">
                <span>📞</span><b>Phone</b><span>{{ contact.phone }}</span>
              </a>
              <a [href]="'https://' + contact.linkedin" target="_blank" rel="noopener">
                <span>💼</span><b>LinkedIn</b><span>{{ contact.linkedin }}</span>
              </a>
              <a [href]="'https://' + contact.github" target="_blank" rel="noopener">
                <span>🐙</span><b>GitHub</b><span>{{ contact.github }}</span>
              </a>
            </div>
          </div>
        }

        @case ('themes') {
          <div class="themes-view">
            <header class="tv-head">
              <h3>Available themes & accents</h3>
              <p>Click any item to apply instantly</p>
            </header>

            <section class="tv-block">
              <span class="tv-label">Color scheme</span>
              <div class="theme-grid">
                @for (t of theme.themes; track t.id) {
                  <button
                    class="theme-card"
                    [class.active]="theme.themeId() === t.id"
                    (click)="theme.setTheme(t.id)"
                  >
                    <div class="tc-preview" [style.background]="t.preview.bg">
                      <span class="tc-accent" [style.background]="t.preview.accent"></span>
                      <span class="tc-line" [style.background]="t.preview.fg"></span>
                      <span class="tc-line short" [style.background]="t.preview.fg"></span>
                    </div>
                    <div class="tc-info">
                      <b>{{ t.label }}</b>
                      <small>{{ t.kind === 'dark' ? '🌙 Dark' : '☀️ Light' }}</small>
                    </div>
                    @if (theme.themeId() === t.id) {
                      <span class="tc-check">✓</span>
                    }
                  </button>
                }
              </div>
            </section>

            <section class="tv-block">
              <span class="tv-label">Accent color</span>
              <div class="accent-row">
                @for (a of theme.accents; track a.id) {
                  <button
                    class="accent-swatch"
                    [class.active]="theme.accent() === a.id"
                    [style.background]="a.swatch"
                    (click)="theme.setAccent(a.id)"
                    [attr.aria-label]="a.label"
                    [title]="a.label"
                  >
                    @if (theme.accent() === a.id) {
                      <svg viewBox="0 0 14 14" fill="none" stroke="#fff" stroke-width="2.2"
                           stroke-linecap="round" stroke-linejoin="round">
                        <path d="m3 7 3 3 5-6" />
                      </svg>
                    }
                  </button>
                }
              </div>
            </section>

            <section class="tv-block">
              <span class="tv-label">Raw config</span>
              <pre class="tv-raw">{{ raw() }}</pre>
            </section>
          </div>
        }

        @case ('skills') {
          <div class="skills-view">
            <header class="sk-head">
              <span class="sk-emoji">{{ skillsGroup()?.icon }}</span>
              <div>
                <h3>{{ skillsGroup()?.label }}</h3>
                <p>{{ skillsGroup()?.items?.length }} skills</p>
              </div>
            </header>
            <div class="sk-grid">
              @for (item of skillsGroup()?.items; track item; let i = $index) {
                <div class="sk-item" [style.--i]="i">
                  <span class="sk-item-icon">{{ pickIcon(item) }}</span>
                  <b>{{ item }}</b>
                  <span class="sk-bar"><span class="sk-bar-fill" [style.width.%]="skillLevel(i)"></span></span>
                  <small>{{ skillLevel(i) }}%</small>
                </div>
              }
            </div>
          </div>
        }

        @case ('gitignore') {
          <div class="gi-view">
            <header class="gi-head">
              <h3>.gitignore</h3>
              <p>{{ gitignoreLines().length }} patterns</p>
            </header>
            <ul class="gi-list">
              @for (line of gitignoreLines(); track line) {
                <li class="gi-row">
                  <span class="gi-icon">{{ line.startsWith('#') ? '💬' : '🚫' }}</span>
                  <code [class.gi-comment]="line.startsWith('#')">{{ line }}</code>
                </li>
              }
            </ul>
          </div>
        }

        @default {
          <pre class="fv-body"><code [innerHTML]="html()"></code></pre>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .fv { height: 100%; overflow-y: auto; }

    .fv-body {
      padding: 24px 28px;
      font-family: var(--sf-mono);
      font-size: var(--fs-xs);
      line-height: 1.75;
      color: var(--label);
      white-space: pre;
      overflow: auto;
      margin: 0;
    }
    :host ::ng-deep .k { color: var(--kw); }
    :host ::ng-deep .s { color: var(--str); }
    :host ::ng-deep .n { color: var(--num); }
    :host ::ng-deep .c { color: var(--cmt); font-style: italic; }

    /* MARKDOWN */
    .md { padding: 32px 48px 60px; max-width: 820px; margin: 0 auto; }
    .md-body {
      font-family: var(--sf-mono);
      font-size: var(--fs-sm);
      line-height: 1.8;
      color: var(--label);
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* CONTACT */
    .contact-card {
      max-width: 560px;
      margin: 40px auto;
      padding: 32px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
      text-align: center;
    }
    .cc-avatar {
      width: 88px; height: 88px;
      margin: 0 auto 16px;
      display: grid; place-items: center;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: 50%;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 0.02em;
    }
    .contact-card h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .cc-role { font-size: var(--fs-sm); color: var(--accent); font-weight: 600; margin: 6px 0 4px; }
    .cc-loc { font-size: var(--fs-xs); color: var(--label-2); margin-bottom: 24px; }
    .cc-links { display: flex; flex-direction: column; gap: 8px; text-align: left; }
    .cc-links a {
      display: grid;
      grid-template-columns: 24px 80px 1fr;
      gap: 12px;
      align-items: center;
      padding: 12px 16px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      color: var(--label);
      text-decoration: none;
      transition: all var(--t-fast);
      font-size: var(--fs-xs);
    }
    .cc-links a:hover { background: var(--accent-soft); }
    .cc-links span:first-child { font-size: 16px; }
    .cc-links b { font-weight: 700; color: var(--label-2); text-transform: uppercase;
                  font-size: 10px; letter-spacing: 0.06em; }
    .cc-links span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* THEMES */
    .themes-view { padding: 32px 48px 60px; max-width: 900px; margin: 0 auto;
                   display: flex; flex-direction: column; gap: 32px; }
    .tv-head h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .tv-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }
    .tv-block { display: flex; flex-direction: column; gap: 14px; }
    .tv-label {
      font-size: var(--fs-2xs); font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; color: var(--label-3);
    }

    .theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
    .theme-card {
      display: flex; align-items: center; gap: 14px;
      padding: 12px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      text-align: left;
      transition: all var(--t-base) var(--ease-spring);
      position: relative;
    }
    .theme-card:hover { border-color: var(--accent); transform: translateY(-2px); }
    .theme-card.active { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-soft); }
    .tc-preview {
      width: 60px; height: 44px;
      padding: 8px;
      border-radius: var(--r-sm);
      display: flex; flex-direction: column; gap: 4px;
      box-shadow: 0 0 0 0.5px rgba(0,0,0,0.15);
      flex-shrink: 0;
    }
    .tc-accent { width: 18px; height: 4px; border-radius: 2px; }
    .tc-line { height: 3px; border-radius: 2px; opacity: 0.65; }
    .tc-line.short { width: 60%; }
    .tc-info { flex: 1; min-width: 0; }
    .tc-info b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .tc-info small { font-size: var(--fs-2xs); color: var(--label-2); }
    .tc-check {
      width: 20px; height: 20px;
      display: grid; place-items: center;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: 50%;
      font-size: 11px;
      font-weight: 700;
    }

    .accent-row { display: flex; gap: 12px; }
    .accent-swatch {
      width: 44px; height: 44px;
      border-radius: 50%;
      display: grid; place-items: center;
      box-shadow: 0 0 0 0.5px rgba(0,0,0,0.1) inset, 0 2px 6px rgba(0,0,0,0.12);
      transition: transform var(--t-base) var(--ease-spring), box-shadow var(--t-fast);
    }
    .accent-swatch:hover { transform: scale(1.08); }
    .accent-swatch.active {
      box-shadow: 0 0 0 2px var(--bg-surface-solid), 0 0 0 3.5px var(--accent);
    }
    .accent-swatch svg { width: 18px; height: 18px; }

    .tv-raw {
      padding: 18px 20px;
      background: var(--bg-code);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      font-family: var(--sf-mono);
      font-size: var(--fs-xs);
      line-height: 1.7;
      color: var(--label);
      overflow-x: auto;
      white-space: pre;
    }

    /* SKILLS */
    .skills-view { padding: 32px 48px 60px; max-width: 900px; margin: 0 auto; }
    .sk-head { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
    .sk-emoji { font-size: 48px; }
    .sk-head h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .sk-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }
    .sk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .sk-item {
      display: grid;
      grid-template-columns: 40px 1fr 90px;
      grid-template-rows: auto auto;
      gap: 4px 14px;
      align-items: center;
      padding: 14px 16px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      animation: skIn 320ms var(--ease-spring);
      animation-delay: calc(var(--i) * 40ms);
      animation-fill-mode: both;
    }
    @keyframes skIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .sk-item-icon {
      grid-row: 1 / 3;
      width: 40px; height: 40px;
      display: grid; place-items: center;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: var(--r-sm);
      font-size: 18px;
    }
    .sk-item b { font-size: var(--fs-sm); font-weight: 700; }
    .sk-bar {
      grid-column: 2;
      height: 4px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      overflow: hidden;
    }
    .sk-bar-fill {
      display: block; height: 100%;
      background: var(--accent);
      border-radius: var(--r-pill);
      transition: width 700ms var(--ease-out);
    }
    .sk-item small {
      grid-row: 1 / 3;
      grid-column: 3;
      text-align: right;
      font-size: var(--fs-sm);
      font-weight: 800;
      color: var(--accent);
      font-variant-numeric: tabular-nums;
    }

    /* GITIGNORE */
    .gi-view { padding: 32px 48px 60px; max-width: 720px; margin: 0 auto; }
    .gi-head h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em;
                  font-family: var(--sf-mono); }
    .gi-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; margin-bottom: 24px; }
    .gi-list { list-style: none; display: flex; flex-direction: column; gap: 2px; }
    .gi-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px;
      background: var(--bg-surface-solid);
      border-radius: var(--r-xs);
      font-size: var(--fs-sm);
      transition: background var(--t-fast);
    }
    .gi-row:hover { background: var(--bg-hover); }
    .gi-icon { font-size: 14px; }
    .gi-row code { font-family: var(--sf-mono); font-size: var(--fs-xs); color: var(--label); }
    .gi-comment { color: var(--label-3); font-style: italic; }

    @media (max-width: 640px) {
      .themes-view, .skills-view, .gi-view, .md { padding: 24px 20px 40px; }
      .contact-card { margin: 20px; padding: 24px; }
    }
  `],
})
export class FileViewComponent {
  fileId = input.required<string>();
  private svc = inject(ProjectsService);
  readonly theme = inject(ThemeService);
  readonly contact = this.svc.contact;

  readonly kind = computed(() => {
    const id = this.fileId();
    if (id === 'welcome' || id === 'readme' || id === 'about') return 'markdown';
    if (id === 'contact') return 'contact';
    if (id === 'themes-cfg') return 'themes';
    if (id.startsWith('skills-')) return 'skills';
    if (id === 'gitignore') return 'gitignore';
    return 'code';
  });

  readonly skillsGroup = computed(() => {
    const id = this.fileId();
    if (!id.startsWith('skills-')) return null;
    const key = id.replace('skills-', '') as keyof typeof this.svc.skills;
    return this.svc.skills[key];
  });

  skillLevel(i: number): number {
    // يبدأ من 95% وينزل تدريجياً (مظهر طبيعي)
    return Math.max(72, 95 - i * 3);
  }

  pickIcon(item: string): string {
    const map: Record<string, string> = {
      Angular: '🅰️', TypeScript: '📘', RxJS: '⚡', NgRx: '🔮', SSR: '🖥',
      'Angular Material': '🎨', PrimeNG: '🌺', NgBootstrap: '🅱️',
      'C#': '🎯', 'ASP.NET Core': '🟪', 'Web API': '🔌', 'EF Core': '🗄',
      LINQ: '🔍', Identity: '🔐', JWT: '🔑', SignalR: '📡',
      'REST APIs': '🌐', 'SQL Server': '💾',
      'N-Tier': '🏗', 'Clean Architecture': '🧱', OOP: '🧬', SOLID: '📐',
      'Design Patterns': '🎭', 'Data Structures': '📊', Algorithms: '🧮',
      HTML5: '📄', CSS3: '🎨', SCSS: '💅', 'Tailwind CSS': '🌊',
      Bootstrap: '🅱️', 'Responsive Design': '📱', GSAP: '✨', 'Anime.js': '🎬',
      Git: '🌿', GitHub: '🐙', Gitea: '🦊', Postman: '📮',
      Swagger: '📖', 'Visual Studio': '💜', 'VS Code': '💙',
    };
    return map[item] ?? '◆';
  }

  readonly gitignoreLines = computed(() =>
    this.raw().split('\n').filter(Boolean)
  );

  readonly raw = computed<string>(() => {
    const id = this.fileId();
    const c = this.svc.contact;

    if (id === 'welcome') return this.welcomeMd();
    if (id === 'about') return this.aboutTs();
    if (id === 'contact') return JSON.stringify(c, null, 2);
    if (id === 'readme') return this.readmeMd();
    if (id === 'gitignore') {
      return `# dependencies
node_modules/
.npm

# build
dist/
out-tsc/
.angular/

# env
.env
.env.local

# editor
.vscode/
.idea/

# os
.DS_Store
Thumbs.db

# logs
*.log
npm-debug.log*`;
    }
    if (id === 'themes-cfg') {
      return JSON.stringify({
        themes: this.theme.themes.map(t => ({ id: t.id, label: t.label, kind: t.kind })),
        accents: this.theme.accents.map(a => ({ id: a.id, label: a.label, swatch: a.swatch })),
      }, null, 2);
    }
    if (id.startsWith('skills-')) {
      const key = id.replace('skills-', '') as keyof typeof this.svc.skills;
      return JSON.stringify(this.svc.skills[key], null, 2);
    }
    if (id === 'cv') return 'Open the CV tab to view the resume.';
    return `// ${id}`;
  });

  readonly html = computed(() => this.highlight(this.raw()));

  private welcomeMd(): string {
    const c = this.svc.contact;
    return `# Welcome to my portfolio

Hi, I'm **${c.name}** — ${c.title}.

I built this workspace as a fully interactive portfolio.
Everything you see is real: the file tree, the terminal,
the themes, and each project's live preview.

## Quick tour

- **⌘K** — open the command palette
- **⌘B** — toggle the sidebar
- **⌘\`** — open the terminal (try \`help\`)

## Contact

- ✉️  ${c.email}
- 📞  ${c.phone}
- 💼  ${c.linkedin}
- 🐙  ${c.github}
`;
  }

  private aboutTs(): string {
    const c = this.svc.contact;
    return `export const developer = {
  name: "${c.name}",
  title: "${c.title}",
  location: "${c.location}",
  email: "${c.email}",
  yearsOfExperience: 3,
  specialization: ["Angular", "ASP.NET Core"],
  companies: [
    "FOE — Military Service",
    "X-BLEND",
    "Freelance",
  ],
  principles: ["SOLID", "Clean Architecture", "RESTful API Design"],
  currentFocus: "Full-Stack .NET Consulting",
} as const;`;
  }

  private readmeMd(): string {
    return `# ibrahim-shafiq-portfolio

> A creative developer workspace built with Angular 22.

## ✨ Features

- VS Code-like workspace UI (title bar, activity bar, sidebar, tabs, status bar)
- 6 color themes + 5 accent colors
- Fully functional terminal with autocomplete
- Interactive live previews for 21 projects
- Command palette (⌘K)
- Full CV viewer (PDF embed + preview)
- Confidential dummy-data editor for military projects

## 🚀 Running locally

\`\`\`bash
npm install
npm start
\`\`\`

## ⌨️ Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘K / Ctrl+K | Command palette |
| ⌘B / Ctrl+B | Toggle sidebar |
| ⌘\` / Ctrl+\` | Toggle terminal |
| Esc | Close overlays |

## 🎨 Changing the theme

Open the sidebar → Themes, or run in the terminal:

\`\`\`bash
theme default-dark
accent purple
\`\`\``;
  }

  private highlight(src: string): string {
    const esc = src
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return esc
      .replace(/(&quot;[^&\n]*?&quot;|"[^"\n]*?")/g, '<span class="s">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="k">$1</span>')
      .replace(/\b(export|const|let|var|function|return|if|else|new|class|import|from|type|interface|as)\b/g, '<span class="k">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="n">$1</span>');
  }
}