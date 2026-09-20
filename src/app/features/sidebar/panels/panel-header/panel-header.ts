import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-panel-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="ph">
      <div class="ph-main">
        @if (eyebrow()) {
          <span class="eyebrow">{{ eyebrow() }}</span>
        }
        @if (title()) {
          <h2>{{ title() }}</h2>
        }
        @if (subtitle()) {
          <p class="subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="ph-actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; }
    .ph {
      padding: 22px 20px 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      position: relative;
    }
    .ph::after {
      content: '';
      position: absolute;
      left: 20px; right: 20px;
      bottom: 0;
      height: 0.5px;
      background: var(--separator);
    }
    .ph-main { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
    .eyebrow {
      font-size: var(--fs-2xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--accent);
    }
    h2 {
      font-size: var(--fs-lg);
      font-weight: 700;
      letter-spacing: -0.021em;
      color: var(--label);
      line-height: 1.15;
      margin: 0;
    }
    .subtitle {
      font-size: var(--fs-2xs);
      color: var(--label-2);
      line-height: 1.4;
      margin-top: 2px;
    }
    .ph-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  `],
})
export class PanelHeaderComponent {
  eyebrow = input<string>('');
  title = input<string>('');
  subtitle = input<string>('');
}