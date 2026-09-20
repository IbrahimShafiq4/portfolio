import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PreviewNavItem, PreviewShellComponent } from '../../shared/preview-shell/preview-shell';

@Component({
  selector: 'app-image-editor-preview',
  standalone: true,
  imports: [PreviewShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🖼"
      title="Image Editor"
      subtitle="Browser-based editing"
      [nav]="nav"
      [active]="active()"
    >
      <div actions>
        <button class="pill" (click)="reset()">↺ Reset</button>
        <button class="pill primary" (click)="export()">💾 Export</button>
      </div>

      <div class="editor">
        <aside class="tools">
          @for (t of tools; track t.id) {
            <button class="tool" [class.active]="activeTool() === t.id" (click)="activeTool.set(t.id)" [title]="t.label">
              <span class="tool-icon">{{ t.icon }}</span>
              <span class="tool-label">{{ t.label }}</span>
            </button>
          }
        </aside>

        <div class="stage">
          <div class="canvas-wrap">
            <div class="canvas"
                 [style.filter]="filterCss()"
                 [style.transform]="'rotate(' + rotate() + 'deg) scale(' + (1 + zoom() / 100) + ')'">
              <div class="mock-image">
                <div class="mi-shape"></div>
                <div class="mi-shape small"></div>
                <div class="mi-shape circle"></div>
              </div>
            </div>
          </div>

          <footer class="stage-foot">
            <div class="info">
              <span class="mono">1920 × 1080</span>
              <span class="dot-sep">·</span>
              <span class="mono">PNG</span>
              <span class="dot-sep">·</span>
              <span class="mono">{{ filterCss() === 'none' ? 'Original' : 'Edited' }}</span>
            </div>
            <div class="zoom">
              <button (click)="zoomOut()">−</button>
<span class="mono">{{ zoom() }}%</span>
<button (click)="zoomIn()">+</button>
            </div>
          </footer>
        </div>

        <aside class="panel">
          @switch (activeTool()) {
            @case ('crop') {
              <h4>Crop</h4>
              <div class="crop-presets">
                @for (r of cropRatios; track r.label) {
                  <button class="crop-btn" [class.active]="cropRatio() === r.label" (click)="cropRatio.set(r.label)">
                    {{ r.label }}
                  </button>
                }
              </div>
            }
            @case ('rotate') {
              <h4>Rotate</h4>
              <div class="btn-row">
                <button class="op-btn" (click)="rotate.update(r => r - 90)">↺ 90°</button>
                <button class="op-btn" (click)="rotate.update(r => r + 90)">↻ 90°</button>
                <button class="op-btn" (click)="flipH()">⇄ Flip H</button>
                <button class="op-btn" (click)="flipV()">⇅ Flip V</button>
              </div>
            }
            @case ('filter') {
              <h4>Filters</h4>
              <div class="filter-list">
                @for (f of filters; track f.id) {
                  <button class="filter-row" [class.active]="selectedFilter() === f.id" (click)="selectedFilter.set(f.id)">
                    <span class="filter-swatch" [style.filter]="f.css"></span>
                    <span class="filter-name">{{ f.label }}</span>
                    @if (selectedFilter() === f.id) { <span class="filter-check">✓</span> }
                  </button>
                }
              </div>
              <div class="slider-group">
                <label>Intensity <span class="val">{{ intensity() }}%</span></label>
                <input type="range" min="0" max="100" [value]="intensity()" (input)="intensity.set(+$any($event.target).value)" />
              </div>
            }
            @case ('adjust') {
              <h4>Adjust</h4>
              <div class="slider-group">
                <label>Brightness <span class="val">{{ brightness() }}%</span></label>
                <input type="range" min="0" max="200" [value]="brightness()" (input)="brightness.set(+$any($event.target).value)" />
              </div>
              <div class="slider-group">
                <label>Contrast <span class="val">{{ contrast() }}%</span></label>
                <input type="range" min="0" max="200" [value]="contrast()" (input)="contrast.set(+$any($event.target).value)" />
              </div>
              <div class="slider-group">
                <label>Saturation <span class="val">{{ saturation() }}%</span></label>
                <input type="range" min="0" max="200" [value]="saturation()" (input)="saturation.set(+$any($event.target).value)" />
              </div>
            }
          }
        </aside>
      </div>
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .pill { padding: 7px 14px; background: var(--bg-fill-2); color: var(--label);
            border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600;
            transition: all var(--t-fast); }
    .pill:hover { background: var(--bg-fill-3); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }

    .editor {
      display: grid;
      grid-template-columns: 80px 1fr 280px;
      gap: 16px;
      height: 100%;
    }
    @media (max-width: 900px) {
      .editor { grid-template-columns: 1fr; }
      .tools { flex-direction: row !important; }
      .panel { order: 3; }
    }

    /* TOOLS */
    .tools {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .tool {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 6px;
      border-radius: var(--r-sm);
      color: var(--label-2);
      font-size: 10px;
      font-weight: 600;
      transition: all var(--t-fast);
    }
    .tool:hover { background: var(--bg-hover); color: var(--label); }
    .tool.active { background: var(--accent-soft); color: var(--accent); }
    .tool-icon { font-size: 20px; }
    .tool-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }

    /* STAGE */
    .stage {
      display: grid;
      grid-template-rows: 1fr auto;
      background: var(--bg-fill-2);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
    }
    .canvas-wrap {
      display: grid;
      place-items: center;
      padding: 30px;
      min-height: 320px;
      background-image:
        linear-gradient(45deg, var(--bg-fill-2) 25%, transparent 25%),
        linear-gradient(-45deg, var(--bg-fill-2) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, var(--bg-fill-2) 75%),
        linear-gradient(-45deg, transparent 75%, var(--bg-fill-2) 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0;
    }
    .canvas {
      width: 320px;
      height: 220px;
      border-radius: var(--r-md);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
      transition: filter 200ms, transform 200ms var(--ease-spring);
      background: #4a5568;
      position: relative;
    }
    .mock-image {
      width: 100%; height: 100%;
      background: #6f8fa8;
      position: relative;
      overflow: hidden;
    }
    .mi-shape {
      position: absolute;
      background: #ff9500;
      border-radius: 6px;
    }
    .mi-shape:nth-child(1) {
      width: 60%; height: 40%;
      left: 10%; top: 20%;
    }
    .mi-shape.small {
      width: 25%; height: 25%;
      right: 12%; bottom: 16%;
      background: #ff2d55;
    }
    .mi-shape.circle {
      width: 20%; aspect-ratio: 1;
      border-radius: 50%;
      right: 15%; top: 14%;
      background: #34c759;
    }

    .stage-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      background: var(--bg-chrome);
      border-top: 0.5px solid var(--separator);
    }
    .info { display: flex; align-items: center; gap: 8px; font-size: var(--fs-2xs);
            color: var(--label-2); }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .dot-sep { color: var(--label-4); }

    .zoom { display: flex; align-items: center; gap: 6px; }
    .zoom button {
      width: 24px; height: 24px;
      border-radius: var(--r-xs);
      color: var(--label);
      font-size: 14px;
      font-weight: 700;
      transition: background var(--t-fast);
    }
    .zoom button:hover { background: var(--bg-fill-2); }
    .zoom .mono { font-size: var(--fs-2xs); min-width: 44px; text-align: center; }

    /* PANEL */
    .panel {
      padding: 16px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow-y: auto;
    }
    .panel h4 {
      font-size: var(--fs-2xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--label-3);
      margin-bottom: 14px;
    }

    .crop-presets { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
    .crop-btn {
      padding: 10px 8px;
      background: var(--bg-fill-2);
      color: var(--label-2);
      border-radius: var(--r-sm);
      font-size: var(--fs-xs);
      font-weight: 600;
      transition: all var(--t-fast);
    }
    .crop-btn:hover { background: var(--bg-fill-3); color: var(--label); }
    .crop-btn.active { background: var(--accent); color: var(--accent-contrast); }

    .btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .op-btn {
      padding: 10px;
      background: var(--bg-fill-2);
      color: var(--label);
      border-radius: var(--r-sm);
      font-size: var(--fs-xs);
      font-weight: 600;
      transition: all var(--t-fast);
    }
    .op-btn:hover { background: var(--bg-fill-3); }

    .filter-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
    .filter-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
      border-radius: var(--r-sm);
      transition: background var(--t-fast);
    }
    .filter-row:hover { background: var(--bg-hover); }
    .filter-row.active { background: var(--accent-soft); }
    .filter-swatch {
      width: 40px;
      height: 28px;
      border-radius: var(--r-xs);
      background: #6f8fa8;
      position: relative;
      overflow: hidden;
    }
    .filter-swatch::before {
      content: '';
      position: absolute;
      inset: 0;
      background: #ff9500;
      width: 30%;
      left: 10%;
      top: 20%;
      height: 30%;
      border-radius: 2px;
    }
    .filter-swatch::after {
      content: '';
      position: absolute;
      inset: 0;
      background: #ff2d55;
      width: 20%;
      right: 10%;
      bottom: 20%;
      height: 30%;
      border-radius: 2px;
    }
    .filter-name { flex: 1; font-size: var(--fs-xs); font-weight: 500; text-align: left; }
    .filter-check { color: var(--accent); font-weight: 700; }

    .slider-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .slider-group label {
      display: flex;
      justify-content: space-between;
      font-size: var(--fs-2xs);
      font-weight: 600;
      color: var(--label-2);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .val { color: var(--accent); font-variant-numeric: tabular-nums; }
    .slider-group input[type=range] { width: 100%; accent-color: var(--accent); cursor: pointer; }
  `],
})
export class ImageEditorPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'edit', label: 'Editor', icon: '✂️' },
  ];
  readonly active = signal('edit');

  readonly tools = [
    { id: 'crop', icon: '✂️', label: 'Crop' },
    { id: 'rotate', icon: '🔄', label: 'Rotate' },
    { id: 'filter', icon: '🎨', label: 'Filter' },
    { id: 'adjust', icon: '⚙️', label: 'Adjust' },
  ];
  readonly activeTool = signal('crop');

  readonly rotate = signal(0);
  readonly zoom = signal(0);
  readonly flipHorizontal = signal(false);
  readonly flipVertical = signal(false);

  readonly cropRatio = signal('Free');
  readonly cropRatios = [
    { label: 'Free' }, { label: '1:1' }, { label: '4:3' }, { label: '16:9' },
  ];

  readonly filters = [
    { id: 'none', label: 'None', css: 'none' },
    { id: 'grayscale', label: 'B&W', css: 'grayscale(100%)' },
    { id: 'sepia', label: 'Sepia', css: 'sepia(100%)' },
    { id: 'warm', label: 'Warm', css: 'sepia(40%) saturate(1.4) hue-rotate(-15deg)' },
    { id: 'cool', label: 'Cool', css: 'saturate(1.1) hue-rotate(180deg)' },
    { id: 'vivid', label: 'Vivid', css: 'saturate(1.6) contrast(1.15)' },
    { id: 'faded', label: 'Faded', css: 'saturate(0.7) contrast(0.9) brightness(1.1)' },
  ];
  readonly selectedFilter = signal('none');
  readonly intensity = signal(100);

  readonly brightness = signal(100);
  readonly contrast = signal(100);
  readonly saturation = signal(100);

  readonly filterCss = computed(() => {
    const f = this.filters.find(x => x.id === this.selectedFilter())?.css ?? 'none';
    const parts: string[] = [];
    if (f !== 'none') parts.push(f);
    if (this.brightness() !== 100) parts.push(`brightness(${this.brightness()}%)`);
    if (this.contrast() !== 100) parts.push(`contrast(${this.contrast()}%)`);
    if (this.saturation() !== 100) parts.push(`saturate(${this.saturation()}%)`);
    return parts.length ? parts.join(' ') : 'none';
  });

  flipH(): void { this.flipHorizontal.update(v => !v); }
  flipV(): void { this.flipVertical.update(v => !v); }

  reset(): void {
    this.rotate.set(0);
    this.zoom.set(0);
    this.selectedFilter.set('none');
    this.intensity.set(100);
    this.brightness.set(100);
    this.contrast.set(100);
    this.saturation.set(100);
    this.flipHorizontal.set(false);
    this.flipVertical.set(false);
  }

  export(): void {
    alert('✓ Image exported (mock)');
  }

  zoomOut(): void {
    this.zoom.update(z => Math.max(0, z - 10));
  }

  zoomIn(): void {
    this.zoom.update(z => Math.min(100, z + 10));
  }
}