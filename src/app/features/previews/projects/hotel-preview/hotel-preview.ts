import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PreviewNavItem, PreviewShellComponent } from '../../shared/preview-shell/preview-shell';

interface Room {
  id: number; name: string; price: number; beds: number; size: number;
  amenities: string[]; available: boolean;
}

@Component({
  selector: 'app-hotel-preview',
  standalone: true,
  imports: [PreviewShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🏨"
      title="Grand Nile"
      subtitle="Cairo · 5-star"
      [nav]="nav"
      [active]="active()"
    >
      <div actions>
        @if (bookingCount() > 0) {
          <span class="cart-pill">🛏 {{ bookingCount() }} booked</span>
        }
      </div>

      @if (active() === 'rooms') {
        <div class="rooms">
          <header class="rooms-head">
            <h3>Available Rooms</h3>
            <p>Dec 20 – Dec 27 · 2 guests</p>
          </header>
          <div class="room-grid">
            @for (r of rooms; track r.id) {
              <article class="room-card" [class.selected]="selectedId() === r.id" (click)="selectedId.set(r.id)">
                <div class="room-img" [class]="'img-' + r.id">
                  <span class="stars">★★★★★</span>
                  @if (!r.available) {
                    <span class="sold-out">SOLD OUT</span>
                  }
                </div>
                <div class="room-body">
                  <div class="room-row">
                    <b>{{ r.name }}</b>
                    <span class="price">&#36;{{ r.price }}<small> / night</small></span>                  
                  </div>
                  <div class="room-meta">
                    <span>🛏 {{ r.beds }} bed{{ r.beds > 1 ? 's' : '' }}</span>
                    <span>📐 {{ r.size }} m²</span>
                  </div>
                  <ul class="amenities">
                    @for (a of r.amenities; track a) {
                      <li>{{ a }}</li>
                    }
                  </ul>
                  <button class="book-btn" [disabled]="!r.available" (click)="book(r.id); $event.stopPropagation()">
                    {{ !r.available ? 'Unavailable' : (booked().includes(r.id) ? '✓ Booked' : 'Book Now') }}
                  </button>
                </div>
              </article>
            }
          </div>
        </div>
      } @else if (active() === 'bookings') {
        <div class="bookings">
          <h3>My Bookings</h3>
          @if (booked().length === 0) {
            <div class="empty">
              <span>🛏</span>
              <b>No bookings yet</b>
              <small>Browse rooms and book your stay</small>
            </div>
          } @else {
            @for (id of booked(); track id) {
              @if (roomById(id); as r) {
                <article class="booking">
                  <div class="b-icon">🏨</div>
                  <div class="b-info">
                    <b>{{ r.name }}</b>
                    <small>Dec 20 – Dec 27 · 7 nights · 2 guests</small>
                  </div>
                  <div class="b-price">
                    <b>&#36;{{ r.price * 7 }}</b>
                    <small>total</small>
                  </div>
                  <button class="cancel" (click)="unbook(id)">Cancel</button>
                </article>
              }
            }
          }
        </div>
      } @else {
        <div class="admin">
          <h3>Dashboard</h3>
          <div class="kpis">
            <div class="kpi"><span>Occupancy</span><b>78%</b></div>
            <div class="kpi"><span>Check-ins today</span><b>24</b></div>
            <div class="kpi"><span>Revenue (week)</span><b>$48.2K</b></div>
            <div class="kpi"><span>Avg rating</span><b>4.8</b></div>
          </div>
          <div class="grid-2">
            <section class="card">
              <h4>Room Status</h4>
              @for (r of rooms; track r.id) {
                <div class="status-row">
                  <span>{{ r.name }}</span>
                  <div class="occ-bar"><div [style.width.%]="r.available ? 30 : 100"></div></div>
                  <span class="status" [class.full]="!r.available">{{ r.available ? 'Open' : 'Full' }}</span>
                </div>
              }
            </section>
            <section class="card">
              <h4>Recent Check-ins</h4>
              @for (g of guests; track g.id) {
                <div class="guest-row">
                  <div class="g-av">{{ g.name.charAt(0) }}</div>
                  <div><b>{{ g.name }}</b><small>{{ g.room }}</small></div>
                  <span class="mono small">{{ g.time }}</span>
                </div>
              }
            </section>
          </div>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .cart-pill {
      padding: 6px 12px;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: var(--r-pill);
      font-size: var(--fs-xs);
      font-weight: 600;
    }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .mono.small { font-size: var(--fs-2xs); }

    /* ROOMS */
    .rooms { max-width: 1080px; margin: 0 auto; }
    .rooms-head { margin-bottom: 20px; }
    .rooms-head h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .rooms-head p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 4px; }

    .room-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .room-card {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
      overflow: hidden;
      cursor: pointer;
      transition: all var(--t-base) var(--ease-spring);
    }
    .room-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    .room-card.selected { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-soft); }

    .room-img {
      height: 140px;
      position: relative;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 12px;
    }
    .room-img.img-1 { background: #6f8fa8; }
    .room-img.img-2 { background: #8a6f5c; }
    .room-img.img-3 { background: #5c6f8a; }
    .stars {
      color: #ffb340;
      font-size: 12px;
      letter-spacing: 1px;
    }
    .sold-out {
      background: rgba(0, 0, 0, 0.55);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: var(--r-pill);
      letter-spacing: 0.06em;
    }

    .room-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .room-row { display: flex; justify-content: space-between; align-items: baseline; }
    .room-row b { font-size: var(--fs-base); font-weight: 700; }
    .price { font-size: var(--fs-base); font-weight: 800; color: var(--accent);
             font-variant-numeric: tabular-nums; }
    .price small { font-size: 10px; font-weight: 500; color: var(--label-3); margin-left: 1px; }
    .room-meta { display: flex; gap: 12px; font-size: var(--fs-2xs); color: var(--label-2); }
    .amenities {
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .amenities li {
      background: var(--bg-fill-2);
      padding: 2px 8px;
      border-radius: var(--r-pill);
      font-size: 10px;
      color: var(--label-2);
    }
    .book-btn {
      padding: 10px 16px;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: var(--r-sm);
      font-size: var(--fs-sm);
      font-weight: 600;
      margin-top: 4px;
      transition: all var(--t-fast);
    }
    .book-btn:hover:not(:disabled) { background: var(--accent-hover); }
    .book-btn:disabled { background: var(--bg-fill-3); color: var(--label-3); cursor: not-allowed; }

    /* BOOKINGS */
    .bookings { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
    .bookings h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; }
    .booking {
      display: grid;
      grid-template-columns: 48px 1fr auto auto;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      animation: bookingIn 320ms var(--ease-spring);
    }
    @keyframes bookingIn {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .b-icon { font-size: 32px; }
    .b-info b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .b-info small { font-size: var(--fs-2xs); color: var(--label-2); }
    .b-price { text-align: right; }
    .b-price b { font-size: var(--fs-base); font-weight: 800; color: var(--accent);
                 font-variant-numeric: tabular-nums; display: block; }
    .b-price small { font-size: 10px; color: var(--label-3); }
    .cancel {
      padding: 6px 12px;
      border-radius: var(--r-sm);
      color: #ff3b30;
      background: rgba(255, 59, 48, 0.1);
      font-size: var(--fs-2xs);
      font-weight: 600;
      transition: background var(--t-fast);
    }
    .cancel:hover { background: rgba(255, 59, 48, 0.2); }

    .empty {
      padding: 60px 20px;
      text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .empty span { font-size: 48px; opacity: 0.4; }
    .empty b { font-size: var(--fs-base); }
    .empty small { font-size: var(--fs-sm); color: var(--label-2); }

    /* ADMIN */
    .admin { max-width: 1080px; margin: 0 auto; }
    .admin h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 20px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    @media (max-width: 780px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
    .kpi {
      padding: 18px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .kpi span { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase;
                letter-spacing: 0.06em; font-weight: 600; }
    .kpi b { display: block; font-size: var(--fs-2xl); font-weight: 800;
             letter-spacing: -0.03em; margin-top: 4px;
             font-variant-numeric: tabular-nums; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 780px) { .grid-2 { grid-template-columns: 1fr; } }
    .card {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .card h4 { font-size: var(--fs-sm); font-weight: 700; margin-bottom: 14px; }

    .status-row { display: grid; grid-template-columns: 140px 1fr 60px; gap: 12px;
                  align-items: center; padding: 8px 0; font-size: var(--fs-xs); }
    .occ-bar { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .occ-bar div { height: 100%; background: var(--accent); border-radius: var(--r-pill);
                   transition: width 500ms var(--ease-out); }
    .status { font-size: 10px; font-weight: 700; text-align: right; color: #34c759;
              text-transform: uppercase; letter-spacing: 0.04em; }
    .status.full { color: #ff3b30; }

    .guest-row { display: grid; grid-template-columns: auto 1fr auto; gap: 12px;
                 align-items: center; padding: 10px 0; border-bottom: 0.5px solid var(--separator); }
    .guest-row:last-child { border-bottom: 0; }
    .g-av {
      width: 30px; height: 30px;
      display: grid; place-items: center;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: 50%;
      font-size: var(--fs-xs);
      font-weight: 700;
    }
    .guest-row b { font-size: var(--fs-xs); font-weight: 600; display: block; }
    .guest-row small { font-size: var(--fs-2xs); color: var(--label-2); }
  `],
})
export class HotelPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'rooms', label: 'Rooms', icon: '🛏' },
    { id: 'bookings', label: 'My Bookings', icon: '📅' },
    { id: 'admin', label: 'Admin', icon: '📊' },
  ];

  readonly active = signal('rooms');
  readonly selectedId = signal(1);
  readonly booked = signal<number[]>([]);
  readonly bookingCount = computed(() => this.booked().length);

  readonly rooms: Room[] = [
    {
      id: 1, name: 'Deluxe Nile View', price: 180, beds: 1, size: 32,
      amenities: ['🌅 Nile view', '📺 55"', '🍷 minibar'],
      available: true
    },
    {
      id: 2, name: 'Executive Suite', price: 320, beds: 2, size: 58,
      amenities: ['🛁 jacuzzi', '🧖 spa access', '🍾 welcome'],
      available: true
    },
    {
      id: 3, name: 'Presidential Suite', price: 950, beds: 2, size: 120,
      amenities: ['🏊 private pool', '🧑‍🍳 butler', '🚗 limo'],
      available: false
    },
  ];

  roomById(id: number): Room | undefined {
    return this.rooms.find(r => r.id === id);
  }

  book(id: number): void {
    if (this.booked().includes(id)) return;
    this.booked.update(list => [...list, id]);
  }
  unbook(id: number): void {
    this.booked.update(list => list.filter(x => x !== id));
  }

  readonly guests = [
    { id: 1, name: 'Sara Ahmed', room: 'Deluxe 401', time: '10:24' },
    { id: 2, name: 'Omar Khaled', room: 'Suite 802', time: '10:12' },
    { id: 3, name: 'Layla Hassan', room: 'Deluxe 305', time: '09:58' },
    { id: 4, name: 'Khaled M.', room: 'Suite 810', time: '09:41' },
  ];
}