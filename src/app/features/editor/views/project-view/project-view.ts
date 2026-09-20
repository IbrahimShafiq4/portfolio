import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Project } from '../../../../core/models/project.model';
import { ProjectsService } from '../../../../core/services/projects.service';
import { MiniPreview } from '../../../previews/mini-preview/mini-preview';

@Component({
  selector: 'app-project-view',
  standalone: true,
  imports: [MiniPreview],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="pv">
      <header class="pv-head">
        <div class="pv-title-row">
          <h1>{{ project().name }}</h1>
          <span class="tech" [class]="project().tech">{{ techLabel() }}</span>
        </div>
        @if (company(); as co) {
          <div class="company" [style.borderColor]="co.color">
            <span class="co-icon">{{ co.icon }}</span>
            <div class="co-body">
              <b>{{ co.name }}</b>
              <div class="co-meta">
                @if (co.period)   { <small>{{ co.period }}</small> }
                @if (co.location) { <small>📍 {{ co.location }}</small> }
              </div>
            </div>
            @if (project().status === 'confidential') {
              <span class="conf">🔒 Confidential</span>
            }
          </div>
        }
        <p class="summary">{{ project().summary }}</p>
      </header>

      @if (project().demo) {
        <section class="sect preview">
          <h2>🎬 Live Mockup</h2>
          <app-mini-preview [kind]="project().demo!" />
        </section>
      }

      <section class="sect">
        <h2>📝 Overview</h2>
        <p class="desc">{{ project().description }}</p>
      </section>

      <div class="two-col">
        <section class="sect">
          <h2>✨ Features</h2>
          <ul class="feats">
            @for (f of project().features; track f) { <li>{{ f }}</li> }
          </ul>
        </section>

        <section class="sect">
          <h2>🛠️ Tech Stack</h2>
          <div class="stack">
            @for (s of project().stack; track s) {
              <span class="chip">{{ s }}</span>
            }
          </div>
        </section>
      </div>

      <footer class="pv-foot">
        <span class="badge" [class]="project().status">
          @switch (project().status) {
            @case ('live')         { ● Production }
            @case ('confidential') { 🔒 Confidential }
            @case ('practice')     { 🎓 Practice Project }
            @case ('archived')     { 📦 Archived }
          }
        </span>
      </footer>
    </article>
  `,
  styles: [`
    :host { display: block; }
    .pv { padding: 28px 32px 60px; max-width: 1000px; margin: 0 auto; }
    .pv-head {
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-soft);
      margin-bottom: 24px;
    }
    .pv-title-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    h1 { font-size: 28px; font-weight: 800; }
    .tech { padding: 4px 12px; border-radius: 14px; font-size: 11px; font-weight: 700; letter-spacing: .5px; }
    .tech.angular { background: #dd0031; color: #fff; }
    .tech.dotnet  { background: #512bd4; color: #fff; }
    .tech.both    { background: linear-gradient(90deg, #dd0031 0%, #dd0031 50%, #512bd4 50%, #512bd4 100%); color: #fff; }
    .company {
      display: flex; align-items: center; gap: 12px;
      background: var(--bg-card);
      border-left: 3px solid var(--accent);
      border-radius: 8px;
      padding: 10px 14px;
      margin: 14px 0 12px;
    }
    .co-icon { font-size: 22px; }
    .co-body { flex: 1; }
    .co-body b { font-size: 13px; display: block; margin-bottom: 2px; }
    .co-meta { display: flex; gap: 10px; font-size: 11px; color: var(--text-muted); }
    .conf {
      background: #f59e0b;
      color: #1a1a1a;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 10px;
    }
    .summary { font-size: 13px; color: var(--text-muted); line-height: 1.6; }
    .sect { margin-bottom: 24px; }
    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); margin-bottom: 12px; font-weight: 700; }
    .desc { font-size: 13px; line-height: 1.75; }
    .feats { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .feats li { padding-left: 20px; position: relative; font-size: 12.5px; }
    .feats li::before { content: '▸'; position: absolute; left: 0; color: var(--accent); font-weight: 700; }
    .stack { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      background: var(--bg-card);
      border: 1px solid var(--border-soft);
      padding: 4px 11px;
      border-radius: 12px;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
    }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 720px) { .two-col { grid-template-columns: 1fr; } }
    .pv-foot {
      padding-top: 20px;
      border-top: 1px solid var(--border-soft);
    }
    .badge {
      font-size: 11px;
      font-weight: 700;
      padding: 5px 12px;
      border-radius: 12px;
      letter-spacing: .3px;
    }
    .badge.live         { background: #16a34a; color: #fff; }
    .badge.confidential { background: #f59e0b; color: #1a1a1a; }
    .badge.practice     { background: #7c3aed; color: #fff; }
    .badge.archived     { background: #64748b; color: #fff; }
  `],
})
export class ProjectView {
  project = input.required<Project>();
  private svc = inject(ProjectsService);

  readonly company = computed(() => this.svc.companyById(this.project().companyId));
  readonly techLabel = computed(() => {
    const t = this.project().tech;
    return t === 'both' ? 'Angular | .NET' : t === 'angular' ? 'Angular' : '.NET';
  });
}