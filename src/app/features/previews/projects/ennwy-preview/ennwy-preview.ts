import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PreviewShellComponent, PreviewNavItem, ToolbarAction, PreviewNotification } from '../../shared/preview-shell/preview-shell';

type EnnwyView =
  | 'home' | 'apartments' | 'cars' | 'listing'
  | 'compare' | 'favorites' | 'messages' | 'sell' | 'profile';

type Lang = 'en' | 'ar';

interface Apartment {
  id: string;
  title: string; titleAr: string;
  city: string; cityAr: string;
  district: string; districtAr: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  totalFloors: number;
  furnished: boolean;
  type: 'apartment' | 'duplex' | 'penthouse' | 'villa' | 'studio';
  finishing: 'super-lux' | 'lux' | 'semi-finished' | 'core-shell';
  amenities: string[];
  images: string[];
  featured: boolean;
  posted: string; postedAr: string;
  views: number;
  isNew: boolean;
  compoundName?: string;
}

interface Car {
  id: string;
  title: string; titleAr: string;
  brand: string; brandAr: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  transmission: 'automatic' | 'manual';
  fuel: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  color: string; colorAr: string;
  bodyType: 'sedan' | 'suv' | 'hatchback' | 'pickup' | 'coupe' | 'convertible';
  condition: 'new' | 'used' | 'certified';
  images: string[];
  featured: boolean;
  posted: string; postedAr: string;
  views: number;
  isNew: boolean;
}

interface Message {
  id: string;
  fromId: string;
  fromName: string; fromNameAr: string;
  fromAvatar: string;
  preview: string; previewAr: string;
  time: string; timeAr: string;
  unread: boolean;
  listingTitle: string; listingTitleAr: string;
}

@Component({
  selector: 'app-ennwy-preview',
  standalone: true,
  imports: [PreviewShellComponent, DecimalPipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🏘"
      title="Ennwy"
      [subtitle]="lang() === 'ar' ? 'سوق العقارات والسيارات · بيع · شراء' : 'Real Estate & Cars Marketplace'"
      [nav]="nav()"
      [active]="active()"
      (activeChange)="onNav($any($event))"
      [toolbarActions]="toolbar()"
      [notifications]="notifs()"
      [searchPlaceholder]="searchPlaceholder()"
      (searchChange)="onSearch($event)"
    >
      <div class="en-bar">
        <div class="lang-switch">
          <button class="ls-btn" [class.active]="lang() === 'en'" (click)="lang.set('en')">EN</button>
          <button class="ls-btn" [class.active]="lang() === 'ar'" (click)="lang.set('ar')">AR</button>
        </div>
        <div class="cat-switch">
          <button class="cs-btn" [class.active]="activeCategory() === 'all'" (click)="activeCategory.set('all')">
            <span>◈</span><span>{{ t('All', 'الكل') }}</span>
          </button>
          <button class="cs-btn" [class.active]="activeCategory() === 'apartments'" (click)="activeCategory.set('apartments')">
            <span>🏘</span><span>{{ t('Apartments', 'عقارات') }}</span>
          </button>
          <button class="cs-btn" [class.active]="activeCategory() === 'cars'" (click)="activeCategory.set('cars')">
            <span>🚗</span><span>{{ t('Cars', 'سيارات') }}</span>
          </button>
        </div>
        <div class="quick-stats">
          <span><b>{{ apartments().length }}</b> {{ t('apartments', 'شقة') }}</span>
          <span class="qs-sep">·</span>
          <span><b>{{ cars().length }}</b> {{ t('cars', 'سيارة') }}</span>
        </div>
        <button class="cta-pill" (click)="active.set('sell')">{{ t('Sell now', 'بِع الآن') }} →</button>
      </div>

      @switch (active()) {

        @case ('home') {
          <div class="view">
            <section class="hero">
              <div class="hero-inner">
                <span class="hero-eyebrow">◈ {{ t('Ennwy Marketplace', 'سوق Ennwy') }}</span>
                <h1 class="hero-title">
                  {{ t('Find your next', 'اكتشف') }}<br>
                  <em>{{ t('home or car', 'منزلك أو سيارتك') }}</em><br>
                  {{ t('in seconds.', 'في ثوانٍ.') }}
                </h1>
                <p class="hero-lede">
                  {{ t('The easiest way to buy, sell, and discover apartments, villas, and cars across Egypt. Verified listings, trusted sellers.', 'أسهل طريقة لبيع وشراء واكتشاف الشقق والفلل والسيارات في مصر. إعلانات موثقة وبائعون موثوقون.') }}
                </p>
                <div class="hero-search">
                  <div class="hs-tabs">
                    <button class="hs-tab" [class.active]="searchType() === 'apartments'" (click)="searchType.set('apartments')">
                      🏘 {{ t('Apartments', 'شقق') }}
                    </button>
                    <button class="hs-tab" [class.active]="searchType() === 'cars'" (click)="searchType.set('cars')">
                      🚗 {{ t('Cars', 'سيارات') }}
                    </button>
                  </div>
                  <div class="hs-input-row">
                    <div class="hs-field">
                      <span class="hsf-icon">📍</span>
                      <select [ngModel]="searchCity()" (ngModelChange)="searchCity.set($event)">
                        <option value="all">{{ t('All cities', 'كل المدن') }}</option>
                        @for (c of cities; track c.id) {
                          <option [value]="c.id">{{ t(c.name, c.nameAr) }}</option>
                        }
                      </select>
                    </div>
                    <div class="hs-field">
                      <span class="hsf-icon">💰</span>
                      <select [ngModel]="searchBudget()" (ngModelChange)="searchBudget.set($event)">
                        <option value="all">{{ t('Any budget', 'أي ميزانية') }}</option>
                        <option value="low">{{ t('Under 1M EGP', 'أقل من مليون') }}</option>
                        <option value="mid">1M - 5M EGP</option>
                        <option value="high">5M - 15M EGP</option>
                        <option value="premium">15M+ EGP</option>
                      </select>
                    </div>
                    <button class="hs-search-btn" (click)="runSearch()">
                      🔍 {{ t('Search', 'بحث') }}
                    </button>
                  </div>
                </div>
                <div class="hero-stats">
                  <div class="hs-stat"><b>{{ apartments().length }}</b><small>{{ t('Apartments', 'عقار') }}</small></div>
                  <div class="hs-stat"><b>{{ cars().length }}</b><small>{{ t('Cars', 'سيارة') }}</small></div>
                  <div class="hs-stat"><b>4.9★</b><small>{{ t('Avg rating', 'التقييم') }}</small></div>
                  <div class="hs-stat"><b>24h</b><small>{{ t('Avg response', 'زمن الرد') }}</small></div>
                </div>
              </div>
            </section>

            <section class="block">
              <header class="block-head">
                <div>
                  <span class="eyebrow">🏘 {{ t('Real Estate', 'العقارات') }}</span>
                  <h2>{{ t('Featured apartments & villas', 'شقق وفيلات مميزة') }}</h2>
                </div>
                <button class="block-link" (click)="active.set('apartments')">{{ t('View all', 'عرض الكل') }} →</button>
              </header>
              <div class="listings-grid">
                @for (a of featuredApartments(); track a.id) {
                  <article class="listing-card" (click)="openApartment(a.id)">
                    <div class="lc-thumb apartment-thumb">
                      <span class="lc-thumb-emoji">{{ a.images[0] }}</span>
                      <div class="lc-badges">
                        @if (a.isNew) { <span class="lc-badge new">{{ t('NEW', 'جديد') }}</span> }
                        @if (a.featured) { <span class="lc-badge featured">⭐</span> }
                      </div>
                      <button class="lc-fav" (click)="$event.stopPropagation(); toggleFavApartment(a.id)" [class.on]="favApartments().includes(a.id)">
                        {{ favApartments().includes(a.id) ? '❤️' : '🤍' }}
                      </button>
                      <div class="lc-photo-count">📷 {{ a.images.length }}</div>
                    </div>
                    <div class="lc-body">
                      <span class="lc-type">{{ t(a.type, apartmentTypeAr(a.type)) }}</span>
                      <h4>{{ t(a.title, a.titleAr) }}</h4>
                      <p class="lc-loc">📍 {{ t(a.district, a.districtAr) }} · {{ t(a.city, a.cityAr) }}</p>
                      <div class="lc-features">
                        <span>🛏 {{ a.bedrooms }}</span>
                        <span>🚿 {{ a.bathrooms }}</span>
                        <span>📐 {{ a.area }} m²</span>
                      </div>
                      <div class="lc-foot">
                        <div class="lc-price">
                          <b>{{ a.price | number }}</b>
                          <small>EGP</small>
                        </div>
                        <span class="lc-time">🕐 {{ t(a.posted, a.postedAr) }}</span>
                      </div>
                    </div>
                  </article>
                }
              </div>
            </section>

            <section class="block">
              <header class="block-head">
                <div>
                  <span class="eyebrow">🚗 {{ t('Vehicles', 'السيارات') }}</span>
                  <h2>{{ t('Featured cars & SUVs', 'سيارات وSUV مميزة') }}</h2>
                </div>
                <button class="block-link" (click)="active.set('cars')">{{ t('View all', 'عرض الكل') }} →</button>
              </header>
              <div class="listings-grid">
                @for (c of featuredCars(); track c.id) {
                  <article class="listing-card" (click)="openCar(c.id)">
                    <div class="lc-thumb car-thumb">
                      <span class="lc-thumb-emoji">{{ c.images[0] }}</span>
                      <div class="lc-badges">
                        @if (c.isNew) { <span class="lc-badge new">{{ t('NEW', 'جديد') }}</span> }
                        @if (c.condition === 'certified') { <span class="lc-badge certified">✓ {{ t('Certified', 'معتمد') }}</span> }
                        @if (c.featured) { <span class="lc-badge featured">⭐</span> }
                      </div>
                      <button class="lc-fav" (click)="$event.stopPropagation(); toggleFavCar(c.id)" [class.on]="favCars().includes(c.id)">
                        {{ favCars().includes(c.id) ? '❤️' : '🤍' }}
                      </button>
                      <div class="lc-photo-count">📷 {{ c.images.length }}</div>
                    </div>
                    <div class="lc-body">
                      <span class="lc-type">{{ t(c.bodyType, carBodyAr(c.bodyType)) }} · {{ c.year }}</span>
                      <h4>{{ t(c.title, c.titleAr) }}</h4>
                      <p class="lc-loc">🚗 {{ t(c.brand, c.brandAr) }} · {{ c.model }}</p>
                      <div class="lc-features">
                        <span>⚙️ {{ t(c.transmission, transmissionAr(c.transmission)) }}</span>
                        <span>⛽ {{ t(c.fuel, fuelAr(c.fuel)) }}</span>
                        <span>📏 {{ c.mileage | number }} km</span>
                      </div>
                      <div class="lc-foot">
                        <div class="lc-price">
                          <b>{{ c.price | number }}</b>
                          <small>EGP</small>
                        </div>
                        <span class="lc-time">🕐 {{ t(c.posted, c.postedAr) }}</span>
                      </div>
                    </div>
                  </article>
                }
              </div>
            </section>

            <section class="block cta-block">
              <div class="cta-inner">
                <div>
                  <span class="eyebrow on-cta">{{ t('Ready to sell?', 'جاهز للبيع؟') }}</span>
                  <h2 class="cta-title">{{ t('List your property or car in', 'أضف عقارك أو سيارتك في') }} <em>{{ t('under 3 minutes', 'أقل من 3 دقائق') }}</em></h2>
                  <p class="cta-lede">{{ t('Free listing, verified buyers, and instant chat with interested leads.', 'إعلان مجاني، مشترون موثقون، ومحادثة فورية مع المهتمين.') }}</p>
                  <div class="cta-perks">
                    <span>✓ {{ t('Free listing', 'إعلان مجاني') }}</span>
                    <span>✓ {{ t('Photo upload', 'رفع الصور') }}</span>
                    <span>✓ {{ t('Instant chat', 'محادثة فورية') }}</span>
                  </div>
                </div>
                <div class="cta-actions">
                  <button class="btn-primary" (click)="active.set('sell')">
                    <span>{{ t('Start selling', 'ابدأ البيع') }}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        }

        @case ('apartments') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">🏘 {{ t('Real Estate', 'العقارات') }}</span>
                <h3>{{ t('Apartments & Villas', 'شقق وفيلات') }}</h3>
                <p>{{ filteredApartments().length }} {{ t('of', 'من') }} {{ apartments().length }} {{ t('listings', 'إعلان') }}</p>
              </div>
              <div class="view-actions">
                <select class="sel" [ngModel]="apartmentSort()" (ngModelChange)="apartmentSort.set($event)">
                  <option value="recent">{{ t('Most recent', 'الأحدث') }}</option>
                  <option value="price-asc">{{ t('Price: low to high', 'السعر: تصاعدي') }}</option>
                  <option value="price-desc">{{ t('Price: high to low', 'السعر: تنازلي') }}</option>
                  <option value="area">{{ t('Largest area', 'الأكبر مساحة') }}</option>
                </select>
              </div>
            </header>

            <div class="listings-layout">
              <aside class="filters-panel">
                <header class="fp-head">
                  <b>{{ t('Filters', 'الفلاتر') }}</b>
                  <button class="fp-reset" (click)="resetApartmentFilters()">{{ t('Reset', 'إعادة تعيين') }}</button>
                </header>

                <div class="fp-group">
                  <label>{{ t('Property type', 'نوع العقار') }}</label>
                  @for (tp of apartmentTypes; track tp.id) {
                    <label class="fp-check">
                      <input type="checkbox" [checked]="filterApartmentTypes().includes(tp.id)" (change)="toggleApartmentType(tp.id)" />
                      <span>{{ t(tp.label, tp.labelAr) }}</span>
                    </label>
                  }
                </div>

                <div class="fp-group">
                  <label>{{ t('City', 'المدينة') }}</label>
                  <select class="sel" [ngModel]="filterApartmentCity()" (ngModelChange)="filterApartmentCity.set($event)">
                    <option value="all">{{ t('All cities', 'كل المدن') }}</option>
                    @for (c of cities; track c.id) {
                      <option [value]="c.id">{{ t(c.name, c.nameAr) }}</option>
                    }
                  </select>
                </div>

                <div class="fp-group">
                  <label>{{ t('Price range (EGP)', 'نطاق السعر (جنيه)') }}</label>
                  <div class="range-row">
                    <input type="number" class="input-sm" placeholder="Min" [value]="aptPriceMin()" (input)="aptPriceMin.set(+$any($event.target).value)" />
                    <span>—</span>
                    <input type="number" class="input-sm" placeholder="Max" [value]="aptPriceMax()" (input)="aptPriceMax.set(+$any($event.target).value)" />
                  </div>
                </div>

                <div class="fp-group">
                  <label>{{ t('Bedrooms', 'عدد الغرف') }}</label>
                  <div class="beds-row">
                    @for (n of [1,2,3,4,5]; track n) {
                      <button class="bed-btn" [class.active]="filterBedrooms().includes(n)" (click)="toggleBedrooms(n)">
                        {{ n }}+
                      </button>
                    }
                  </div>
                </div>

                <div class="fp-group">
                  <label class="check-row">
                    <input type="checkbox" [checked]="filterFurnished()" (change)="filterFurnished.set(!filterFurnished())" />
                    <span>{{ t('Furnished only', 'مفروش فقط') }}</span>
                  </label>
                </div>
              </aside>

              <main class="listings-main">
                <div class="listings-grid">
                  @for (a of filteredApartments(); track a.id) {
                    <article class="listing-card" (click)="openApartment(a.id)" (contextmenu)="onApartmentContext($event, a)">
                      <div class="lc-thumb apartment-thumb">
                        <span class="lc-thumb-emoji">{{ a.images[0] }}</span>
                        <div class="lc-badges">
                          @if (a.isNew) { <span class="lc-badge new">{{ t('NEW', 'جديد') }}</span> }
                          @if (a.featured) { <span class="lc-badge featured">⭐</span> }
                          <span class="lc-badge finishing" [attr.data-f]="a.finishing">{{ t(a.finishing, finishingAr(a.finishing)) }}</span>
                        </div>
                        <button class="lc-fav" (click)="$event.stopPropagation(); toggleFavApartment(a.id)" [class.on]="favApartments().includes(a.id)">
                          {{ favApartments().includes(a.id) ? '❤️' : '🤍' }}
                        </button>
                        <div class="lc-photo-count">📷 {{ a.images.length }}</div>
                      </div>
                      <div class="lc-body">
                        <span class="lc-type">{{ t(a.type, apartmentTypeAr(a.type)) }}</span>
                        <h4>{{ t(a.title, a.titleAr) }}</h4>
                        <p class="lc-loc">📍 {{ t(a.district, a.districtAr) }} · {{ t(a.city, a.cityAr) }}</p>
                        @if (a.compoundName) {
                          <p class="lc-compound">🏘 {{ a.compoundName }}</p>
                        }
                        <div class="lc-features">
                          <span>🛏 {{ a.bedrooms }}</span>
                          <span>🚿 {{ a.bathrooms }}</span>
                          <span>📐 {{ a.area }} m²</span>
                          <span>🏢 {{ a.floor }}/{{ a.totalFloors }}</span>
                        </div>
                        <div class="lc-foot">
                          <div class="lc-price">
                            <b>{{ a.price | number }}</b>
                            <small>EGP</small>
                          </div>
                          <span class="lc-time">🕐 {{ t(a.posted, a.postedAr) }}</span>
                        </div>
                      </div>
                    </article>
                  } @empty {
                    <div class="empty-state">
                      <span>🏘</span>
                      <b>{{ t('No apartments match your filters', 'لا توجد شقق مطابقة') }}</b>
                      <small>{{ t('Try adjusting the filters', 'حاول تعديل الفلاتر') }}</small>
                    </div>
                  }
                </div>
              </main>
            </div>
          </div>
        }

        @case ('cars') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">🚗 {{ t('Vehicles', 'السيارات') }}</span>
                <h3>{{ t('Cars & SUVs', 'سيارات وSUV') }}</h3>
                <p>{{ filteredCars().length }} {{ t('of', 'من') }} {{ cars().length }} {{ t('listings', 'إعلان') }}</p>
              </div>
              <div class="view-actions">
                <select class="sel" [ngModel]="carSort()" (ngModelChange)="carSort.set($event)">
                  <option value="recent">{{ t('Most recent', 'الأحدث') }}</option>
                  <option value="price-asc">{{ t('Price: low to high', 'السعر: تصاعدي') }}</option>
                  <option value="price-desc">{{ t('Price: high to low', 'السعر: تنازلي') }}</option>
                  <option value="year">{{ t('Newest year', 'الأحدث سنة') }}</option>
                  <option value="mileage">{{ t('Lowest mileage', 'الأقل كيلومترات') }}</option>
                </select>
              </div>
            </header>

            <div class="listings-layout">
              <aside class="filters-panel">
                <header class="fp-head">
                  <b>{{ t('Filters', 'الفلاتر') }}</b>
                  <button class="fp-reset" (click)="resetCarFilters()">{{ t('Reset', 'إعادة تعيين') }}</button>
                </header>

                <div class="fp-group">
                  <label>{{ t('Brand', 'الماركة') }}</label>
                  @for (b of carBrands; track b.id) {
                    <label class="fp-check">
                      <input type="checkbox" [checked]="filterCarBrands().includes(b.id)" (change)="toggleCarBrand(b.id)" />
                      <span>{{ t(b.label, b.labelAr) }}</span>
                    </label>
                  }
                </div>

                <div class="fp-group">
                  <label>{{ t('Condition', 'الحالة') }}</label>
                  @for (c of carConditions; track c.id) {
                    <label class="fp-check">
                      <input type="checkbox" [checked]="filterCarConditions().includes(c.id)" (change)="toggleCarCondition(c.id)" />
                      <span>{{ t(c.label, c.labelAr) }}</span>
                    </label>
                  }
                </div>

                <div class="fp-group">
                  <label>{{ t('Body type', 'نوع الهيكل') }}</label>
                  <select class="sel" [ngModel]="filterCarBody()" (ngModelChange)="filterCarBody.set($event)">
                    <option value="all">{{ t('All types', 'كل الأنواع') }}</option>
                    @for (b of carBodyTypes; track b.id) {
                      <option [value]="b.id">{{ t(b.label, b.labelAr) }}</option>
                    }
                  </select>
                </div>

                <div class="fp-group">
                  <label>{{ t('Price range (EGP)', 'نطاق السعر (جنيه)') }}</label>
                  <div class="range-row">
                    <input type="number" class="input-sm" placeholder="Min" [value]="carPriceMin()" (input)="carPriceMin.set(+$any($event.target).value)" />
                    <span>—</span>
                    <input type="number" class="input-sm" placeholder="Max" [value]="carPriceMax()" (input)="carPriceMax.set(+$any($event.target).value)" />
                  </div>
                </div>

                <div class="fp-group">
                  <label>{{ t('Year from', 'سنة الصنع من') }}</label>
                  <select class="sel" [ngModel]="filterCarYear()" (ngModelChange)="filterCarYear.set(+$event)">
                    <option [value]="0">{{ t('Any year', 'أي سنة') }}</option>
                    @for (y of [2015, 2018, 2020, 2022, 2023, 2024]; track y) {
                      <option [value]="y">{{ y }}</option>
                    }
                  </select>
                </div>
              </aside>

              <main class="listings-main">
                <div class="listings-grid">
                  @for (c of filteredCars(); track c.id) {
                    <article class="listing-card" (click)="openCar(c.id)" (contextmenu)="onCarContext($event, c)">
                      <div class="lc-thumb car-thumb">
                        <span class="lc-thumb-emoji">{{ c.images[0] }}</span>
                        <div class="lc-badges">
                          @if (c.isNew) { <span class="lc-badge new">{{ t('NEW', 'جديد') }}</span> }
                          @if (c.condition === 'certified') { <span class="lc-badge certified">✓ {{ t('Certified', 'معتمد') }}</span> }
                          @if (c.featured) { <span class="lc-badge featured">⭐</span> }
                        </div>
                        <button class="lc-fav" (click)="$event.stopPropagation(); toggleFavCar(c.id)" [class.on]="favCars().includes(c.id)">
                          {{ favCars().includes(c.id) ? '❤️' : '🤍' }}
                        </button>
                        <div class="lc-photo-count">📷 {{ c.images.length }}</div>
                      </div>
                      <div class="lc-body">
                        <span class="lc-type">{{ t(c.bodyType, carBodyAr(c.bodyType)) }} · {{ c.year }}</span>
                        <h4>{{ t(c.title, c.titleAr) }}</h4>
                        <p class="lc-loc">🚗 {{ t(c.brand, c.brandAr) }} · {{ c.model }}</p>
                        <div class="lc-features">
                          <span>⚙️ {{ t(c.transmission, transmissionAr(c.transmission)) }}</span>
                          <span>⛽ {{ t(c.fuel, fuelAr(c.fuel)) }}</span>
                          <span>📏 {{ c.mileage | number }} km</span>
                          <span>🎨 {{ t(c.color, c.colorAr) }}</span>
                        </div>
                        <div class="lc-foot">
                          <div class="lc-price">
                            <b>{{ c.price | number }}</b>
                            <small>EGP</small>
                          </div>
                          <span class="lc-time">🕐 {{ t(c.posted, c.postedAr) }}</span>
                        </div>
                      </div>
                    </article>
                  } @empty {
                    <div class="empty-state">
                      <span>🚗</span>
                      <b>{{ t('No cars match your filters', 'لا توجد سيارات مطابقة') }}</b>
                      <small>{{ t('Try adjusting the filters', 'حاول تعديل الفلاتر') }}</small>
                    </div>
                  }
                </div>
              </main>
            </div>
          </div>
        }

        @case ('favorites') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">❤️ {{ t('Saved', 'المحفوظات') }}</span>
                <h3>{{ t('My Favorites', 'مفضلاتي') }}</h3>
                <p>{{ favApartments().length + favCars().length }} {{ t('items saved', 'عنصر محفوظ') }}</p>
              </div>
            </header>

            @if (favApartments().length) {
              <section class="block">
                <header class="block-head">
                  <h2>🏘 {{ t('Apartments', 'شقق') }}</h2>
                </header>
                <div class="listings-grid">
                  @for (a of favApartmentItems(); track a.id) {
                    <article class="listing-card" (click)="openApartment(a.id)">
                      <div class="lc-thumb apartment-thumb">
                        <span class="lc-thumb-emoji">{{ a.images[0] }}</span>
                        <button class="lc-fav on" (click)="$event.stopPropagation(); toggleFavApartment(a.id)">❤️</button>
                      </div>
                      <div class="lc-body">
                        <h4>{{ t(a.title, a.titleAr) }}</h4>
                        <p class="lc-loc">📍 {{ t(a.city, a.cityAr) }}</p>
                        <div class="lc-foot">
                          <div class="lc-price"><b>{{ a.price | number }}</b><small>EGP</small></div>
                        </div>
                      </div>
                    </article>
                  }
                </div>
              </section>
            }

            @if (favCars().length) {
              <section class="block">
                <header class="block-head">
                  <h2>🚗 {{ t('Cars', 'سيارات') }}</h2>
                </header>
                <div class="listings-grid">
                  @for (c of favCarItems(); track c.id) {
                    <article class="listing-card" (click)="openCar(c.id)">
                      <div class="lc-thumb car-thumb">
                        <span class="lc-thumb-emoji">{{ c.images[0] }}</span>
                        <button class="lc-fav on" (click)="$event.stopPropagation(); toggleFavCar(c.id)">❤️</button>
                      </div>
                      <div class="lc-body">
                        <h4>{{ t(c.title, c.titleAr) }}</h4>
                        <p class="lc-loc">🚗 {{ t(c.brand, c.brandAr) }} · {{ c.year }}</p>
                        <div class="lc-foot">
                          <div class="lc-price"><b>{{ c.price | number }}</b><small>EGP</small></div>
                        </div>
                      </div>
                    </article>
                  }
                </div>
              </section>
            }

            @if (!favApartments().length && !favCars().length) {
              <div class="empty-state tall">
                <span>💔</span>
                <b>{{ t('No favorites yet', 'لا توجد مفضلات بعد') }}</b>
                <small>{{ t('Save listings you love to view them here', 'احفظ الإعلانات التي تعجبك لعرضها هنا') }}</small>
              </div>
            }
          </div>
        }

        @case ('messages') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">💬 {{ t('Inbox', 'الوارد') }}</span>
                <h3>{{ t('Messages', 'المحادثات') }}</h3>
                <p>{{ unreadMessages() }} {{ t('unread', 'غير مقروء') }} · {{ messages().length }} {{ t('total', 'إجمالي') }}</p>
              </div>
            </header>

            <div class="messages-layout">
              <aside class="msg-sidebar">
                <div class="msg-search">
                  <span>🔍</span>
                  <input placeholder="{{ t('Search…', 'ابحث…') }}" />
                </div>
                <ul class="msg-list">
                  @for (m of messages(); track m.id) {
                    <li class="msg-item" [class.unread]="m.unread" [class.active]="selectedMessage()?.id === m.id" (click)="selectMessage(m.id)">
                      <span class="msg-avatar">{{ m.fromAvatar }}</span>
                      <div class="msg-body">
                        <div class="msg-row">
                          <b>{{ t(m.fromName, m.fromNameAr) }}</b>
                          <span class="msg-time">{{ t(m.time, m.timeAr) }}</span>
                        </div>
                        <small class="msg-listing">📌 {{ t(m.listingTitle, m.listingTitleAr) }}</small>
                        <p class="msg-preview">{{ t(m.preview, m.previewAr) }}</p>
                      </div>
                      @if (m.unread) {
                        <span class="msg-dot"></span>
                      }
                    </li>
                  }
                </ul>
              </aside>

              <main class="msg-thread">
                @if (selectedMessage(); as m) {
                  <header class="mt-head">
                    <span class="mt-avatar">{{ m.fromAvatar }}</span>
                    <div>
                      <b>{{ t(m.fromName, m.fromNameAr) }}</b>
                      <small>📌 {{ t(m.listingTitle, m.listingTitleAr) }}</small>
                    </div>
                    <button class="pill-sm">{{ t('View listing', 'عرض الإعلان') }}</button>
                  </header>
                  <div class="mt-body">
                    <div class="mt-bubble incoming">{{ t(m.preview, m.previewAr) }}</div>
                    <div class="mt-bubble outgoing">{{ t('Hi! Yes, it is still available.', 'أهلاً! نعم، لا يزال متاحاً.') }}</div>
                    <div class="mt-bubble incoming">{{ t('Great! Can I visit tomorrow?', 'رائع! هل يمكنني الزيارة غداً؟') }}</div>
                  </div>
                  <footer class="mt-composer">
                    <input placeholder="{{ t('Type a message…', 'اكتب رسالة…') }}" />
                    <button class="pill primary" (click)="sendMessage()">{{ t('Send', 'إرسال') }}</button>
                  </footer>
                } @else {
                  <div class="empty-state tall">
                    <span>💬</span>
                    <b>{{ t('Select a conversation', 'اختر محادثة') }}</b>
                  </div>
                }
              </main>
            </div>
          </div>
        }

        @case ('sell') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">＋ {{ t('List now', 'أضف إعلانك') }}</span>
                <h3>{{ t('Sell Your Property or Car', 'بِع عقارك أو سيارتك') }}</h3>
                <p>{{ t('Free listing · Upload up to 10 photos · Instant reach', 'إعلان مجاني · حتى 10 صور · وصول فوري') }}</p>
              </div>
            </header>

            <section class="sell-hero">
              <div class="sell-hero-inner">
                <h2>{{ t('What do you want to sell?', 'ماذا تريد أن تبيع؟') }}</h2>
                <div class="sell-types">
                  <button class="sell-type-card" [class.active]="sellType() === 'apartment'" (click)="sellType.set('apartment')">
                    <span class="stc-icon">🏘</span>
                    <b>{{ t('Apartment / Villa', 'شقة / فيلا') }}</b>
                    <small>{{ t('For sale or rent', 'للبيع أو الإيجار') }}</small>
                  </button>
                  <button class="sell-type-card" [class.active]="sellType() === 'car'" (click)="sellType.set('car')">
                    <span class="stc-icon">🚗</span>
                    <b>{{ t('Car / SUV', 'سيارة / SUV') }}</b>
                    <small>{{ t('New or used', 'جديد أو مستعمل') }}</small>
                  </button>
                </div>
              </div>
            </section>

            <section class="card sell-form">
              <header class="card-head">
                <h3>{{ t('Listing details', 'تفاصيل الإعلان') }}</h3>
              </header>

              <div class="form-grid">
                <label class="field span-2">
                  <span>{{ t('Title', 'العنوان') }}</span>
                  <input placeholder="{{ t('e.g. 3-bedroom apartment in New Cairo', 'مثال: شقة 3 غرف في القاهرة الجديدة') }}" />
                </label>

                <label class="field">
                  <span>{{ t('City', 'المدينة') }}</span>
                  <select>
                    @for (c of cities; track c.id) {
                      <option>{{ t(c.name, c.nameAr) }}</option>
                    }
                  </select>
                </label>

                <label class="field">
                  <span>{{ t('District', 'الحي') }}</span>
                  <input placeholder="{{ t('e.g. Nasr City', 'مثال: مدينة نصر') }}" />
                </label>

                <label class="field">
                  <span>{{ t('Price (EGP)', 'السعر (جنيه)') }}</span>
                  <input type="number" placeholder="0" />
                </label>

                @if (sellType() === 'apartment') {
                  <label class="field">
                    <span>{{ t('Area (m²)', 'المساحة (م²)') }}</span>
                    <input type="number" placeholder="0" />
                  </label>
                  <label class="field">
                    <span>{{ t('Bedrooms', 'عدد الغرف') }}</span>
                    <input type="number" placeholder="0" />
                  </label>
                  <label class="field">
                    <span>{{ t('Bathrooms', 'عدد الحمامات') }}</span>
                    <input type="number" placeholder="0" />
                  </label>
                } @else {
                  <label class="field">
                    <span>{{ t('Brand', 'الماركة') }}</span>
                    <input placeholder="{{ t('e.g. Toyota', 'مثال: تويوتا') }}" />
                  </label>
                  <label class="field">
                    <span>{{ t('Year', 'سنة الصنع') }}</span>
                    <input type="number" placeholder="2024" />
                  </label>
                  <label class="field">
                    <span>{{ t('Mileage (km)', 'الكيلومترات') }}</span>
                    <input type="number" placeholder="0" />
                  </label>
                }

                <label class="field span-2">
                  <span>{{ t('Description', 'الوصف') }}</span>
                  <textarea placeholder="{{ t('Describe your listing…', 'اوصف إعلانك…') }}"></textarea>
                </label>
              </div>

              <div class="upload-zone">
                <span class="uz-icon">📸</span>
                <b>{{ t('Upload photos (up to 10)', 'ارفع صور (حتى 10)') }}</b>
                <small>{{ t('Drag & drop or click to browse', 'اسحب أو انقر للتصفح') }}</small>
              </div>

              <footer class="sell-actions">
                <button class="pill">{{ t('Save as draft', 'حفظ كمسودة') }}</button>
                <button class="pill primary" (click)="publishListing()">🚀 {{ t('Publish listing', 'نشر الإعلان') }}</button>
              </footer>
            </section>
          </div>
        }

        @case ('profile') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">👤 {{ t('Account', 'الحساب') }}</span>
                <h3>{{ t('My Profile', 'ملفي الشخصي') }}</h3>
              </div>
            </header>

            <section class="profile-hero">
              <div class="ph-avatar">👨‍💻</div>
              <div class="ph-info">
                <h2>Ibrahim Shafiq</h2>
                <p>📧 ibrahim.shafiq440&#64;gmail.com</p>
                <p>📞 +20 112 846 7654</p>
                <p>📍 {{ t('Cairo, Egypt', 'القاهرة، مصر') }}</p>
              </div>
              <div class="ph-stats">
                <div><b>{{ favApartments().length + favCars().length }}</b><small>{{ t('Saved', 'محفوظ') }}</small></div>
                <div><b>3</b><small>{{ t('Listings', 'إعلانات') }}</small></div>
                <div><b>12</b><small>{{ t('Chats', 'محادثات') }}</small></div>
              </div>
            </section>

            <section class="card team-section">
              <header class="card-head">
                <h3>👥 {{ t('Project Team', 'فريق المشروع') }}</h3>
                <small>{{ t('Who built Ennwy', 'من بنى Ennwy') }}</small>
              </header>
              <div class="team-grid">
                <div class="team-card">
                  <span class="tc-avatar">👨‍💻</span>
                  <div>
                    <b>Ibrahim Shafiq</b>
                    <p>Full-Stack — Angular &amp; .NET</p>
                    <small>{{ t('Frontend, backend, deployment', 'الواجهة والخلفية والنشر') }}</small>
                  </div>
                </div>
                <div class="team-card">
                  <span class="tc-avatar">👨‍💻</span>
                  <div>
                    <b>Mo'men</b>
                    <p>Full-Stack — Angular &amp; .NET</p>
                    <small>{{ t('Backend APIs, database, integration', 'واجهات الخلفية وقاعدة البيانات والتكامل') }}</small>
                  </div>
                </div>
              </div>
            </section>

            <section class="card">
              <header class="card-head">
                <h3>{{ t('My listings', 'إعلاناتي') }}</h3>
                <button class="pill-sm primary" (click)="active.set('sell')">＋ {{ t('New', 'جديد') }}</button>
              </header>
              <div class="my-listings">
                <div class="ml-row">
                  <span class="ml-icon">🏘</span>
                  <div>
                    <b>{{ t('3-bedroom apartment in Nasr City', 'شقة 3 غرف في مدينة نصر') }}</b>
                    <small>{{ t('Listed 3 days ago · 47 views', 'منذ 3 أيام · 47 مشاهدة') }}</small>
                  </div>
                  <span class="ml-status active">{{ t('Active', 'نشط') }}</span>
                </div>
                <div class="ml-row">
                  <span class="ml-icon">🚗</span>
                  <div>
                    <b>{{ t('2020 Toyota Corolla', 'تويوتا كورولا 2020') }}</b>
                    <small>{{ t('Listed 1 week ago · 112 views', 'منذ أسبوع · 112 مشاهدة') }}</small>
                  </div>
                  <span class="ml-status active">{{ t('Active', 'نشط') }}</span>
                </div>
                <div class="ml-row">
                  <span class="ml-icon">🏘</span>
                  <div>
                    <b>{{ t('Villa in Sheikh Zayed', 'فيلا في الشيخ زايد') }}</b>
                    <small>{{ t('Sold 2 weeks ago', 'تم البيع منذ أسبوعين') }}</small>
                  </div>
                  <span class="ml-status sold">{{ t('Sold', 'تم البيع') }}</span>
                </div>
              </div>
            </section>
          </div>
        }
      }

      @if (selectedApartment(); as a) {
        <div class="modal-backdrop" (click)="selectedApartment.set(null)">
          <div class="modal listing-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon apartment">{{ a.images[0] }}</span>
              <div>
                <h3>{{ t(a.title, a.titleAr) }}</h3>
                <p>📍 {{ t(a.district, a.districtAr) }} · {{ t(a.city, a.cityAr) }}</p>
              </div>
              <button class="modal-close" (click)="selectedApartment.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="lm-gallery">
                @for (img of a.images; track $index) {
                  <div class="lm-photo">{{ img }}</div>
                }
              </div>

              <div class="lm-price">
                <b>{{ a.price | number }} EGP</b>
                <span class="lm-price-tag">💰 {{ t('Asking price', 'السعر المطلوب') }}</span>
              </div>

              <div class="lm-specs">
                <div class="lms-item"><small>{{ t('Type', 'النوع') }}</small><b>{{ t(a.type, apartmentTypeAr(a.type)) }}</b></div>
                <div class="lms-item"><small>{{ t('Area', 'المساحة') }}</small><b>{{ a.area }} m²</b></div>
                <div class="lms-item"><small>{{ t('Bedrooms', 'غرف') }}</small><b>{{ a.bedrooms }}</b></div>
                <div class="lms-item"><small>{{ t('Bathrooms', 'حمامات') }}</small><b>{{ a.bathrooms }}</b></div>
                <div class="lms-item"><small>{{ t('Floor', 'الطابق') }}</small><b>{{ a.floor }} / {{ a.totalFloors }}</b></div>
                <div class="lms-item"><small>{{ t('Furnished', 'الفرش') }}</small><b>{{ a.furnished ? '✓' : '✕' }}</b></div>
                <div class="lms-item"><small>{{ t('Finishing', 'التشطيب') }}</small><b>{{ t(a.finishing, finishingAr(a.finishing)) }}</b></div>
                @if (a.compoundName) {
                  <div class="lms-item"><small>{{ t('Compound', 'الكمبوند') }}</small><b>{{ a.compoundName }}</b></div>
                }
              </div>

              @if (a.amenities.length) {
                <div class="lm-section">
                  <span class="om-label">{{ t('Amenities', 'المرافق') }}</span>
                  <div class="lm-amenities">
                    @for (am of a.amenities; track am) {
                      <span class="lm-amenity">{{ am }}</span>
                    }
                  </div>
                </div>
              }
            </div>
            <footer class="modal-foot">
              <button class="mf-btn" (click)="toggleFavApartment(a.id)">
                {{ favApartments().includes(a.id) ? '❤️ ' + t('Saved', 'محفوظ') : '🤍 ' + t('Save', 'حفظ') }}
              </button>
              <button class="mf-btn" (click)="toast.info(t('Phone revealed', 'تم كشف الهاتف'))">📞 {{ t('Call', 'اتصال') }}</button>
              <button class="mf-btn primary" (click)="contactSeller(a.id); selectedApartment.set(null)">💬 {{ t('Chat with seller', 'محادثة البائع') }}</button>
            </footer>
          </div>
        </div>
      }

      @if (selectedCar(); as c) {
        <div class="modal-backdrop" (click)="selectedCar.set(null)">
          <div class="modal listing-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon car">{{ c.images[0] }}</span>
              <div>
                <h3>{{ t(c.title, c.titleAr) }}</h3>
                <p>🚗 {{ t(c.brand, c.brandAr) }} · {{ c.model }} · {{ c.year }}</p>
              </div>
              <button class="modal-close" (click)="selectedCar.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="lm-gallery">
                @for (img of c.images; track $index) {
                  <div class="lm-photo">{{ img }}</div>
                }
              </div>

              <div class="lm-price">
                <b>{{ c.price | number }} EGP</b>
                <span class="lm-price-tag">💰 {{ t('Asking price', 'السعر المطلوب') }}</span>
              </div>

              <div class="lm-specs">
                <div class="lms-item"><small>{{ t('Brand', 'الماركة') }}</small><b>{{ t(c.brand, c.brandAr) }}</b></div>
                <div class="lms-item"><small>{{ t('Model', 'الموديل') }}</small><b>{{ c.model }}</b></div>
                <div class="lms-item"><small>{{ t('Year', 'السنة') }}</small><b>{{ c.year }}</b></div>
                <div class="lms-item"><small>{{ t('Mileage', 'الكيلومترات') }}</small><b>{{ c.mileage | number }} km</b></div>
                <div class="lms-item"><small>{{ t('Transmission', 'ناقل الحركة') }}</small><b>{{ t(c.transmission, transmissionAr(c.transmission)) }}</b></div>
                <div class="lms-item"><small>{{ t('Fuel', 'الوقود') }}</small><b>{{ t(c.fuel, fuelAr(c.fuel)) }}</b></div>
                <div class="lms-item"><small>{{ t('Body', 'الهيكل') }}</small><b>{{ t(c.bodyType, carBodyAr(c.bodyType)) }}</b></div>
                <div class="lms-item"><small>{{ t('Color', 'اللون') }}</small><b>{{ t(c.color, c.colorAr) }}</b></div>
                <div class="lms-item"><small>{{ t('Condition', 'الحالة') }}</small><b>{{ t(c.condition, conditionAr(c.condition)) }}</b></div>
              </div>
            </div>
            <footer class="modal-foot">
              <button class="mf-btn" (click)="toggleFavCar(c.id)">
                {{ favCars().includes(c.id) ? '❤️ ' + t('Saved', 'محفوظ') : '🤍 ' + t('Save', 'حفظ') }}
              </button>
              <button class="mf-btn" (click)="toast.info(t('Phone revealed', 'تم كشف الهاتف'))">📞 {{ t('Call', 'اتصال') }}</button>
              <button class="mf-btn primary" (click)="contactSeller(c.id); selectedCar.set(null)">💬 {{ t('Chat with seller', 'محادثة البائع') }}</button>
            </footer>
          </div>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .view { max-width: 1440px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .small { font-size: 10px; }

    .en-bar {
      display: flex; align-items: center; gap: 14px; padding: 12px 16px;
      background: linear-gradient(135deg, rgba(52, 199, 89, 0.06) 0%, rgba(0, 122, 255, 0.04) 100%);
      border: 0.5px solid var(--separator); border-radius: var(--r-md); flex-wrap: wrap;
    }
    .lang-switch { display: flex; gap: 2px; padding: 3px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .ls-btn { padding: 5px 12px; border-radius: calc(var(--r-sm) - 4px); font-size: 11px; font-weight: 700; color: var(--label-2); background: transparent; border: 0; cursor: pointer; }
    .ls-btn.active { background: var(--bg-surface-solid); color: var(--label); box-shadow: var(--shadow-xs); }

    .cat-switch { display: flex; gap: 4px; padding: 3px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .cs-btn { padding: 6px 12px; border-radius: calc(var(--r-sm) - 4px); font-size: 11px; font-weight: 700; color: var(--label-2); background: transparent; border: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .cs-btn.active { background: var(--accent); color: var(--accent-contrast); }

    .quick-stats { display: flex; gap: 8px; font-size: 11px; color: var(--label-2); margin-left: auto; }
    .quick-stats b { color: #34c759; font-weight: 800; font-family: var(--sf-mono); }
    .qs-sep { color: var(--label-4); }
    .cta-pill {
      padding: 8px 18px;
      background: linear-gradient(135deg, #34c759, #007aff); color: #fff;
      border: 0; border-radius: var(--r-pill); font-size: 11px; font-weight: 800;
      cursor: pointer; transition: transform 140ms;
    }
    .cta-pill:hover { transform: translateY(-1px); }

    .view-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
    .view-head h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .view-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }
    .eyebrow { display: block; font-size: var(--fs-2xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #34c759; margin-bottom: 6px; }
    .view-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

    .pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: var(--bg-fill-2); color: var(--label); border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 700; border: 0; cursor: pointer; transition: all 140ms; }
    .pill:hover { background: var(--bg-fill-3); }
    .pill.primary { background: linear-gradient(135deg, #34c759, #007aff); color: #fff; }
    .pill.primary:hover { opacity: 0.9; }
    .pill-sm { padding: 6px 12px; background: var(--bg-fill-2); color: var(--label); border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 700; border: 0; cursor: pointer; }
    .pill-sm.primary { background: var(--accent); color: var(--accent-contrast); }
    .sel { padding: 8px 12px; background: var(--bg-input); color: var(--label); border: 0.5px solid var(--separator); border-radius: var(--r-sm); font-size: var(--fs-xs); cursor: pointer; outline: none; font-family: inherit; }
    .input-sm { padding: 6px 10px; background: var(--bg-input); color: var(--label); border: 0.5px solid var(--separator); border-radius: var(--r-xs); font-size: var(--fs-xs); outline: none; font-family: inherit; min-width: 90px; }

    .hero {
      padding: 40px 0;
      display: flex; flex-direction: column; gap: 24px;
    }
    .hero-inner { display: flex; flex-direction: column; gap: 18px; }
    .hero-eyebrow {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: var(--fs-2xs); font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
      color: #34c759; width: fit-content;
      padding: 6px 14px; background: rgba(52, 199, 89, 0.1); border-radius: var(--r-pill);
    }
    .hero-title {
      font-size: clamp(36px, 6.5vw, 76px); font-weight: 900;
      line-height: 1; letter-spacing: -0.045em;
      color: var(--label);
    }
    .hero-title em {
      font-style: italic; font-weight: 300;
      background: linear-gradient(135deg, #34c759, #007aff, #5856d6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .hero-lede { font-size: var(--fs-md); line-height: 1.6; color: var(--label-2); max-width: 620px; }

    .hero-search {
      background: var(--bg-surface-solid);
      border: 1.5px solid var(--separator);
      border-radius: var(--r-lg);
      padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
      box-shadow: var(--shadow-lg);
      max-width: 900px;
    }
    .hs-tabs { display: flex; gap: 4px; padding: 3px; background: var(--bg-fill-2); border-radius: var(--r-sm); width: fit-content; }
    .hs-tab { padding: 8px 16px; border-radius: calc(var(--r-sm) - 4px); font-size: var(--fs-xs); font-weight: 700; color: var(--label-2); background: transparent; border: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .hs-tab.active { background: var(--bg-surface-solid); color: var(--label); box-shadow: var(--shadow-xs); }
    .hs-input-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; }
    @media (max-width: 700px) { .hs-input-row { grid-template-columns: 1fr; } }
    .hs-field { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-input); border-radius: var(--r-sm); }
    .hs-field select { flex: 1; background: transparent; border: 0; outline: none; font-size: var(--fs-sm); color: var(--label); cursor: pointer; }
    .hsf-icon { font-size: 16px; }
    .hs-search-btn {
      padding: 12px 28px;
      background: linear-gradient(135deg, #34c759, #007aff); color: #fff;
      border: 0; border-radius: var(--r-sm); font-size: var(--fs-sm); font-weight: 800;
      cursor: pointer;
    }

    .hero-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; max-width: 900px; padding-top: 12px; border-top: 0.5px solid var(--separator); }
    @media (max-width: 700px) { .hero-stats { grid-template-columns: repeat(2, 1fr); } }
    .hs-stat b { display: block; font-size: var(--fs-2xl); font-weight: 800; color: #34c759; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
    .hs-stat small { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    .block { display: flex; flex-direction: column; gap: 18px; }
    .block-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
    .block-head h2 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .block-link { background: transparent; border: 0; color: #34c759; font-size: var(--fs-xs); font-weight: 700; cursor: pointer; }

    .listings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }

    .listing-card {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      overflow: hidden;
      cursor: pointer;
      transition: all 200ms;
      display: flex; flex-direction: column;
    }
    .listing-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }

    .lc-thumb { height: 180px; display: grid; place-items: center; position: relative; }
    .apartment-thumb { background: linear-gradient(135deg, #667eea, #764ba2); }
    .car-thumb { background: linear-gradient(135deg, #3a7bd5, #00d2ff); }
    .lc-thumb-emoji { font-size: 68px; filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.25)); }
    .lc-badges { position: absolute; top: 10px; left: 10px; display: flex; gap: 4px; flex-wrap: wrap; }
    .lc-badge { padding: 3px 9px; border-radius: var(--r-pill); font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
    .lc-badge.new { background: #34c759; color: #fff; }
    .lc-badge.featured { background: #ffcc00; color: #1a1a1a; }
    .lc-badge.certified { background: #007aff; color: #fff; }
    .lc-badge.finishing { background: rgba(255, 255, 255, 0.9); color: var(--label); }
    .lc-badge.finishing[data-f='super-lux'] { background: #ffcc00; color: #1a1a1a; }
    .lc-badge.finishing[data-f='lux'] { background: #ff9500; color: #fff; }
    .lc-fav {
      position: absolute; top: 10px; right: 10px;
      width: 34px; height: 34px;
      display: grid; place-items: center;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      border: 0; border-radius: 50%;
      font-size: 16px; cursor: pointer;
      transition: transform 200ms;
    }
    .lc-fav:hover { transform: scale(1.1); }
    .lc-fav.on { animation: heartBeat 400ms; }
    @keyframes heartBeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); } }
    .lc-photo-count { position: absolute; bottom: 10px; right: 10px; padding: 3px 10px; background: rgba(0, 0, 0, 0.65); color: #fff; border-radius: var(--r-pill); font-size: 10px; font-weight: 700; }

    .lc-body { padding: 16px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .lc-type { font-size: 10px; font-weight: 800; color: #34c759; text-transform: uppercase; letter-spacing: 0.06em; }
    .lc-body h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; line-height: 1.3; }
    .lc-loc { font-size: var(--fs-2xs); color: var(--label-2); }
    .lc-compound { font-size: var(--fs-2xs); color: #007aff; font-weight: 700; }
    .lc-features { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; padding: 8px 0; border-top: 0.5px solid var(--separator); border-bottom: 0.5px solid var(--separator); }
    .lc-features span { font-size: 10px; color: var(--label-2); font-weight: 600; font-family: var(--sf-mono); }
    .lc-foot { display: flex; justify-content: space-between; align-items: baseline; margin-top: auto; padding-top: 8px; }
    .lc-price b { font-size: var(--fs-lg); font-weight: 900; color: #34c759; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
    .lc-price small { font-size: 10px; color: var(--label-3); font-weight: 700; margin-left: 4px; }
    .lc-time { font-size: 10px; color: var(--label-3); }

    .cta-block { padding: 32px; background: linear-gradient(135deg, #34c759, #007aff); border-radius: var(--r-lg); margin-top: 20px; }
    .cta-inner { display: grid; grid-template-columns: 1fr auto; gap: 32px; align-items: center; }
    @media (max-width: 800px) { .cta-inner { grid-template-columns: 1fr; } }
    .eyebrow.on-cta { color: rgba(255, 255, 255, 0.9); }
    .cta-title { font-size: clamp(24px, 4vw, 38px); font-weight: 800; color: #fff; letter-spacing: -0.025em; line-height: 1.15; margin-top: 8px; }
    .cta-title em { font-style: italic; font-weight: 300; color: #ffcc00; }
    .cta-lede { font-size: var(--fs-sm); color: rgba(255, 255, 255, 0.9); margin-top: 10px; line-height: 1.55; }
    .cta-perks { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 16px; font-size: var(--fs-xs); color: rgba(255, 255, 255, 0.95); font-weight: 700; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 16px 28px;
      background: #fff; color: #34c759;
      border: 0; border-radius: var(--r-pill);
      font-size: var(--fs-sm); font-weight: 800;
      cursor: pointer; transition: transform 180ms;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2); }

    .listings-layout { display: grid; grid-template-columns: 280px 1fr; gap: 20px; align-items: flex-start; }
    @media (max-width: 1000px) { .listings-layout { grid-template-columns: 1fr; } .filters-panel { position: static; } }

    .filters-panel { position: sticky; top: 12px; padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 16px; }
    .fp-head { display: flex; justify-content: space-between; align-items: center; }
    .fp-head b { font-size: var(--fs-sm); font-weight: 700; }
    .fp-reset { font-size: 10px; color: #34c759; background: none; border: 0; cursor: pointer; font-weight: 700; }
    .fp-group { display: flex; flex-direction: column; gap: 8px; }
    .fp-group > label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-3); }
    .fp-check { display: flex; align-items: center; gap: 8px; font-size: var(--fs-xs); color: var(--label); cursor: pointer; padding: 2px 0; }
    .fp-check input { accent-color: #34c759; }
    .range-row { display: flex; align-items: center; gap: 6px; }
    .range-row span { color: var(--label-3); font-size: 11px; }
    .beds-row { display: flex; gap: 4px; flex-wrap: wrap; }
    .bed-btn { padding: 6px 12px; background: var(--bg-fill-2); border: 0; border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 700; color: var(--label-2); cursor: pointer; transition: all 140ms; }
    .bed-btn.active { background: #34c759; color: #fff; }
    .check-row { display: flex; align-items: center; gap: 8px; font-size: var(--fs-xs); color: var(--label); cursor: pointer; }
    .check-row input { accent-color: #34c759; }

    .empty-state { padding: 60px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; background: var(--bg-fill-2); border-radius: var(--r-md); grid-column: 1 / -1; }
    .empty-state.tall { padding: 120px 20px; }
    .empty-state span { font-size: 48px; opacity: 0.5; }
    .empty-state b { font-size: var(--fs-base); font-weight: 700; }
    .empty-state small { font-size: var(--fs-xs); color: var(--label-2); }

    .card { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 14px; }
    .card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .card-head h3 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .card-head small { font-size: var(--fs-2xs); color: var(--label-2); display: block; margin-top: 2px; }

    .messages-layout { display: grid; grid-template-columns: 380px 1fr; gap: 0; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; min-height: 560px; }
    @media (max-width: 900px) { .messages-layout { grid-template-columns: 1fr; min-height: auto; } }
    .msg-sidebar { border-right: 0.5px solid var(--separator); display: flex; flex-direction: column; }
    .msg-search { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 0.5px solid var(--separator); }
    .msg-search span { font-size: 14px; }
    .msg-search input { flex: 1; background: transparent; border: 0; outline: none; font-size: var(--fs-xs); color: var(--label); font-family: inherit; }
    .msg-list { list-style: none; overflow-y: auto; flex: 1; }
    .msg-item { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: start; padding: 14px 16px; border-bottom: 0.5px solid var(--separator); cursor: pointer; transition: background 140ms; }
    .msg-item:hover { background: var(--bg-hover); }
    .msg-item.active { background: rgba(52, 199, 89, 0.06); }
    .msg-item.unread { border-left: 3px solid #34c759; }
    .msg-avatar { width: 44px; height: 44px; display: grid; place-items: center; background: var(--bg-fill-2); border-radius: 50%; font-size: 20px; }
    .msg-body { min-width: 0; }
    .msg-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .msg-row b { font-size: var(--fs-xs); font-weight: 700; }
    .msg-time { font-size: 9px; color: var(--label-3); }
    .msg-listing { font-size: 10px; color: #34c759; display: block; margin-top: 1px; font-weight: 700; }
    .msg-preview { font-size: 10px; color: var(--label-3); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 4px; line-height: 1.4; }
    .msg-dot { width: 8px; height: 8px; background: #34c759; border-radius: 50%; align-self: center; }
    .msg-thread { display: flex; flex-direction: column; background: var(--bg-root); }
    .mt-head { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; padding: 14px 20px; background: var(--bg-surface-solid); border-bottom: 0.5px solid var(--separator); }
    .mt-avatar { width: 44px; height: 44px; display: grid; place-items: center; background: var(--bg-fill-2); border-radius: 50%; font-size: 20px; }
    .mt-head b { font-size: var(--fs-sm); font-weight: 700; }
    .mt-head small { font-size: 10px; color: #34c759; font-weight: 700; }
    .mt-body { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
    .mt-bubble { padding: 12px 16px; border-radius: var(--r-md); font-size: var(--fs-xs); line-height: 1.5; max-width: 70%; }
    .mt-bubble.incoming { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); align-self: flex-start; }
    .mt-bubble.outgoing { background: #34c759; color: #fff; align-self: flex-end; }
    .mt-composer { display: flex; gap: 10px; padding: 14px 20px; background: var(--bg-surface-solid); border-top: 0.5px solid var(--separator); }
    .mt-composer input { flex: 1; padding: 10px 16px; background: var(--bg-input); border: 0.5px solid var(--separator); border-radius: var(--r-pill); font-size: var(--fs-xs); outline: none; font-family: inherit; }

    .sell-hero { padding: 24px; background: linear-gradient(135deg, rgba(52, 199, 89, 0.08), rgba(0, 122, 255, 0.05)); border-radius: var(--r-lg); border: 0.5px solid var(--separator); }
    .sell-hero-inner { display: flex; flex-direction: column; gap: 16px; }
    .sell-hero h2 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .sell-types { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; max-width: 700px; }
    @media (max-width: 600px) { .sell-types { grid-template-columns: 1fr; } }
    .sell-type-card {
      padding: 24px; background: var(--bg-surface-solid); border: 2px solid var(--separator);
      border-radius: var(--r-md); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;
      transition: all 180ms;
    }
    .sell-type-card:hover { border-color: #34c759; transform: translateY(-2px); }
    .sell-type-card.active { border-color: #34c759; background: rgba(52, 199, 89, 0.06); }
    .stc-icon { font-size: 40px; }
    .sell-type-card b { font-size: var(--fs-base); font-weight: 700; }
    .sell-type-card small { font-size: var(--fs-2xs); color: var(--label-2); }

    .sell-form { padding: 24px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .form-grid .span-2 { grid-column: 1 / -1; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field > span { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-3); }
    .field input, .field select, .field textarea {
      padding: 12px 14px; background: var(--bg-input); color: var(--label);
      border: 1px solid var(--separator); border-radius: var(--r-sm);
      font-size: var(--fs-sm); outline: none; font-family: inherit;
      transition: border-color 140ms;
    }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: #34c759; }
    .field textarea { min-height: 100px; resize: vertical; }

    .upload-zone { padding: 40px 20px; background: var(--bg-fill-2); border: 2px dashed var(--separator); border-radius: var(--r-md); text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; transition: all 180ms; }
    .upload-zone:hover { border-color: #34c759; background: rgba(52, 199, 89, 0.04); }
    .uz-icon { font-size: 48px; }
    .upload-zone b { font-size: var(--fs-sm); font-weight: 700; }
    .upload-zone small { font-size: var(--fs-2xs); color: var(--label-2); }

    .sell-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 16px; border-top: 0.5px solid var(--separator); }

    .profile-hero { padding: 28px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: grid; grid-template-columns: 100px 1fr auto; gap: 24px; align-items: center; }
    @media (max-width: 700px) { .profile-hero { grid-template-columns: 1fr; text-align: center; } }
    .ph-avatar { width: 100px; height: 100px; display: grid; place-items: center; background: linear-gradient(135deg, #34c759, #007aff); border-radius: 50%; font-size: 48px; }
    .ph-info h2 { font-size: var(--fs-xl); font-weight: 800; }
    .ph-info p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 4px; }
    .ph-stats { display: flex; gap: 20px; }
    .ph-stats > div { text-align: center; }
    .ph-stats b { font-size: var(--fs-xl); font-weight: 800; color: #34c759; display: block; font-variant-numeric: tabular-nums; }
    .ph-stats small { font-size: 10px; color: var(--label-3); text-transform: uppercase; font-weight: 700; }

    .team-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 700px) { .team-grid { grid-template-columns: 1fr; } }
    .team-card { display: grid; grid-template-columns: 56px 1fr; gap: 14px; align-items: center; padding: 16px; background: var(--bg-fill-2); border-radius: var(--r-sm); border-left: 3px solid #34c759; }
    .tc-avatar { width: 56px; height: 56px; display: grid; place-items: center; background: linear-gradient(135deg, #34c759, #007aff); border-radius: 50%; font-size: 26px; }
    .team-card b { font-size: var(--fs-sm); font-weight: 700; }
    .team-card p { font-size: var(--fs-xs); color: #34c759; font-weight: 700; margin-top: 2px; }
    .team-card small { font-size: 10px; color: var(--label-2); }

    .my-listings { display: flex; flex-direction: column; gap: 10px; }
    .ml-row { display: grid; grid-template-columns: 48px 1fr auto; gap: 14px; align-items: center; padding: 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .ml-icon { font-size: 32px; text-align: center; }
    .ml-row b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .ml-row small { font-size: 10px; color: var(--label-2); }
    .ml-status { padding: 4px 10px; border-radius: var(--r-pill); font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .ml-status.active { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .ml-status.sold { background: var(--bg-fill-3); color: var(--label-2); }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); z-index: 9990; display: grid; place-items: center; padding: 40px 20px; animation: fadeIn 200ms; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal { max-width: 820px; width: 100%; max-height: 90vh; background: var(--bg-elevated); border: 0.5px solid var(--separator); border-radius: var(--r-lg); box-shadow: var(--shadow-xl); display: flex; flex-direction: column; overflow: hidden; animation: modalIn 300ms var(--ease-spring); }
    @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .modal-head { display: flex; align-items: center; gap: 14px; padding: 20px 24px; border-bottom: 0.5px solid var(--separator); }
    .modal-icon { width: 56px; height: 56px; display: grid; place-items: center; border-radius: var(--r-md); font-size: 28px; flex-shrink: 0; }
    .modal-icon.apartment { background: linear-gradient(135deg, #667eea, #764ba2); }
    .modal-icon.car { background: linear-gradient(135deg, #3a7bd5, #00d2ff); }
    .modal-head > div { flex: 1; }
    .modal-head h3 { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.015em; }
    .modal-head p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 2px; }
    .modal-close { width: 32px; height: 32px; display: grid; place-items: center; border-radius: var(--r-xs); color: var(--label-3); font-size: 16px; background: transparent; border: 0; cursor: pointer; }
    .modal-close:hover { background: var(--bg-hover); color: var(--label); }
    .modal-body { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .modal-foot { padding: 16px 24px; border-top: 0.5px solid var(--separator); display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; align-items: center; }
    .mf-btn { padding: 10px 18px; background: var(--bg-fill-2); color: var(--label); border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 700; border: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .mf-btn:hover { background: var(--bg-fill-3); }
    .mf-btn.primary { background: linear-gradient(135deg, #34c759, #007aff); color: #fff; }

    .lm-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    @media (max-width: 600px) { .lm-gallery { grid-template-columns: repeat(2, 1fr); } }
    .lm-photo { aspect-ratio: 1; display: grid; place-items: center; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: var(--r-sm); font-size: 40px; }

    .lm-price { padding: 16px 20px; background: linear-gradient(135deg, rgba(52, 199, 89, 0.08), rgba(0, 122, 255, 0.05)); border-radius: var(--r-md); display: flex; justify-content: space-between; align-items: baseline; }
    .lm-price b { font-size: var(--fs-3xl); font-weight: 900; color: #34c759; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
    .lm-price-tag { font-size: var(--fs-xs); color: var(--label-2); font-weight: 700; }

    .lm-specs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    @media (max-width: 600px) { .lm-specs { grid-template-columns: 1fr 1fr; } }
    .lms-item { padding: 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .lms-item small { font-size: 10px; color: var(--label-3); text-transform: uppercase; font-weight: 700; letter-spacing: 0.04em; display: block; margin-bottom: 4px; }
    .lms-item b { font-size: var(--fs-sm); font-weight: 700; }
    .lm-section { display: flex; flex-direction: column; gap: 8px; }
    .om-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-3); }
    .lm-amenities { display: flex; flex-wrap: wrap; gap: 6px; }
    .lm-amenity { padding: 5px 12px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 600; }
  `],
})
export class EnnwyPreviewComponent {
  public toast = inject(ToastService);
  private menu = inject(ContextMenuService);

  readonly Math = Math;

  readonly lang = signal<Lang>('en');
  readonly active = signal<EnnwyView>('home');
  readonly activeCategory = signal<'all' | 'apartments' | 'cars'>('all');
  readonly searchType = signal<'apartments' | 'cars'>('apartments');
  readonly searchCity = signal('all');
  readonly searchBudget = signal('all');
  readonly searchQuery = signal('');
  readonly sellType = signal<'apartment' | 'car'>('apartment');

  readonly apartmentSort = signal<'recent' | 'price-asc' | 'price-desc' | 'area'>('recent');
  readonly carSort = signal<'recent' | 'price-asc' | 'price-desc' | 'year' | 'mileage'>('recent');

  readonly filterApartmentTypes = signal<string[]>(['apartment', 'villa', 'duplex', 'penthouse', 'studio']);
  readonly filterApartmentCity = signal<string>('all');
  readonly aptPriceMin = signal<number>(0);
  readonly aptPriceMax = signal<number>(100000000);
  readonly filterBedrooms = signal<number[]>([]);
  readonly filterFurnished = signal<boolean>(false);

  readonly filterCarBrands = signal<string[]>([]);
  readonly filterCarConditions = signal<string[]>(['new', 'used', 'certified']);
  readonly filterCarBody = signal<string>('all');
  readonly carPriceMin = signal<number>(0);
  readonly carPriceMax = signal<number>(10000000);
  readonly filterCarYear = signal<number>(0);

  readonly favApartments = signal<string[]>(['A-002']);
  readonly favCars = signal<string[]>(['C-001']);

  readonly selectedApartment = signal<Apartment | null>(null);
  readonly selectedCar = signal<Car | null>(null);
  readonly selectedMessage = signal<Message | null>(null);

  readonly cities = [
    { id: 'cairo', name: 'Cairo', nameAr: 'القاهرة' },
    { id: 'giza', name: 'Giza', nameAr: 'الجيزة' },
    { id: 'alexandria', name: 'Alexandria', nameAr: 'الإسكندرية' },
    { id: 'new-cairo', name: 'New Cairo', nameAr: 'القاهرة الجديدة' },
    { id: 'sheikh-zayed', name: 'Sheikh Zayed', nameAr: 'الشيخ زايد' },
    { id: '6-october', name: '6th of October', nameAr: 'السادس من أكتوبر' },
  ];

  readonly apartmentTypes = [
    { id: 'apartment', label: 'Apartment', labelAr: 'شقة' },
    { id: 'villa', label: 'Villa', labelAr: 'فيلا' },
    { id: 'duplex', label: 'Duplex', labelAr: 'دوبلكس' },
    { id: 'penthouse', label: 'Penthouse', labelAr: 'بنتهاوس' },
    { id: 'studio', label: 'Studio', labelAr: 'استوديو' },
  ];

  readonly carBrands = [
    { id: 'toyota', label: 'Toyota', labelAr: 'تويوتا' },
    { id: 'honda', label: 'Honda', labelAr: 'هوندا' },
    { id: 'hyundai', label: 'Hyundai', labelAr: 'هيونداي' },
    { id: 'nissan', label: 'Nissan', labelAr: 'نيسان' },
    { id: 'mercedes', label: 'Mercedes', labelAr: 'مرسيدس' },
    { id: 'bmw', label: 'BMW', labelAr: 'بي إم دبليو' },
    { id: 'kia', label: 'Kia', labelAr: 'كيا' },
    { id: 'skoda', label: 'Skoda', labelAr: 'سكودا' },
  ];

  readonly carConditions = [
    { id: 'new', label: 'Brand new', labelAr: 'جديد' },
    { id: 'used', label: 'Used', labelAr: 'مستعمل' },
    { id: 'certified', label: 'Certified', labelAr: 'معتمد' },
  ];

  readonly carBodyTypes = [
    { id: 'sedan', label: 'Sedan', labelAr: 'سيدان' },
    { id: 'suv', label: 'SUV', labelAr: 'SUV' },
    { id: 'hatchback', label: 'Hatchback', labelAr: 'هاتشباك' },
    { id: 'pickup', label: 'Pickup', labelAr: 'بيك أب' },
    { id: 'coupe', label: 'Coupe', labelAr: 'كوبيه' },
    { id: 'convertible', label: 'Convertible', labelAr: 'كشف' },
  ];

  readonly apartments = signal<Apartment[]>([
    { id: 'A-001', title: '3-bedroom apartment in Nasr City', titleAr: 'شقة 3 غرف في مدينة نصر', city: 'cairo', cityAr: 'القاهرة', district: 'Nasr City', districtAr: 'مدينة نصر', price: 3200000, area: 145, bedrooms: 3, bathrooms: 2, floor: 3, totalFloors: 8, furnished: false, type: 'apartment', finishing: 'super-lux', amenities: ['🚗 Parking', '🛗 Elevator', '🏊 Pool', '🎮 Gym'], images: ['🏢', '🛏', '🚿', '🪟'], featured: true, posted: '3 days ago', postedAr: 'منذ 3 أيام', views: 342, isNew: false },
    { id: 'A-002', title: 'Modern duplex in Sheikh Zayed', titleAr: 'دوبلكس حديث في الشيخ زايد', city: 'sheikh-zayed', cityAr: 'الشيخ زايد', district: 'Beverly Hills', districtAr: 'بيفرلي هيلز', price: 8500000, area: 280, bedrooms: 4, bathrooms: 4, floor: 1, totalFloors: 2, furnished: true, type: 'duplex', finishing: 'super-lux', amenities: ['🌳 Private garden', '🚗 2 parking spots', '🏊 Pool', '🎮 Gym', '🔒 24/7 security'], images: ['🏡', '🛏', '🛋', '🌳'], featured: true, posted: '5 hours ago', postedAr: 'منذ 5 ساعات', views: 187, isNew: true, compoundName: 'Beverly Hills' },
    { id: 'A-003', title: 'Studio apartment in Maadi', titleAr: 'شقة استوديو في المعادي', city: 'cairo', cityAr: 'القاهرة', district: 'Maadi', districtAr: 'المعادي', price: 1400000, area: 65, bedrooms: 1, bathrooms: 1, floor: 2, totalFloors: 5, furnished: true, type: 'studio', finishing: 'lux', amenities: ['🛗 Elevator', '📺 Furnished'], images: ['🏢', '🛏', '🛋'], featured: false, posted: '1 week ago', postedAr: 'منذ أسبوع', views: 128, isNew: false },
    { id: 'A-004', title: 'Luxury villa in New Cairo', titleAr: 'فيلا فاخرة في القاهرة الجديدة', city: 'new-cairo', cityAr: 'القاهرة الجديدة', district: 'Fifth Settlement', districtAr: 'التجمع الخامس', price: 18500000, area: 450, bedrooms: 6, bathrooms: 5, floor: 1, totalFloors: 3, furnished: false, type: 'villa', finishing: 'super-lux', amenities: ['🏊 Private pool', '🌳 Large garden', '🚗 4 parking', '👮 Guard', '🎮 Home gym'], images: ['🏰', '🛏', '🏊', '🌳'], featured: true, posted: '1 day ago', postedAr: 'منذ يوم', views: 412, isNew: true, compoundName: 'Mountain View' },
    { id: 'A-005', title: 'Penthouse with Nile view', titleAr: 'بنتهاوس بإطلالة على النيل', city: 'cairo', cityAr: 'القاهرة', district: 'Zamalek', districtAr: 'الزمالك', price: 12000000, area: 220, bedrooms: 3, bathrooms: 3, floor: 12, totalFloors: 12, furnished: true, type: 'penthouse', finishing: 'super-lux', amenities: ['🌊 Nile view', '🛗 Private elevator', '❄️ Central AC'], images: ['🌃', '🛏', '🌊', '🛋'], featured: true, posted: '2 days ago', postedAr: 'منذ يومين', views: 267, isNew: false },
    { id: 'A-006', title: '2-bedroom in 6 October', titleAr: 'شقة غرفتين في 6 أكتوبر', city: '6-october', cityAr: 'السادس من أكتوبر', district: 'Dreamland', districtAr: 'دريم لاند', price: 2400000, area: 110, bedrooms: 2, bathrooms: 2, floor: 4, totalFloors: 6, furnished: false, type: 'apartment', finishing: 'lux', amenities: ['🚗 Parking', '🛗 Elevator', '🌳 Garden'], images: ['🏢', '🛏', '🚿'], featured: false, posted: '4 days ago', postedAr: 'منذ 4 أيام', views: 94, isNew: false },
    { id: 'A-007', title: 'Family apartment in Rehab', titleAr: 'شقة عائلية في الرحاب', city: 'new-cairo', cityAr: 'القاهرة الجديدة', district: 'Al Rehab', districtAr: 'الرحاب', price: 4100000, area: 180, bedrooms: 4, bathrooms: 3, floor: 1, totalFloors: 5, furnished: false, type: 'apartment', finishing: 'super-lux', amenities: ['🌳 Garden', '🏊 Pool', '🎮 Gym', '🏫 Schools'], images: ['🏘', '🛏', '🛋', '🌳'], featured: false, posted: '2 weeks ago', postedAr: 'منذ أسبوعين', views: 156, isNew: false, compoundName: 'Al Rehab' },
    { id: 'A-008', title: 'Seaview apartment in Alexandria', titleAr: 'شقة بإطلالة بحرية في الإسكندرية', city: 'alexandria', cityAr: 'الإسكندرية', district: 'Sidi Gaber', districtAr: 'سيدي جابر', price: 2800000, area: 130, bedrooms: 3, bathrooms: 2, floor: 6, totalFloors: 10, furnished: true, type: 'apartment', finishing: 'lux', amenities: ['🌊 Sea view', '🛗 Elevator', '🏖 Beach access'], images: ['🌊', '🛏', '🛋'], featured: true, posted: '1 day ago', postedAr: 'منذ يوم', views: 218, isNew: true },
  ]);

  readonly cars = signal<Car[]>([
    { id: 'C-001', title: 'Toyota Corolla 2020', titleAr: 'تويوتا كورولا 2020', brand: 'toyota', brandAr: 'تويوتا', model: 'Corolla', year: 2020, price: 850000, mileage: 45000, transmission: 'automatic', fuel: 'petrol', color: 'White', colorAr: 'أبيض', bodyType: 'sedan', condition: 'used', images: ['🚗', '🎨', '🪟'], featured: true, posted: '2 days ago', postedAr: 'منذ يومين', views: 412, isNew: false },
    { id: 'C-002', title: 'Honda Civic 2022', titleAr: 'هوندا سيفيك 2022', brand: 'honda', brandAr: 'هوندا', model: 'Civic', year: 2022, price: 1450000, mileage: 18000, transmission: 'automatic', fuel: 'petrol', color: 'Black', colorAr: 'أسود', bodyType: 'sedan', condition: 'certified', images: ['🚙', '🖤', '🪟'], featured: true, posted: '5 hours ago', postedAr: 'منذ 5 ساعات', views: 287, isNew: true },
    { id: 'C-003', title: 'Hyundai Tucson 2023', titleAr: 'هيونداي توسان 2023', brand: 'hyundai', brandAr: 'هيونداي', model: 'Tucson', year: 2023, price: 2200000, mileage: 8000, transmission: 'automatic', fuel: 'petrol', color: 'Silver', colorAr: 'فضي', bodyType: 'suv', condition: 'new', images: ['🚙', '🌟', '🪟'], featured: true, posted: '1 day ago', postedAr: 'منذ يوم', views: 198, isNew: true },
    { id: 'C-004', title: 'BMW 320i 2021', titleAr: 'BMW 320i 2021', brand: 'bmw', brandAr: 'بي إم دبليو', model: '320i', year: 2021, price: 3200000, mileage: 32000, transmission: 'automatic', fuel: 'petrol', color: 'Blue', colorAr: 'أزرق', bodyType: 'sedan', condition: 'certified', images: ['🏎', '💙', '🪟'], featured: true, posted: '3 days ago', postedAr: 'منذ 3 أيام', views: 342, isNew: false },
    { id: 'C-005', title: 'Mercedes C200 2022', titleAr: 'مرسيدس C200 2022', brand: 'mercedes', brandAr: 'مرسيدس', model: 'C200', year: 2022, price: 4100000, mileage: 22000, transmission: 'automatic', fuel: 'petrol', color: 'Black', colorAr: 'أسود', bodyType: 'sedan', condition: 'certified', images: ['🚗', '🖤', '💎'], featured: false, posted: '1 week ago', postedAr: 'منذ أسبوع', views: 512, isNew: false },
    { id: 'C-006', title: 'Nissan Sunny 2019', titleAr: 'نيسان صني 2019', brand: 'nissan', brandAr: 'نيسان', model: 'Sunny', year: 2019, price: 520000, mileage: 78000, transmission: 'manual', fuel: 'petrol', color: 'White', colorAr: 'أبيض', bodyType: 'sedan', condition: 'used', images: ['🚗', '🤍', '🪟'], featured: false, posted: '4 days ago', postedAr: 'منذ 4 أيام', views: 156, isNew: false },
    { id: 'C-007', title: 'Kia Sportage 2024', titleAr: 'كيا سبورتاج 2024', brand: 'kia', brandAr: 'كيا', model: 'Sportage', year: 2024, price: 2450000, mileage: 0, transmission: 'automatic', fuel: 'petrol', color: 'Red', colorAr: 'أحمر', bodyType: 'suv', condition: 'new', images: ['🚙', '❤️', '✨'], featured: true, posted: '8 hours ago', postedAr: 'منذ 8 ساعات', views: 324, isNew: true },
    { id: 'C-008', title: 'Skoda Octavia 2020', titleAr: 'سكودا أوكتافيا 2020', brand: 'skoda', brandAr: 'سكودا', model: 'Octavia', year: 2020, price: 890000, mileage: 55000, transmission: 'automatic', fuel: 'petrol', color: 'Grey', colorAr: 'رمادي', bodyType: 'sedan', condition: 'used', images: ['🚗', '🩶', '🪟'], featured: false, posted: '5 days ago', postedAr: 'منذ 5 أيام', views: 187, isNew: false },
  ]);

  readonly messages = signal<Message[]>([
    { id: 'M-001', fromId: 'U-001', fromName: 'Ahmed Samir', fromNameAr: 'أحمد سمير', fromAvatar: '👨', preview: 'Hi, is the Nasr City apartment still available? I\'d like to schedule a visit this weekend.', previewAr: 'مرحباً، هل شقة مدينة نصر لا تزال متاحة؟ أود تحديد موعد زيارة هذا الأسبوع.', time: '10m', timeAr: 'منذ 10 دقائق', unread: true, listingTitle: '3-bedroom apartment in Nasr City', listingTitleAr: 'شقة 3 غرف في مدينة نصر' },
    { id: 'M-002', fromId: 'U-002', fromName: 'Sara Hassan', fromNameAr: 'سارة حسن', fromAvatar: '👩', preview: 'I\'m interested in the Toyota Corolla. Can you share more photos?', previewAr: 'أنا مهتمة بتويوتا كورولا. هل يمكنك مشاركة المزيد من الصور؟', time: '1h', timeAr: 'منذ ساعة', unread: true, listingTitle: 'Toyota Corolla 2020', listingTitleAr: 'تويوتا كورولا 2020' },
    { id: 'M-003', fromId: 'U-003', fromName: 'Omar Khaled', fromNameAr: 'عمر خالد', fromAvatar: '👨', preview: 'Is the price negotiable? I can visit tomorrow with cash.', previewAr: 'هل السعر قابل للتفاوض؟ يمكنني الزيارة غداً نقداً.', time: '3h', timeAr: 'منذ 3 ساعات', unread: false, listingTitle: 'Luxury villa in New Cairo', listingTitleAr: 'فيلا فاخرة في القاهرة الجديدة' },
    { id: 'M-004', fromId: 'U-004', fromName: 'Layla Ibrahim', fromNameAr: 'ليلى إبراهيم', fromAvatar: '👩', preview: 'What\'s the minimum contract period for the studio?', previewAr: 'ما هي المدة الدنيا للعقد في الاستوديو؟', time: '1d', timeAr: 'منذ يوم', unread: false, listingTitle: 'Studio apartment in Maadi', listingTitleAr: 'شقة استوديو في المعادي' },
  ]);

  readonly nav = computed<PreviewNavItem[]>(() => [
    { id: 'home', label: this.t('Home', 'الرئيسية'), icon: '🏠', group: this.t('Browse', 'تصفح') },
    { id: 'apartments', label: this.t('Apartments', 'شقق وفيلات'), icon: '🏘', badge: this.apartments().length, group: this.t('Browse', 'تصفح') },
    { id: 'cars', label: this.t('Cars', 'سيارات'), icon: '🚗', badge: this.cars().length, group: this.t('Browse', 'تصفح') },
    { id: 'favorites', label: this.t('Favorites', 'المفضلة'), icon: '❤️', badge: this.favApartments().length + this.favCars().length, group: this.t('Account', 'الحساب') },
    { id: 'messages', label: this.t('Messages', 'المحادثات'), icon: '💬', badge: this.unreadMessages(), group: this.t('Account', 'الحساب') },
    { id: 'sell', label: this.t('Sell', 'بِع الآن'), icon: '＋', group: this.t('Account', 'الحساب') },
    { id: 'profile', label: this.t('Profile', 'ملفي'), icon: '👤', group: this.t('Account', 'الحساب') },
  ]);

  readonly toolbar = computed<ToolbarAction[]>(() => [
    { id: 'refresh', label: this.t('Refresh', 'تحديث'), icon: '⟳', action: () => this.toast.success(this.t('Refreshed', 'تم التحديث')) },
    { id: 'sell', label: this.t('List now', 'أضف إعلان'), icon: '＋', primary: true, action: () => this.active.set('sell') },
  ]);

  readonly notifs = computed<PreviewNotification[]>(() => [
    { id: 1, icon: '❤️', title: this.t('Someone favorited', 'شخص أضاف للمفضلة'), body: this.t('Villa in New Cairo', 'فيلا في القاهرة الجديدة'), time: '5m' },
    { id: 2, icon: '💬', title: this.t('New message', 'رسالة جديدة'), body: this.t('From Ahmed Samir', 'من أحمد سمير'), time: '10m' },
    { id: 3, icon: '📉', title: this.t('Price drop', 'انخفاض سعر'), body: this.t('Similar to your saved item', 'مشابه لمحفوظاتك'), time: '1h' },
    { id: 4, icon: '🎉', title: this.t('Your listing hit 100 views', 'إعلانك وصل 100 مشاهدة'), body: this.t('3-bedroom in Nasr City', 'شقة 3 غرف في مدينة نصر'), time: '3h' },
  ]);

  readonly searchPlaceholder = computed(() =>
    this.active() === 'apartments' ? this.t('Search apartments…', 'ابحث في الشقق…') :
      this.active() === 'cars' ? this.t('Search cars…', 'ابحث في السيارات…') :
        this.active() === 'messages' ? this.t('Search messages…', 'ابحث في المحادثات…') : ''
  );

  readonly featuredApartments = computed(() => this.apartments().filter(a => a.featured).slice(0, 4));
  readonly featuredCars = computed(() => this.cars().filter(c => c.featured).slice(0, 4));
  readonly unreadMessages = computed(() => this.messages().filter(m => m.unread).length);
  readonly favApartmentItems = computed(() => this.apartments().filter(a => this.favApartments().includes(a.id)));
  readonly favCarItems = computed(() => this.cars().filter(c => this.favCars().includes(c.id)));

  readonly filteredApartments = computed(() => {
    let list = this.apartments();
    const types = this.filterApartmentTypes();
    if (types.length) list = list.filter(a => types.includes(a.type));
    const city = this.filterApartmentCity();
    if (city !== 'all') list = list.filter(a => a.city === city);
    if (this.aptPriceMin() > 0) list = list.filter(a => a.price >= this.aptPriceMin());
    if (this.aptPriceMax() < 100000000) list = list.filter(a => a.price <= this.aptPriceMax());
    const beds = this.filterBedrooms();
    if (beds.length) list = list.filter(a => beds.some(b => a.bedrooms >= b));
    if (this.filterFurnished()) list = list.filter(a => a.furnished);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.district.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q)
    );
    const sort = this.apartmentSort();
    return [...list].sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'area') return b.area - a.area;
      return 0;
    });
  });

  readonly filteredCars = computed(() => {
    let list = this.cars();
    const brands = this.filterCarBrands();
    if (brands.length) list = list.filter(c => brands.includes(c.brand));
    const conds = this.filterCarConditions();
    if (conds.length) list = list.filter(c => conds.includes(c.condition));
    const body = this.filterCarBody();
    if (body !== 'all') list = list.filter(c => c.bodyType === body);
    if (this.carPriceMin() > 0) list = list.filter(c => c.price >= this.carPriceMin());
    if (this.carPriceMax() < 10000000) list = list.filter(c => c.price <= this.carPriceMax());
    if (this.filterCarYear() > 0) list = list.filter(c => c.year >= this.filterCarYear());
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.brand.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q)
    );
    const sort = this.carSort();
    return [...list].sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'year') return b.year - a.year;
      if (sort === 'mileage') return a.mileage - b.mileage;
      return 0;
    });
  });

  t(en: string, ar: string): string { return this.lang() === 'ar' ? ar : en; }
  onNav(id: string): void { this.active.set(id as EnnwyView); }
  onSearch(q: string): void { this.searchQuery.set(q); }

  apartmentTypeAr(t: string): string {
    const map: Record<string, string> = { apartment: 'شقة', villa: 'فيلا', duplex: 'دوبلكس', penthouse: 'بنتهاوس', studio: 'استوديو' };
    return map[t] ?? t;
  }
  finishingAr(f: string): string {
    const map: Record<string, string> = { 'super-lux': 'سوبر لوكس', 'lux': 'لوكس', 'semi-finished': 'نصف تشطيب', 'core-shell': 'على الطوب' };
    return map[f] ?? f;
  }
  carBodyAr(b: string): string {
    const map: Record<string, string> = { sedan: 'سيدان', suv: 'SUV', hatchback: 'هاتشباك', pickup: 'بيك أب', coupe: 'كوبيه', convertible: 'كشف' };
    return map[b] ?? b;
  }
  transmissionAr(t: string): string {
    const map: Record<string, string> = { automatic: 'أوتوماتيك', manual: 'مانوال' };
    return map[t] ?? t;
  }
  fuelAr(f: string): string {
    const map: Record<string, string> = { petrol: 'بنزين', diesel: 'ديزل', electric: 'كهرباء', hybrid: 'هايبرد' };
    return map[f] ?? f;
  }
  conditionAr(c: string): string {
    const map: Record<string, string> = { new: 'جديد', used: 'مستعمل', certified: 'معتمد' };
    return map[c] ?? c;
  }

  toggleFavApartment(id: string): void {
    this.favApartments.update(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
    const a = this.apartments().find(x => x.id === id);
    if (a) this.toast.success(this.favApartments().includes(id) ? this.t('Added to favorites', 'تمت الإضافة للمفضلة') : this.t('Removed', 'تم الحذف'), this.t(a.title, a.titleAr));
  }
  toggleFavCar(id: string): void {
    this.favCars.update(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
    const c = this.cars().find(x => x.id === id);
    if (c) this.toast.success(this.favCars().includes(id) ? this.t('Added to favorites', 'تمت الإضافة للمفضلة') : this.t('Removed', 'تم الحذف'), this.t(c.title, c.titleAr));
  }

  toggleApartmentType(id: string): void {
    this.filterApartmentTypes.update(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  }
  toggleBedrooms(n: number): void {
    this.filterBedrooms.update(list => list.includes(n) ? list.filter(x => x !== n) : [...list, n]);
  }
  toggleCarBrand(id: string): void {
    this.filterCarBrands.update(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  }
  toggleCarCondition(id: string): void {
    this.filterCarConditions.update(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  }

  resetApartmentFilters(): void {
    this.filterApartmentTypes.set(['apartment', 'villa', 'duplex', 'penthouse', 'studio']);
    this.filterApartmentCity.set('all');
    this.aptPriceMin.set(0);
    this.aptPriceMax.set(100000000);
    this.filterBedrooms.set([]);
    this.filterFurnished.set(false);
  }
  resetCarFilters(): void {
    this.filterCarBrands.set([]);
    this.filterCarConditions.set(['new', 'used', 'certified']);
    this.filterCarBody.set('all');
    this.carPriceMin.set(0);
    this.carPriceMax.set(10000000);
    this.filterCarYear.set(0);
  }

  openApartment(id: string): void {
    const a = this.apartments().find(x => x.id === id);
    if (a) {
      this.selectedApartment.set(a);
      this.apartments.update(list => list.map(x => x.id === id ? { ...x, views: x.views + 1 } : x));
    }
  }
  openCar(id: string): void {
    const c = this.cars().find(x => x.id === id);
    if (c) {
      this.selectedCar.set(c);
      this.cars.update(list => list.map(x => x.id === id ? { ...x, views: x.views + 1 } : x));
    }
  }

  selectMessage(id: string): void {
    const m = this.messages().find(x => x.id === id);
    if (m) {
      this.selectedMessage.set(m);
      this.messages.update(list => list.map(x => x.id === id ? { ...x, unread: false } : x));
    }
  }
  sendMessage(): void {
    this.toast.success(this.t('Message sent', 'تم إرسال الرسالة'));
  }
  contactSeller(id: string): void {
    this.toast.success(this.t('Chat started', 'بدأت المحادثة'), this.t('Seller will reply soon', 'سيرد البائع قريباً'));
  }
  runSearch(): void {
    if (this.searchType() === 'apartments') this.active.set('apartments');
    else this.active.set('cars');
  }
  publishListing(): void {
    this.toast.success(this.t('Listing published!', 'تم نشر الإعلان!'), this.t('Your listing is now live', 'إعلانك أصبح متاحاً الآن'));
  }

  onApartmentContext(ev: MouseEvent, a: Apartment): void {
    ev.preventDefault(); ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: this.t('View details', 'عرض التفاصيل'), icon: '👁', action: () => this.openApartment(a.id) },
      { id: 'fav', label: this.favApartments().includes(a.id) ? this.t('Remove favorite', 'إزالة من المفضلة') : this.t('Add to favorites', 'أضف للمفضلة'), icon: '❤️', action: () => this.toggleFavApartment(a.id) },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      { id: 'share', label: this.t('Share', 'مشاركة'), icon: '🔗', action: () => this.toast.success(this.t('Link copied', 'تم نسخ الرابط')) },
      { id: 'report', label: this.t('Report', 'إبلاغ'), icon: '⚠️', danger: true, action: () => this.toast.warning(this.t('Reported', 'تم الإبلاغ')) },
    ]);
  }
  onCarContext(ev: MouseEvent, c: Car): void {
    ev.preventDefault(); ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: this.t('View details', 'عرض التفاصيل'), icon: '👁', action: () => this.openCar(c.id) },
      { id: 'fav', label: this.favCars().includes(c.id) ? this.t('Remove favorite', 'إزالة من المفضلة') : this.t('Add to favorites', 'أضف للمفضلة'), icon: '❤️', action: () => this.toggleFavCar(c.id) },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      { id: 'share', label: this.t('Share', 'مشاركة'), icon: '🔗', action: () => this.toast.success(this.t('Link copied', 'تم نسخ الرابط')) },
      { id: 'report', label: this.t('Report', 'إبلاغ'), icon: '⚠️', danger: true, action: () => this.toast.warning(this.t('Reported', 'تم الإبلاغ')) },
    ]);
  }
}