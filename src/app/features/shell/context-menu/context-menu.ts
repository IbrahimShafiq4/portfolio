import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { ContextMenuService, ContextMenuItem } from '../../../core/services/context-menu.service';

@Component({
  selector: 'app-context-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (menu.state().open) {
      <div class="cm-backdrop"
            (click)="menu.close()"
            (contextmenu)="menu.close()"></div>
      <div class="cm"
            [style.left.px]="menu.state().x"
            [style.top.px]="menu.state().y"
            (contextmenu)="$event.preventDefault()">
        @for (item of menu.state().items; track item.id) {
          @if (item.separatorBefore) { <div class="cm-sep"></div> }
          <button
            class="cm-item"
            [class.danger]="item.danger"
            [disabled]="item.disabled"
            (click)="run(item)"
          >
            <span class="cm-icon">{{ item.icon }}</span>
            <span class="cm-label">{{ item.label }}</span>
            @if (item.shortcut) { <span class="cm-shortcut">{{ item.shortcut }}</span> }
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .cm-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9998;
    }
    .cm {
      position: fixed;
      min-width: 220px;
      max-width: 280px;
      padding: 6px;
      background: var(--bg-elevated);
      backdrop-filter: var(--blur-thick);
      -webkit-backdrop-filter: var(--blur-thick);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      box-shadow: var(--shadow-xl);
      z-index: 9999;
      animation: cmIn 200ms var(--ease-spring);
      transform-origin: top left;
    }
    @keyframes cmIn {
      from { opacity: 0; transform: scale(0.94); }
      to   { opacity: 1; transform: scale(1); }
    }
    .cm-sep {
      height: 0.5px;
      background: var(--separator);
      margin: 5px 4px;
    }
    .cm-item {
      width: 100%;
      display: grid;
      grid-template-columns: 22px 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 8px 10px;
      border-radius: var(--r-xs);
      color: var(--label);
      font-size: var(--fs-xs);
      font-weight: 500;
      text-align: left;
      transition: background var(--t-fast);
    }
    .cm-item:hover:not(:disabled) { background: var(--accent); color: var(--accent-contrast); }
    .cm-item:hover:not(:disabled) .cm-shortcut { color: rgba(255,255,255,0.75); }
    .cm-item:disabled { opacity: 0.35; cursor: not-allowed; }
    .cm-item.danger { color: #ff3b30; }
    .cm-item.danger:hover { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .cm-icon { font-size: 14px; text-align: center; }
    .cm-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cm-shortcut {
      font-family: var(--sf-mono);
      font-size: 10px;
      color: var(--label-3);
      font-weight: 600;
    }
  `],
})
export class ContextMenuComponent {
  readonly menu = inject(ContextMenuService);

  run(item: ContextMenuItem): void {
    if (item.disabled) return;
    this.menu.close();
    item.action?.();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.menu.close();
  }
}