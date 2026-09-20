import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TabsService } from '../../../core/services/tabs.service';
import { ProjectsService } from '../../../core/services/projects.service';

@Component({
  selector: 'app-editor-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-ctx]': '"editor"' },
  template: `
    <div class="tabs-wrap">
      <div class="tabs" role="tablist">
        @for (t of tabs.tabs(); track t.id) {
          <button
            class="tab"
            role="tab"
            [class.active]="tabs.activeId() === t.id"
            [attr.aria-selected]="tabs.activeId() === t.id"
            [attr.data-ctx]="'tab'"
            [attr.data-ctx-id]="t.id"
            [attr.data-ctx-label]="t.title"
            (click)="tabs.setActive(t.id)"
          >
            <span class="tab-icon">{{ t.icon }}</span>
            <span class="tab-title">{{ t.title }}</span>
            @if (t.closable) {
              <span class="close" role="button" tabindex="0" aria-label="Close tab"
                    (click)="close($event, t.id)" (keydown.enter)="close($event, t.id)">
                <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                  <path d="m2.5 2.5 5 5 M7.5 2.5l-5 5" />
                </svg>
              </span>
            }
          </button>
        }
      </div>

      @if (breadcrumbs().length) {
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          @for (c of breadcrumbs(); track $index; let last = $last) {
            <span class="crumb" [class.last]="last">{{ c }}</span>
            @if (!last) { <span class="crumb-sep">›</span> }
          }
        </nav>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .tabs-wrap {
      height: 44px;
      padding: 6px 12px;
      background: var(--bg-chrome);
      backdrop-filter: var(--blur-regular);
      -webkit-backdrop-filter: var(--blur-regular);
      border-bottom: 0.5px solid var(--separator);
      display: flex;
      align-items: center;
      gap: 12px;
      overflow: hidden;
    }
    .tabs {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      scrollbar-width: none;
      max-width: 60%;
    }
    .tabs::-webkit-scrollbar { display: none; }
    .tab {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 0 10px 0 12px;
      height: 32px;
      background: transparent;
      border-radius: var(--r-sm);
      color: var(--label-2);
      font-size: var(--fs-xs);
      font-weight: 500;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background var(--t-base) var(--ease-smooth),
                  color var(--t-base) var(--ease-smooth),
                  transform var(--t-fast) var(--ease-spring);
    }
    .tab:hover { background: var(--bg-hover); color: var(--label); }
    .tab:active { transform: scale(0.97); }
    .tab.active {
      background: var(--bg-surface-solid);
      color: var(--label);
      box-shadow: var(--shadow-xs);
      font-weight: 600;
    }
    .tab-icon { font-size: 12px; line-height: 1; }
    .tab-title { max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
    .close {
      width: 16px; height: 16px;
      display: grid; place-items: center;
      border-radius: var(--r-xs);
      color: var(--label-3);
      margin-left: 2px;
      transition: all var(--t-fast) var(--ease-smooth);
    }
    .close svg { width: 8px; height: 8px; }
    .close:hover { background: var(--bg-fill-3); color: var(--label); }

    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: var(--fs-2xs);
      color: var(--label-3);
      overflow: hidden;
      flex: 1;
    }
    .crumb { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .crumb.last { color: var(--label); font-weight: 600; }
    .crumb-sep { color: var(--label-4); flex-shrink: 0; }
  `],
})
export class EditorTabsComponent {
  readonly tabs = inject(TabsService);
  private projects = inject(ProjectsService);

  readonly breadcrumbs = computed(() => {
    const t = this.tabs.active();
    if (!t) return [];

    const crumbByType: Record<string, string> = {
      welcome: 'Home',
      cv: 'Resume',
      file: 'File',
      project: 'Project',
    };

    const base = crumbByType[t.type] ?? 'View';
    if (t.type === 'project' && t.projectId) {
      const p = this.projects.byId(t.projectId);
      if (p) {
        const co = this.projects.companyById(p.companyId);
        return [base, co?.name ?? '', p.name];
      }
    }
    return [base, t.title];
  });

  close(ev: Event, id: string): void {
    ev.stopPropagation();
    this.tabs.close(id);
  }
}