import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PreviewNavItem, PreviewShellComponent } from '../../shared/preview-shell/preview-shell';

interface Product {
  id: number; name: string; price: number; oldPrice?: number;
  category: string; rating: number; reviews: number;
  color: string; badge?: string;
}
interface CartLine { product: Product; qty: number; }

@Component({
  selector: 'app-ennwy-preview',
  standalone: true,
  imports: [PreviewShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🛍"
      title="Ennwy"
      subtitle="Modern e-commerce"
      [nav]="nav"
      [active]="active()"
      (activeChange)="active.set($any($event))"
    >
      <div actions>
        @if (cartCount() > 0) {
          <button class="cart-pill" (click)="active.set('cart')">
            🛒 {{ cartCount() }} · $ {{ cartTotal() }}
          </button>
        }
      </div>

      @if (active() === 'shop') {
        <div class="shop">
          <div class="hero-banner">
            <div>
              <span class="badge-hero">New Collection</span>
              <h3>Everyday essentials</h3>
              <p>Quality pieces designed for the modern lifestyle.</p>
            </div>
            <button class="pill primary">Shop now →</button>
          </div>

          <div class="cat-tabs">
            @for (c of categories; track c.id) {
              <button class="cat" [class.active]="category() === c.id" (click)="category.set(c.id)">
                {{ c.label }}
              </button>
            }
          </div>

          <div class="product-grid">
            @for (p of visible(); track p.id) {
              <article class="product">
                @if (p.badge) {
                  <span class="product-badge" [attr.data-b]="p.badge">{{ p.badge }}</span>
                }
                <button class="wish" (click)="toggleWish(p.id)" [class.on]="wishlist().includes(p.id)">
                  {{ wishlist().includes(p.id) ? '❤️' : '🤍' }}
                </button>
                <div class="product-img" [style.background]="p.color">
                  <span class="pi-emoji">{{ emojiFor(p.category) }}</span>
                </div>
                <div class="product-body">
                  <span class="p-cat">{{ p.category }}</span>
                  <h4>{{ p.name }}</h4>
                  <div class="p-rating">
                    <span class="stars">★★★★★</span>
                    <small>{{ p.rating }} ({{ p.reviews }})</small>
                  </div>
                  <div class="p-foot">
                    <div class="p-prices">
                      <b>$ {{ p.price }}</b>
                      @if (p.oldPrice) { <s>$ {{ p.oldPrice }}</s> }
                    </div>
                    <button class="p-add" (click)="add(p)">Add</button>
                  </div>
                </div>
              </article>
            }
          </div>
        </div>
      } @else if (active() === 'cart') {
        <div class="cart-view">
          <h3>Shopping Cart</h3>
          @if (cart().length === 0) {
            <div class="empty">
              <span>🛒</span>
              <b>Cart is empty</b>
              <small>Start adding products</small>
              <button class="pill primary" (click)="active.set('shop')">Browse products</button>
            </div>
          } @else {
            <div class="cart-layout">
              <ul class="cart-list">
                @for (line of cart(); track line.product.id) {
                  <li class="cart-line">
                    <div class="cl-img" [style.background]="line.product.color">
                      {{ emojiFor(line.product.category) }}
                    </div>
                    <div class="cl-info">
                      <b>{{ line.product.name }}</b>
                      <small>{{ line.product.category }} · $ {{ line.product.price }} each</small>
                    </div>
                    <div class="qty">
                      <button (click)="dec(line.product.id)">−</button>
                      <span>{{ line.qty }}</span>
                      <button (click)="inc(line.product.id)">+</button>
                    </div>
                    <span class="cl-total">$ {{ line.product.price * line.qty }}</span>
                    <button class="cl-rm" (click)="remove(line.product.id)">✕</button>
                  </li>
                }
              </ul>
              <aside class="order-summary">
                <h4>Order Summary</h4>
                <div class="sum-row"><span>Subtotal</span><b>$ {{ cartTotal() }}</b></div>
                <div class="sum-row"><span>Shipping</span><b>$8</b></div>
                <div class="sum-row"><span>Tax (14%)</span><b>$ {{ tax() }}</b></div>
                <div class="sum-row total"><span>Total</span><b>$ {{ grandTotal() }}</b></div>
                <button class="checkout-btn" (click)="checkout()">Checkout →</button>
              </aside>
            </div>
          }
        </div>
      } @else {
        <div class="admin">
          <h3>Admin Dashboard</h3>
          <div class="kpis">
            <div class="kpi"><span>Revenue</span><b>$48.2K</b></div>
            <div class="kpi"><span>Orders</span><b>142</b></div>
            <div class="kpi"><span>Products</span><b>{{ allProducts.length }}</b></div>
            <div class="kpi"><span>Customers</span><b>1,847</b></div>
          </div>
          <section class="admin-table">
            <header class="at-head">
              <span>Product</span>
              <span>Stock</span>
              <span>Sold</span>
              <span>Revenue</span>
              <span></span>
            </header>
            @for (p of allProducts; track p.id) {
              <div class="at-row">
                <span class="at-name">
                  <span class="at-emoji">{{ emojiFor(p.category) }}</span>
                  {{ p.name }}
                </span>
                <span class="mono">{{ 50 - p.id * 3 }}</span>
                <span class="mono">{{ p.reviews * 2 }}</span>
                <span class="mono accent">$ {{ (p.reviews * 2) * p.price}}</span>
                <button class="at-menu">⋯</button>
              </div>
            }
          </section>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .pill { padding: 8px 16px; background: var(--bg-fill-2); color: var(--label);
            border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600;
            transition: all var(--t-fast); }
    .pill:hover { background: var(--bg-fill-3); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .mono.accent { color: var(--accent); font-weight: 700; }
    .cart-pill {
      padding: 7px 14px;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: var(--r-pill);
      font-size: var(--fs-xs);
      font-weight: 700;
      transition: all var(--t-fast);
    }
    .cart-pill:hover { background: var(--accent-hover); }

    /* SHOP */
    .shop { max-width: 1120px; margin: 0 auto; }

    .hero-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      padding: 28px 32px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-lg);
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .badge-hero {
      display: inline-block;
      padding: 4px 12px;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: var(--r-pill);
      font-size: var(--fs-2xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 10px;
    }
    .hero-banner h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .hero-banner p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 6px; }

    .cat-tabs { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
    .cat {
      padding: 8px 16px;
      background: var(--bg-fill-2);
      color: var(--label-2);
      border-radius: var(--r-pill);
      font-size: var(--fs-xs);
      font-weight: 600;
      transition: all var(--t-base) var(--ease-spring);
    }
    .cat:hover { background: var(--bg-fill-3); color: var(--label); }
    .cat.active { background: var(--accent); color: var(--accent-contrast); }

    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .product {
      position: relative;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
      transition: all var(--t-base) var(--ease-spring);
    }
    .product:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    .product-img {
      height: 140px;
      display: grid; place-items: center;
      position: relative;
    }
    .pi-emoji { font-size: 56px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15)); }
    .product-badge {
      position: absolute; top: 10px; left: 10px;
      padding: 3px 9px;
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      z-index: 2;
    }
    .product-badge[data-b='New']  { background: var(--accent); color: var(--accent-contrast); }
    .product-badge[data-b='Sale'] { background: #ff3b30; color: #fff; }
    .product-badge[data-b='Hot']  { background: #ff9500; color: #fff; }
    .wish {
      position: absolute;
      top: 10px; right: 10px;
      width: 30px; height: 30px;
      display: grid; place-items: center;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(8px);
      border-radius: 50%;
      font-size: 14px;
      z-index: 2;
      transition: transform var(--t-base) var(--ease-spring);
    }
    .wish:hover { transform: scale(1.1); }
    .wish.on { animation: heartBeat 400ms var(--ease-spring); }
    @keyframes heartBeat {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.35); }
    }

    .product-body { padding: 14px; display: flex; flex-direction: column; gap: 5px; }
    .p-cat { font-size: var(--fs-2xs); text-transform: uppercase; letter-spacing: 0.08em;
             color: var(--label-3); font-weight: 700; }
    .product-body h4 { font-size: var(--fs-sm); font-weight: 700; letter-spacing: -0.015em; }
    .p-rating { display: flex; align-items: center; gap: 6px; }
    .stars { color: #ff9500; font-size: 11px; letter-spacing: 0.5px; }
    .p-rating small { font-size: var(--fs-2xs); color: var(--label-2); }
    .p-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
    .p-prices { display: flex; flex-direction: column; gap: 1px; }
    .p-prices b { font-size: var(--fs-base); font-weight: 800; color: var(--accent);
                  font-variant-numeric: tabular-nums; }
    .p-prices s { font-size: var(--fs-2xs); color: var(--label-3); }
    .p-add {
      padding: 7px 14px;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: var(--r-pill);
      font-size: var(--fs-xs);
      font-weight: 700;
      transition: all var(--t-fast);
    }
    .p-add:hover { background: var(--accent-hover); }

    /* CART */
    .cart-view { max-width: 1000px; margin: 0 auto; }
    .cart-view h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 20px; }
    .cart-layout { display: grid; grid-template-columns: 1fr 280px; gap: 20px; }
    @media (max-width: 800px) { .cart-layout { grid-template-columns: 1fr; } }
    .cart-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .cart-line {
      display: grid;
      grid-template-columns: 60px 1fr auto auto auto;
      gap: 14px;
      align-items: center;
      padding: 14px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      animation: cartIn 260ms var(--ease-spring);
    }
    @keyframes cartIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
    .cl-img {
      width: 60px; height: 60px;
      display: grid; place-items: center;
      border-radius: var(--r-sm);
      font-size: 28px;
    }
    .cl-info b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .cl-info small { font-size: var(--fs-2xs); color: var(--label-2); }
    .qty { display: flex; align-items: center; gap: 0; background: var(--bg-fill-2);
           border-radius: var(--r-pill); padding: 2px; }
    .qty button { width: 26px; height: 26px; border-radius: 50%; color: var(--label);
                  font-size: 14px; font-weight: 700; }
    .qty button:hover { background: var(--bg-fill-3); }
    .qty span { min-width: 24px; text-align: center; font-size: var(--fs-sm); font-weight: 700;
                font-variant-numeric: tabular-nums; }
    .cl-total { font-size: var(--fs-sm); font-weight: 800; color: var(--accent);
                min-width: 60px; text-align: right; font-variant-numeric: tabular-nums; }
    .cl-rm { width: 26px; height: 26px; display: grid; place-items: center;
             border-radius: 50%; color: var(--label-3); }
    .cl-rm:hover { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

    .order-summary {
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      height: fit-content;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .order-summary h4 { font-size: var(--fs-sm); font-weight: 700; margin-bottom: 4px; }
    .sum-row { display: flex; justify-content: space-between; font-size: var(--fs-xs); }
    .sum-row span { color: var(--label-2); }
    .sum-row b { font-weight: 600; font-variant-numeric: tabular-nums; }
    .sum-row.total { padding-top: 10px; border-top: 0.5px solid var(--separator);
                     font-size: var(--fs-base); }
    .sum-row.total b { color: var(--accent); font-weight: 800; font-size: var(--fs-md); }
    .checkout-btn {
      padding: 12px;
      background: var(--accent);
      color: var(--accent-contrast);
      border-radius: var(--r-sm);
      font-size: var(--fs-sm);
      font-weight: 700;
      margin-top: 10px;
      transition: all var(--t-fast);
    }
    .checkout-btn:hover { background: var(--accent-hover); }

    .empty { padding: 80px 20px; text-align: center; display: flex; flex-direction: column;
             align-items: center; gap: 10px; }
    .empty span { font-size: 56px; opacity: 0.4; }
    .empty b { font-size: var(--fs-base); }
    .empty small { font-size: var(--fs-xs); color: var(--label-2); }

    /* ADMIN */
    .admin { max-width: 1000px; margin: 0 auto; }
    .admin h3 { font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 20px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    @media (max-width: 780px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
    .kpi { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
           border-radius: var(--r-md); }
    .kpi span { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase;
                letter-spacing: 0.06em; font-weight: 600; }
    .kpi b { display: block; font-size: var(--fs-2xl); font-weight: 800;
             letter-spacing: -0.03em; margin-top: 4px; font-variant-numeric: tabular-nums; }

    .admin-table {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
    }
    .at-head, .at-row {
      display: grid;
      grid-template-columns: 1fr 80px 80px 120px 40px;
      gap: 16px;
      padding: 14px 18px;
      align-items: center;
      font-size: var(--fs-xs);
    }
    .at-head {
      background: var(--bg-fill-2);
      font-size: var(--fs-2xs);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--label-2);
      font-weight: 700;
    }
    .at-row { border-top: 0.5px solid var(--separator); }
    .at-name { display: flex; align-items: center; gap: 10px; font-weight: 600; }
    .at-emoji { font-size: 20px; }
    .at-menu { width: 28px; height: 28px; border-radius: var(--r-xs);
               color: var(--label-3); font-size: 16px; }
    .at-menu:hover { background: var(--bg-hover); color: var(--label); }
  `],
})
export class EnnwyPreviewComponent {
  readonly nav: PreviewNavItem[] = [
    { id: 'shop', label: 'Shop', icon: '🛍' },
    { id: 'cart', label: 'Cart', icon: '🛒' },
    { id: 'admin', label: 'Admin', icon: '📊' },
  ];
  readonly active = signal('shop');
  readonly category = signal('all');
  readonly wishlist = signal<number[]>([]);

  readonly categories = [
    { id: 'all', label: 'All products' },
    { id: 'clothing', label: 'Clothing' },
    { id: 'shoes', label: 'Shoes' },
    { id: 'accessory', label: 'Accessories' },
    { id: 'bag', label: 'Bags' },
  ];

  readonly allProducts: Product[] = [
    { id: 1, name: 'Classic Tee', price: 29, oldPrice: 39, category: 'clothing', rating: 4.7, reviews: 124, color: '#7c8fa8', badge: 'Sale' },
    { id: 2, name: 'Canvas Sneakers', price: 89, category: 'shoes', rating: 4.9, reviews: 89, color: '#a8897c', badge: 'Hot' },
    { id: 3, name: 'Leather Belt', price: 49, category: 'accessory', rating: 4.6, reviews: 42, color: '#8a6f5c' },
    { id: 4, name: 'Hoodie', price: 79, category: 'clothing', rating: 4.8, reviews: 213, color: '#5c6f8a', badge: 'New' },
    { id: 5, name: 'Leather Bag', price: 189, category: 'bag', rating: 4.9, reviews: 67, color: '#6f5c8a' },
    { id: 6, name: 'Wool Cap', price: 39, category: 'accessory', rating: 4.5, reviews: 34, color: '#8a5c6f' },
    { id: 7, name: 'Denim Jeans', price: 119, category: 'clothing', rating: 4.7, reviews: 156, color: '#5c728a' },
    { id: 8, name: 'Running Shoes', price: 149, category: 'shoes', rating: 4.8, reviews: 98, color: '#8a7c5c', badge: 'New' },
  ];

  readonly visible = computed(() => {
    const c = this.category();
    return c === 'all' ? this.allProducts : this.allProducts.filter(p => p.category === c);
  });

  readonly cart = signal<CartLine[]>([]);
  readonly cartCount = computed(() => this.cart().reduce((s, l) => s + l.qty, 0));
  readonly cartTotal = computed(() => this.cart().reduce((s, l) => s + l.product.price * l.qty, 0));
  readonly tax = computed(() => Math.round(this.cartTotal() * 0.14));
  readonly grandTotal = computed(() => this.cartTotal() + 8 + this.tax());

  emojiFor(cat: string): string {
    return { clothing: '👕', shoes: '👟', accessory: '👜', bag: '🎒' }[cat] ?? '📦';
  }

  add(p: Product): void {
    this.cart.update(list => {
      const found = list.find(l => l.product.id === p.id);
      return found
        ? list.map(l => l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l)
        : [...list, { product: p, qty: 1 }];
    });
  }
  inc(id: number): void { this.cart.update(l => l.map(x => x.product.id === id ? { ...x, qty: x.qty + 1 } : x)); }
  dec(id: number): void {
    this.cart.update(l => l.map(x => x.product.id === id ? { ...x, qty: x.qty - 1 } : x).filter(x => x.qty > 0));
  }
  remove(id: number): void { this.cart.update(l => l.filter(x => x.product.id !== id)); }
  toggleWish(id: number): void {
    this.wishlist.update(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);
  }
  checkout(): void {
    alert(`Order placed! Total: $$ {this.grandTotal()}`);
    this.cart.set([]);
    this.active.set('shop');
  }
}