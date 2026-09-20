import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DummyDataService, DummyRecord } from '../../../../core/services/dummy-data.service';

@Component({
  selector: 'app-dummy-data-editor',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dde">
      <div class="dde-banner">
        <span class="dde-lock">🔒</span>
        <div class="dde-banner-text">
          <b>DUMMY DATA — Confidential Source</b>
          <small>
            بيانات تجريبية لأغراض العرض فقط. الكود الأصلي سري ولا يمكن مشاركته.
            <em>Source code is confidential — records shown are mock data.</em>
          </small>
        </div>
        <button class="dde-toggle" (click)="open.set(!open())">
          {{ open() ? '− Hide editor' : '+ Edit data' }}
        </button>
      </div>

      @if (open()) {
        <div class="dde-panel">
          <header class="dde-head">
            <div>
              <h4>{{ schema().label }} — Records</h4>
              <p>{{ records().length }} dummy records · editable locally</p>
            </div>
            <div class="dde-actions">
              <button class="btn ghost" (click)="reset()">↺ Reset</button>
              <button class="btn primary" (click)="addRow()">＋ Add row</button>
            </div>
          </header>

          <div class="dde-table">
            <header class="dde-row head">
              @for (col of schema().columns; track col.key) {
                <span>{{ col.label }}</span>
              }
              <span></span>
            </header>

            @for (r of records(); track r.id) {
              <div class="dde-row">
                @for (col of schema().columns; track col.key) {
                  @if (col.type === 'select') {
                    <select
                      [ngModel]="r[col.key]"
                      (ngModelChange)="patch(r.id, col.key, $event)"
                    >
                      @for (opt of col.options; track opt) {
                        <option [value]="opt">{{ opt }}</option>
                      }
                    </select>
                  } @else if (col.type === 'number') {
                    <input
                      type="number"
                      [ngModel]="r[col.key]"
                      (ngModelChange)="patch(r.id, col.key, +$event)"
                    />
                  } @else {
                    <input
                      [ngModel]="r[col.key]"
                      (ngModelChange)="patch(r.id, col.key, $event)"
                    />
                  }
                }
                <button class="row-del" (click)="remove(r.id)" title="Delete">✕</button>
              </div>
            } @empty {
              <div class="dde-empty">
                <span>📭</span>
                <b>No records</b>
                <small>Click "Add row" to create dummy data</small>
              </div>
            }
          </div>

          <footer class="dde-foot">
            <span class="chip-warn">⚠ Dummy data</span>
            <span class="chip-info">Records stored in browser session only</span>
          </footer>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .dde-banner {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      background: rgba(255, 149, 0, 0.08);
      border: 1px solid rgba(255, 149, 0, 0.28);
      border-radius: var(--r-md);
      margin-bottom: 12px;
    }
    .dde-lock { font-size: 22px; flex-shrink: 0; }
    .dde-banner-text { flex: 1; min-width: 0; }
    .dde-banner-text b {
      display: block;
      font-size: var(--fs-xs);
      font-weight: 800;
      color: #ff9500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 3px;
    }
    .dde-banner-text small {
      font-size: var(--fs-2xs);
      color: var(--label-2);
      line-height: 1.45;
      display: block;
    }
    .dde-banner-text em { font-style: italic; color: var(--label-3); }

    .dde-toggle {
      padding: 7px 14px;
      background: #ff9500;
      color: #1a1a1a;
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-weight: 700;
      flex-shrink: 0;
      transition: all var(--t-fast);
    }
    .dde-toggle:hover { background: #e08600; }

    .dde-panel {
      padding: 18px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      animation: panelIn 280ms var(--ease-spring);
    }
    @keyframes panelIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .dde-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .dde-head h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .dde-head p { font-size: var(--fs-2xs); color: var(--label-2); margin-top: 3px; }
    .dde-actions { display: flex; gap: 8px; }

    .btn {
      padding: 7px 14px;
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-weight: 600;
      transition: all var(--t-fast);
    }
    .btn.ghost { background: var(--bg-fill-2); color: var(--label); }
    .btn.ghost:hover { background: var(--bg-fill-3); }
    .btn.primary { background: var(--accent); color: var(--accent-contrast); }
    .btn.primary:hover { background: var(--accent-hover); }

    .dde-table { display: flex; flex-direction: column; gap: 4px; }
    .dde-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)) 40px;
      gap: 8px;
      align-items: center;
      padding: 8px 10px;
      border-radius: var(--r-xs);
      background: var(--bg-fill-2);
      animation: rowIn 260ms var(--ease-spring);
    }
    @keyframes rowIn {
      from { opacity: 0; transform: translateX(-4px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .dde-row.head {
      background: transparent;
      padding-bottom: 4px;
      font-size: var(--fs-2xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--label-3);
    }

    .dde-row input,
    .dde-row select {
      width: 100%;
      padding: 7px 10px;
      background: var(--bg-input);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-xs);
      font-size: var(--fs-xs);
      color: var(--label);
      outline: none;
      font-family: inherit;
      transition: border-color var(--t-fast);
    }
    .dde-row input:focus,
    .dde-row select:focus { border-color: var(--accent); }

    .row-del {
      width: 28px; height: 28px;
      display: grid; place-items: center;
      border-radius: var(--r-xs);
      color: var(--label-3);
      transition: all var(--t-fast);
    }
    .row-del:hover { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

    .dde-empty {
      padding: 40px 20px;
      text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
    }
    .dde-empty span { font-size: 32px; opacity: 0.4; }
    .dde-empty b { font-size: var(--fs-sm); }
    .dde-empty small { font-size: var(--fs-2xs); color: var(--label-2); }

    .dde-foot {
      display: flex;
      gap: 10px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 0.5px solid var(--separator);
      flex-wrap: wrap;
    }
    .chip-warn,
    .chip-info {
      padding: 4px 10px;
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.03em;
    }
    .chip-warn { background: rgba(255, 149, 0, 0.16); color: #ff9500; }
    .chip-info { background: var(--bg-fill-2); color: var(--label-2); }
  `],
})
export class DummyDataEditorComponent {
  projectId = input.required<string>();
  private svc = inject(DummyDataService);

  readonly open = signal(false);

  readonly schema = computed(() => this.svc.schema(this.projectId()) ?? {
    projectId: this.projectId(),
    label: 'Data',
    confidential: true,
    columns: [],
    records: [],
  });

  readonly records = computed(() => this.svc.get(this.projectId()));

  patch(id: string, key: string, value: unknown): void {
    this.svc.update(this.projectId(), id, { [key]: value as string | number | boolean });
  }

  addRow(): void {
    const cols = this.schema().columns;
    const row: Partial<DummyRecord> = { id: `dm-${Date.now()}` };
    cols.forEach(c => {
      row[c.key] = c.type === 'select' ? c.options?.[0] ?? '' : c.type === 'number' ? 0 : '';
    });
    this.svc.add(this.projectId(), row);
  }

  remove(id: string): void {
    this.svc.remove(this.projectId(), id);
  }

  reset(): void {
    this.svc.reset(this.projectId());
  }
}