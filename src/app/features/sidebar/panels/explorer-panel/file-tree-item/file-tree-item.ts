import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FileNode } from '../../../../../core/models/file-node.model';
import { FileSystemService } from '../../../../../core/services/filesystem.service';
import { TabsService } from '../../../../../core/services/tabs.service';

@Component({
  selector: 'app-file-tree-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="row"
      [class.active]="isActive()"
      [style.padding-left.px]="8 + depth() * 14"
      [attr.data-ctx]="'file'"
      [attr.data-ctx-id]="node().id"
      [attr.data-ctx-label]="node().name"
      (click)="handleClick()"
      [attr.aria-expanded]="node().type === 'folder' ? node().expanded : null"
    >
      @if (node().type === 'folder') {
        <span class="chev" [class.open]="node().expanded">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="m4 3 3 3-3 3" />
          </svg>
        </span>
      } @else {
        <span class="spacer"></span>
      }
      <span class="emoji">{{ node().icon }}</span>
      <span class="name">{{ displayName() }}</span>
    </button>
    @if (node().type === 'folder' && node().expanded && node().children?.length) {
      @for (c of node().children; track c.id) {
        <app-file-tree-item [node]="c" [depth]="depth() + 1" />
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .row {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border-radius: var(--r-xs);
      font-size: var(--fs-sm);
      font-weight: 500;
      color: var(--label);
      text-align: left;
      transition: background var(--t-fast) var(--ease-smooth);
      white-space: nowrap;
      overflow: hidden;
    }
    .row:hover { background: var(--bg-hover); }
    .row:active { background: var(--bg-press); }
    .row.active { background: var(--bg-selected); color: var(--accent); }
    .chev {
      width: 12px; height: 12px;
      display: grid; place-items: center;
      color: var(--label-3);
      transition: transform var(--t-base) var(--ease-spring);
    }
    .chev.open { transform: rotate(90deg); }
    .chev svg { width: 10px; height: 10px; }
    .spacer { width: 12px; }
    .emoji { font-size: 13px; line-height: 1; }
    .name { overflow: hidden; text-overflow: ellipsis; }
  `],
})
export class FileTreeItemComponent {
  node = input.required<FileNode>();
  depth = input<number>(0);

  private fs = inject(FileSystemService);
  private tabs = inject(TabsService);

  readonly displayName = computed(() => this.node().name);

  readonly isActive = computed(() => {
    const n = this.node();
    const activeId = this.tabs.activeId();
    if (n.type !== 'file') return false;
    if (n.projectId) return activeId === `project-${n.projectId}`;
    return activeId === `file-${n.id}`;
  });

  handleClick(): void {
    const n = this.node();
    if (n.type === 'folder') { this.fs.toggle(n); return; }
    if (n.projectId) {
      this.tabs.open({
        id: `project-${n.projectId}`,
        title: n.name.replace(/\.\w+$/, ''),
        icon: '🧩',
        type: 'project',
        projectId: n.projectId,
        closable: true,
      });
      return;
    }
    this.tabs.open({
      id: `file-${n.id}`,
      title: n.name,
      icon: '📄',
      type: 'file',
      fileId: n.id,
      language: n.language,
      closable: true,
    });
  }
}