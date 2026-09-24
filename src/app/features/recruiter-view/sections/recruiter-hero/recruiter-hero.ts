import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef,
  OnDestroy, inject, viewChild,
} from '@angular/core';
import { ProjectsService } from '../../../../core/services/projects.service';

@Component({
  selector: 'app-recruiter-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero" #hero>

      <!-- Top wire bar -->
      <div class="wirebar">
        <span class="wire-left">EST. 2022 · CAIRO</span>
        <span class="wire-center">◈ ◈ ◈</span>
        <span class="wire-right">
          EDITION № {{ edition }} · PRICE 0.00 EGP
        </span>
      </div>

      <!-- Newspaper masthead -->
      <header class="masthead">
        <h1 class="masthead-title">
          <span class="word">IBRAHIM</span>
          <span class="word accent">SHAFIQ</span>
        </h1>

        <div class="masthead-meta">
          <span class="meta-block">VOL. III</span>
          <span class="meta-dot">◆</span>
          <span class="meta-block">FULL-STACK ENGINEER</span>
          <span class="meta-dot">◆</span>
          <span class="meta-block">ANGULAR · .NET</span>
        </div>

        <p class="masthead-arabic" dir="rtl">Fullstack Engineer [ Angular | .Net ] -- Egypt, Cairo</p>
      </header>

      <div class="rv-rule">
        <span class="diamond">✦</span>
      </div>

      <!-- Two-column: article + PC case -->
      <div class="columns">

        <!-- LEFT: article -->
        <article class="article" data-rv="slide">
          <span class="article-tag">FEATURE STORY</span>

          <h2 class="article-headline">
            Engineer ships <em>27 production systems</em>
            across Egypt's tech sector.
          </h2>

          <p class="article-lead">
            <span class="drop-cap">A</span>
            cross three years, four companies, and thousands of commits,
            I've built the kind of software that quietly runs in the background —
            banking dashboards, military logistics, e-commerce checkouts, and a
            71-controller social platform.
          </p>

          <p class="article-body">
            Specialized in the <b>Angular + .NET</b> stack. Equal parts architect and
            hands-on builder. I've never shipped a project I didn't want my name on.
          </p>

          <div class="article-stats">
            @for (s of quickStats; track s.label) {
              <div class="qstat">
                <span class="qstat-num">{{ s.value }}</span>
                <span class="qstat-label">{{ s.label }}</span>
              </div>
            }
          </div>

          <div class="article-actions">
            <button class="btn-ink" (click)="scrollTo('projects')">
              ▸ READ THE WORK
            </button>
            <a class="btn-ink ghost" [href]="'mailto:' + c.email">
              ✉ HIRE ME
            </a>
          </div>
        </article>

        <!-- RIGHT: PC case -->
        <aside class="pc-case" data-rv="slide-right">
          <div class="case-head">
            <span class="led led-1"></span>
            <span class="led led-2"></span>
            <span class="led led-3"></span>
            <span class="case-title">UNIT · IS-2024</span>
          </div>

          <div class="bay">
            <div class="component">
              <span class="chip-label">CPU</span>
              <div class="cpu-die">
                <div class="cpu-core"></div>
              </div>
              <div class="spec">
                <span>3 yrs</span>
                <small>OPS</small>
              </div>
            </div>

            <div class="component">
              <span class="chip-label">GPU</span>
              <div class="gpu-pcb">
                <div class="fan"></div>
                <div class="fan"></div>
              </div>
              <div class="spec">
                <span>27</span>
                <small>SHIPS</small>
              </div>
            </div>
          </div>

          <div class="ram-slots">
            <span class="slot-label">RAM</span>
            <div class="ram-stick ram-1"><i></i><i></i><i></i></div>
            <div class="ram-stick ram-2"><i></i><i></i><i></i></div>
            <div class="ram-stick ram-3"><i></i></div>
            <div class="ram-stick ram-4 empty"></div>
          </div>

          <div class="pc-footer">
            <span class="pwr">▮ POWER</span>
            <span class="pwr rv-blink">● LIVE</span>
          </div>
        </aside>
      </div>

      <!-- Bottom banner -->
      <div class="hero-bottom" data-rv="pop">
        <span class="scroll-cue">▼ SCROLL FOR MORE ▼</span>
        <span class="bottom-meta">PRESS ⌘⇧V TO RETURN TO CODE</span>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; position: relative; }

    .hero {
      padding: 32px 24px 80px;
      max-width: 1280px;
      margin: 0 auto;
    }

    /* WIRE BAR */
    .wirebar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-top: 3px double var(--rv-copper);
      border-bottom: 1px solid var(--rv-copper);
      color: var(--rv-copper);
      font-family: var(--rv-mono);
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 32px;
    }
    .wire-center { font-size: 8px; color: var(--rv-copper-dark); }

    /* MASTHEAD */
    .masthead {
      text-align: center;
      padding: 24px 0 8px;
      position: relative;
    }

    .masthead-title {
      font-family: var(--rv-display);
      font-weight: 900;
      font-size: clamp(48px, 11vw, 128px);
      line-height: 0.86;
      letter-spacing: -0.04em;
      color: var(--rv-paper);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
    }

    .masthead-title .word {
      display: block;
      text-shadow:
        4px 4px 0 var(--rv-red-dark),
        8px 8px 0 var(--rv-ink);
    }

    .masthead-title .accent {
      color: var(--rv-copper);
      font-style: italic;
      font-weight: 400;
    }

    .masthead-meta {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 16px;
      font-family: var(--rv-mono);
      font-size: 11px;
      letter-spacing: 0.24em;
      color: var(--rv-copper);
      text-transform: uppercase;
      flex-wrap: wrap;
    }

    .meta-dot { color: var(--rv-copper-dark); }

    .masthead-arabic {
      margin-top: 12px;
      font-family: var(--rv-arabic);
      font-size: clamp(16px, 2vw, 22px);
      color: var(--rv-paper);
      opacity: 0.85;
    }

    /* COLUMNS */
    .columns {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
      gap: 40px;
      margin-top: 32px;
      align-items: start;
    }

    /* ARTICLE */
    .article {
      background: var(--rv-paper);
      border: 3px solid var(--rv-ink);
      box-shadow: 8px 8px 0 0 var(--rv-ink);
      padding: 32px 28px;
      color: var(--rv-ink);
      position: relative;
    }

    .article::before {
      content: '';
      position: absolute;
      top: 8px; left: 8px; right: 8px; bottom: 8px;
      border: 1px dashed var(--rv-ink);
      pointer-events: none;
      opacity: 0.15;
    }

    .article-tag {
      display: inline-block;
      padding: 4px 10px;
      background: var(--rv-red);
      color: var(--rv-paper);
      font-family: var(--rv-pixel);
      font-size: 8px;
      letter-spacing: 0.1em;
      margin-bottom: 20px;
    }

    .article-headline {
      font-family: var(--rv-display);
      font-weight: 900;
      font-size: clamp(24px, 3.2vw, 40px);
      line-height: 1.05;
      letter-spacing: -0.02em;
      color: var(--rv-ink);
      margin-bottom: 20px;
    }

    .article-headline em {
      font-style: italic;
      color: var(--rv-red);
      background: linear-gradient(180deg, transparent 60%, var(--rv-gold) 60%);
      padding: 0 4px;
    }

    .article-lead,
    .article-body {
      font-family: var(--rv-display);
      font-size: 16px;
      line-height: 1.65;
      color: var(--rv-ink-2);
      margin-bottom: 14px;
    }

    .article-body b { color: var(--rv-red); font-weight: 700; }

    .drop-cap {
      float: left;
      font-family: var(--rv-display);
      font-weight: 900;
      font-size: 58px;
      line-height: 0.8;
      padding: 8px 10px 4px 0;
      color: var(--rv-red);
    }

    .article-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 24px 0 20px;
      padding: 16px 0;
      border-top: 2px solid var(--rv-ink);
      border-bottom: 2px solid var(--rv-ink);
    }

    .qstat {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 2px;
      border-right: 1px solid var(--rv-ink);
    }
    .qstat:last-child { border-right: 0; }

    .qstat-num {
      font-family: var(--rv-display);
      font-weight: 900;
      font-size: 32px;
      color: var(--rv-ink);
      line-height: 1;
      letter-spacing: -0.03em;
    }

    .qstat-label {
      font-family: var(--rv-mono);
      font-size: 9px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--rv-ink-soft);
    }

    .article-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .btn-ink {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: var(--rv-ink);
      color: var(--rv-paper);
      border: 3px solid var(--rv-ink);
      font-family: var(--rv-pixel);
      font-size: 9px;
      letter-spacing: 0.08em;
      cursor: pointer;
      text-decoration: none;
      transition: transform 120ms ease-out, box-shadow 120ms ease-out;
      box-shadow: 4px 4px 0 0 var(--rv-red);
    }

    .btn-ink:hover {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0 0 var(--rv-red);
    }

    .btn-ink.ghost {
      background: var(--rv-paper);
      color: var(--rv-ink);
      box-shadow: 4px 4px 0 0 var(--rv-ink);
    }

    .btn-ink.ghost:hover {
      box-shadow: 6px 6px 0 0 var(--rv-ink);
    }

    /* PC CASE */
    .pc-case {
      background: var(--rv-bg-1);
      border: 3px solid var(--rv-copper);
      box-shadow:
        0 0 0 3px var(--rv-bg-0),
        8px 8px 0 0 var(--rv-red-dark);
      padding: 16px;
      position: sticky;
      top: 24px;
    }

    .case-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 12px;
      border-bottom: 1px dashed var(--rv-copper-dark);
      margin-bottom: 16px;
    }

    .led {
      width: 10px; height: 10px;
      border-radius: 50%;
      box-shadow: 0 0 6px currentColor;
    }
    .led-1 { background: #ff3b30; color: #ff3b30; animation: rv-blink 1.2s steps(1) infinite; }
    .led-2 { background: var(--rv-green); color: var(--rv-green); animation: rv-blink 0.8s steps(1) infinite reverse; }
    .led-3 { background: var(--rv-gold); color: var(--rv-gold); animation: rv-blink 1.6s steps(1) infinite; }

    .case-title {
      margin-left: auto;
      font-family: var(--rv-mono);
      font-size: 9px;
      letter-spacing: 0.14em;
      color: var(--rv-copper);
    }

    .bay {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    .component {
      background: var(--rv-bg-2);
      border: 2px solid var(--rv-pcb-trace);
      padding: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      position: relative;
    }

    .component::before,
    .component::after {
      content: '';
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 3px;
      background: repeating-linear-gradient(
        90deg,
        var(--rv-gold) 0, var(--rv-gold) 3px,
        transparent 3px, transparent 7px
      );
    }
    .component::before { top: -3px; }
    .component::after { bottom: -3px; }

    .chip-label {
      font-family: var(--rv-pixel);
      font-size: 8px;
      letter-spacing: 0.15em;
      color: var(--rv-copper);
    }

    .cpu-die {
      width: 64px; height: 64px;
      background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
      border: 2px solid var(--rv-gold);
      display: grid; place-items: center;
      position: relative;
      box-shadow: inset 0 0 12px rgba(212, 160, 23, 0.3);
    }

    .cpu-core {
      width: 32px; height: 32px;
      background:
        repeating-linear-gradient(0deg, var(--rv-pcb-trace) 0, var(--rv-pcb-trace) 2px, transparent 2px, transparent 4px),
        repeating-linear-gradient(90deg, var(--rv-pcb-trace) 0, var(--rv-pcb-trace) 2px, transparent 2px, transparent 4px);
      box-shadow: 0 0 8px var(--rv-green);
      animation: rv-crt-pulse 2s ease-in-out infinite;
    }

    .gpu-pcb {
      width: 70px; height: 60px;
      background: linear-gradient(180deg, #1a3a1a 0%, #0a1a0a 100%);
      border: 2px solid var(--rv-pcb-trace);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .fan {
      width: 24px; height: 24px;
      border-radius: 50%;
      background: radial-gradient(circle, #2a2a2a 20%, #0a0a0a 70%);
      border: 1px solid var(--rv-copper);
      position: relative;
      animation: rv-spin 1.4s linear infinite;
    }
    .fan::before {
      content: '';
      position: absolute;
      inset: 4px;
      background: conic-gradient(from 0deg, var(--rv-copper) 0 45deg, transparent 45deg 90deg, var(--rv-copper) 90deg 135deg, transparent 135deg 180deg, var(--rv-copper) 180deg 225deg, transparent 225deg 270deg, var(--rv-copper) 270deg 315deg, transparent 315deg 360deg);
      border-radius: 50%;
      opacity: 0.7;
    }

    .spec {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: var(--rv-terminal);
    }
    .spec span {
      font-size: 22px;
      color: var(--rv-green);
      line-height: 1;
      text-shadow: 0 0 6px var(--rv-green);
    }
    .spec small {
      font-size: 9px;
      letter-spacing: 0.12em;
      color: var(--rv-copper);
      margin-top: 2px;
    }

    /* RAM */
    .ram-slots {
      background: var(--rv-bg-2);
      border: 2px solid var(--rv-pcb-trace);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .slot-label {
      font-family: var(--rv-pixel);
      font-size: 8px;
      letter-spacing: 0.15em;
      color: var(--rv-copper);
      margin-bottom: 4px;
    }

    .ram-stick {
      display: flex;
      align-items: center;
      gap: 3px;
      height: 14px;
      padding: 0 4px;
      background: linear-gradient(180deg, #1a3a1a 0%, #0a1a0a 100%);
      border: 1px solid var(--rv-pcb-trace);
      position: relative;
    }

    .ram-stick::after {
      content: '';
      position: absolute;
      right: -6px;
      top: 3px; bottom: 3px;
      width: 5px;
      background: repeating-linear-gradient(
        180deg,
        var(--rv-gold) 0, var(--rv-gold) 1px,
        transparent 1px, transparent 2px
      );
    }

    .ram-stick.empty { opacity: 0.25; }

    .ram-stick i {
      display: block;
      width: 6px; height: 6px;
      background: var(--rv-green);
      box-shadow: 0 0 4px var(--rv-green);
    }
    .ram-stick i:nth-child(2) { background: var(--rv-copper); box-shadow: 0 0 4px var(--rv-copper); }

    .pc-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px dashed var(--rv-copper-dark);
      font-family: var(--rv-mono);
      font-size: 9px;
      letter-spacing: 0.14em;
      color: var(--rv-copper);
    }

    .pwr.rv-blink { color: var(--rv-green); text-shadow: 0 0 6px var(--rv-green); }

    /* HERO BOTTOM */
    .hero-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 48px;
      padding-top: 20px;
      border-top: 3px double var(--rv-copper);
      font-family: var(--rv-mono);
      font-size: 10px;
      letter-spacing: 0.14em;
      color: var(--rv-copper);
      flex-wrap: wrap;
      gap: 12px;
    }

    .scroll-cue {
      animation: rv-blink 1.4s steps(1) infinite;
    }

    /* RESPONSIVE */
    @media (max-width: 900px) {
      .columns { grid-template-columns: 1fr; gap: 32px; }
      .pc-case { position: static; }
    }

    @media (max-width: 640px) {
      .hero { padding: 20px 16px 60px; }
      .wirebar { font-size: 8px; padding: 6px 8px; }
      .wire-right { display: none; }
      .masthead-title { font-size: clamp(36px, 16vw, 72px); }
      .masthead-meta { font-size: 9px; gap: 8px; letter-spacing: 0.15em; }
      .article { padding: 20px 16px; box-shadow: 6px 6px 0 0 var(--rv-ink); }
      .article-headline { font-size: 22px; }
      .drop-cap { font-size: 44px; }
      .article-stats { grid-template-columns: 1fr; gap: 4px; }
      .qstat { border-right: 0; border-bottom: 1px solid var(--rv-ink); padding: 8px 0; }
      .qstat:last-child { border-bottom: 0; }
      .btn-ink { font-size: 8px; padding: 10px 14px; }
      .hero-bottom { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class RecruiterHeroComponent implements AfterViewInit, OnDestroy {
  readonly svc = inject(ProjectsService);
  readonly c = this.svc.contact;
  readonly hero = viewChild.required<ElementRef<HTMLElement>>('hero');

  readonly edition = Math.floor(Date.now() / 86400000) % 999;

  readonly quickStats = [
    { value: '03', label: 'Years' },
    { value: '27', label: 'Projects' },
    { value: '04', label: 'Companies' },
  ];

  private ctx?: any;

  async ngAfterViewInit(): Promise<void> {
    const { gsap } = await import('gsap');
    const heroEl = this.hero().nativeElement;

    this.ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.wirebar', { y: -20, opacity: 0, duration: 0.5 })
        .from('.masthead-title .word', {
          y: 60,
          opacity: 0,
          duration: 0.9,
          stagger: 0.15,
          ease: 'back.out(1.4)',
        }, '-=0.2')
        .from('.masthead-meta, .masthead-arabic', {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
        }, '-=0.4')
        .from('.rv-rule', { scaleX: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3');

      gsap.to('.cpu-core', {
        boxShadow: '0 0 20px var(--rv-green), 0 0 40px var(--rv-green)',
        duration: 1,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });
    }, heroEl);
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }

  scrollTo(id: string): void {
    const el = document.querySelector(`app-recruiter-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}