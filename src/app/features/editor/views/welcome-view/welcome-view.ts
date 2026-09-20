import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ProjectsService } from '../../../../core/services/projects.service';
import { TabsService } from '../../../../core/services/tabs.service';
import { LayoutService } from '../../../../core/services/layout.service';

@Component({
  selector: 'app-welcome-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wv">
      <!-- ============== HERO ============== -->
      <section class="hero">
        <div class="hero-inner">
          <div class="hero-meta">
            <span class="pill-live"><span class="pulse"></span> Available for work</span>
            <span class="sep">·</span>
            <span class="hero-loc">Cairo · GMT+2</span>
          </div>

          <h1>
            Building products<br>
            that <em>feel right</em>.
          </h1>

          <p class="hero-role">
            Full-Stack Software Engineer · <b>Angular</b> &amp; <b>.NET</b>
          </p>

          <p class="hero-summary">
            3 years of end-to-end delivery — from database schema and REST API design
            to polished, responsive interfaces. Backed by real production systems,
            clean architecture, and shipping under pressure.
          </p>

          <div class="hero-actions">
            <a class="btn primary" [href]="'mailto:' + c.email">
              <span class="ic">✉︎</span> Get in touch
            </a>
            <button class="btn" (click)="openCv()">
              <span class="ic">📄</span> View CV
            </button>
            <button class="btn" (click)="openTerminal()">
              <span class="ic">⌨︎</span> Try the terminal
            </button>
          </div>

          <div class="hero-stats">
            <div class="stat">
              <b>3<span class="plus">+</span></b>
              <small>Years shipping</small>
            </div>
            <div class="stat">
              <b>{{ svc.projects.length }}</b>
              <small>Projects delivered</small>
            </div>
            <div class="stat">
              <b>{{ svc.companies.length }}</b>
              <small>Teams & sources</small>
            </div>
            <div class="stat">
              <b>98<span class="plus">%</span></b>
              <small>Match confidence</small>
            </div>
          </div>
        </div>

        <aside class="hero-quick">
          <h4 class="quick-title">Quick access</h4>
          <div class="quick-list">
            @for (q of quickLinks; track q.label) {
              <button class="quick-item" (click)="q.action()">
                <span class="q-icon">{{ q.icon }}</span>
                <div class="q-info">
                  <b>{{ q.label }}</b>
                  <small>{{ q.hint }}</small>
                </div>
                <span class="q-arrow">→</span>
              </button>
            }
          </div>
        </aside>
      </section>

      <!-- ============== EXPERIENCE ============== -->
      <section class="block">
        <header class="block-head">
          <div>
            <span class="eyebrow">Experience</span>
            <h2>Where I've <em>shipped code</em></h2>
          </div>
          <span class="block-meta">{{ svc.companies.length }} sources · {{ svc.projects.length }} projects</span>
        </header>

        <div class="exp-grid">
          @for (co of svc.companies; track co.id) {
            <article class="co-card" [style.--co]="co.color">
              <header class="co-top">
                <span class="co-icon">{{ co.icon }}</span>
                <div class="co-meta">
                  <b>{{ co.name }}</b>
                  @if (co.period) { <small>{{ co.period }}</small> }
                  @if (co.location) { <small>📍 {{ co.location }}</small> }
                </div>
                <span class="co-count">{{ svc.countByCompany(co.id) }}</span>
              </header>

              @if (co.note) {
                <p class="co-note">🔒 {{ co.note }}</p>
              }

              <div class="co-projects">
                @for (p of projectsOf(co.id); track p.id) {
                  <button class="proj-chip" (click)="open(p.id)">
                    <span class="chip-dot"></span>
                    <span>{{ p.name }}</span>
                  </button>
                }
              </div>
            </article>
          }
        </div>
      </section>

      <!-- ============== SKILLS ============== -->
      <section class="block">
        <header class="block-head">
          <div>
            <span class="eyebrow">Toolbox</span>
            <h2>What I <em>build with</em></h2>
          </div>
        </header>

        <div class="skills-grid">
          @for (g of skillGroups; track g.key) {
            <div class="sk-card">
              <div class="sk-head">
                <span class="sk-icon">{{ g.icon }}</span>
                <b>{{ g.label }}</b>
                <span class="sk-count">{{ g.items.length }}</span>
              </div>
              <div class="sk-items">
                @for (i of g.items; track i) {
                  <span class="sk-chip">{{ i }}</span>
                }
              </div>
            </div>
          }
        </div>
      </section>

      <!-- ============== FEATURED PROJECTS ============== -->
      <section class="block">
        <header class="block-head">
          <div>
            <span class="eyebrow">Selected work</span>
            <h2>Featured <em>projects</em></h2>
          </div>
          <button class="block-link" (click)="openExplorer()">View all {{ svc.projects.length }} →</button>
        </header>

        <div class="feat-grid">
          @for (p of featured; track p.id) {
            <button class="feat"
                data-ctx="project"
                [attr.data-ctx-id]="p.id"
                [attr.data-ctx-label]="p.name"
                (click)="open(p.id)">
              <div class="feat-head">
                <span class="tech" [class]="p.tech">{{ techLabel(p.tech) }}</span>
                @if (p.status === 'confidential') { <span class="conf-mini">🔒</span> }
              </div>
              <h3 class="feat-name">{{ p.name }}</h3>
              <p class="feat-sum">{{ p.summary }}</p>
              <div class="feat-stack">
                @for (s of p.stack.slice(0, 4); track s) {
                  <span class="fs-chip">{{ s }}</span>
                }
                @if (p.stack.length > 4) {
                  <span class="fs-chip more">+{{ p.stack.length - 4 }}</span>
                }
              </div>
              <div class="feat-foot">
                <span class="feat-open">Open preview →</span>
              </div>
            </button>
          }
        </div>
      </section>

      <!-- ============== PROJECT INDEX ============== -->
      <section class="block">
        <header class="block-head">
          <div>
            <span class="eyebrow">Full index</span>
            <h2>Every <em>project</em></h2>
          </div>
          <div class="index-tabs">
            @for (t of indexFilters; track t.id) {
              <button class="idx-tab" [class.active]="indexFilter() === t.id" (click)="indexFilter.set(t.id)">
                {{ t.label }}
                <span class="idx-count">{{ countByFilter(t.id) }}</span>
              </button>
            }
          </div>
        </header>

        <div class="index-table">
          @for (p of filteredIndex(); track p.id) {
            <button class="idx-row"
        data-ctx="project"
        [attr.data-ctx-id]="p.id"
        [attr.data-ctx-label]="p.name"
        (click)="open(p.id)">
              <span class="idx-tech" [class]="p.tech">{{ techLabel(p.tech) }}</span>
              <span class="idx-name">{{ p.name }}</span>
              <span class="idx-company">{{ companyName(p.companyId) }}</span>
              <span class="idx-status" [class]="p.status">{{ statusLabel(p.status) }}</span>
              <span class="idx-arrow">→</span>
            </button>
          }
        </div>
      </section>

      <!-- ============== FOOTER ============== -->
      <footer class="foot">
        <div class="foot-contacts">
          <a class="foot-link" [href]="'mailto:' + c.email">
            <span>✉︎</span> {{ c.email }}
          </a>
          <a class="foot-link" [href]="'tel:' + c.phone.replace(' ', '')">
            <span>☎︎</span> {{ c.phone }}
          </a>
          <a class="foot-link" [href]="'https://' + c.github" target="_blank" rel="noopener">
            <span>⌨︎</span> GitHub
          </a>
          <a class="foot-link" [href]="'https://' + c.linkedin" target="_blank" rel="noopener">
            <span>💼</span> LinkedIn
          </a>
        </div>
        <div class="foot-hints">
          <span class="hint"><kbd>⌘K</kbd> palette</span>
          <span class="dot">·</span>
          <span class="hint"><kbd>⌘B</kbd> sidebar</span>
          <span class="dot">·</span>
          <span class="hint"><kbd>⌘\`</kbd> terminal</span>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .wv { padding: 44px 48px 80px; max-width: 1180px; margin: 0 auto; }

    /* ====== HERO ====== */
    .hero {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 48px;
      margin-bottom: 72px;
      align-items: flex-start;
    }
    @media (max-width: 980px) {
      .hero { grid-template-columns: 1fr; gap: 40px; }
    }

    .hero-inner { min-width: 0; }
    .hero-meta {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .pill-live {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 14px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      font-size: var(--fs-xs);
      font-weight: 500;
      color: var(--label);
    }
    .pulse {
      width: 7px; height: 7px; border-radius: 50%;
      background: #34c759;
      box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.22);
      animation: breathe 2s ease-in-out infinite;
    }
    @keyframes breathe {
      0%, 100% { box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.22); }
      50% { box-shadow: 0 0 0 6px rgba(52, 199, 89, 0.05); }
    }
    .sep { color: var(--label-4); }
    .hero-loc { font-size: var(--fs-xs); color: var(--label-2); }

    h1 {
      font-size: clamp(40px, 6vw, 68px);
      font-weight: 800;
      letter-spacing: -0.045em;
      line-height: 0.98;
      margin-bottom: 16px;
    }
    h1 em {
      font-style: italic;
      font-weight: 300;
      color: var(--accent);
    }

    .hero-role {
      font-size: var(--fs-md);
      color: var(--label-2);
      font-weight: 500;
      margin-bottom: 20px;
      letter-spacing: -0.01em;
    }
    .hero-role b { color: var(--label); font-weight: 700; }

    .hero-summary {
      font-size: var(--fs-base);
      line-height: 1.65;
      color: var(--label-2);
      max-width: 600px;
      margin-bottom: 28px;
    }

    .hero-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 40px; }
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 11px 20px;
      border-radius: var(--r-pill);
      font-size: var(--fs-sm);
      font-weight: 600;
      background: var(--bg-fill-2);
      color: var(--label);
      text-decoration: none;
      transition: all var(--t-base) var(--ease-spring);
      cursor: pointer;
      border: 0;
      font-family: inherit;
    }
    .btn:hover { background: var(--bg-fill-3); transform: translateY(-1px); }
    .btn.primary { background: var(--accent); color: var(--accent-contrast); }
    .btn.primary:hover { background: var(--accent-hover); }
    .ic { font-size: 15px; }

    .hero-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      padding-top: 28px;
      border-top: 0.5px solid var(--separator);
    }
    @media (max-width: 640px) { .hero-stats { grid-template-columns: repeat(2, 1fr); gap: 20px; } }
    .stat b {
      font-size: var(--fs-3xl);
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      display: block;
    }
    .stat .plus { color: var(--accent); font-weight: 500; }
    .stat small {
      display: block;
      font-size: var(--fs-2xs);
      color: var(--label-3);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
      margin-top: 6px;
    }

    /* Quick access card */
    .hero-quick {
      padding: 22px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
      position: sticky;
      top: 20px;
    }
    @media (max-width: 980px) { .hero-quick { position: static; } }
    .quick-title {
      font-size: var(--fs-2xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--label-3);
      margin-bottom: 14px;
    }
    .quick-list { display: flex; flex-direction: column; gap: 4px; }
    .quick-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 10px;
      border-radius: var(--r-sm);
      text-align: left;
      transition: all var(--t-fast) var(--ease-smooth);
    }
    .quick-item:hover { background: var(--bg-hover); }
    .q-icon { font-size: 18px; }
    .q-info { flex: 1; min-width: 0; }
    .q-info b { font-size: var(--fs-xs); font-weight: 600; display: block; }
    .q-info small { font-size: var(--fs-2xs); color: var(--label-2); }
    .q-arrow { color: var(--label-3); font-weight: 700;
               transition: transform var(--t-fast) var(--ease-spring); }
    .quick-item:hover .q-arrow { transform: translateX(3px); color: var(--accent); }

    /* ====== BLOCKS ====== */
    .block { margin-bottom: 72px; }
    .block-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }
    .eyebrow {
      display: block;
      font-size: var(--fs-2xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--accent);
      margin-bottom: 8px;
    }
    .block-head h2 {
      font-size: clamp(24px, 3vw, 34px);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.15;
    }
    .block-head h2 em { font-style: italic; font-weight: 300; color: var(--label-2); }
    .block-meta { font-size: var(--fs-2xs); color: var(--label-3);
                  font-family: var(--sf-mono); }
    .block-link {
      font-size: var(--fs-xs);
      font-weight: 600;
      color: var(--accent);
      padding: 6px 0;
      transition: opacity var(--t-fast);
    }
    .block-link:hover { opacity: 0.7; }

    /* ====== EXPERIENCE ====== */
    .exp-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
    .co-card {
      position: relative;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      padding: 20px;
      overflow: hidden;
      transition: all var(--t-base) var(--ease-spring);
    }
    .co-card::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 3px;
      background: var(--co);
    }
    .co-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

    .co-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .co-icon { font-size: 26px; }
    .co-meta { flex: 1; min-width: 0; }
    .co-meta b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .co-meta small { font-size: var(--fs-2xs); color: var(--label-2); display: block; margin-top: 1px; }
    .co-count {
      background: var(--co);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: var(--r-pill);
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }
    .co-note {
      font-size: var(--fs-2xs);
      color: var(--label-2);
      font-style: italic;
      padding: 8px 10px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      margin-bottom: 12px;
    }
    .co-projects { display: flex; flex-wrap: wrap; gap: 5px; }
    .proj-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 11px;
      background: var(--bg-fill-2);
      color: var(--label);
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-weight: 500;
      transition: all var(--t-fast) var(--ease-smooth);
    }
    .proj-chip:hover { background: var(--co); color: #fff; }
    .chip-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--co);
                transition: background var(--t-fast); }
    .proj-chip:hover .chip-dot { background: #fff; }

    /* ====== SKILLS ====== */
    .skills-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
    .sk-card {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      transition: all var(--t-base) var(--ease-spring);
    }
    .sk-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }
    .sk-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .sk-icon { font-size: 20px; }
    .sk-head b { font-size: var(--fs-sm); font-weight: 700; flex: 1; }
    .sk-count {
      background: var(--bg-fill-2);
      padding: 1px 8px;
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
      color: var(--label-2);
      font-variant-numeric: tabular-nums;
    }
    .sk-items { display: flex; flex-wrap: wrap; gap: 5px; }
    .sk-chip {
      background: var(--bg-fill-2);
      padding: 3px 10px;
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-family: var(--sf-mono);
      color: var(--label-2);
      transition: all var(--t-fast);
    }
    .sk-chip:hover { background: var(--accent-soft); color: var(--accent); }

    /* ====== FEATURED ====== */
    .feat-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); }
    .feat {
      text-align: left;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      padding: 24px;
      color: var(--label);
      transition: all var(--t-base) var(--ease-spring);
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 220px;
    }
    .feat:hover {
      border-color: var(--accent);
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }
    .feat-head { display: flex; align-items: center; gap: 8px; }
    .feat-name { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.02em; }
    .feat-sum { font-size: var(--fs-sm); color: var(--label-2); line-height: 1.55; flex: 1; }
    .feat-stack { display: flex; flex-wrap: wrap; gap: 4px; }
    .fs-chip {
      font-size: 10px;
      background: var(--bg-fill-2);
      padding: 3px 9px;
      border-radius: var(--r-pill);
      font-family: var(--sf-mono);
      color: var(--label-2);
    }
    .fs-chip.more { color: var(--accent); background: var(--accent-soft); font-weight: 700; }
    .feat-foot { padding-top: 12px; border-top: 0.5px solid var(--separator); }
    .feat-open { font-size: var(--fs-2xs); color: var(--accent); font-weight: 700;
                 letter-spacing: 0.02em; }
    .conf-mini { font-size: 12px; }
    .tech {
      font-size: 10px; font-weight: 700;
      padding: 3px 9px; border-radius: var(--r-pill);
      letter-spacing: 0.03em;
    }
    .tech.angular { background: #dd0031; color: #fff; }
    .tech.dotnet  { background: #512bd4; color: #fff; }
    .tech.both    { background: var(--accent); color: var(--accent-contrast); }

    /* ====== INDEX TABLE ====== */
    .index-tabs { display: flex; gap: 4px; padding: 4px; background: var(--bg-fill-2);
                  border-radius: var(--r-sm); }
    .idx-tab {
      padding: 7px 14px;
      border-radius: calc(var(--r-sm) - 4px);
      font-size: var(--fs-xs);
      font-weight: 500;
      color: var(--label-2);
      transition: all var(--t-base) var(--ease-smooth);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .idx-tab.active {
      background: var(--bg-surface-solid);
      color: var(--label);
      box-shadow: var(--shadow-xs);
      font-weight: 600;
    }
    .idx-count {
      background: var(--bg-fill-2);
      padding: 0 6px;
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .idx-tab.active .idx-count { background: var(--accent-soft); color: var(--accent); }

    .index-table {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
    }
    .idx-row {
      width: 100%;
      display: grid;
      grid-template-columns: 100px 1.6fr 1.2fr 110px 40px;
      gap: 16px;
      padding: 14px 20px;
      align-items: center;
      text-align: left;
      border-bottom: 0.5px solid var(--separator);
      transition: background var(--t-fast);
    }
    .idx-row:last-child { border-bottom: 0; }
    .idx-row:hover { background: var(--bg-hover); }
    .idx-name { font-size: var(--fs-sm); font-weight: 600; }
    .idx-company { font-size: var(--fs-xs); color: var(--label-2); }
    .idx-status {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 3px 10px;
      border-radius: var(--r-pill);
      text-align: center;
    }
    .idx-status.live         { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .idx-status.confidential { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .idx-status.practice     { background: var(--accent-soft); color: var(--accent); }
    .idx-status.archived     { background: var(--bg-fill-2); color: var(--label-2); }
    .idx-arrow {
      text-align: right;
      color: var(--label-3);
      font-weight: 700;
      transition: transform var(--t-fast) var(--ease-spring);
    }
    .idx-row:hover .idx-arrow { color: var(--accent); transform: translateX(4px); }
    @media (max-width: 780px) {
      .idx-row { grid-template-columns: 80px 1fr auto; }
      .idx-company, .idx-status { display: none; }
    }

    /* ====== FOOTER ====== */
    .foot {
      padding-top: 40px;
      border-top: 0.5px solid var(--separator);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    .foot-contacts { display: flex; gap: 20px; flex-wrap: wrap; }
    .foot-link {
      display: inline-flex; align-items: center; gap: 7px;
      font-size: var(--fs-xs);
      color: var(--label-2);
      text-decoration: none;
      transition: color var(--t-fast);
    }
    .foot-link:hover { color: var(--accent); }
    .foot-hints { display: flex; align-items: center; gap: 10px;
                  font-size: var(--fs-2xs); color: var(--label-3); }
    .hint { display: inline-flex; align-items: center; gap: 5px; }
    .dot { color: var(--label-4); }
    kbd {
      background: var(--bg-fill-2);
      border: 0.5px solid var(--separator);
      border-bottom-width: 1.5px;
      padding: 2px 7px;
      border-radius: var(--r-xs);
      font-family: var(--sf-mono);
      font-size: 10.5px;
      color: var(--label);
      font-weight: 500;
    }

    @media (max-width: 720px) {
      .wv { padding: 28px 22px 48px; }
      .block { margin-bottom: 56px; }
      .foot { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class WelcomeViewComponent {
  readonly svc = inject(ProjectsService);
  private tabs = inject(TabsService);
  private layout = inject(LayoutService);
  readonly c = this.svc.contact;

  readonly indexFilter = signal<'all' | 'angular' | 'dotnet' | 'confidential'>('all');

  readonly indexFilters = [
    { id: 'all' as const, label: 'All' },
    { id: 'angular' as const, label: 'Angular' },
    { id: 'dotnet' as const, label: '.NET' },
    { id: 'confidential' as const, label: 'Confidential' },
  ];

  readonly skillGroups = Object.entries(this.svc.skills).map(([key, v]) => ({ key, ...v }));

  readonly featured = this.svc.projects.filter(p =>
    ['omnisocial', 'taskflow', 'transfer-orders', 'afkar', 'ar-room', 'ennwy'].includes(p.id)
  );

  readonly filteredIndex = computed(() => {
    const f = this.indexFilter();
    const all = this.svc.projects;
    if (f === 'all') return all;
    if (f === 'confidential') return all.filter(p => p.status === 'confidential');
    return all.filter(p => p.tech === f || p.tech === 'both');
  });

  readonly quickLinks = [
    { icon: '📄', label: 'View CV', hint: 'Open in a new tab', action: () => this.openCv() },
    { icon: '⌨︎', label: 'Open Terminal', hint: 'Run commands', action: () => this.layout.toggleTerminal() },
    { icon: '🎨', label: 'Change Theme', hint: 'Appearance settings', action: () => this.layout.showSidebar('themes') },
    { icon: '🏢', label: 'Browse Companies', hint: '4 sources', action: () => this.layout.showSidebar('companies') },
    { icon: '⚡', label: 'View Skills', hint: 'Full tech stack', action: () => this.layout.showSidebar('skills') },
  ];

  projectsOf(companyId: string) {
    return this.svc.projects.filter(p => p.companyId === companyId);
  }

  companyName(id: string): string {
    return this.svc.companyById(id)?.name ?? '';
  }

  techLabel(t: string): string {
    return t === 'both' ? 'Angular | .NET' : t === 'angular' ? 'Angular' : '.NET';
  }

  statusLabel(s: string): string {
    return { live: 'Live', confidential: 'Confidential', practice: 'Practice', archived: 'Archived' }[s] ?? s;
  }

  countByFilter(id: string): number {
    if (id === 'all') return this.svc.projects.length;
    if (id === 'confidential') return this.svc.projects.filter(p => p.status === 'confidential').length;
    return this.svc.projects.filter(p => p.tech === id || p.tech === 'both').length;
  }

  open(id: string): void {
    const p = this.svc.byId(id);
    if (!p) return;
    this.tabs.open({
      id: `project-${p.id}`,
      title: p.name,
      icon: '🧩',
      type: 'project',
      projectId: p.id,
      closable: true,
    });
  }

  openCv(): void {
    this.tabs.open({
      id: 'cv',
      title: 'CV.pdf',
      icon: '📄',
      type: 'cv',
      closable: true,
    });
  }

  openTerminal(): void {
    this.layout.toggleTerminal();
  }

  openExplorer(): void {
    this.layout.toggleSidebar('explorer');
    if (this.layout.viewport() === 'mobile') {
      this.layout.mobileSidebarOpen.set(true);
    }
  }
}