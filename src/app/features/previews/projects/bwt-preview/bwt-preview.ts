import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PreviewNavItem, PreviewShellComponent } from '../../shared/preview-shell/preview-shell';

@Component({
  selector: 'app-bwt-preview',
  standalone: true,
  imports: [PreviewShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="◆"
      title="BWT"
      subtitle="Engineering standards"
      [nav]="nav"
      [active]="active()"
      (activeChange)="active.set($any($event))"
    >
      @if (active() === 'quality') {
        <div class="quality">
          <header class="q-hero">
            <div>
              <span class="eyebrow">Code Quality</span>
              <h3>Built with <em>SOLID</em> principles</h3>
              <p>Every component tested, every function documented, every browser validated.</p>
            </div>
            <div class="q-score">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-fill-2)" stroke-width="8" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--accent)" stroke-width="8"
                        stroke-linecap="round" stroke-dasharray="327"
                        stroke-dashoffset="23" transform="rotate(-90 60 60)" />
              </svg>
              <div class="score-num">A+</div>
            </div>
          </header>

          <div class="quality-grid">
            @for (q of qualityMetrics; track q.label) {
              <article class="q-card">
                <div class="q-card-head">
                  <span class="q-icon">{{ q.icon }}</span>
                  <span class="q-status" [class.pass]="q.pass">{{ q.pass ? '✓ Pass' : '⚠ Review' }}</span>
                </div>
                <b>{{ q.label }}</b>
                <p class="q-desc">{{ q.desc }}</p>
                <div class="q-bar">
                  <div class="q-fill" [style.width.%]="q.pct" [class.pass]="q.pass"></div>
                </div>
                <span class="q-val mono">{{ q.value }}</span>
              </article>
            }
          </div>
        </div>
      } @else if (active() === 'principles') {
        <div class="principles">
          <h3>SOLID Principles</h3>
          <p class="sub">Five rules. Applied everywhere.</p>
          <div class="p-grid">
            @for (p of solidPrinciples; track p.letter) {
              <article class="p-card" [class.expanded]="expandedPrinciple() === p.letter">
                <header (click)="togglePrinciple(p.letter)">
                  <span class="p-letter">{{ p.letter }}</span>
                  <div>
                    <b>{{ p.name }}</b>
                    <small>{{ p.subtitle }}</small>
                  </div>
                  <span class="p-chevron" [class.open]="expandedPrinciple() === p.letter">▾</span>
                </header>
                @if (expandedPrinciple() === p.letter) {
                  <div class="p-body">
                    <p>{{ p.description }}</p>
                    <div class="p-code">
                      <div class="p-code-head">
                        <span class="dot-r"></span><span class="dot-y"></span><span class="dot-g"></span>
                        <span class="p-code-title">{{ p.example }}</span>
                      </div>
                      <pre>{{ p.code }}</pre>
                    </div>
                  </div>
                }
              </article>
            }
          </div>
        </div>
      } @else {
        <div class="browsers">
          <h3>Cross-Browser Support</h3>
          <p class="sub">Tested on every major browser. Every feature, every time.</p>
          <div class="b-grid">
            @for (b of browsers; track b.name) {
              <article class="b-card">
                <span class="b-icon">{{ b.icon }}</span>
                <b>{{ b.name }}</b>
                <span class="b-version mono">{{ b.version }}+</span>
                <div class="b-status" [class.pass]="b.pass">
                  {{ b.pass ? '✓ Fully supported' : '⚠ Partial support' }}
                </div>
                <div class="b-features">
                  @for (f of b.features; track f) {
                    <span class="b-feat">{{ f }}</span>
                  }
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
    .eyebrow { display: block; font-size: var(--fs-2xs); font-weight: 700;
               text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent);
               margin-bottom: 6px; }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .sub { font-size: var(--fs-sm); color: var(--label-2); margin: 4px 0 20px; }

    /* QUALITY */
    .quality { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
    .q-hero {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      padding: 32px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
      flex-wrap: wrap;
    }
    .q-hero h3 { font-size: var(--fs-3xl); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
    .q-hero h3 em { font-style: italic; font-weight: 400; color: var(--accent); }
    .q-hero p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 8px; max-width: 480px;
                line-height: 1.55; }
    .q-score { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
    .q-score svg { width: 100%; height: 100%; }
    .score-num {
      position: absolute; inset: 0;
      display: grid; place-items: center;
      font-size: var(--fs-3xl); font-weight: 900;
      letter-spacing: -0.04em;
      color: var(--accent);
    }

    .quality-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
    .q-card {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .q-card-head { display: flex; justify-content: space-between; align-items: center; }
    .q-icon { font-size: 24px; }
    .q-status {
      padding: 3px 10px;
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background: rgba(255, 149, 0, 0.15);
      color: #ff9500;
    }
    .q-status.pass { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .q-card b { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.01em; }
    .q-desc { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5; }
    .q-bar { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill);
             overflow: hidden; margin-top: 4px; }
    .q-fill { height: 100%; background: #ff9500; border-radius: var(--r-pill);
              transition: width 500ms var(--ease-out); }
    .q-fill.pass { background: #34c759; }
    .q-val { font-size: var(--fs-2xs); color: var(--label-3); text-align: right; }

    /* PRINCIPLES */
    .principles { max-width: 900px; margin: 0 auto; }
    .principles h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }

    .p-grid { display: flex; flex-direction: column; gap: 10px; }
    .p-card {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
      transition: all var(--t-base) var(--ease-smooth);
    }
    .p-card.expanded { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent-soft); }
    .p-card header {
      display: flex; align-items: center; gap: 16px;
      padding: 18px;
      cursor: pointer;
      transition: background var(--t-fast);
    }
    .p-card header:hover { background: var(--bg-hover); }
    .p-letter {
      width: 44px; height: 44px;
      display: grid; place-items: center;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: var(--r-sm);
      font-size: var(--fs-lg);
      font-weight: 900;
      letter-spacing: -0.02em;
      flex-shrink: 0;
    }
    .p-card header > div { flex: 1; }
    .p-card header b { font-size: var(--fs-base); font-weight: 700; display: block; }
    .p-card header small { font-size: var(--fs-xs); color: var(--label-2); }
    .p-chevron {
      color: var(--label-3);
      font-size: 18px;
      transition: transform var(--t-base) var(--ease-spring);
    }
    .p-chevron.open { transform: rotate(180deg); color: var(--accent); }

    .p-body {
      padding: 0 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: expandIn 320ms var(--ease-spring);
    }
    @keyframes expandIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .p-body > p { font-size: var(--fs-sm); line-height: 1.6; color: var(--label-2); }

    .p-code {
      background: var(--bg-code);
      border-radius: var(--r-sm);
      overflow: hidden;
    }
    .p-code-head {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 14px;
      background: var(--bg-fill-2);
    }
    .dot-r, .dot-y, .dot-g { width: 10px; height: 10px; border-radius: 50%; }
    .dot-r { background: #ff5f57; }
    .dot-y { background: #febc2e; }
    .dot-g { background: #28c840; }
    .p-code-title { margin-left: 8px; font-family: var(--sf-mono); font-size: var(--fs-2xs);
                    color: var(--label-2); }
    .p-code pre {
      padding: 16px 18px;
      font-family: var(--sf-mono);
      font-size: var(--fs-xs);
      line-height: 1.65;
      color: var(--label);
      overflow-x: auto;
      white-space: pre;
    }

    /* BROWSERS */
    .browsers { max-width: 1080px; margin: 0 auto; }
    .browsers h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .b-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
    .b-card {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all var(--t-base) var(--ease-spring);
    }
    .b-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .b-icon { font-size: 40px; margin-bottom: 4px; }
    .b-card b { font-size: var(--fs-base); font-weight: 700; }
    .b-version { font-size: var(--fs-2xs); color: var(--label-2); }
    .b-status {
      padding: 4px 10px;
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background: rgba(255, 149, 0, 0.15);
      color: #ff9500;
      align-self: flex-start;
    }
    .b-status.pass { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .b-features { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
    .b-feat {
      background: var(--bg-fill-2);
      padding: 2px 8px;
      border-radius: var(--r-pill);
      font-size: 10px;
      color: var(--label-2);
      font-family: var(--sf-mono);
    }
  `],
})
export class BwtPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'quality', label: 'Quality', icon: '✨' },
    { id: 'principles', label: 'Principles', icon: '📐' },
    { id: 'browsers', label: 'Browsers', icon: '🌐' },
  ];
  readonly active = signal('quality');

  readonly qualityMetrics = [
    { icon: '📘', label: 'Documentation', desc: 'All public APIs documented with TSDoc', pct: 98, value: '98%', pass: true },
    { icon: '🧪', label: 'Test coverage', desc: 'Unit + integration coverage across modules', pct: 92, value: '92%', pass: true },
    { icon: '⚡', label: 'Performance', desc: 'Lighthouse score · 4G throttled', pct: 96, value: '96', pass: true },
    { icon: '♿', label: 'Accessibility', desc: 'WCAG 2.2 AA compliance', pct: 94, value: '94', pass: true },
    { icon: '📦', label: 'Bundle size', desc: 'Total production bundle (gzip)', pct: 88, value: '142KB', pass: true },
    { icon: '🔍', label: 'Type safety', desc: 'strict mode + no any escapes', pct: 100, value: '100%', pass: true },
  ];

  readonly solidPrinciples = [
    {
      letter: 'S',
      name: 'Single Responsibility',
      subtitle: 'One reason to change',
      description: 'Every class has one job. Services handle data, components handle presentation, guards handle routing.',
      example: 'user.service.ts',
      code: `export class UserService {
  constructor(private http: HttpClient) {}

  getUser(id: string) {
    return this.http.get<User>(\`/api/users/\${id}\`);
  }
}`,
    },
    {
      letter: 'O',
      name: 'Open/Closed',
      subtitle: 'Open for extension, closed for modification',
      description: 'Add new behavior without changing existing code. Strategy pattern for payment providers, for example.',
      example: 'payment-strategy.ts',
      code: `interface PaymentStrategy {
  pay(amount: number): Promise<Receipt>;
}

class StripeStrategy implements PaymentStrategy { /* ... */ }
class PayPalStrategy implements PaymentStrategy { /* ... */ }`,
    },
    {
      letter: 'L',
      name: 'Liskov Substitution',
      subtitle: 'Subtypes must be substitutable',
      description: 'Derived classes must honor the contract of their base class. No surprise behavior.',
      example: 'repository.ts',
      code: `abstract class Repository<T> {
  abstract getById(id: string): Promise<T>;
}

class UserRepo extends Repository<User> {
  getById(id: string) { /* ... */ }
}`,
    },
    {
      letter: 'I',
      name: 'Interface Segregation',
      subtitle: 'Many small interfaces beat one fat one',
      description: 'Clients should not depend on interfaces they do not use. Split large interfaces.',
      example: 'i-user.ts',
      code: `interface IReadable<T> {
  read(id: string): Promise<T>;
}

interface IWritable<T> {
  write(item: T): Promise<void>;
}`,
    },
    {
      letter: 'D',
      name: 'Dependency Inversion',
      subtitle: 'Depend on abstractions, not concretions',
      description: 'High-level modules should not import low-level details. Inject interfaces.',
      example: 'user.component.ts',
      code: `@Component({ /* ... */ })
export class UserComponent {
  constructor(
    private userService: IUserService,
    private logger: ILogger,
  ) {}
}`,
    },
  ];

  readonly expandedPrinciple = signal('S');
  togglePrinciple(id: string): void {
    this.expandedPrinciple.update(v => v === id ? '' : id);
  }

  readonly browsers = [
    { name: 'Chrome', icon: '🌐', version: '115', features: ['CSS Nesting', 'View Transitions', ':has()'], pass: true },
    { name: 'Safari', icon: '🧭', version: '16', features: ['CSS Nesting', 'Container Queries'], pass: true },
    { name: 'Firefox', icon: '🦊', version: '115', features: ['CSS Nesting', ':has()'], pass: true },
    { name: 'Edge', icon: '◐', version: '115', features: ['CSS Nesting', 'View Transitions'], pass: true },
  ];
}