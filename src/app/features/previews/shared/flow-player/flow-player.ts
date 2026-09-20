import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Flow, FlowStep } from '../../../../core/models/flow.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-flow-player',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fp">
      <aside class="flows-side">
        <header class="fs-head">
          <span class="fs-eyebrow">Demo Flows</span>
          <h4>{{ flows().length }} scenarios</h4>
        </header>
        <ul class="flow-list">
          @for (f of flows(); track f.id) {
            <li>
              <button class="flow-item"
                      [class.active]="activeFlowId() === f.id"
                      (click)="selectFlow(f.id)">
                <span class="fi-icon">{{ f.icon }}</span>
                <div class="fi-body">
                  <b>{{ f.name }}</b>
                  <small>{{ f.description }}</small>
                  <div class="fi-tags">
                    @for (t of f.tags.slice(0, 3); track t) {
                      <span class="fi-tag">{{ t }}</span>
                    }
                  </div>
                </div>
                <span class="fi-diff" [attr.data-d]="f.difficulty">{{ f.difficulty }}</span>
              </button>
            </li>
          }
        </ul>
      </aside>

      @if (activeFlow(); as flow) {
        <main class="flow-stage">
          <header class="flow-head">
            <div class="fh-left">
              <span class="fh-icon">{{ flow.icon }}</span>
              <div>
                <h3>{{ flow.name }}</h3>
                <p>{{ flow.description }}</p>
                <div class="fh-meta">
                  <span class="fh-actor">👤 {{ flow.actor }}</span>
                  <span class="fh-count">{{ flow.steps.length }} steps</span>
                </div>
              </div>
            </div>
            <div class="fh-controls">
              <button class="ctrl-btn" (click)="reset()" title="Reset">↺</button>
              <button class="ctrl-btn" (click)="prev()" [disabled]="stepIndex() === 0" title="Previous">‹</button>
              <button class="ctrl-btn primary"
                      (click)="isPlaying() ? pause() : play()"
                      [title]="isPlaying() ? 'Pause' : 'Play'">
                {{ isPlaying() ? '⏸' : '▶' }}
              </button>
              <button class="ctrl-btn" (click)="next()" [disabled]="isLast()" title="Next">›</button>
            </div>
          </header>

          <section class="progress-strip">
            @for (s of flow.steps; track s.id; let i = $index) {
              <button class="ps-dot"
                      [class.done]="i < stepIndex()"
                      [class.active]="i === stepIndex()"
                      [attr.data-actor]="s.actor"
                      (click)="stepIndex.set(i)"
                      [title]="s.title">
                <span>{{ i + 1 }}</span>
              </button>
              @if (i < flow.steps.length - 1) {
                <span class="ps-line" [class.done]="i < stepIndex()"></span>
              }
            }
          </section>

          @if (currentStep(); as step) {
            <section class="step-view">
              <header class="sv-head">
                <span class="sv-index">STEP {{ stepIndex() + 1 }} / {{ flow.steps.length }}</span>
                <h4>{{ step.title }}</h4>
                <p class="sv-desc">{{ step.description }}</p>
                <div class="sv-actor">
                  <span class="sv-actor-icon">👤</span>
                  <span>{{ step.actor }}</span>
                </div>
              </header>

              <div class="sv-ui">
                <span class="sv-ui-icon">🖥</span>
                <div class="sv-ui-text">
                  <b>What the user sees</b>
                  <p>{{ step.uiDescription }}</p>
                </div>
              </div>

              <div class="sv-cols">
                <section class="sv-panel request-panel">
                  <header class="svp-head">
                    <span class="svp-method" [attr.data-m]="step.request.method">{{ step.request.method }}</span>
                    <code class="svp-route">{{ step.request.route }}</code>
                    @if (step.request.auth) {
                      <span class="svp-auth">{{ step.request.auth }}</span>
                    }
                  </header>

                  @if (step.request.headers) {
                    <div class="svp-block">
                      <span class="svp-label">Headers</span>
                      <pre class="svp-code">{{ headerJson(step.request) }}</pre>
                    </div>
                  }

                  @if (step.request.query) {
                    <div class="svp-block">
                      <span class="svp-label">Query</span>
                      <pre class="svp-code">{{ queryJson(step.request) }}</pre>
                    </div>
                  }

                  @if (step.request.body) {
                    <div class="svp-block">
                      <span class="svp-label">Body</span>
                      <pre class="svp-code">{{ bodyJson(step.request) }}</pre>
                    </div>
                  }
                </section>

                <div class="sv-arrow">
                  <span class="sv-arrow-icon">→</span>
                  @if (step.response.timeMs) {
                    <span class="sv-time">{{ step.response.timeMs }}ms</span>
                  }
                </div>

                <section class="sv-panel response-panel">
                  <header class="svp-head">
                    <span class="svp-status" [attr.data-s]="statusClass(step.response.status)">
                      {{ step.response.status }} {{ step.response.statusText }}
                    </span>
                    @if (step.response.size) {
                      <span class="svp-size">{{ step.response.size }}</span>
                    }
                  </header>

                  @if (step.response.body) {
                    <div class="svp-block">
                      <span class="svp-label">Response body</span>
                      <pre class="svp-code">{{ respJson(step.response) }}</pre>
                    </div>
                  }

                  @if (step.response.headers) {
                    <div class="svp-block">
                      <span class="svp-label">Response headers</span>
                      <pre class="svp-code">{{ respHeaders(step.response) }}</pre>
                    </div>
                  }
                </section>
              </div>

              @if (step.sideEffects?.length) {
                <section class="sv-effects">
                  <header>
                    <span class="ef-icon">⚡</span>
                    <b>Side effects</b>
                  </header>
                  <ul>
                    @for (e of step.sideEffects; track e) {
                      <li><span class="ef-bullet">▸</span> {{ e }}</li>
                    }
                  </ul>
                </section>
              }
            </section>
          }

          <footer class="flow-foot">
            <button class="foot-btn" (click)="prev()" [disabled]="stepIndex() === 0">← Previous</button>
            <span class="foot-progress">{{ stepIndex() + 1 }} / {{ flow.steps.length }}</span>
            @if (isLast()) {
              <button class="foot-btn primary" (click)="reset()">↺ Replay from start</button>
            } @else {
              <button class="foot-btn primary" (click)="next()">Next step →</button>
            }
          </footer>
        </main>
      } @else {
        <div class="no-flow">
          <span>🎬</span>
          <b>Select a flow</b>
          <small>Choose a scenario from the left panel to begin</small>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .fp { display: grid; grid-template-columns: 300px 1fr; gap: 20px; height: 100%; }
    @media (max-width: 900px) { .fp { grid-template-columns: 1fr; } .flows-side { max-height: 240px; } }

    .flows-side {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      padding: 16px;
      overflow-y: auto;
    }
    .fs-head { margin-bottom: 14px; }
    .fs-eyebrow { display: block; font-size: 10px; font-weight: 700;
                  text-transform: uppercase; letter-spacing: 0.1em;
                  color: var(--label-3); margin-bottom: 4px; }
    .fs-head h4 { font-size: var(--fs-sm); font-weight: 700; }

    .flow-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .flow-item {
      width: 100%;
      display: grid;
      grid-template-columns: 32px 1fr auto;
      gap: 10px;
      align-items: flex-start;
      padding: 10px;
      border-radius: var(--r-sm);
      text-align: left;
      color: var(--label-2);
      transition: all var(--t-fast);
    }
    .flow-item:hover { background: var(--bg-hover); color: var(--label); }
    .flow-item.active { background: var(--accent-soft); color: var(--accent); }
    .fi-icon { font-size: 20px; text-align: center; }
    .fi-body b { font-size: var(--fs-xs); font-weight: 700; display: block; color: var(--label); }
    .flow-item.active .fi-body b { color: var(--accent); }
    .fi-body small { font-size: 10px; color: var(--label-2); display: block;
                     margin-top: 2px; line-height: 1.4; }
    .fi-tags { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 6px; }
    .fi-tag {
      font-size: 9px;
      padding: 1px 6px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      color: var(--label-3);
      font-family: var(--sf-mono);
    }
    .flow-item.active .fi-tag { background: rgba(255,255,255,0.15); color: var(--accent); }
    .fi-diff {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: var(--r-pill);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .fi-diff[data-d='basic']        { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .fi-diff[data-d='intermediate'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .fi-diff[data-d='advanced']     { background: rgba(175, 82, 222, 0.15); color: #af52de; }

    .flow-stage { display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }

    .flow-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      flex-wrap: wrap;
    }
    .fh-left { display: flex; gap: 14px; align-items: flex-start; flex: 1; min-width: 200px; }
    .fh-icon { font-size: 32px; }
    .flow-head h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .flow-head p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 4px; }
    .fh-meta { display: flex; gap: 12px; margin-top: 8px; font-size: var(--fs-2xs); }
    .fh-actor, .fh-count {
      padding: 2px 9px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      color: var(--label-2);
      font-weight: 600;
    }
    .fh-controls { display: flex; gap: 4px; }
    .ctrl-btn {
      width: 34px; height: 34px;
      display: grid; place-items: center;
      background: var(--bg-fill-2);
      color: var(--label);
      border-radius: var(--r-sm);
      font-size: 14px;
      font-weight: 700;
      transition: all var(--t-fast);
    }
    .ctrl-btn:hover:not(:disabled) { background: var(--bg-fill-3); }
    .ctrl-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .ctrl-btn.primary { background: var(--accent); color: var(--accent-contrast); width: 44px; }
    .ctrl-btn.primary:hover { background: var(--accent-hover); }

    .progress-strip {
      display: flex;
      align-items: center;
      gap: 0;
      padding: 16px 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow-x: auto;
    }
    .ps-dot {
      flex-shrink: 0;
      width: 32px; height: 32px;
      display: grid; place-items: center;
      border-radius: 50%;
      background: var(--bg-fill-2);
      color: var(--label-2);
      font-size: 11px;
      font-weight: 800;
      transition: all var(--t-base) var(--ease-spring);
    }
    .ps-dot:hover { transform: scale(1.08); }
    .ps-dot.done { background: #34c759; color: #fff; }
    .ps-dot.active { background: var(--accent); color: var(--accent-contrast);
                     box-shadow: 0 0 0 4px var(--accent-soft); }
    .ps-line {
      flex: 1;
      height: 2px;
      background: var(--separator);
      min-width: 12px;
    }
    .ps-line.done { background: #34c759; }

    .step-view {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      display: flex;
      flex-direction: column;
      gap: 18px;
      animation: svIn 320ms var(--ease-spring);
    }
    @keyframes svIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .sv-head { display: flex; flex-direction: column; gap: 6px; }
    .sv-index { font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
                color: var(--accent); text-transform: uppercase; }
    .sv-head h4 { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.015em; }
    .sv-desc { font-size: var(--fs-sm); color: var(--label-2); line-height: 1.5; }
    .sv-actor {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-weight: 700;
      align-self: flex-start;
    }

    .sv-ui {
      display: flex;
      gap: 12px;
      padding: 14px 16px;
      background: rgba(0, 122, 255, 0.05);
      border: 1px solid rgba(0, 122, 255, 0.15);
      border-radius: var(--r-sm);
    }
    .sv-ui-icon { font-size: 20px; }
    .sv-ui-text b { display: block; font-size: 10px; font-weight: 800;
                    text-transform: uppercase; letter-spacing: 0.06em;
                    color: var(--accent); margin-bottom: 4px; }
    .sv-ui-text p { font-size: var(--fs-xs); line-height: 1.5; color: var(--label); }

    .sv-cols {
      display: grid;
      grid-template-columns: 1fr 60px 1fr;
      gap: 12px;
      align-items: stretch;
    }
    @media (max-width: 780px) { .sv-cols { grid-template-columns: 1fr; } .sv-arrow { display: none; } }

    .sv-panel {
      padding: 14px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .request-panel { border-left: 3px solid #007aff; }
    .response-panel { border-left: 3px solid #34c759; }

    .svp-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .svp-method {
      font-family: var(--sf-mono);
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: var(--r-pill);
      color: #fff;
    }
    .svp-method[data-m='GET']    { background: #007aff; }
    .svp-method[data-m='POST']   { background: #34c759; }
    .svp-method[data-m='PUT']    { background: #ff9500; }
    .svp-method[data-m='PATCH']  { background: #af52de; }
    .svp-method[data-m='DELETE'] { background: #ff3b30; }
    .svp-route {
      font-family: var(--sf-mono);
      font-size: var(--fs-2xs);
      font-weight: 600;
      color: var(--label);
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }
    .svp-auth {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 7px;
      background: rgba(255, 149, 0, 0.15);
      color: #ff9500;
      border-radius: var(--r-pill);
      white-space: nowrap;
    }
    .svp-status {
      font-family: var(--sf-mono);
      font-size: 11px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: var(--r-pill);
      color: #fff;
    }
    .svp-status[data-s='success'] { background: #34c759; }
    .svp-status[data-s='redirect'] { background: #ff9500; }
    .svp-status[data-s='client-error'] { background: #ff3b30; }
    .svp-status[data-s='server-error'] { background: #8b0000; }
    .svp-size { margin-left: auto; font-size: 10px; color: var(--label-3); font-family: var(--sf-mono); }

    .svp-block { display: flex; flex-direction: column; gap: 4px; }
    .svp-label { font-size: 9px; font-weight: 800; text-transform: uppercase;
                 letter-spacing: 0.06em; color: var(--label-3); }
    .svp-code {
      padding: 10px 12px;
      background: var(--bg-code);
      border-radius: var(--r-xs);
      font-family: var(--sf-mono);
      font-size: var(--fs-2xs);
      line-height: 1.6;
      color: var(--label);
      overflow-x: auto;
      white-space: pre;
    }

    .sv-arrow {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .sv-arrow-icon { font-size: 24px; color: var(--accent); font-weight: 700; }
    .sv-time {
      font-family: var(--sf-mono);
      font-size: 10px;
      color: var(--label-3);
      padding: 2px 6px;
      background: var(--bg-fill-2);
      border-radius: var(--r-xs);
    }

    .sv-effects {
      padding: 14px 16px;
      background: rgba(255, 149, 0, 0.06);
      border: 1px solid rgba(255, 149, 0, 0.2);
      border-radius: var(--r-sm);
    }
    .sv-effects header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .ef-icon { font-size: 16px; }
    .sv-effects header b { font-size: 10px; font-weight: 800;
                           text-transform: uppercase; letter-spacing: 0.06em;
                           color: #ff9500; }
    .sv-effects ul { list-style: none; display: flex; flex-direction: column; gap: 4px; }
    .sv-effects li { font-size: var(--fs-2xs); color: var(--label);
                     font-family: var(--sf-mono); line-height: 1.5;
                     display: flex; gap: 6px; }
    .ef-bullet { color: #ff9500; font-weight: 700; }

    .flow-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding-top: 4px;
    }
    .foot-btn {
      padding: 9px 18px;
      background: var(--bg-fill-2);
      color: var(--label);
      border-radius: var(--r-pill);
      font-size: var(--fs-xs);
      font-weight: 600;
      transition: all var(--t-fast);
    }
    .foot-btn:hover:not(:disabled) { background: var(--bg-fill-3); }
    .foot-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .foot-btn.primary { background: var(--accent); color: var(--accent-contrast); }
    .foot-btn.primary:hover { background: var(--accent-hover); }
    .foot-progress { font-size: var(--fs-2xs); color: var(--label-2);
                     font-family: var(--sf-mono); font-weight: 600; }

    .no-flow {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-align: center;
      padding: 60px 20px;
      background: var(--bg-surface-solid);
      border: 0.5px dashed var(--separator);
      border-radius: var(--r-md);
    }
    .no-flow span { font-size: 48px; opacity: 0.4; }
    .no-flow b { font-size: var(--fs-base); font-weight: 700; }
    .no-flow small { font-size: var(--fs-xs); color: var(--label-2); }
  `],
})
export class FlowPlayerComponent {
  flows = input.required<Flow[]>();

  private toast = inject(ToastService);

  readonly activeFlowId = signal<string>('');
  readonly stepIndex = signal(0);
  readonly isPlaying = signal(false);

  private playTimer: number | null = null;

  readonly activeFlow = computed(() => {
    const id = this.activeFlowId();
    return this.flows().find(f => f.id === id);
  });

  readonly currentStep = computed<FlowStep | undefined>(() => {
    const flow = this.activeFlow();
    if (!flow) return undefined;
    return flow.steps[this.stepIndex()];
  });

  readonly isLast = computed(() => {
    const flow = this.activeFlow();
    if (!flow) return true;
    return this.stepIndex() >= flow.steps.length - 1;
  });

  constructor() {
    queueMicrotask(() => {
      const list = this.flows();
      if (list.length && !this.activeFlowId()) {
        this.activeFlowId.set(list[0].id);
      }
    });
  }

  selectFlow(id: string): void {
    this.pause();
    this.activeFlowId.set(id);
    this.stepIndex.set(0);
  }

  next(): void {
    if (this.isLast()) return;
    this.stepIndex.update(i => i + 1);
  }

  prev(): void {
    if (this.stepIndex() === 0) return;
    this.stepIndex.update(i => i - 1);
  }

  reset(): void {
    this.pause();
    this.stepIndex.set(0);
  }

  play(): void {
    if (this.isPlaying()) return;
    if (this.isLast()) this.stepIndex.set(0);
    this.isPlaying.set(true);
    this.tick();
  }

  pause(): void {
    this.isPlaying.set(false);
    if (this.playTimer !== null) {
      window.clearTimeout(this.playTimer);
      this.playTimer = null;
    }
  }

  private tick(): void {
    if (!this.isPlaying()) return;
    this.playTimer = window.setTimeout(() => {
      if (!this.isPlaying()) return;
      if (this.isLast()) {
        this.pause();
        this.toast.success('Flow complete', this.activeFlow()?.name ?? '');
        return;
      }
      this.next();
      this.tick();
    }, 2200);
  }

  headerJson(r: FlowRequest): string {
    return JSON.stringify(r.headers, null, 2);
  }
  queryJson(r: FlowRequest): string {
    return JSON.stringify(r.query, null, 2);
  }
  bodyJson(r: FlowRequest): string {
    return JSON.stringify(r.body, null, 2);
  }
  respJson(r: FlowResponse): string {
    return JSON.stringify(r.body, null, 2);
  }
  respHeaders(r: FlowResponse): string {
    return JSON.stringify(r.headers, null, 2);
  }

  statusClass(code: number): string {
    if (code >= 200 && code < 300) return 'success';
    if (code >= 300 && code < 400) return 'redirect';
    if (code >= 400 && code < 500) return 'client-error';
    return 'server-error';
  }
}

type FlowRequest = FlowStep['request'];
type FlowResponse = FlowStep['response'];