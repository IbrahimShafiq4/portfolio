import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FlowPlayerComponent } from '../flow-player/flow-player';
import { getFlowsFor } from '../../../../data/flows';

@Component({
  selector: 'app-flows-panel',
  standalone: true,
  imports: [FlowPlayerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (flows().length) {
      <app-flow-player [flows]="flows()" />
    } @else {
      <div class="no-flows">
        <span>🎬</span>
        <b>No demo flows yet</b>
        <small>Interactive flows for this project are being authored.</small>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .no-flows {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-align: center;
      padding: 80px 20px;
      background: var(--bg-surface-solid);
      border: 0.5px dashed var(--separator);
      border-radius: var(--r-md);
    }
    .no-flows span { font-size: 56px; opacity: 0.4; }
    .no-flows b { font-size: var(--fs-lg); font-weight: 700; }
    .no-flows small { font-size: var(--fs-sm); color: var(--label-2); }
  `],
})
export class FlowsPanelComponent {
  projectId = input.required<string>();
  readonly flows = computed(() => getFlowsFor(this.projectId()));
}