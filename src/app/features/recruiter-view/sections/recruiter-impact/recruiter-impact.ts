import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-recruiter-impact',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="impact">
      <div class="container">

        <header class="section-head">
          <div class="eyebrow">
            <span class="eyebrow-num">§01</span>
            <span class="eyebrow-line"></span>
            <span class="eyebrow-label">HARDWARE SPECIFICATION SHEET</span>
          </div>
          <h2 class="section-title">Performance <em>Metrics</em></h2>
          <p class="section-sub">Compiled datasheet — measured in production, verified across four companies.</p>
        </header>

        <div class="datasheet">
          <div class="sheet-header">
            <span>PARAMETER</span>
            <span>VALUE</span>
            <span>STATUS</span>
          </div>

          @for (s of stats; track s.label; let i = $index) {
            <div class="sheet-row">
              <span class="row-num">0{{ i + 1 }}</span>
              <span class="row-param">
                <span class="row-icon">{{ s.icon }}</span>
                <span class="row-label">{{ s.label }}</span>
              </span>
              <span class="row-value">
                <span class="value-num">{{ s.display }}</span>
                <span class="value-unit">{{ s.unit }}</span>
              </span>
              <span class="row-status">
                <span class="led {{ s.trend }}"></span>
                {{ s.trend === 'up' ? 'OK' : 'NOTE' }}
              </span>
              <span class="row-note">{{ s.note }}</span>
            </div>
          }
        </div>

        <div class="barcode-row">
          <div class="barcode">
            @for (b of barcode; track $index) {
              <span [style.width.px]="b"></span>
            }
          </div>
          <div class="barcode-info">
            <small>CERTIFIED · IS-2024-11</small>
            <small>VERIFIED DATA · SERIAL NO. 000027</small>
          </div>
        </div>

      </div>
    </section>
  `,
  styles: [`
    /* نفس الـ styles القديمة */
    :host { display: block; }

    .impact {
      padding: 100px 24px;
      background: var(--rv-bg-0);
      border-top: 3px double var(--rv-copper);
    }

    .container { max-width: 1080px; margin: 0 auto; }

    .section-head { margin-bottom: 40px; }

    .eyebrow {
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: var(--rv-mono);
      font-size: 10px;
      letter-spacing: 0.2em;
      color: var(--rv-copper);
      margin-bottom: 20px;
    }
    .eyebrow-num {
      font-family: var(--rv-pixel);
      font-size: 10px;
      color: var(--rv-green);
      text-shadow: 0 0 6px var(--rv-green);
    }
    .eyebrow-line { flex: 1; height: 1px; background: var(--rv-copper); max-width: 60px; }

    .section-title {
      font-family: var(--rv-display);
      font-weight: 900;
      font-size: clamp(36px, 5vw, 68px);
      line-height: 1;
      letter-spacing: -0.03em;
      color: var(--rv-paper);
    }
    .section-title em { font-style: italic; font-weight: 400; color: var(--rv-copper); }

    .section-sub {
      margin-top: 14px;
      font-family: var(--rv-display);
      font-style: italic;
      font-size: 16px;
      color: var(--rv-paper);
      opacity: 0.7;
      max-width: 560px;
    }

    .datasheet {
      background: var(--rv-paper);
      border: 3px solid var(--rv-ink);
      box-shadow: 8px 8px 0 0 var(--rv-red-dark);
    }

    .sheet-header {
      display: grid;
      grid-template-columns: 40px 1.6fr 1fr 100px;
      gap: 16px;
      padding: 14px 20px;
      background: var(--rv-ink);
      color: var(--rv-paper);
      font-family: var(--rv-pixel);
      font-size: 8px;
      letter-spacing: 0.12em;
    }

    .sheet-row {
      display: grid;
      grid-template-columns: 40px 1.6fr 1fr 100px 1.2fr;
      gap: 16px;
      padding: 16px 20px;
      align-items: center;
      border-bottom: 1px dashed var(--rv-ink-soft);
      color: var(--rv-ink);
      transition: background 120ms ease-out;
    }

    .sheet-row:hover { background: var(--rv-paper-2); }
    .sheet-row:last-child { border-bottom: 0; }

    .row-num {
      font-family: var(--rv-terminal);
      font-size: 20px;
      color: var(--rv-red);
      line-height: 1;
    }

    .row-param {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .row-icon { font-size: 20px; }

    .row-label {
      font-family: var(--rv-display);
      font-weight: 700;
      font-size: 17px;
      letter-spacing: -0.01em;
    }

    .row-value {
      display: flex;
      align-items: baseline;
      gap: 4px;
      font-family: var(--rv-display);
      color: var(--rv-red);
    }

    .value-num {
      font-size: 30px;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
    }

    .value-unit {
      font-family: var(--rv-mono);
      font-size: 12px;
      color: var(--rv-ink-soft);
      letter-spacing: 0.05em;
    }

    .row-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--rv-mono);
      font-size: 10px;
      letter-spacing: 0.1em;
      color: var(--rv-ink);
    }

    .led {
      width: 8px; height: 8px;
      border-radius: 50%;
      box-shadow: 0 0 4px currentColor;
    }
    .led.up { background: #1a8a2a; color: #1a8a2a; animation: rv-blink 1.4s steps(1) infinite; }
    .led.down { background: var(--rv-red); color: var(--rv-red); animation: rv-blink 0.7s steps(1) infinite; }
    .led.neutral { background: var(--rv-copper); color: var(--rv-copper); }

    .row-note {
      font-family: var(--rv-mono);
      font-size: 10px;
      color: var(--rv-ink-soft);
      line-height: 1.4;
    }

    .barcode-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px dashed var(--rv-copper);
      flex-wrap: wrap;
      gap: 16px;
    }

    .barcode {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      height: 40px;
    }

    .barcode span {
      display: block;
      background: var(--rv-paper);
      height: 100%;
    }

    .barcode span:nth-child(3n) { height: 70%; }
    .barcode span:nth-child(5n) { height: 50%; }
    .barcode span:nth-child(7n) { height: 85%; }

    .barcode-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: right;
    }

    .barcode-info small {
      font-family: var(--rv-mono);
      font-size: 9px;
      letter-spacing: 0.14em;
      color: var(--rv-copper);
    }

    @media (max-width: 780px) {
      .sheet-header { display: none; }
      .sheet-row {
        grid-template-columns: 1fr;
        gap: 6px;
        padding: 20px;
        border-bottom: 2px solid var(--rv-ink-soft);
      }
      .row-num { font-size: 16px; }
      .row-value { margin-top: 4px; }
      .value-num { font-size: 40px; }
      .row-status { margin-top: 4px; }
    }

    @media (max-width: 640px) {
      .impact { padding: 60px 16px; }
      .datasheet { box-shadow: 4px 4px 0 0 var(--rv-red-dark); }
      .sheet-row { padding: 16px; }
      .row-label { font-size: 15px; }
      .value-num { font-size: 32px; }
    }
  `],
})
export class RecruiterImpactComponent {
  readonly barcode = [3, 1, 2, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 3, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 3, 1, 2];

  readonly stats = [
    { icon: '📦', label: 'Projects Shipped', value: 27, display: '27', unit: 'TOTAL', note: '4 companies · 3 years · 850+ endpoints', trend: 'up' as const },
    { icon: '⚡', label: 'On-Time Delivery', value: 98, display: '98%', unit: 'PERCENT', note: 'Across all contract and freelance work', trend: 'up' as const },
    { icon: '👥', label: 'Users Served', value: 12, display: '12K+', unit: 'HUMANS', note: 'Direct + indirect through shipped systems', trend: 'up' as const },
    { icon: '🔌', label: 'API Endpoints', value: 850, display: '850+', unit: 'ENDPOINTS', note: 'REST · WebSocket · SignalR real-time', trend: 'up' as const },
  ];
}