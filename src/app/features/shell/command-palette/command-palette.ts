import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommandPaletteService } from '../../../core/services/command-palette.service';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (palette.open()) {
      <div class="overlay" (click)="palette.close()">
        <div class="cp" (click)="$event.stopPropagation()">
          <input
            class="cp-input"
            placeholder="Type a command..."
            [ngModel]="palette.query()"
            (ngModelChange)="palette.query.set($event)"
            autofocus
          />
          <ul class="cp-list">
            @for (cmd of filtered(); track cmd.id) {
              <li (click)="run(cmd)">
                <span class="cp-ico">{{ cmd.icon }}</span>
                <span class="cp-label">{{ cmd.label }}</span>
                @if (cmd.hint) { <span class="cp-hint">{{ cmd.hint }}</span> }
              </li>
            } @empty {
              <li class="empty">No commands found</li>
            }
          </ul>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, .5);
      z-index: 1000;
      display: flex; align-items: flex-start; justify-content: center;
      padding-top: 12vh;
      backdrop-filter: blur(4px);
    }
    .cp {
      width: min(640px, 90vw);
      background: var(--bg-sidebar);
      border: 1px solid var(--border-soft);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, .5);
    }
    .cp-input {
      width: 100%;
      background: var(--bg-input);
      border: 0;
      border-bottom: 1px solid var(--border-soft);
      color: var(--text);
      padding: 14px 18px;
      font-size: 14px;
      outline: none;
      font-family: inherit;
    }
    .cp-list {
      max-height: 340px;
      overflow-y: auto;
      list-style: none;
    }
    .cp-list li {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 18px;
      cursor: pointer;
      font-size: 13px;
      border-bottom: 1px solid transparent;
    }
    .cp-list li:hover { background: var(--bg-hover); }
    .cp-ico { font-size: 16px; }
    .cp-label { flex: 1; }
    .cp-hint { color: var(--text-muted); font-size: 11px; }
    .empty { color: var(--text-muted); text-align: center; justify-content: center; }
  `],
})
export class CommandPalette {
  readonly palette = inject(CommandPaletteService);
  private last = signal<number>(0);

  readonly filtered = computed(() => {
    const q = this.palette.query().trim().toLowerCase();
    const all = this.palette.commands();
    if (!q) return all;
    return all.filter(c => c.label.toLowerCase().includes(q));
  });

  constructor() {
    effect(() => {
      const state = this.palette.open();
      if (state) this.last.update(n => n + 1);
    });
  }

  run(cmd: { action: () => void }): void {
    cmd.action();
    this.palette.close();
  }
}