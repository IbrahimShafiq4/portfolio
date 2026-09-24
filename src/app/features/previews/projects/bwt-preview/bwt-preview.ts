import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PreviewShellComponent, PreviewNavItem, ToolbarAction, PreviewNotification } from '../../shared/preview-shell/preview-shell';

type BwtView =
  | 'dashboard' | 'donations' | 'donors' | 'beneficiaries'
  | 'projects' | 'campaigns' | 'kaffala' | 'volunteers'
  | 'expenses' | 'distribution' | 'reports' | 'settings';

type Lang = 'en' | 'ar';

interface Donation {
  id: string; donorId: string; donorName: string; donorNameAr: string;
  amount: number; currency: 'EGP' | 'USD' | 'SAR';
  type: 'zakat' | 'sadaqah' | 'kaffala' | 'waqf' | 'fidyah' | 'qurbani' | 'ramadan';
  method: 'cash' | 'bank' | 'online' | 'wallet' | 'cheque';
  purpose: string; purposeAr: string;
  status: 'pending' | 'confirmed' | 'receipted' | 'refunded';
  date: string; receiptNo: string;
  campaignId?: string; notes?: string;
}

interface Donor {
  id: string; name: string; nameAr: string;
  type: 'individual' | 'company' | 'anonymous';
  phone: string; email: string; city: string; cityAr: string;
  totalDonated: number; donationCount: number; lastDonation: string;
  segment: 'bronze' | 'silver' | 'gold' | 'platinum';
  joinedAt: string; taxId?: string;
  monthlyCommitment?: number;
  status: 'active' | 'inactive' | 'vip';
}

interface Beneficiary {
  id: string; name: string; nameAr: string;
  nationalId: string;
  category: 'orphan' | 'widow' | 'disabled' | 'elderly' | 'poor' | 'student' | 'patient';
  familySize: number; monthlyIncome: number;
  city: string; cityAr: string; district: string;
  monthlyAid: number; totalAidReceived: number;
  registeredAt: string; lastAidAt: string;
  status: 'active' | 'pending' | 'graduated' | 'suspended';
  phone: string;
  documents: number;
}

interface Project {
  id: string; name: string; nameAr: string;
  category: 'water' | 'orphan' | 'food' | 'medical' | 'education' | 'housing' | 'ramadan' | 'emergency' | 'mosque';
  icon: string; color: string;
  budget: number; spent: number; progress: number;
  beneficiaries: number; donors: number;
  startDate: string; endDate: string;
  manager: string; managerAr: string;
  location: string; locationAr: string;
  status: 'planning' | 'active' | 'completed' | 'paused';
  description: string; descriptionAr: string;
}

interface Campaign {
  id: string; name: string; nameAr: string;
  icon: string;
  target: number; raised: number; donorsCount: number;
  startDate: string; endDate: string;
  daysLeft: number;
  status: 'active' | 'ending-soon' | 'completed' | 'draft';
  featured: boolean;
  category: string; categoryAr: string;
}

interface Kaffala {
  id: string;
  beneficiaryId: string; beneficiaryName: string; beneficiaryNameAr: string;
  sponsorId: string; sponsorName: string; sponsorNameAr: string;
  type: 'orphan' | 'student' | 'family' | 'patient';
  monthlyAmount: number;
  startDate: string; endDate?: string;
  paidMonths: number; remainingMonths: number;
  totalPaid: number;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  notes: string;
}

interface Volunteer {
  id: string; name: string; nameAr: string;
  role: string; roleAr: string;
  phone: string; email: string; city: string;
  hours: number; tasksCompleted: number; rating: number;
  joinedAt: string;
  status: 'active' | 'on-leave' | 'inactive';
}

interface Expense {
  id: string; category: string; categoryAr: string;
  amount: number; projectId?: string;
  description: string; descriptionAr: string;
  date: string; approvedBy: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  method: 'cash' | 'bank' | 'cheque';
}

interface Distribution {
  id: string; beneficiaryId: string; beneficiaryName: string; beneficiaryNameAr: string;
  aidType: 'cash' | 'food' | 'clothing' | 'medical' | 'school' | 'winter';
  aidTypeAr: string;
  amount: number; quantity: number; unit: string; unitAr: string;
  date: string; distributedBy: string;
  location: string; locationAr: string;
  signature: boolean;
}

@Component({
  selector: 'app-bwt-preview',
  standalone: true,
  imports: [PreviewShellComponent, DecimalPipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="🕌"
      title="جمعية البر والتقوى"
      [subtitle]="lang() === 'ar' ? 'منصة الأعمال الخيرية · تبرعات · كفالات · مشاريع' : 'Al-Birr Wal-Taqwa Charity · Donations · Sponsorships · Projects'"
      [nav]="nav()"
      [active]="active()"
      (activeChange)="onNav($any($event))"
      [toolbarActions]="toolbar()"
      [notifications]="notifs()"
      [searchPlaceholder]="searchPlaceholder()"
      (searchChange)="onSearch($event)"
    >
      <!-- ══════════════════ TOP BAR ══════════════════ -->
      <div class="bwt-bar">
        <div class="lang-switch">
          <button class="ls-btn" [class.active]="lang() === 'en'" (click)="lang.set('en')">EN</button>
          <button class="ls-btn" [class.active]="lang() === 'ar'" (click)="lang.set('ar')">AR</button>
        </div>
        <div class="fy-pill">
          <span class="fy-label">{{ t('Fiscal Year', 'السنة المالية') }}</span>
          <b>2024 / 2025</b>
        </div>
        <div class="currency-pill"><span>EGP</span></div>
        <div class="status-pill" [class.closed]="periodClosed()">
          <span class="status-dot"></span>
          <span>{{ periodClosed() ? t('Period Closed', 'الفترة مقفلة') : t('Period Open', 'الفترة مفتوحة') }}</span>
        </div>
        <div class="quick-stats">
          <span class="qs-item"><b>{{ donations().length }}</b> {{ t('donations', 'تبرع') }}</span>
          <span class="qs-sep">·</span>
          <span class="qs-item"><b>{{ totalDonations() | number }}</b> EGP</span>
        </div>
      </div>

      @switch (active()) {

        <!-- ══════════════════ DASHBOARD ══════════════════ -->
        @case ('dashboard') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Overview', 'نظرة عامة') }}</span>
                <h3>{{ t('Charity Dashboard', 'لوحة التحكم الخيرية') }}</h3>
                <p>{{ t('Real-time snapshot of donations, projects & impact', 'نظرة فورية على التبرعات والمشاريع والأثر') }}</p>
              </div>
              <div class="view-actions">
                <button class="pill" (click)="active.set('distribution')">📦 {{ t('New Distribution', 'توزيع جديد') }}</button>
                <button class="pill primary" (click)="active.set('donations')">＋ {{ t('New Donation', 'تبرع جديد') }}</button>
              </div>
            </header>

            <!-- Impact equation bar -->
            <section class="impact-bar">
              <div class="impact-item">
                <span class="ii-icon">💝</span>
                <div>
                  <span class="ii-label">{{ t('Total Donations', 'إجمالي التبرعات') }}</span>
                  <b class="ii-val">{{ totalDonations() | number }} EGP</b>
                </div>
              </div>
              <span class="impact-op">=</span>
              <div class="impact-item">
                <span class="ii-icon">👥</span>
                <div>
                  <span class="ii-label">{{ t('Beneficiaries', 'المستفيدون') }}</span>
                  <b class="ii-val">{{ beneficiaries().length | number }}</b>
                </div>
              </div>
              <span class="impact-op">+</span>
              <div class="impact-item">
                <span class="ii-icon">🏗</span>
                <div>
                  <span class="ii-label">{{ t('Projects', 'المشاريع') }}</span>
                  <b class="ii-val">{{ projects().length }}</b>
                </div>
              </div>
              <span class="impact-op">+</span>
              <div class="impact-item">
                <span class="ii-icon">🤝</span>
                <div>
                  <span class="ii-label">{{ t('Volunteers', 'المتطوعون') }}</span>
                  <b class="ii-val">{{ volunteers().length }}</b>
                </div>
              </div>
              <span class="eq-check" [class.balanced]="equationBalanced()">
                {{ equationBalanced() ? '✓' : '!' }}
              </span>
            </section>

            <!-- KPI grid -->
            <section class="kpis">
              @for (k of dashboardKpis(); track k.label) {
                <article class="kpi" [style.--c]="k.color" (click)="k.go()">
                  <span class="kpi-icon">{{ k.icon }}</span>
                  <b class="kpi-val">{{ k.value }}</b>
                  <span class="kpi-label">{{ k.label }}</span>
                  <div class="kpi-trend" [class.up]="k.trendUp" [class.down]="!k.trendUp">
                    {{ k.trendUp ? '▲' : '▼' }} {{ k.trend }}
                  </div>
                </article>
              }
            </section>

            <!-- Charts row -->
            <div class="grid-2">
              <section class="card">
                <header class="card-head">
                  <div>
                    <h4>{{ t('Donations by month', 'التبرعات شهرياً') }}</h4>
                    <small>{{ t('Last 6 months', 'آخر 6 أشهر') }} · EGP</small>
                  </div>
                  <div class="legend-row">
                    <span><i class="dot" style="background:#34c759"></i> {{ t('Zakat', 'زكاة') }}</span>
                    <span><i class="dot" style="background:#007aff"></i> {{ t('Sadaqah', 'صدقة') }}</span>
                    <span><i class="dot" style="background:#ff9500"></i> {{ t('Kaffala', 'كفالة') }}</span>
                  </div>
                </header>
                <div class="stacked-chart">
                  @for (m of monthlyDonations(); track m.month) {
                    <div class="sc-group">
                      <div class="sc-bars">
                        <div class="sc-bar green" [style.height.%]="m.zakatPct" [title]="m.zakat | number"></div>
                        <div class="sc-bar blue" [style.height.%]="m.sadaqahPct" [title]="m.sadaqah | number"></div>
                        <div class="sc-bar amber" [style.height.%]="m.kaffalaPct" [title]="m.kaffala | number"></div>
                      </div>
                      <span class="sc-label">{{ m.month }}</span>
                    </div>
                  }
                </div>
              </section>

              <section class="card">
                <header class="card-head">
                  <div>
                    <h4>{{ t('Top donation types', 'أعلى أنواع التبرعات') }}</h4>
                    <small>{{ donations().length }} {{ t('total', 'إجمالي') }}</small>
                  </div>
                </header>
                <ul class="type-breakdown">
                  @for (t2 of donationTypeBreakdown(); track t2.label) {
                    <li class="tb-row">
                      <span class="tb-icon">{{ t2.icon }}</span>
                      <span class="tb-label">{{ t(t2.label, t2.labelAr) }}</span>
                      <div class="tb-track"><div class="tb-fill" [style.width.%]="t2.pct" [style.background]="t2.color"></div></div>
                      <span class="tb-count mono">{{ t2.count }}</span>
                      <span class="tb-amount mono">{{ t2.amount | number }}</span>
                    </li>
                  }
                </ul>
              </section>
            </div>

            <!-- Featured campaigns -->
            <section class="card">
              <header class="card-head">
                <div>
                  <h4>🔥 {{ t('Featured campaigns', 'حملات مميزة') }}</h4>
                  <small>{{ t('Active fundraising now', 'حملات جمع تبرعات نشطة الآن') }}</small>
                </div>
                <button class="pill-sm" (click)="active.set('campaigns')">{{ t('View all', 'عرض الكل') }} →</button>
              </header>
              <div class="campaigns-row">
                @for (c of featuredCampaigns(); track c.id) {
                  <article class="campaign-mini" (click)="openCampaign(c.id)">
                    <header>
                      <span class="cm-icon">{{ c.icon }}</span>
                      <b>{{ t(c.name, c.nameAr) }}</b>
                    </header>
                    <div class="cm-progress">
                      <div class="cmp-bar"><div class="cmp-fill" [style.width.%]="(c.raised / c.target) * 100"></div></div>
                      <div class="cmp-meta">
                        <span class="mono">{{ c.raised | number }} / {{ c.target | number }}</span>
                        <span class="cmp-pct">{{ Math.round((c.raised / c.target) * 100) }}%</span>
                      </div>
                    </div>
                    <footer class="cm-foot">
                      <span>👥 {{ c.donorsCount }} {{ t('donors', 'متبرع') }}</span>
                      <span class="cm-days">⏱ {{ c.daysLeft }} {{ t('days left', 'يوم متبقي') }}</span>
                    </footer>
                  </article>
                }
              </div>
            </section>

            <!-- Recent donations + Top donors -->
            <div class="grid-2">
              <section class="card">
                <header class="card-head">
                  <div>
                    <h4>{{ t('Recent donations', 'أحدث التبرعات') }}</h4>
                    <small>{{ t('Live feed', 'بث مباشر') }}</small>
                  </div>
                  <button class="pill-sm" (click)="active.set('donations')">{{ t('All', 'الكل') }}</button>
                </header>
                <ul class="feed">
                  @for (d of recentDonations(); track d.id) {
                    <li class="feed-item" (click)="openDonation(d.id)">
                      <span class="fi-icon" [style.background]="donationTypeColor(d.type) + '22'" [style.color]="donationTypeColor(d.type)">
                        {{ donationTypeIcon(d.type) }}
                      </span>
                      <div class="fi-body">
                        <div class="fi-row">
                          <b>{{ t(d.donorName, d.donorNameAr) }}</b>
                          <span class="fi-amount mono">{{ d.amount | number }} EGP</span>
                        </div>
                        <div class="fi-meta">
                          <span>{{ t(d.purpose, d.purposeAr) }}</span>
                          <span class="mono">{{ d.date }}</span>
                        </div>
                      </div>
                    </li>
                  }
                </ul>
              </section>

              <section class="card">
                <header class="card-head">
                  <div>
                    <h4>⭐ {{ t('Top donors', 'كبار المتبرعين') }}</h4>
                    <small>{{ t('This year', 'هذا العام') }}</small>
                  </div>
                  <button class="pill-sm" (click)="active.set('donors')">{{ t('All', 'الكل') }}</button>
                </header>
                <ul class="top-donors">
                  @for (d of topDonors(); track d.id; let i = $index) {
                    <li class="td-row" (click)="openDonor(d.id)">
                      <span class="td-rank">{{ i + 1 }}</span>
                      <span class="td-avatar" [class]="'seg-' + d.segment">{{ initials(d.name) }}</span>
                      <div class="td-info">
                        <b>{{ t(d.name, d.nameAr) }}</b>
                        <small>{{ d.city }} · {{ d.donationCount }} {{ t('donations', 'تبرع') }}</small>
                      </div>
                      <span class="td-amount mono">{{ d.totalDonated | number }}</span>
                    </li>
                  }
                </ul>
              </section>
            </div>

            <!-- Projects + Recent activities -->
            <div class="grid-2">
              <section class="card">
                <header class="card-head">
                  <div>
                    <h4>{{ t('Active projects', 'المشاريع النشطة') }}</h4>
                    <small>{{ activeProjectsCount() }} {{ t('in progress', 'قيد التنفيذ') }}</small>
                  </div>
                  <button class="pill-sm" (click)="active.set('projects')">{{ t('All', 'الكل') }}</button>
                </header>
                <ul class="proj-list">
                  @for (p of activeProjects().slice(0, 5); track p.id) {
                    <li class="proj-row" (click)="openProject(p.id)">
                      <span class="pr-icon" [style.background]="p.color + '22'" [style.color]="p.color">{{ p.icon }}</span>
                      <div class="pr-body">
                        <div class="pr-row">
                          <b>{{ t(p.name, p.nameAr) }}</b>
                          <span class="pr-status" [attr.data-s]="p.status">{{ t(p.status, projectStatusAr(p.status)) }}</span>
                        </div>
                        <div class="pr-progress">
                          <div class="prp-bar"><div class="prp-fill" [style.width.%]="p.progress" [style.background]="p.color"></div></div>
                          <span class="mono small">{{ p.progress }}%</span>
                        </div>
                        <div class="pr-meta">
                          <span>👥 {{ p.beneficiaries }} {{ t('beneficiaries', 'مستفيد') }}</span>
                          <span>💰 {{ p.spent | number }} / {{ p.budget | number }}</span>
                        </div>
                      </div>
                    </li>
                  }
                </ul>
              </section>

              <section class="card">
                <header class="card-head">
                  <div>
                    <h4>{{ t('Recent activity', 'النشاط الأخير') }}</h4>
                    <small>{{ t('Audit log', 'سجل المراجعة') }}</small>
                  </div>
                </header>
                <ul class="activity-list">
                  @for (a of recentActivity(); track a.id) {
                    <li class="act-row">
                      <span class="act-icon" [style.background]="a.color + '22'" [style.color]="a.color">{{ a.icon }}</span>
                      <div>
                        <b>{{ t(a.action, a.actionAr) }}</b>
                        <small>{{ t(a.detail, a.detailAr) }}</small>
                      </div>
                      <span class="act-time mono">{{ a.time }}</span>
                    </li>
                  }
                </ul>
              </section>
            </div>
          </div>
        }

        <!-- ══════════════════ DONATIONS ══════════════════ -->
        @case ('donations') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Finance', 'المالية') }}</span>
                <h3>{{ t('Donations', 'التبرعات') }}</h3>
                <p>{{ filteredDonations().length }} {{ t('of', 'من') }} {{ donations().length }} {{ t('donations', 'تبرع') }} · {{ filteredDonationTotal() | number }} EGP</p>
              </div>
              <div class="view-actions">
                <select class="sel" [ngModel]="donationFilter()" (ngModelChange)="donationFilter.set($event)">
                  <option value="all">{{ t('All statuses', 'كل الحالات') }}</option>
                  <option value="pending">{{ t('Pending', 'معلقة') }}</option>
                  <option value="confirmed">{{ t('Confirmed', 'مؤكدة') }}</option>
                  <option value="receipted">{{ t('Receipted', 'مستلمة إيصال') }}</option>
                </select>
                <button class="pill primary" (click)="createDonation()">＋ {{ t('New donation', 'تبرع جديد') }}</button>
              </div>
            </header>

            <section class="donation-stats">
              @for (s of donationStats(); track s.label) {
                <div class="ds-card" [style.--c]="s.color">
                  <span class="ds-icon">{{ s.icon }}</span>
                  <b class="ds-val">{{ s.value }}</b>
                  <small>{{ s.label }}</small>
                </div>
              }
            </section>

            <div class="table-wrap">
              <header class="thead cols-8">
                <span>{{ t('Receipt', 'الإيصال') }}</span>
                <span>{{ t('Donor', 'المتبرع') }}</span>
                <span>{{ t('Type', 'النوع') }}</span>
                <span>{{ t('Amount', 'المبلغ') }}</span>
                <span>{{ t('Method', 'طريقة الدفع') }}</span>
                <span>{{ t('Purpose', 'الغرض') }}</span>
                <span>{{ t('Date', 'التاريخ') }}</span>
                <span>{{ t('Status', 'الحالة') }}</span>
              </header>
              @for (d of filteredDonations(); track d.id) {
                <div class="trow cols-8" (click)="openDonation(d.id)" (contextmenu)="onDonationContext($event, d)">
                  <span class="mono inv-num">{{ d.receiptNo }}</span>
                  <span class="cell-name">{{ t(d.donorName, d.donorNameAr) }}</span>
                  <span><span class="type-badge" [attr.data-t]="d.type">{{ t(d.type, donationTypeAr(d.type)) }}</span></span>
                  <span class="mono amount bold">{{ d.amount | number }} {{ d.currency }}</span>
                  <span class="method-tag">{{ t(d.method, methodAr(d.method)) }}</span>
                  <span class="small">{{ t(d.purpose, d.purposeAr) }}</span>
                  <span class="mono small">{{ d.date }}</span>
                  <span><span class="st" [attr.data-s]="d.status">{{ t(d.status, donationStatusAr(d.status)) }}</span></span>
                </div>
              } @empty {
                <div class="empty-mini">{{ t('No donations match this filter', 'لا توجد تبرعات مطابقة') }}</div>
              }
            </div>
          </div>
        }

        <!-- ══════════════════ DONORS ══════════════════ -->
        @case ('donors') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('CRM', 'إدارة العلاقات') }}</span>
                <h3>{{ t('Donors Database', 'قاعدة المتبرعين') }}</h3>
                <p>{{ donors().length }} {{ t('registered', 'مسجل') }} · {{ vipDonorsCount() }} VIP</p>
              </div>
              <button class="pill primary" (click)="createDonor()">＋ {{ t('Add donor', 'إضافة متبرع') }}</button>
            </header>

            <section class="segment-filters">
              @for (s of segmentFilters; track s.id) {
                <button class="seg-chip" [class.active]="donorSegmentFilter() === s.id" [attr.data-s]="s.id" (click)="donorSegmentFilter.set(s.id)">
                  <span>{{ s.icon }}</span>
                  <span>{{ t(s.label, s.labelAr) }}</span>
                  <span class="seg-count">{{ countDonorsBySegment(s.id) }}</span>
                </button>
              }
            </section>

            <div class="donors-grid">
              @for (d of filteredDonors(); track d.id) {
                <article class="donor-card" [attr.data-seg]="d.segment" (click)="openDonor(d.id)" (contextmenu)="onDonorContext($event, d)">
                  <header class="dc-head">
                    <span class="dc-avatar" [class]="'seg-' + d.segment">{{ initials(d.name) }}</span>
                    <div>
                      <b>{{ t(d.name, d.nameAr) }}</b>
                      <small class="mono">{{ d.id }} · {{ d.type }}</small>
                    </div>
                    <span class="dc-seg" [attr.data-s]="d.segment">{{ d.segment }}</span>
                  </header>
                  <div class="dc-contact">
                    <span>📞 {{ d.phone }}</span>
                    <span>✉ {{ d.email }}</span>
                    <span>📍 {{ t(d.city, d.cityAr) }}</span>
                  </div>
                  <div class="dc-stats">
                    <div><small>{{ t('Total given', 'إجمالي العطاء') }}</small><b class="mono">{{ d.totalDonated | number }}</b></div>
                    <div><small>{{ t('Donations', 'عدد التبرعات') }}</small><b class="mono">{{ d.donationCount }}</b></div>
                    <div><small>{{ t('Last gift', 'آخر تبرع') }}</small><b class="mono small">{{ d.lastDonation }}</b></div>
                  </div>
                  @if (d.monthlyCommitment) {
                    <div class="dc-commit">
                      <span>🔁 {{ t('Monthly commitment', 'التزام شهري') }}</span>
                      <b class="mono">{{ d.monthlyCommitment | number }} EGP</b>
                    </div>
                  }
                </article>
              }
            </div>
          </div>
        }

        <!-- ══════════════════ BENEFICIARIES ══════════════════ -->
        @case ('beneficiaries') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Registry', 'السجل') }}</span>
                <h3>{{ t('Beneficiaries', 'المستفيدون') }}</h3>
                <p>{{ beneficiaries().length }} {{ t('families registered', 'أسرة مسجلة') }} · {{ totalBeneficiariesMembers() | number }} {{ t('individuals', 'فرد') }}</p>
              </div>
              <button class="pill primary" (click)="createBeneficiary()">＋ {{ t('Register family', 'تسجيل أسرة') }}</button>
            </header>

            <section class="category-filters">
              @for (c of categoryFilters; track c.id) {
                <button class="cat-chip" [class.active]="beneficiaryCategoryFilter() === c.id" (click)="beneficiaryCategoryFilter.set(c.id)">
                  <span>{{ c.icon }}</span>
                  <span>{{ t(c.label, c.labelAr) }}</span>
                  <span class="cat-count">{{ countBeneficiariesByCategory(c.id) }}</span>
                </button>
              }
            </section>

            <div class="beneficiaries-grid">
              @for (b of filteredBeneficiaries(); track b.id) {
                <article class="beneficiary-card" [attr.data-cat]="b.category" (click)="openBeneficiary(b.id)">
                  <header class="bc-head">
                    <span class="bc-icon">{{ categoryIcon(b.category) }}</span>
                    <div>
                      <b>{{ t(b.name, b.nameAr) }}</b>
                      <small class="mono">{{ b.id }} · {{ t(b.category, categoryAr(b.category)) }}</small>
                    </div>
                    <span class="st" [attr.data-s]="b.status">{{ t(b.status, beneficiaryStatusAr(b.status)) }}</span>
                  </header>
                  <div class="bc-body">
                    <div class="bc-row"><span>👨‍👩‍👧 {{ t('Family', 'الأسرة') }}</span><b>{{ b.familySize }} {{ t('members', 'أفراد') }}</b></div>
                    <div class="bc-row"><span>📍 {{ t('Location', 'الموقع') }}</span><b>{{ t(b.city, b.cityAr) }} · {{ b.district }}</b></div>
                    <div class="bc-row"><span>💰 {{ t('Monthly income', 'الدخل الشهري') }}</span><b class="mono">{{ b.monthlyIncome | number }} EGP</b></div>
                    <div class="bc-row"><span>🎁 {{ t('Monthly aid', 'المساعدة الشهرية') }}</span><b class="mono pos">{{ b.monthlyAid | number }} EGP</b></div>
                  </div>
                  <footer class="bc-foot">
                    <span class="mono small">📅 {{ b.registeredAt }}</span>
                    <span class="mono small">🎯 {{ b.totalAidReceived | number }} {{ t('total', 'إجمالي') }}</span>
                  </footer>
                </article>
              }
            </div>
          </div>
        }

        <!-- ══════════════════ PROJECTS ══════════════════ -->
        @case ('projects') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Initiatives', 'المبادرات') }}</span>
                <h3>{{ t('Charity Projects', 'المشاريع الخيرية') }}</h3>
                <p>{{ projects().length }} {{ t('projects', 'مشروع') }} · {{ activeProjectsCount() }} {{ t('active', 'نشط') }}</p>
              </div>
              <button class="pill primary" (click)="createProject()">＋ {{ t('New project', 'مشروع جديد') }}</button>
            </header>

            <div class="projects-grid">
              @for (p of projects(); track p.id) {
                <article class="project-card" [style.--c]="p.color" (click)="openProject(p.id)">
                  <header class="pc-head">
                    <span class="pc-icon" [style.background]="p.color + '22'" [style.color]="p.color">{{ p.icon }}</span>
                    <div>
                      <b>{{ t(p.name, p.nameAr) }}</b>
                      <small>{{ t(p.category, projectCategoryAr(p.category)) }}</small>
                    </div>
                    <span class="pc-status" [attr.data-s]="p.status">{{ t(p.status, projectStatusAr(p.status)) }}</span>
                  </header>
                  <p class="pc-desc">{{ t(p.description, p.descriptionAr) }}</p>
                  <div class="pc-progress">
                    <div class="pcp-head">
                      <span>{{ t('Progress', 'التقدم') }}</span>
                      <b class="mono">{{ p.progress }}%</b>
                    </div>
                    <div class="pcp-track">
                      <div class="pcp-fill" [style.width.%]="p.progress" [style.background]="p.color"></div>
                    </div>
                  </div>
                  <div class="pc-budget">
                    <div><small>{{ t('Budget', 'الميزانية') }}</small><b class="mono">{{ p.budget | number }}</b></div>
                    <div><small>{{ t('Spent', 'المنفق') }}</small><b class="mono neg">{{ p.spent | number }}</b></div>
                    <div><small>{{ t('Remaining', 'المتبقي') }}</small><b class="mono pos">{{ (p.budget - p.spent) | number }}</b></div>
                  </div>
                  <footer class="pc-foot">
                    <span>👥 {{ p.beneficiaries }} {{ t('beneficiaries', 'مستفيد') }}</span>
                    <span>💝 {{ p.donors }} {{ t('donors', 'متبرع') }}</span>
                    <span class="mono small">{{ p.startDate }} → {{ p.endDate }}</span>
                  </footer>
                </article>
              }
            </div>
          </div>
        }

        <!-- ══════════════════ CAMPAIGNS ══════════════════ -->
        @case ('campaigns') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Fundraising', 'جمع التبرعات') }}</span>
                <h3>{{ t('Active Campaigns', 'الحملات النشطة') }}</h3>
                <p>{{ campaigns().length }} {{ t('campaigns', 'حملة') }} · {{ activeCampaignsCount() }} {{ t('active', 'نشطة') }}</p>
              </div>
              <button class="pill primary" (click)="createCampaign()">＋ {{ t('New campaign', 'حملة جديدة') }}</button>
            </header>

            <div class="campaigns-grid">
              @for (c of campaigns(); track c.id) {
                <article class="campaign-card" [attr.data-s]="c.status" (click)="openCampaign(c.id)">
                  <header class="cc-head">
                    <span class="cc-icon">{{ c.icon }}</span>
                    <div>
                      <b>{{ t(c.name, c.nameAr) }}</b>
                      <small>{{ t(c.category, c.categoryAr) }}</small>
                    </div>
                    @if (c.featured) {
                      <span class="cc-feat">⭐</span>
                    }
                  </header>
                  <div class="cc-progress">
                    <div class="ccp-bar">
                      <div class="ccp-fill" [style.width.%]="Math.min((c.raised / c.target) * 100, 100)"></div>
                    </div>
                    <div class="ccp-meta">
                      <span class="mono">{{ c.raised | number }} / {{ c.target | number }} EGP</span>
                      <span class="ccp-pct">{{ Math.round((c.raised / c.target) * 100) }}%</span>
                    </div>
                  </div>
                  <div class="cc-stats">
                    <div><small>{{ t('Donors', 'المتبرعون') }}</small><b class="mono">{{ c.donorsCount }}</b></div>
                    <div><small>{{ t('Days left', 'أيام متبقية') }}</small><b class="mono">{{ c.daysLeft }}</b></div>
                    <div><small>{{ t('Status', 'الحالة') }}</small><span class="st small" [attr.data-s]="c.status">{{ t(c.status, campaignStatusAr(c.status)) }}</span></div>
                  </div>
                  <footer class="cc-foot">
                    <span class="mono small">{{ c.startDate }} → {{ c.endDate }}</span>
                  </footer>
                </article>
              }
            </div>
          </div>
        }

        <!-- ══════════════════ KAFFALA ══════════════════ -->
        @case ('kaffala') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Sponsorship', 'الكفالات') }}</span>
                <h3>{{ t('Kaffala Program', 'برنامج الكفالة') }}</h3>
                <p>{{ kaffalas().length }} {{ t('active sponsorships', 'كفالة نشطة') }} · {{ totalKaffalaMonthly() | number }} EGP/{{ t('month', 'شهر') }}</p>
              </div>
              <button class="pill primary" (click)="createKaffala()">＋ {{ t('New Kaffala', 'كفالة جديدة') }}</button>
            </header>

            <section class="kaffala-stats">
              @for (s of kaffalaStats(); track s.label) {
                <div class="ks-card" [style.--c]="s.color">
                  <span class="ks-icon">{{ s.icon }}</span>
                  <b class="ks-val">{{ s.value }}</b>
                  <small>{{ s.label }}</small>
                </div>
              }
            </section>

            <div class="table-wrap">
              <header class="thead cols-8">
                <span>{{ t('ID', 'المعرف') }}</span>
                <span>{{ t('Beneficiary', 'المكفول') }}</span>
                <span>{{ t('Sponsor', 'الكافل') }}</span>
                <span>{{ t('Type', 'النوع') }}</span>
                <span>{{ t('Monthly', 'الشهري') }}</span>
                <span>{{ t('Progress', 'التقدم') }}</span>
                <span>{{ t('Total paid', 'إجمالي المدفوع') }}</span>
                <span>{{ t('Status', 'الحالة') }}</span>
              </header>
              @for (k of kaffalas(); track k.id) {
                <div class="trow cols-8" (click)="openKaffala(k.id)">
                  <span class="mono inv-num">{{ k.id }}</span>
                  <span class="cell-name">{{ t(k.beneficiaryName, k.beneficiaryNameAr) }}</span>
                  <span>{{ t(k.sponsorName, k.sponsorNameAr) }}</span>
                  <span><span class="type-badge" [attr.data-t]="k.type">{{ t(k.type, kaffalaTypeAr(k.type)) }}</span></span>
                  <span class="mono amount">{{ k.monthlyAmount | number }}</span>
                  <span class="progress-cell">
                    <div class="prog-bar"><div class="prog-fill" [style.width.%]="(k.paidMonths / (k.paidMonths + k.remainingMonths)) * 100"></div></div>
                    <span class="mono small">{{ k.paidMonths }}/{{ k.paidMonths + k.remainingMonths }}</span>
                  </span>
                  <span class="mono amount bold">{{ k.totalPaid | number }}</span>
                  <span><span class="st" [attr.data-s]="k.status">{{ t(k.status, kaffalaStatusAr(k.status)) }}</span></span>
                </div>
              }
            </div>
          </div>
        }

        <!-- ══════════════════ VOLUNTEERS ══════════════════ -->
        @case ('volunteers') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Team', 'الفريق') }}</span>
                <h3>{{ t('Volunteers', 'المتطوعون') }}</h3>
                <p>{{ volunteers().length }} {{ t('registered', 'مسجل') }} · {{ activeVolunteersCount() }} {{ t('active', 'نشط') }}</p>
              </div>
              <button class="pill primary" (click)="createVolunteer()">＋ {{ t('Add volunteer', 'إضافة متطوع') }}</button>
            </header>

            <section class="volunteer-stats">
              @for (s of volunteerStats(); track s.label) {
                <div class="vs-card" [style.--c]="s.color">
                  <span class="vs-icon">{{ s.icon }}</span>
                  <b class="vs-val">{{ s.value }}</b>
                  <small>{{ s.label }}</small>
                </div>
              }
            </section>

            <div class="volunteers-grid">
              @for (v of volunteers(); track v.id) {
                <article class="volunteer-card" [attr.data-s]="v.status" (click)="openVolunteer(v.id)">
                  <header class="vc-head">
                    <span class="vc-avatar">{{ initials(v.name) }}</span>
                    <div>
                      <b>{{ t(v.name, v.nameAr) }}</b>
                      <small>{{ t(v.role, v.roleAr) }}</small>
                    </div>
                    <span class="st small" [attr.data-s]="v.status">{{ t(v.status, volunteerStatusAr(v.status)) }}</span>
                  </header>
                  <div class="vc-contact">
                    <span>📞 {{ v.phone }}</span>
                    <span>✉ {{ v.email }}</span>
                    <span>📍 {{ v.city }}</span>
                  </div>
                  <div class="vc-stats">
                    <div><small>{{ t('Hours', 'الساعات') }}</small><b class="mono">{{ v.hours }}</b></div>
                    <div><small>{{ t('Tasks', 'المهام') }}</small><b class="mono">{{ v.tasksCompleted }}</b></div>
                    <div><small>{{ t('Rating', 'التقييم') }}</small><b class="mono">⭐ {{ v.rating }}</b></div>
                  </div>
                </article>
              }
            </div>
          </div>
        }

        <!-- ══════════════════ EXPENSES ══════════════════ -->
        @case ('expenses') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Finance', 'المالية') }}</span>
                <h3>{{ t('Expenses', 'المصروفات') }}</h3>
                <p>{{ expenses().length }} {{ t('records', 'سجل') }} · {{ totalExpenses() | number }} EGP</p>
              </div>
              <button class="pill primary" (click)="createExpense()">＋ {{ t('New expense', 'مصروف جديد') }}</button>
            </header>

            <section class="expense-stats">
              @for (s of expenseStats(); track s.label) {
                <div class="es-card" [style.--c]="s.color">
                  <span class="es-icon">{{ s.icon }}</span>
                  <b class="es-val">{{ s.value }}</b>
                  <small>{{ s.label }}</small>
                </div>
              }
            </section>

            <div class="table-wrap">
              <header class="thead cols-6">
                <span>{{ t('ID', 'المعرف') }}</span>
                <span>{{ t('Category', 'الفئة') }}</span>
                <span>{{ t('Description', 'الوصف') }}</span>
                <span>{{ t('Amount', 'المبلغ') }}</span>
                <span>{{ t('Approved by', 'الموافقة') }}</span>
                <span>{{ t('Status', 'الحالة') }}</span>
              </header>
              @for (e of expenses(); track e.id) {
                <div class="trow cols-6" (click)="openExpense(e.id)">
                  <span class="mono inv-num">{{ e.id }}</span>
                  <span class="method-tag">{{ t(e.category, e.categoryAr) }}</span>
                  <span class="small">{{ t(e.description, e.descriptionAr) }}</span>
                  <span class="mono amount bold">{{ e.amount | number }} EGP</span>
                  <span class="small">{{ e.approvedBy }}</span>
                  <span><span class="st" [attr.data-s]="e.status">{{ t(e.status, expenseStatusAr(e.status)) }}</span></span>
                </div>
              }
            </div>
          </div>
        }

        <!-- ══════════════════ DISTRIBUTION ══════════════════ -->
        @case ('distribution') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Operations', 'العمليات') }}</span>
                <h3>{{ t('Aid Distribution', 'توزيع المساعدات') }}</h3>
                <p>{{ distributions().length }} {{ t('records', 'سجل توزيع') }} · {{ totalDistributed() | number }} EGP</p>
              </div>
              <button class="pill primary" (click)="createDistribution()">＋ {{ t('New distribution', 'توزيع جديد') }}</button>
            </header>

            <section class="distribution-stats">
              @for (s of distributionStats(); track s.label) {
                <div class="dts-card" [style.--c]="s.color">
                  <span class="dts-icon">{{ s.icon }}</span>
                  <b class="dts-val">{{ s.value }}</b>
                  <small>{{ s.label }}</small>
                </div>
              }
            </section>

            <div class="table-wrap">
              <header class="thead cols-7">
                <span>{{ t('ID', 'المعرف') }}</span>
                <span>{{ t('Beneficiary', 'المستفيد') }}</span>
                <span>{{ t('Aid type', 'نوع المساعدة') }}</span>
                <span>{{ t('Amount', 'المبلغ') }}</span>
                <span>{{ t('Location', 'الموقع') }}</span>
                <span>{{ t('Distributed by', 'الموزع') }}</span>
                <span>{{ t('Signed', 'التوقيع') }}</span>
              </header>
              @for (d of distributions(); track d.id) {
                <div class="trow cols-7" (click)="openDistribution(d.id)">
                  <span class="mono inv-num">{{ d.id }}</span>
                  <span class="cell-name">{{ t(d.beneficiaryName, d.beneficiaryNameAr) }}</span>
                  <span class="method-tag">{{ t(d.aidType, d.aidTypeAr) }}</span>
                  <span class="mono amount bold">{{ d.amount | number }} EGP</span>
                  <span class="small">📍 {{ t(d.location, d.locationAr) }}</span>
                  <span class="small">{{ d.distributedBy }}</span>
                  <span class="sign-check" [class.signed]="d.signature">{{ d.signature ? '✓' : '✕' }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- ══════════════════ REPORTS ══════════════════ -->
        @case ('reports') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Analytics', 'التحليلات') }}</span>
                <h3>{{ t('Reports & Analytics', 'التقارير والتحليلات') }}</h3>
                <p>{{ t('Comprehensive charity performance', 'أداء الجمعية الشامل') }}</p>
              </div>
              <button class="pill" (click)="exportReport()">📊 {{ t('Export PDF', 'تصدير PDF') }}</button>
            </header>

            <section class="report-kpis">
              @for (k of reportKpis(); track k.label) {
                <div class="rk-card" [style.--c]="k.color">
                  <span class="rk-icon">{{ k.icon }}</span>
                  <b class="rk-val">{{ k.value }}</b>
                  <small>{{ k.label }}</small>
                </div>
              }
            </section>

            <div class="grid-2">
              <section class="card">
                <header class="card-head"><h4>{{ t('Donation flow', 'تدفق التبرعات') }}</h4></header>
                <div class="flow-chart">
                  @for (m of monthlyDonations(); track m.month) {
                    <div class="fc-col">
                      <div class="fc-in" [style.height.%]="m.totalPct" [title]="'In: ' + m.total"></div>
                      <div class="fc-out" [style.height.%]="m.expensePct" [title]="'Out: ' + m.expense"></div>
                      <span class="fc-label">{{ m.month }}</span>
                    </div>
                  }
                </div>
                <div class="chart-legend-row">
                  <span><i class="dot" style="background:#34c759"></i> {{ t('Donations', 'تبرعات') }}</span>
                  <span><i class="dot" style="background:#ff3b30"></i> {{ t('Expenses', 'مصروفات') }}</span>
                </div>
              </section>

              <section class="card">
                <header class="card-head"><h4>{{ t('Distribution by category', 'التوزيع حسب الفئة') }}</h4></header>
                <ul class="dist-breakdown">
                  @for (c of distributionBreakdown(); track c.label) {
                    <li class="db-row">
                      <span class="db-icon">{{ c.icon }}</span>
                      <span class="db-label">{{ t(c.label, c.labelAr) }}</span>
                      <div class="db-track"><div class="db-fill" [style.width.%]="c.pct" [style.background]="c.color"></div></div>
                      <span class="db-count mono">{{ c.count }}</span>
                    </li>
                  }
                </ul>
              </section>
            </div>

            <section class="card">
              <header class="card-head"><h4>{{ t('Project performance', 'أداء المشاريع') }}</h4></header>
              <div class="project-perf">
                @for (p of projects(); track p.id) {
                  <div class="pp-row">
                    <span class="pp-icon" [style.background]="p.color + '22'" [style.color]="p.color">{{ p.icon }}</span>
                    <span class="pp-name">{{ t(p.name, p.nameAr) }}</span>
                    <div class="pp-track"><div class="pp-fill" [style.width.%]="p.progress" [style.background]="p.color"></div></div>
                    <span class="pp-progress mono">{{ p.progress }}%</span>
                    <span class="pp-spent mono small">{{ p.spent | number }} / {{ p.budget | number }}</span>
                  </div>
                }
              </div>
            </section>
          </div>
        }

        <!-- ══════════════════ SETTINGS ══════════════════ -->
        @case ('settings') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Configuration', 'الإعدادات') }}</span>
                <h3>{{ t('Association Settings', 'إعدادات الجمعية') }}</h3>
                <p>{{ t('Organization details & preferences', 'بيانات الجمعية والتفضيلات') }}</p>
              </div>
              <button class="pill primary" (click)="saveSettings()">💾 {{ t('Save', 'حفظ') }}</button>
            </header>

            <section class="card">
              <header class="card-head"><h4>{{ t('Organization', 'الجمعية') }}</h4></header>
              <div class="settings-list">
                @for (s of orgSettings; track s.key) {
                  <div class="setting-row">
                    <div>
                      <b>{{ t(s.label, s.labelAr) }}</b>
                      <small>{{ t(s.desc, s.descAr) }}</small>
                    </div>
                    <input class="input-sm" [value]="settingValue(s.key)" (input)="updateSetting(s.key, $any($event.target).value)" />
                  </div>
                }
              </div>
            </section>

            <section class="card">
              <header class="card-head"><h4>{{ t('Financial', 'المالية') }}</h4></header>
              <div class="settings-list">
                @for (s of finSettings; track s.key) {
                  <div class="setting-row">
                    <div>
                      <b>{{ t(s.label, s.labelAr) }}</b>
                      <small>{{ t(s.desc, s.descAr) }}</small>
                    </div>
                    @if (s.type === 'toggle') {
                      <button class="toggle" [class.on]="settingValue(s.key)" (click)="toggleSetting(s.key)">
                        <span class="knob"></span>
                      </button>
                    } @else if (s.type === 'number') {
                      <input type="number" class="input-sm" [value]="settingValue(s.key)" (input)="updateSetting(s.key, +$any($event.target).value)" />
                    } @else {
                      <input class="input-sm" [value]="settingValue(s.key)" (input)="updateSetting(s.key, $any($event.target).value)" />
                    }
                  </div>
                }
              </div>
            </section>

            <section class="card danger-zone">
              <header class="card-head">
                <h4>⚠️ {{ t('Period management', 'إدارة الفترات') }}</h4>
                <small>{{ t('Close or lock accounting periods', 'إقفال أو قفل الفترات المحاسبية') }}</small>
              </header>
              <div class="dz-actions">
                <button class="pill danger" (click)="closePeriod()">
                  {{ periodClosed() ? t('Reopen period', 'إعادة فتح الفترة') : t('Close period', 'إقفال الفترة') }}
                </button>
                <button class="pill danger" (click)="backupData()">{{ t('Backup data', 'نسخ احتياطي') }}</button>
              </div>
            </section>
          </div>
        }
      }

      <!-- ══════════════════ MODAL: Donation Detail ══════════════════ -->
      @if (selectedDonation(); as d) {
        <div class="modal-backdrop" (click)="selectedDonation.set(null)">
          <div class="modal donation-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon" [style.background]="donationTypeColor(d.type) + '22'" [style.color]="donationTypeColor(d.type)">
                {{ donationTypeIcon(d.type) }}
              </span>
              <div>
                <h3>{{ d.receiptNo }}</h3>
                <p>{{ t(d.donorName, d.donorNameAr) }}</p>
              </div>
              <span class="st" [attr.data-s]="d.status">{{ t(d.status, donationStatusAr(d.status)) }}</span>
              <button class="modal-close" (click)="selectedDonation.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="receipt-card">
                <div class="rc-header">
                  <span class="rc-logo">🕌</span>
                  <div>
                    <b>{{ t('Al-Birr Wal-Taqwa Association', 'جمعية البر والتقوى الخيرية') }}</b>
                    <small>{{ t('Official Donation Receipt', 'إيصال تبرع رسمي') }}</small>
                  </div>
                </div>
                <div class="rc-amount">
                  <small>{{ t('Amount received', 'المبلغ المستلم') }}</small>
                  <b>{{ d.amount | number }} {{ d.currency }}</b>
                  <span class="rc-type">{{ t(d.type, donationTypeAr(d.type)) }}</span>
                </div>
                <div class="rc-grid">
                  <div><small>{{ t('Donor', 'المتبرع') }}</small><b>{{ t(d.donorName, d.donorNameAr) }}</b></div>
                  <div><small>{{ t('Date', 'التاريخ') }}</small><b class="mono">{{ d.date }}</b></div>
                  <div><small>{{ t('Method', 'طريقة الدفع') }}</small><b>{{ t(d.method, methodAr(d.method)) }}</b></div>
                  <div><small>{{ t('Purpose', 'الغرض') }}</small><b>{{ t(d.purpose, d.purposeAr) }}</b></div>
                </div>
                @if (d.notes) {
                  <div class="rc-notes">
                    <small>{{ t('Notes', 'ملاحظات') }}</small>
                    <p>{{ d.notes }}</p>
                  </div>
                }
              </div>
            </div>
            <footer class="modal-foot">
              <button class="mf-btn" (click)="printDonation(d)">🖨 {{ t('Print receipt', 'طباعة إيصال') }}</button>
              <button class="mf-btn primary" (click)="confirmDonation(d.id)">✓ {{ t('Confirm', 'تأكيد') }}</button>
            </footer>
          </div>
        </div>
      }

      <!-- ══════════════════ MODAL: Donor Detail ══════════════════ -->
      @if (selectedDonor(); as d) {
        <div class="modal-backdrop" (click)="selectedDonor.set(null)">
          <div class="modal donor-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon" [class]="'seg-' + d.segment">{{ initials(d.name) }}</span>
              <div>
                <h3>{{ t(d.name, d.nameAr) }}</h3>
                <p class="mono">{{ d.id }} · {{ d.segment.toUpperCase() }} {{ t('donor', 'متبرع') }}</p>
              </div>
              <button class="modal-close" (click)="selectedDonor.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="donor-hero">
                <div><small>{{ t('Total donated', 'إجمالي التبرعات') }}</small><b class="mono">{{ d.totalDonated | number }} EGP</b></div>
                <div><small>{{ t('Donations', 'عدد التبرعات') }}</small><b class="mono">{{ d.donationCount }}</b></div>
                <div><small>{{ t('Joined', 'تاريخ الانضمام') }}</small><b class="mono">{{ d.joinedAt }}</b></div>
              </div>
              <div class="om-grid">
                <div class="om-section"><span class="om-label">{{ t('Type', 'النوع') }}</span><b>{{ d.type }}</b></div>
                <div class="om-section"><span class="om-label">{{ t('Phone', 'الهاتف') }}</span><b class="mono">{{ d.phone }}</b></div>
                <div class="om-section"><span class="om-label">{{ t('Email', 'البريد') }}</span><b class="mono small">{{ d.email }}</b></div>
                <div class="om-section"><span class="om-label">{{ t('City', 'المدينة') }}</span><b>{{ t(d.city, d.cityAr) }}</b></div>
                @if (d.taxId) {
                  <div class="om-section"><span class="om-label">{{ t('Tax ID', 'الرقم الضريبي') }}</span><b class="mono">{{ d.taxId }}</b></div>
                }
                @if (d.monthlyCommitment) {
                  <div class="om-section"><span class="om-label">{{ t('Monthly commitment', 'الالتزام الشهري') }}</span><b class="mono pos">{{ d.monthlyCommitment | number }} EGP</b></div>
                }
              </div>

              <div class="om-block">
                <span class="om-label">{{ t('Recent donations', 'أحدث التبرعات') }}</span>
                @for (dd of donationsOfDonor(d.id).slice(0, 5); track dd.id) {
                  <div class="mini-donation" (click)="openDonation(dd.id)">
                    <span class="md-icon" [style.color]="donationTypeColor(dd.type)">{{ donationTypeIcon(dd.type) }}</span>
                    <span class="md-purpose">{{ t(dd.purpose, dd.purposeAr) }}</span>
                    <span class="md-amount mono">{{ dd.amount | number }} EGP</span>
                    <span class="md-date mono small">{{ dd.date }}</span>
                  </div>
                }
              </div>
            </div>
            <footer class="modal-foot">
              <button class="mf-btn" (click)="sendThankYou(d)">✉ {{ t('Thank you letter', 'رسالة شكر') }}</button>
              <button class="mf-btn primary" (click)="createDonationFor(d.id)">＋ {{ t('New donation', 'تبرع جديد') }}</button>
            </footer>
          </div>
        </div>
      }

      <!-- ══════════════════ MODAL: Beneficiary Detail ══════════════════ -->
      @if (selectedBeneficiary(); as b) {
        <div class="modal-backdrop" (click)="selectedBeneficiary.set(null)">
          <div class="modal bene-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon">{{ categoryIcon(b.category) }}</span>
              <div>
                <h3>{{ t(b.name, b.nameAr) }}</h3>
                <p class="mono">{{ b.id }} · {{ t(b.category, categoryAr(b.category)) }}</p>
              </div>
              <span class="st" [attr.data-s]="b.status">{{ t(b.status, beneficiaryStatusAr(b.status)) }}</span>
              <button class="modal-close" (click)="selectedBeneficiary.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="bene-hero">
                <div><small>{{ t('Family size', 'حجم الأسرة') }}</small><b>{{ b.familySize }}</b></div>
                <div><small>{{ t('Monthly aid', 'المساعدة الشهرية') }}</small><b class="mono pos">{{ b.monthlyAid | number }}</b></div>
                <div><small>{{ t('Total received', 'إجمالي المستلم') }}</small><b class="mono">{{ b.totalAidReceived | number }}</b></div>
              </div>
              <div class="om-grid">
                <div class="om-section"><span class="om-label">{{ t('National ID', 'الرقم القومي') }}</span><b class="mono">{{ b.nationalId }}</b></div>
                <div class="om-section"><span class="om-label">{{ t('Phone', 'الهاتف') }}</span><b class="mono">{{ b.phone }}</b></div>
                <div class="om-section"><span class="om-label">{{ t('City', 'المدينة') }}</span><b>{{ t(b.city, b.cityAr) }}</b></div>
                <div class="om-section"><span class="om-label">{{ t('District', 'الحي') }}</span><b>{{ b.district }}</b></div>
                <div class="om-section"><span class="om-label">{{ t('Monthly income', 'الدخل الشهري') }}</span><b class="mono">{{ b.monthlyIncome | number }} EGP</b></div>
                <div class="om-section"><span class="om-label">{{ t('Registered', 'تاريخ التسجيل') }}</span><b class="mono">{{ b.registeredAt }}</b></div>
                <div class="om-section"><span class="om-label">{{ t('Last aid', 'آخر مساعدة') }}</span><b class="mono">{{ b.lastAidAt }}</b></div>
                <div class="om-section"><span class="om-label">{{ t('Documents', 'المستندات') }}</span><b>{{ b.documents }} {{ t('files', 'ملفات') }}</b></div>
              </div>
            </div>
            <footer class="modal-foot">
              <button class="mf-btn" (click)="scheduleDistribution(b.id)">📦 {{ t('Schedule distribution', 'جدولة توزيع') }}</button>
              <button class="mf-btn primary" (click)="active.set('distribution'); selectedBeneficiary.set(null)">🎁 {{ t('Distribute now', 'توزيع فوري') }}</button>
            </footer>
          </div>
        </div>
      }

      <!-- ══════════════════ MODAL: Project Detail ══════════════════ -->
      @if (selectedProject(); as p) {
        <div class="modal-backdrop" (click)="selectedProject.set(null)">
          <div class="modal project-modal" (click)="$event.stopPropagation()">
            <header class="modal-head" [style.borderBottomColor]="p.color">
              <span class="modal-icon" [style.background]="p.color + '22'" [style.color]="p.color">{{ p.icon }}</span>
              <div>
                <h3>{{ t(p.name, p.nameAr) }}</h3>
                <p>{{ t(p.category, projectCategoryAr(p.category)) }} · {{ t(p.location, p.locationAr) }}</p>
              </div>
              <span class="st" [attr.data-s]="p.status">{{ t(p.status, projectStatusAr(p.status)) }}</span>
              <button class="modal-close" (click)="selectedProject.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="proj-progress-bar">
                <div class="ppb-head">
                  <span>{{ t('Progress', 'التقدم') }}</span>
                  <b class="mono">{{ p.progress }}%</b>
                </div>
                <div class="ppb-track"><div class="ppb-fill" [style.width.%]="p.progress" [style.background]="p.color"></div></div>
              </div>
              <div class="proj-budget-grid">
                <div class="pbg-card"><small>{{ t('Budget', 'الميزانية') }}</small><b class="mono">{{ p.budget | number }} EGP</b></div>
                <div class="pbg-card spent"><small>{{ t('Spent', 'المنفق') }}</small><b class="mono">{{ p.spent | number }} EGP</b></div>
                <div class="pbg-card remain"><small>{{ t('Remaining', 'المتبقي') }}</small><b class="mono">{{ (p.budget - p.spent) | number }} EGP</b></div>
              </div>
              <div class="om-grid">
                <div class="om-section"><span class="om-label">{{ t('Manager', 'المدير') }}</span><b>{{ t(p.manager, p.managerAr) }}</b></div>
                <div class="om-section"><span class="om-label">{{ t('Beneficiaries', 'المستفيدون') }}</span><b>{{ p.beneficiaries }} {{ t('families', 'أسرة') }}</b></div>
                <div class="om-section"><span class="om-label">{{ t('Donors', 'المتبرعون') }}</span><b>{{ p.donors }}</b></div>
                <div class="om-section"><span class="om-label">{{ t('Duration', 'المدة') }}</span><b class="mono">{{ p.startDate }} → {{ p.endDate }}</b></div>
              </div>
              <div class="om-block">
                <span class="om-label">{{ t('Description', 'الوصف') }}</span>
                <p>{{ t(p.description, p.descriptionAr) }}</p>
              </div>
            </div>
            <footer class="modal-foot">
              <button class="mf-btn" (click)="printProject(p)">🖨 {{ t('Print report', 'طباعة تقرير') }}</button>
              <button class="mf-btn primary" (click)="active.set('donations'); selectedProject.set(null)">💝 {{ t('Donate', 'تبرع') }}</button>
            </footer>
          </div>
        </div>
      }
    </app-preview-shell>
  `,
  styles: [`
    /* ═══════════════════════════════════════════════════════════
       BWT CHARITY PLATFORM — Comprehensive Styles
       ═══════════════════════════════════════════════════════════ */
    :host { display: block; height: 100%; }
    .view { max-width: 1440px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .small { font-size: 10px; }
    .muted { color: var(--label-2); }
    .pos { color: #34c759; }
    .neg { color: #ff3b30; }
    .bold { font-weight: 800; }

    /* TOP BAR */
    .bwt-bar {
      display: flex; align-items: center; gap: 16px; padding: 12px 16px;
      background: linear-gradient(135deg, rgba(52, 199, 89, 0.06) 0%, rgba(0, 122, 255, 0.04) 100%);
      border: 0.5px solid var(--separator); border-radius: var(--r-md); flex-wrap: wrap;
    }
    .lang-switch { display: flex; gap: 2px; padding: 3px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .ls-btn {
      padding: 5px 12px; border-radius: calc(var(--r-sm) - 4px); font-size: 11px; font-weight: 700;
      color: var(--label-2); background: transparent; border: 0; cursor: pointer;
    }
    .ls-btn.active { background: var(--bg-surface-solid); color: var(--label); box-shadow: var(--shadow-xs); }
    .fy-pill, .currency-pill, .status-pill {
      display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px;
      background: var(--bg-fill-2); border-radius: var(--r-pill); font-size: 11px;
    }
    .fy-pill b { font-weight: 800; color: var(--accent); }
    .fy-label { color: var(--label-2); font-weight: 600; }
    .currency-pill span { font-family: var(--sf-mono); font-weight: 800; color: var(--accent); }
    .status-pill { font-weight: 700; color: #34c759; }
    .status-pill.closed { color: #ff3b30; }
    .status-pill .status-dot { width: 8px; height: 8px; background: currentColor; border-radius: 50%; opacity: 0.6; }
    .quick-stats { margin-left: auto; display: flex; gap: 8px; font-size: 11px; color: var(--label-2); }
    .qs-item b { color: var(--accent); font-weight: 800; font-family: var(--sf-mono); }
    .qs-sep { color: var(--label-4); }

    /* VIEW HEAD */
    .view-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
    .view-head h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .view-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }
    .eyebrow {
      display: block; font-size: var(--fs-2xs); font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; color: var(--accent); margin-bottom: 6px;
    }
    .view-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

    .pill {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px;
      background: var(--bg-fill-2); color: var(--label); border-radius: var(--r-pill);
      font-size: var(--fs-xs); font-weight: 600; border: 0; cursor: pointer; transition: all 140ms;
    }
    .pill:hover { background: var(--bg-fill-3); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }
    .pill.danger { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .pill-sm {
      padding: 6px 12px; background: var(--bg-fill-2); color: var(--label);
      border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 600; border: 0; cursor: pointer;
    }
    .pill-sm:hover { background: var(--bg-fill-3); }
    .sel {
      padding: 7px 12px; background: var(--bg-input); color: var(--label);
      border: 0.5px solid var(--separator); border-radius: var(--r-sm);
      font-size: var(--fs-xs); cursor: pointer; outline: none; font-family: inherit;
    }
    .input-sm {
      padding: 6px 10px; background: var(--bg-input); color: var(--label);
      border: 0.5px solid var(--separator); border-radius: var(--r-xs);
      font-size: var(--fs-xs); outline: none; font-family: inherit; min-width: 140px;
    }

    /* IMPACT BAR */
    .impact-bar {
      display: grid; grid-template-columns: 1fr 40px 1fr 40px 1fr 40px 1fr 40px; gap: 12px;
      padding: 20px; background: linear-gradient(135deg, rgba(52, 199, 89, 0.08) 0%, rgba(0, 122, 255, 0.05) 100%);
      border: 0.5px solid var(--separator); border-radius: var(--r-md); align-items: center;
    }
    @media (max-width: 900px) { .impact-bar { grid-template-columns: 1fr 1fr; } }
    .impact-item { display: flex; align-items: center; gap: 12px; }
    .ii-icon { font-size: 28px; }
    .ii-label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 800; color: var(--label-2); }
    .ii-val { font-size: var(--fs-lg); font-weight: 800; font-family: var(--sf-mono); color: var(--accent); }
    .impact-op { font-size: 24px; font-weight: 800; text-align: center; color: var(--label-3); }
    .eq-check {
      width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%;
      background: rgba(255, 59, 48, 0.15); color: #ff3b30; font-weight: 800; font-size: 16px;
    }
    .eq-check.balanced { background: rgba(52, 199, 89, 0.15); color: #34c759; }

    /* KPIs */
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
    .kpi {
      padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); border-left: 3px solid var(--c, var(--accent));
      cursor: pointer; transition: all 180ms; display: flex; flex-direction: column; gap: 4px;
    }
    .kpi:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .kpi-icon { font-size: 20px; }
    .kpi-val { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
    .kpi-label { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .kpi-trend { font-size: 10px; font-weight: 700; margin-top: 4px; }
    .kpi-trend.up { color: #34c759; }
    .kpi-trend.down { color: #ff3b30; }

    /* GRID */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 820px) { .grid-2 { grid-template-columns: 1fr; } }

    /* CARD */
    .card { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 14px; }
    .card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .card-head h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .card-head small { font-size: var(--fs-2xs); color: var(--label-2); display: block; margin-top: 2px; }
    .card.danger-zone { border-left: 3px solid #ff3b30; }

    .legend-row { display: flex; gap: 16px; font-size: var(--fs-2xs); color: var(--label-2); flex-wrap: wrap; }
    .legend-row span { display: inline-flex; align-items: center; gap: 6px; }
    .legend-row .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

    /* STACKED CHART */
    .stacked-chart { display: flex; align-items: flex-end; gap: 10px; height: 180px; }
    .sc-group { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; }
    .sc-bars { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; gap: 3px; }
    .sc-bar { flex: 1; border-radius: 2px 2px 0 0; min-height: 3px; transition: opacity 140ms; }
    .sc-bar:hover { opacity: 0.75; }
    .sc-bar.green { background: #34c759; }
    .sc-bar.blue { background: #007aff; }
    .sc-bar.amber { background: #ff9500; }
    .sc-label { font-size: 10px; color: var(--label-2); font-weight: 600; }

    /* TYPE BREAKDOWN */
    .type-breakdown { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .tb-row { display: grid; grid-template-columns: 28px 100px 1fr 50px 90px; gap: 12px; align-items: center; font-size: var(--fs-xs); }
    .tb-icon { font-size: 16px; text-align: center; }
    .tb-label { color: var(--label-2); font-weight: 600; }
    .tb-track { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .tb-fill { height: 100%; border-radius: var(--r-pill); }
    .tb-count { text-align: right; font-weight: 700; }
    .tb-amount { text-align: right; font-weight: 700; color: #34c759; }

    /* CAMPAIGNS ROW */
    .campaigns-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .campaign-mini {
      padding: 16px; background: var(--bg-fill-2); border-radius: var(--r-sm);
      border-left: 3px solid var(--accent); cursor: pointer; transition: all 140ms;
      display: flex; flex-direction: column; gap: 10px;
    }
    .campaign-mini:hover { background: var(--bg-fill-3); transform: translateY(-2px); }
    .campaign-mini header { display: flex; align-items: center; gap: 8px; }
    .cm-icon { font-size: 20px; }
    .campaign-mini header b { font-size: var(--fs-xs); font-weight: 700; }
    .cm-progress { display: flex; flex-direction: column; gap: 6px; }
    .cmp-bar { height: 6px; background: var(--bg-surface-solid); border-radius: var(--r-pill); overflow: hidden; }
    .cmp-fill { height: 100%; background: linear-gradient(90deg, #34c759, #007aff); border-radius: var(--r-pill); }
    .cmp-meta { display: flex; justify-content: space-between; font-size: 10px; }
    .cmp-pct { color: #34c759; font-weight: 800; }
    .cm-foot { display: flex; justify-content: space-between; padding-top: 8px; border-top: 0.5px solid var(--separator); font-size: 10px; color: var(--label-3); }
    .cm-days { color: #ff9500; font-weight: 700; }

    /* FEED */
    .feed { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .feed-item {
      display: grid; grid-template-columns: 40px 1fr; gap: 10px; align-items: center;
      padding: 10px; background: var(--bg-fill-2); border-radius: var(--r-sm);
      cursor: pointer; transition: all 140ms;
    }
    .feed-item:hover { background: var(--bg-fill-3); transform: translateX(2px); }
    .fi-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 18px; }
    .fi-body { min-width: 0; }
    .fi-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .fi-row b { font-size: var(--fs-xs); font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .fi-amount { font-size: var(--fs-sm); font-weight: 800; color: #34c759; }
    .fi-meta { display: flex; gap: 10px; font-size: 10px; color: var(--label-3); margin-top: 3px; }

    /* TOP DONORS */
    .top-donors { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .td-row {
      display: grid; grid-template-columns: 24px 36px 1fr auto; gap: 12px;
      align-items: center; padding: 10px; background: var(--bg-fill-2);
      border-radius: var(--r-sm); cursor: pointer; transition: all 140ms; font-size: var(--fs-xs);
    }
    .td-row:hover { background: var(--bg-fill-3); }
    .td-rank {
      width: 24px; height: 24px; display: grid; place-items: center;
      background: var(--accent-soft); color: var(--accent); border-radius: 50%;
      font-size: 11px; font-weight: 800;
    }
    .td-avatar {
      width: 36px; height: 36px; display: grid; place-items: center;
      border-radius: 50%; font-size: 13px; font-weight: 800; color: #fff;
      background: var(--accent-soft); color: var(--accent);
    }
    .td-avatar.seg-gold { background: linear-gradient(135deg, #ffcc00, #ff9500); color: #fff; }
    .td-avatar.seg-platinum { background: linear-gradient(135deg, #8e8e93, #5a5a5e); color: #fff; }
    .td-avatar.seg-silver { background: linear-gradient(135deg, #c7c7cc, #8e8e93); color: #fff; }
    .td-info b { font-weight: 700; display: block; }
    .td-info small { font-size: 10px; color: var(--label-2); }
    .td-amount { font-weight: 800; color: #34c759; }

    /* PROJECTS LIST */
    .proj-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .proj-row {
      display: grid; grid-template-columns: 44px 1fr; gap: 12px; align-items: center;
      padding: 10px; background: var(--bg-fill-2); border-radius: var(--r-sm);
      cursor: pointer; transition: all 140ms;
    }
    .proj-row:hover { background: var(--bg-fill-3); transform: translateX(2px); }
    .pr-icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 20px; }
    .pr-body { min-width: 0; }
    .pr-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; }
    .pr-row b { font-size: var(--fs-xs); font-weight: 700; }
    .pr-status { font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: var(--r-pill); text-transform: uppercase; }
    .pr-status[data-s='active'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .pr-status[data-s='planning'] { background: var(--accent-soft); color: var(--accent); }
    .pr-status[data-s='completed'] { background: var(--bg-fill-3); color: var(--label-2); }
    .pr-status[data-s='paused'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .pr-progress { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .prp-bar { flex: 1; height: 4px; background: var(--bg-surface-solid); border-radius: var(--r-pill); overflow: hidden; }
    .prp-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms; }
    .pr-meta { display: flex; gap: 12px; font-size: 10px; color: var(--label-3); }

    /* ACTIVITY */
    .activity-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .act-row { display: grid; grid-template-columns: 36px 1fr auto; gap: 12px; align-items: center; padding: 8px 10px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .act-icon { width: 36px; height: 36px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 16px; }
    .act-row b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .act-row small { font-size: 10px; color: var(--label-2); }
    .act-time { font-size: 10px; color: var(--label-3); }

    /* TABLES */
    .table-wrap { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; }
    .thead, .trow { display: grid; gap: 12px; padding: 12px 16px; align-items: center; font-size: var(--fs-xs); }
    .thead { background: var(--bg-fill-2); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-2); font-weight: 700; }
    .trow { border-top: 0.5px solid var(--separator); cursor: pointer; transition: background 140ms; }
    .trow:hover { background: var(--bg-hover); }
    .cols-6 { grid-template-columns: 100px 130px 1fr 140px 140px 100px; }
    .cols-7 { grid-template-columns: 100px 1.4fr 130px 120px 1fr 140px 80px; }
    .cols-8 { grid-template-columns: 110px 1.4fr 100px 130px 110px 1fr 110px 100px; }
    .cell-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .inv-num { color: var(--accent); font-weight: 800; }
    .amount { text-align: right; font-weight: 700; }
    .amount.bold { font-weight: 800; font-size: var(--fs-sm); }
    .method-tag { font-size: 10px; padding: 3px 9px; background: var(--bg-fill-2); border-radius: var(--r-pill); color: var(--label-2); display: inline-block; }

    .type-badge { font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); text-transform: uppercase; letter-spacing: 0.04em; }
    .type-badge[data-t='zakat'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .type-badge[data-t='sadaqah'] { background: var(--accent-soft); color: var(--accent); }
    .type-badge[data-t='kaffala'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .type-badge[data-t='waqf'] { background: rgba(175, 82, 222, 0.15); color: #af52de; }
    .type-badge[data-t='fidyah'] { background: var(--bg-fill-3); color: var(--label-2); }
    .type-badge[data-t='qurbani'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .type-badge[data-t='ramadan'] { background: rgba(88, 86, 214, 0.15); color: #5856d6; }
    .type-badge[data-t='orphan'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .type-badge[data-t='student'] { background: var(--accent-soft); color: var(--accent); }
    .type-badge[data-t='family'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .type-badge[data-t='patient'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

    .st { padding: 3px 10px; border-radius: var(--r-pill); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; display: inline-block; text-align: center; }
    .st.small { font-size: 9px; padding: 2px 8px; }
    .st[data-s='pending'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='confirmed'] { background: var(--accent-soft); color: var(--accent); }
    .st[data-s='receipted'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='refunded'] { background: var(--bg-fill-3); color: var(--label-2); }
    .st[data-s='active'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='completed'] { background: var(--bg-fill-3); color: var(--label-2); }
    .st[data-s='paused'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='cancelled'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .st[data-s='planning'] { background: var(--accent-soft); color: var(--accent); }
    .st[data-s='graduated'] { background: rgba(175, 82, 222, 0.15); color: #af52de; }
    .st[data-s='suspended'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .st[data-s='on-leave'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='inactive'] { background: var(--bg-fill-3); color: var(--label-2); }
    .st[data-s='approved'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='paid'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='rejected'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .st[data-s='ending-soon'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='draft'] { background: var(--bg-fill-3); color: var(--label-2); }

    .progress-cell { display: flex; align-items: center; gap: 8px; }
    .prog-bar { flex: 1; height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .prog-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill); }

    .empty-mini { padding: 40px 20px; text-align: center; color: var(--label-3); font-size: var(--fs-xs); }
    .sign-check { font-weight: 800; text-align: center; color: #ff3b30; }
    .sign-check.signed { color: #34c759; }

    /* DONOR CARDS */
    .donors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
    .donor-card {
      padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); display: flex; flex-direction: column; gap: 12px;
      cursor: pointer; transition: all 140ms;
    }
    .donor-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--accent); }
    .donor-card[data-seg='platinum'] { border-left: 3px solid #8e8e93; }
    .donor-card[data-seg='gold'] { border-left: 3px solid #ffcc00; }
    .donor-card[data-seg='silver'] { border-left: 3px solid #c7c7cc; }
    .donor-card[data-seg='bronze'] { border-left: 3px solid #b87333; }
    .dc-head { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; }
    .dc-avatar { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; font-size: 15px; font-weight: 800; background: var(--accent-soft); color: var(--accent); }
    .dc-avatar.seg-gold { background: linear-gradient(135deg, #ffcc00, #ff9500); color: #fff; }
    .dc-avatar.seg-platinum { background: linear-gradient(135deg, #8e8e93, #5a5a5e); color: #fff; }
    .dc-avatar.seg-silver { background: linear-gradient(135deg, #c7c7cc, #8e8e93); color: #fff; }
    .dc-head b { font-size: var(--fs-sm); font-weight: 700; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dc-head small { font-size: 10px; color: var(--label-3); }
    .dc-seg { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); text-transform: uppercase; letter-spacing: 0.04em; }
    .dc-seg[data-s='platinum'] { background: linear-gradient(90deg, #8e8e93, #5a5a5e); color: #fff; }
    .dc-seg[data-s='gold'] { background: linear-gradient(90deg, #ffcc00, #ff9500); color: #fff; }
    .dc-seg[data-s='silver'] { background: linear-gradient(90deg, #c7c7cc, #8e8e93); color: #fff; }
    .dc-seg[data-s='bronze'] { background: linear-gradient(90deg, #cd7f32, #b87333); color: #fff; }
    .dc-contact { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: var(--label-2); }
    .dc-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-top: 10px; border-top: 0.5px solid var(--separator); }
    .dc-stats > div small { font-size: 9px; color: var(--label-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; display: block; margin-bottom: 3px; }
    .dc-stats > div b { font-size: var(--fs-sm); font-weight: 800; }
    .dc-commit { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(52, 199, 89, 0.08); border-radius: var(--r-sm); font-size: 10px; color: #34c759; font-weight: 700; }

    .segment-filters, .category-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .seg-chip, .cat-chip {
      padding: 7px 14px; border-radius: var(--r-pill); background: var(--bg-fill-2);
      color: var(--label-2); font-size: var(--fs-2xs); font-weight: 600;
      border: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
      transition: all 140ms;
    }
    .seg-chip:hover, .cat-chip:hover { background: var(--bg-fill-3); color: var(--label); }
    .seg-chip.active, .cat-chip.active { background: var(--accent); color: var(--accent-contrast); }
    .seg-count, .cat-count { background: rgba(255, 255, 255, 0.2); padding: 1px 6px; border-radius: var(--r-pill); font-size: 9px; font-weight: 700; }

    /* BENEFICIARIES */
    .beneficiaries-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
    .beneficiary-card {
      padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); display: flex; flex-direction: column; gap: 12px;
      cursor: pointer; transition: all 140ms;
    }
    .beneficiary-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .beneficiary-card[data-cat='orphan'] { border-left: 3px solid #34c759; }
    .beneficiary-card[data-cat='widow'] { border-left: 3px solid #af52de; }
    .beneficiary-card[data-cat='disabled'] { border-left: 3px solid #ff9500; }
    .beneficiary-card[data-cat='elderly'] { border-left: 3px solid #5856d6; }
    .beneficiary-card[data-cat='poor'] { border-left: 3px solid #ff3b30; }
    .beneficiary-card[data-cat='student'] { border-left: 3px solid #007aff; }
    .beneficiary-card[data-cat='patient'] { border-left: 3px solid #ff2d55; }
    .bc-head { display: grid; grid-template-columns: 40px 1fr auto; gap: 12px; align-items: center; }
    .bc-icon { font-size: 28px; text-align: center; }
    .bc-head b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .bc-head small { font-size: 10px; color: var(--label-2); }
    .bc-body { display: flex; flex-direction: column; gap: 6px; }
    .bc-row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
    .bc-row span { color: var(--label-3); }
    .bc-row b { font-weight: 700; }
    .bc-foot { display: flex; justify-content: space-between; padding-top: 8px; border-top: 0.5px solid var(--separator); color: var(--label-3); }

    /* PROJECTS GRID */
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }
    .project-card {
      padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); border-top: 3px solid var(--c);
      display: flex; flex-direction: column; gap: 12px; cursor: pointer; transition: all 200ms;
    }
    .project-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .pc-head { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; }
    .pc-icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 22px; }
    .pc-head b { font-size: var(--fs-base); font-weight: 700; display: block; }
    .pc-head small { font-size: 10px; color: var(--label-2); }
    .pc-status { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); text-transform: uppercase; }
    .pc-status[data-s='active'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .pc-status[data-s='planning'] { background: var(--accent-soft); color: var(--accent); }
    .pc-status[data-s='completed'] { background: var(--bg-fill-3); color: var(--label-2); }
    .pc-status[data-s='paused'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .pc-desc { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5; }
    .pc-progress { display: flex; flex-direction: column; gap: 6px; }
    .pcp-head { display: flex; justify-content: space-between; font-size: 10px; color: var(--label-2); }
    .pcp-head b { color: var(--c); font-weight: 800; }
    .pcp-track { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .pcp-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms; }
    .pc-budget { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 10px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .pc-budget > div small { font-size: 9px; color: var(--label-3); text-transform: uppercase; font-weight: 700; letter-spacing: 0.06em; display: block; margin-bottom: 3px; }
    .pc-budget > div b { font-size: var(--fs-xs); font-weight: 800; }
    .pc-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 0.5px solid var(--separator); font-size: 10px; color: var(--label-3); flex-wrap: wrap; gap: 6px; }

    /* CAMPAIGNS GRID */
    .campaigns-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
    .campaign-card {
      padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); display: flex; flex-direction: column; gap: 14px;
      cursor: pointer; transition: all 200ms; border-top: 3px solid var(--accent);
    }
    .campaign-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .campaign-card[data-s='ending-soon'] { border-top-color: #ff9500; }
    .campaign-card[data-s='completed'] { border-top-color: #34c759; }
    .campaign-card[data-s='draft'] { border-top-color: var(--label-3); }
    .cc-head { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; }
    .cc-icon { font-size: 32px; text-align: center; }
    .cc-head b { font-size: var(--fs-base); font-weight: 700; display: block; }
    .cc-head small { font-size: 10px; color: var(--label-2); }
    .cc-feat { font-size: 18px; }
    .cc-progress { display: flex; flex-direction: column; gap: 6px; }
    .ccp-bar { height: 8px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .ccp-fill { height: 100%; background: linear-gradient(90deg, #34c759, #007aff); border-radius: var(--r-pill); transition: width 500ms; }
    .ccp-meta { display: flex; justify-content: space-between; font-size: 11px; }
    .ccp-pct { color: #34c759; font-weight: 800; }
    .cc-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 10px 0; border-top: 0.5px solid var(--separator); border-bottom: 0.5px solid var(--separator); }
    .cc-stats > div small { font-size: 9px; color: var(--label-3); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 3px; }
    .cc-stats > div b { font-size: var(--fs-sm); font-weight: 800; }
    .cc-foot { display: flex; justify-content: space-between; color: var(--label-3); }

    /* STATS CARDS */
    .donation-stats, .kaffala-stats, .volunteer-stats, .expense-stats, .distribution-stats, .report-kpis {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
    }
    @media (max-width: 820px) { .donation-stats, .kaffala-stats, .volunteer-stats, .expense-stats, .distribution-stats, .report-kpis { grid-template-columns: repeat(2, 1fr); } }
    .ds-card, .ks-card, .vs-card, .es-card, .dts-card, .rk-card {
      padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); border-left: 3px solid var(--c);
      display: flex; flex-direction: column; gap: 4px;
    }
    .ds-icon, .ks-icon, .vs-icon, .es-icon, .dts-icon, .rk-icon { font-size: 20px; }
    .ds-val, .ks-val, .vs-val, .es-val, .dts-val, .rk-val { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
    .ds-card small, .ks-card small, .vs-card small, .es-card small, .dts-card small, .rk-card small { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    /* VOLUNTEER CARDS */
    .volunteers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
    .volunteer-card {
      padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); display: flex; flex-direction: column; gap: 12px; cursor: pointer; transition: all 140ms;
    }
    .volunteer-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--accent); }
    .volunteer-card[data-s='inactive'] { opacity: 0.7; }
    .vc-head { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; }
    .vc-avatar { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; background: var(--accent-soft); color: var(--accent); font-size: 15px; font-weight: 800; }
    .vc-head b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .vc-head small { font-size: 10px; color: var(--label-2); }
    .vc-contact { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: var(--label-2); }
    .vc-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-top: 10px; border-top: 0.5px solid var(--separator); }
    .vc-stats > div small { font-size: 9px; color: var(--label-3); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 3px; }
    .vc-stats > div b { font-size: var(--fs-sm); font-weight: 800; }

    /* REPORTS */
    .flow-chart { display: flex; align-items: flex-end; gap: 8px; height: 160px; }
    .fc-col { flex: 1; height: 100%; display: flex; align-items: flex-end; gap: 2px; position: relative; }
    .fc-in, .fc-out { flex: 1; border-radius: 2px 2px 0 0; min-height: 3px; }
    .fc-in { background: #34c759; }
    .fc-out { background: #ff3b30; }
    .fc-label { position: absolute; bottom: -22px; left: 0; right: 0; text-align: center; font-size: 10px; color: var(--label-2); font-weight: 600; }
    .chart-legend-row { display: flex; gap: 16px; margin-top: 12px; font-size: var(--fs-2xs); color: var(--label-2); }
    .chart-legend-row span { display: inline-flex; align-items: center; gap: 6px; }

    .dist-breakdown { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .db-row { display: grid; grid-template-columns: 28px 110px 1fr 50px; gap: 12px; align-items: center; font-size: var(--fs-xs); }
    .db-icon { font-size: 16px; text-align: center; }
    .db-label { color: var(--label-2); }
    .db-track { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .db-fill { height: 100%; border-radius: var(--r-pill); }
    .db-count { text-align: right; font-weight: 700; }

    .project-perf { display: flex; flex-direction: column; gap: 10px; }
    .pp-row { display: grid; grid-template-columns: 32px 200px 1fr 50px 150px; gap: 12px; align-items: center; font-size: var(--fs-xs); }
    .pp-icon { width: 32px; height: 32px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 16px; }
    .pp-name { font-weight: 600; }
    .pp-track { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .pp-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms; }
    .pp-progress { text-align: right; font-weight: 800; }
    .pp-spent { text-align: right; color: var(--label-2); }

    /* SETTINGS */
    .settings-list { display: flex; flex-direction: column; gap: 4px; }
    .setting-row { display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: center; padding: 12px 0; border-bottom: 0.5px solid var(--separator); }
    .setting-row:last-child { border-bottom: 0; }
    .setting-row b { font-size: var(--fs-sm); font-weight: 600; display: block; }
    .setting-row small { font-size: var(--fs-2xs); color: var(--label-2); }
    .toggle { position: relative; width: 44px; height: 26px; border-radius: var(--r-pill); background: var(--bg-fill-3); border: 0; cursor: pointer; transition: background 200ms; flex-shrink: 0; }
    .toggle.on { background: #34c759; }
    .toggle .knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: #fff; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 200ms; }
    .toggle.on .knob { transform: translateX(18px); }
    .dz-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    /* MODAL */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(8px); z-index: 9990;
      display: grid; place-items: center; padding: 40px 20px;
      animation: fadeIn 200ms;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal {
      max-width: 720px; width: 100%; max-height: 88vh;
      background: var(--bg-elevated); border: 0.5px solid var(--separator);
      border-radius: var(--r-lg); box-shadow: var(--shadow-xl);
      display: flex; flex-direction: column; overflow: hidden;
      animation: modalIn 300ms var(--ease-spring);
    }
    .modal.donation-modal { max-width: 640px; }
    .modal.donor-modal { max-width: 720px; }
    .modal.bene-modal { max-width: 700px; }
    .modal.project-modal { max-width: 780px; }
    @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .modal-head { display: flex; align-items: center; gap: 14px; padding: 20px 24px; border-bottom: 0.5px solid var(--separator); }
    .modal-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: var(--r-md); font-size: 22px; font-weight: 800; flex-shrink: 0; }
    .modal-icon.seg-platinum { background: linear-gradient(135deg, #8e8e93, #5a5a5e); color: #fff; }
    .modal-icon.seg-gold { background: linear-gradient(135deg, #ffcc00, #ff9500); color: #fff; }
    .modal-icon.seg-silver { background: linear-gradient(135deg, #c7c7cc, #8e8e93); color: #fff; }
    .modal-icon.seg-bronze { background: linear-gradient(135deg, #cd7f32, #b87333); color: #fff; }
    .modal-head > div { flex: 1; }
    .modal-head h3 { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.015em; }
    .modal-head p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 2px; }
    .modal-close { width: 32px; height: 32px; display: grid; place-items: center; border-radius: var(--r-xs); color: var(--label-3); font-size: 16px; background: transparent; border: 0; cursor: pointer; }
    .modal-close:hover { background: var(--bg-hover); color: var(--label); }
    .modal-body { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }

    /* RECEIPT */
    .receipt-card { padding: 20px; background: var(--bg-fill-2); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 16px; }
    .rc-header { display: flex; align-items: center; gap: 14px; padding-bottom: 14px; border-bottom: 2px dashed var(--separator); }
    .rc-logo { font-size: 40px; }
    .rc-header b { font-size: var(--fs-base); font-weight: 800; display: block; }
    .rc-header small { font-size: var(--fs-2xs); color: var(--label-2); }
    .rc-amount { display: flex; flex-direction: column; gap: 4px; align-items: center; padding: 12px 0; }
    .rc-amount small { font-size: var(--fs-2xs); color: var(--label-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .rc-amount b { font-size: var(--fs-4xl); font-weight: 900; color: #34c759; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
    .rc-type { padding: 4px 12px; background: var(--accent-soft); color: var(--accent); border-radius: var(--r-pill); font-size: 11px; font-weight: 800; }
    .rc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding-top: 14px; border-top: 2px dashed var(--separator); }
    .rc-grid > div small { font-size: 9px; color: var(--label-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; display: block; margin-bottom: 3px; }
    .rc-grid > div b { font-size: var(--fs-sm); font-weight: 700; }
    .rc-notes { padding-top: 14px; border-top: 2px dashed var(--separator); }
    .rc-notes small { font-size: 9px; color: var(--label-3); text-transform: uppercase; font-weight: 700; }
    .rc-notes p { font-size: var(--fs-xs); margin-top: 6px; line-height: 1.5; }

    /* DONOR/BENE HERO */
    .donor-hero, .bene-hero { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .donor-hero > div, .bene-hero > div { padding: 14px; background: var(--bg-fill-2); border-radius: var(--r-sm); text-align: center; }
    .donor-hero small, .bene-hero small { font-size: 10px; color: var(--label-2); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px; }
    .donor-hero b, .bene-hero b { font-size: var(--fs-xl); font-weight: 800; color: var(--accent); }

    .om-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 600px) { .om-grid { grid-template-columns: 1fr; } }
    .om-section { display: flex; flex-direction: column; gap: 3px; }
    .om-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--label-3); margin-bottom: 2px; }
    .om-section b { font-size: var(--fs-sm); font-weight: 700; }
    .om-block { display: flex; flex-direction: column; gap: 8px; }
    .om-block p { font-size: var(--fs-sm); line-height: 1.55; color: var(--label); }

    .mini-donation { display: grid; grid-template-columns: 32px 1fr auto auto; gap: 10px; align-items: center; padding: 8px 12px; background: var(--bg-fill-2); border-radius: var(--r-xs); font-size: 11px; cursor: pointer; transition: background 140ms; }
    .mini-donation:hover { background: var(--bg-fill-3); }
    .md-icon { font-size: 18px; text-align: center; }
    .md-amount { color: #34c759; font-weight: 800; }
    .md-date { color: var(--label-3); }

    /* PROJECT PROGRESS + BUDGET */
    .proj-progress-bar { padding: 14px 16px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .ppb-head { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: var(--fs-xs); }
    .ppb-head b { color: var(--accent); font-weight: 800; }
    .ppb-track { height: 8px; background: var(--bg-surface-solid); border-radius: var(--r-pill); overflow: hidden; }
    .ppb-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms; }
    .proj-budget-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .pbg-card { padding: 14px; background: var(--bg-fill-2); border-radius: var(--r-sm); text-align: center; }
    .pbg-card.spent { background: rgba(255, 149, 0, 0.08); }
    .pbg-card.remain { background: rgba(52, 199, 89, 0.08); }
    .pbg-card small { font-size: 10px; color: var(--label-2); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px; }
    .pbg-card b { font-size: var(--fs-lg); font-weight: 800; }

    .modal-foot { padding: 16px 24px; border-top: 0.5px solid var(--separator); display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
    .mf-btn { padding: 9px 16px; background: var(--bg-fill-2); color: var(--label); border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600; border: 0; cursor: pointer; }
    .mf-btn:hover { background: var(--bg-fill-3); }
    .mf-btn.primary { background: var(--accent); color: var(--accent-contrast); }
    .mf-btn.primary:hover { background: var(--accent-hover); }
  `],
})
export class BwtPreviewComponent {
  readonly Math = Math;
  public toast = inject(ToastService);
  private menu = inject(ContextMenuService);

  readonly lang = signal<Lang>('en');
  readonly active = signal<BwtView>('dashboard');
  readonly donationFilter = signal<string>('all');
  readonly donorSegmentFilter = signal<string>('all');
  readonly beneficiaryCategoryFilter = signal<string>('all');
  readonly searchQuery = signal('');
  readonly periodClosed = signal(false);

  readonly selectedDonation = signal<Donation | null>(null);
  readonly selectedDonor = signal<Donor | null>(null);
  readonly selectedBeneficiary = signal<Beneficiary | null>(null);
  readonly selectedProject = signal<Project | null>(null);

  private settingsStore = signal<Record<string, any>>({
    orgName: 'جمعية البر والتقوى الخيرية',
    orgNameEn: 'Al-Birr Wal-Taqwa Charitable Association',
    licenseNo: 'CG-2015-4471',
    taxId: '530-112-998',
    address: '12 El-Nasr Street, Nasr City, Cairo',
    phone: '+20 2 2404 5555',
    email: 'info@albirr-charity.org',
    website: 'www.albirr-charity.org',
    currency: 'EGP',
    zakatRate: 2.5,
    adminFeePercent: 8,
    autoReceipt: true,
    sendThankYou: true,
    monthlyReport: true,
    requireApprovalOver: 50000,
  });


  readonly donations = signal<Donation[]>([
    { id: 'D-2001', donorId: 'DN-001', donorName: 'Ahmed Mohamed', donorNameAr: 'أحمد محمد', amount: 50000, currency: 'EGP', type: 'zakat', method: 'bank', purpose: 'General Zakat', purposeAr: 'زكاة عامة', status: 'receipted', date: '2024-12-08', receiptNo: 'RCT-2024-1042' },
    { id: 'D-2002', donorId: 'DN-002', donorName: 'Fatima Al-Zahra Co.', donorNameAr: 'شركة فاطمة الزهراء', amount: 250000, currency: 'EGP', type: 'sadaqah', method: 'bank', purpose: 'Orphan Sponsorship', purposeAr: 'كفالة أيتام', status: 'confirmed', date: '2024-12-07', receiptNo: 'RCT-2024-1041' },
    { id: 'D-2003', donorId: 'DN-003', donorName: 'Anonymous Donor', donorNameAr: 'متبرع مجهول', amount: 15000, currency: 'EGP', type: 'sadaqah', method: 'cash', purpose: 'Food Bank', purposeAr: 'بنك الطعام', status: 'receipted', date: '2024-12-07', receiptNo: 'RCT-2024-1040' },
    { id: 'D-2004', donorId: 'DN-004', donorName: 'Omar Khaled', donorNameAr: 'عمر خالد', amount: 5000, currency: 'EGP', type: 'zakat', method: 'online', purpose: 'Zakat Al-Mal', purposeAr: 'زكاة المال', status: 'confirmed', date: '2024-12-06', receiptNo: 'RCT-2024-1039' },
    { id: 'D-2005', donorId: 'DN-005', donorName: 'Layla Hassan', donorNameAr: 'ليلى حسن', amount: 12000, currency: 'EGP', type: 'kaffala', method: 'bank', purpose: 'Monthly Kaffala', purposeAr: 'كفالة شهرية', status: 'receipted', date: '2024-12-06', receiptNo: 'RCT-2024-1038' },
    { id: 'D-2006', donorId: 'DN-006', donorName: 'Yousef Trading Co.', donorNameAr: 'شركة يوسف للتجارة', amount: 75000, currency: 'EGP', type: 'waqf', method: 'bank', purpose: 'Water Well Waqf', purposeAr: 'وقف بئر مياه', status: 'confirmed', date: '2024-12-05', receiptNo: 'RCT-2024-1037' },
    { id: 'D-2007', donorId: 'DN-007', donorName: 'Mohamed Samir', donorNameAr: 'محمد سمير', amount: 3500, currency: 'EGP', type: 'sadaqah', method: 'wallet', purpose: 'General Sadaqah', purposeAr: 'صدقة عامة', status: 'pending', date: '2024-12-05', receiptNo: 'RCT-2024-1036' },
    { id: 'D-2008', donorId: 'DN-008', donorName: 'Sara Ibrahim', donorNameAr: 'سارة إبراهيم', amount: 2500, currency: 'EGP', type: 'fidyah', method: 'cash', purpose: 'Fidyah', purposeAr: 'فدية', status: 'receipted', date: '2024-12-04', receiptNo: 'RCT-2024-1035' },
    { id: 'D-2009', donorId: 'DN-009', donorName: 'Khalid Corporation', donorNameAr: 'مؤسسة خالد', amount: 180000, currency: 'EGP', type: 'sadaqah', method: 'bank', purpose: 'Medical Aid Program', purposeAr: 'برنامج المساعدات الطبية', status: 'confirmed', date: '2024-12-03', receiptNo: 'RCT-2024-1034' },
    { id: 'D-2010', donorId: 'DN-010', donorName: 'Nour Adel', donorNameAr: 'نور عادل', amount: 8000, currency: 'EGP', type: 'kaffala', method: 'online', purpose: 'Student Kaffala', purposeAr: 'كفالة طالب', status: 'receipted', date: '2024-12-03', receiptNo: 'RCT-2024-1033' },
    { id: 'D-2011', donorId: 'DN-001', donorName: 'Ahmed Mohamed', donorNameAr: 'أحمد محمد', amount: 25000, currency: 'EGP', type: 'qurbani', method: 'bank', purpose: 'Eid Al-Adha Qurbani', purposeAr: 'أضحية عيد الأضحى', status: 'receipted', date: '2024-12-02', receiptNo: 'RCT-2024-1032' },
    { id: 'D-2012', donorId: 'DN-002', donorName: 'Fatima Al-Zahra Co.', donorNameAr: 'شركة فاطمة الزهراء', amount: 40000, currency: 'EGP', type: 'ramadan', method: 'bank', purpose: 'Ramadan Iftar', purposeAr: 'إفطار رمضان', status: 'confirmed', date: '2024-12-01', receiptNo: 'RCT-2024-1031' },
  ]);

  readonly donors = signal<Donor[]>([
    { id: 'DN-001', name: 'Ahmed Mohamed', nameAr: 'أحمد محمد', type: 'individual', phone: '+20 100 111 0001', email: 'ahmed@example.com', city: 'Cairo', cityAr: 'القاهرة', totalDonated: 142000, donationCount: 8, lastDonation: '2024-12-08', segment: 'gold', joinedAt: '2022-03-15', status: 'active', monthlyCommitment: 5000 },
    { id: 'DN-002', name: 'Fatima Al-Zahra Co.', nameAr: 'شركة فاطمة الزهراء', type: 'company', phone: '+20 2 2400 0001', email: 'csr@fatima-zahra.com', city: 'Cairo', cityAr: 'القاهرة', totalDonated: 890000, donationCount: 24, lastDonation: '2024-12-07', segment: 'platinum', joinedAt: '2020-06-20', taxId: '530-441-221', status: 'vip', monthlyCommitment: 50000 },
    { id: 'DN-003', name: 'Anonymous Donor', nameAr: 'متبرع مجهول', type: 'anonymous', phone: '—', email: '—', city: 'Cairo', cityAr: 'القاهرة', totalDonated: 210000, donationCount: 14, lastDonation: '2024-12-07', segment: 'gold', joinedAt: '2021-01-10', status: 'active' },
    { id: 'DN-004', name: 'Omar Khaled', nameAr: 'عمر خالد', type: 'individual', phone: '+20 100 111 0004', email: 'omar.k@example.com', city: 'Giza', cityAr: 'الجيزة', totalDonated: 48000, donationCount: 6, lastDonation: '2024-12-06', segment: 'silver', joinedAt: '2023-05-08', status: 'active' },
    { id: 'DN-005', name: 'Layla Hassan', nameAr: 'ليلى حسن', type: 'individual', phone: '+20 100 111 0005', email: 'layla.h@example.com', city: 'Alexandria', cityAr: 'الإسكندرية', totalDonated: 84000, donationCount: 12, lastDonation: '2024-12-06', segment: 'gold', joinedAt: '2022-09-12', status: 'active', monthlyCommitment: 7000 },
    { id: 'DN-006', name: 'Yousef Trading Co.', nameAr: 'شركة يوسف للتجارة', type: 'company', phone: '+20 2 2700 5555', email: 'info@yousef-trade.com', city: 'Cairo', cityAr: 'القاهرة', totalDonated: 425000, donationCount: 18, lastDonation: '2024-12-05', segment: 'platinum', joinedAt: '2020-11-03', taxId: '530-778-993', status: 'vip' },
    { id: 'DN-007', name: 'Mohamed Samir', nameAr: 'محمد سمير', type: 'individual', phone: '+20 100 111 0007', email: 'm.samir@example.com', city: 'Mansoura', cityAr: 'المنصورة', totalDonated: 21000, donationCount: 5, lastDonation: '2024-12-05', segment: 'silver', joinedAt: '2023-08-15', status: 'active' },
    { id: 'DN-008', name: 'Sara Ibrahim', nameAr: 'سارة إبراهيم', type: 'individual', phone: '+20 100 111 0008', email: 'sara.i@example.com', city: 'Cairo', cityAr: 'القاهرة', totalDonated: 15500, donationCount: 4, lastDonation: '2024-12-04', segment: 'bronze', joinedAt: '2024-02-20', status: 'active' },
    { id: 'DN-009', name: 'Khalid Corporation', nameAr: 'مؤسسة خالد', type: 'company', phone: '+20 2 2500 8888', email: 'csr@khalid-corp.com', city: 'Cairo', cityAr: 'القاهرة', totalDonated: 620000, donationCount: 15, lastDonation: '2024-12-03', segment: 'platinum', joinedAt: '2021-04-01', taxId: '530-556-772', status: 'vip', monthlyCommitment: 40000 },
    { id: 'DN-010', name: 'Nour Adel', nameAr: 'نور عادل', type: 'individual', phone: '+20 100 111 0010', email: 'nour.a@example.com', city: 'Tanta', cityAr: 'طنطا', totalDonated: 32000, donationCount: 7, lastDonation: '2024-12-03', segment: 'silver', joinedAt: '2023-01-25', status: 'active' },
    { id: 'DN-011', name: 'Hana Farouk', nameAr: 'هنا فاروق', type: 'individual', phone: '+20 100 111 0011', email: 'hana.f@example.com', city: 'Cairo', cityAr: 'القاهرة', totalDonated: 9000, donationCount: 3, lastDonation: '2024-11-28', segment: 'bronze', joinedAt: '2024-06-10', status: 'active' },
    { id: 'DN-012', name: 'Tarek Kamal', nameAr: 'طارق كمال', type: 'individual', phone: '+20 100 111 0012', email: 'tarek.k@example.com', city: 'Luxor', cityAr: 'الأقصر', totalDonated: 5500, donationCount: 2, lastDonation: '2024-11-15', segment: 'bronze', joinedAt: '2024-08-05', status: 'inactive' },
  ]);

  readonly beneficiaries = signal<Beneficiary[]>([
    { id: 'B-3001', name: 'Amina Said', nameAr: 'أمينة سعيد', nationalId: '28503041100001', category: 'widow', familySize: 5, monthlyIncome: 1500, city: 'Cairo', cityAr: 'القاهرة', district: 'El-Marg', monthlyAid: 2000, totalAidReceived: 48000, registeredAt: '2022-01-15', lastAidAt: '2024-12-01', status: 'active', phone: '+20 100 555 0001', documents: 4 },
    { id: 'B-3002', name: 'Youssef Abdel-Rahman', nameAr: 'يوسف عبد الرحمن', nationalId: '31205051100002', category: 'orphan', familySize: 1, monthlyIncome: 0, city: 'Cairo', cityAr: 'القاهرة', district: 'Nasr City', monthlyAid: 1500, totalAidReceived: 27000, registeredAt: '2023-06-20', lastAidAt: '2024-12-01', status: 'active', phone: '+20 100 555 0002', documents: 6 },
    { id: 'B-3003', name: 'Hassan Abdel-Fattah', nameAr: 'حسن عبد الفتاح', nationalId: '27806061100003', category: 'elderly', familySize: 2, monthlyIncome: 800, city: 'Giza', cityAr: 'الجيزة', district: 'Boulaq', monthlyAid: 1800, totalAidReceived: 72000, registeredAt: '2020-09-10', lastAidAt: '2024-12-02', status: 'active', phone: '+20 100 555 0003', documents: 5 },
    { id: 'B-3004', name: 'Fatima Ahmed', nameAr: 'فاطمة أحمد', nationalId: '28201101100004', category: 'disabled', familySize: 4, monthlyIncome: 2200, city: 'Cairo', cityAr: 'القاهرة', district: 'Helwan', monthlyAid: 2500, totalAidReceived: 55000, registeredAt: '2021-04-25', lastAidAt: '2024-12-02', status: 'active', phone: '+20 100 555 0004', documents: 7 },
    { id: 'B-3005', name: 'Mohamed El-Sayed', nameAr: 'محمد السيد', nationalId: '31508111100005', category: 'student', familySize: 6, monthlyIncome: 3200, city: 'Minya', cityAr: 'المنيا', district: 'Beni Mazar', monthlyAid: 1200, totalAidReceived: 14400, registeredAt: '2023-09-15', lastAidAt: '2024-12-01', status: 'active', phone: '+20 100 555 0005', documents: 5 },
    { id: 'B-3006', name: 'Zeinab Farghaly', nameAr: 'زينب فرغلي', nationalId: '28002021100006', category: 'widow', familySize: 3, monthlyIncome: 1200, city: 'Alexandria', cityAr: 'الإسكندرية', district: 'Sidi Gaber', monthlyAid: 1800, totalAidReceived: 43200, registeredAt: '2021-11-08', lastAidAt: '2024-11-28', status: 'active', phone: '+20 100 555 0006', documents: 4 },
    { id: 'B-3007', name: 'Ibrahim Abdel-Latif', nameAr: 'إبراهيم عبد اللطيف', nationalId: '27604041100007', category: 'poor', familySize: 7, monthlyIncome: 1800, city: 'Sohag', cityAr: 'سوهاج', district: 'Tahta', monthlyAid: 2200, totalAidReceived: 66000, registeredAt: '2020-03-22', lastAidAt: '2024-12-03', status: 'active', phone: '+20 100 555 0007', documents: 8 },
    { id: 'B-3008', name: 'Salma Hosny', nameAr: 'سلمى حسني', nationalId: '32001201100008', category: 'orphan', familySize: 1, monthlyIncome: 0, city: 'Cairo', cityAr: 'القاهرة', district: 'Shubra', monthlyAid: 1500, totalAidReceived: 9000, registeredAt: '2024-06-01', lastAidAt: '2024-12-01', status: 'active', phone: '+20 100 555 0008', documents: 3 },
    { id: 'B-3009', name: 'Kamal Abdel-Aziz', nameAr: 'كمال عبد العزيز', nationalId: '27005051100009', category: 'patient', familySize: 2, monthlyIncome: 2500, city: 'Cairo', cityAr: 'القاهرة', district: 'Abbasiya', monthlyAid: 3000, totalAidReceived: 90000, registeredAt: '2022-05-14', lastAidAt: '2024-12-04', status: 'active', phone: '+20 100 555 0009', documents: 12 },
    { id: 'B-3010', name: 'Hoda Ibrahim', nameAr: 'هدى إبراهيم', nationalId: '29008081100010', category: 'widow', familySize: 4, monthlyIncome: 1000, city: 'Giza', cityAr: 'الجيزة', district: 'Haram', monthlyAid: 1800, totalAidReceived: 32400, registeredAt: '2023-02-18', lastAidAt: '2024-12-01', status: 'active', phone: '+20 100 555 0010', documents: 5 },
    { id: 'B-3011', name: 'Ahmed Mansour', nameAr: 'أحمد منصور', nationalId: '31603201100011', category: 'student', familySize: 5, monthlyIncome: 2800, city: 'Assiut', cityAr: 'أسيوط', district: 'Dairut', monthlyAid: 1200, totalAidReceived: 10800, registeredAt: '2024-01-20', lastAidAt: '2024-12-02', status: 'active', phone: '+20 100 555 0011', documents: 4 },
    { id: 'B-3012', name: 'Mona Khalil', nameAr: 'منى خليل', nationalId: '28806061100012', category: 'disabled', familySize: 3, monthlyIncome: 1500, city: 'Cairo', cityAr: 'القاهرة', district: 'Zamalek', monthlyAid: 2200, totalAidReceived: 61600, registeredAt: '2021-08-10', lastAidAt: '2024-12-03', status: 'active', phone: '+20 100 555 0012', documents: 6 },
    { id: 'B-3013', name: 'Nabil Saleh', nameAr: 'نبيل صالح', nationalId: '27504121100013', category: 'elderly', familySize: 2, monthlyIncome: 900, city: 'Mansoura', cityAr: 'المنصورة', district: 'Talkha', monthlyAid: 1600, totalAidReceived: 51200, registeredAt: '2021-01-08', lastAidAt: '2024-11-29', status: 'active', phone: '+20 100 555 0013', documents: 5 },
    { id: 'B-3014', name: 'Layla Fahmy', nameAr: 'ليلى فهمي', nationalId: '29305051100014', category: 'poor', familySize: 6, monthlyIncome: 2000, city: 'Cairo', cityAr: 'القاهرة', district: 'Ain Shams', monthlyAid: 2200, totalAidReceived: 37400, registeredAt: '2023-06-25', lastAidAt: '2024-12-04', status: 'active', phone: '+20 100 555 0014', documents: 7 },
    { id: 'B-3015', name: 'Rania Younis', nameAr: 'رانيا يونس', nationalId: '29502021100015', category: 'graduated', familySize: 1, monthlyIncome: 4500, city: 'Cairo', cityAr: 'القاهرة', district: 'Maadi', monthlyAid: 0, totalAidReceived: 108000, registeredAt: '2020-09-05', lastAidAt: '2024-06-01', status: 'graduated', phone: '+20 100 555 0015', documents: 8 } as any,
  ]);

  readonly projects = signal<Project[]>([
    { id: 'P-4001', name: 'Water Wells Project', nameAr: 'مشروع حفر الآبار', category: 'water', icon: '💧', color: '#007aff', budget: 850000, spent: 620000, progress: 73, beneficiaries: 4200, donors: 184, startDate: '2024-03-01', endDate: '2025-03-01', manager: 'Eng. Mostafa Fahmy', managerAr: 'م. مصطفى فهمي', location: 'Upper Egypt Villages', locationAr: 'قرى الصعيد', status: 'active', description: 'Digging 45 water wells in rural Upper Egypt villages', descriptionAr: 'حفر 45 بئر مياه في قرى الصعيد الريفية' },
    { id: 'P-4002', name: 'Orphan Sponsorship', nameAr: 'كفالة الأيتام', category: 'orphan', icon: '👦', color: '#34c759', budget: 1200000, spent: 840000, progress: 70, beneficiaries: 340, donors: 245, startDate: '2024-01-01', endDate: '2024-12-31', manager: 'Ms. Sara Adel', managerAr: 'أ. سارة عادل', location: 'Nationwide', locationAr: 'على مستوى الجمهورية', status: 'active', description: 'Monthly sponsorship of 340 orphans with education & medical care', descriptionAr: 'كفالة شهرية لـ 340 يتيم مع التعليم والرعاية الطبية' },
    { id: 'P-4003', name: 'Food Bank', nameAr: 'بنك الطعام', category: 'food', icon: '🍞', color: '#ff9500', budget: 650000, spent: 520000, progress: 80, beneficiaries: 8500, donors: 412, startDate: '2024-01-01', endDate: '2024-12-31', manager: 'Mr. Ahmed Reda', managerAr: 'أ. أحمد رضا', location: 'Cairo & Giza', locationAr: 'القاهرة والجيزة', status: 'active', description: 'Monthly food baskets distributed to 8,500 families', descriptionAr: 'توزيع سلال غذائية شهرية على 8500 أسرة' },
    { id: 'P-4004', name: 'Medical Aid Program', nameAr: 'برنامج المساعدات الطبية', category: 'medical', icon: '💊', color: '#ff3b30', budget: 950000, spent: 580000, progress: 61, beneficiaries: 1240, donors: 168, startDate: '2024-02-15', endDate: '2025-02-15', manager: 'Dr. Khaled Sami', managerAr: 'د. خالد سامي', location: 'All Governorates', locationAr: 'جميع المحافظات', status: 'active', description: 'Free medical care, surgeries, and medications for 1,240 patients', descriptionAr: 'رعاية طبية مجانية وعمليات وأدوية لـ 1240 مريض' },
    { id: 'P-4005', name: 'School Supplies', nameAr: 'توفير المستلزمات المدرسية', category: 'education', icon: '📚', color: '#5856d6', budget: 320000, spent: 320000, progress: 100, beneficiaries: 2100, donors: 96, startDate: '2024-08-01', endDate: '2024-10-15', manager: 'Mr. Tarek Hosny', managerAr: 'أ. طارق حسني', location: 'Rural Areas', locationAr: 'المناطق الريفية', status: 'completed', description: 'Complete school kits for 2,100 underprivileged students', descriptionAr: 'مستلزمات مدرسية كاملة لـ 2100 طالب من الأسر المتعففة' },
    { id: 'P-4006', name: 'Winter Aid Campaign', nameAr: 'حملة المساعدة الشتوية', category: 'housing', icon: '🧥', color: '#af52de', budget: 420000, spent: 180000, progress: 43, beneficiaries: 3200, donors: 142, startDate: '2024-11-01', endDate: '2025-01-31', manager: 'Ms. Nour Hegazy', managerAr: 'أ. نور حجازي', location: 'Nationwide', locationAr: 'على مستوى الجمهورية', status: 'active', description: 'Winter blankets, heaters, and warm clothing for 3,200 families', descriptionAr: 'بطانيات وتدفئة وملابس شتوية لـ 3200 أسرة' },
    { id: 'P-4007', name: 'Ramadan Iftar Project', nameAr: 'مشروع إفطار رمضان', category: 'ramadan', icon: '🌙', color: '#ffcc00', budget: 680000, spent: 0, progress: 0, beneficiaries: 0, donors: 0, startDate: '2025-03-01', endDate: '2025-04-15', manager: 'Mr. Hassan Mahmoud', managerAr: 'أ. حسن محمود', location: 'Nationwide', locationAr: 'على مستوى الجمهورية', status: 'planning', description: 'Daily Iftar meals for 5,000 fasting families during Ramadan', descriptionAr: 'وجبات إفطار يومية لـ 5000 أسرة صائمة خلال رمضان' },
    { id: 'P-4008', name: 'Emergency Relief', nameAr: 'الإغاثة الطارئة', category: 'emergency', icon: '🆘', color: '#8b0000', budget: 250000, spent: 210000, progress: 84, beneficiaries: 480, donors: 68, startDate: '2024-10-01', endDate: '2024-12-15', manager: 'Mr. Amr Salah', managerAr: 'أ. عمرو صلاح', location: 'North Sinai', locationAr: 'شمال سيناء', status: 'active', description: 'Emergency relief for displaced families in North Sinai', descriptionAr: 'إغاثة طارئة للأسر النازحة في شمال سيناء' },
    { id: 'P-4009', name: 'Mosque Construction', nameAr: 'بناء المساجد', category: 'mosque', icon: '🕌', color: '#34c759', budget: 1500000, spent: 420000, progress: 28, beneficiaries: 12000, donors: 218, startDate: '2024-09-01', endDate: '2025-12-31', manager: 'Sheikh Ahmed Al-Azhari', managerAr: 'الشيخ أحمد الأزهري', location: 'Upper Egypt Villages', locationAr: 'قرى الصعيد', status: 'active', description: 'Building 6 mosques in villages without a mosque', descriptionAr: 'بناء 6 مساجد في قرى بدون مسجد' },
  ]);

  readonly campaigns = signal<Campaign[]>([
    { id: 'C-5001', name: 'Ramadan 1446 Iftar', nameAr: 'إفطار رمضان 1446', icon: '🌙', target: 800000, raised: 320000, donorsCount: 87, startDate: '2024-12-01', endDate: '2025-03-01', daysLeft: 85, status: 'active', featured: true, category: 'Ramadan', categoryAr: 'رمضان' },
    { id: 'C-5002', name: 'Winter Warmth 2024', nameAr: 'شتاء دافئ 2024', icon: '🧥', target: 400000, raised: 284000, donorsCount: 142, startDate: '2024-11-01', endDate: '2024-12-31', daysLeft: 23, status: 'ending-soon', featured: true, category: 'Seasonal', categoryAr: 'موسمي' },
    { id: 'C-5003', name: 'Orphan School Fund', nameAr: 'صندوق تعليم الأيتام', icon: '📚', target: 500000, raised: 180000, donorsCount: 64, startDate: '2024-10-15', endDate: '2025-06-30', daysLeft: 204, status: 'active', featured: false, category: 'Education', categoryAr: 'التعليم' },
    { id: 'C-5004', name: 'Gaza Relief Fund', nameAr: 'صندوق إغاثة غزة', icon: '🆘', target: 2000000, raised: 1840000, donorsCount: 412, startDate: '2024-08-01', endDate: '2025-02-28', daysLeft: 82, status: 'active', featured: true, category: 'Emergency', categoryAr: 'إغاثة' },
    { id: 'C-5005', name: 'Water for All', nameAr: 'ماء للجميع', icon: '💧', target: 600000, raised: 620000, donorsCount: 184, startDate: '2024-05-01', endDate: '2024-11-30', daysLeft: 0, status: 'completed', featured: false, category: 'Water', categoryAr: 'المياه' },
    { id: 'C-5006', name: 'Medical Emergency', nameAr: 'طوارئ طبية', icon: '💊', target: 300000, raised: 92000, donorsCount: 38, startDate: '2024-12-05', endDate: '2025-01-15', daysLeft: 38, status: 'active', featured: false, category: 'Medical', categoryAr: 'طبي' },
  ]);

  readonly kaffalas = signal<Kaffala[]>([
    { id: 'K-6001', beneficiaryId: 'B-3002', beneficiaryName: 'Youssef Abdel-Rahman', beneficiaryNameAr: 'يوسف عبد الرحمن', sponsorId: 'DN-002', sponsorName: 'Fatima Al-Zahra Co.', sponsorNameAr: 'شركة فاطمة الزهراء', type: 'orphan', monthlyAmount: 1500, startDate: '2023-06-20', paidMonths: 18, remainingMonths: 6, totalPaid: 27000, status: 'active', notes: 'Exceptional student, top of class' },
    { id: 'K-6002', beneficiaryId: 'B-3008', beneficiaryName: 'Salma Hosny', beneficiaryNameAr: 'سلمى حسني', sponsorId: 'DN-001', sponsorName: 'Ahmed Mohamed', sponsorNameAr: 'أحمد محمد', type: 'orphan', monthlyAmount: 1500, startDate: '2024-06-01', paidMonths: 6, remainingMonths: 18, totalPaid: 9000, status: 'active', notes: '' },
    { id: 'K-6003', beneficiaryId: 'B-3005', beneficiaryName: 'Mohamed El-Sayed', beneficiaryNameAr: 'محمد السيد', sponsorId: 'DN-005', sponsorName: 'Layla Hassan', sponsorNameAr: 'ليلى حسن', type: 'student', monthlyAmount: 1200, startDate: '2023-09-15', paidMonths: 12, remainingMonths: 12, totalPaid: 14400, status: 'active', notes: 'Engineering student at Cairo University' },
    { id: 'K-6004', beneficiaryId: 'B-3011', beneficiaryName: 'Ahmed Mansour', beneficiaryNameAr: 'أحمد منصور', sponsorId: 'DN-010', sponsorName: 'Nour Adel', sponsorNameAr: 'نور عادل', type: 'student', monthlyAmount: 1200, startDate: '2024-01-20', paidMonths: 9, remainingMonths: 15, totalPaid: 10800, status: 'active', notes: 'High school student' },
    { id: 'K-6005', beneficiaryId: 'B-3009', beneficiaryName: 'Kamal Abdel-Aziz', beneficiaryNameAr: 'كامال عبد العزيز', sponsorId: 'DN-009', sponsorName: 'Khalid Corporation', sponsorNameAr: 'مؤسسة خالد', type: 'patient', monthlyAmount: 3000, startDate: '2022-05-14', paidMonths: 30, remainingMonths: 0, totalPaid: 90000, status: 'completed', notes: 'Full recovery — sponsorship completed' },
    { id: 'K-6006', beneficiaryId: 'B-3001', beneficiaryName: 'Amina Said', beneficiaryNameAr: 'أمينة سعيد', sponsorId: 'DN-006', sponsorName: 'Yousef Trading Co.', sponsorNameAr: 'شركة يوسف للتجارة', type: 'family', monthlyAmount: 2000, startDate: '2022-01-15', paidMonths: 24, remainingMonths: 0, totalPaid: 48000, status: 'paused', notes: 'Paused pending review' },
  ]);

  readonly volunteers = signal<Volunteer[]>([
    { id: 'V-7001', name: 'Omar Adel', nameAr: 'عمر عادل', role: 'Field Coordinator', roleAr: 'منسق ميداني', phone: '+20 100 900 0001', email: 'omar.a@example.com', city: 'Cairo', hours: 340, tasksCompleted: 87, rating: 4.9, joinedAt: '2022-03-10', status: 'active' },
    { id: 'V-7002', name: 'Sara Hosny', nameAr: 'سارة حسني', role: 'Medical Volunteer', roleAr: 'متطوعة طبية', phone: '+20 100 900 0002', email: 'sara.h@example.com', city: 'Giza', hours: 220, tasksCompleted: 62, rating: 4.8, joinedAt: '2023-01-15', status: 'active' },
    { id: 'V-7003', name: 'Khaled Mahmoud', nameAr: 'خالد محمود', role: 'Driver', roleAr: 'سائق', phone: '+20 100 900 0003', email: 'khaled.m@example.com', city: 'Cairo', hours: 480, tasksCompleted: 142, rating: 4.7, joinedAt: '2021-06-20', status: 'active' },
    { id: 'V-7004', name: 'Nour Mostafa', nameAr: 'نور مصطفى', role: 'Teacher (Education)', roleAr: 'معلمة (التعليم)', phone: '+20 100 900 0004', email: 'nour.m@example.com', city: 'Alexandria', hours: 180, tasksCompleted: 48, rating: 5.0, joinedAt: '2023-09-01', status: 'active' },
    { id: 'V-7005', name: 'Tarek Nabil', nameAr: 'طارق نبيل', role: 'Logistics', roleAr: 'لوجستيات', phone: '+20 100 900 0005', email: 'tarek.n@example.com', city: 'Cairo', hours: 290, tasksCompleted: 78, rating: 4.6, joinedAt: '2022-11-08', status: 'active' },
    { id: 'V-7006', name: 'Hana Samir', nameAr: 'هنا سمير', role: 'Social Worker', roleAr: 'أخصائية اجتماعية', phone: '+20 100 900 0006', email: 'hana.s@example.com', city: 'Cairo', hours: 160, tasksCompleted: 42, rating: 4.9, joinedAt: '2023-04-12', status: 'on-leave' },
    { id: 'V-7007', name: 'Mohamed Reda', nameAr: 'محمد رضا', role: 'IT Support', roleAr: 'دعم تقني', phone: '+20 100 900 0007', email: 'm.reda@example.com', city: 'Cairo', hours: 110, tasksCompleted: 24, rating: 4.5, joinedAt: '2024-02-20', status: 'active' },
    { id: 'V-7008', name: 'Layla Fathy', nameAr: 'ليلى فتحي', role: 'Photographer', roleAr: 'مصورة', phone: '+20 100 900 0008', email: 'layla.f@example.com', city: 'Cairo', hours: 60, tasksCompleted: 12, rating: 4.7, joinedAt: '2024-08-10', status: 'inactive' },
  ]);

  readonly expenses = signal<Expense[]>([
    { id: 'E-8001', category: 'Water Projects', categoryAr: 'مشاريع المياه', amount: 42000, projectId: 'P-4001', description: 'Drilling equipment for Well #12', descriptionAr: 'معدات حفر للبئر رقم 12', date: '2024-12-08', approvedBy: 'Board Committee', status: 'paid', method: 'cheque' },
    { id: 'E-8002', category: 'Salaries', categoryAr: 'رواتب', amount: 85000, description: 'December staff salaries', descriptionAr: 'رواتب الموظفين لشهر ديسمبر', date: '2024-12-05', approvedBy: 'Executive Director', status: 'paid', method: 'bank' },
    { id: 'E-8003', category: 'Office Rent', categoryAr: 'إيجار المكتب', amount: 15000, description: 'December office rent', descriptionAr: 'إيجار المكتب لشهر ديسمبر', date: '2024-12-03', approvedBy: 'Executive Director', status: 'paid', method: 'bank' },
    { id: 'E-8004', category: 'Food Supplies', categoryAr: 'مواد غذائية', amount: 68000, projectId: 'P-4003', description: 'Food baskets for 500 families', descriptionAr: 'سلال غذائية لـ 500 أسرة', date: '2024-12-02', approvedBy: 'Board Committee', status: 'approved', method: 'bank' },
    { id: 'E-8005', category: 'Medical Supplies', categoryAr: 'مستلزمات طبية', amount: 120000, projectId: 'P-4004', description: 'Medications and equipment', descriptionAr: 'أدوية ومعدات', date: '2024-12-01', approvedBy: 'Medical Committee', status: 'paid', method: 'cheque' },
    { id: 'E-8006', category: 'Marketing', categoryAr: 'تسويق', amount: 22000, description: 'Social media campaigns December', descriptionAr: 'حملات سوشيال ميديا ديسمبر', date: '2024-11-30', approvedBy: 'Executive Director', status: 'pending', method: 'bank' },
    { id: 'E-8007', category: 'Utilities', categoryAr: 'مرافق', amount: 8500, description: 'Electricity & water bills', descriptionAr: 'فواتير الكهرباء والمياه', date: '2024-11-28', approvedBy: 'Executive Director', status: 'paid', method: 'bank' },
    { id: 'E-8008', category: 'Waqf Construction', categoryAr: 'بناء أوقاف', amount: 180000, projectId: 'P-4009', description: 'Mosque #2 construction phase 1', descriptionAr: 'المرحلة الأولى من بناء المسجد رقم 2', date: '2024-11-25', approvedBy: 'Board Committee', status: 'approved', method: 'cheque' },
  ]);

  readonly distributions = signal<Distribution[]>([
    { id: 'DS-9001', beneficiaryId: 'B-3001', beneficiaryName: 'Amina Said', beneficiaryNameAr: 'أمينة سعيد', aidType: 'cash', aidTypeAr: 'نقدية', amount: 2000, quantity: 1, unit: 'monthly', unitAr: 'شهري', date: '2024-12-01', distributedBy: 'Omar Adel', location: 'El-Marg Office', locationAr: 'مكتب المرج', signature: true },
    { id: 'DS-9002', beneficiaryId: 'B-3002', beneficiaryName: 'Youssef Abdel-Rahman', beneficiaryNameAr: 'يوسف عبد الرحمن', aidType: 'cash', aidTypeAr: 'نقدية', amount: 1500, quantity: 1, unit: 'monthly', unitAr: 'شهري', date: '2024-12-01', distributedBy: 'Sara Hosny', location: 'Nasr City Office', locationAr: 'مكتب مدينة نصر', signature: true },
    { id: 'DS-9003', beneficiaryId: 'B-3003', beneficiaryName: 'Hassan Abdel-Fattah', beneficiaryNameAr: 'حسن عبد الفتاح', aidType: 'food', aidTypeAr: 'غذائية', amount: 800, quantity: 1, unit: 'basket', unitAr: 'سلة', date: '2024-12-02', distributedBy: 'Khaled Mahmoud', location: 'Boulaq Distribution Center', locationAr: 'مركز توزيع بولاق', signature: true },
    { id: 'DS-9004', beneficiaryId: 'B-3004', beneficiaryName: 'Fatima Ahmed', beneficiaryNameAr: 'فاطمة أحمد', aidType: 'medical', aidTypeAr: 'طبية', amount: 3500, quantity: 1, unit: 'treatment', unitAr: 'علاج', date: '2024-12-02', distributedBy: 'Sara Hosny', location: 'Helwan Medical Center', locationAr: 'مركز حلوان الطبي', signature: true },
    { id: 'DS-9005', beneficiaryId: 'B-3005', beneficiaryName: 'Mohamed El-Sayed', beneficiaryNameAr: 'محمد السيد', aidType: 'school', aidTypeAr: 'مدرسية', amount: 600, quantity: 1, unit: 'kit', unitAr: 'حقيبة', date: '2024-12-01', distributedBy: 'Nour Mostafa', location: 'Minya Office', locationAr: 'مكتب المنيا', signature: true },
    { id: 'DS-9006', beneficiaryId: 'B-3006', beneficiaryName: 'Zeinab Farghaly', beneficiaryNameAr: 'زينب فرغلي', aidType: 'cash', aidTypeAr: 'نقدية', amount: 1800, quantity: 1, unit: 'monthly', unitAr: 'شهري', date: '2024-11-28', distributedBy: 'Omar Adel', location: 'Sidi Gaber Office', locationAr: 'مكتب سيدي جابر', signature: true },
    { id: 'DS-9007', beneficiaryId: 'B-3007', beneficiaryName: 'Ibrahim Abdel-Latif', beneficiaryNameAr: 'إبراهيم عبد اللطيف', aidType: 'winter', aidTypeAr: 'شتوية', amount: 1500, quantity: 4, unit: 'items', unitAr: 'قطعة', date: '2024-12-03', distributedBy: 'Tarek Nabil', location: 'Sohag Office', locationAr: 'مكتب سوهاج', signature: false },
    { id: 'DS-9008', beneficiaryId: 'B-3009', beneficiaryName: 'Kamal Abdel-Aziz', beneficiaryNameAr: 'كمال عبد العزيز', aidType: 'medical', aidTypeAr: 'طبية', amount: 4500, quantity: 1, unit: 'treatment', unitAr: 'علاج', date: '2024-12-04', distributedBy: 'Sara Hosny', location: 'Abbasiya Hospital', locationAr: 'مستشفى العباسية', signature: true },
    { id: 'DS-9009', beneficiaryId: 'B-3010', beneficiaryName: 'Hoda Ibrahim', beneficiaryNameAr: 'هدى إبراهيم', aidType: 'cash', aidTypeAr: 'نقدية', amount: 1800, quantity: 1, unit: 'monthly', unitAr: 'شهري', date: '2024-12-01', distributedBy: 'Hana Samir', location: 'Haram Office', locationAr: 'مكتب الهرم', signature: true },
    { id: 'DS-9010', beneficiaryId: 'B-3012', beneficiaryName: 'Mona Khalil', beneficiaryNameAr: 'منى خليل', aidType: 'medical', aidTypeAr: 'طبية', amount: 2200, quantity: 1, unit: 'monthly', unitAr: 'شهري', date: '2024-12-03', distributedBy: 'Sara Hosny', location: 'Zamalek Clinic', locationAr: 'عيادة الزمالك', signature: true },
    { id: 'DS-9011', beneficiaryId: 'B-3014', beneficiaryName: 'Layla Fahmy', beneficiaryNameAr: 'ليلى فهمي', aidType: 'food', aidTypeAr: 'غذائية', amount: 900, quantity: 2, unit: 'baskets', unitAr: 'سلة', date: '2024-12-04', distributedBy: 'Khaled Mahmoud', location: 'Ain Shams Center', locationAr: 'مركز عين شمس', signature: true },
    { id: 'DS-9012', beneficiaryId: 'B-3011', beneficiaryName: 'Ahmed Mansour', beneficiaryNameAr: 'أحمد منصور', aidType: 'cash', aidTypeAr: 'نقدية', amount: 1200, quantity: 1, unit: 'monthly', unitAr: 'شهري', date: '2024-12-02', distributedBy: 'Omar Adel', location: 'Assiut Office', locationAr: 'مكتب أسيوط', signature: true },
  ]);

  readonly recentActivity = signal([
    { id: 1, icon: '💝', color: '#34c759', action: 'New donation received', actionAr: 'تم استلام تبرع جديد', detail: 'Ahmed Mohamed — 50,000 EGP (Zakat)', detailAr: 'أحمد محمد — 50,000 جنيه (زكاة)', time: '2m ago' },
    { id: 2, icon: '📦', color: '#007aff', action: 'Distribution completed', actionAr: 'تم إتمام توزيع', detail: '12 families in El-Marg district', detailAr: '12 أسرة في منطقة المرج', time: '18m ago' },
    { id: 3, icon: '🤝', color: '#af52de', action: 'New volunteer joined', actionAr: 'انضم متطوع جديد', detail: 'Mohamed Reda — IT Support', detailAr: 'محمد رضا — دعم تقني', time: '1h ago' },
    { id: 4, icon: '🏗', color: '#ff9500', action: 'Project milestone reached', actionAr: 'تم الوصول لمرحلة في المشروع', detail: 'Water Wells Project — 73% complete', detailAr: 'مشروع الآبار — 73% مكتمل', time: '3h ago' },
    { id: 5, icon: '🎯', color: '#ff3b30', action: 'Campaign milestone', actionAr: 'إنجاز في الحملة', detail: 'Winter Warmth — 71% of target', detailAr: 'شتاء دافئ — 71% من الهدف', time: '5h ago' },
    { id: 6, icon: '✉️', color: '#007aff', action: 'Thank-you letters sent', actionAr: 'تم إرسال رسائل الشكر', detail: '48 letters to December donors', detailAr: '48 رسالة لمتبرعي ديسمبر', time: '1d ago' },
  ]);

  readonly nav = computed<PreviewNavItem[]>(() => [
    { id: 'dashboard', label: this.t('Dashboard', 'لوحة التحكم'), icon: '📊', group: this.t('Overview', 'نظرة عامة') },
    { id: 'donations', label: this.t('Donations', 'التبرعات'), icon: '💝', badge: this.donations().length, group: this.t('Finance', 'المالية') },
    { id: 'donors', label: this.t('Donors', 'المتبرعون'), icon: '⭐', badge: this.donors().length, group: this.t('Finance', 'المالية') },
    { id: 'expenses', label: this.t('Expenses', 'المصروفات'), icon: '💸', badge: this.expenses().length, group: this.t('Finance', 'المالية') },
    { id: 'beneficiaries', label: this.t('Beneficiaries', 'المستفيدون'), icon: '👥', badge: this.beneficiaries().length, group: this.t('Programs', 'البرامج') },
    { id: 'kaffala', label: this.t('Kaffala', 'الكفالات'), icon: '🤲', badge: this.kaffalas().length, group: this.t('Programs', 'البرامج') },
    { id: 'distribution', label: this.t('Distribution', 'التوزيعات'), icon: '📦', badge: this.distributions().length, group: this.t('Programs', 'البرامج') },
    { id: 'projects', label: this.t('Projects', 'المشاريع'), icon: '🏗', badge: this.projects().length, group: this.t('Initiatives', 'المبادرات') },
    { id: 'campaigns', label: this.t('Campaigns', 'الحملات'), icon: '📢', badge: this.campaigns().length, group: this.t('Initiatives', 'المبادرات') },
    { id: 'volunteers', label: this.t('Volunteers', 'المتطوعون'), icon: '🤝', badge: this.volunteers().length, group: this.t('Initiatives', 'المبادرات') },
    { id: 'reports', label: this.t('Reports', 'التقارير'), icon: '📈', group: this.t('Analytics', 'التحليلات') },
    { id: 'settings', label: this.t('Settings', 'الإعدادات'), icon: '⚙️', group: this.t('Analytics', 'التحليلات') },
  ]);

  readonly toolbar = computed<ToolbarAction[]>(() => [
    { id: 'refresh', label: this.t('Refresh', 'تحديث'), icon: '⟳', action: () => this.toast.success(this.t('Refreshed', 'تم التحديث')) },
    { id: 'new-donation', label: this.t('New donation', 'تبرع جديد'), icon: '💝', primary: true, action: () => this.createDonation() },
  ]);

  readonly notifs = computed<PreviewNotification[]>(() => [
    { id: 1, icon: '💝', title: this.t('Large donation received', 'تم استلام تبرع كبير'), body: '250,000 EGP from Fatima Co.', time: '12m' },
    { id: 2, icon: '🎯', title: this.t('Campaign ending soon', 'حملة تنتهي قريباً'), body: 'Winter Warmth — 23 days left', time: '1h' },
    { id: 3, icon: '📦', title: this.t('Distribution pending', 'توزيع معلق'), body: '5 families awaiting aid', time: '3h' },
    { id: 4, icon: '✅', title: this.t('Monthly report ready', 'التقرير الشهري جاهز'), body: 'November 2024 summary', time: '5h' },
  ]);

  readonly searchPlaceholder = computed(() =>
    this.active() === 'donations' ? this.t('Search donations…', 'ابحث في التبرعات…') :
      this.active() === 'donors' ? this.t('Search donors…', 'ابحث عن متبرع…') :
        this.active() === 'beneficiaries' ? this.t('Search beneficiaries…', 'ابحث عن مستفيد…') : ''
  );

  readonly segmentFilters = [
    { id: 'all', label: 'All', labelAr: 'الكل', icon: '📁' },
    { id: 'platinum', label: 'Platinum', labelAr: 'بلاتيني', icon: '💎' },
    { id: 'gold', label: 'Gold', labelAr: 'ذهبي', icon: '🥇' },
    { id: 'silver', label: 'Silver', labelAr: 'فضي', icon: '🥈' },
    { id: 'bronze', label: 'Bronze', labelAr: 'برونزي', icon: '🥉' },
  ];

  readonly categoryFilters = [
    { id: 'all', label: 'All', labelAr: 'الكل', icon: '📁' },
    { id: 'orphan', label: 'Orphans', labelAr: 'أيتام', icon: '👦' },
    { id: 'widow', label: 'Widows', labelAr: 'أرامل', icon: '👩' },
    { id: 'disabled', label: 'Disabled', labelAr: 'ذوو إعاقة', icon: '♿' },
    { id: 'elderly', label: 'Elderly', labelAr: 'مسنون', icon: '👴' },
    { id: 'poor', label: 'Poor families', labelAr: 'أسر متعففة', icon: '🏚' },
    { id: 'student', label: 'Students', labelAr: 'طلاب', icon: '🎓' },
    { id: 'patient', label: 'Patients', labelAr: 'مرضى', icon: '🏥' },
  ];


  readonly totalDonations = computed(() => this.donations().reduce((s, d) => s + d.amount, 0));
  readonly totalExpenses = computed(() => this.expenses().reduce((s, e) => s + e.amount, 0));
  readonly totalDistributed = computed(() => this.distributions().reduce((s, d) => s + d.amount, 0));
  readonly totalKaffalaMonthly = computed(() => this.kaffalas().filter(k => k.status === 'active').reduce((s, k) => s + k.monthlyAmount, 0));
  readonly totalBeneficiariesMembers = computed(() => this.beneficiaries().reduce((s, b) => s + b.familySize, 0));

  readonly activeProjectsCount = computed(() => this.projects().filter(p => p.status === 'active').length);
  readonly activeCampaignsCount = computed(() => this.campaigns().filter(c => c.status === 'active' || c.status === 'ending-soon').length);
  readonly activeVolunteersCount = computed(() => this.volunteers().filter(v => v.status === 'active').length);
  readonly vipDonorsCount = computed(() => this.donors().filter(d => d.status === 'vip').length);

  readonly featuredCampaigns = computed(() => this.campaigns().filter(c => c.featured && c.status !== 'completed'));
  readonly recentDonations = computed(() => [...this.donations()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5));
  readonly topDonors = computed(() => [...this.donors()].sort((a, b) => b.totalDonated - a.totalDonated).slice(0, 5));
  readonly activeProjects = computed(() => this.projects().filter(p => p.status === 'active'));

  readonly equationBalanced = computed(() => {
    const donations = this.totalDonations();
    const expenses = this.totalExpenses();
    return donations > expenses;
  });

  readonly dashboardKpis = computed(() => [
    { icon: '💝', label: this.t('Total donations', 'إجمالي التبرعات'), value: (this.totalDonations() / 1000).toFixed(0) + 'K', color: '#34c759', trend: '+22%', trendUp: true, go: () => this.active.set('donations') },
    { icon: '👥', label: this.t('Beneficiaries', 'المستفيدون'), value: this.beneficiaries().length.toString(), color: '#007aff', trend: '+8', trendUp: true, go: () => this.active.set('beneficiaries') },
    { icon: '🏗', label: this.t('Active projects', 'المشاريع النشطة'), value: this.activeProjectsCount().toString(), color: '#ff9500', trend: '+2', trendUp: true, go: () => this.active.set('projects') },
    { icon: '🤝', label: this.t('Volunteers', 'المتطوعون'), value: this.volunteers().length.toString(), color: '#af52de', trend: '+5', trendUp: true, go: () => this.active.set('volunteers') },
  ]);

  readonly monthlyDonations = computed(() => {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const max = 400000;
    const raw = months.map((m, i) => {
      const zakat = 80000 + i * 8000 + Math.random() * 20000;
      const sadaqah = 120000 + i * 12000 + Math.random() * 25000;
      const kaffala = 60000 + i * 5000 + Math.random() * 15000;
      const total = zakat + sadaqah + kaffala;
      const expense = total * (0.55 + Math.random() * 0.15);
      return { month: m, zakat, sadaqah, kaffala, total, expense };
    });
    const maxTotal = Math.max(...raw.map(r => r.total));
    return raw.map(r => ({
      ...r,
      zakatPct: (r.zakat / maxTotal) * 100,
      sadaqahPct: (r.sadaqah / maxTotal) * 100,
      kaffalaPct: (r.kaffala / maxTotal) * 100,
      totalPct: (r.total / maxTotal) * 100,
      expensePct: (r.expense / maxTotal) * 100,
    }));
  });

  readonly donationTypeBreakdown = computed(() => {
    const types = ['zakat', 'sadaqah', 'kaffala', 'waqf', 'qurbani', 'ramadan', 'fidyah'] as const;
    const colors: Record<string, string> = {
      zakat: '#34c759', sadaqah: '#007aff', kaffala: '#ff9500',
      waqf: '#af52de', qurbani: '#ff3b30', ramadan: '#5856d6', fidyah: '#8e8e93',
    };
    const total = this.donations().length;
    return types.map(t => {
      const filtered = this.donations().filter(d => d.type === t);
      const amount = filtered.reduce((s, d) => s + d.amount, 0);
      return {
        label: t.charAt(0).toUpperCase() + t.slice(1),
        labelAr: this.donationTypeAr(t),
        icon: this.donationTypeIcon(t),
        color: colors[t],
        count: filtered.length,
        amount,
        pct: total ? (filtered.length / total) * 100 : 0,
      };
    }).filter(x => x.count > 0);
  });

  readonly filteredDonations = computed(() => {
    const f = this.donationFilter();
    let list = this.donations();
    if (f !== 'all') list = list.filter(d => d.status === f);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(d =>
      d.donorName.toLowerCase().includes(q) ||
      d.donorNameAr.includes(q) ||
      d.receiptNo.toLowerCase().includes(q) ||
      d.purpose.toLowerCase().includes(q)
    );
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  });

  readonly filteredDonationTotal = computed(() => this.filteredDonations().reduce((s, d) => s + d.amount, 0));

  readonly donationStats = computed(() => {
    const all = this.donations();
    return [
      { icon: '💝', label: this.t('Total donations', 'إجمالي التبرعات'), value: this.totalDonations().toLocaleString() + ' EGP', color: '#34c759' },
      { icon: '⏳', label: this.t('Pending', 'معلقة'), value: all.filter(d => d.status === 'pending').length.toString(), color: '#ff9500' },
      { icon: '✅', label: this.t('Receipted', 'مستلمة إيصال'), value: all.filter(d => d.status === 'receipted').length.toString(), color: '#007aff' },
      { icon: '📊', label: this.t('Average', 'المتوسط'), value: Math.round(this.totalDonations() / all.length).toLocaleString() + ' EGP', color: '#af52de' },
    ];
  });

  readonly filteredDonors = computed(() => {
    const s = this.donorSegmentFilter();
    let list = this.donors();
    if (s !== 'all') list = list.filter(d => d.segment === s);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.nameAr.includes(q) ||
      d.email.toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q)
    );
    return [...list].sort((a, b) => b.totalDonated - a.totalDonated);
  });

  readonly filteredBeneficiaries = computed(() => {
    const c = this.beneficiaryCategoryFilter();
    let list = this.beneficiaries();
    if (c !== 'all') list = list.filter(b => b.category === c);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.nameAr.includes(q) ||
      b.nationalId.includes(q)
    );
    return list;
  });

  readonly kaffalaStats = computed(() => {
    const active = this.kaffalas().filter(k => k.status === 'active');
    return [
      { icon: '🤲', label: this.t('Active kaffalas', 'كفالات نشطة'), value: active.length.toString(), color: '#34c759' },
      { icon: '💵', label: this.t('Monthly total', 'الإجمالي الشهري'), value: this.totalKaffalaMonthly().toLocaleString() + ' EGP', color: '#007aff' },
      { icon: '👶', label: this.t('Orphans', 'أيتام'), value: this.kaffalas().filter(k => k.type === 'orphan').length.toString(), color: '#ff9500' },
      { icon: '🎓', label: this.t('Students', 'طلاب'), value: this.kaffalas().filter(k => k.type === 'student').length.toString(), color: '#af52de' },
    ];
  });

  readonly volunteerStats = computed(() => [
    { icon: '🤝', label: this.t('Total volunteers', 'إجمالي المتطوعين'), value: this.volunteers().length.toString(), color: '#34c759' },
    { icon: '✅', label: this.t('Active', 'نشط'), value: this.activeVolunteersCount().toString(), color: '#007aff' },
    { icon: '⏱', label: this.t('Total hours', 'إجمالي الساعات'), value: this.volunteers().reduce((s, v) => s + v.hours, 0).toString(), color: '#ff9500' },
    { icon: '⭐', label: this.t('Avg rating', 'متوسط التقييم'), value: (this.volunteers().reduce((s, v) => s + v.rating, 0) / this.volunteers().length).toFixed(2), color: '#af52de' },
  ]);

  readonly expenseStats = computed(() => {
    const byStatus = (s: string) => this.expenses().filter(e => e.status === s).length;
    return [
      { icon: '💸', label: this.t('Total expenses', 'إجمالي المصروفات'), value: this.totalExpenses().toLocaleString() + ' EGP', color: '#ff3b30' },
      { icon: '✅', label: this.t('Paid', 'مدفوع'), value: byStatus('paid').toString(), color: '#34c759' },
      { icon: '⏳', label: this.t('Pending', 'معلق'), value: byStatus('pending').toString(), color: '#ff9500' },
      { icon: '📊', label: this.t('Approved', 'موافق عليه'), value: byStatus('approved').toString(), color: '#007aff' },
    ];
  });

  readonly distributionStats = computed(() => [
    { icon: '📦', label: this.t('Total distributions', 'إجمالي التوزيعات'), value: this.distributions().length.toString(), color: '#34c759' },
    { icon: '💰', label: this.t('Total value', 'القيمة الإجمالية'), value: this.totalDistributed().toLocaleString() + ' EGP', color: '#007aff' },
    { icon: '✍️', label: this.t('Signed', 'موقّع'), value: this.distributions().filter(d => d.signature).length.toString(), color: '#af52de' },
    { icon: '⚠️', label: this.t('Unsigned', 'بدون توقيع'), value: this.distributions().filter(d => !d.signature).length.toString(), color: '#ff9500' },
  ]);

  readonly reportKpis = computed(() => [
    { icon: '💝', label: this.t('Total donations', 'إجمالي التبرعات'), value: (this.totalDonations() / 1000).toFixed(0) + 'K', color: '#34c759' },
    { icon: '💸', label: this.t('Total expenses', 'إجمالي المصروفات'), value: (this.totalExpenses() / 1000).toFixed(0) + 'K', color: '#ff3b30' },
    { icon: '📈', label: this.t('Net balance', 'الرصيد الصافي'), value: ((this.totalDonations() - this.totalExpenses()) / 1000).toFixed(0) + 'K', color: '#007aff' },
    { icon: '🎯', label: this.t('Admin overhead', 'المصروفات الإدارية'), value: '8%', color: '#af52de' },
  ]);

  readonly distributionBreakdown = computed(() => {
    const types = ['cash', 'food', 'clothing', 'medical', 'school', 'winter'] as const;
    const colors: Record<string, string> = {
      cash: '#34c759', food: '#ff9500', clothing: '#af52de',
      medical: '#ff3b30', school: '#007aff', winter: '#5856d6',
    };
    const icons: Record<string, string> = {
      cash: '💵', food: '🍞', clothing: '👕', medical: '💊', school: '📚', winter: '🧥',
    };
    const total = this.distributions().length;
    return types.map(t => {
      const filtered = this.distributions().filter(d => d.aidType === t);
      return {
        label: t.charAt(0).toUpperCase() + t.slice(1),
        labelAr: this.aidTypeAr(t),
        icon: icons[t],
        color: colors[t],
        count: filtered.length,
        pct: total ? (filtered.length / total) * 100 : 0,
      };
    }).filter(x => x.count > 0);
  });


  readonly orgSettings = [
    { key: 'orgName', label: 'Organization name (AR)', labelAr: 'اسم الجمعية (عربي)', desc: 'Legal name', descAr: 'الاسم القانوني' },
    { key: 'orgNameEn', label: 'Organization name (EN)', labelAr: 'اسم الجمعية (إنجليزي)', desc: 'English name', descAr: 'الاسم الإنجليزي' },
    { key: 'licenseNo', label: 'License number', labelAr: 'رقم الترخيص', desc: 'Ministry of Social Affairs', descAr: 'وزارة الشؤون الاجتماعية' },
    { key: 'taxId', label: 'Tax ID', labelAr: 'الرقم الضريبي', desc: 'Tax registration number', descAr: 'الرقم الضريبي' },
    { key: 'address', label: 'Address', labelAr: 'العنوان', desc: 'Registered office', descAr: 'المقر المسجل' },
    { key: 'phone', label: 'Phone', labelAr: 'الهاتف', desc: 'Main phone line', descAr: 'الخط الرئيسي' },
    { key: 'email', label: 'Email', labelAr: 'البريد الإلكتروني', desc: 'Public contact', descAr: 'بريد التواصل' },
    { key: 'website', label: 'Website', labelAr: 'الموقع الإلكتروني', desc: 'Public website', descAr: 'الموقع العام' },
  ];

  readonly finSettings = [
    { key: 'currency', label: 'Currency', labelAr: 'العملة', desc: 'Base currency', descAr: 'العملة الأساسية', type: 'text' },
    { key: 'zakatRate', label: 'Zakat rate (%)', labelAr: 'نسبة الزكاة (%)', desc: 'Standard zakat rate', descAr: 'النسبة الشرعية', type: 'number' },
    { key: 'adminFeePercent', label: 'Admin overhead (%)', labelAr: 'المصروفات الإدارية (%)', desc: 'Administrative overhead', descAr: 'نسبة المصاريف الإدارية', type: 'number' },
    { key: 'requireApprovalOver', label: 'Approval threshold', labelAr: 'حد الموافقة', desc: 'Requires approval over amount', descAr: 'يتطلب موافقة فوق المبلغ', type: 'number' },
    { key: 'autoReceipt', label: 'Auto-generate receipts', labelAr: 'توليد إيصالات تلقائياً', desc: 'Print receipt on confirm', descAr: 'طباعة إيصال عند التأكيد', type: 'toggle' },
    { key: 'sendThankYou', label: 'Send thank-you letters', labelAr: 'إرسال رسائل شكر', desc: 'Auto-email donors', descAr: 'إرسال بريد آلي للمتبرعين', type: 'toggle' },
    { key: 'monthlyReport', label: 'Auto monthly report', labelAr: 'تقرير شهري تلقائي', desc: 'Board PDF on 1st of month', descAr: 'تقرير PDF في أول كل شهر', type: 'toggle' },
  ];


  t(en: string, ar: string): string { return this.lang() === 'ar' ? ar : en; }
  onNav(id: string): void { this.active.set(id as BwtView); }
  onSearch(q: string): void { this.searchQuery.set(q); }
  initials(name: string): string { return name.split(' ').slice(0, 2).map(n => n.charAt(0)).join(''); }

  countDonorsBySegment(id: string): number {
    if (id === 'all') return this.donors().length;
    return this.donors().filter(d => d.segment === id).length;
  }

  countBeneficiariesByCategory(id: string): number {
    if (id === 'all') return this.beneficiaries().length;
    return this.beneficiaries().filter(b => b.category === id).length;
  }

  donationsOfDonor(donorId: string): Donation[] {
    return this.donations().filter(d => d.donorId === donorId);
  }

  donationTypeAr(t: string): string {
    const map: Record<string, string> = {
      zakat: 'زكاة', sadaqah: 'صدقة', kaffala: 'كفالة',
      waqf: 'وقف', fidyah: 'فدية', qurbani: 'أضحية', ramadan: 'رمضان',
    };
    return map[t] ?? t;
  }
  donationTypeIcon(t: string): string {
    const map: Record<string, string> = {
      zakat: '🕌', sadaqah: '🤲', kaffala: '👶',
      waqf: '🏛', fidyah: '🍽', qurbani: '🐏', ramadan: '🌙',
    };
    return map[t] ?? '💝';
  }
  donationTypeColor(t: string): string {
    const map: Record<string, string> = {
      zakat: '#34c759', sadaqah: '#007aff', kaffala: '#ff9500',
      waqf: '#af52de', fidyah: '#8e8e93', qurbani: '#ff3b30', ramadan: '#5856d6',
    };
    return map[t] ?? '#007aff';
  }
  donationStatusAr(s: string): string {
    const map: Record<string, string> = {
      pending: 'معلقة', confirmed: 'مؤكدة', receipted: 'مستلمة', refunded: 'مرتجعة',
    };
    return map[s] ?? s;
  }
  methodAr(m: string): string {
    const map: Record<string, string> = {
      cash: 'نقدي', bank: 'تحويل بنكي', online: 'أونلاين', wallet: 'محفظة', cheque: 'شيك',
    };
    return map[m] ?? m;
  }
  categoryIcon(c: string): string {
    const map: Record<string, string> = {
      orphan: '👦', widow: '👩', disabled: '♿', elderly: '👴',
      poor: '🏚', student: '🎓', patient: '🏥', graduated: '🎓',
    };
    return map[c] ?? '👤';
  }
  categoryAr(c: string): string {
    const map: Record<string, string> = {
      orphan: 'يتيم', widow: 'أرملة', disabled: 'ذوو إعاقة', elderly: 'مسن',
      poor: 'أسرة متعففة', student: 'طالب', patient: 'مريض', graduated: 'متخرج',
    };
    return map[c] ?? c;
  }
  beneficiaryStatusAr(s: string): string {
    const map: Record<string, string> = {
      active: 'نشط', pending: 'قيد المراجعة', graduated: 'متخرج', suspended: 'موقوف',
    };
    return map[s] ?? s;
  }
  projectCategoryAr(c: string): string {
    const map: Record<string, string> = {
      water: 'مياه', orphan: 'أيتام', food: 'طعام', medical: 'طبي',
      education: 'تعليم', housing: 'إسكان', ramadan: 'رمضان',
      emergency: 'طوارئ', mosque: 'مساجد',
    };
    return map[c] ?? c;
  }
  projectStatusAr(s: string): string {
    const map: Record<string, string> = {
      planning: 'قيد التخطيط', active: 'نشط', completed: 'مكتمل', paused: 'موقوف',
    };
    return map[s] ?? s;
  }
  campaignStatusAr(s: string): string {
    const map: Record<string, string> = {
      active: 'نشطة', 'ending-soon': 'تنتهي قريباً', completed: 'مكتملة', draft: 'مسودة',
    };
    return map[s] ?? s;
  }
  kaffalaTypeAr(t: string): string {
    const map: Record<string, string> = {
      orphan: 'يتيم', student: 'طالب', family: 'أسرة', patient: 'مريض',
    };
    return map[t] ?? t;
  }
  kaffalaStatusAr(s: string): string {
    const map: Record<string, string> = {
      active: 'نشطة', completed: 'مكتملة', paused: 'موقوفة', cancelled: 'ملغاة',
    };
    return map[s] ?? s;
  }
  volunteerStatusAr(s: string): string {
    const map: Record<string, string> = {
      active: 'نشط', 'on-leave': 'في إجازة', inactive: 'غير نشط',
    };
    return map[s] ?? s;
  }
  expenseStatusAr(s: string): string {
    const map: Record<string, string> = {
      pending: 'معلق', approved: 'موافق عليه', paid: 'مدفوع', rejected: 'مرفوض',
    };
    return map[s] ?? s;
  }
  aidTypeAr(t: string): string {
    const map: Record<string, string> = {
      cash: 'نقدية', food: 'غذائية', clothing: 'ملابس', medical: 'طبية',
      school: 'مدرسية', winter: 'شتوية',
    };
    return map[t] ?? t;
  }

  openDonation(id: string): void {
    const d = this.donations().find(x => x.id === id);
    if (d) this.selectedDonation.set(d);
  }
  openDonor(id: string): void {
    const d = this.donors().find(x => x.id === id);
    if (d) this.selectedDonor.set(d);
  }
  openBeneficiary(id: string): void {
    const b = this.beneficiaries().find(x => x.id === id);
    if (b) this.selectedBeneficiary.set(b);
  }
  openProject(id: string): void {
    const p = this.projects().find(x => x.id === id);
    if (p) this.selectedProject.set(p);
  }
  openCampaign(id: string): void {
    const c = this.campaigns().find(x => x.id === id);
    if (c) this.toast.info(this.t(c.name, c.nameAr), `${c.raised.toLocaleString()} / ${c.target.toLocaleString()} EGP`);
  }
  openKaffala(id: string): void {
    const k = this.kaffalas().find(x => x.id === id);
    if (k) this.toast.info(this.t(k.beneficiaryName, k.beneficiaryNameAr), `${k.monthlyAmount.toLocaleString()} EGP × ${k.paidMonths}`);
  }
  openVolunteer(id: string): void {
    const v = this.volunteers().find(x => x.id === id);
    if (v) this.toast.info(this.t(v.name, v.nameAr), `${v.hours}h · ⭐ ${v.rating}`);
  }
  openExpense(id: string): void {
    const e = this.expenses().find(x => x.id === id);
    if (e) this.toast.info(this.t(e.category, e.categoryAr), `${e.amount.toLocaleString()} EGP · ${e.status}`);
  }
  openDistribution(id: string): void {
    const d = this.distributions().find(x => x.id === id);
    if (d) this.toast.info(this.t(d.beneficiaryName, d.beneficiaryNameAr), `${d.amount.toLocaleString()} EGP · ${d.aidType}`);
  }

  createDonation(): void { this.toast.success(this.t('New donation form', 'نموذج تبرع جديد'), this.t('Coming soon', 'قريباً')); }
  createDonationFor(donorId: string): void {
    const d = this.donors().find(x => x.id === donorId);
    this.selectedDonor.set(null);
    this.toast.success(this.t('New donation', 'تبرع جديد'), d ? this.t(d.name, d.nameAr) : '');
  }
  createDonor(): void { this.toast.success(this.t('Add new donor', 'إضافة متبرع جديد')); }
  createBeneficiary(): void { this.toast.success(this.t('Register new family', 'تسجيل أسرة جديدة')); }
  createProject(): void { this.toast.success(this.t('New project', 'مشروع جديد')); }
  createCampaign(): void { this.toast.success(this.t('New campaign', 'حملة جديدة')); }
  createKaffala(): void { this.toast.success(this.t('New kaffala', 'كفالة جديدة')); }
  createVolunteer(): void { this.toast.success(this.t('Add volunteer', 'إضافة متطوع')); }
  createExpense(): void { this.toast.success(this.t('New expense', 'مصروف جديد')); }
  createDistribution(): void { this.toast.success(this.t('New distribution', 'توزيع جديد')); }

  confirmDonation(id: string): void {
    this.donations.update(list => list.map(d => d.id === id ? { ...d, status: 'receipted' as const } : d));
    this.selectedDonation.set(null);
    this.toast.success(this.t('Donation confirmed', 'تم تأكيد التبرع'), id);
  }
  printDonation(d: Donation): void {
    this.toast.info(this.t('Printing receipt', 'جاري طباعة الإيصال'), d.receiptNo);
  }
  sendThankYou(d: Donor): void {
    this.toast.success(this.t('Thank-you letter sent', 'تم إرسال رسالة الشكر'), this.t(d.name, d.nameAr));
  }
  scheduleDistribution(beneId: string): void {
    const b = this.beneficiaries().find(x => x.id === beneId);
    this.selectedBeneficiary.set(null);
    this.toast.success(this.t('Distribution scheduled', 'تم جدولة التوزيع'), b ? this.t(b.name, b.nameAr) : '');
  }
  printProject(p: Project): void {
    this.toast.info(this.t('Generating project report', 'جاري إنشاء تقرير المشروع'), this.t(p.name, p.nameAr));
  }
  exportReport(): void { this.toast.success(this.t('Exporting PDF report', 'تصدير تقرير PDF')); }

  onDonationContext(ev: MouseEvent, d: Donation): void {
    ev.preventDefault(); ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: this.t('View receipt', 'عرض الإيصال'), icon: '👁', action: () => this.openDonation(d.id) },
      { id: 'print', label: this.t('Print', 'طباعة'), icon: '🖨', action: () => this.printDonation(d) },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      { id: 'copy', label: this.t('Copy receipt #', 'نسخ رقم الإيصال'), icon: '📋', action: () => { navigator.clipboard?.writeText(d.receiptNo); this.toast.success(this.t('Copied', 'تم النسخ')); } },
    ]);
  }
  onDonorContext(ev: MouseEvent, d: Donor): void {
    ev.preventDefault(); ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: this.t('View profile', 'عرض الملف'), icon: '👁', action: () => this.openDonor(d.id) },
      { id: 'thank', label: this.t('Send thank-you', 'إرسال شكر'), icon: '✉', action: () => this.sendThankYou(d) },
      { id: 'new', label: this.t('New donation', 'تبرع جديد'), icon: '💝', action: () => this.createDonationFor(d.id) },
    ]);
  }

  settingValue(key: string): any { return this.settingsStore()[key]; }
  updateSetting(key: string, value: any): void { this.settingsStore.update(s => ({ ...s, [key]: value })); }
  toggleSetting(key: string): void { this.settingsStore.update(s => ({ ...s, [key]: !s[key] })); }
  saveSettings(): void { this.toast.success(this.t('Settings saved', 'تم حفظ الإعدادات')); }
  closePeriod(): void {
    this.periodClosed.update(v => !v);
    this.toast.warning(this.periodClosed() ? this.t('Period closed', 'تم إقفال الفترة') : this.t('Period reopened', 'تم إعادة فتح الفترة'));
  }
  backupData(): void { this.toast.success(this.t('Backup started', 'بدأ النسخ الاحتياطي')); }
}