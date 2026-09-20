import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PreviewNavItem, PreviewShellComponent } from '../../shared/preview-shell/preview-shell';

interface City { id: number; name: string; country: string; emoji: string; temp: number; feels: number; desc: string; humidity: number; wind: number; }

@Component({
  selector: 'app-weather-preview',
  standalone: true,
  imports: [PreviewShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="☀︎"
      title="Weather"
      subtitle="Global forecasts"
      [nav]="nav"
      [active]="active()"
    >
      <div actions>
        <div class="search-box">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <circle cx="9" cy="9" r="6" /><path d="m17 17-3.5-3.5" />
          </svg>
          <input placeholder="Search city…" [value]="query()" (input)="query.set($any($event.target).value)" />
        </div>
      </div>

      @if (active() === 'today') {
        <div class="today">
          <section class="hero-weather">
            <div class="hw-left">
              <span class="hw-loc">📍 {{ current().name }}, {{ current().country }}</span>
              <div class="hw-temp">{{ current().temp }}<span>°</span></div>
              <p class="hw-desc">{{ current().emoji }} {{ current().desc }}</p>
              <p class="hw-feels">Feels like {{ current().feels }}°</p>
            </div>
            <div class="hw-right">
              <div class="metric">
                <span class="m-icon">💧</span>
                <div><small>Humidity</small><b>{{ current().humidity }}%</b></div>
              </div>
              <div class="metric">
                <span class="m-icon">💨</span>
                <div><small>Wind</small><b>{{ current().wind }} km/h</b></div>
              </div>
              <div class="metric">
                <span class="m-icon">🌅</span>
                <div><small>Sunset</small><b>5:42 PM</b></div>
              </div>
            </div>
          </section>

          <section class="block-sm">
            <h4>Hourly forecast</h4>
            <div class="hourly">
              @for (h of hourly; track $index) {
                <div class="hour">
                  <span class="h-time">{{ h.time }}</span>
                  <span class="h-icon">{{ h.icon }}</span>
                  <span class="h-temp">{{ h.temp }}°</span>
                </div>
              }
            </div>
          </section>

          <section class="block-sm">
            <h4>7-day forecast</h4>
            <div class="daily">
              @for (d of daily; track d.day) {
                <div class="day-row">
                  <span class="d-day">{{ d.day }}</span>
                  <span class="d-icon">{{ d.icon }}</span>
                  <div class="d-bar">
                    <div class="d-fill" [style.left.%]="d.low" [style.width.%]="d.high - d.low"></div>
                  </div>
                  <span class="d-temp"><b>{{ d.high }}°</b> {{ d.low }}°</span>
                </div>
              }
            </div>
          </section>
        </div>
      } @else {
        <div class="cities">
          <h3>Your Cities</h3>
          <div class="city-grid">
            @for (c of filteredCities(); track c.id) {
              <article class="city-card" [class.active]="currentId() === c.id" (click)="selectCity(c.id)">
                <header>
                  <b>{{ c.name }}</b>
                  <small>{{ c.country }}</small>
                </header>
                <div class="cc-temp">{{ c.emoji }} {{ c.temp }}°</div>
                <p class="cc-desc">{{ c.desc }}</p>
                <div class="cc-meta">
                  <span>💧 {{ c.humidity }}%</span>
                  <span>💨 {{ c.wind }}km/h</span>
                </div>
              </article>
            } @empty {
              <div class="empty">
                <span>🔍</span>
                <b>No cities found</b>
              </div>
            }
          </div>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .search-box {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      padding: 6px 12px;
      width: 220px;
    }
    .search-box svg { width: 14px; height: 14px; color: var(--label-3); }
    .search-box input {
      flex: 1;
      background: transparent;
      border: 0;
      outline: none;
      font-size: var(--fs-xs);
      color: var(--label);
    }
    .search-box input::placeholder { color: var(--label-3); }

    /* TODAY */
    .today { max-width: 780px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

    .hero-weather {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 24px;
      padding: 32px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
      animation: heroIn 500ms var(--ease-spring);
    }
    @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 720px) { .hero-weather { grid-template-columns: 1fr; } }

    .hw-loc { font-size: var(--fs-xs); color: var(--label-2); font-weight: 500; }
    .hw-temp {
      font-size: 96px;
      font-weight: 200;
      line-height: 1;
      letter-spacing: -0.06em;
      margin: 12px 0 8px;
      font-variant-numeric: tabular-nums;
      color: var(--label);
    }
    .hw-temp span { font-size: 0.5em; vertical-align: super; color: var(--label-2); }
    .hw-desc { font-size: var(--fs-md); color: var(--label); font-weight: 500; }
    .hw-feels { font-size: var(--fs-xs); color: var(--label-3); margin-top: 4px; }

    .hw-right { display: flex; flex-direction: column; gap: 14px; min-width: 180px; }
    .metric {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
    }
    .m-icon { font-size: 20px; }
    .metric small { font-size: var(--fs-2xs); color: var(--label-3);
                    text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;
                    display: block; }
    .metric b { font-size: var(--fs-base); font-weight: 700; font-variant-numeric: tabular-nums; }

    .block-sm { padding: 20px; background: var(--bg-surface-solid);
                border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .block-sm h4 { font-size: var(--fs-xs); font-weight: 700; text-transform: uppercase;
                   letter-spacing: 0.06em; color: var(--label-3); margin-bottom: 14px; }

    .hourly { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 4px; }
    .hour {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 10px 12px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      flex-shrink: 0;
      transition: background var(--t-fast);
    }
    .hour:hover { background: var(--bg-fill-3); }
    .h-time { font-size: var(--fs-2xs); color: var(--label-3); font-weight: 600; }
    .h-icon { font-size: 20px; }
    .h-temp { font-size: var(--fs-sm); font-weight: 700; font-variant-numeric: tabular-nums; }

    .daily { display: flex; flex-direction: column; gap: 6px; }
    .day-row {
      display: grid;
      grid-template-columns: 60px 40px 1fr 100px;
      gap: 12px;
      align-items: center;
      padding: 8px 0;
      font-size: var(--fs-xs);
    }
    .d-day { font-weight: 600; color: var(--label); }
    .d-icon { font-size: 18px; text-align: center; }
    .d-bar { height: 5px; background: var(--bg-fill-2); border-radius: var(--r-pill);
             position: relative; overflow: hidden; }
    .d-fill {
      position: absolute;
      top: 0; bottom: 0;
      background: var(--accent);
      border-radius: var(--r-pill);
      transition: all 500ms var(--ease-out);
    }
    .d-temp { text-align: right; color: var(--label-2); font-variant-numeric: tabular-nums; }
    .d-temp b { color: var(--label); font-weight: 700; }

    /* CITIES */
    .cities { max-width: 1080px; margin: 0 auto; }
    .cities h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 20px; }
    .city-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
    .city-card {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      cursor: pointer;
      transition: all var(--t-base) var(--ease-spring);
    }
    .city-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .city-card.active { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-soft); }
    .city-card header { display: flex; align-items: baseline; justify-content: space-between; }
    .city-card header b { font-size: var(--fs-base); font-weight: 700; }
    .city-card header small { font-size: var(--fs-2xs); color: var(--label-3); }
    .cc-temp { font-size: var(--fs-3xl); font-weight: 200; letter-spacing: -0.03em;
               margin: 8px 0 4px; font-variant-numeric: tabular-nums; }
    .cc-desc { font-size: var(--fs-xs); color: var(--label-2); }
    .cc-meta { display: flex; gap: 12px; margin-top: 12px; padding-top: 12px;
               border-top: 0.5px solid var(--separator);
               font-size: var(--fs-2xs); color: var(--label-2); }

    .empty { grid-column: 1 / -1; padding: 60px; text-align: center;
             display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .empty span { font-size: 40px; opacity: 0.4; }
  `],
})
export class WeatherPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'today', label: 'Today', icon: '🌤' },
    { id: 'cities', label: 'Cities', icon: '🏙' },
  ];
  readonly active = signal('today');
  readonly currentId = signal(1);
  readonly query = signal('');

  readonly cities: City[] = [
    { id: 1, name: 'Cairo', country: 'EG', emoji: '☀︎', temp: 28, feels: 31, desc: 'Sunny', humidity: 42, wind: 12 },
    { id: 2, name: 'Alexandria', country: 'EG', emoji: '⛅', temp: 24, feels: 26, desc: 'Partly cloudy', humidity: 68, wind: 18 },
    { id: 3, name: 'Luxor', country: 'EG', emoji: '☀︎', temp: 34, feels: 37, desc: 'Hot', humidity: 22, wind: 8 },
    { id: 4, name: 'Aswan', country: 'EG', emoji: '🌧', temp: 22, feels: 20, desc: 'Rainy', humidity: 82, wind: 24 },
  ];

  readonly current = computed(() => this.cities.find(c => c.id === this.currentId()) ?? this.cities[0]);

  readonly filteredCities = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.cities;
    return this.cities.filter(c => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q));
  });

  selectCity(id: number): void { this.currentId.set(id); }

  readonly hourly = [
    { time: 'Now', icon: '☀︎', temp: 28 },
    { time: '1PM', icon: '☀︎', temp: 29 },
    { time: '2PM', icon: '☀︎', temp: 31 },
    { time: '3PM', icon: '⛅', temp: 30 },
    { time: '4PM', icon: '⛅', temp: 28 },
    { time: '5PM', icon: '🌤', temp: 26 },
    { time: '6PM', icon: '🌅', temp: 24 },
    { time: '7PM', icon: '🌙', temp: 22 },
  ];

  readonly daily = [
    { day: 'Today', icon: '☀︎', low: 22, high: 30 },
    { day: 'Wed', icon: '☀︎', low: 21, high: 31 },
    { day: 'Thu', icon: '⛅', low: 20, high: 28 },
    { day: 'Fri', icon: '🌧', low: 18, high: 24 },
    { day: 'Sat', icon: '🌧', low: 17, high: 22 },
    { day: 'Sun', icon: '⛅', low: 19, high: 26 },
    { day: 'Mon', icon: '☀︎', low: 21, high: 29 },
  ];
}