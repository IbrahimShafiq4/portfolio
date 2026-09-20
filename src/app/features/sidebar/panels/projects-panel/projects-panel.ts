import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ProjectsService } from '../../../../core/services/projects.service';
import { TabsService } from '../../../../core/services/tabs.service';
import { ProjectCategory } from '../../../../core/models/project.model';
import { PanelHeaderComponent } from '../panel-header/panel-header';

@Component({
  selector: 'app-projects-panel',
  standalone: true,
  imports: [PanelHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-panel-header eyebrow="Portfolio" title="Projects" />

    <div class="filters">
      @for (cat of categories; track cat.id) {
        <button
          class="f-chip"
          [class.active]="activeCat() === cat.id"
          (click)="activeCat.set(cat.id)"
        >
          <span>{{ cat.icon }}</span>
          <span>{{ cat.label }}</span>
          <span class="f-count">{{ countBy(cat.id) }}</span>
        </button>
      }
    </div>

    <ul class="list">
      @for (p of filtered(); track p.id) {
        <li (click)="open(p.id)">
          <div class="li-head">
            <span class="tech" [class]="p.tech">{{ techLabel(p.tech) }}</span>
            <b class="name">{{ p.name }}</b>
          </div>
          <p class="li-sum">{{ p.summary }}</p>
        </li>
      }
    </ul>
  `,
  styles: [`
    :host { display: block; }
    .filters {
      padding: 0 12px 12px;
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .f-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      background: var(--bg-fill-2);
      color: var(--label-2);
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-weight: 600;
      transition: all var(--t-fast) var(--ease-smooth);
    }
    .f-chip:hover { background: var(--bg-fill-3); color: var(--label); }
    .f-chip.active { background: var(--accent); color: var(--accent-contrast); }
    .f-count {
      background: rgba(255, 255, 255, 0.18);
      padding: 0 5px;
      border-radius: var(--r-pill);
      font-size: 9px;
      font-variant-numeric: tabular-nums;
    }

    .list { list-style: none; padding: 0 12px 24px; display: flex; flex-direction: column; gap: 6px; }
    .list li {
      padding: 12px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-sm);
      cursor: pointer;
      transition: all var(--t-base) var(--ease-smooth);
    }
    .list li:hover {
      border-color: var(--accent);
      transform: translateX(2px);
      box-shadow: var(--shadow-xs);
    }
    .li-head { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
    .name { font-size: var(--fs-sm); font-weight: 600; }
    .li-sum { font-size: var(--fs-2xs); color: var(--label-2); line-height: 1.45; }

    .tech {
      font-size: 9px; font-weight: 700;
      padding: 2px 7px; border-radius: var(--r-pill);
      letter-spacing: 0.03em;
    }
    .tech.angular { background: #dd0031; color: #fff; }
    .tech.dotnet  { background: #512bd4; color: #fff; }
    .tech.both    { background: var(--accent); color: var(--accent-contrast); }
  `],
})
export class ProjectsPanelComponent {
  readonly svc = inject(ProjectsService);
  private tabs = inject(TabsService);

  readonly activeCat = signal<ProjectCategory | 'all'>('all');

  readonly categories = [
    { id: 'all' as const, label: 'All', icon: '🗂️' },
    { id: 'FullStack' as const, label: 'Full', icon: '🧩' },
    { id: 'Frontend' as const, label: 'Frontend', icon: '🅰️' },
    { id: 'Backend' as const, label: 'Backend', icon: '🟪' },
    { id: 'MVC' as const, label: 'MVC', icon: '🟣' },
  ];

  readonly filtered = computed(() => {
    const cat = this.activeCat();
    return cat === 'all' ? this.svc.projects : this.svc.projects.filter(p => p.category === cat);
  });

  countBy(cat: ProjectCategory | 'all'): number {
    return cat === 'all' ? this.svc.projects.length : this.svc.countByCategory(cat);
  }

  techLabel(t: string): string {
    return t === 'both' ? 'A|.NET' : t === 'angular' ? 'Angular' : '.NET';
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