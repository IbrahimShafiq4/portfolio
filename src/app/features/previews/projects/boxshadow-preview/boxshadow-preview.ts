import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PreviewNavItem, PreviewShellComponent } from '../../shared/preview-shell/preview-shell';

interface Layer { id: number; x: number; y: number; blur: number; spread: number; color: string; enabled: boolean; }

@Component({
  selector: 'app-boxshadow-preview',
  standalone: true,
  imports: [PreviewShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="◐"
      title="Shadow Studio"
      subtitle="CSS generator"
      [nav]="nav"
      [active]="active()"
    >
      <div actions>
        <button class="pill primary" (click)="copy()">{{ copied() ? '✓ Copied!' : '📋 Copy CSS' }}</button>
      </div>

      @if (active() === 'playground') {
        <div class="pg">
          <div class="preview-area">
            <div class="preview-box" [style.box-shadow]="css()">
              <span>{{ layers().filter(l => l.enabled).length }} layer(s)</span>
            </div>
          </div>

          <section class="code-block">
            <header>
              <span class="dot-g"></span>
              <span>box-shadow.css</span>
            </header>
            <pre>{{ css() }}</pre>
          </section>

          <div class="layers">
            <header class="layers-head">
              <h4>Shadow Layers</h4>
              <button class="add-layer" (click)="addLayer()">＋ Add layer</button>
            </header>

            @for (l of layers(); track l.id) {
              <article class="layer" [class.disabled]="!l.enabled">
                <header class="layer-head">
                  <button class="toggle-en" [class.on]="l.enabled" (click)="toggleLayer(l.id)">
                    <span class="en-dot"></span>
                  </button>
                  <span class="color-chip" [style.background]="l.color"></span>
                  <b>Layer {{ $index + 1 }}</b>
                  <button class="rm-layer" (click)="removeLayer(l.id)">✕</button>
                </header>
                <div class="sliders">
                  <div class="slider">
                    <label>X <span class="val">{{ l.x }}</span></label>
                    <input type="range" min="-40" max="40" [value]="l.x"
                           (input)="set(l.id, 'x', +$any($event.target).value)" />
                  </div>
                  <div class="slider">
                    <label>Y <span class="val">{{ l.y }}</span></label>
                    <input type="range" min="-40" max="40" [value]="l.y"
                           (input)="set(l.id, 'y', +$any($event.target).value)" />
                  </div>
                  <div class="slider">
                    <label>Blur <span class="val">{{ l.blur }}</span></label>
                    <input type="range" min="0" max="80" [value]="l.blur"
                           (input)="set(l.id, 'blur', +$any($event.target).value)" />
                  </div>
                  <div class="slider">
                    <label>Spread <span class="val">{{ l.spread }}</span></label>
                    <input type="range" min="-20" max="40" [value]="l.spread"
                           (input)="set(l.id, 'spread', +$any($event.target).value)" />
                  </div>
                  <div class="color-row">
                    <label>Color</label>
                    <input type="color" [value]="l.color" (input)="set(l.id, 'color', $any($event.target).value)" />
                    <input class="hex" [value]="l.color" (input)="set(l.id, 'color', $any($event.target).value)" />
                  </div>
                </div>
              </article>
            }
          </div>
        </div>
      } @else {
        <div class="presets">
          <h3>Preset Shadows</h3>
          <p class="sub">Click any preset to apply it to the playground.</p>
          <div class="preset-grid">
            @for (p of presets; track p.name) {
              <button class="preset" (click)="applyPreset(p)">
                <div class="preset-visual" [style.box-shadow]="p.value"></div>
                <b>{{ p.name }}</b>
                <code>{{ p.value }}</code>
              </button>
            }
          </div>
        </div>
      }
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

    /* PLAYGROUND */
    .pg { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 1100px; margin: 0 auto; }
    @media (max-width: 900px) { .pg { grid-template-columns: 1fr; } }

    .preview-area {
      grid-column: 1 / -1;
      min-height: 240px;
      background: var(--bg-fill-2);
      border-radius: var(--r-lg);
      display: grid; place-items: center;
      padding: 40px;
    }
    .preview-box {
      width: 180px; height: 180px;
      background: var(--bg-surface-solid);
      border-radius: var(--r-md);
      display: grid; place-items: center;
      font-size: var(--fs-2xs);
      color: var(--label-3);
      font-weight: 600;
      transition: box-shadow 180ms var(--ease-smooth);
    }

    .code-block {
      background: var(--bg-code);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
      grid-column: 1 / -1;
    }
    .code-block header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: var(--bg-fill-2);
      font-size: var(--fs-2xs);
      font-family: var(--sf-mono);
      color: var(--label-2);
      border-bottom: 0.5px solid var(--separator);
    }
    .dot-g {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #34c759;
    }
    .code-block pre {
      padding: 16px 18px;
      font-family: var(--sf-mono);
      font-size: var(--fs-xs);
      color: var(--label);
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .layers { grid-column: 1 / -1; display: flex; flex-direction: column; gap: 12px; }
    .layers-head { display: flex; justify-content: space-between; align-items: center; }
    .layers-head h4 { font-size: var(--fs-sm); font-weight: 700; }
    .add-layer {
      padding: 6px 14px;
      background: var(--bg-fill-2);
      color: var(--label);
      border-radius: var(--r-pill);
      font-size: var(--fs-xs);
      font-weight: 600;
    }
    .add-layer:hover { background: var(--bg-fill-3); }

    .layer {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      padding: 16px;
      transition: opacity var(--t-base);
    }
    .layer.disabled { opacity: 0.5; }
    .layer-head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }
    .toggle-en {
      position: relative;
      width: 32px; height: 20px;
      border-radius: var(--r-pill);
      background: var(--bg-fill-3);
      transition: background var(--t-base);
    }
    .toggle-en.on { background: #34c759; }
    .en-dot {
      position: absolute;
      top: 2px; left: 2px;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: #fff;
      transition: transform var(--t-base) var(--ease-spring);
    }
    .toggle-en.on .en-dot { transform: translateX(12px); }
    .color-chip {
      width: 18px; height: 18px;
      border-radius: 50%;
      box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.15) inset;
    }
    .layer-head b { flex: 1; font-size: var(--fs-xs); font-weight: 600; }
    .rm-layer {
      width: 24px; height: 24px;
      display: grid; place-items: center;
      border-radius: var(--r-xs);
      color: var(--label-3);
      transition: all var(--t-fast);
    }
    .rm-layer:hover { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

    .sliders { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 600px) { .sliders { grid-template-columns: 1fr; } }

    .slider { display: flex; flex-direction: column; gap: 6px; }
    .slider label {
      display: flex;
      justify-content: space-between;
      font-size: var(--fs-2xs);
      font-weight: 600;
      color: var(--label-2);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .val { color: var(--accent); font-variant-numeric: tabular-nums; }
    .slider input[type=range] {
      width: 100%;
      accent-color: var(--accent);
      cursor: pointer;
    }

    .color-row {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 10px;
      padding-top: 6px;
    }
    .color-row label {
      font-size: var(--fs-2xs);
      font-weight: 600;
      color: var(--label-2);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .color-row input[type=color] {
      width: 36px; height: 28px;
      border: 0.5px solid var(--separator);
      border-radius: var(--r-xs);
      background: none;
      cursor: pointer;
    }
    .hex {
      flex: 1;
      background: var(--bg-input);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-xs);
      padding: 5px 10px;
      font-family: var(--sf-mono);
      font-size: var(--fs-xs);
      text-transform: uppercase;
    }

    /* PRESETS */
    .presets { max-width: 1000px; margin: 0 auto; }
    .presets h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .sub { font-size: var(--fs-sm); color: var(--label-2); margin: 4px 0 20px; }
    .preset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
    .preset {
      padding: 20px;
      background: var(--bg-surface-card, var(--bg-surface-solid));
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      text-align: left;
      transition: all var(--t-base) var(--ease-spring);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .preset:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--accent); }
    .preset-visual {
      height: 70px;
      background: var(--bg-surface-solid);
      border-radius: var(--r-sm);
    }
    .preset b { font-size: var(--fs-sm); font-weight: 700; }
    .preset code {
      font-family: var(--sf-mono);
      font-size: var(--fs-2xs);
      color: var(--label-2);
      word-break: break-all;
      line-height: 1.4;
    }
  `],
})
export class BoxShadowPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'playground', label: 'Playground', icon: '🎛' },
    { id: 'presets', label: 'Presets', icon: '✨' },
  ];
  readonly active = signal('playground');
  readonly copied = signal(false);

  readonly layers = signal<Layer[]>([
    { id: 1, x: 0, y: 12, blur: 24, spread: 0, color: '#000000', enabled: true },
    { id: 2, x: 0, y: 4, blur: 8, spread: 0, color: '#007aff', enabled: true },
  ]);

  readonly css = computed(() => {
    const lines = this.layers()
      .filter(l => l.enabled)
      .map(l => `${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${this.hexToRgba(l.color, 0.35)}`);
    return lines.length ? `box-shadow: ${lines.join(',\n            ')};` : 'box-shadow: none;';
  });

  set(id: number, key: keyof Layer, value: any): void {
    this.layers.update(list => list.map(l => l.id === id ? { ...l, [key]: value } : l));
  }
  addLayer(): void {
    const colors = ['#007aff', '#af52de', '#ff2d55', '#34c759', '#ff9500'];
    this.layers.update(list => [
      ...list,
      {
        id: Date.now(),
        x: 0, y: 8, blur: 16, spread: 0,
        color: colors[list.length % colors.length],
        enabled: true,
      },
    ]);
  }
  removeLayer(id: number): void {
    this.layers.update(list => list.filter(l => l.id !== id));
  }
  toggleLayer(id: number): void {
    this.layers.update(list => list.map(l => l.id === id ? { ...l, enabled: !l.enabled } : l));
  }

  copy(): void {
    navigator.clipboard?.writeText(this.css());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1600);
  }

  private hexToRgba(hex: string, a: number): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  readonly presets = [
    { name: 'Soft drop', value: '0 4px 14px rgba(0,0,0,0.10)' },
    { name: 'Card', value: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)' },
    { name: 'Elevated', value: '0 12px 32px rgba(0,0,0,0.14), 0 4px 8px rgba(0,0,0,0.06)' },
    { name: 'Floating', value: '0 24px 60px rgba(0,0,0,0.20), 0 8px 20px rgba(0,0,0,0.08)' },
    { name: 'Inner soft', value: 'inset 0 2px 4px rgba(0,0,0,0.08)' },
    { name: 'Neon', value: '0 0 24px rgba(0,122,255,0.55), 0 0 48px rgba(0,122,255,0.28)' },
  ];

  applyPreset(p: { value: string }): void {
    const matches = p.value.match(/(inset\s+)?(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(\d+)?\s*(rgba\([^)]+\)|#[0-9a-fA-F]{6})/g);
    if (!matches) return;
    const newLayers: Layer[] = [];
    let id = 1;
    for (const m of matches) {
      const parts = m.match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px(?:\s+(\d+)px)?\s+(rgba\([^)]+\)|#[0-9a-fA-F]{6})/);
      if (!parts) continue;
      const color = parts[5].startsWith('#') ? parts[5] : '#000000';
      newLayers.push({
        id: id++,
        x: +parts[1], y: +parts[2], blur: +parts[3], spread: parts[4] ? +parts[4] : 0,
        color, enabled: true,
      });
    }
    if (newLayers.length) {
      this.layers.set(newLayers);
      this.active.set('playground');
    }
  }
}