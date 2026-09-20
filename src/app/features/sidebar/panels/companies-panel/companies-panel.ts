import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProjectsService } from '../../../../core/services/projects.service';
import { TabsService } from '../../../../core/services/tabs.service';
import { PanelHeaderComponent } from '../panel-header/panel-header';

@Component({
  selector: 'app-companies-panel',
  standalone: true,
  imports: [PanelHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-panel-header eyebrow="Experience" title="Companies" />

    <div class="list">
      @for (c of svc.companies; track c.id) {
        <article class="co" [style.--co]="c.color">
          <header class="co-head">
            <span class="co-icon">{{ c.icon }}</span>
            <div class="co-info">
              <b>{{ c.name }}</b>
              @if (c.period)   { <small>{{ c.period }}</small> }
              @if (c.location) { <small>📍 {{ c.location }}</small> }
            </div>
            <span class="co-count">{{ svc.countByCompany(c.id) }}</span>
          </header>

          @if (c.note) {
            <p class="co-note">🔒 {{ c.note }}</p>
          }

          <div class="co-projects">
            @for (p of projectsOf(c.id); track p.id) {
              <button class="proj-chip" (click)="open(p.id)">
                <span class="chip-dot"></span>
                {{ p.name }}
              </button>
            }
          </div>
        </article>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .list { padding: 0 12px 24px; display: flex; flex-direction: column; gap: 10px; }

    .co {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      padding: 14px;
      position: relative;
      overflow: hidden;
      transition: transform var(--t-base) var(--ease-spring),
                  box-shadow var(--t-base) var(--ease-smooth);
    }
    .co::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 3px;
      background: var(--co);
    }
    .co:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .co-head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .co-icon { font-size: 22px; }
    .co-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .co-info b { font-size: var(--fs-sm); font-weight: 700; color: var(--label); }
    .co-info small { font-size: var(--fs-2xs); color: var(--label-2); }
    .co-count {
      background: var(--co);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: var(--r-pill);
      font-variant-numeric: tabular-nums;
    }

    .co-note {
      font-size: var(--fs-2xs);
      color: var(--label-2);
      font-style: italic;
      padding: 8px 10px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      margin-bottom: 10px;
    }

    .co-projects {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .proj-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--bg-fill-2);
      color: var(--label);
      padding: 4px 10px;
      font-size: var(--fs-2xs);
      border-radius: var(--r-pill);
      transition: all var(--t-fast) var(--ease-smooth);
      font-weight: 500;
    }
    .proj-chip:hover { background: var(--co); color: #fff; }
    .chip-dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: var(--co);
      transition: background var(--t-fast);
    }
    .proj-chip:hover .chip-dot { background: #fff; }
  `],
})
export class CompaniesPanelComponent {
  readonly svc = inject(ProjectsService);
  private tabs = inject(TabsService);

  projectsOf(companyId: string) {
    return this.svc.projects.filter(p => p.companyId === companyId);
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
}