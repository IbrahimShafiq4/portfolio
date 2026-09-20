import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TabsService } from '../../../core/services/tabs.service';
import { ProjectsService } from '../../../core/services/projects.service';
import { PreviewHostComponent } from '../../previews/preview-host/preview-host';
import { CvViewComponent } from '../views/cv-view/cv-view';
import { FileViewComponent } from '../views/file-view/file-view';
import { WelcomeViewComponent } from '../views/welcome-view/welcome-view';

@Component({
  selector: 'app-editor-panel',
  standalone: true,
  imports: [WelcomeViewComponent, FileViewComponent, CvViewComponent, PreviewHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-ctx]': '"editor"' },
  template: `
    <div class="ep">
      @if (active(); as t) {
        @switch (t.type) {
          @case ('welcome') { <app-welcome-view /> }
          @case ('cv')      { <app-cv-view /> }
          @case ('file')    { <app-file-view [fileId]="t.fileId!" /> }
          @case ('project') {
            @if (project(); as p) {
              @if (p.demo) {
                <app-preview-host [kind]="p.demo" [projectId]="p.id" />
              } @else {
                <div class="no-demo">
                  <span>📦</span>
                  <b>{{ p.name }}</b>
                  <small>No interactive preview available</small>
                </div>
              }
            }
          }
          @default {
            <div class="no-demo">
              <span>📂</span>
              <small>Nothing to show</small>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: hidden; }
    .ep {
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      background: var(--bg-root);
      scroll-behavior: smooth;
    }
    .no-demo {
      height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px;
    }
    .no-demo span { font-size: 48px; opacity: 0.4; }
    .no-demo b { font-size: var(--fs-lg); font-weight: 700; }
    .no-demo small { font-size: var(--fs-sm); color: var(--label-2); }
  `],
})
export class EditorPanelComponent {
  private tabs = inject(TabsService);
  private svc = inject(ProjectsService);

  readonly active = computed(() => this.tabs.active());
  readonly project = computed(() => {
    const t = this.tabs.active();
    if (t?.type !== 'project' || !t.projectId) return undefined;
    return this.svc.byId(t.projectId);
  });
}