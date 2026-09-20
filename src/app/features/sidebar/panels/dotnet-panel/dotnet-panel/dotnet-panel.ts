import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Project } from '../../../../../core/models/project.model';
import { ProjectsService } from '../../../../../core/services/projects.service';
import { TabsService } from '../../../../../core/services/tabs.service';
import { PanelHeaderComponent } from '../../panel-header/panel-header';

@Component({
  selector: 'app-dotnet-panel',
  standalone: true,
  imports: [PanelHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-panel-header
      eyebrow="Backend"
      title=".NET Projects"
      [subtitle]="total() + ' projects · ' + mvc() + ' MVC · ' + webApi() + ' Web API'"
    />

    <div class="filters">
      @for (f of filters; track f.id) {
        <button class="f-chip" [class.active]="activeFilter() === f.id" (click)="activeFilter.set(f.id)">
          <span>{{ f.icon }}</span>
          <span>{{ f.label }}</span>
          <span class="f-count">{{ countBy(f.id) }}</span>
        </button>
      }
    </div>

    <ul class="list">
      @for (p of filtered(); track p.id) {
        <li (click)="open(p.id)">
          <div class="li-head">
            <span class="type-badge" [attr.data-c]="p.category">{{ p.category }}</span>
            <b class="name">{{ p.name }}</b>
          </div>
          <p class="li-sum">{{ p.summary }}</p>
          <div class="li-stack">
            @for (s of p.stack.slice(0, 4); track s) {
              <span class="stk">{{ s }}</span>
            }
          </div>
        </li>
      } @empty {
        <li class="empty">
          <span>📭</span>
          <b>No projects</b>
          <small>Try a different filter</small>
        </li>
      }
    </ul>
  `,
  styles: [`
    :host { display: block; }
    .filters { padding: 0 12px 12px; display: flex; gap: 4px; flex-wrap: wrap; }
    .f-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 10px;
      background: var(--bg-fill-2);
      color: var(--label-2);
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-weight: 600;
      transition: all var(--t-fast);
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
    .li-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .name { font-size: var(--fs-sm); font-weight: 600; }
    .li-sum { font-size: var(--fs-2xs); color: var(--label-2); line-height: 1.45; margin-bottom: 8px; }

    .type-badge {
      font-size: 9px; font-weight: 800;
      padding: 2px 8px; border-radius: var(--r-pill);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .type-badge[data-c='MVC'] { background: rgba(175, 82, 222, 0.15); color: #af52de; }
    .type-badge[data-c='Backend'] { background: rgba(0, 122, 255, 0.15); color: #007aff; }
    .type-badge[data-c='FullStack'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }

    .li-stack { display: flex; flex-wrap: wrap; gap: 4px; }
    .stk {
      font-size: 9px;
      background: var(--bg-fill-2);
      padding: 2px 8px;
      border-radius: var(--r-pill);
      color: var(--label-2);
      font-family: var(--sf-mono);
    }

    .empty {
      padding: 60px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      cursor: default;
    }
    .empty span { font-size: 32px; opacity: 0.4; }
    .empty b { font-size: var(--fs-sm); }
    .empty small { font-size: var(--fs-xs); color: var(--label-2); }
    .empty:hover { transform: none; border-color: var(--separator); }
  `],
})
export class DotnetPanelComponent {
  readonly svc = inject(ProjectsService);
  private tabs = inject(TabsService);

  readonly activeFilter = signal<'all' | 'MVC' | 'Backend' | 'FullStack'>('all');

  readonly filters = [
    { id: 'all' as const, label: 'All', icon: '📦' },
    { id: 'MVC' as const, label: 'MVC', icon: '🎬' },
    { id: 'Backend' as const, label: 'Web API', icon: '🔌' },
    { id: 'FullStack' as const, label: 'Full Stack', icon: '🧩' },
  ];

  readonly dotnetProjects = computed<Project[]>(() =>
    this.svc.projects.filter(p => p.tech === 'dotnet' || p.tech === 'both')
  );

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.dotnetProjects();
    return this.dotnetProjects().filter(p => p.category === f);
  });

  readonly total = computed(() => this.dotnetProjects().length);
  readonly mvc = computed(() => this.dotnetProjects().filter(p => p.category === 'MVC').length);
  readonly webApi = computed(() => this.dotnetProjects().filter(p => p.category === 'Backend').length);

  countBy(id: string): number {
    if (id === 'all') return this.total();
    return this.dotnetProjects().filter(p => p.category === id).length;
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