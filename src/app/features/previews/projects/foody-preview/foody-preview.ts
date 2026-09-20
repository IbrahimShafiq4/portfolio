import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PreviewNavItem, PreviewShellComponent } from '../../shared/preview-shell/preview-shell';

interface Dish { id: number; name: string; price: number; category: string; emoji: string; rating: number; }
interface CartItem { dish: Dish; qty: number; }

@Component({
  selector: 'app-foody-preview',
  standalone: true,
  imports: [PreviewShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🍔"
      title="Foody"
      subtitle="Order food online"
      [nav]="nav"
      [active]="active()"
    >
      <div actions>
        @if (cartCount() > 0) {
          <button class="cart-pill" (click)="active.set('cart')">
            🛒 {{ cartCount() }} · $ {{ cartTotal() }}
          </button>
        }
      </div>

      @if (active() === 'menu') {
        <div class="menu">
          <div class="cat-tabs">
            @for (c of categories; track c.id) {
              <button class="cat-tab" [class.active]="category() === c.id" (click)="category.set(c.id)">
                {{ c.icon }} {{ c.label }}
              </button>
            }
          </div>
          <div class="dish-grid">
            @for (d of visible(); track d.id) {
              <article class="dish">
                <div class="dish-img">{{ d.emoji }}</div>
                <div class="dish-body">
                  <div class="dish-row">
                    <b>{{ d.name }}</b>
                    <span class="rating">⭐ {{ d.rating }}</span>
                  </div>
                  <p class="dish-cat">{{ d.category }}</p>
                  <div class="dish-foot">
                    <span class="price">$ {{ d.price }}</span>
                    <button class="add-btn" (click)="add(d)">Add</button>
                  </div>
                </div>
              </article>
            }
          </div>
        </div>
      } @else if (active() === 'cart') {
        <div class="cart-view">
          <h3>Your Order</h3>
          @if (cart().length === 0) {
            <div class="empty">
              <span>🛒</span>
              <b>Cart is empty</b>
              <small>Add some dishes to get started</small>
            </div>
          } @else {
            <ul class="cart-list">
              @for (item of cart(); track item.dish.id) {
                <li class="cart-item">
                  <span class="ci-emoji">{{ item.dish.emoji }}</span>
                  <div class="ci-info">
                    <b>{{ item.dish.name }}</b>
                    <small>$ {{ item.dish.price }} each</small>
                  </div>
                  <div class="qty">
                    <button (click)="dec(item.dish.id)">−</button>
                    <span>{{ item.qty }}</span>
                    <button (click)="inc(item.dish.id)">+</button>
                  </div>
                  <span class="ci-total">$ {{ item.dish.price * item.qty }}</span>
                  <button class="rm" (click)="remove(item.dish.id)">✕</button>
                </li>
              }
            </ul>
            <footer class="checkout">
              <div class="row"><span>Subtotal</span><b>$ {{ cartTotal() }}</b></div>
              <div class="row"><span>Delivery</span><b>$ 5</b></div>
              <div class="row total"><span>Total</span><b>$ {{ cartTotal() + 5}}</b></div>
              <button class="checkout-btn" (click)="placeOrder()">Place Order</button>
            </footer>
          }
        </div>
      } @else {
        <div class="admin-view">
          <h3>Kitchen Dashboard</h3>
          <div class="kpis">
            <div class="kpi"><span>Orders today</span><b>142</b></div>
            <div class="kpi"><span>Revenue</span><b>$3,840</b></div>
            <div class="kpi"><span>Avg prep</span><b>14m</b></div>
            <div class="kpi"><span>Rating</span><b>4.7</b></div>
          </div>
          <section class="orders-card">
            <h4>Live Orders</h4>
            @for (o of orders; track o.id) {
              <div class="order-row">
                <span class="order-id mono">{{ o.id }}</span>
                <div><b>{{ o.customer }}</b><small>{{ o.items }}</small></div>
                <span class="order-status" [class]="o.status">{{ o.status }}</span>
                <span class="mono small">$ {{ o.total }}</span>
              </div>
            }
          </section>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .mono.small { font-size: var(--fs-2xs); }
    .cart-pill {
      padding: 6px 14px;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: var(--r-pill);
      font-size: var(--fs-xs);
      font-weight: 700;
      transition: all var(--t-fast);
    }
    .cart-pill:hover { background: var(--accent-hover); }

    /* MENU */
    .menu { max-width: 1080px; margin: 0 auto; }
    .cat-tabs { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
    .cat-tab {
      padding: 8px 14px;
      background: var(--bg-fill-2);
      color: var(--label-2);
      border-radius: var(--r-pill);
      font-size: var(--fs-xs);
      font-weight: 600;
      transition: all var(--t-base) var(--ease-spring);
    }
    .cat-tab:hover { background: var(--bg-fill-3); color: var(--label); }
    .cat-tab.active { background: var(--accent); color: var(--accent-contrast); }

    .dish-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
    .dish {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
      transition: all var(--t-base) var(--ease-spring);
    }
    .dish:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    .dish-img {
      height: 100px;
      display: grid; place-items: center;
      font-size: 44px;
      background: var(--bg-fill-2);
    }
    .dish-body { padding: 14px; display: flex; flex-direction: column; gap: 6px; }
    .dish-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .dish-row b { font-size: var(--fs-sm); font-weight: 700; }
    .rating { font-size: var(--fs-2xs); color: #ff9500; font-weight: 600; flex-shrink: 0; }
    .dish-cat { font-size: var(--fs-2xs); color: var(--label-3); text-transform: uppercase;
                letter-spacing: 0.06em; font-weight: 600; }
    .dish-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
    .price { font-size: var(--fs-md); font-weight: 800; color: var(--accent);
             font-variant-numeric: tabular-nums; }
    .add-btn {
      padding: 6px 14px;
      background: var(--bg-fill-2);
      color: var(--label);
      border-radius: var(--r-pill);
      font-size: var(--fs-xs);
      font-weight: 600;
      transition: all var(--t-fast);
    }
    .add-btn:hover { background: var(--accent); color: var(--accent-contrast); }

    /* CART */
    .cart-view { max-width: 720px; margin: 0 auto; }
    .cart-view h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 20px; }
    .cart-list { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .cart-item {
      display: grid;
      grid-template-columns: 48px 1fr auto auto auto;
      gap: 12px;
      align-items: center;
      padding: 14px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      animation: itemIn 260ms var(--ease-spring);
    }
    @keyframes itemIn {
      from { opacity: 0; transform: translateX(-6px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .ci-emoji { font-size: 28px; text-align: center; }
    .ci-info b { font-size: var(--fs-sm); font-weight: 600; display: block; }
    .ci-info small { font-size: var(--fs-2xs); color: var(--label-2); }
    .qty {
      display: flex; align-items: center; gap: 0;
      background: var(--bg-fill-2);
      border-radius: var(--r-pill);
      padding: 2px;
    }
    .qty button {
      width: 26px; height: 26px;
      border-radius: 50%;
      color: var(--label);
      font-size: 14px;
      font-weight: 700;
      transition: background var(--t-fast);
    }
    .qty button:hover { background: var(--bg-fill-3); }
    .qty span {
      min-width: 24px;
      text-align: center;
      font-size: var(--fs-sm);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .ci-total { font-size: var(--fs-sm); font-weight: 700; color: var(--accent);
                min-width: 60px; text-align: right; font-variant-numeric: tabular-nums; }
    .rm {
      width: 26px; height: 26px;
      display: grid; place-items: center;
      border-radius: 50%;
      color: var(--label-3);
      transition: all var(--t-fast);
    }
    .rm:hover { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

    .checkout {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .checkout .row { display: flex; justify-content: space-between; font-size: var(--fs-sm); }
    .checkout .row span { color: var(--label-2); }
    .checkout .row b { font-weight: 600; font-variant-numeric: tabular-nums; }
    .checkout .row.total { padding-top: 10px; border-top: 0.5px solid var(--separator);
                            margin-top: 4px; font-size: var(--fs-base); }
    .checkout .row.total b { color: var(--accent); font-weight: 800; }
    .checkout-btn {
      padding: 12px;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: var(--r-sm);
      font-size: var(--fs-sm);
      font-weight: 700;
      margin-top: 8px;
      transition: all var(--t-fast);
    }
    .checkout-btn:hover { background: var(--accent-hover); }

    .empty { padding: 60px; text-align: center; display: flex; flex-direction: column;
             align-items: center; gap: 8px; }
    .empty span { font-size: 48px; opacity: 0.4; }
    .empty b { font-size: var(--fs-base); }
    .empty small { font-size: var(--fs-sm); color: var(--label-2); }

    /* ADMIN */
    .admin-view { max-width: 1080px; margin: 0 auto; }
    .admin-view h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 20px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    @media (max-width: 780px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
    .kpi { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
           border-radius: var(--r-md); }
    .kpi span { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase;
                letter-spacing: 0.06em; font-weight: 600; }
    .kpi b { display: block; font-size: var(--fs-2xl); font-weight: 800;
             letter-spacing: -0.03em; margin-top: 4px; font-variant-numeric: tabular-nums; }

    .orders-card {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .orders-card h4 { font-size: var(--fs-sm); font-weight: 700; margin-bottom: 14px; }
    .order-row { display: grid; grid-template-columns: 70px 1fr auto 70px; gap: 14px;
                 align-items: center; padding: 12px 0;
                 border-bottom: 0.5px solid var(--separator); font-size: var(--fs-xs); }
    .order-row:last-child { border-bottom: 0; }
    .order-id { color: var(--accent); font-weight: 700; }
    .order-row b { font-size: var(--fs-xs); font-weight: 600; display: block; }
    .order-row small { font-size: var(--fs-2xs); color: var(--label-2); }
    .order-status { padding: 3px 10px; border-radius: var(--r-pill); font-size: 10px;
                    font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .order-status.cooking { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .order-status.ready   { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .order-status.new     { background: var(--accent-soft); color: var(--accent); }
  `],
})
export class FoodyPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'menu', label: 'Menu', icon: '🍽' },
    { id: 'cart', label: 'Cart', icon: '🛒' },
    { id: 'admin', label: 'Admin', icon: '📊' },
  ];

  readonly active = signal('menu');
  readonly category = signal('all');

  readonly categories = [
    { id: 'all', label: 'All', icon: '🍴' },
    { id: 'pizza', label: 'Pizza', icon: '🍕' },
    { id: 'burger', label: 'Burger', icon: '🍔' },
    { id: 'sushi', label: 'Sushi', icon: '🍣' },
    { id: 'dessert', label: 'Dessert', icon: '🍰' },
  ];

  readonly dishes: Dish[] = [
    { id: 1, name: 'Margherita', price: 12, category: 'pizza', emoji: '🍕', rating: 4.8 },
    { id: 2, name: 'Pepperoni', price: 14, category: 'pizza', emoji: '🍕', rating: 4.9 },
    { id: 3, name: 'Classic Burger', price: 9, category: 'burger', emoji: '🍔', rating: 4.7 },
    { id: 4, name: 'Double Cheese', price: 12, category: 'burger', emoji: '🍔', rating: 4.8 },
    { id: 5, name: 'Salmon Roll', price: 18, category: 'sushi', emoji: '🍣', rating: 4.9 },
    { id: 6, name: 'California Roll', price: 15, category: 'sushi', emoji: '🍣', rating: 4.6 },
    { id: 7, name: 'Chocolate Cake', price: 7, category: 'dessert', emoji: '🍰', rating: 4.9 },
    { id: 8, name: 'Tiramisu', price: 8, category: 'dessert', emoji: '🍮', rating: 4.8 },
  ];

  readonly visible = computed(() => {
    const c = this.category();
    return c === 'all' ? this.dishes : this.dishes.filter(d => d.category === c);
  });

  readonly cart = signal<CartItem[]>([]);
  readonly cartCount = computed(() => this.cart().reduce((s, i) => s + i.qty, 0));
  readonly cartTotal = computed(() => this.cart().reduce((s, i) => s + i.dish.price * i.qty, 0));

  add(d: Dish): void {
    this.cart.update(list => {
      const found = list.find(i => i.dish.id === d.id);
      return found
        ? list.map(i => i.dish.id === d.id ? { ...i, qty: i.qty + 1 } : i)
        : [...list, { dish: d, qty: 1 }];
    });
  }
  inc(id: number): void {
    this.cart.update(list => list.map(i => i.dish.id === id ? { ...i, qty: i.qty + 1 } : i));
  }
  dec(id: number): void {
    this.cart.update(list => list
      .map(i => i.dish.id === id ? { ...i, qty: i.qty - 1 } : i)
      .filter(i => i.qty > 0)
    );
  }
  remove(id: number): void {
    this.cart.update(list => list.filter(i => i.dish.id !== id));
  }
  placeOrder(): void {
    this.cart.set([]);
    this.active.set('menu');
  }

  readonly orders = [
    { id: '#4021', customer: 'Sara A.', items: '2× Margherita, 1× Coke', status: 'cooking', total: 31 },
    { id: '#4022', customer: 'Omar K.', items: '1× Double Cheese, 1× Fries', status: 'ready', total: 18 },
    { id: '#4023', customer: 'Layla H.', items: '3× Salmon Roll', status: 'new', total: 54 },
    { id: '#4024', customer: 'Khaled M.', items: '1× Tiramisu, 2× Coffee', status: 'ready', total: 22 },
  ];
}