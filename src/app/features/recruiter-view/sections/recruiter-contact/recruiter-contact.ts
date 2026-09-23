import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PdfService } from '../../../../core/services/pdf.service';
import { ProjectsService } from '../../../../core/services/projects.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ViewModeService } from '../../../../core/services/view-mode.service';

@Component({
  selector: 'app-recruiter-contact',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="contact">
      <div class="container">

        <header class="section-head">
          <div class="eyebrow">
            <span class="eyebrow-num">§05</span>
            <span class="eyebrow-line"></span>
            <span class="eyebrow-label">CORRESPONDENCE · LET'S TALK</span>
          </div>
          <h2 class="section-title">Ready to <em>build</em>?</h2>
        </header>

        <div class="colophon">
          <div class="col-left">
            <p class="col-lead">
              <span class="drop-cap">I</span>'m currently open to full-time roles and select freelance projects.
              Let's talk about what your team is building.
            </p>

            <div class="contacts">
              <a class="contact-row" [href]="'mailto:' + c.email">
                <span class="cr-num">01</span>
                <span class="cr-icon">✉</span>
                <span class="cr-label">EMAIL</span>
                <span class="cr-val">{{ c.email }}</span>
              </a>
              <a class="contact-row" [href]="'tel:' + c.phone.replace(' ', '')">
                <span class="cr-num">02</span>
                <span class="cr-icon">☎</span>
                <span class="cr-label">PHONE</span>
                <span class="cr-val">{{ c.phone }}</span>
              </a>
              <a class="contact-row" [href]="'https://' + c.linkedin" target="_blank" rel="noopener">
                <span class="cr-num">03</span>
                <span class="cr-icon">💼</span>
                <span class="cr-label">LINKEDIN</span>
                <span class="cr-val">{{ c.linkedin }}</span>
              </a>
              <a class="contact-row" [href]="'https://' + c.github" target="_blank" rel="noopener">
                <span class="cr-num">04</span>
                <span class="cr-icon">⌨</span>
                <span class="cr-label">GITHUB</span>
                <span class="cr-val">{{ c.github }}</span>
              </a>
            </div>
          </div>

          <div class="col-right">
            <div class="stamp">
              <div class="stamp-ring">
                <span class="stamp-top">APPROVED</span>
                <span class="stamp-center">◈</span>
                <span class="stamp-bottom">IS · 2024</span>
              </div>
            </div>

            <button class="btn-ink big" (click)="downloadPdfCv()">
              ▾ DOWNLOAD CV
            </button>

            <div class="mode-hint">
              <span class="mh-label">TECHNICAL?</span>
              <button class="mh-btn" (click)="switchToDeveloper()">
                ▸ DEV MODE (⌘⇧V)
              </button>
            </div>
          </div>
        </div>

        <footer class="mastfoot">
          <div class="mf-rule"></div>
          <div class="mf-content">
            <span>© {{ year }} {{ c.name.toUpperCase() }}</span>
            <span>◈</span>
            <span>PRINTED IN CAIRO</span>
            <span>◈</span>
            <span>ANGULAR 22 · GSAP</span>
            <span>◈</span>
            <span>EDITION № {{ edition }}</span>
          </div>
          <div class="mf-rule"></div>
        </footer>

      </div>
    </section>
  `,
  styles: [`
    /* نفس الـ styles القديمة */
    :host { display: block; }

    .contact {
      padding: 100px 24px 40px;
      background: var(--rv-bg-0);
      border-top: 3px double var(--rv-copper);
    }

    .container { max-width: 1080px; margin: 0 auto; }

    .section-head { margin-bottom: 48px; }
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
      font-size: clamp(36px, 6vw, 80px);
      line-height: 0.95;
      letter-spacing: -0.04em;
      color: var(--rv-paper);
    }
    .section-title em { font-style: italic; font-weight: 400; color: var(--rv-copper); }

    .colophon {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 48px;
      padding: 40px;
      background: var(--rv-paper);
      border: 3px solid var(--rv-ink);
      box-shadow: 8px 8px 0 0 var(--rv-red-dark);
      color: var(--rv-ink);
      align-items: start;
    }

    .col-left { display: flex; flex-direction: column; gap: 24px; }

    .col-lead {
      font-family: var(--rv-display);
      font-size: 18px;
      line-height: 1.6;
      color: var(--rv-ink-2);
    }

    .drop-cap {
      float: left;
      font-family: var(--rv-display);
      font-weight: 900;
      font-size: 56px;
      line-height: 0.8;
      padding: 6px 10px 4px 0;
      color: var(--rv-red);
    }

    .contacts {
      display: flex;
      flex-direction: column;
      gap: 0;
      border-top: 3px double var(--rv-ink);
    }

    .contact-row {
      display: grid;
      grid-template-columns: 32px 24px 90px 1fr;
      gap: 12px;
      align-items: center;
      padding: 14px 8px;
      border-bottom: 1px solid var(--rv-ink-soft);
      text-decoration: none;
      color: var(--rv-ink);
      transition: background 120ms ease-out;
    }

    .contact-row:hover {
      background: var(--rv-paper-2);
    }

    .cr-num {
      font-family: var(--rv-terminal);
      font-size: 18px;
      color: var(--rv-red);
    }

    .cr-icon { font-size: 18px; }

    .cr-label {
      font-family: var(--rv-pixel);
      font-size: 8px;
      letter-spacing: 0.12em;
      color: var(--rv-ink-soft);
    }

    .cr-val {
      font-family: var(--rv-mono);
      font-size: 12px;
      color: var(--rv-ink);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .col-right {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    .stamp {
      width: 160px;
      height: 160px;
      border: 3px dashed var(--rv-red);
      border-radius: 50%;
      display: grid;
      place-items: center;
      transform: rotate(-8deg);
      background: rgba(196, 30, 30, 0.04);
      position: relative;
    }

    .stamp::before {
      content: '';
      position: absolute;
      inset: 8px;
      border: 1px solid var(--rv-red);
      border-radius: 50%;
      opacity: 0.5;
    }

    .stamp-ring {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      font-family: var(--rv-pixel);
      color: var(--rv-red);
      text-align: center;
    }

    .stamp-top,
    .stamp-bottom {
      font-size: 10px;
      letter-spacing: 0.15em;
    }

    .stamp-center {
      font-size: 32px;
      line-height: 1;
      font-family: var(--rv-display);
    }

    .btn-ink.big {
      padding: 18px 28px;
      font-size: 11px;
      width: 100%;
      justify-content: center;
      background: var(--rv-ink);
      color: var(--rv-paper);
      border: 3px solid var(--rv-ink);
      box-shadow: 6px 6px 0 0 var(--rv-red);
      font-family: var(--rv-pixel);
      letter-spacing: 0.1em;
      cursor: pointer;
      transition: all 120ms ease-out;
    }

    .btn-ink.big:hover {
      transform: translate(-2px, -2px);
      box-shadow: 8px 8px 0 0 var(--rv-red);
    }

    .mode-hint {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: var(--rv-paper-2);
      border: 2px solid var(--rv-ink);
      width: 100%;
      text-align: center;
    }

    .mh-label {
      font-family: var(--rv-pixel);
      font-size: 9px;
      letter-spacing: 0.15em;
      color: var(--rv-ink-soft);
    }

    .mh-btn {
      font-family: var(--rv-mono);
      font-size: 11px;
      letter-spacing: 0.1em;
      color: var(--rv-red);
      background: none;
      border: none;
      cursor: pointer;
      font-weight: 700;
      padding: 4px 8px;
      transition: all 120ms;
    }

    .mh-btn:hover {
      background: var(--rv-red);
      color: var(--rv-paper);
    }

    .mastfoot {
      margin-top: 48px;
    }

    .mf-rule {
      height: 3px;
      background: repeating-linear-gradient(
        90deg,
        var(--rv-copper) 0, var(--rv-copper) 8px,
        transparent 8px, transparent 16px
      );
      margin-bottom: 12px;
    }

    .mf-content {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      font-family: var(--rv-mono);
      font-size: 10px;
      letter-spacing: 0.14em;
      color: var(--rv-copper);
      text-transform: uppercase;
      flex-wrap: wrap;
      padding: 8px 0;
    }

    @media (max-width: 780px) {
      .colophon {
        grid-template-columns: 1fr;
        gap: 32px;
        padding: 24px;
      }
      .contact-row {
        grid-template-columns: 28px 20px 70px 1fr;
        gap: 8px;
      }
      .cr-val { font-size: 11px; }
    }

    @media (max-width: 640px) {
      .contact { padding: 60px 16px 30px; }
      .colophon { padding: 20px; box-shadow: 4px 4px 0 0 var(--rv-red-dark); }
      .col-lead { font-size: 15px; }
      .drop-cap { font-size: 42px; }
      .stamp { width: 130px; height: 130px; }
      .section-title { font-size: clamp(32px, 12vw, 56px); }
      .mf-content { font-size: 9px; gap: 8px; }
    }
  `],
})
export class RecruiterContactComponent {
  readonly svc = inject(ProjectsService);
  readonly c = this.svc.contact;

  private pdf = inject(PdfService);
  private toast = inject(ToastService);
  private viewMode = inject(ViewModeService);

  readonly year = new Date().getFullYear();
  readonly edition = Math.floor(Date.now() / 86400000) % 999;

  downloadPdfCv(): void {
    const c = this.c;
    this.pdf.generate({
      title: c.name,
      subtitle: c.title,
      filename: 'Ibrahim-Shafiq-CV',
      classification: 'public',
      meta: [
        { label: 'Location', value: c.location },
        { label: 'Email', value: c.email },
        { label: 'Phone', value: c.phone },
      ],
      sections: [
        { type: 'text', title: 'Professional Summary', body: c.summary },
        {
          type: 'kpi',
          title: 'Career Highlights',
          items: [
            { label: 'Years Experience', value: '3+' },
            { label: 'Projects Shipped', value: '27' },
            { label: 'API Endpoints Built', value: '850+' },
            { label: 'Users Served', value: '12K+' },
          ],
        },
        {
          type: 'text',
          title: 'Core Skills',
          body: 'Angular · TypeScript · RxJS · NgRx · ASP.NET Core · C# · EF Core · SignalR · SQL Server · Identity/JWT · Clean Architecture · SOLID · RESTful APIs',
        },
        {
          type: 'text',
          title: 'Experience',
          body:
            'X-BLEND (10/2024 – 03/2026) — Front-End Developer (Angular)\n' +
            'FOE Military Service — Full-Stack Developer (Angular & .NET)\n' +
            'Freelance — Full-Stack Developer (Angular & ASP.NET Core)',
        },
      ],
    });
    this.toast.success('CV downloaded', 'Check your downloads folder', '📄');
  }

  switchToDeveloper(): void {
    this.viewMode.set('developer');
    this.toast.info('Switched to Developer view', 'Press ⌘⇧V to toggle back', '⌨');
  }
}