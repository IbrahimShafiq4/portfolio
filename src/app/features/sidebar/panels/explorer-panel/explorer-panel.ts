import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FileSystemService } from '../../../../core/services/filesystem.service';
import { FileTreeItemComponent } from './file-tree-item/file-tree-item';

@Component({
  selector: 'app-explorer-panel',
  standalone: true,
  imports: [FileTreeItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="panel-head">
      <span class="panel-title">EXPLORER</span>
      <span class="panel-actions">
        <button title="New File">📄</button>
        <button title="New Folder">📁</button>
        <button title="Refresh">⟳</button>
      </span>
    </header>
    <div class="section">
      <div class="section-head" (click)="toggleRoot()">
        <span class="chev">{{ fs.tree()[0].expanded ? '▾' : '▸' }}</span>
        <span class="label">{{ fs.tree()[0].name }}</span>
      </div>
      @if (fs.tree()[0].expanded) {
        <div class="section-body">
          @for (child of fs.tree()[0].children; track child.id) {
            <app-file-tree-item [node]="child" [depth]="1" />
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .panel-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 12px 6px;
      font-size: 11px; letter-spacing: .5px;
      color: var(--text-muted);
      font-weight: 600;
    }
    .panel-title { font-weight: 700; }
    .panel-actions { display: flex; gap: 4px; }
    .panel-actions button {
      background: transparent; border: 0;
      color: var(--text-muted); font-size: 12px;
      padding: 2px 4px; border-radius: 3px;
    }
    .panel-actions button:hover { background: var(--bg-hover); color: var(--text); }
    .section { padding: 4px 0; }
    .section-head {
      display: flex; align-items: center; gap: 4px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .5px;
      cursor: pointer;
      text-transform: uppercase;
    }
    .section-head:hover { background: var(--bg-hover); }
    .chev { width: 14px; text-align: center; }
    .section-body { padding-left: 6px; }
  `],
})
export class ExplorerPanel {
  readonly fs = inject(FileSystemService);

  toggleRoot(): void {
    this.fs.toggle(this.fs.tree()[0]);
  }
}