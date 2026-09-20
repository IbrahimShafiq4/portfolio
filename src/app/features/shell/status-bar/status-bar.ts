import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { TabsService } from '../../../core/services/tabs.service';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="sb">
      <div class="sb-left">
        <span class="item">⑂ main</span>
        <span class="item">⟳ 0↓ 0↑</span>
        <span class="item">✕ 0 ⚠ 0</span>
      </div>
      <div class="sb-right">
        <span class="item">Ln 1, Col 1</span>
        <span class="item">Spaces: 2</span>
        <span class="item">UTF-8</span>
        <span class="item">{{ tabs.active()?.language || 'Markdown' }}</span>
        <span class="item theme">🎨 {{ theme.active().label }}</span>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: block; }
    .sb {
      height: 24px;
      background: var(--bg-status);
      color: #fff;
      font-size: 11px;
      display: flex;
      justify-content: space-between;
      padding: 0 10px;
      align-items: center;
      user-select: none;
    }
    .sb-left, .sb-right { display: flex; gap: 14px; align-items: center; }
    .item { opacity: .9; white-space: nowrap; }
    .item:hover { opacity: 1; }
    .theme { font-weight: 600; }
  `],
})
export class StatusBar {
  readonly theme = inject(ThemeService);
  readonly tabs = inject(TabsService);
}