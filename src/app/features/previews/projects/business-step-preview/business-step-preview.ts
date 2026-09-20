import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PreviewNavItem, PreviewShellComponent } from '../../shared/preview-shell/preview-shell';

@Component({
  selector: 'app-business-step-preview',
  standalone: true,
  imports: [PreviewShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="📈"
      title="Business Step"
      subtitle="Corporate site"
      [nav]="nav"
      [active]="active()"
    >
      @if (active() === 'home') {
        <div class="home">
          <section class="bs-hero">
            <span class="badge">✦ Consulting · Since 2015</span>
            <h1>Grow your business<br><em>with confidence</em></h1>
            <p class="lede">Strategic consulting for modern enterprises — from operations to expansion, we help you scale what matters.</p>
            <div class="hero-cta">
              <button class="pill primary">Book a call →</button>
              <button class="pill">View services</button>
            </div>
            <div class="hero-stats">
              <div><b>250+</b><small>Clients served</small></div>
              <div><b>$1.2B</b><small>Revenue influenced</small></div>
              <div><b>98%</b><small>Retention rate</small></div>
            </div>
          </section>

          <section class="bs-section">
            <span class="eyebrow">Services</span>
            <h2>How we help</h2>
            <div class="svc-grid">
              @for (s of services; track s.id) {
                <article class="svc-card">
                  <span class="svc-icon">{{ s.icon }}</span>
                  <h4>{{ s.title }}</h4>
                  <p>{{ s.desc }}</p>
                  <ul class="svc-list">
                    @for (b of s.bullets; track b) { <li>{{ b }}</li> }
                  </ul>
                </article>
              }
            </div>
          </section>

          <section class="bs-section">
            <span class="eyebrow">Process</span>
            <h2>How it works</h2>
            <div class="steps">
              @for (st of steps; track st.num) {
                <div class="step">
                  <span class="step-num">{{ st.num }}</span>
                  <div>
                    <b>{{ st.title }}</b>
                    <p>{{ st.desc }}</p>
                  </div>
                </div>
              }
            </div>
          </section>

          <section class="bs-cta">
            <h2>Ready to step up?</h2>
            <p>Get a free 30-minute consultation.</p>
            <button class="pill primary">Get in touch →</button>
          </section>
        </div>
      } @else if (active() === 'about') {
        <div class="about">
          <span class="eyebrow">About us</span>
          <h2>Built for the long game</h2>
          <p class="lede">We work with founders and executives who think in decades, not quarters.</p>
          <div class="team-grid">
            @for (t of team; track t.id) {
              <article class="team-card">
                <div class="t-photo">{{ t.name.charAt(0) }}</div>
                <b>{{ t.name }}</b>
                <small>{{ t.role }}</small>
                <p>{{ t.bio }}</p>
              </article>
            }
          </div>
        </div>
      } @else {
        <div class="contact">
          <span class="eyebrow">Contact</span>
          <h2>Let's talk</h2>
          <div class="contact-grid">
            <div class="contact-info">
              @for (c of contactChannels; track c.label) {
                <div class="ci-row">
                  <span class="ci-icon">{{ c.icon }}</span>
                  <div>
                    <b>{{ c.label }}</b>
                    <span>{{ c.value }}</span>
                  </div>
                </div>
              }
            </div>
            <form class="contact-form" (submit)="$event.preventDefault(); submitForm()">
              <label class="field">
                <span>Name</span>
                <input value="" placeholder="Your full name" required />
              </label>
              <label class="field">
                <span>Email</span>
                <input type="email" placeholder="you@company.com" required />
              </label>
              <label class="field">
                <span>Company</span>
                <input placeholder="Acme Inc." />
              </label>
              <label class="field">
                <span>Message</span>
                <textarea placeholder="Tell us about your project…" required></textarea>
              </label>
              <button class="pill primary submit-btn" type="submit">
                {{ sent() ? '✓ Sent — we\'ll be in touch' : 'Send message →' }}
              </button>
            </form>
          </div>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .pill { padding: 10px 20px; background: var(--bg-fill-2); color: var(--label);
            border-radius: var(--r-pill); font-size: var(--fs-sm); font-weight: 600;
            transition: all var(--t-fast); }
    .pill:hover { background: var(--bg-fill-3); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }
    .eyebrow { display: block; font-size: var(--fs-2xs); font-weight: 700;
               text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent);
               margin-bottom: 10px; }
    .lede { font-size: var(--fs-md); color: var(--label-2); line-height: 1.6;
            max-width: 640px; margin-top: 12px; }

    /* HOME */
    .home { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 56px; }

    .bs-hero { text-align: center; padding: 40px 20px 0; }
    .badge {
      display: inline-block;
      padding: 6px 16px;
      background: var(--bg-fill-2);
      color: var(--label-2);
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-weight: 700;
      letter-spacing: 0.06em;
      margin-bottom: 24px;
    }
    .bs-hero h1 {
      font-size: clamp(36px, 6vw, 72px);
      font-weight: 800;
      letter-spacing: -0.045em;
      line-height: 1.02;
      margin-bottom: 20px;
    }
    .bs-hero h1 em {
      font-style: italic;
      font-weight: 300;
      color: var(--accent);
    }
    .bs-hero .lede { margin: 0 auto 32px; }
    .hero-cta { display: flex; gap: 12px; justify-content: center; margin-bottom: 48px; flex-wrap: wrap; }

    .hero-stats {
      display: flex;
      justify-content: center;
      gap: 60px;
      padding: 32px 0;
      border-top: 0.5px solid var(--separator);
      border-bottom: 0.5px solid var(--separator);
      flex-wrap: wrap;
    }
    .hero-stats div { display: flex; flex-direction: column; gap: 2px; }
    .hero-stats b { font-size: var(--fs-3xl); font-weight: 800; letter-spacing: -0.04em;
                    font-variant-numeric: tabular-nums; }
    .hero-stats small { font-size: var(--fs-2xs); color: var(--label-3);
                        text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }

    .bs-section { }
    .bs-section h2 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em;
                     margin-bottom: 28px; }

    .svc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .svc-card {
      padding: 24px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      transition: all var(--t-base) var(--ease-spring);
    }
    .svc-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--accent); }
    .svc-icon { font-size: 32px; display: block; margin-bottom: 16px; }
    .svc-card h4 { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; }
    .svc-card p { font-size: var(--fs-sm); color: var(--label-2); line-height: 1.55; margin-bottom: 16px; }
    .svc-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .svc-list li {
      font-size: var(--fs-xs);
      color: var(--label-2);
      padding-left: 20px;
      position: relative;
    }
    .svc-list li::before {
      content: '✓';
      position: absolute; left: 0;
      color: var(--accent);
      font-weight: 700;
    }

    .steps { display: flex; flex-direction: column; gap: 20px; }
    .step {
      display: grid;
      grid-template-columns: 60px 1fr;
      gap: 20px;
      padding: 24px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .step-num {
      width: 60px; height: 60px;
      display: grid; place-items: center;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: var(--r-md);
      font-size: var(--fs-2xl);
      font-weight: 800;
      letter-spacing: -0.03em;
    }
    .step b { font-size: var(--fs-base); font-weight: 700; display: block; margin-bottom: 6px;
              letter-spacing: -0.015em; }
    .step p { font-size: var(--fs-sm); color: var(--label-2); line-height: 1.6; }

    .bs-cta {
      text-align: center;
      padding: 56px 32px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
    }
    .bs-cta h2 { font-size: var(--fs-3xl); font-weight: 800; letter-spacing: -0.03em; margin-bottom: 10px; }
    .bs-cta p { font-size: var(--fs-base); color: var(--label-2); margin-bottom: 24px; }

    /* ABOUT */
    .about { max-width: 1080px; margin: 0 auto; }
    .about h2 { font-size: var(--fs-3xl); font-weight: 800; letter-spacing: -0.03em;
                margin-bottom: 8px; }
    .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                 gap: 16px; margin-top: 32px; }
    .team-card {
      padding: 24px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
    }
    .t-photo {
      width: 72px; height: 72px;
      display: grid; place-items: center;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: 50%;
      font-size: var(--fs-2xl);
      font-weight: 800;
      margin-bottom: 4px;
    }
    .team-card b { font-size: var(--fs-base); font-weight: 700; }
    .team-card small { font-size: var(--fs-2xs); color: var(--accent); font-weight: 600; }
    .team-card p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5; margin-top: 8px; }

    /* CONTACT */
    .contact { max-width: 1000px; margin: 0 auto; }
    .contact h2 { font-size: var(--fs-3xl); font-weight: 800; letter-spacing: -0.03em;
                  margin-bottom: 28px; }
    .contact-grid { display: grid; grid-template-columns: 1fr 1.4fr; gap: 32px; }
    @media (max-width: 780px) { .contact-grid { grid-template-columns: 1fr; } }

    .contact-info { display: flex; flex-direction: column; gap: 20px; }
    .ci-row { display: flex; gap: 14px; align-items: flex-start; }
    .ci-icon { font-size: 22px; }
    .ci-row b { font-size: var(--fs-xs); font-weight: 700; display: block;
                text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-3);
                margin-bottom: 3px; }
    .ci-row span { font-size: var(--fs-sm); color: var(--label); }

    .contact-form {
      padding: 28px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field span { font-size: var(--fs-2xs); font-weight: 700; text-transform: uppercase;
                  letter-spacing: 0.06em; color: var(--label-3); }
    .field input, .field textarea {
      padding: 12px 14px;
      background: var(--bg-input);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-sm);
      font-size: var(--fs-sm);
      color: var(--label);
      outline: none;
      transition: border-color var(--t-fast);
      font-family: inherit;
    }
    .field input:focus, .field textarea:focus { border-color: var(--accent); }
    .field textarea { min-height: 100px; resize: vertical; }
    .submit-btn { justify-self: flex-start; align-self: flex-start; }
  `],
})
export class BusinessStepPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'home',    label: 'Home',    icon: '🏠' },
    { id: 'about',   label: 'About',   icon: '👥' },
    { id: 'contact', label: 'Contact', icon: '✉️' },
  ];
  readonly active = signal('home');
  readonly sent = signal(false);

  readonly services = [
    { id: 1, icon: '📊', title: 'Strategy Consulting',
      desc: 'Long-term planning that matches your market reality.',
      bullets: ['Market analysis', 'Growth roadmap', 'Competitive positioning'] },
    { id: 2, icon: '⚙️', title: 'Operations',
      desc: 'Streamline the way your team executes every day.',
      bullets: ['Process automation', 'Team structure', 'OKR frameworks'] },
    { id: 3, icon: '🎯', title: 'Growth & Marketing',
      desc: 'Acquire and retain customers with data-driven campaigns.',
      bullets: ['Brand positioning', 'Channel strategy', 'Analytics setup'] },
  ];

  readonly steps = [
    { num: '01', title: 'Discovery call',     desc: 'Free 30-minute conversation to understand your goals and challenges.' },
    { num: '02', title: 'Diagnostic report',  desc: 'We analyze your business and deliver a written assessment within a week.' },
    { num: '03', title: 'Strategy sprint',    desc: 'A two-week engagement where we co-design your roadmap.' },
    { num: '04', title: 'Ongoing partnership',desc: 'We stay with you through execution with monthly check-ins.' },
  ];

  readonly team = [
    { id: 1, name: 'Ahmed Hassan', role: 'Founder & CEO', bio: '15 years scaling B2B SaaS from Series A to exit.' },
    { id: 2, name: 'Sara Ibrahim', role: 'Head of Strategy', bio: 'Ex-McKinsey. Specializes in go-to-market for emerging markets.' },
    { id: 3, name: 'Khaled Nour', role: 'Operations Lead', bio: 'Built ops teams at 3 unicorn startups.' },
  ];

  readonly contactChannels = [
    { icon: '✉️', label: 'Email', value: 'hello@businessstep.co' },
    { icon: '📞', label: 'Phone', value: '+20 100 000 0000' },
    { icon: '📍', label: 'Office', value: 'Cairo, Egypt' },
    { icon: '⏰', label: 'Hours', value: 'Sun – Thu · 9am–6pm' },
  ];

  submitForm(): void {
    this.sent.set(true);
    setTimeout(() => this.sent.set(false), 2500);
  }
}