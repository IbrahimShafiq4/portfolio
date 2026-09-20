import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DummyDataEditorComponent } from '../../shared/dummy-data-editor/dummy-data-editor';
import { PreviewShellComponent, PreviewNavItem } from '../../shared/preview-shell/preview-shell';

@Component({
  selector: 'app-normalization-preview',
  standalone: true,
  imports: [PreviewShellComponent, DummyDataEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🔤"
      title="Arabic Normalizer"
      subtitle="FOE · Data integrity"
      [nav]="nav"
      [active]="active()"
    >
      <div actions class="conf-badge">🔒 Confidential</div>

      <div class="preview-note">
        <app-dummy-data-editor projectId="normalization" />
      </div>

      @if (active() === 'compare') {
        <div class="compare">
          <div class="pane">
            <header class="pane-head">
              <span class="pane-tag input">Input (raw)</span>
              <button class="pill" (click)="useSample()">🎲 Sample</button>
            </header>
            <textarea
              class="editor"
              [value]="input()"
              (input)="input.set($any($event.target).value)"
              dir="rtl"
              placeholder="اكتب أو الصق النص هنا…"
            ></textarea>
          </div>

          <div class="pane">
            <header class="pane-head">
              <span class="pane-tag output">Normalized</span>
              <button class="pill primary" (click)="normalize()" [disabled]="normalizing()">
                {{ normalizing() ? '⟳ Processing…' : '⚡ Normalize' }}
              </button>
            </header>
            <div class="editor readout" dir="rtl">
              @if (normalizing()) {
                <div class="loading-bar">
                  <div class="lb-fill" [style.width.%]="progress()"></div>
                </div>
              }
              <span [innerHTML]="highlightedOutput()"></span>
            </div>
          </div>
        </div>

        @if (stats(); as s) {
          <div class="stats-row">
            <div class="stat"><b>{{ s.chars }}</b><small>Characters</small></div>
            <div class="stat"><b>{{ s.diff }}</b><small>Changes</small></div>
            <div class="stat ok"><b>{{ s.match }}%</b><small>Match score</small></div>
            <div class="stat"><b>{{ s.time }}ms</b><small>Processing</small></div>
          </div>
        }
      } @else if (active() === 'batch') {
        <div class="batch">
          <h3>Batch Processing</h3>
          <p class="sub">Normalize thousands of records from CSV.</p>

          <div class="batch-queue">
            <header class="bq-head">
              <span>Record</span><span>Status</span><span>Match</span>
            </header>
            @for (r of batchRecords; track r.id) {
              <div class="bq-row">
                <span dir="rtl" class="bq-raw">{{ r.raw }}</span>
                <span class="bq-status" [attr.data-s]="r.status">{{ r.status }}</span>
                <span class="bq-match mono">{{ r.match }}%</span>
              </div>
            }
          </div>

          <footer class="batch-foot">
            <span class="mono">2,847 records · 98.7% avg match</span>
            <button class="pill primary">⬇ Export CSV</button>
          </footer>
        </div>
      } @else {
        <div class="rules">
          <h3>Normalization Rules</h3>
          <p class="sub">Active transformations applied to Arabic text.</p>
          <div class="rules-grid">
            @for (r of rules(); track r.id) {
              <article class="rule-card" [class.on]="r.active">
                <header>
                  <span class="r-icon">{{ r.icon }}</span>
                  <b>{{ r.name }}</b>
                  <button class="toggle" [class.on]="r.active" (click)="toggleRule(r.id)">
                    <span class="knob"></span>
                  </button>
                </header>
                <p>{{ r.desc }}</p>
                <div class="r-example" dir="rtl">
                  <span class="r-from">{{ r.from }}</span>
                  <span class="r-arrow">→</span>
                  <span class="r-to">{{ r.to }}</span>
                </div>
              </article>
            }
          </div>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .preview-note { margin-bottom: 20px; }

    .pill { padding: 7px 14px; background: var(--bg-fill-2); color: var(--label);
            border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600; }
    .pill:hover { background: var(--bg-fill-3); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }
    .pill.primary:disabled { opacity: 0.7; cursor: wait; }
    .conf-badge {
      padding: 5px 12px;
      background: rgba(255, 149, 0, 0.15);
      color: #ff9500;
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-weight: 700;
    }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .sub { font-size: var(--fs-sm); color: var(--label-2); margin: 4px 0 20px; }

    .compare {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      max-width: 1080px;
      margin: 0 auto 20px;
    }
    @media (max-width: 780px) { .compare { grid-template-columns: 1fr; } }
    .pane {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 280px;
    }
    .pane-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: var(--bg-fill-2);
      border-bottom: 0.5px solid var(--separator);
    }
    .pane-tag {
      font-size: var(--fs-2xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 4px 10px;
      border-radius: var(--r-pill);
    }
    .pane-tag.input  { background: var(--bg-fill-2); color: var(--label-2); }
    .pane-tag.output { background: var(--accent-soft); color: var(--accent); }

    .editor {
      flex: 1;
      padding: 18px;
      background: transparent;
      border: 0;
      outline: none;
      font-family: var(--sf);
      font-size: var(--fs-base);
      line-height: 1.8;
      color: var(--label);
      resize: none;
    }
    .editor.readout {
      overflow-y: auto;
      font-family: var(--sf);
    }
    .loading-bar {
      height: 3px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      overflow: hidden;
      margin-bottom: 14px;
    }
    .lb-fill {
      height: 100%;
      background: var(--accent);
      border-radius: var(--r-pill);
      transition: width 200ms;
    }

    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
                 max-width: 1080px; margin: 0 auto; }
    @media (max-width: 640px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
    .stat { padding: 16px; background: var(--bg-surface-solid);
            border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .stat b { display: block; font-size: var(--fs-xl); font-weight: 800;
              letter-spacing: -0.025em; font-variant-numeric: tabular-nums; }
    .stat small { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase;
                  letter-spacing: 0.06em; font-weight: 700; }
    .stat.ok b { color: #34c759; }

    .batch { max-width: 900px; margin: 0 auto; }
    .batch h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .batch-queue {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
      margin-bottom: 16px;
    }
    .bq-head, .bq-row {
      display: grid;
      grid-template-columns: 1fr 100px 80px;
      gap: 16px;
      padding: 12px 18px;
      align-items: center;
      font-size: var(--fs-xs);
    }
    .bq-head {
      background: var(--bg-fill-2);
      font-size: var(--fs-2xs);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--label-2);
      font-weight: 700;
    }
    .bq-row { border-top: 0.5px solid var(--separator); }
    .bq-raw { font-size: var(--fs-sm); }
    .bq-status {
      padding: 3px 10px;
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      text-align: center;
    }
    .bq-status[data-s='matched'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .bq-status[data-s='fuzzy']   { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .bq-status[data-s='failed']  { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .bq-match { text-align: right; font-weight: 700; color: var(--accent); }
    .batch-foot { display: flex; justify-content: space-between; align-items: center; }

    .rules { max-width: 1000px; margin: 0 auto; }
    .rules h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .rules-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                  gap: 14px; }
    .rule-card {
      padding: 18px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      transition: all var(--t-base);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .rule-card.on { border-color: var(--accent); }
    .rule-card header { display: flex; align-items: center; gap: 10px; }
    .r-icon { font-size: 20px; }
    .rule-card b { flex: 1; font-size: var(--fs-sm); font-weight: 700; }
    .toggle {
      position: relative;
      width: 40px; height: 24px;
      border-radius: var(--r-pill);
      background: var(--bg-fill-3);
      transition: background var(--t-base);
      flex-shrink: 0;
    }
    .toggle.on { background: #34c759; }
    .knob {
      position: absolute; top: 3px; left: 3px;
      width: 18px; height: 18px;
      background: #fff; border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      transition: transform var(--t-base) var(--ease-spring);
    }
    .toggle.on .knob { transform: translateX(16px); }
    .rule-card > p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5; }
    .r-example {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      font-size: var(--fs-base);
    }
    .r-from { color: var(--label-3); text-decoration: line-through; }
    .r-arrow { color: var(--accent); font-weight: 700; }
    .r-to { color: var(--label); font-weight: 600; }
  `],
})
export class NormalizationPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'compare', label: 'Compare', icon: '⇆' },
    { id: 'batch', label: 'Batch', icon: '📚' },
    { id: 'rules', label: 'Rules', icon: '⚙️' },
  ];
  readonly active = signal('compare');

  readonly input = signal('محمّــد  أحـمــد\nعلي  حســن\nفاطمـة   سعيد');
  readonly output = signal('');
  readonly normalizing = signal(false);
  readonly progress = signal(0);

  readonly normalizedText = computed(() => {
    return this.input()
      .replace(/[ّـًٌٍَُِّ]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/أ|إ|آ/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي');
  });

  readonly highlightedOutput = computed(() => {
    if (!this.output()) return '';
    return this.output().split('\n').map(line =>
      `<div style="padding: 4px 0;">${line}</div>`
    ).join('');
  });

  readonly stats = computed(() => {
    if (!this.output()) return null;
    const inputLen = this.input().length;
    const outputLen = this.output().length;
    return {
      chars: inputLen,
      diff: Math.abs(inputLen - outputLen),
      match: 98,
      time: 42,
    };
  });

  normalize(): void {
    if (this.normalizing()) return;
    this.normalizing.set(true);
    this.progress.set(0);
    const tick = setInterval(() => {
      const p = this.progress();
      if (p >= 100) {
        clearInterval(tick);
        this.normalizing.set(false);
        this.output.set(this.normalizedText());
        return;
      }
      this.progress.set(Math.min(p + 8, 100));
    }, 60);
  }

  useSample(): void {
    this.input.set('عبد  الــرحمــن   محمــد\nخالـد    سمير\nمصطفى   كامـل');
  }

  readonly batchRecords = [
    { id: 1, raw: 'محمّــد  أحـمــد', status: 'matched', match: 98 },
    { id: 2, raw: 'علي  حســن', status: 'matched', match: 96 },
    { id: 3, raw: 'فاطمـة   سعيد', status: 'matched', match: 97 },
    { id: 4, raw: 'خالـد    سمير', status: 'fuzzy', match: 84 },
    { id: 5, raw: 'مصطفى كامـل', status: 'matched', match: 99 },
    { id: 6, raw: 'عبد الــرحمــن', status: 'matched', match: 95 },
    { id: 7, raw: 'أحمـــد  مـحـمـد', status: 'fuzzy', match: 88 },
  ];

  readonly rules = signal([
    {
      id: 1, icon: '🎵', name: 'Remove diacritics', active: true,
      desc: 'Strip all tashkeel marks (fatha, damma, kasra, shadda, sukoon).',
      from: 'محمّد', to: 'محمد'
    },
    {
      id: 2, icon: '↔️', name: 'Normalize tatweel', active: true,
      desc: 'Remove kashida/tatweel elongation characters.',
      from: 'محمـــد', to: 'محمد'
    },
    {
      id: 3, icon: '⚡', name: 'Normalize alif forms', active: true,
      desc: 'Convert أ إ آ to bare alif ا.',
      from: 'أحمد', to: 'احمد'
    },
    {
      id: 4, icon: '🎯', name: 'Normalize taa marbuta', active: true,
      desc: 'Convert ة to ه for matching consistency.',
      from: 'فاطمة', to: 'فاطمه'
    },
    {
      id: 5, icon: '📝', name: 'Normalize alif maqsura', active: true,
      desc: 'Convert ى to ي.',
      from: 'مصطفى', to: 'مصطفي'
    },
    {
      id: 6, icon: '🔤', name: 'Collapse whitespace', active: true,
      desc: 'Replace multiple spaces with single space.',
      from: 'أحمد    محمد', to: 'أحمد محمد'
    },
  ]);

  toggleRule(id: number): void {
    this.rules.update(list => list.map(r => r.id === id ? { ...r, active: !r.active } : r));
  }
}