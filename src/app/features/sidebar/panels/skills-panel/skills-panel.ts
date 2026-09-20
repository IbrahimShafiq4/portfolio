import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ProjectsService } from '../../../../core/services/projects.service';
import { PanelHeaderComponent } from '../panel-header/panel-header';

@Component({
  selector: 'app-skills-panel',
  standalone: true,
  imports: [PanelHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-panel-header eyebrow="Capabilities" title="Skills" />

    <div class="list">
      @for (group of groups; track group.key) {
        <section class="group">
          <button class="group-head" (click)="toggle(group.key)">
            <span class="chev" [class.open]="expanded()[group.key]">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="m4 3 3 3-3 3" />
              </svg>
            </span>
            <span class="icon">{{ group.icon }}</span>
            <span class="label">{{ group.label }}</span>
            <span class="badge">{{ group.items.length }}</span>
          </button>
          @if (expanded()[group.key]) {
            <div class="items">
              @for (item of group.items; track item) {
                <span class="chip">{{ item }}</span>
              }
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .list { padding: 0 12px 24px; display: flex; flex-direction: column; gap: 8px; }

    .group {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-sm);
      overflow: hidden;
    }
    .group-head {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      color: var(--label);
      font-size: var(--fs-sm);
      text-align: left;
      transition: background var(--t-fast) var(--ease-smooth);
    }
    .group-head:hover { background: var(--bg-hover); }
    .chev {
      width: 12px; height: 12px;
      color: var(--label-3);
      transition: transform var(--t-base) var(--ease-spring);
      flex-shrink: 0;
    }
    .chev.open { transform: rotate(90deg); }
    .chev svg { width: 10px; height: 10px; display: block; }
    .icon { font-size: 14px; flex-shrink: 0; }
    .label { flex: 1; font-weight: 600; }
    .badge {
      background: var(--bg-fill-2);
      padding: 1px 7px;
      border-radius: var(--r-pill);
      font-size: 10px;
      color: var(--label-2);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .items {
      padding: 8px 12px 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      border-top: 0.5px solid var(--separator);
      animation: expandIn 240ms var(--ease-spring);
    }
    @keyframes expandIn {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .chip {
      background: var(--bg-fill-2);
      padding: 3px 9px;
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-family: var(--sf-mono);
      color: var(--label-2);
      transition: all var(--t-fast);
    }
    .chip:hover { background: var(--accent-soft); color: var(--accent); }
  `],
})
export class SkillsPanelComponent {
  private svc = inject(ProjectsService);

  readonly groups = Object.entries(this.svc.skills).map(([key, val]) => ({
    key, ...val,
  }));

  readonly expanded = signal<Record<string, boolean>>({
    frontend: true,
    backend: true,
    architecture: false,
    ui: false,
    tools: false,
  });

  toggle(key: string): void {
    this.expanded.update(e => ({ ...e, [key]: !e[key] }));
  }
}