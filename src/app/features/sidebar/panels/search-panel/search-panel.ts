import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectsService } from '../../../../core/services/projects.service';
import { TabsService } from '../../../../core/services/tabs.service';
import { PanelHeaderComponent } from '../panel-header/panel-header';

@Component({
  selector: 'app-search-panel',
  standalone: true,
  imports: [FormsModule, PanelHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-panel-header eyebrow="Workspace" title="Search" />

    <div class="search">
      <div class="input-wrap">
        <svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <circle cx="9" cy="9" r="6" /><path d="m17 17-3.5-3.5" />
        </svg>
        <input
          placeholder="Projects, stack, company…"
          [ngModel]="svc.search()"
          (ngModelChange)="svc.search.set($event)"
        />
        @if (svc.search()) {
          <button class="clear" (click)="svc.search.set('')">✕</button>
        }
      </div>
    </div>

    <div class="filters">
      <select [ngModel]="svc.filterCompany()" (ngModelChange)="svc.filterCompany.set($event)">
        <option value="all">All companies</option>
        @for (c of svc.companies; track c.id) {
          <option [value]="c.id">{{ c.icon }} {{ c.name }}</option>
        }
      </select>
      <select [ngModel]="svc.filterTech()" (ngModelChange)="svc.filterTech.set($any($event))">
        <option value="all">All tech</option>
        <option value="angular">Angular only</option>
        <option value="dotnet">.NET only</option>
        <option value="both">Angular | .NET</option>
      </select>
      <select [ngModel]="svc.filterCategory()" (ngModelChange)="svc.filterCategory.set($any($event))">
        <option value="all">All categories</option>
        <option value="FullStack">Full Stack</option>
        <option value="Frontend">Frontend</option>
        <option value="Backend">Backend</option>
      </select>
    </div>

    <div class="count">{{ svc.filtered().length }} result(s)</div>

    <ul class="results">
      @for (p of svc.filtered(); track p.id) {
        <li (click)="open(p.id)">
          <div class="r-row">
            <span class="tech" [class]="p.tech">{{ techLabel(p.tech) }}</span>
            <b class="r-name">{{ p.name }}</b>
          </div>
          <p class="r-sum">{{ p.summary }}</p>
        </li>
      } @empty {
        <li class="empty">
          <span>🔍</span>
          <b>No matches</b>
          <small>Try different filters</small>
        </li>
      }
    </ul>
  `,
  styles: [`
    :host { display: block; }
    .search { padding: 0 16px 10px; }
    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--bg-input);
      border-radius: var(--r-sm);
      padding: 0 12px;
      height: 36px;
      transition: box-shadow var(--t-fast);
    }
    .input-wrap:focus-within { box-shadow: 0 0 0 2px var(--accent-soft); }
    .input-wrap .icon { width: 15px; height: 15px; color: var(--label-3); flex-shrink: 0; }
    .input-wrap input {
      flex: 1; background: transparent; border: 0; outline: none;
      padding: 0 10px;
      font-size: var(--fs-sm);
      color: var(--label);
    }
    .input-wrap input::placeholder { color: var(--label-3); }
    .clear {
      width: 20px; height: 20px;
      display: grid; place-items: center;
      border-radius: 50%;
      background: var(--bg-fill-3);
      color: var(--label-2);
      font-size: 11px;
    }
    .clear:hover { background: var(--bg-fill); color: var(--label); }

    .filters {
      padding: 0 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .filters select {
      height: 32px;
      background: var(--bg-input);
      border: 0;
      border-radius: var(--r-sm);
      padding: 0 10px;
      font-size: var(--fs-xs);
      color: var(--label);
      outline: none;
      cursor: pointer;
      transition: box-shadow var(--t-fast);
    }
    .filters select:focus { box-shadow: 0 0 0 2px var(--accent-soft); }

    .count {
      padding: 0 20px 10px;
      font-size: var(--fs-2xs);
      color: var(--label-3);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
    }

    .results { list-style: none; padding: 0 8px 24px; display: flex; flex-direction: column; gap: 4px; }
    .results li {
      padding: 10px 12px;
      border-radius: var(--r-sm);
      cursor: pointer;
      transition: background var(--t-fast) var(--ease-smooth);
    }
    .results li:hover { background: var(--bg-hover); }
    .r-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .r-name { font-size: var(--fs-sm); font-weight: 600; color: var(--label); }
    .r-sum { font-size: var(--fs-2xs); color: var(--label-2); line-height: 1.45; }

    .tech {
      font-size: 9px; font-weight: 700;
      padding: 2px 7px; border-radius: var(--r-pill);
      letter-spacing: 0.03em;
    }
    .tech.angular { background: #dd0031; color: #fff; }
    .tech.dotnet  { background: #512bd4; color: #fff; }
    .tech.both    { background: var(--accent); color: var(--accent-contrast); }

    .empty {
      padding: 40px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .empty span { font-size: 32px; opacity: 0.4; }
    .empty b { font-size: var(--fs-sm); }
    .empty small { font-size: var(--fs-xs); color: var(--label-2); }
  `],
})
export class SearchPanelComponent {
  readonly svc = inject(ProjectsService);
  private tabs = inject(TabsService);

  techLabel(t: string): string {
    return t === 'both' ? 'A | .NET' : t === 'angular' ? 'Angular' : '.NET';
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