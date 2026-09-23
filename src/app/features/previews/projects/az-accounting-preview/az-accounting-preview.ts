import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PreviewShellComponent, PreviewNavItem, ToolbarAction, PreviewNotification } from '../../shared/preview-shell/preview-shell';

type AZView =
  | 'dashboard' | 'coa' | 'journal' | 'ledger' | 'trial' | 'bs' | 'is' | 'cf'
  | 'invoices' | 'bills' | 'payments' | 'customers' | 'vendors'
  | 'bank' | 'assets' | 'payroll' | 'vat' | 'budgets'
  | 'reports' | 'audit' | 'settings';

type Lang = 'en' | 'ar';

interface Account {
  code: string;
  name: string;
  nameAr: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subtype: string;
  parent?: string;
  balance: number;
  debit: number;
  credit: number;
  currency: string;
  active: boolean;
}

interface JournalLine {
  account: string;
  accountName: string;
  accountNameAr: string;
  debit: number;
  credit: number;
  memo?: string;
}

interface JournalEntry {
  id: string;
  ref: string;
  date: string;
  description: string;
  descriptionAr: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  status: 'draft' | 'posted' | 'void';
  createdBy: string;
  postedAt?: string;
  source: 'manual' | 'invoice' | 'bill' | 'payment' | 'payroll';
}

interface Invoice {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  customerNameAr: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  vat: number;
  total: number;
  paid: number;
  balance: number;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  items: number;
  currency: string;
}

interface Bill {
  id: string;
  number: string;
  vendorId: string;
  vendorName: string;
  vendorNameAr: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  vat: number;
  total: number;
  paid: number;
  balance: number;
  status: 'draft' | 'received' | 'partial' | 'paid' | 'overdue';
  items: number;
}

interface Payment {
  id: string;
  ref: string;
  date: string;
  type: 'received' | 'made';
  partyId: string;
  partyName: string;
  partyNameAr: string;
  amount: number;
  method: 'cash' | 'bank' | 'cheque' | 'online';
  reference?: string;
  relatedTo: { type: 'invoice' | 'bill'; id: string; number: string; };
  status: 'pending' | 'cleared' | 'bounced';
}

interface Customer {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  taxId: string;
  address: string;
  city: string;
  country: string;
  creditLimit: number;
  balance: number;
  totalInvoiced: number;
  totalPaid: number;
  createdAt: string;
  status: 'active' | 'inactive' | 'hold';
}

interface Vendor {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  taxId: string;
  category: string;
  balance: number;
  totalBilled: number;
  totalPaid: number;
  createdAt: string;
  status: 'active' | 'inactive';
}

interface BankAccount {
  id: string;
  bank: string;
  accountNumber: string;
  iban: string;
  currency: string;
  balance: number;
  unReconciled: number;
  lastReconciled: string;
  type: 'checking' | 'savings' | 'credit';
}

interface Asset {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  purchaseDate: string;
  cost: number;
  salvageValue: number;
  usefulLife: number;
  method: 'straight-line' | 'declining' | 'units';
  accumulatedDepreciation: number;
  bookValue: number;
  monthlyDepreciation: number;
  location: string;
  status: 'active' | 'disposed' | 'fully-depreciated';
}

interface Employee {
  id: string;
  name: string;
  nameAr: string;
  position: string;
  department: string;
  hireDate: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  bankAccount: string;
  taxId: string;
  status: 'active' | 'on-leave' | 'terminated';
}

interface Budget {
  id: string;
  name: string;
  nameAr: string;
  accountCode: string;
  accountName: string;
  period: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePct: number;
}

interface VatRecord {
  id: string;
  period: string;
  output: number;
  input: number;
  payable: number;
  filedAt: string;
  status: 'draft' | 'filed' | 'paid';
  ref: string;
}

interface AuditEntry {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  actionAr: string;
  entity: string;
  entityId: string;
  details: string;
  ip: string;
}

interface ArAgingBucket {
  bucket: string;
  bucketAr: string;
  amount: number;
  count: number;
  pct: number;
}

@Component({
  selector: 'app-az-accounting-preview',
  standalone: true,
  imports: [PreviewShellComponent, DecimalPipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="💰"
      title="AZ Accounting"
      [subtitle]="lang() === 'ar' ? 'نظام محاسبة متكامل · 14% ضريبة قيمة مضافة' : 'Full Accounting Suite · 14% VAT'"
      [nav]="nav()"
      [active]="active()"
      (activeChange)="onNav($any($event))"
      [toolbarActions]="toolbar()"
      [notifications]="notifs()"
      [searchPlaceholder]="searchPlaceholder()"
      (searchChange)="onSearch($event)"
    >
      <div class="az-bar">
        <div class="lang-switch">
          <button class="ls-btn" [class.active]="lang() === 'en'" (click)="lang.set('en')">EN</button>
          <button class="ls-btn" [class.active]="lang() === 'ar'" (click)="lang.set('ar')">AR</button>
        </div>
        <div class="fy-pill">
          <span class="fy-label">{{ t('Fiscal Year', 'السنة المالية') }}</span>
          <b>2024 / 2025</b>
        </div>
        <div class="currency-pill">
          <span>EGP</span>
        </div>
        <div class="status-pill" [class.closed]="periodClosed()">
          <span class="status-dot"></span>
          <span>{{ periodClosed() ? t('Period Closed', 'الفترة مقفلة') : t('Period Open', 'الفترة مفتوحة') }}</span>
        </div>
      </div>

      @switch (active()) {

        @case ('dashboard') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Overview', 'نظرة عامة') }}</span>
                <h3>{{ t('Financial Dashboard', 'لوحة التحكم المالية') }}</h3>
                <p>{{ t('Real-time snapshot of your books', 'نظرة فورية على دفاترك') }}</p>
              </div>
              <div class="view-actions">
                <button class="pill" (click)="active.set('journal')">📝 {{ t('New entry', 'قيد جديد') }}</button>
                <button class="pill primary" (click)="active.set('invoices')">＋ {{ t('New invoice', 'فاتورة جديدة') }}</button>
              </div>
            </header>

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

            <section class="accounting-equation">
              <div class="eq-side assets">
                <span class="eq-label">{{ t('Assets', 'الأصول') }}</span>
                <b class="eq-val">{{ totalAssets() | number }} EGP</b>
              </div>
              <span class="eq-op">=</span>
              <div class="eq-side liab">
                <span class="eq-label">{{ t('Liabilities', 'الالتزامات') }}</span>
                <b class="eq-val">{{ totalLiabilities() | number }} EGP</b>
              </div>
              <span class="eq-op">+</span>
              <div class="eq-side equity">
                <span class="eq-label">{{ t('Equity', 'حقوق الملكية') }}</span>
                <b class="eq-val">{{ totalEquity() | number }} EGP</b>
              </div>
              <span class="eq-check" [class.balanced]="equationBalanced()">
                {{ equationBalanced() ? '✓' : '✗' }}
              </span>
            </section>

            <div class="grid-2">
              <section class="card">
                <header class="card-head">
                  <div>
                    <h4>{{ t('Revenue vs Expenses', 'الإيرادات مقابل المصروفات') }}</h4>
                    <small>{{ t('Last 6 months', 'آخر 6 أشهر') }}</small>
                  </div>
                  <div class="legend-row">
                    <span><i class="dot" style="background:#34c759"></i> {{ t('Revenue', 'الإيرادات') }}</span>
                    <span><i class="dot" style="background:#ff3b30"></i> {{ t('Expenses', 'المصروفات') }}</span>
                  </div>
                </header>
                <div class="dual-chart">
                  @for (m of monthlyPnL(); track m.month) {
                    <div class="dc-group">
                      <div class="dc-bars">
                        <div class="dc-bar green" [style.height.%]="m.revPct"></div>
                        <div class="dc-bar red" [style.height.%]="m.expPct"></div>
                      </div>
                      <span class="dc-label">{{ m.month }}</span>
                    </div>
                  }
                </div>
              </section>

              <section class="card">
                <header class="card-head">
                  <div>
                    <h4>{{ t('AR Aging', 'أعمار الذمم المدينة') }}</h4>
                    <small>{{ t('Outstanding invoices', 'الفواتير غير المسددة') }}</small>
                  </div>
                </header>
                <ul class="aging-list">
                  @for (b of arAging(); track b.bucket) {
                    <li class="aging-row">
                      <span class="ag-label">{{ t(b.bucket, b.bucketAr) }}</span>
                      <div class="ag-track"><div class="ag-fill" [style.width.%]="b.pct" [attr.data-b]="b.bucket"></div></div>
                      <span class="ag-amount mono">{{ b.amount | number }}</span>
                      <span class="ag-count">{{ b.count }}</span>
                    </li>
                  }
                </ul>
              </section>
            </div>

            <div class="grid-2">
              <section class="card">
                <header class="card-head">
                  <div>
                    <h4>{{ t('Recent journal entries', 'أحدث قيود اليومية') }}</h4>
                    <small>{{ entries().length }} {{ t('total', 'إجمالي') }}</small>
                  </div>
                  <button class="pill-sm" (click)="active.set('journal')">{{ t('View all', 'عرض الكل') }}</button>
                </header>
                <ul class="feed">
                  @for (e of recentEntries(); track e.id) {
                    <li class="feed-item" (click)="openEntry(e.id)">
                      <span class="fi-icon" [attr.data-s]="e.status">{{ e.status === 'posted' ? '✓' : e.status === 'draft' ? '✎' : '✕' }}</span>
                      <div class="fi-body">
                        <div class="fi-row">
                          <b>{{ e.ref }}</b>
                          <span class="fi-status" [attr.data-s]="e.status">{{ t(e.status, entryStatusAr(e.status)) }}</span>
                        </div>
                        <div class="fi-meta">
                          <span>{{ t(e.description, e.descriptionAr) }}</span>
                          <span class="mono">{{ e.date }}</span>
                        </div>
                        <div class="fi-amounts">
                          <span class="mono">Dr {{ e.totalDebit | number }}</span>
                          <span class="mono">Cr {{ e.totalCredit | number }}</span>
                        </div>
                      </div>
                    </li>
                  }
                </ul>
              </section>

              <section class="card">
                <header class="card-head">
                  <div>
                    <h4>{{ t('Cash flow — this month', 'التدفق النقدي — هذا الشهر') }}</h4>
                    <small>{{ t('Inflow vs outflow', 'داخل مقابل خارج') }}</small>
                  </div>
                </header>
                <div class="cash-summary">
                  <div class="cs-row in">
                    <span class="cs-icon">↓</span>
                    <div>
                      <small>{{ t('Inflow', 'داخل') }}</small>
                      <b class="mono">{{ cashIn() | number }} EGP</b>
                    </div>
                  </div>
                  <div class="cs-row out">
                    <span class="cs-icon">↑</span>
                    <div>
                      <small>{{ t('Outflow', 'خارج') }}</small>
                      <b class="mono">{{ cashOut() | number }} EGP</b>
                    </div>
                  </div>
                  <div class="cs-row net" [class.pos]="cashNet() > 0" [class.neg]="cashNet() < 0">
                    <span class="cs-icon">=</span>
                    <div>
                      <small>{{ t('Net cash', 'الصافي') }}</small>
                      <b class="mono">{{ cashNet() | number }} EGP</b>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <section class="card">
              <header class="card-head"><h4>{{ t('Top accounts by balance', 'أعلى الحسابات بالرصيد') }}</h4></header>
              <div class="top-accounts">
                @for (a of topAccounts(); track a.code) {
                  <div class="ta-row" [style.--c]="accountTypeColor(a.type)" (click)="openAccount(a.code)">
                    <span class="ta-code mono">{{ a.code }}</span>
                    <div class="ta-info">
                      <b>{{ t(a.name, a.nameAr) }}</b>
                      <small>{{ t(a.type, accountTypeAr(a.type)) }}</small>
                    </div>
                    <span class="ta-balance mono">{{ a.balance | number }} EGP</span>
                  </div>
                }
              </div>
            </section>
          </div>
        }

        @case ('coa') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Structure', 'الهيكل') }}</span>
                <h3>{{ t('Chart of Accounts', 'دليل الحسابات') }}</h3>
                <p>{{ accounts().length }} {{ t('accounts', 'حساب') }} · 5 {{ t('main types', 'أنواع رئيسية') }}</p>
              </div>
              <div class="view-actions">
                <button class="pill primary" (click)="toast.success(t('New account', 'حساب جديد'), t('Coming soon', 'قريباً'))">＋ {{ t('New account', 'حساب جديد') }}</button>
              </div>
            </header>

            <section class="coa-types">
              @for (tp of accountTypes; track tp.id) {
                <button class="ct-chip" [class.active]="coaFilter() === tp.id" [style.--c]="tp.color" (click)="coaFilter.set($any(tp.id))">
                  <span class="ct-icon">{{ tp.icon }}</span>
                  <span>{{ t(tp.label, tp.labelAr) }}</span>
                  <span class="ct-count">{{ countByType(tp.id) }}</span>
                </button>
              }
            </section>

            <div class="coa-list">
              @for (a of filteredAccounts(); track a.code) {
                <div class="coa-row" [attr.data-t]="a.type" (contextmenu)="onAccountContext($event, a)" (click)="openAccount(a.code)">
                  <span class="coa-code mono">{{ a.code }}</span>
                  <div class="coa-info">
                    <b>{{ t(a.name, a.nameAr) }}</b>
                    <small>{{ t(a.subtype, subtypeAr(a.subtype)) }}</small>
                  </div>
                  <div class="coa-amounts">
                    <div class="ca-col">
                      <small>{{ t('Debit', 'مدين') }}</small>
                      <span class="mono">{{ a.debit | number }}</span>
                    </div>
                    <div class="ca-col">
                      <small>{{ t('Credit', 'دائن') }}</small>
                      <span class="mono">{{ a.credit | number }}</span>
                    </div>
                    <div class="ca-col balance">
                      <small>{{ t('Balance', 'الرصيد') }}</small>
                      <span class="mono" [style.color]="accountTypeColor(a.type)">{{ a.balance | number }}</span>
                    </div>
                  </div>
                  <span class="coa-type" [style.background]="accountTypeColor(a.type) + '22'" [style.color]="accountTypeColor(a.type)">
                    {{ t(a.type, accountTypeAr(a.type)) }}
                  </span>
                </div>
              }
            </div>
          </div>
        }

        @case ('journal') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Bookkeeping', 'الدفاتر') }}</span>
                <h3>{{ t('Journal Entries', 'قيود اليومية') }}</h3>
                <p>{{ filteredEntries().length }} {{ t('of', 'من') }} {{ entries().length }} {{ t('entries', 'قيد') }}</p>
              </div>
              <div class="view-actions">
                <select class="sel" [ngModel]="entryFilter()" (ngModelChange)="entryFilter.set($event)">
                  <option value="all">{{ t('All statuses', 'كل الحالات') }}</option>
                  <option value="draft">{{ t('Draft', 'مسودة') }}</option>
                  <option value="posted">{{ t('Posted', 'مُرحّل') }}</option>
                  <option value="void">{{ t('Void', 'ملغى') }}</option>
                </select>
                <button class="pill primary" (click)="createEntry()">＋ {{ t('New entry', 'قيد جديد') }}</button>
              </div>
            </header>

            <div class="journal-summary">
              @for (s of journalStats(); track s.label) {
                <div class="js-card" [style.--c]="s.color">
                  <b class="mono">{{ s.value }}</b>
                  <small>{{ s.label }}</small>
                </div>
              }
            </div>

            <div class="journal-list">
              @for (e of filteredEntries(); track e.id) {
                <article class="je-card" [attr.data-s]="e.status" (contextmenu)="onEntryContext($event, e)">
                  <header class="je-head">
                    <div class="je-left">
                      <span class="je-ref mono">{{ e.ref }}</span>
                      <span class="je-status" [attr.data-s]="e.status">{{ t(e.status, entryStatusAr(e.status)) }}</span>
                      <span class="je-source" [attr.data-src]="e.source">{{ t(e.source, sourceAr(e.source)) }}</span>
                    </div>
                    <div class="je-right">
                      <span class="je-date mono">{{ e.date }}</span>
                      <span class="je-user">👤 {{ e.createdBy }}</span>
                    </div>
                  </header>
                  <p class="je-desc">{{ t(e.description, e.descriptionAr) }}</p>
                  <div class="je-lines">
                    <header class="jl-head">
                      <span>{{ t('Account', 'الحساب') }}</span>
                      <span>{{ t('Debit', 'مدين') }}</span>
                      <span>{{ t('Credit', 'دائن') }}</span>
                    </header>
                    @for (l of e.lines; track $index) {
                      <div class="jl-row">
                        <span class="jl-account">
                          <span class="mono">{{ l.account }}</span>
                          <span>{{ t(l.accountName, l.accountNameAr) }}</span>
                        </span>
                        <span class="mono jl-debit">{{ l.debit > 0 ? (l.debit | number) : '—' }}</span>
                        <span class="mono jl-credit">{{ l.credit > 0 ? (l.credit | number) : '—' }}</span>
                      </div>
                    }
                    <div class="jl-total">
                      <span>{{ t('Totals', 'الإجمالي') }}</span>
                      <span class="mono">{{ e.totalDebit | number }}</span>
                      <span class="mono">{{ e.totalCredit | number }}</span>
                    </div>
                  </div>
                  @if (e.status === 'draft') {
                    <footer class="je-foot">
                      <button class="pill-sm primary" (click)="postEntry(e.id)">✓ {{ t('Post', 'ترحيل') }}</button>
                      <button class="pill-sm" (click)="openEntry(e.id)">✎ {{ t('Edit', 'تعديل') }}</button>
                      <button class="pill-sm danger" (click)="voidEntry(e.id)">✕ {{ t('Void', 'إلغاء') }}</button>
                    </footer>
                  }
                </article>
              }
            </div>
          </div>
        }

        @case ('ledger') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Ledger', 'دفتر الأستاذ') }}</span>
                <h3>{{ t('General Ledger', 'دفتر الأستاذ العام') }}</h3>
                <p>{{ t('Transactions for', 'حركات') }} <b>{{ t(selectedAccount()?.name ?? '', selectedAccount()?.nameAr ?? '') }}</b></p>
              </div>
              <div class="view-actions">
                <select class="sel" [ngModel]="ledgerAccount()" (ngModelChange)="ledgerAccount.set($event)">
                  @for (a of accounts().slice(0, 20); track a.code) {
                    <option [value]="a.code">{{ a.code }} — {{ t(a.name, a.nameAr) }}</option>
                  }
                </select>
              </div>
            </header>

            @if (selectedAccount(); as acc) {
              <section class="ledger-head-card" [style.--c]="accountTypeColor(acc.type)">
                <div class="lh-left">
                  <span class="lh-code mono">{{ acc.code }}</span>
                  <div>
                    <h4>{{ t(acc.name, acc.nameAr) }}</h4>
                    <small>{{ t(acc.type, accountTypeAr(acc.type)) }} · {{ t(acc.subtype, subtypeAr(acc.subtype)) }}</small>
                  </div>
                </div>
                <div class="lh-stats">
                  <div><small>{{ t('Opening', 'افتتاحي') }}</small><b class="mono">{{ openingBalance() | number }}</b></div>
                  <div><small>{{ t('Debits', 'مدين') }}</small><b class="mono">{{ acc.debit | number }}</b></div>
                  <div><small>{{ t('Credits', 'دائن') }}</small><b class="mono">{{ acc.credit | number }}</b></div>
                  <div class="final"><small>{{ t('Closing', 'ختامي') }}</small><b class="mono">{{ acc.balance | number }}</b></div>
                </div>
              </section>

              <div class="ledger-table">
                <header class="lg-head">
                  <span>{{ t('Date', 'التاريخ') }}</span>
                  <span>{{ t('Ref', 'المرجع') }}</span>
                  <span>{{ t('Description', 'الوصف') }}</span>
                  <span>{{ t('Debit', 'مدين') }}</span>
                  <span>{{ t('Credit', 'دائن') }}</span>
                  <span>{{ t('Balance', 'الرصيد') }}</span>
                </header>
                @for (row of ledgerRows(); track $index) {
                  <div class="lg-row">
                    <span class="mono small">{{ row.date }}</span>
                    <span class="mono lg-ref">{{ row.ref }}</span>
                    <span>{{ t(row.description, row.descriptionAr) }}</span>
                    <span class="mono amount dr">{{ row.debit > 0 ? (row.debit | number) : '—' }}</span>
                    <span class="mono amount cr">{{ row.credit > 0 ? (row.credit | number) : '—' }}</span>
                    <span class="mono amount bal">{{ row.balance | number }}</span>
                  </div>
                }
              </div>
            }
          </div>
        }

        @case ('trial') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Report', 'تقرير') }}</span>
                <h3>{{ t('Trial Balance', 'ميزان المراجعة') }}</h3>
                <p>{{ t('As of', 'بتاريخ') }} {{ trialAsOf() }}</p>
              </div>
              <div class="view-actions">
                <input type="date" class="sel" [ngModel]="trialAsOf()" (ngModelChange)="trialAsOf.set($event)" />
                <button class="pill" (click)="exportTrial()">📊 {{ t('Export', 'تصدير') }}</button>
              </div>
            </header>

            <div class="tb-summary">
              <div class="tbs-card">
                <small>{{ t('Total Debits', 'إجمالي المدين') }}</small>
                <b class="mono">{{ totalDebits() | number }} EGP</b>
              </div>
              <div class="tbs-card">
                <small>{{ t('Total Credits', 'إجمالي الدائن') }}</small>
                <b class="mono">{{ totalCredits() | number }} EGP</b>
              </div>
              <div class="tbs-card" [class.balanced]="trialBalanced()" [class.unbalanced]="!trialBalanced()">
                <small>{{ t('Status', 'الحالة') }}</small>
                <b>{{ trialBalanced() ? '✓ ' + t('Balanced', 'متوازن') : '✗ ' + t('Unbalanced', 'غير متوازن') }}</b>
              </div>
            </div>

            <div class="tb-table">
              <header class="tb-head">
                <span class="mono">{{ t('Code', 'الكود') }}</span>
                <span>{{ t('Account', 'الحساب') }}</span>
                <span>{{ t('Debit', 'مدين') }}</span>
                <span>{{ t('Credit', 'دائن') }}</span>
              </header>
              @for (a of trialAccounts(); track a.code) {
                <div class="tb-row" [class.total-row]="a.subtype === 'total'">
                  <span class="mono tb-code">{{ a.code }}</span>
                  <span class="tb-name">{{ t(a.name, a.nameAr) }}</span>
                  <span class="mono tb-amount">{{ a.debit > 0 ? (a.debit | number) : '—' }}</span>
                  <span class="mono tb-amount">{{ a.credit > 0 ? (a.credit | number) : '—' }}</span>
                </div>
              }
              <div class="tb-row grand-total">
                <span></span>
                <span class="tb-name">{{ t('GRAND TOTAL', 'الإجمالي العام') }}</span>
                <span class="mono tb-amount">{{ totalDebits() | number }}</span>
                <span class="mono tb-amount">{{ totalCredits() | number }}</span>
              </div>
            </div>
          </div>
        }

        @case ('bs') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Statement', 'قائمة') }}</span>
                <h3>{{ t('Balance Sheet', 'الميزانية العمومية') }}</h3>
                <p>{{ t('As of', 'بتاريخ') }} {{ trialAsOf() }}</p>
              </div>
              <button class="pill" (click)="exportBS()">📊 {{ t('Export PDF', 'تصدير PDF') }}</button>
            </header>

            <div class="bs-grid">
              <section class="bs-side">
                <header class="bs-side-head assets">
                  <span class="bs-icon">🏛</span>
                  <div>
                    <h4>{{ t('Assets', 'الأصول') }}</h4>
                    <small>{{ totalAssets() | number }} EGP</small>
                  </div>
                </header>

                <div class="bs-group">
                  <h5>{{ t('Current Assets', 'الأصول المتداولة') }}</h5>
                  @for (a of assetsBreakdown(); track a.code) {
                    <div class="bs-line" (click)="openAccount(a.code)">
                      <span>{{ t(a.name, a.nameAr) }}</span>
                      <span class="mono">{{ a.balance | number }}</span>
                    </div>
                  }
                </div>

                <div class="bs-group">
                  <h5>{{ t('Non-Current Assets', 'الأصول الثابتة') }}</h5>
                  @for (a of fixedAssetsBreakdown(); track a.code) {
                    <div class="bs-line" (click)="openAccount(a.code)">
                      <span>{{ t(a.name, a.nameAr) }}</span>
                      <span class="mono">{{ a.balance | number }}</span>
                    </div>
                  }
                </div>

                <div class="bs-total">
                  <span>{{ t('TOTAL ASSETS', 'إجمالي الأصول') }}</span>
                  <span class="mono">{{ totalAssets() | number }} EGP</span>
                </div>
              </section>

              <section class="bs-side">
                <header class="bs-side-head liab">
                  <span class="bs-icon">💳</span>
                  <div>
                    <h4>{{ t('Liabilities & Equity', 'الالتزامات وحقوق الملكية') }}</h4>
                    <small>{{ (totalLiabilities() + totalEquity()) | number }} EGP</small>
                  </div>
                </header>

                <div class="bs-group">
                  <h5>{{ t('Current Liabilities', 'الالتزامات المتداولة') }}</h5>
                  @for (a of liabilitiesBreakdown(); track a.code) {
                    <div class="bs-line" (click)="openAccount(a.code)">
                      <span>{{ t(a.name, a.nameAr) }}</span>
                      <span class="mono">{{ a.balance | number }}</span>
                    </div>
                  }
                </div>

                <div class="bs-group">
                  <h5>{{ t('Equity', 'حقوق الملكية') }}</h5>
                  @for (a of equityBreakdown(); track a.code) {
                    <div class="bs-line" (click)="openAccount(a.code)">
                      <span>{{ t(a.name, a.nameAr) }}</span>
                      <span class="mono">{{ a.balance | number }}</span>
                    </div>
                  }
                </div>

                <div class="bs-total">
                  <span>{{ t('TOTAL LIABILITIES + EQUITY', 'إجمالي الالتزامات + حقوق الملكية') }}</span>
                  <span class="mono">{{ (totalLiabilities() + totalEquity()) | number }} EGP</span>
                </div>
              </section>
            </div>

            <div class="bs-check" [class.ok]="equationBalanced()">
              <span class="bc-icon">{{ equationBalanced() ? '✓' : '⚠' }}</span>
              <div>
                <b>{{ equationBalanced() ? t('Balanced', 'متوازنة') : t('Out of balance', 'غير متوازنة') }}</b>
                <small>{{ t('Assets', 'الأصول') }}: {{ totalAssets() | number }} = {{ t('Liabilities + Equity', 'الالتزامات + حقوق الملكية') }}: {{ (totalLiabilities() + totalEquity()) | number }}</small>
              </div>
            </div>
          </div>
        }

        @case ('is') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Statement', 'قائمة') }}</span>
                <h3>{{ t('Income Statement', 'قائمة الدخل') }}</h3>
                <p>{{ t('Period', 'الفترة') }}: 01/01/2024 – 31/12/2024</p>
              </div>
              <button class="pill" (click)="exportIS()">📊 {{ t('Export PDF', 'تصدير PDF') }}</button>
            </header>

            <section class="is-card">
              <div class="is-section">
                <h4>{{ t('Revenue', 'الإيرادات') }}</h4>
                @for (r of revenueBreakdown(); track r.code) {
                  <div class="is-line" (click)="openAccount(r.code)">
                    <span>{{ r.name }}</span>
                    <span class="mono">{{ r.balance | number }} EGP</span>
                  </div>
                }
                <div class="is-subtotal">
                  <span>{{ t('Total Revenue', 'إجمالي الإيرادات') }}</span>
                  <span class="mono">{{ totalRevenue() | number }} EGP</span>
                </div>
              </div>

              <div class="is-section">
                <h4>{{ t('Cost of Goods Sold', 'تكلفة المبيعات') }}</h4>
                @for (c of cogsBreakdown(); track c.code) {
                  <div class="is-line" (click)="openAccount(c.code)">
                    <span>{{ c.name }}</span>
                    <span class="mono">({{ c.balance | number }})</span>
                  </div>
                }
                <div class="is-subtotal">
                  <span>{{ t('Gross Profit', 'الربح الإجمالي') }}</span>
                  <span class="mono">{{ grossProfit() | number }} EGP</span>
                </div>
              </div>

              <div class="is-section">
                <h4>{{ t('Operating Expenses', 'المصروفات التشغيلية') }}</h4>
                @for (e of opexBreakdown(); track e.code) {
                  <div class="is-line" (click)="openAccount(e.code)">
                    <span>{{ e.name }}</span>
                    <span class="mono">({{ e.balance | number }})</span>
                  </div>
                }
                <div class="is-subtotal">
                  <span>{{ t('Total Operating Expenses', 'إجمالي المصروفات') }}</span>
                  <span class="mono">({{ totalOpex() | number }})</span>
                </div>
              </div>

              <div class="is-final" [class.pos]="netIncome() > 0" [class.neg]="netIncome() < 0">
                <span>{{ t('NET INCOME', 'صافي الدخل') }}</span>
                <span class="mono">{{ netIncome() | number }} EGP</span>
              </div>
            </section>

            <div class="grid-2">
              <section class="card">
                <header class="card-head"><h4>{{ t('Key ratios', 'النسب الرئيسية') }}</h4></header>
                <div class="ratios">
                  @for (r of keyRatios(); track r.label) {
                    <div class="ratio-row">
                      <span class="ratio-label">{{ t(r.label, r.labelAr) }}</span>
                      <span class="ratio-value mono">{{ r.value }}</span>
                      <span class="ratio-bench" [class.good]="r.good" [class.warn]="!r.good">{{ r.good ? '✓' : '⚠' }}</span>
                    </div>
                  }
                </div>
              </section>

              <section class="card">
                <header class="card-head"><h4>{{ t('Profit margin trend', 'اتجاه هامش الربح') }}</h4></header>
                <div class="margin-chart">
                  @for (m of monthlyPnL(); track m.month) {
                    <div class="mc-col">
                      <div class="mc-bar" [style.height.%]="m.margin"></div>
                      <span class="mc-label">{{ m.month }}</span>
                      <span class="mc-val mono">{{ m.margin }}%</span>
                    </div>
                  }
                </div>
              </section>
            </div>
          </div>
        }

        @case ('cf') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Statement', 'قائمة') }}</span>
                <h3>{{ t('Cash Flow Statement', 'قائمة التدفقات النقدية') }}</h3>
                <p>{{ t('Indirect method', 'الطريقة غير المباشرة') }}</p>
              </div>
              <button class="pill" (click)="exportCF()">📊 {{ t('Export', 'تصدير') }}</button>
            </header>

            <section class="cf-card">
              <div class="cf-section">
                <h4>① {{ t('Operating Activities', 'الأنشطة التشغيلية') }}</h4>
                <div class="cf-line"><span>{{ t('Net income', 'صافي الدخل') }}</span><span class="mono">{{ netIncome() | number }}</span></div>
                <div class="cf-line"><span>{{ t('Add: Depreciation', 'يُضاف: الإهلاك') }}</span><span class="mono">{{ totalDepreciation() | number }}</span></div>
                <div class="cf-line"><span>{{ t('Change in AR', 'التغير في الذمم المدينة') }}</span><span class="mono">({{ arBalance() | number }})</span></div>
                <div class="cf-line"><span>{{ t('Change in AP', 'التغير في الذمم الدائنة') }}</span><span class="mono">{{ apBalance() | number }}</span></div>
                <div class="cf-line"><span>{{ t('Change in Inventory', 'التغير في المخزون') }}</span><span class="mono">({{ inventoryBalance() | number }})</span></div>
                <div class="cf-sub"><span>{{ t('Net Cash from Operations', 'صافي النقد من التشغيل') }}</span><span class="mono">{{ cfOperating() | number }}</span></div>
              </div>

              <div class="cf-section">
                <h4>② {{ t('Investing Activities', 'الأنشطة الاستثمارية') }}</h4>
                <div class="cf-line"><span>{{ t('Purchase of assets', 'شراء أصول ثابتة') }}</span><span class="mono">({{ cfInvesting() | number }})</span></div>
                <div class="cf-sub"><span>{{ t('Net Cash from Investing', 'صافي النقد من الاستثمار') }}</span><span class="mono">({{ cfInvesting() | number }})</span></div>
              </div>

              <div class="cf-section">
                <h4>③ {{ t('Financing Activities', 'الأنشطة التمويلية') }}</h4>
                <div class="cf-line"><span>{{ t('Loan received', 'قرض مستلم') }}</span><span class="mono">{{ cfFinancing() | number }}</span></div>
                <div class="cf-line"><span>{{ t('Dividends paid', 'توزيعات أرباح') }}</span><span class="mono">(0)</span></div>
                <div class="cf-sub"><span>{{ t('Net Cash from Financing', 'صافي النقد من التمويل') }}</span><span class="mono">{{ cfFinancing() | number }}</span></div>
              </div>

              <div class="cf-final" [class.pos]="cfNet() > 0" [class.neg]="cfNet() < 0">
                <div>
                  <span>{{ t('NET CHANGE IN CASH', 'صافي التغير في النقدية') }}</span>
                  <small>{{ t('Opening', 'رصيد افتتاحي') }}: 850,000 · {{ t('Closing', 'رصيد ختامي') }}: {{ (850000 + cfNet()) | number }}</small>
                </div>
                <span class="mono">{{ cfNet() | number }} EGP</span>
              </div>
            </section>
          </div>
        }

        @case ('invoices') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Sales', 'المبيعات') }}</span>
                <h3>{{ t('Invoices', 'الفواتير') }}</h3>
                <p>{{ invoices().length }} {{ t('total', 'إجمالي') }} · {{ unpaidInvoices() }} {{ t('unpaid', 'غير مدفوعة') }}</p>
              </div>
              <div class="view-actions">
                <select class="sel" [ngModel]="invoiceFilter()" (ngModelChange)="invoiceFilter.set($event)">
                  <option value="all">{{ t('All', 'الكل') }}</option>
                  <option value="draft">{{ t('Draft', 'مسودة') }}</option>
                  <option value="sent">{{ t('Sent', 'مُرسلة') }}</option>
                  <option value="partial">{{ t('Partial', 'مدفوعة جزئياً') }}</option>
                  <option value="paid">{{ t('Paid', 'مدفوعة') }}</option>
                  <option value="overdue">{{ t('Overdue', 'متأخرة') }}</option>
                </select>
                <button class="pill primary" (click)="createInvoice()">＋ {{ t('New invoice', 'فاتورة جديدة') }}</button>
              </div>
            </header>

            <div class="inv-stats">
              @for (s of invoiceStats(); track s.label) {
                <div class="is-card" [style.--c]="s.color">
                  <b class="mono">{{ s.value }}</b>
                  <small>{{ s.label }}</small>
                </div>
              }
            </div>

            <div class="table-wrap">
              <header class="thead cols-7">
                <span>{{ t('Number', 'الرقم') }}</span>
                <span>{{ t('Customer', 'العميل') }}</span>
                <span>{{ t('Issue date', 'تاريخ الإصدار') }}</span>
                <span>{{ t('Due date', 'تاريخ الاستحقاق') }}</span>
                <span>{{ t('Total', 'الإجمالي') }}</span>
                <span>{{ t('Balance', 'المتبقي') }}</span>
                <span>{{ t('Status', 'الحالة') }}</span>
              </header>
              @for (inv of filteredInvoices(); track inv.id) {
                <div class="trow cols-7" (click)="openInvoice(inv.id)" (contextmenu)="onInvoiceContext($event, inv)">
                  <span class="mono inv-num">{{ inv.number }}</span>
                  <span class="cell-name">{{ t(inv.customerName, inv.customerNameAr) }}</span>
                  <span class="mono small">{{ inv.issueDate }}</span>
                  <span class="mono small" [class.overdue]="isOverdue(inv.dueDate)">{{ inv.dueDate }}</span>
                  <span class="mono amount">{{ inv.total | number }}</span>
                  <span class="mono amount" [class.pos]="inv.balance === 0" [class.neg]="inv.balance > 0">{{ inv.balance | number }}</span>
                  <span><span class="st" [attr.data-s]="inv.status">{{ t(inv.status, invStatusAr(inv.status)) }}</span></span>
                </div>
              }
            </div>
          </div>
        }

        @case ('bills') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Purchases', 'المشتريات') }}</span>
                <h3>{{ t('Bills & Vendor Invoices', 'فواتير الموردين') }}</h3>
                <p>{{ bills().length }} {{ t('total', 'إجمالي') }}</p>
              </div>
              <div class="view-actions">
                <select class="sel" [ngModel]="billFilter()" (ngModelChange)="billFilter.set($event)">
                  <option value="all">{{ t('All', 'الكل') }}</option>
                  <option value="received">{{ t('Received', 'مستلمة') }}</option>
                  <option value="partial">{{ t('Partial', 'مدفوعة جزئياً') }}</option>
                  <option value="paid">{{ t('Paid', 'مدفوعة') }}</option>
                  <option value="overdue">{{ t('Overdue', 'متأخرة') }}</option>
                </select>
                <button class="pill primary" (click)="createBill()">＋ {{ t('New bill', 'فاتورة جديدة') }}</button>
              </div>
            </header>

            <div class="inv-stats">
              @for (s of billStats(); track s.label) {
                <div class="is-card" [style.--c]="s.color">
                  <b class="mono">{{ s.value }}</b>
                  <small>{{ s.label }}</small>
                </div>
              }
            </div>

            <div class="table-wrap">
              <header class="thead cols-7">
                <span>{{ t('Number', 'الرقم') }}</span>
                <span>{{ t('Vendor', 'المورد') }}</span>
                <span>{{ t('Issue date', 'تاريخ الإصدار') }}</span>
                <span>{{ t('Due date', 'تاريخ الاستحقاق') }}</span>
                <span>{{ t('Total', 'الإجمالي') }}</span>
                <span>{{ t('Balance', 'المتبقي') }}</span>
                <span>{{ t('Status', 'الحالة') }}</span>
              </header>
              @for (b of filteredBills(); track b.id) {
                <div class="trow cols-7" (click)="openBill(b.id)">
                  <span class="mono inv-num">{{ b.number }}</span>
                  <span class="cell-name">{{ t(b.vendorName, b.vendorNameAr) }}</span>
                  <span class="mono small">{{ b.issueDate }}</span>
                  <span class="mono small" [class.overdue]="isOverdue(b.dueDate)">{{ b.dueDate }}</span>
                  <span class="mono amount">{{ b.total | number }}</span>
                  <span class="mono amount" [class.pos]="b.balance === 0" [class.neg]="b.balance > 0">{{ b.balance | number }}</span>
                  <span><span class="st" [attr.data-s]="b.status">{{ t(b.status, billStatusAr(b.status)) }}</span></span>
                </div>
              }
            </div>
          </div>
        }

        @case ('payments') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Cash', 'النقدية') }}</span>
                <h3>{{ t('Payments', 'المدفوعات') }}</h3>
                <p>{{ payments().length }} {{ t('total', 'إجمالي') }}</p>
              </div>
              <div class="view-actions">
                <button class="pill primary" (click)="recordPayment()">＋ {{ t('Record payment', 'تسجيل دفعة') }}</button>
              </div>
            </header>

            <section class="pay-summary">
              <div class="ps-card in">
                <span class="ps-icon">↓</span>
                <div>
                  <small>{{ t('Received', 'مستلمة') }}</small>
                  <b class="mono">{{ totalReceived() | number }} EGP</b>
                </div>
              </div>
              <div class="ps-card out">
                <span class="ps-icon">↑</span>
                <div>
                  <small>{{ t('Made', 'مدفوعة') }}</small>
                  <b class="mono">{{ totalMade() | number }} EGP</b>
                </div>
              </div>
            </section>

            <div class="payments-list">
              @for (p of payments(); track p.id) {
                <article class="pay-card" [attr.data-t]="p.type" [attr.data-s]="p.status">
                  <header class="pay-head">
                    <span class="pay-icon" [attr.data-t]="p.type">
                      {{ p.type === 'received' ? '↓' : '↑' }}
                    </span>
                    <div class="pay-body">
                      <div class="pay-row">
                        <b>{{ t(p.partyName, p.partyNameAr) }}</b>
                        <span class="pay-amount mono" [class.pos]="p.type === 'received'" [class.neg]="p.type === 'made'">
                          {{ p.type === 'received' ? '+' : '−' }} {{ p.amount | number }} EGP
                        </span>
                      </div>
                      <div class="pay-meta">
                        <span class="mono">{{ p.ref }}</span>
                        <span>·</span>
                        <span class="mono">{{ p.date }}</span>
                        <span>·</span>
                        <span>{{ t(p.method, methodAr(p.method)) }}</span>
                        @if (p.reference) {
                          <span>·</span>
                          <span class="mono">{{ p.reference }}</span>
                        }
                      </div>
                      <div class="pay-related">
                        {{ t('Related to', 'مرتبط بـ') }}
                        <span class="mono">{{ p.relatedTo.number }}</span>
                        ({{ t(p.relatedTo.type, p.relatedTo.type === 'invoice' ? 'فاتورة' : 'فاتورة مورد') }})
                      </div>
                    </div>
                    <span class="pay-status" [attr.data-s]="p.status">{{ t(p.status, payStatusAr(p.status)) }}</span>
                  </header>
                </article>
              }
            </div>
          </div>
        }

        @case ('customers') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Partners', 'الشركاء') }}</span>
                <h3>{{ t('Customers', 'العملاء') }}</h3>
                <p>{{ customers().length }} {{ t('active', 'نشط') }}</p>
              </div>
              <button class="pill primary" (click)="createCustomer()">＋ {{ t('New customer', 'عميل جديد') }}</button>
            </header>

            <div class="customers-grid">
              @for (c of customers(); track c.id) {
                <article class="customer-card" [attr.data-s]="c.status" (click)="openCustomer(c.id)" (contextmenu)="onCustomerContext($event, c)">
                  <header class="cu-head">
                    <span class="cu-avatar">{{ c.name.charAt(0) }}{{ c.nameAr.charAt(0) }}</span>
                    <div>
                      <b>{{ t(c.name, c.nameAr) }}</b>
                      <small class="mono">{{ c.taxId }}</small>
                    </div>
                    <span class="cu-status" [attr.data-s]="c.status">{{ t(c.status, customerStatusAr(c.status)) }}</span>
                  </header>
                  <div class="cu-contact">
                    <span>✉ {{ c.email }}</span>
                    <span>📞 {{ c.phone }}</span>
                    <span>📍 {{ c.city }}, {{ c.country }}</span>
                  </div>
                  <div class="cu-financials">
                    <div><small>{{ t('Invoiced', 'مفوتر') }}</small><b class="mono">{{ c.totalInvoiced | number }}</b></div>
                    <div><small>{{ t('Paid', 'مدفوع') }}</small><b class="mono pos">{{ c.totalPaid | number }}</b></div>
                    <div><small>{{ t('Balance', 'الرصيد') }}</small><b class="mono" [class.neg]="c.balance > 0">{{ c.balance | number }}</b></div>
                  </div>
                  <div class="cu-credit">
                    <div class="cr-head">
                      <span>{{ t('Credit limit', 'حد الائتمان') }}</span>
                      <span class="mono">{{ c.balance | number }} / {{ c.creditLimit | number }}</span>
                    </div>
                    <div class="cr-track"><div class="cr-fill" [style.width.%]="(c.balance / c.creditLimit) * 100" [class.hot]="c.balance / c.creditLimit > 0.8"></div></div>
                  </div>
                </article>
              }
            </div>
          </div>
        }

        @case ('vendors') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Suppliers', 'الموردون') }}</span>
                <h3>{{ t('Vendors', 'الموردون') }}</h3>
                <p>{{ vendors().length }} {{ t('registered', 'مسجل') }}</p>
              </div>
              <button class="pill primary" (click)="createVendor()">＋ {{ t('New vendor', 'مورد جديد') }}</button>
            </header>

            <div class="customers-grid">
              @for (v of vendors(); track v.id) {
                <article class="customer-card" [attr.data-s]="v.status" (click)="openVendor(v.id)">
                  <header class="cu-head">
                    <span class="cu-avatar v">{{ v.name.charAt(0) }}{{ v.nameAr.charAt(0) }}</span>
                    <div>
                      <b>{{ t(v.name, v.nameAr) }}</b>
                      <small class="mono">{{ v.taxId }}</small>
                    </div>
                    <span class="cu-status" [attr.data-s]="v.status">{{ t(v.status, vendorStatusAr(v.status)) }}</span>
                  </header>
                  <div class="cu-contact">
                    <span>✉ {{ v.email }}</span>
                    <span>📞 {{ v.phone }}</span>
                    <span>🏷 {{ v.category }}</span>
                  </div>
                  <div class="cu-financials">
                    <div><small>{{ t('Billed', 'مفوتر') }}</small><b class="mono">{{ v.totalBilled | number }}</b></div>
                    <div><small>{{ t('Paid', 'مدفوع') }}</small><b class="mono pos">{{ v.totalPaid | number }}</b></div>
                    <div><small>{{ t('Balance', 'الرصيد') }}</small><b class="mono" [class.neg]="v.balance > 0">{{ v.balance | number }}</b></div>
                  </div>
                </article>
              }
            </div>
          </div>
        }

        @case ('bank') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Banking', 'البنوك') }}</span>
                <h3>{{ t('Bank Accounts & Reconciliation', 'الحسابات البنكية والتسويات') }}</h3>
                <p>{{ bankAccounts().length }} {{ t('accounts', 'حساب') }} · {{ totalUnreconciled() }} {{ t('items to reconcile', 'بند للتسوية') }}</p>
              </div>
            </header>

            <div class="bank-grid">
              @for (b of bankAccounts(); track b.id) {
                <article class="bank-card" [attr.data-t]="b.type">
                  <header class="bk-head">
                    <span class="bk-icon">🏦</span>
                    <div>
                      <b>{{ b.bank }}</b>
                      <small class="mono">{{ b.accountNumber }}</small>
                    </div>
                    <span class="bk-type">{{ t(b.type, bankTypeAr(b.type)) }}</span>
                  </header>
                  <div class="bk-iban mono">IBAN: {{ b.iban }}</div>
                  <div class="bk-balance">
                    <small>{{ t('Current Balance', 'الرصيد الحالي') }}</small>
                    <b class="mono">{{ b.balance | number }} {{ b.currency }}</b>
                  </div>
                  @if (b.unReconciled > 0) {
                    <div class="bk-alert">
                      ⚠ {{ b.unReconciled }} {{ t('unreconciled items', 'بند غير مُسوّى') }}
                    </div>
                  } @else {
                    <div class="bk-ok">✓ {{ t('Fully reconciled', 'مُسوّى بالكامل') }}</div>
                  }
                  <footer class="bk-foot">
                    <small>{{ t('Last reconciled', 'آخر تسوية') }}: {{ b.lastReconciled }}</small>
                    <button class="pill-sm primary" (click)="reconcileBank(b.id)">{{ t('Reconcile', 'تسوية') }}</button>
                  </footer>
                </article>
              }
            </div>

            <section class="card">
              <header class="card-head"><h4>{{ t('Recent bank transactions', 'أحدث الحركات البنكية') }}</h4></header>
              <div class="table-wrap">
                <header class="thead cols-6">
                  <span>{{ t('Date', 'التاريخ') }}</span>
                  <span>{{ t('Bank', 'البنك') }}</span>
                  <span>{{ t('Description', 'الوصف') }}</span>
                  <span>{{ t('Amount', 'المبلغ') }}</span>
                  <span>{{ t('Reference', 'المرجع') }}</span>
                  <span>{{ t('Status', 'الحالة') }}</span>
                </header>
                @for (tx of bankTransactions(); track tx.id) {
                  <div class="trow cols-6">
                    <span class="mono small">{{ tx.date }}</span>
                    <span>{{ tx.bank }}</span>
                    <span>{{ t(tx.description, tx.descriptionAr) }}</span>
                    <span class="mono amount" [class.pos]="tx.amount > 0" [class.neg]="tx.amount < 0">{{ tx.amount > 0 ? '+' : '' }}{{ tx.amount | number }}</span>
                    <span class="mono small">{{ tx.ref }}</span>
                    <span><span class="st" [attr.data-s]="tx.status">{{ t(tx.status, txStatusAr(tx.status)) }}</span></span>
                  </div>
                }
              </div>
            </section>
          </div>
        }

        @case ('assets') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Fixed Assets', 'الأصول الثابتة') }}</span>
                <h3>{{ t('Assets & Depreciation', 'الأصول والإهلاك') }}</h3>
                <p>{{ assets().length }} {{ t('assets', 'أصل') }} · {{ t('Net book value', 'صافي القيمة الدفترية') }}: {{ totalBookValue() | number }} EGP</p>
              </div>
              <div class="view-actions">
                <button class="pill" (click)="runDepreciation()">⚙ {{ t('Run depreciation', 'تشغيل الإهلاك') }}</button>
                <button class="pill primary" (click)="createAsset()">＋ {{ t('New asset', 'أصل جديد') }}</button>
              </div>
            </header>

            <section class="asset-kpis">
              @for (k of assetKpis(); track k.label) {
                <div class="ak-card" [style.--c]="k.color">
                  <span class="ak-icon">{{ k.icon }}</span>
                  <b class="mono">{{ k.value }}</b>
                  <small>{{ k.label }}</small>
                </div>
              }
            </section>

            <div class="assets-grid">
              @for (a of assets(); track a.id) {
                <article class="asset-card" [attr.data-s]="a.status">
                  <header class="ac-head">
                    <span class="ac-icon">🏗</span>
                    <div>
                      <b>{{ t(a.name, a.nameAr) }}</b>
                      <small>{{ a.category }} · {{ a.location }}</small>
                    </div>
                    <span class="ac-status" [attr.data-s]="a.status">{{ t(a.status, assetStatusAr(a.status)) }}</span>
                  </header>
                  <div class="ac-stats">
                    <div><small>{{ t('Cost', 'التكلفة') }}</small><b class="mono">{{ a.cost | number }}</b></div>
                    <div><small>{{ t('Accum. Dep.', 'الإهلاك المتراكم') }}</small><b class="mono neg">({{ a.accumulatedDepreciation | number }})</b></div>
                    <div><small>{{ t('Book value', 'القيمة الدفترية') }}</small><b class="mono pos">{{ a.bookValue | number }}</b></div>
                  </div>
                  <div class="ac-depreciation">
                    <div class="acd-head">
                      <span>{{ t('Depreciation progress', 'تقدم الإهلاك') }}</span>
                      <span class="mono">{{ depreciatedPct(a) }}%</span>
                    </div>
                    <div class="acd-track">
                      <div class="acd-fill" [style.width.%]="depreciatedPct(a)"></div>
                    </div>
                  </div>
                  <footer class="ac-foot">
                    <span>📅 {{ a.purchaseDate }}</span>
                    <span>{{ t(a.method, methodDepAr(a.method)) }} · {{ a.usefulLife }}y</span>
                    <span class="mono">{{ a.monthlyDepreciation | number }}/mo</span>
                  </footer>
                </article>
              }
            </div>
          </div>
        }

        @case ('payroll') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('HR', 'الموارد البشرية') }}</span>
                <h3>{{ t('Payroll', 'الرواتب') }}</h3>
                <p>{{ employees().length }} {{ t('employees', 'موظف') }} · {{ t('Monthly total', 'الإجمالي الشهري') }}: {{ totalPayroll() | number }} EGP</p>
              </div>
              <div class="view-actions">
                <button class="pill" (click)="exportPayroll()">📊 {{ t('Export bank file', 'تصدير ملف البنك') }}</button>
                <button class="pill primary" (click)="processPayroll()">✓ {{ t('Process payroll', 'معالجة الرواتب') }}</button>
              </div>
            </header>

            <section class="payroll-summary">
              @for (s of payrollSummary(); track s.label) {
                <div class="ps-card-s" [style.--c]="s.color">
                  <small>{{ s.label }}</small>
                  <b class="mono">{{ s.value }}</b>
                </div>
              }
            </section>

            <div class="table-wrap">
              <header class="thead cols-8">
                <span>{{ t('ID', 'الرقم') }}</span>
                <span>{{ t('Employee', 'الموظف') }}</span>
                <span>{{ t('Position', 'المنصب') }}</span>
                <span>{{ t('Base', 'الأساسي') }}</span>
                <span>{{ t('Allowances', 'البدلات') }}</span>
                <span>{{ t('Deductions', 'الخصومات') }}</span>
                <span>{{ t('Net Pay', 'الصافي') }}</span>
                <span>{{ t('Status', 'الحالة') }}</span>
              </header>
              @for (e of employees(); track e.id) {
                <div class="trow cols-8">
                  <span class="mono small">{{ e.id }}</span>
                  <span class="cell-name">{{ t(e.name, e.nameAr) }}</span>
                  <span class="small">{{ e.position }}</span>
                  <span class="mono amount">{{ e.baseSalary | number }}</span>
                  <span class="mono amount pos">{{ e.allowances | number }}</span>
                  <span class="mono amount neg">({{ e.deductions | number }})</span>
                  <span class="mono amount bold">{{ e.netPay | number }}</span>
                  <span><span class="st" [attr.data-s]="e.status">{{ t(e.status, empStatusAr(e.status)) }}</span></span>
                </div>
              }
              <div class="trow total-row cols-8">
                <span></span>
                <span class="cell-name">{{ t('TOTAL', 'الإجمالي') }}</span>
                <span></span>
                <span class="mono amount">{{ totalBase() | number }}</span>
                <span class="mono amount pos">{{ totalAllowances() | number }}</span>
                <span class="mono amount neg">({{ totalDeductions() | number }})</span>
                <span class="mono amount bold">{{ totalPayroll() | number }}</span>
                <span></span>
              </div>
            </div>
          </div>
        }

        @case ('vat') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Compliance', 'الالتزامات') }}</span>
                <h3>{{ t('VAT Returns', 'الإقرارات الضريبية') }}</h3>
                <p>{{ t('Egyptian VAT — 14%', 'ضريبة القيمة المضافة المصرية — 14%') }}</p>
              </div>
              <button class="pill primary" (click)="fileVat()">📤 {{ t('File return', 'تقديم إقرار') }}</button>
            </header>

            <section class="vat-summary">
              <div class="vs-card">
                <span class="vs-icon">↓</span>
                <small>{{ t('Output VAT', 'ضريبة المخرجات') }}</small>
                <b class="mono">{{ totalVatOutput() | number }} EGP</b>
                <small class="vs-hint">{{ t('On sales', 'على المبيعات') }}</small>
              </div>
              <div class="vs-card">
                <span class="vs-icon">↑</span>
                <small>{{ t('Input VAT', 'ضريبة المدخلات') }}</small>
                <b class="mono">{{ totalVatInput() | number }} EGP</b>
                <small class="vs-hint">{{ t('On purchases', 'على المشتريات') }}</small>
              </div>
              <div class="vs-card net">
                <span class="vs-icon">=</span>
                <small>{{ t('Net Payable', 'المستحق') }}</small>
                <b class="mono">{{ (totalVatOutput() - totalVatInput()) | number }} EGP</b>
                <small class="vs-hint">{{ t('To tax authority', 'للهيئة الضريبية') }}</small>
              </div>
            </section>

            <div class="table-wrap">
              <header class="thead cols-6">
                <span>{{ t('Period', 'الفترة') }}</span>
                <span>{{ t('Output VAT', 'ضريبة المخرجات') }}</span>
                <span>{{ t('Input VAT', 'ضريبة المدخلات') }}</span>
                <span>{{ t('Net Payable', 'المستحق') }}</span>
                <span>{{ t('Filed at', 'تاريخ التقديم') }}</span>
                <span>{{ t('Status', 'الحالة') }}</span>
              </header>
              @for (v of vatRecords(); track v.id) {
                <div class="trow cols-6">
                  <span class="mono">{{ v.period }}</span>
                  <span class="mono amount">{{ v.output | number }}</span>
                  <span class="mono amount">{{ v.input | number }}</span>
                  <span class="mono amount bold">{{ v.payable | number }}</span>
                  <span class="mono small">{{ v.filedAt || '—' }}</span>
                  <span><span class="st" [attr.data-s]="v.status">{{ t(v.status, vatStatusAr(v.status)) }}</span></span>
                </div>
              }
            </div>
          </div>
        }

        @case ('budgets') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Planning', 'التخطيط') }}</span>
                <h3>{{ t('Budgets vs Actuals', 'الموازنة مقابل الفعلي') }}</h3>
                <p>{{ t('Period', 'الفترة') }}: 2024</p>
              </div>
              <button class="pill primary" (click)="createBudget()">＋ {{ t('New budget', 'موازنة جديدة') }}</button>
            </header>

            <div class="budget-list">
              @for (b of budgets(); track b.id) {
                <article class="budget-card" [class.over]="b.variance > 0" [class.under]="b.variance < 0">
                  <header class="bg-head">
                    <div>
                      <b>{{ t(b.name, b.nameAr) }}</b>
                      <small class="mono">{{ b.accountCode }} · {{ b.accountName }}</small>
                    </div>
                    <span class="bg-variance" [class.pos]="b.variance < 0" [class.neg]="b.variance > 0">
                      {{ b.variance > 0 ? '+' : '' }}{{ b.variance | number }} ({{ b.variancePct }}%)
                    </span>
                  </header>
                  <div class="bg-bars">
                    <div class="bg-bar">
                      <span class="bb-label">{{ t('Budgeted', 'موازنة') }}</span>
                      <div class="bb-track"><div class="bb-fill budget" [style.width.%]="100"></div></div>
                      <span class="bb-value mono">{{ b.budgeted | number }}</span>
                    </div>
                    <div class="bg-bar">
                      <span class="bb-label">{{ t('Actual', 'الفعلي') }}</span>
                      <div class="bb-track">
                        <div class="bb-fill actual"
                             [style.width.%]="Math.min(100, (b.actual / b.budgeted) * 100)"
                             [class.over]="b.actual > b.budgeted">
                        </div>
                      </div>
                      <span class="bb-value mono">{{ b.actual | number }}</span>
                    </div>
                  </div>
                  <footer class="bg-foot">
                    <span>{{ t('Remaining', 'المتبقي') }}: <b class="mono">{{ (b.budgeted - b.actual) | number }}</b></span>
                    <span>{{ t('Utilization', 'الاستهلاك') }}: <b class="mono">{{ utilizationPct(b) }}%</b></span>
                  </footer>
                </article>
              }
            </div>
          </div>
        }

        @case ('reports') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Output', 'المخرجات') }}</span>
                <h3>{{ t('Financial Reports', 'التقارير المالية') }}</h3>
                <p>{{ t('Generate and export', 'إنشاء وتصدير') }}</p>
              </div>
            </header>

            <section class="report-grid">
              @for (r of reports; track r.id) {
                <article class="report-card" [style.--c]="r.color" (click)="generateReport(r)">
                  <span class="rc-icon">{{ r.icon }}</span>
                  <b>{{ t(r.name, r.nameAr) }}</b>
                  <p>{{ t(r.desc, r.descAr) }}</p>
                  <span class="rc-action">{{ t('Generate →', 'إنشاء →') }}</span>
                </article>
              }
            </section>

            <section class="card">
              <header class="card-head"><h4>{{ t('Scheduled reports', 'تقارير مجدولة') }}</h4></header>
              <ul class="sched-list">
                @for (s of scheduledReports(); track s.id) {
                  <li class="sched-row">
                    <span class="sr-icon">📅</span>
                    <div>
                      <b>{{ t(s.name, s.nameAr) }}</b>
                      <small>{{ t(s.frequency, s.frequencyAr) }} · {{ s.recipient }}</small>
                    </div>
                    <span class="sr-next mono">{{ s.nextRun }}</span>
                    <button class="pill-sm" (click)="toggleSchedule(s.id)">
                      {{ s.enabled ? '⏸' : '▶' }}
                    </button>
                  </li>
                }
              </ul>
            </section>
          </div>
        }

        @case ('audit') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Compliance', 'الالتزامات') }}</span>
                <h3>{{ t('Audit Trail', 'سجل المراجعة') }}</h3>
                <p>{{ auditLog().length }} {{ t('events', 'حدث') }} · {{ t('Last 30 days', 'آخر 30 يوم') }}</p>
              </div>
              <button class="pill" (click)="exportAudit()">⬇ {{ t('Export log', 'تصدير السجل') }}</button>
            </header>

            <div class="audit-list">
              @for (a of auditLog(); track a.id) {
                <article class="audit-row" [attr.data-a]="a.action">
                  <span class="ar-icon">{{ auditIcon(a.action) }}</span>
                  <div class="ar-body">
                    <div class="ar-head">
                      <b>{{ t(a.action, a.actionAr) }}</b>
                      <span class="ar-entity mono">{{ a.entity }} / {{ a.entityId }}</span>
                    </div>
                    <p>{{ a.details }}</p>
                    <div class="ar-meta">
                      <span>👤 {{ a.user }}</span>
                      <span>·</span>
                      <span class="mono">{{ a.timestamp }}</span>
                      <span>·</span>
                      <span class="mono">{{ a.ip }}</span>
                    </div>
                  </div>
                </article>
              }
            </div>
          </div>
        }

        @case ('settings') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Configuration', 'الإعدادات') }}</span>
                <h3>{{ t('Settings', 'الإعدادات') }}</h3>
                <p>{{ t('Company & accounting preferences', 'تفضيلات الشركة والمحاسبة') }}</p>
              </div>
              <button class="pill primary" (click)="saveSettings()">💾 {{ t('Save', 'حفظ') }}</button>
            </header>

            <section class="card">
              <header class="card-head"><h4>{{ t('Company', 'الشركة') }}</h4></header>
              <div class="settings-list">
                @for (s of companySettings; track s.key) {
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
              <header class="card-head"><h4>{{ t('Accounting', 'المحاسبة') }}</h4></header>
              <div class="settings-list">
                @for (s of accountingSettings; track s.key) {
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
                <small>{{ t('Close or lock periods', 'إقفال أو قفل الفترات') }}</small>
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
    </app-preview-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .view { max-width: 1440px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .small { font-size: 10px; }
    .muted { color: var(--label-2); }
    .pos { color: #34c759; }
    .neg { color: #ff3b30; }
    .bold { font-weight: 800; }

    .az-bar { display: flex; align-items: center; gap: 16px; padding: 12px 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); flex-wrap: wrap; }
    .lang-switch { display: flex; gap: 2px; padding: 3px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .ls-btn { padding: 5px 12px; border-radius: calc(var(--r-sm) - 4px); font-size: 11px; font-weight: 700; color: var(--label-2); background: transparent; border: 0; cursor: pointer; }
    .ls-btn.active { background: var(--bg-surface-solid); color: var(--label); box-shadow: var(--shadow-xs); }
    .fy-pill, .currency-pill, .status-pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-size: 11px; }
    .fy-pill b { font-weight: 800; color: var(--accent); }
    .fy-label { color: var(--label-2); font-weight: 600; }
    .currency-pill span { font-family: var(--sf-mono); font-weight: 800; color: var(--accent); }
    .status-pill { font-weight: 700; color: #34c759; }
    .status-pill.closed { color: #ff3b30; }
    .status-pill .status-dot { width: 8px; height: 8px; background: currentColor; border-radius: 50%; box-shadow: 0 0 0 3px currentColor; opacity: 0.4; }
    .status-pill > span:last-child { color: inherit; }
    .status-pill:not(.closed) > span:last-child { color: #34c759; }
    .status-pill.closed > span:last-child { color: #ff3b30; }

    .view-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
    .view-head h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .view-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }
    .eyebrow { display: block; font-size: var(--fs-2xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); margin-bottom: 6px; }
    .view-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

    .pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: var(--bg-fill-2); color: var(--label); border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600; border: 0; cursor: pointer; transition: all 140ms; }
    .pill:hover { background: var(--bg-fill-3); }
    .pill.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill.primary:hover { background: var(--accent-hover); }
    .pill.danger { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .pill-sm { padding: 6px 12px; background: var(--bg-fill-2); color: var(--label); border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 600; border: 0; cursor: pointer; }
    .pill-sm:hover { background: var(--bg-fill-3); }
    .pill-sm.primary { background: var(--accent); color: var(--accent-contrast); }
    .pill-sm.danger { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

    .sel { padding: 7px 12px; background: var(--bg-input); color: var(--label); border: 0.5px solid var(--separator); border-radius: var(--r-sm); font-size: var(--fs-xs); cursor: pointer; outline: none; font-family: inherit; }
    .input-sm { padding: 6px 10px; background: var(--bg-input); color: var(--label); border: 0.5px solid var(--separator); border-radius: var(--r-xs); font-size: var(--fs-xs); outline: none; font-family: inherit; min-width: 140px; }

    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
    .kpi { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-left: 3px solid var(--c, var(--accent)); cursor: pointer; transition: all 180ms; display: flex; flex-direction: column; gap: 4px; }
    .kpi:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .kpi-icon { font-size: 20px; }
    .kpi-val { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
    .kpi-label { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .kpi-trend { font-size: 10px; font-weight: 700; margin-top: 4px; }
    .kpi-trend.up { color: #34c759; }
    .kpi-trend.down { color: #ff3b30; }

    .accounting-equation { display: grid; grid-template-columns: 1fr 40px 1fr 40px 1fr 40px; gap: 12px; padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); align-items: center; }
    @media (max-width: 820px) { .accounting-equation { grid-template-columns: 1fr; gap: 8px; } .eq-op, .eq-check { display: none; } }
    .eq-side { padding: 14px 18px; border-radius: var(--r-sm); text-align: center; display: flex; flex-direction: column; gap: 4px; }
    .eq-side.assets { background: rgba(0, 122, 255, 0.08); }
    .eq-side.liab { background: rgba(255, 149, 0, 0.08); }
    .eq-side.equity { background: rgba(52, 199, 89, 0.08); }
    .eq-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800; color: var(--label-2); }
    .eq-val { font-size: var(--fs-lg); font-weight: 800; font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }
    .eq-op { font-size: 24px; font-weight: 800; text-align: center; color: var(--label-3); }
    .eq-check { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; background: rgba(255, 59, 48, 0.15); color: #ff3b30; font-weight: 800; font-size: 16px; }
    .eq-check.balanced { background: rgba(52, 199, 89, 0.15); color: #34c759; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 820px) { .grid-2 { grid-template-columns: 1fr; } }

    .card { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 14px; }
    .card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .card-head h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .card-head small { font-size: var(--fs-2xs); color: var(--label-2); display: block; margin-top: 2px; }
    .card.danger-zone { border-left: 3px solid #ff3b30; }

    .legend-row { display: flex; gap: 16px; font-size: var(--fs-2xs); color: var(--label-2); flex-wrap: wrap; }
    .legend-row span { display: inline-flex; align-items: center; gap: 6px; }
    .legend-row .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

    .dual-chart { display: flex; align-items: flex-end; gap: 10px; height: 180px; }
    .dc-group { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; }
    .dc-bars { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; gap: 3px; }
    .dc-bar { flex: 1; border-radius: 2px 2px 0 0; min-height: 3px; }
    .dc-bar.green { background: #34c759; }
    .dc-bar.red { background: #ff3b30; }
    .dc-label { font-size: 10px; color: var(--label-2); font-weight: 600; }

    .aging-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .aging-row { display: grid; grid-template-columns: 90px 1fr 110px 40px; gap: 12px; align-items: center; font-size: var(--fs-xs); }
    .ag-label { color: var(--label-2); font-weight: 600; }
    .ag-track { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .ag-fill { height: 100%; background: #34c759; border-radius: var(--r-pill); }
    .ag-fill[data-b='1–30 days'] { background: #ffcc00; }
    .ag-fill[data-b='31–60 days'] { background: #ff9500; }
    .ag-fill[data-b='61–90 days'] { background: #ff3b30; }
    .ag-fill[data-b='90+ days'] { background: #8b0000; }
    .ag-amount { text-align: right; font-weight: 700; }
    .ag-count { text-align: right; font-size: 10px; color: var(--label-3); }

    .feed { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .feed-item { display: grid; grid-template-columns: 32px 1fr; gap: 10px; align-items: center; padding: 10px; background: var(--bg-fill-2); border-radius: var(--r-sm); cursor: pointer; transition: all 140ms; }
    .feed-item:hover { background: var(--bg-fill-3); transform: translateX(2px); }
    .fi-icon { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; background: var(--bg-surface-solid); font-size: 14px; }
    .fi-icon[data-s='posted'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .fi-icon[data-s='draft'] { background: var(--accent-soft); color: var(--accent); }
    .fi-icon[data-s='void'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .fi-body { min-width: 0; }
    .fi-row { display: flex; align-items: center; gap: 8px; }
    .fi-row b { font-size: var(--fs-xs); font-weight: 800; font-family: var(--sf-mono); }
    .fi-status { font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: var(--r-pill); text-transform: uppercase; }
    .fi-status[data-s='posted'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .fi-status[data-s='draft'] { background: var(--accent-soft); color: var(--accent); }
    .fi-status[data-s='void'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .fi-meta { display: flex; gap: 10px; font-size: 10px; color: var(--label-2); margin-top: 3px; flex-wrap: wrap; }
    .fi-amounts { display: flex; gap: 14px; margin-top: 4px; font-size: 10px; color: var(--label-3); }

    .cash-summary { display: flex; flex-direction: column; gap: 10px; }
    .cs-row { display: grid; grid-template-columns: 40px 1fr; gap: 12px; align-items: center; padding: 12px; border-radius: var(--r-sm); background: var(--bg-fill-2); }
    .cs-row .cs-icon { width: 40px; height: 40px; display: grid; place-items: center; background: var(--bg-surface-solid); border-radius: 50%; font-size: 18px; font-weight: 800; }
    .cs-row.in .cs-icon { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .cs-row.out .cs-icon { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .cs-row.net .cs-icon { background: var(--accent-soft); color: var(--accent); }
    .cs-row small { font-size: 10px; color: var(--label-2); text-transform: uppercase; font-weight: 700; letter-spacing: 0.06em; display: block; }
    .cs-row b { font-size: var(--fs-lg); font-weight: 800; }
    .cs-row.net.pos b { color: #34c759; }
    .cs-row.net.neg b { color: #ff3b30; }

    .top-accounts { display: flex; flex-direction: column; gap: 6px; }
    .ta-row { display: grid; grid-template-columns: 60px 1fr auto; gap: 14px; align-items: center; padding: 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); border-left: 3px solid var(--c); cursor: pointer; transition: all 140ms; }
    .ta-row:hover { background: var(--bg-fill-3); transform: translateX(2px); }
    .ta-code { font-size: 11px; color: var(--accent); font-weight: 800; }
    .ta-info b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .ta-info small { font-size: 10px; color: var(--label-2); }
    .ta-balance { font-size: var(--fs-sm); font-weight: 800; }

    .coa-types { display: flex; gap: 6px; flex-wrap: wrap; }
    .ct-chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; background: var(--bg-fill-2); border: 0; border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 700; color: var(--label-2); cursor: pointer; transition: all 140ms; }
    .ct-chip:hover { background: var(--bg-fill-3); }
    .ct-chip.active { background: var(--c); color: #fff; }
    .ct-icon { font-size: 14px; }
    .ct-count { background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: var(--r-pill); font-size: 10px; }
    .ct-chip.active .ct-count { background: rgba(255,255,255,0.3); }

    .coa-list { display: flex; flex-direction: column; gap: 6px; }
    .coa-row { display: grid; grid-template-columns: 80px 1fr 320px 100px; gap: 16px; align-items: center; padding: 14px 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-sm); cursor: pointer; transition: all 140ms; }
    .coa-row:hover { border-color: var(--accent); transform: translateX(3px); }
    .coa-row[data-t='asset'] { border-left: 3px solid #007aff; }
    .coa-row[data-t='liability'] { border-left: 3px solid #ff9500; }
    .coa-row[data-t='equity'] { border-left: 3px solid #34c759; }
    .coa-row[data-t='revenue'] { border-left: 3px solid #5856d6; }
    .coa-row[data-t='expense'] { border-left: 3px solid #ff3b30; }
    .coa-code { font-size: 13px; font-weight: 800; color: var(--accent); }
    .coa-info b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .coa-info small { font-size: 10px; color: var(--label-2); }
    .coa-amounts { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .ca-col small { font-size: 9px; color: var(--label-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; display: block; }
    .ca-col span { font-size: 11px; font-weight: 700; }
    .ca-col.balance span { font-size: 12px; font-weight: 800; }
    .coa-type { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); text-transform: uppercase; text-align: center; }

    .journal-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
    .js-card { padding: 14px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-left: 3px solid var(--c); }
    .js-card b { font-size: var(--fs-xl); font-weight: 800; display: block; font-variant-numeric: tabular-nums; }
    .js-card small { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    .journal-list { display: flex; flex-direction: column; gap: 12px; }
    .je-card { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 12px; }
    .je-card[data-s='draft'] { border-left: 3px solid var(--accent); }
    .je-card[data-s='posted'] { border-left: 3px solid #34c759; }
    .je-card[data-s='void'] { border-left: 3px solid #ff3b30; opacity: 0.65; }
    .je-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
    .je-left { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .je-ref { font-size: 13px; font-weight: 800; color: var(--accent); }
    .je-status, .je-source { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); text-transform: uppercase; }
    .je-status[data-s='draft'] { background: var(--accent-soft); color: var(--accent); }
    .je-status[data-s='posted'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .je-status[data-s='void'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .je-source { background: var(--bg-fill-2); color: var(--label-2); }
    .je-source[data-src='invoice'] { background: rgba(0, 122, 255, 0.15); color: #007aff; }
    .je-source[data-src='bill'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .je-source[data-src='payment'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .je-source[data-src='payroll'] { background: rgba(175, 82, 222, 0.15); color: #af52de; }
    .je-right { display: flex; gap: 14px; align-items: center; font-size: 11px; color: var(--label-2); }
    .je-desc { font-size: var(--fs-sm); line-height: 1.5; }
    .je-lines { background: var(--bg-fill-2); border-radius: var(--r-sm); overflow: hidden; }
    .jl-head, .jl-row, .jl-total { display: grid; grid-template-columns: 1fr 140px 140px; gap: 12px; padding: 10px 14px; align-items: center; font-size: var(--fs-xs); }
    .jl-head { background: var(--bg-surface-solid); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-2); font-weight: 700; }
    .jl-row { border-top: 0.5px solid var(--separator); }
    .jl-account { display: flex; gap: 10px; align-items: baseline; }
    .jl-account .mono { font-size: 11px; color: var(--accent); font-weight: 800; }
    .jl-debit, .jl-credit { text-align: right; font-weight: 700; }
    .jl-debit { color: #007aff; }
    .jl-credit { color: #34c759; }
    .jl-total { background: var(--bg-surface-solid); border-top: 2px solid var(--label-3); font-weight: 800; }
    .jl-total span:first-child { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-2); }
    .je-foot { display: flex; gap: 8px; justify-content: flex-end; padding-top: 8px; border-top: 0.5px solid var(--separator); }

    .ledger-head-card { padding: 18px 22px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-left: 3px solid var(--c); display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center; }
    @media (max-width: 820px) { .ledger-head-card { grid-template-columns: 1fr; } }
    .lh-left { display: flex; gap: 14px; align-items: center; }
    .lh-code { font-size: 20px; font-weight: 800; color: var(--accent); }
    .lh-left h4 { font-size: var(--fs-base); font-weight: 700; }
    .lh-left small { font-size: 10px; color: var(--label-2); }
    .lh-stats { display: flex; gap: 20px; }
    .lh-stats > div { text-align: right; }
    .lh-stats small { font-size: 9px; color: var(--label-3); text-transform: uppercase; display: block; letter-spacing: 0.06em; font-weight: 700; }
    .lh-stats b { font-size: var(--fs-sm); font-weight: 800; }
    .lh-stats .final b { font-size: var(--fs-lg); color: var(--accent); }

    .ledger-table { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; }
    .lg-head, .lg-row { display: grid; grid-template-columns: 100px 90px 1fr 130px 130px 130px; gap: 12px; padding: 12px 16px; align-items: center; font-size: var(--fs-xs); }
    .lg-head { background: var(--bg-fill-2); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-2); font-weight: 700; }
    .lg-row { border-top: 0.5px solid var(--separator); }
    .lg-row:hover { background: var(--bg-hover); }
    .lg-ref { color: var(--accent); font-weight: 700; }
    .amount { text-align: right; font-weight: 700; }
    .dr { color: #007aff; }
    .cr { color: #34c759; }
    .bal { font-weight: 800; }

    .tb-summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    @media (max-width: 720px) { .tb-summary { grid-template-columns: 1fr; } }
    .tbs-card { padding: 18px 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .tbs-card small { font-size: 10px; color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; display: block; margin-bottom: 4px; }
    .tbs-card b { font-size: var(--fs-xl); font-weight: 800; font-variant-numeric: tabular-nums; }
    .tbs-card.balanced { border-left: 3px solid #34c759; }
    .tbs-card.unbalanced { border-left: 3px solid #ff3b30; }

    .tb-table { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; }
    .tb-head, .tb-row { display: grid; grid-template-columns: 100px 1fr 160px 160px; gap: 14px; padding: 12px 18px; align-items: center; font-size: var(--fs-xs); }
    .tb-head { background: var(--bg-fill-2); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-2); font-weight: 700; }
    .tb-row { border-top: 0.5px solid var(--separator); }
    .tb-row:hover { background: var(--bg-hover); }
    .tb-code { font-weight: 800; color: var(--accent); }
    .tb-amount { text-align: right; font-weight: 700; }
    .tb-row.total-row { background: var(--bg-fill-2); font-weight: 800; }
    .tb-row.grand-total { background: var(--accent-soft); font-weight: 900; font-size: var(--fs-sm); border-top: 2px solid var(--accent); }

    .bs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 900px) { .bs-grid { grid-template-columns: 1fr; } }
    .bs-side { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; }
    .bs-side-head { display: flex; align-items: center; gap: 14px; padding: 18px 22px; border-bottom: 0.5px solid var(--separator); }
    .bs-side-head.assets { background: rgba(0, 122, 255, 0.05); }
    .bs-side-head.liab { background: rgba(255, 149, 0, 0.05); }
    .bs-icon { font-size: 28px; }
    .bs-side-head h4 { font-size: var(--fs-lg); font-weight: 800; letter-spacing: -0.02em; }
    .bs-side-head small { font-size: 11px; color: var(--label-2); font-family: var(--sf-mono); }
    .bs-group { padding: 14px 22px; border-bottom: 0.5px solid var(--separator); }
    .bs-group h5 { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--label-3); margin-bottom: 10px; }
    .bs-line { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: var(--fs-xs); cursor: pointer; }
    .bs-line:hover { color: var(--accent); }
    .bs-line .mono { font-weight: 700; }
    .bs-total { padding: 16px 22px; background: var(--bg-fill-2); display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.06em; }
    .bs-total .mono { font-size: var(--fs-base); }
    .bs-check { display: flex; gap: 14px; align-items: center; padding: 16px 22px; background: rgba(255, 59, 48, 0.06); border: 1px solid rgba(255, 59, 48, 0.2); border-radius: var(--r-md); }
    .bs-check.ok { background: rgba(52, 199, 89, 0.06); border-color: rgba(52, 199, 89, 0.2); }
    .bc-icon { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; background: rgba(255, 59, 48, 0.15); color: #ff3b30; font-size: 16px; font-weight: 800; }
    .bs-check.ok .bc-icon { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .bs-check b { font-size: var(--fs-sm); font-weight: 700; }
    .bs-check small { font-size: 11px; color: var(--label-2); display: block; margin-top: 2px; }

    .is-card { padding: 24px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 20px; }
    .is-section { display: flex; flex-direction: column; gap: 10px; }
    .is-section h4 { font-size: var(--fs-base); font-weight: 800; letter-spacing: -0.015em; padding-bottom: 8px; border-bottom: 2px solid var(--separator); color: var(--accent); }
    .is-line { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: var(--fs-sm); cursor: pointer; }
    .is-line:hover { color: var(--accent); }
    .is-line .mono { font-weight: 700; }
    .is-subtotal { display: flex; justify-content: space-between; padding: 12px 16px; background: var(--bg-fill-2); border-radius: var(--r-sm); font-size: var(--fs-sm); font-weight: 800; margin-top: 6px; }
    .is-final { display: flex; justify-content: space-between; padding: 20px 24px; border-radius: var(--r-md); font-size: var(--fs-lg); font-weight: 900; letter-spacing: -0.015em; background: var(--bg-fill-2); }
    .is-final.pos { background: rgba(52, 199, 89, 0.1); color: #34c759; }
    .is-final.neg { background: rgba(255, 59, 48, 0.1); color: #ff3b30; }

    .ratios { display: flex; flex-direction: column; gap: 10px; }
    .ratio-row { display: grid; grid-template-columns: 1fr 80px 30px; gap: 12px; align-items: center; font-size: var(--fs-xs); }
    .ratio-label { color: var(--label-2); }
    .ratio-value { text-align: right; font-weight: 800; }
    .ratio-bench { text-align: right; font-weight: 800; }
    .ratio-bench.good { color: #34c759; }
    .ratio-bench.warn { color: #ff9500; }

    .margin-chart { display: flex; align-items: flex-end; gap: 8px; height: 180px; }
    .mc-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
    .mc-bar { width: 70%; background: linear-gradient(180deg, #34c759, #00c7be); border-radius: 3px 3px 0 0; min-height: 4px; }
    .mc-label { font-size: 10px; color: var(--label-2); font-weight: 600; }
    .mc-val { font-size: 10px; color: var(--accent); font-weight: 800; }

    .cf-card { padding: 24px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 20px; }
    .cf-section { display: flex; flex-direction: column; gap: 8px; }
    .cf-section h4 { font-size: var(--fs-base); font-weight: 800; padding-bottom: 8px; border-bottom: 2px solid var(--separator); color: var(--accent); }
    .cf-line { display: flex; justify-content: space-between; padding: 6px 0; font-size: var(--fs-sm); }
    .cf-line .mono { font-weight: 700; }
    .cf-sub { display: flex; justify-content: space-between; padding: 12px 16px; background: var(--bg-fill-2); border-radius: var(--r-sm); font-weight: 800; font-size: var(--fs-sm); margin-top: 6px; }
    .cf-final { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: var(--accent-soft); border-radius: var(--r-md); font-weight: 900; }
    .cf-final > div { display: flex; flex-direction: column; gap: 4px; }
    .cf-final > span { font-size: var(--fs-xl); font-family: var(--sf-mono); }
    .cf-final.pos > span { color: #34c759; }
    .cf-final.neg > span { color: #ff3b30; }
    .cf-final small { font-size: 11px; color: var(--label-2); font-weight: 500; }

    .inv-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
    .is-card { padding: 14px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-left: 3px solid var(--c); }
    .is-card b { font-size: var(--fs-xl); font-weight: 800; display: block; font-variant-numeric: tabular-nums; }
    .is-card small { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    .table-wrap { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; }
    .thead, .trow { display: grid; gap: 12px; padding: 12px 16px; align-items: center; font-size: var(--fs-xs); }
    .thead { background: var(--bg-fill-2); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-2); font-weight: 700; }
    .trow { border-top: 0.5px solid var(--separator); cursor: pointer; transition: background 140ms; }
    .trow:hover { background: var(--bg-hover); }
    .cols-5 { grid-template-columns: 100px 1fr 100px 120px 80px; }
    .cols-6 { grid-template-columns: 100px 1fr 1.4fr 130px 110px 100px; }
    .cols-7 { grid-template-columns: 110px 1.4fr 110px 110px 120px 120px 100px; }
    .cols-8 { grid-template-columns: 60px 1.4fr 140px 100px 100px 100px 110px 90px; }
    .cell-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .inv-num { color: var(--accent); font-weight: 800; }
    .amount { text-align: right; font-weight: 700; }
    .amount.bold { font-weight: 800; font-size: var(--fs-sm); }
    .overdue { color: #ff3b30; font-weight: 700; }
    .total-row { background: var(--bg-fill-2); font-weight: 800; }
    .total-row:hover { background: var(--bg-fill-2); }

    .st { padding: 3px 10px; border-radius: var(--r-pill); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; display: inline-block; }
    .st[data-s='draft'] { background: var(--bg-fill-3); color: var(--label-2); }
    .st[data-s='sent'] { background: var(--accent-soft); color: var(--accent); }
    .st[data-s='partial'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='paid'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='overdue'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .st[data-s='cancelled'] { background: var(--bg-fill-3); color: var(--label-3); }
    .st[data-s='received'] { background: var(--accent-soft); color: var(--accent); }
    .st[data-s='pending'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='cleared'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='bounced'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .st[data-s='active'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='inactive'] { background: var(--bg-fill-3); color: var(--label-2); }
    .st[data-s='hold'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='on-leave'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='terminated'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .st[data-s='draft'] { background: var(--bg-fill-3); color: var(--label-2); }
    .st[data-s='filed'] { background: var(--accent-soft); color: var(--accent); }
    .st[data-s='disposed'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .st[data-s='fully-depreciated'] { background: var(--bg-fill-3); color: var(--label-2); }

    .pay-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 640px) { .pay-summary { grid-template-columns: 1fr; } }
    .ps-card { display: flex; align-items: center; gap: 16px; padding: 20px 24px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .ps-card.in { border-left: 3px solid #34c759; }
    .ps-card.out { border-left: 3px solid #ff3b30; }
    .ps-icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; font-size: 20px; font-weight: 800; }
    .ps-card.in .ps-icon { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .ps-card.out .ps-icon { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .ps-card small { font-size: 10px; color: var(--label-2); text-transform: uppercase; font-weight: 700; letter-spacing: 0.06em; display: block; }
    .ps-card b { font-size: var(--fs-xl); font-weight: 800; }

    .payments-list { display: flex; flex-direction: column; gap: 8px; }
    .pay-card { padding: 14px 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 8px; }
    .pay-card[data-t='received'] { border-left: 3px solid #34c759; }
    .pay-card[data-t='made'] { border-left: 3px solid #ff3b30; }
    .pay-card[data-s='pending'] { background: rgba(255, 149, 0, 0.04); }
    .pay-card[data-s='bounced'] { opacity: 0.6; }
    .pay-head { display: grid; grid-template-columns: 44px 1fr auto; gap: 14px; align-items: center; }
    .pay-icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; font-size: 22px; font-weight: 800; }
    .pay-icon[data-t='received'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .pay-icon[data-t='made'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .pay-body { min-width: 0; }
    .pay-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .pay-row b { font-size: var(--fs-sm); font-weight: 700; }
    .pay-amount { font-size: var(--fs-base); font-weight: 800; }
    .pay-meta { display: flex; gap: 8px; font-size: 10px; color: var(--label-2); margin-top: 4px; flex-wrap: wrap; }
    .pay-related { font-size: 10px; color: var(--label-3); margin-top: 3px; }
    .pay-status { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); text-transform: uppercase; }
    .pay-status[data-s='pending'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .pay-status[data-s='cleared'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .pay-status[data-s='bounced'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

    .customers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
    .customer-card { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 14px; cursor: pointer; transition: all 140ms; }
    .customer-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .customer-card[data-s='hold'] { border-left: 3px solid #ff9500; }
    .customer-card[data-s='inactive'] { opacity: 0.7; }
    .cu-head { display: grid; grid-template-columns: 48px 1fr auto; gap: 12px; align-items: center; }
    .cu-avatar { width: 48px; height: 48px; display: grid; place-items: center; background: var(--accent-soft); color: var(--accent); border-radius: 50%; font-size: 16px; font-weight: 800; letter-spacing: 0.02em; }
    .cu-avatar.v { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .cu-head b { font-size: var(--fs-sm); font-weight: 700; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cu-head small { font-size: 10px; color: var(--label-3); }
    .cu-status { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); text-transform: uppercase; }
    .cu-contact { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: var(--label-2); }
    .cu-financials { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-top: 10px; border-top: 0.5px solid var(--separator); }
    .cu-financials > div small { font-size: 9px; color: var(--label-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; display: block; margin-bottom: 3px; }
    .cu-financials > div b { font-size: var(--fs-sm); font-weight: 800; }
    .cu-credit { display: flex; flex-direction: column; gap: 6px; }
    .cr-head { display: flex; justify-content: space-between; font-size: 10px; color: var(--label-2); }
    .cr-track { height: 4px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .cr-fill { height: 100%; background: #34c759; border-radius: var(--r-pill); }
    .cr-fill.hot { background: #ff3b30; }

    .bank-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
    .bank-card { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 12px; border-top: 3px solid #007aff; }
    .bank-card[data-t='savings'] { border-top-color: #34c759; }
    .bank-card[data-t='credit'] { border-top-color: #ff9500; }
    .bk-head { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; }
    .bk-icon { font-size: 32px; text-align: center; }
    .bk-head b { font-size: var(--fs-base); font-weight: 800; display: block; }
    .bk-head small { font-size: 10px; color: var(--label-2); }
    .bk-type { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); background: var(--bg-fill-2); color: var(--label-2); text-transform: uppercase; }
    .bk-iban { font-size: 10px; color: var(--label-3); padding: 6px 10px; background: var(--bg-fill-2); border-radius: var(--r-xs); word-break: break-all; }
    .bk-balance { display: flex; flex-direction: column; gap: 4px; }
    .bk-balance small { font-size: 10px; color: var(--label-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .bk-balance b { font-size: var(--fs-xl); font-weight: 800; color: var(--accent); font-variant-numeric: tabular-nums; }
    .bk-alert { padding: 8px 12px; background: rgba(255, 149, 0, 0.1); border-radius: var(--r-sm); color: #ff9500; font-size: 11px; font-weight: 700; }
    .bk-ok { padding: 8px 12px; background: rgba(52, 199, 89, 0.1); border-radius: var(--r-sm); color: #34c759; font-size: 11px; font-weight: 700; }
    .bk-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 0.5px solid var(--separator); font-size: 10px; color: var(--label-3); }

    .asset-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
    .ak-card { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-left: 3px solid var(--c); display: flex; flex-direction: column; gap: 4px; }
    .ak-icon { font-size: 22px; }
    .ak-card b { font-size: var(--fs-xl); font-weight: 800; }
    .ak-card small { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; font-weight: 700; letter-spacing: 0.06em; }

    .assets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
    .asset-card { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 12px; }
    .asset-card[data-s='disposed'] { opacity: 0.6; border-left: 3px solid #ff3b30; }
    .asset-card[data-s='fully-depreciated'] { border-left: 3px solid var(--label-3); }
    .ac-head { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; }
    .ac-icon { font-size: 32px; text-align: center; }
    .ac-head b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .ac-head small { font-size: 10px; color: var(--label-2); }
    .ac-status { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); text-transform: uppercase; }
    .ac-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .ac-stats > div small { font-size: 9px; color: var(--label-3); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 3px; }
    .ac-stats > div b { font-size: var(--fs-sm); font-weight: 800; }
    .ac-depreciation { display: flex; flex-direction: column; gap: 6px; }
    .acd-head { display: flex; justify-content: space-between; font-size: 10px; color: var(--label-2); }
    .acd-track { height: 5px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .acd-fill { height: 100%; background: linear-gradient(90deg, #34c759, #ff9500); border-radius: var(--r-pill); }
    .ac-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 0.5px solid var(--separator); font-size: 10px; color: var(--label-3); flex-wrap: wrap; gap: 6px; }

    .payroll-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
    .ps-card-s { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-left: 3px solid var(--c); }
    .ps-card-s small { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; display: block; margin-bottom: 4px; }
    .ps-card-s b { font-size: var(--fs-xl); font-weight: 800; }

    .vat-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    @media (max-width: 720px) { .vat-summary { grid-template-columns: 1fr; } }
    .vs-card { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); text-align: center; display: flex; flex-direction: column; gap: 6px; align-items: center; }
    .vs-card.net { border-left: 4px solid var(--accent); background: var(--accent-soft); }
    .vs-icon { font-size: 32px; }
    .vs-card > small:first-of-type { font-size: 11px; color: var(--label-2); text-transform: uppercase; font-weight: 700; letter-spacing: 0.06em; }
    .vs-card > b { font-size: var(--fs-2xl); font-weight: 800; font-variant-numeric: tabular-nums; }
    .vs-hint { font-size: 10px; color: var(--label-3); }

    .budget-list { display: flex; flex-direction: column; gap: 12px; }
    .budget-card { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 14px; }
    .budget-card.over { border-left: 3px solid #ff3b30; }
    .budget-card.under { border-left: 3px solid #34c759; }
    .bg-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
    .bg-head b { font-size: var(--fs-base); font-weight: 700; display: block; }
    .bg-head small { font-size: 10px; color: var(--label-2); }
    .bg-variance { font-size: var(--fs-sm); font-weight: 800; font-family: var(--sf-mono); padding: 4px 12px; border-radius: var(--r-pill); }
    .bg-variance.pos { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .bg-variance.neg { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .bg-bars { display: flex; flex-direction: column; gap: 10px; }
    .bg-bar { display: grid; grid-template-columns: 80px 1fr 120px; gap: 14px; align-items: center; font-size: var(--fs-xs); }
    .bb-label { color: var(--label-2); font-weight: 600; }
    .bb-track { height: 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); overflow: hidden; }
    .bb-fill { height: 100%; border-radius: var(--r-sm); }
    .bb-fill.budget { background: #007aff; }
    .bb-fill.actual { background: #34c759; }
    .bb-fill.actual.over { background: #ff3b30; }
    .bb-value { text-align: right; font-weight: 800; }
    .bg-foot { display: flex; justify-content: space-between; padding-top: 10px; border-top: 0.5px solid var(--separator); font-size: var(--fs-2xs); color: var(--label-2); }
    .bg-foot b { color: var(--label); font-weight: 800; }

    .report-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
    .report-card { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-left: 3px solid var(--c); cursor: pointer; display: flex; flex-direction: column; gap: 10px; transition: all 140ms; }
    .report-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .rc-icon { font-size: 32px; }
    .report-card b { font-size: var(--fs-base); font-weight: 700; }
    .report-card p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5; }
    .rc-action { color: var(--accent); font-weight: 700; font-size: var(--fs-2xs); }

    .sched-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .sched-row { display: grid; grid-template-columns: 40px 1fr auto auto; gap: 14px; align-items: center; padding: 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .sr-icon { font-size: 22px; text-align: center; }
    .sched-row b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .sched-row small { font-size: 10px; color: var(--label-2); }
    .sr-next { font-size: 11px; color: var(--label-3); }

    .audit-list { display: flex; flex-direction: column; gap: 8px; }
    .audit-row { display: grid; grid-template-columns: 40px 1fr; gap: 14px; align-items: flex-start; padding: 14px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-sm); border-left: 3px solid var(--label-3); }
    .audit-row[data-a='created'] { border-left-color: #34c759; }
    .audit-row[data-a='updated'] { border-left-color: #007aff; }
    .audit-row[data-a='deleted'] { border-left-color: #ff3b30; }
    .audit-row[data-a='posted'] { border-left-color: #af52de; }
    .ar-icon { width: 40px; height: 40px; display: grid; place-items: center; background: var(--bg-fill-2); border-radius: var(--r-sm); font-size: 18px; }
    .ar-body { min-width: 0; }
    .ar-head { display: flex; gap: 10px; align-items: center; margin-bottom: 4px; flex-wrap: wrap; }
    .ar-head b { font-size: var(--fs-xs); font-weight: 700; text-transform: capitalize; }
    .ar-entity { font-size: 10px; color: var(--accent); padding: 2px 8px; background: var(--accent-soft); border-radius: var(--r-pill); }
    .ar-body p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5; }
    .ar-meta { display: flex; gap: 8px; font-size: 10px; color: var(--label-3); margin-top: 6px; flex-wrap: wrap; }

    .settings-list { display: flex; flex-direction: column; gap: 4px; }
    .setting-row { display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: center; padding: 12px 0; border-bottom: 0.5px solid var(--separator); }
    .setting-row:last-child { border-bottom: 0; }
    .setting-row b { font-size: var(--fs-sm); font-weight: 600; display: block; }
    .setting-row small { font-size: var(--fs-2xs); color: var(--label-2); }

    .toggle { position: relative; width: 44px; height: 26px; border-radius: var(--r-pill); background: var(--bg-fill-3); border: 0; cursor: pointer; transition: background 200ms; flex-shrink: 0; }
    .toggle.on { background: #34c759; }
    .toggle .knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: #fff; border-radius: 50%; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); transition: transform 200ms; }
    .toggle.on .knob { transform: translateX(18px); }

    .dz-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  `],
})
export class AzAccountingPreviewComponent {
  public toast = inject(ToastService);
  private menu = inject(ContextMenuService);

  readonly Math = Math;

  readonly lang = signal<Lang>('en');
  readonly active = signal<AZView>('dashboard');
  readonly coaFilter = signal<'all' | 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'>('all');
  readonly entryFilter = signal<string>('all');
  readonly ledgerAccount = signal<string>('1101');
  readonly trialAsOf = signal<string>('2024-12-31');
  readonly invoiceFilter = signal<string>('all');
  readonly billFilter = signal<string>('all');
  readonly searchQuery = signal('');
  readonly periodClosed = signal(false);

  private settingsStore = signal<Record<string, any>>({
    companyName: 'AZ Trading Co.',
    taxId: '512-345-678',
    crNumber: 'CR-12345',
    address: '12 Nile Corniche, Cairo, Egypt',
    currency: 'EGP',
    fiscalYearStart: '01-01',
    vatRate: 14,
    autoPostJournal: false,
    requireDoubleApproval: true,
    roundToDecimals: 2,
    defaultPaymentTerms: 30,
  });

  readonly accountTypes = [
    { id: 'all' as const, label: 'All', labelAr: 'الكل', icon: '📋', color: '#007aff' },
    { id: 'asset' as const, label: 'Assets', labelAr: 'الأصول', icon: '🏛', color: '#007aff' },
    { id: 'liability' as const, label: 'Liabilities', labelAr: 'الالتزامات', icon: '💳', color: '#ff9500' },
    { id: 'equity' as const, label: 'Equity', labelAr: 'حقوق الملكية', icon: '⭐', color: '#34c759' },
    { id: 'revenue' as const, label: 'Revenue', labelAr: 'الإيرادات', icon: '💰', color: '#5856d6' },
    { id: 'expense' as const, label: 'Expenses', labelAr: 'المصروفات', icon: '💸', color: '#ff3b30' },
  ];

  readonly accounts = signal<Account[]>([
    { code: '1101', name: 'Cash on Hand', nameAr: 'النقدية بالصندوق', type: 'asset', subtype: 'Current Asset', balance: 45000, debit: 45000, credit: 0, currency: 'EGP', active: true },
    { code: '1102', name: 'Bank — CIB Checking', nameAr: 'البنك — CIB جاري', type: 'asset', subtype: 'Current Asset', balance: 850000, debit: 850000, credit: 0, currency: 'EGP', active: true },
    { code: '1103', name: 'Bank — NBE Savings', nameAr: 'البنك — الأهلي توفير', type: 'asset', subtype: 'Current Asset', balance: 320000, debit: 320000, credit: 0, currency: 'EGP', active: true },
    { code: '1201', name: 'Accounts Receivable', nameAr: 'العملاء (مدينون)', type: 'asset', subtype: 'Current Asset', balance: 180000, debit: 180000, credit: 0, currency: 'EGP', active: true },
    { code: '1301', name: 'Inventory', nameAr: 'المخزون', type: 'asset', subtype: 'Current Asset', balance: 245000, debit: 245000, credit: 0, currency: 'EGP', active: true },
    { code: '1401', name: 'Prepaid Expenses', nameAr: 'مصروفات مدفوعة مقدماً', type: 'asset', subtype: 'Current Asset', balance: 35000, debit: 35000, credit: 0, currency: 'EGP', active: true },
    { code: '1501', name: 'Furniture & Fixtures', nameAr: 'أثاث وتجهيزات', type: 'asset', subtype: 'Fixed Asset', balance: 180000, debit: 180000, credit: 0, currency: 'EGP', active: true },
    { code: '1502', name: 'Vehicles', nameAr: 'سيارات', type: 'asset', subtype: 'Fixed Asset', balance: 450000, debit: 450000, credit: 0, currency: 'EGP', active: true },
    { code: '1503', name: 'Office Equipment', nameAr: 'أجهزة مكتبية', type: 'asset', subtype: 'Fixed Asset', balance: 95000, debit: 95000, credit: 0, currency: 'EGP', active: true },
    { code: '1591', name: 'Accum. Depreciation', nameAr: 'مجمع الإهلاك', type: 'asset', subtype: 'Contra Asset', balance: -145000, debit: 0, credit: 145000, currency: 'EGP', active: true },
    { code: '2101', name: 'Accounts Payable', nameAr: 'الموردون (دائنون)', type: 'liability', subtype: 'Current Liability', balance: 125000, debit: 0, credit: 125000, currency: 'EGP', active: true },
    { code: '2102', name: 'Accrued Expenses', nameAr: 'مصروفات مستحقة', type: 'liability', subtype: 'Current Liability', balance: 42000, debit: 0, credit: 42000, currency: 'EGP', active: true },
    { code: '2201', name: 'VAT Payable', nameAr: 'ضريبة القيمة المضافة', type: 'liability', subtype: 'Current Liability', balance: 68000, debit: 0, credit: 68000, currency: 'EGP', active: true },
    { code: '2202', name: 'Payroll Tax Payable', nameAr: 'ضريبة كسب العمل', type: 'liability', subtype: 'Current Liability', balance: 28000, debit: 0, credit: 28000, currency: 'EGP', active: true },
    { code: '2501', name: 'Bank Loan — Long Term', nameAr: 'قرض بنكي طويل الأجل', type: 'liability', subtype: 'Long Term Liability', balance: 500000, debit: 0, credit: 500000, currency: 'EGP', active: true },
    { code: '3101', name: 'Capital', nameAr: 'رأس المال', type: 'equity', subtype: 'Capital', balance: 1500000, debit: 0, credit: 1500000, currency: 'EGP', active: true },
    { code: '3201', name: 'Retained Earnings', nameAr: 'أرباح محتجزة', type: 'equity', subtype: 'Retained Earnings', balance: 380000, debit: 0, credit: 380000, currency: 'EGP', active: true },
    { code: '3301', name: 'Current Year P&L', nameAr: 'أرباح العام الحالي', type: 'equity', subtype: 'Current Year Earnings', balance: 185000, debit: 0, credit: 185000, currency: 'EGP', active: true },
    { code: '4101', name: 'Product Sales', nameAr: 'مبيعات المنتجات', type: 'revenue', subtype: 'Operating Revenue', balance: 1850000, debit: 0, credit: 1850000, currency: 'EGP', active: true },
    { code: '4102', name: 'Service Revenue', nameAr: 'إيرادات الخدمات', type: 'revenue', subtype: 'Operating Revenue', balance: 420000, debit: 0, credit: 420000, currency: 'EGP', active: true },
    { code: '4103', name: 'Consulting Revenue', nameAr: 'إيرادات الاستشارات', type: 'revenue', subtype: 'Operating Revenue', balance: 180000, debit: 0, credit: 180000, currency: 'EGP', active: true },
    { code: '5101', name: 'Cost of Goods Sold', nameAr: 'تكلفة المبيعات', type: 'expense', subtype: 'COGS', balance: 980000, debit: 980000, credit: 0, currency: 'EGP', active: true },
    { code: '5201', name: 'Salaries & Wages', nameAr: 'الرواتب والأجور', type: 'expense', subtype: 'Operating Expense', balance: 420000, debit: 420000, credit: 0, currency: 'EGP', active: true },
    { code: '5202', name: 'Rent Expense', nameAr: 'إيجار', type: 'expense', subtype: 'Operating Expense', balance: 180000, debit: 180000, credit: 0, currency: 'EGP', active: true },
    { code: '5203', name: 'Utilities', nameAr: 'مرافق', type: 'expense', subtype: 'Operating Expense', balance: 48000, debit: 48000, credit: 0, currency: 'EGP', active: true },
    { code: '5204', name: 'Marketing', nameAr: 'تسويق', type: 'expense', subtype: 'Operating Expense', balance: 96000, debit: 96000, credit: 0, currency: 'EGP', active: true },
    { code: '5205', name: 'Depreciation', nameAr: 'إهلاك', type: 'expense', subtype: 'Operating Expense', balance: 72000, debit: 72000, credit: 0, currency: 'EGP', active: true },
    { code: '5206', name: 'Professional Fees', nameAr: 'أتعاب مهنية', type: 'expense', subtype: 'Operating Expense', balance: 24000, debit: 24000, credit: 0, currency: 'EGP', active: true },
  ]);

  readonly entries = signal<JournalEntry[]>([
    {
      id: 'JE-001', ref: 'JV-2024-0001', date: '2024-12-01',
      description: 'Opening capital contribution', descriptionAr: 'إيداع رأس المال الافتتاحي',
      lines: [
        { account: '1102', accountName: 'Bank — CIB Checking', accountNameAr: 'البنك — CIB جاري', debit: 500000, credit: 0 },
        { account: '3101', accountName: 'Capital', accountNameAr: 'رأس المال', debit: 0, credit: 500000 },
      ],
      totalDebit: 500000, totalCredit: 500000, status: 'posted', createdBy: 'admin', postedAt: '2024-12-01', source: 'manual',
    },
    {
      id: 'JE-002', ref: 'SAL-2024-0042', date: '2024-12-05',
      description: 'Invoice INV-0042 — Nile Trading', descriptionAr: 'فاتورة INV-0042 — شركة النيل التجارية',
      lines: [
        { account: '1201', accountName: 'Accounts Receivable', accountNameAr: 'العملاء', debit: 114000, credit: 0 },
        { account: '4101', accountName: 'Product Sales', accountNameAr: 'مبيعات المنتجات', debit: 0, credit: 100000 },
        { account: '2201', accountName: 'VAT Payable', accountNameAr: 'ضريبة القيمة المضافة', debit: 0, credit: 14000 },
      ],
      totalDebit: 114000, totalCredit: 114000, status: 'posted', createdBy: 'admin', postedAt: '2024-12-05', source: 'invoice',
    },
    {
      id: 'JE-003', ref: 'BILL-2024-0078', date: '2024-12-06',
      description: 'Bill BILL-0078 — Tech Supplies Co.', descriptionAr: 'فاتورة مورد BILL-0078 — شركة التقنيات',
      lines: [
        { account: '1301', accountName: 'Inventory', accountNameAr: 'المخزون', debit: 85000, credit: 0 },
        { account: '2201', accountName: 'VAT Payable', accountNameAr: 'ضريبة القيمة المضافة', debit: 11900, credit: 0 },
        { account: '2101', accountName: 'Accounts Payable', accountNameAr: 'الموردون', debit: 0, credit: 96900 },
      ],
      totalDebit: 96900, totalCredit: 96900, status: 'posted', createdBy: 'admin', postedAt: '2024-12-06', source: 'bill',
    },
    {
      id: 'JE-004', ref: 'PAY-2024-0031', date: '2024-12-08',
      description: 'Payment received — Nile Trading', descriptionAr: 'دفعة مستلمة من شركة النيل',
      lines: [
        { account: '1102', accountName: 'Bank — CIB Checking', accountNameAr: 'البنك — CIB جاري', debit: 114000, credit: 0 },
        { account: '1201', accountName: 'Accounts Receivable', accountNameAr: 'العملاء', debit: 0, credit: 114000 },
      ],
      totalDebit: 114000, totalCredit: 114000, status: 'posted', createdBy: 'admin', postedAt: '2024-12-08', source: 'payment',
    },
    {
      id: 'JE-005', ref: 'JV-2024-0002', date: '2024-12-10',
      description: 'Monthly rent payment', descriptionAr: 'دفع إيجار الشهر',
      lines: [
        { account: '5202', accountName: 'Rent Expense', accountNameAr: 'إيجار', debit: 15000, credit: 0 },
        { account: '1102', accountName: 'Bank — CIB Checking', accountNameAr: 'البنك — CIB جاري', debit: 0, credit: 15000 },
      ],
      totalDebit: 15000, totalCredit: 15000, status: 'posted', createdBy: 'admin', postedAt: '2024-12-10', source: 'manual',
    },
    {
      id: 'JE-006', ref: 'JV-2024-0003', date: '2024-12-15',
      description: 'Payroll accrual — November', descriptionAr: 'استحقاق رواتب نوفمبر',
      lines: [
        { account: '5201', accountName: 'Salaries & Wages', accountNameAr: 'الرواتب والأجور', debit: 35000, credit: 0 },
        { account: '2202', accountName: 'Payroll Tax Payable', accountNameAr: 'ضريبة كسب العمل', debit: 0, credit: 5000 },
        { account: '2102', accountName: 'Accrued Expenses', accountNameAr: 'مصروفات مستحقة', debit: 0, credit: 30000 },
      ],
      totalDebit: 35000, totalCredit: 35000, status: 'posted', createdBy: 'admin', postedAt: '2024-12-15', source: 'payroll',
    },
    {
      id: 'JE-007', ref: 'JV-2024-0004', date: '2024-12-20',
      description: 'Depreciation expense — December', descriptionAr: 'مصروف إهلاك ديسمبر',
      lines: [
        { account: '5205', accountName: 'Depreciation', accountNameAr: 'إهلاك', debit: 6000, credit: 0 },
        { account: '1591', accountName: 'Accum. Depreciation', accountNameAr: 'مجمع الإهلاك', debit: 0, credit: 6000 },
      ],
      totalDebit: 6000, totalCredit: 6000, status: 'posted', createdBy: 'system', postedAt: '2024-12-20', source: 'manual',
    },
    {
      id: 'JE-008', ref: 'JV-2024-0005', date: '2024-12-22',
      description: 'Consulting revenue accrual', descriptionAr: 'استحقاق إيرادات استشارات',
      lines: [
        { account: '1201', accountName: 'Accounts Receivable', accountNameAr: 'العملاء', debit: 57000, credit: 0 },
        { account: '4103', accountName: 'Consulting Revenue', accountNameAr: 'إيرادات الاستشارات', debit: 0, credit: 50000 },
        { account: '2201', accountName: 'VAT Payable', accountNameAr: 'ضريبة القيمة المضافة', debit: 0, credit: 7000 },
      ],
      totalDebit: 57000, totalCredit: 57000, status: 'draft', createdBy: 'admin', source: 'manual',
    },
    {
      id: 'JE-009', ref: 'JV-2024-0006', date: '2024-12-28',
      description: 'Office equipment purchase', descriptionAr: 'شراء أجهزة مكتبية',
      lines: [
        { account: '1503', accountName: 'Office Equipment', accountNameAr: 'أجهزة مكتبية', debit: 28000, credit: 0 },
        { account: '2201', accountName: 'VAT Payable', accountNameAr: 'ضريبة القيمة المضافة', debit: 3920, credit: 0 },
        { account: '2101', accountName: 'Accounts Payable', accountNameAr: 'الموردون', debit: 0, credit: 31920 },
      ],
      totalDebit: 31920, totalCredit: 31920, status: 'draft', createdBy: 'admin', source: 'manual',
    },
    {
      id: 'JE-010', ref: 'JV-2024-0007', date: '2024-12-30',
      description: 'Bank loan received', descriptionAr: 'استلام قرض بنكي',
      lines: [
        { account: '1102', accountName: 'Bank — CIB Checking', accountNameAr: 'البنك — CIB جاري', debit: 500000, credit: 0 },
        { account: '2501', accountName: 'Bank Loan — Long Term', accountNameAr: 'قرض بنكي طويل الأجل', debit: 0, credit: 500000 },
      ],
      totalDebit: 500000, totalCredit: 500000, status: 'posted', createdBy: 'admin', postedAt: '2024-12-30', source: 'manual',
    },
  ]);

  readonly invoices = signal<Invoice[]>([
    { id: 'INV-001', number: 'INV-2024-0042', customerId: 'C-001', customerName: 'Nile Trading Co.', customerNameAr: 'شركة النيل التجارية', issueDate: '2024-12-05', dueDate: '2025-01-04', subtotal: 100000, vat: 14000, total: 114000, paid: 114000, balance: 0, status: 'paid', items: 5, currency: 'EGP' },
    { id: 'INV-002', number: 'INV-2024-0043', customerId: 'C-002', customerName: 'Cairo Enterprises', customerNameAr: 'مؤسسة القاهرة', issueDate: '2024-12-06', dueDate: '2025-01-05', subtotal: 85000, vat: 11900, total: 96900, paid: 50000, balance: 46900, status: 'partial', items: 3, currency: 'EGP' },
    { id: 'INV-003', number: 'INV-2024-0044', customerId: 'C-003', customerName: 'Delta Logistics', customerNameAr: 'دلتا اللوجستية', issueDate: '2024-11-15', dueDate: '2024-12-15', subtotal: 250000, vat: 35000, total: 285000, paid: 0, balance: 285000, status: 'overdue', items: 8, currency: 'EGP' },
    { id: 'INV-004', number: 'INV-2024-0045', customerId: 'C-004', customerName: 'Pyramids Group', customerNameAr: 'مجموعة الأهرامات', issueDate: '2024-12-10', dueDate: '2025-01-09', subtotal: 120000, vat: 16800, total: 136800, paid: 0, balance: 136800, status: 'sent', items: 6, currency: 'EGP' },
    { id: 'INV-005', number: 'INV-2024-0046', customerId: 'C-001', customerName: 'Nile Trading Co.', customerNameAr: 'شركة النيل التجارية', issueDate: '2024-12-15', dueDate: '2025-01-14', subtotal: 62000, vat: 8680, total: 70680, paid: 0, balance: 70680, status: 'sent', items: 2, currency: 'EGP' },
    { id: 'INV-006', number: 'INV-2024-0047', customerId: 'C-005', customerName: 'Alexandria Imports', customerNameAr: 'الإسكندرية للاستيراد', issueDate: '2024-12-20', dueDate: '2025-01-19', subtotal: 95000, vat: 13300, total: 108300, paid: 0, balance: 108300, status: 'draft', items: 4, currency: 'EGP' },
  ]);

  readonly bills = signal<Bill[]>([
    { id: 'BILL-001', number: 'BILL-2024-0078', vendorId: 'V-001', vendorName: 'Tech Supplies Co.', vendorNameAr: 'شركة التقنيات', issueDate: '2024-12-06', dueDate: '2025-01-05', subtotal: 85000, vat: 11900, total: 96900, paid: 0, balance: 96900, status: 'received', items: 3 },
    { id: 'BILL-002', number: 'BILL-2024-0079', vendorId: 'V-002', vendorName: 'Office World', vendorNameAr: 'عالم المكتب', issueDate: '2024-12-08', dueDate: '2025-01-07', subtotal: 28000, vat: 3920, total: 31920, paid: 0, balance: 31920, status: 'received', items: 2 },
    { id: 'BILL-003', number: 'BILL-2024-0080', vendorId: 'V-003', vendorName: 'Marketing Pro', vendorNameAr: 'برو للتسويق', issueDate: '2024-11-20', dueDate: '2024-12-20', subtotal: 45000, vat: 6300, total: 51300, paid: 51300, balance: 0, status: 'paid', items: 1 },
    { id: 'BILL-004', number: 'BILL-2024-0081', vendorId: 'V-004', vendorName: 'Cloud Services Ltd', vendorNameAr: 'خدمات السحابة', issueDate: '2024-12-01', dueDate: '2024-12-31', subtotal: 12000, vat: 1680, total: 13680, paid: 5000, balance: 8680, status: 'partial', items: 1 },
    { id: 'BILL-005', number: 'BILL-2024-0082', vendorId: 'V-005', vendorName: 'Legal Partners', vendorNameAr: 'الشركاء القانونيون', issueDate: '2024-11-10', dueDate: '2024-12-10', subtotal: 24000, vat: 3360, total: 27360, paid: 0, balance: 27360, status: 'overdue', items: 1 },
  ]);

  readonly payments = signal<Payment[]>([
    { id: 'PAY-001', ref: 'RCP-2024-0031', date: '2024-12-08', type: 'received', partyId: 'C-001', partyName: 'Nile Trading Co.', partyNameAr: 'شركة النيل التجارية', amount: 114000, method: 'bank', reference: 'TRF-8821', relatedTo: { type: 'invoice', id: 'INV-001', number: 'INV-2024-0042' }, status: 'cleared' },
    { id: 'PAY-002', ref: 'RCP-2024-0032', date: '2024-12-10', type: 'received', partyId: 'C-002', partyName: 'Cairo Enterprises', partyNameAr: 'مؤسسة القاهرة', amount: 50000, method: 'bank', reference: 'TRF-8905', relatedTo: { type: 'invoice', id: 'INV-002', number: 'INV-2024-0043' }, status: 'cleared' },
    { id: 'PAY-003', ref: 'PMT-2024-0088', date: '2024-12-11', type: 'made', partyId: 'V-003', partyName: 'Marketing Pro', partyNameAr: 'برو للتسويق', amount: 51300, method: 'cheque', reference: 'CHQ-4421', relatedTo: { type: 'bill', id: 'BILL-003', number: 'BILL-2024-0080' }, status: 'cleared' },
    { id: 'PAY-004', ref: 'PMT-2024-0089', date: '2024-12-14', type: 'made', partyId: 'V-004', partyName: 'Cloud Services Ltd', partyNameAr: 'خدمات السحابة', amount: 5000, method: 'online', reference: 'PP-99012', relatedTo: { type: 'bill', id: 'BILL-004', number: 'BILL-2024-0081' }, status: 'cleared' },
    { id: 'PAY-005', ref: 'RCP-2024-0033', date: '2024-12-15', type: 'received', partyId: 'C-004', partyName: 'Pyramids Group', partyNameAr: 'مجموعة الأهرامات', amount: 25000, method: 'cheque', reference: 'CHQ-7712', relatedTo: { type: 'invoice', id: 'INV-004', number: 'INV-2024-0045' }, status: 'pending' },
    { id: 'PAY-006', ref: 'PMT-2024-0090', date: '2024-12-18', type: 'made', partyId: 'V-001', partyName: 'Tech Supplies Co.', partyNameAr: 'شركة التقنيات', amount: 40000, method: 'bank', reference: 'TRF-9120', relatedTo: { type: 'bill', id: 'BILL-001', number: 'BILL-2024-0078' }, status: 'pending' },
    { id: 'PAY-007', ref: 'RCP-2024-0034', date: '2024-12-20', type: 'received', partyId: 'C-003', partyName: 'Delta Logistics', partyNameAr: 'دلتا اللوجستية', amount: 100000, method: 'bank', reference: 'TRF-9200', relatedTo: { type: 'invoice', id: 'INV-003', number: 'INV-2024-0044' }, status: 'cleared' },
  ]);

  readonly customers = signal<Customer[]>([
    { id: 'C-001', name: 'Nile Trading Co.', nameAr: 'شركة النيل التجارية', email: 'accounts@nile-trading.eg', phone: '+20 2 2578 1200', taxId: '512-100-001', address: '15 Corniche El Nil', city: 'Cairo', country: 'Egypt', creditLimit: 500000, balance: 70680, totalInvoiced: 184680, totalPaid: 114000, createdAt: '2023-04-15', status: 'active' },
    { id: 'C-002', name: 'Cairo Enterprises', nameAr: 'مؤسسة القاهرة', email: 'finance@cairo-ent.com', phone: '+20 2 2345 6789', taxId: '512-100-002', address: '28 Tahrir Square', city: 'Cairo', country: 'Egypt', creditLimit: 300000, balance: 46900, totalInvoiced: 96900, totalPaid: 50000, createdAt: '2023-07-22', status: 'active' },
    { id: 'C-003', name: 'Delta Logistics', nameAr: 'دلتا اللوجستية', email: 'billing@delta-log.eg', phone: '+20 3 4567 8901', taxId: '512-100-003', address: '5 Port Said St', city: 'Alexandria', country: 'Egypt', creditLimit: 800000, balance: 185000, totalInvoiced: 285000, totalPaid: 100000, createdAt: '2023-02-10', status: 'active' },
    { id: 'C-004', name: 'Pyramids Group', nameAr: 'مجموعة الأهرامات', email: 'ap@pyramids-group.eg', phone: '+20 2 3456 7890', taxId: '512-100-004', address: '3 Giza Street', city: 'Giza', country: 'Egypt', creditLimit: 400000, balance: 136800, totalInvoiced: 136800, totalPaid: 0, createdAt: '2024-01-08', status: 'active' },
    { id: 'C-005', name: 'Alexandria Imports', nameAr: 'الإسكندرية للاستيراد', email: 'info@alex-imports.eg', phone: '+20 3 5678 9012', taxId: '512-100-005', address: '45 El Horreya Ave', city: 'Alexandria', country: 'Egypt', creditLimit: 200000, balance: 108300, totalInvoiced: 108300, totalPaid: 0, createdAt: '2024-06-15', status: 'hold' },
    { id: 'C-006', name: 'Suez Industries', nameAr: 'صناعات السويس', email: 'ar@suez-ind.eg', phone: '+20 62 3456 789', taxId: '512-100-006', address: '10 Canal Street', city: 'Suez', country: 'Egypt', creditLimit: 250000, balance: 0, totalInvoiced: 420000, totalPaid: 420000, createdAt: '2022-11-03', status: 'active' },
  ]);

  readonly vendors = signal<Vendor[]>([
    { id: 'V-001', name: 'Tech Supplies Co.', nameAr: 'شركة التقنيات', email: 'sales@techsupplies.eg', phone: '+20 2 2401 5678', taxId: '600-200-001', category: 'IT & Electronics', balance: 96900, totalBilled: 485000, totalPaid: 388100, createdAt: '2023-03-12', status: 'active' },
    { id: 'V-002', name: 'Office World', nameAr: 'عالم المكتب', email: 'orders@officeworld.eg', phone: '+20 2 2345 6789', taxId: '600-200-002', category: 'Office Supplies', balance: 31920, totalBilled: 142000, totalPaid: 110080, createdAt: '2023-05-20', status: 'active' },
    { id: 'V-003', name: 'Marketing Pro', nameAr: 'برو للتسويق', email: 'hello@mktpro.eg', phone: '+20 2 3456 7890', taxId: '600-200-003', category: 'Marketing', balance: 0, totalBilled: 385000, totalPaid: 385000, createdAt: '2023-01-15', status: 'active' },
    { id: 'V-004', name: 'Cloud Services Ltd', nameAr: 'خدمات السحابة', email: 'billing@cloudsvc.com', phone: '+1 415 555 0123', taxId: '600-200-004', category: 'Cloud & Hosting', balance: 8680, totalBilled: 165000, totalPaid: 156320, createdAt: '2023-08-05', status: 'active' },
    { id: 'V-005', name: 'Legal Partners', nameAr: 'الشركاء القانونيون', email: 'contact@legal-p.eg', phone: '+20 2 2789 0123', taxId: '600-200-005', category: 'Legal', balance: 27360, totalBilled: 85000, totalPaid: 57640, createdAt: '2022-09-10', status: 'active' },
    { id: 'V-006', name: 'Shipping Express', nameAr: 'إكسبريس للشحن', email: 'logistics@shexp.eg', phone: '+20 3 4567 8901', taxId: '600-200-006', category: 'Logistics', balance: 0, totalBilled: 245000, totalPaid: 245000, createdAt: '2023-06-01', status: 'inactive' },
  ]);

  readonly bankAccounts = signal<BankAccount[]>([
    { id: 'B-001', bank: 'CIB — Commercial International Bank', accountNumber: '1002003004005006', iban: 'EG380019000500000001002003004', currency: 'EGP', balance: 1350000, unReconciled: 3, lastReconciled: '2024-12-01', type: 'checking' },
    { id: 'B-002', bank: 'NBE — National Bank of Egypt', accountNumber: '2003004005006007', iban: 'EG380003000200000002003004005', currency: 'EGP', balance: 320000, unReconciled: 0, lastReconciled: '2024-12-08', type: 'savings' },
    { id: 'B-003', bank: 'QNB — Qatar National Bank', accountNumber: '3004005006007008', iban: 'EG380029000300000003004005006', currency: 'USD', balance: 45000, unReconciled: 1, lastReconciled: '2024-11-30', type: 'checking' },
  ]);

  readonly bankTransactions = signal([
    { id: 1, date: '2024-12-28', bank: 'CIB', description: 'Payment from Nile Trading', descriptionAr: 'دفعة من شركة النيل', amount: 114000, ref: 'TRF-8821', status: 'cleared' },
    { id: 2, date: '2024-12-27', bank: 'CIB', description: 'Bank charges', descriptionAr: 'مصاريف بنكية', amount: -450, ref: 'FEE-2024-12', status: 'cleared' },
    { id: 3, date: '2024-12-26', bank: 'NBE', description: 'Transfer to CIB', descriptionAr: 'تحويل إلى CIB', amount: -200000, ref: 'TRF-9100', status: 'cleared' },
    { id: 4, date: '2024-12-25', bank: 'CIB', description: 'Payment to Tech Supplies', descriptionAr: 'دفعة لشركة التقنيات', amount: -40000, ref: 'TRF-9120', status: 'pending' },
    { id: 5, date: '2024-12-24', bank: 'CIB', description: 'Deposit — cash sales', descriptionAr: 'إيداع — مبيعات نقدية', amount: 28500, ref: 'DEP-0781', status: 'cleared' },
    { id: 6, date: '2024-12-23', bank: 'QNB', description: 'International wire received', descriptionAr: 'حوالة دولية', amount: 12500, ref: 'WIRE-0234', status: 'pending' },
  ]);

  readonly assets = signal<Asset[]>([
    { id: 'A-001', name: 'Company Vehicles — Toyota Hilux', nameAr: 'سيارات الشركة — تويوتا هايلكس', category: 'Vehicles', purchaseDate: '2022-06-15', cost: 450000, salvageValue: 50000, usefulLife: 5, method: 'straight-line', accumulatedDepreciation: 160000, bookValue: 290000, monthlyDepreciation: 6667, location: 'Head Office', status: 'active' },
    { id: 'A-002', name: 'Office Furniture', nameAr: 'أثاث المكتب', category: 'Furniture', purchaseDate: '2022-01-10', cost: 180000, salvageValue: 10000, usefulLife: 10, method: 'straight-line', accumulatedDepreciation: 51000, bookValue: 129000, monthlyDepreciation: 1417, location: 'Head Office', status: 'active' },
    { id: 'A-003', name: 'IT Equipment — Servers', nameAr: 'أجهزة تقنية — سيرفرات', category: 'IT Equipment', purchaseDate: '2023-03-20', cost: 280000, salvageValue: 20000, usefulLife: 4, method: 'declining', accumulatedDepreciation: 130000, bookValue: 150000, monthlyDepreciation: 5417, location: 'Data Center', status: 'active' },
    { id: 'A-004', name: 'Office Equipment — Printers', nameAr: 'أجهزة مكتبية — طابعات', category: 'Office Equipment', purchaseDate: '2024-12-28', cost: 28000, salvageValue: 2000, usefulLife: 5, method: 'straight-line', accumulatedDepreciation: 0, bookValue: 28000, monthlyDepreciation: 433, location: 'Head Office', status: 'active' },
    { id: 'A-005', name: 'Warehouse Racking System', nameAr: 'نظام أرفف المخزن', category: 'Warehouse', purchaseDate: '2021-08-01', cost: 95000, salvageValue: 5000, usefulLife: 8, method: 'straight-line', accumulatedDepreciation: 35000, bookValue: 60000, monthlyDepreciation: 937, location: 'Warehouse A', status: 'active' },
    { id: 'A-006', name: 'Delivery Van — Ford Transit', nameAr: 'سيارة توصيل — فورد ترانزيت', category: 'Vehicles', purchaseDate: '2019-02-12', cost: 320000, salvageValue: 30000, usefulLife: 5, method: 'straight-line', accumulatedDepreciation: 290000, bookValue: 30000, monthlyDepreciation: 0, location: 'Warehouse A', status: 'fully-depreciated' },
    { id: 'A-007', name: 'Old Copy Machine', nameAr: 'ماكينة تصوير قديمة', category: 'Office Equipment', purchaseDate: '2018-05-10', cost: 45000, salvageValue: 0, usefulLife: 5, method: 'straight-line', accumulatedDepreciation: 45000, bookValue: 0, monthlyDepreciation: 0, location: '—', status: 'disposed' },
  ]);

  readonly employees = signal<Employee[]>([
    { id: 'EMP-001', name: 'Ahmed Ibrahim', nameAr: 'أحمد إبراهيم', position: 'General Manager', department: 'Management', hireDate: '2018-01-15', baseSalary: 35000, allowances: 8000, deductions: 5500, netPay: 37500, bankAccount: '1002003004005006', taxId: '280-100-001', status: 'active' },
    { id: 'EMP-002', name: 'Sara Khalil', nameAr: 'سارة خليل', position: 'Chief Accountant', department: 'Finance', hireDate: '2019-03-20', baseSalary: 22000, allowances: 4000, deductions: 3200, netPay: 22800, bankAccount: '1002003004005007', taxId: '280-100-002', status: 'active' },
    { id: 'EMP-003', name: 'Omar Hassan', nameAr: 'عمر حسن', position: 'Senior Accountant', department: 'Finance', hireDate: '2020-06-10', baseSalary: 15000, allowances: 2500, deductions: 1800, netPay: 15700, bankAccount: '1002003004005008', taxId: '280-100-003', status: 'active' },
    { id: 'EMP-004', name: 'Layla Mostafa', nameAr: 'ليلى مصطفى', position: 'Sales Manager', department: 'Sales', hireDate: '2019-09-05', baseSalary: 18000, allowances: 6000, deductions: 2400, netPay: 21600, bankAccount: '1002003004005009', taxId: '280-100-004', status: 'active' },
    { id: 'EMP-005', name: 'Khaled Samir', nameAr: 'خالد سمير', position: 'Sales Representative', department: 'Sales', hireDate: '2021-11-15', baseSalary: 9000, allowances: 3000, deductions: 1200, netPay: 10800, bankAccount: '1002003004005010', taxId: '280-100-005', status: 'active' },
    { id: 'EMP-006', name: 'Nour Adel', nameAr: 'نور عادل', position: 'HR Specialist', department: 'HR', hireDate: '2022-04-12', baseSalary: 11000, allowances: 2000, deductions: 1500, netPay: 11500, bankAccount: '1002003004005011', taxId: '280-100-006', status: 'on-leave' },
    { id: 'EMP-007', name: 'Tamer Fathy', nameAr: 'تامر فتحي', position: 'Warehouse Supervisor', department: 'Operations', hireDate: '2020-02-08', baseSalary: 10000, allowances: 1800, deductions: 1200, netPay: 10600, bankAccount: '1002003004005012', taxId: '280-100-007', status: 'active' },
    { id: 'EMP-008', name: 'Hana Farouk', nameAr: 'هنا فاروق', position: 'Marketing Specialist', department: 'Marketing', hireDate: '2023-05-20', baseSalary: 12000, allowances: 2500, deductions: 1600, netPay: 12900, bankAccount: '1002003004005013', taxId: '280-100-008', status: 'active' },
  ]);

  readonly budgets = signal<Budget[]>([
    { id: 'BUD-001', name: 'Marketing Budget', nameAr: 'موازنة التسويق', accountCode: '5204', accountName: 'Marketing', period: '2024', budgeted: 120000, actual: 96000, variance: -24000, variancePct: -20 },
    { id: 'BUD-002', name: 'Salaries Budget', nameAr: 'موازنة الرواتب', accountCode: '5201', accountName: 'Salaries & Wages', period: '2024', budgeted: 480000, actual: 420000, variance: -60000, variancePct: -12.5 },
    { id: 'BUD-003', name: 'Rent Budget', nameAr: 'موازنة الإيجار', accountCode: '5202', accountName: 'Rent Expense', period: '2024', budgeted: 180000, actual: 180000, variance: 0, variancePct: 0 },
    { id: 'BUD-004', name: 'Utilities Budget', nameAr: 'موازنة المرافق', accountCode: '5203', accountName: 'Utilities', period: '2024', budgeted: 45000, actual: 48000, variance: 3000, variancePct: 6.7 },
    { id: 'BUD-005', name: 'Professional Fees', nameAr: 'موازنة الأتعاب', accountCode: '5206', accountName: 'Professional Fees', period: '2024', budgeted: 30000, actual: 24000, variance: -6000, variancePct: -20 },
  ]);

  readonly vatRecords = signal<VatRecord[]>([
    { id: 'VAT-001', period: '2024-01', output: 185000, input: 145000, payable: 40000, filedAt: '2024-02-10', status: 'paid', ref: 'VAT-2024-0001' },
    { id: 'VAT-002', period: '2024-02', output: 172000, input: 138000, payable: 34000, filedAt: '2024-03-12', status: 'paid', ref: 'VAT-2024-0002' },
    { id: 'VAT-003', period: '2024-03', output: 198000, input: 152000, payable: 46000, filedAt: '2024-04-10', status: 'paid', ref: 'VAT-2024-0003' },
    { id: 'VAT-004', period: '2024-04', output: 210000, input: 165000, payable: 45000, filedAt: '2024-05-12', status: 'paid', ref: 'VAT-2024-0004' },
    { id: 'VAT-005', period: '2024-05', output: 225000, input: 178000, payable: 47000, filedAt: '2024-06-10', status: 'paid', ref: 'VAT-2024-0005' },
    { id: 'VAT-006', period: '2024-11', output: 268000, input: 200000, payable: 68000, filedAt: '', status: 'draft', ref: 'VAT-2024-0011' },
  ]);

  readonly auditLog = signal<AuditEntry[]>([
    { id: 1, timestamp: '2024-12-28 14:32', user: 'admin', action: 'created', actionAr: 'إنشاء', entity: 'JournalEntry', entityId: 'JV-2024-0007', details: 'Created journal entry — Bank loan received (500,000 EGP)', ip: '192.168.1.45' },
    { id: 2, timestamp: '2024-12-28 11:15', user: 'admin', action: 'updated', actionAr: 'تحديث', entity: 'Invoice', entityId: 'INV-2024-0047', details: 'Updated invoice status from sent to draft', ip: '192.168.1.45' },
    { id: 3, timestamp: '2024-12-27 16:48', user: 'sara.k', action: 'posted', actionAr: 'ترحيل', entity: 'JournalEntry', entityId: 'JV-2024-0005', details: 'Posted depreciation entry for December 2024', ip: '192.168.1.52' },
    { id: 4, timestamp: '2024-12-27 10:22', user: 'admin', action: 'created', actionAr: 'إنشاء', entity: 'Payment', entityId: 'PMT-2024-0090', details: 'Recorded payment to Tech Supplies Co. — 40,000 EGP', ip: '192.168.1.45' },
    { id: 5, timestamp: '2024-12-26 15:30', user: 'omar.h', action: 'updated', actionAr: 'تحديث', entity: 'Vendor', entityId: 'V-004', details: 'Updated Cloud Services vendor contact information', ip: '192.168.1.60' },
    { id: 6, timestamp: '2024-12-26 09:10', user: 'admin', action: 'deleted', actionAr: 'حذف', entity: 'JournalEntry', entityId: 'JV-2024-0099', details: 'Voided duplicate journal entry', ip: '192.168.1.45' },
    { id: 7, timestamp: '2024-12-25 17:45', user: 'sara.k', action: 'created', actionAr: 'إنشاء', entity: 'Invoice', entityId: 'INV-2024-0047', details: 'Created invoice for Alexandria Imports — 108,300 EGP', ip: '192.168.1.52' },
    { id: 8, timestamp: '2024-12-25 11:20', user: 'admin', action: 'posted', actionAr: 'ترحيل', entity: 'JournalEntry', entityId: 'JV-2024-0004', details: 'Posted monthly rent entry', ip: '192.168.1.45' },
  ]);

  readonly reports = [
    { id: 'RPT-001', name: 'Trial Balance', nameAr: 'ميزان المراجعة', desc: 'Debits and credits by account', descAr: 'المدين والدائن لكل حساب', icon: '⚖️', color: '#007aff' },
    { id: 'RPT-002', name: 'Balance Sheet', nameAr: 'الميزانية العمومية', desc: 'Assets, liabilities, and equity', descAr: 'الأصول والالتزامات وحقوق الملكية', icon: '🏛', color: '#34c759' },
    { id: 'RPT-003', name: 'Income Statement', nameAr: 'قائمة الدخل', desc: 'Revenue, expenses, and profit', descAr: 'الإيرادات والمصروفات والربح', icon: '📈', color: '#ff9500' },
    { id: 'RPT-004', name: 'Cash Flow Statement', nameAr: 'التدفقات النقدية', desc: 'Cash movements by activity', descAr: 'حركات النقدية حسب النشاط', icon: '💵', color: '#5856d6' },
    { id: 'RPT-005', name: 'AR Aging Report', nameAr: 'أعمار الذمم المدينة', desc: 'Outstanding customer balances', descAr: 'أرصدة العملاء المتأخرة', icon: '📅', color: '#af52de' },
    { id: 'RPT-006', name: 'AP Aging Report', nameAr: 'أعمار الذمم الدائنة', desc: 'Outstanding vendor balances', descAr: 'أرصدة الموردين المتأخرة', icon: '📆', color: '#ffcc00' },
    { id: 'RPT-007', name: 'General Ledger', nameAr: 'دفتر الأستاذ', desc: 'All transactions by account', descAr: 'كل الحركات حسب الحساب', icon: '📖', color: '#ff2d55' },
    { id: 'RPT-008', name: 'VAT Return Summary', nameAr: 'ملخص الإقرار الضريبي', desc: 'Output vs input VAT', descAr: 'ضريبة المخرجات مقابل المدخلات', icon: '🧾', color: '#00c7be' },
    { id: 'RPT-009', name: 'Fixed Assets Register', nameAr: 'سجل الأصول الثابتة', desc: 'Assets with depreciation details', descAr: 'الأصول مع تفاصيل الإهلاك', icon: '🏗', color: '#8e8e93' },
    { id: 'RPT-010', name: 'Payroll Summary', nameAr: 'ملخص الرواتب', desc: 'Salaries and deductions', descAr: 'الرواتب والخصومات', icon: '👥', color: '#34c759' },
  ];

  readonly scheduledReports = signal([
    { id: 'SR-001', name: 'Monthly Trial Balance', nameAr: 'ميزان مراجعة شهري', frequency: 'Monthly', frequencyAr: 'شهري', recipient: 'cfo@company.eg', nextRun: '2025-01-05', enabled: true },
    { id: 'SR-002', name: 'AR Aging Weekly', nameAr: 'أعمار الذمم أسبوعياً', frequency: 'Weekly', frequencyAr: 'أسبوعياً', recipient: 'finance@company.eg', nextRun: '2025-01-06', enabled: true },
    { id: 'SR-003', name: 'VAT Quarterly Summary', nameAr: 'ملخص ضريبي ربع سنوي', frequency: 'Quarterly', frequencyAr: 'ربع سنوي', recipient: 'tax@company.eg', nextRun: '2025-01-15', enabled: false },
  ]);

  readonly companySettings = [
    { key: 'companyName', label: 'Company name', labelAr: 'اسم الشركة', desc: 'Legal entity name', descAr: 'الاسم القانوني' },
    { key: 'taxId', label: 'Tax ID', labelAr: 'الرقم الضريبي', desc: 'Tax registration number', descAr: 'رقم التسجيل الضريبي' },
    { key: 'crNumber', label: 'CR Number', labelAr: 'السجل التجاري', desc: 'Commercial registration', descAr: 'السجل التجاري' },
    { key: 'address', label: 'Address', labelAr: 'العنوان', desc: 'Registered address', descAr: 'العنوان المسجل' },
    { key: 'currency', label: 'Currency', labelAr: 'العملة', desc: 'Base currency', descAr: 'العملة الأساسية' },
  ];

  readonly accountingSettings = [
    { key: 'fiscalYearStart', label: 'Fiscal year start', labelAr: 'بداية السنة المالية', desc: 'MM-DD format', descAr: 'صيغة MM-DD', type: 'text' },
    { key: 'vatRate', label: 'VAT rate (%)', labelAr: 'نسبة ضريبة القيمة المضافة (%)', desc: 'Standard VAT rate', descAr: 'نسبة الضريبة المعيارية', type: 'number' },
    { key: 'roundToDecimals', label: 'Round to decimals', labelAr: 'التقريب العشري', desc: 'Decimal precision', descAr: 'دقة الفاصلة العشرية', type: 'number' },
    { key: 'defaultPaymentTerms', label: 'Default payment terms (days)', labelAr: 'شروط الدفع الافتراضية (أيام)', desc: 'Net days for invoices', descAr: 'أيام صافي الفواتير', type: 'number' },
    { key: 'autoPostJournal', label: 'Auto-post journal entries', labelAr: 'ترحيل تلقائي للقيود', desc: 'Skip draft status', descAr: 'تخطي حالة المسودة', type: 'toggle' },
    { key: 'requireDoubleApproval', label: 'Require double approval', labelAr: 'مطلوب موافقة مزدوجة', desc: 'For entries > 100K', descAr: 'للقيود فوق 100 ألف', type: 'toggle' },
  ];

  readonly nav = computed<PreviewNavItem[]>(() => [
    { id: 'dashboard', label: this.t('Dashboard', 'لوحة التحكم'), icon: '📊', group: this.t('Overview', 'نظرة عامة') },
    { id: 'coa', label: this.t('Chart of Accounts', 'دليل الحسابات'), icon: '🗂', badge: this.accounts().length, group: this.t('Accounting', 'المحاسبة') },
    { id: 'journal', label: this.t('Journal Entries', 'قيود اليومية'), icon: '📝', badge: this.entries().length, group: this.t('Accounting', 'المحاسبة') },
    { id: 'ledger', label: this.t('General Ledger', 'دفتر الأستاذ'), icon: '📖', group: this.t('Accounting', 'المحاسبة') },
    { id: 'trial', label: this.t('Trial Balance', 'ميزان المراجعة'), icon: '⚖️', group: this.t('Accounting', 'المحاسبة') },
    { id: 'bs', label: this.t('Balance Sheet', 'الميزانية العمومية'), icon: '🏛', group: this.t('Statements', 'القوائم') },
    { id: 'is', label: this.t('Income Statement', 'قائمة الدخل'), icon: '📈', group: this.t('Statements', 'القوائم') },
    { id: 'cf', label: this.t('Cash Flow', 'التدفقات النقدية'), icon: '💵', group: this.t('Statements', 'القوائم') },
    { id: 'invoices', label: this.t('Invoices', 'الفواتير'), icon: '🧾', badge: this.unpaidInvoices(), group: this.t('Receivables', 'المدينون') },
    { id: 'customers', label: this.t('Customers', 'العملاء'), icon: '👥', badge: this.customers().length, group: this.t('Receivables', 'المدينون') },
    { id: 'bills', label: this.t('Bills', 'فواتير الموردين'), icon: '📄', badge: this.unpaidBills(), group: this.t('Payables', 'الدائنون') },
    { id: 'vendors', label: this.t('Vendors', 'الموردون'), icon: '🏢', badge: this.vendors().length, group: this.t('Payables', 'الدائنون') },
    { id: 'payments', label: this.t('Payments', 'المدفوعات'), icon: '💳', badge: this.payments().length, group: this.t('Payables', 'الدائنون') },
    { id: 'bank', label: this.t('Bank', 'البنوك'), icon: '🏦', badge: this.totalUnreconciled(), group: this.t('Assets', 'الأصول') },
    { id: 'assets', label: this.t('Fixed Assets', 'الأصول الثابتة'), icon: '🏗', badge: this.assets().length, group: this.t('Assets', 'الأصول') },
    { id: 'payroll', label: this.t('Payroll', 'الرواتب'), icon: '👤', badge: this.employees().length, group: this.t('People', 'الأشخاص') },
    { id: 'budgets', label: this.t('Budgets', 'الموازنات'), icon: '🎯', badge: this.budgets().length, group: this.t('Planning', 'التخطيط') },
    { id: 'vat', label: this.t('VAT Returns', 'الإقرارات الضريبية'), icon: '🧾', group: this.t('Compliance', 'الالتزامات') },
    { id: 'audit', label: this.t('Audit Trail', 'سجل المراجعة'), icon: '📋', badge: this.auditLog().length, group: this.t('Compliance', 'الالتزامات') },
    { id: 'reports', label: this.t('Reports', 'التقارير'), icon: '📊', group: this.t('Compliance', 'الالتزامات') },
    { id: 'settings', label: this.t('Settings', 'الإعدادات'), icon: '⚙️', group: this.t('Compliance', 'الالتزامات') },
  ]);

  readonly toolbar = computed<ToolbarAction[]>(() => [
    { id: 'refresh', label: this.t('Refresh', 'تحديث'), icon: '⟳', action: () => this.toast.success(this.t('Refreshed', 'تم التحديث')) },
    { id: 'new-entry', label: this.t('New entry', 'قيد جديد'), icon: '＋', primary: true, action: () => this.createEntry() },
  ]);

  readonly notifs = computed<PreviewNotification[]>(() => [
    { id: 1, icon: '⚠️', title: this.t('2 overdue invoices', '2 فواتير متأخرة'), body: this.t('285K EGP', '285 ألف جنيه'), time: '5m' },
    { id: 2, icon: '✓', title: this.t('Depreciation posted', 'تم ترحيل الإهلاك'), body: '6,000 EGP', time: '1h' },
    { id: 3, icon: '📅', title: this.t('VAT filing due soon', 'موعد الإقرار الضريبي'), body: this.t('Nov 2024', 'نوفمبر 2024'), time: '2h' },
    { id: 4, icon: '💰', title: this.t('Payment received', 'دفعة مستلمة'), body: '100,000 EGP', time: '3h' },
  ]);

  readonly searchPlaceholder = computed(() =>
    this.active() === 'coa' ? this.t('Search accounts…', 'ابحث عن حساب…') :
      this.active() === 'invoices' ? this.t('Search invoices…', 'ابحث في الفواتير…') :
        this.active() === 'customers' ? this.t('Search customers…', 'ابحث عن عميل…') : ''
  );

  readonly totalAssets = computed(() => this.accounts().filter(a => a.type === 'asset').reduce((s, a) => s + a.balance, 0));
  readonly totalLiabilities = computed(() => this.accounts().filter(a => a.type === 'liability').reduce((s, a) => s + a.balance, 0));
  readonly totalEquity = computed(() => this.accounts().filter(a => a.type === 'equity').reduce((s, a) => s + a.balance, 0));
  readonly totalRevenue = computed(() => this.accounts().filter(a => a.type === 'revenue').reduce((s, a) => s + a.balance, 0));
  readonly totalExpenses = computed(() => this.accounts().filter(a => a.type === 'expense').reduce((s, a) => s + a.balance, 0));
  readonly cogsBreakdown = computed(() => this.accounts().filter(a => a.subtype === 'COGS'));
  readonly totalCogs = computed(() => this.cogsBreakdown().reduce((s, a) => s + a.balance, 0));
  readonly opexBreakdown = computed(() => this.accounts().filter(a => a.type === 'expense' && a.subtype === 'Operating Expense'));
  readonly totalOpex = computed(() => this.opexBreakdown().reduce((s, a) => s + a.balance, 0));
  readonly grossProfit = computed(() => this.totalRevenue() - this.totalCogs());
  readonly netIncome = computed(() => this.grossProfit() - this.totalOpex());

  readonly totalBookValue = computed(() => this.assets().filter(a => a.status !== 'disposed').reduce((s, a) => s + a.bookValue, 0));
  readonly totalCost = computed(() => this.assets().filter(a => a.status !== 'disposed').reduce((s, a) => s + a.cost, 0));
  readonly totalAccumulatedDepreciation = computed(() => this.assets().reduce((s, a) => s + a.accumulatedDepreciation, 0));
  readonly totalDepreciation = computed(() => this.accounts().find(a => a.code === '5205')?.balance ?? 0);

  readonly totalDebits = computed(() => this.accounts().reduce((s, a) => s + a.debit, 0));
  readonly totalCredits = computed(() => this.accounts().reduce((s, a) => s + a.credit, 0));

  readonly totalBase = computed(() => this.employees().reduce((s, e) => s + e.baseSalary, 0));
  readonly totalAllowances = computed(() => this.employees().reduce((s, e) => s + e.allowances, 0));
  readonly totalDeductions = computed(() => this.employees().reduce((s, e) => s + e.deductions, 0));
  readonly totalPayroll = computed(() => this.employees().reduce((s, e) => s + e.netPay, 0));

  readonly totalReceived = computed(() => this.payments().filter(p => p.type === 'received').reduce((s, p) => s + p.amount, 0));
  readonly totalMade = computed(() => this.payments().filter(p => p.type === 'made').reduce((s, p) => s + p.amount, 0));

  readonly totalVatOutput = computed(() => this.vatRecords().reduce((s, v) => s + v.output, 0));
  readonly totalVatInput = computed(() => this.vatRecords().reduce((s, v) => s + v.input, 0));

  readonly totalUnreconciled = computed(() => this.bankAccounts().reduce((s, b) => s + b.unReconciled, 0));

  readonly unpaidInvoices = computed(() => this.invoices().filter(i => i.status !== 'paid' && i.status !== 'cancelled').length);
  readonly unpaidBills = computed(() => this.bills().filter(b => b.status !== 'paid').length);

  readonly selectedAccount = computed(() => this.accounts().find(a => a.code === this.ledgerAccount()));
  readonly openingBalance = computed(() => (this.selectedAccount()?.balance ?? 0) * 0.2);

  readonly equationBalanced = computed(() => {
    const diff = Math.abs(this.totalAssets() - (this.totalLiabilities() + this.totalEquity()));
    return diff < 1000;
  });

  readonly trialBalanced = computed(() => Math.abs(this.totalDebits() - this.totalCredits()) < 1000);

  readonly dashboardKpis = computed(() => [
    { icon: '💵', label: this.t('Cash & Bank', 'النقدية والبنك'), value: '1,720,000', color: '#007aff', trend: '+12.4%', trendUp: true, go: () => this.active.set('bank') },
    { icon: '📈', label: this.t('Revenue YTD', 'إيرادات العام'), value: '2,450,000', color: '#34c759', trend: '+18.2%', trendUp: true, go: () => this.active.set('is') },
    { icon: '🧾', label: this.t('AR Outstanding', 'ذمم مدينة'), value: '697,360', color: '#ff9500', trend: '+5.1%', trendUp: false, go: () => this.active.set('invoices') },
    { icon: '💳', label: this.t('AP Outstanding', 'ذمم دائنة'), value: '197,300', color: '#ff3b30', trend: '-3.2%', trendUp: true, go: () => this.active.set('bills') },
  ]);

  readonly cashIn = computed(() => this.payments().filter(p => p.type === 'received').reduce((s, p) => s + p.amount, 0));
  readonly cashOut = computed(() => this.payments().filter(p => p.type === 'made').reduce((s, p) => s + p.amount, 0));
  readonly cashNet = computed(() => this.cashIn() - this.cashOut());

  readonly arBalance = computed(() => this.accounts().find(a => a.code === '1201')?.balance ?? 0);
  readonly apBalance = computed(() => this.accounts().find(a => a.code === '2101')?.balance ?? 0);
  readonly inventoryBalance = computed(() => this.accounts().find(a => a.code === '1301')?.balance ?? 0);

  readonly cfOperating = computed(() => this.netIncome() + this.totalDepreciation() - this.arBalance() + this.apBalance() - this.inventoryBalance());
  readonly cfInvesting = computed(() => 28000);
  readonly cfFinancing = computed(() => 500000);
  readonly cfNet = computed(() => this.cfOperating() - this.cfInvesting() + this.cfFinancing());

  readonly monthlyPnL = computed(() => {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revBase = this.totalRevenue() / 6;
    const expBase = (this.totalCogs() + this.totalOpex()) / 6;
    const max = Math.max(revBase, expBase) * 1.3;
    return months.map((month, i) => {
      const rev = revBase * (0.8 + i * 0.08);
      const exp = expBase * (0.75 + i * 0.07);
      const margin = Math.round(((rev - exp) / rev) * 100);
      return {
        month,
        revPct: (rev / max) * 100,
        expPct: (exp / max) * 100,
        margin,
      };
    });
  });

  readonly arAging = computed<ArAgingBucket[]>(() => {
    const buckets = [
      { bucket: '0–30 days', bucketAr: '0–30 يوم', amount: 177480, count: 3 },
      { bucket: '1–30 days', bucketAr: '1–30 يوم', amount: 70680, count: 1 },
      { bucket: '31–60 days', bucketAr: '31–60 يوم', amount: 136800, count: 1 },
      { bucket: '61–90 days', bucketAr: '61–90 يوم', amount: 108300, count: 1 },
      { bucket: '90+ days', bucketAr: '90+ يوم', amount: 285000, count: 1 },
    ];
    const total = buckets.reduce((s, b) => s + b.amount, 0);
    return buckets.map(b => ({ ...b, pct: (b.amount / total) * 100 }));
  });

  readonly recentEntries = computed(() => [...this.entries()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6));
  readonly topAccounts = computed(() => [...this.accounts()].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 5));

  readonly accountsBreakdown = computed(() => this.accounts().filter(a => a.subtype === 'Current Asset'));
  readonly fixedAssetsBreakdown = computed(() => this.accounts().filter(a => a.subtype === 'Fixed Asset' || a.subtype === 'Contra Asset'));
  readonly liabilitiesBreakdown = computed(() => this.accounts().filter(a => a.type === 'liability'));
  readonly equityBreakdown = computed(() => this.accounts().filter(a => a.type === 'equity'));
  readonly revenueBreakdown = computed(() => this.accounts().filter(a => a.type === 'revenue'));

  readonly trialAccounts = computed(() => this.accounts());

  readonly filteredAccounts = computed(() => {
    const f = this.coaFilter();
    const q = this.searchQuery().toLowerCase().trim();
    let list = this.accounts();
    if (f !== 'all') list = list.filter(a => a.type === f);
    if (q) list = list.filter(a =>
      a.code.includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.nameAr.includes(q)
    );
    return list;
  });

  readonly filteredEntries = computed(() => {
    const f = this.entryFilter();
    if (f === 'all') return this.entries();
    return this.entries().filter(e => e.status === f);
  });

  readonly filteredInvoices = computed(() => {
    const f = this.invoiceFilter();
    if (f === 'all') return this.invoices();
    return this.invoices().filter(i => i.status === f);
  });

  readonly filteredBills = computed(() => {
    const f = this.billFilter();
    if (f === 'all') return this.bills();
    return this.bills().filter(b => b.status === f);
  });

  readonly journalStats = computed(() => [
    { label: this.t('Total', 'إجمالي'), value: this.entries().length, color: '#007aff' },
    { label: this.t('Draft', 'مسودة'), value: this.entries().filter(e => e.status === 'draft').length, color: '#ff9500' },
    { label: this.t('Posted', 'مُرحّل'), value: this.entries().filter(e => e.status === 'posted').length, color: '#34c759' },
    { label: this.t('Void', 'ملغى'), value: this.entries().filter(e => e.status === 'void').length, color: '#ff3b30' },
  ]);

  readonly assetsBreakdown = computed(() =>
    this.accounts().filter(a =>
      a.type === 'asset' &&
      (a.subtype === 'Current Asset' || a.subtype === 'Cash')
    )
  );

  readonly invoiceStats = computed(() => {
    const list = this.invoices();
    return [
      { label: this.t('Total', 'إجمالي'), value: list.length.toString(), color: '#007aff' },
      { label: this.t('Paid', 'مدفوعة'), value: list.filter(i => i.status === 'paid').length.toString(), color: '#34c759' },
      { label: this.t('Partial', 'جزئية'), value: list.filter(i => i.status === 'partial').length.toString(), color: '#ff9500' },
      { label: this.t('Overdue', 'متأخرة'), value: list.filter(i => i.status === 'overdue').length.toString(), color: '#ff3b30' },
    ];
  });

  readonly billStats = computed(() => {
    const list = this.bills();
    return [
      { label: this.t('Total', 'إجمالي'), value: list.length.toString(), color: '#007aff' },
      { label: this.t('Paid', 'مدفوعة'), value: list.filter(b => b.status === 'paid').length.toString(), color: '#34c759' },
      { label: this.t('Partial', 'جزئية'), value: list.filter(b => b.status === 'partial').length.toString(), color: '#ff9500' },
      { label: this.t('Overdue', 'متأخرة'), value: list.filter(b => b.status === 'overdue').length.toString(), color: '#ff3b30' },
    ];
  });

  readonly assetKpis = computed(() => [
    { icon: '💰', color: '#007aff', label: this.t('Total cost', 'التكلفة الإجمالية'), value: (this.totalCost() / 1000).toFixed(0) + 'K' },
    { icon: '📉', color: '#ff3b30', label: this.t('Accum. dep.', 'الإهلاك المتراكم'), value: (this.totalAccumulatedDepreciation() / 1000).toFixed(0) + 'K' },
    { icon: '📘', color: '#34c759', label: this.t('Book value', 'القيمة الدفترية'), value: (this.totalBookValue() / 1000).toFixed(0) + 'K' },
    { icon: '⚙', color: '#ff9500', label: this.t('Monthly dep.', 'الإهلاك الشهري'), value: (this.assets().reduce((s, a) => s + a.monthlyDepreciation, 0) / 1000).toFixed(1) + 'K' },
  ]);

  readonly payrollSummary = computed(() => [
    { label: this.t('Total Base', 'إجمالي الأساسي'), value: this.totalBase().toLocaleString() + ' EGP', color: '#007aff' },
    { label: this.t('Allowances', 'البدلات'), value: '+' + this.totalAllowances().toLocaleString(), color: '#34c759' },
    { label: this.t('Deductions', 'الخصومات'), value: '-' + this.totalDeductions().toLocaleString(), color: '#ff3b30' },
    { label: this.t('Net Payroll', 'صافي الرواتب'), value: this.totalPayroll().toLocaleString() + ' EGP', color: '#af52de' },
  ]);

  readonly keyRatios = computed(() => {
    const currentAssets = this.accounts().filter(a => a.subtype === 'Current Asset').reduce((s, a) => s + a.balance, 0);
    const currentLiab = this.accounts().filter(a => a.subtype === 'Current Liability').reduce((s, a) => s + a.balance, 0);
    const currentRatio = currentLiab ? (currentAssets / currentLiab) : 0;
    const grossMargin = this.totalRevenue() ? (this.grossProfit() / this.totalRevenue()) * 100 : 0;
    const netMargin = this.totalRevenue() ? (this.netIncome() / this.totalRevenue()) * 100 : 0;
    const roe = this.totalEquity() ? (this.netIncome() / this.totalEquity()) * 100 : 0;
    return [
      { label: 'Current Ratio', labelAr: 'نسبة التداول', value: currentRatio.toFixed(2), good: currentRatio > 1.5 },
      { label: 'Gross Margin', labelAr: 'هامش الربح الإجمالي', value: grossMargin.toFixed(1) + '%', good: grossMargin > 40 },
      { label: 'Net Margin', labelAr: 'هامش الربح الصافي', value: netMargin.toFixed(1) + '%', good: netMargin > 15 },
      { label: 'Return on Equity', labelAr: 'العائد على حقوق الملكية', value: roe.toFixed(1) + '%', good: roe > 10 },
    ];
  });

  readonly ledgerRows = computed(() => {
    const acc = this.selectedAccount();
    if (!acc) return [];
    const sign = acc.type === 'asset' || acc.type === 'expense' ? 1 : -1;
    let running = this.openingBalance();
    return this.entries()
      .filter(e => e.lines.some(l => l.account === acc.code))
      .flatMap(e => {
        const line = e.lines.find(l => l.account === acc.code);
        if (!line) return [];
        running += (line.debit - line.credit) * sign;
        return [{
          date: e.date,
          ref: e.ref,
          description: e.description,
          descriptionAr: e.descriptionAr,
          debit: line.debit,
          credit: line.credit,
          balance: running,
        }];
      });
  });

  t(en: string, ar: string): string {
    return this.lang() === 'ar' ? ar : en;
  }

  accountTypeColor(tp: string): string {
    return { asset: '#007aff', liability: '#ff9500', equity: '#34c759', revenue: '#5856d6', expense: '#ff3b30' }[tp] ?? '#8e8e93';
  }

  accountTypeAr(tp: string): string {
    return { asset: 'أصول', liability: 'التزامات', equity: 'حقوق ملكية', revenue: 'إيرادات', expense: 'مصروفات' }[tp] ?? tp;
  }

  subtypeAr(s: string): string {
    return {
      'Current Asset': 'أصل متداول', 'Fixed Asset': 'أصل ثابت', 'Contra Asset': 'أصل مقابل',
      'Current Liability': 'التزام متداول', 'Long Term Liability': 'التزام طويل الأجل',
      'Capital': 'رأس المال', 'Retained Earnings': 'أرباح محتجزة', 'Current Year Earnings': 'أرباح العام الحالي',
      'Operating Revenue': 'إيرادات تشغيلية', 'COGS': 'تكلفة المبيعات', 'Operating Expense': 'مصروف تشغيلي',
    }[s] ?? s;
  }

  entryStatusAr(s: string): string {
    return { draft: 'مسودة', posted: 'مُرحّل', void: 'ملغى' }[s] ?? s;
  }

  sourceAr(s: string): string {
    return { manual: 'يدوي', invoice: 'فاتورة', bill: 'فاتورة مورد', payment: 'دفعة', payroll: 'رواتب' }[s] ?? s;
  }

  invStatusAr(s: string): string {
    return { draft: 'مسودة', sent: 'مُرسلة', partial: 'جزئية', paid: 'مدفوعة', overdue: 'متأخرة', cancelled: 'ملغاة' }[s] ?? s;
  }

  billStatusAr(s: string): string {
    return { draft: 'مسودة', received: 'مستلمة', partial: 'جزئية', paid: 'مدفوعة', overdue: 'متأخرة' }[s] ?? s;
  }

  methodAr(m: string): string {
    return { cash: 'نقدي', bank: 'تحويل بنكي', cheque: 'شيك', online: 'دفع إلكتروني' }[m] ?? m;
  }

  payStatusAr(s: string): string {
    return { pending: 'معلق', cleared: 'مُسوّى', bounced: 'مرتجع' }[s] ?? s;
  }

  customerStatusAr(s: string): string {
    return { active: 'نشط', inactive: 'غير نشط', hold: 'موقوف' }[s] ?? s;
  }

  vendorStatusAr(s: string): string {
    return { active: 'نشط', inactive: 'غير نشط' }[s] ?? s;
  }

  bankTypeAr(t: string): string {
    return { checking: 'جاري', savings: 'توفير', credit: 'ائتمان' }[t] ?? t;
  }

  txStatusAr(s: string): string {
    return { pending: 'معلق', cleared: 'مُسوّى', bounced: 'مرتجع' }[s] ?? s;
  }

  assetStatusAr(s: string): string {
    return { active: 'نشط', disposed: 'مستبعد', 'fully-depreciated': 'مُهلك بالكامل' }[s] ?? s;
  }

  methodDepAr(m: string): string {
    return { 'straight-line': 'القسط الثابت', 'declining': 'المتناقص', 'units': 'الوحدات' }[m] ?? m;
  }

  empStatusAr(s: string): string {
    return { active: 'نشط', 'on-leave': 'في إجازة', terminated: 'منتهي' }[s] ?? s;
  }

  vatStatusAr(s: string): string {
    return { draft: 'مسودة', filed: 'مُقدّم', paid: 'مدفوع' }[s] ?? s;
  }

  onNav(id: string): void {
    this.active.set(id as AZView);
  }

  onSearch(q: string): void {
    this.searchQuery.set(q);
  }

  countByType(tp: string): number {
    if (tp === 'all') return this.accounts().length;
    return this.accounts().filter(a => a.type === tp).length;
  }

  isOverdue(date: string): boolean {
    return new Date(date) < new Date('2024-12-31');
  }

  depreciatedPct(a: Asset): number {
    if (a.cost - a.salvageValue === 0) return 100;
    return Math.min(100, Math.round((a.accumulatedDepreciation / (a.cost - a.salvageValue)) * 100));
  }

  utilizationPct(b: Budget): number {
    return Math.round((b.actual / b.budgeted) * 100);
  }

  auditIcon(a: string): string {
    return { created: '➕', updated: '✎', deleted: '🗑', posted: '✓' }[a] ?? '•';
  }

  openAccount(code: string): void {
    this.ledgerAccount.set(code);
    this.active.set('ledger');
  }

  openEntry(id: string): void {
    const e = this.entries().find(x => x.id === id);
    if (e) this.toast.info(this.t(e.ref, e.ref), this.t(e.description, e.descriptionAr));
  }

  openInvoice(id: string): void {
    const inv = this.invoices().find(i => i.id === id);
    if (inv) this.toast.info(inv.number, `${inv.total.toLocaleString()} EGP`);
  }

  openBill(id: string): void {
    const b = this.bills().find(i => i.id === id);
    if (b) this.toast.info(b.number, `${b.total.toLocaleString()} EGP`);
  }

  openCustomer(id: string): void {
    const c = this.customers().find(x => x.id === id);
    if (c) this.toast.info(this.t(c.name, c.nameAr), `${c.balance.toLocaleString()} EGP ${this.t('balance', 'رصيد')}`);
  }

  openVendor(id: string): void {
    const v = this.vendors().find(x => x.id === id);
    if (v) this.toast.info(this.t(v.name, v.nameAr), `${v.balance.toLocaleString()} EGP ${this.t('balance', 'رصيد')}`);
  }

  createEntry(): void {
    this.toast.success(this.t('New journal entry', 'قيد يومية جديد'), this.t('Draft created', 'تم إنشاء مسودة'));
  }

  postEntry(id: string): void {
    this.entries.update(list => list.map(e => e.id === id ? { ...e, status: 'posted' as const, postedAt: new Date().toISOString().slice(0, 10) } : e));
    this.toast.success(this.t('Entry posted', 'تم ترحيل القيد'));
  }

  voidEntry(id: string): void {
    this.entries.update(list => list.map(e => e.id === id ? { ...e, status: 'void' as const } : e));
    this.toast.warning(this.t('Entry voided', 'تم إلغاء القيد'));
  }

  createInvoice(): void {
    this.toast.success(this.t('New invoice', 'فاتورة جديدة'), this.t('Draft created', 'تم إنشاء مسودة'));
  }

  createBill(): void {
    this.toast.success(this.t('New bill', 'فاتورة مورد جديدة'), this.t('Draft created', 'تم إنشاء مسودة'));
  }

  recordPayment(): void {
    this.toast.success(this.t('Payment recorded', 'تم تسجيل الدفعة'));
  }

  createCustomer(): void {
    this.toast.success(this.t('New customer', 'عميل جديد'));
  }

  createVendor(): void {
    this.toast.success(this.t('New vendor', 'مورد جديد'));
  }

  reconcileBank(id: string): void {
    const b = this.bankAccounts().find(x => x.id === id);
    if (!b) return;
    this.bankAccounts.update(list => list.map(x => x.id === id ? { ...x, unReconciled: 0, lastReconciled: new Date().toISOString().slice(0, 10) } : x));
    this.toast.success(this.t('Reconciled', 'تمت التسوية'), b.bank);
  }

  createAsset(): void {
    this.toast.success(this.t('New asset', 'أصل جديد'), this.t('Coming soon', 'قريباً'));
  }

  runDepreciation(): void {
    this.toast.success(this.t('Depreciation run', 'تشغيل الإهلاك'), this.t('Entry created for review', 'تم إنشاء قيد للمراجعة'));
  }

  processPayroll(): void {
    this.toast.success(this.t('Payroll processed', 'تمت معالجة الرواتب'), `${this.totalPayroll().toLocaleString()} EGP`);
  }

  exportPayroll(): void {
    this.toast.success(this.t('Bank file exported', 'تم تصدير ملف البنك'));
  }

  fileVat(): void {
    this.toast.success(this.t('VAT return filed', 'تم تقديم الإقرار'), `${(this.totalVatOutput() - this.totalVatInput()).toLocaleString()} EGP`);
  }

  createBudget(): void {
    this.toast.success(this.t('New budget', 'موازنة جديدة'));
  }

  generateReport(r: { name: string; nameAr: string }): void {
    this.toast.success(this.t('Generating', 'جارٍ الإنشاء'), this.t(r.name, r.nameAr));
  }

  toggleSchedule(id: string): void {
    this.scheduledReports.update(list => list.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  }

  exportTrial(): void {
    this.toast.success(this.t('Trial balance exported', 'تم تصدير ميزان المراجعة'));
  }

  exportBS(): void {
    this.toast.success(this.t('Balance sheet exported', 'تم تصدير الميزانية'));
  }

  exportIS(): void {
    this.toast.success(this.t('Income statement exported', 'تم تصدير قائمة الدخل'));
  }

  exportCF(): void {
    this.toast.success(this.t('Cash flow exported', 'تم تصدير التدفقات النقدية'));
  }

  exportAudit(): void {
    this.toast.success(this.t('Audit log exported', 'تم تصدير سجل المراجعة'));
  }

  saveSettings(): void {
    this.toast.success(this.t('Settings saved', 'تم حفظ الإعدادات'));
  }

  closePeriod(): void {
    this.periodClosed.update(v => !v);
    this.toast.warning(
      this.periodClosed() ? this.t('Period closed', 'تم إقفال الفترة') : this.t('Period reopened', 'تم إعادة فتح الفترة')
    );
  }

  backupData(): void {
    this.toast.success(this.t('Backup started', 'بدأ النسخ الاحتياطي'));
  }

  settingValue(key: string): any {
    return this.settingsStore()[key];
  }

  updateSetting(key: string, value: any): void {
    this.settingsStore.update(s => ({ ...s, [key]: value }));
  }

  toggleSetting(key: string): void {
    this.settingsStore.update(s => ({ ...s, [key]: !s[key] }));
  }

  onAccountContext(ev: MouseEvent, a: Account): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: this.t('View ledger', 'عرض دفتر الأستاذ'), icon: '📖', action: () => this.openAccount(a.code) },
      { id: 'edit', label: this.t('Edit account', 'تعديل الحساب'), icon: '✎', action: () => this.toast.info(this.t('Edit', 'تعديل'), a.code) },
      { id: 'sep', label: '', separatorBefore: true },
      { id: 'copy', label: this.t('Copy code', 'نسخ الكود'), icon: '📋', action: () => { navigator.clipboard?.writeText(a.code); this.toast.success(this.t('Copied', 'تم النسخ')); } },
    ]);
  }

  onEntryContext(ev: MouseEvent, e: JournalEntry): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: this.t('View entry', 'عرض القيد'), icon: '👁', action: () => this.openEntry(e.id) },
      { id: 'sep', label: '', separatorBefore: true },
      { id: 'copy-ref', label: this.t('Copy reference', 'نسخ المرجع'), icon: '📋', action: () => { navigator.clipboard?.writeText(e.ref); this.toast.success(this.t('Copied', 'تم النسخ')); } },
      { id: 'reverse', label: this.t('Create reversal', 'إنشاء قيد عكسي'), icon: '↻', action: () => this.toast.info(this.t('Reversal', 'قيد عكسي'), e.ref) },
    ]);
  }

  onInvoiceContext(ev: MouseEvent, inv: Invoice): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: this.t('View invoice', 'عرض الفاتورة'), icon: '👁', action: () => this.openInvoice(inv.id) },
      { id: 'print', label: this.t('Print PDF', 'طباعة PDF'), icon: '🖨', action: () => this.toast.info(this.t('Printing', 'جارٍ الطباعة'), inv.number) },
      { id: 'sep', label: '', separatorBefore: true },
      { id: 'copy', label: this.t('Copy number', 'نسخ الرقم'), icon: '📋', action: () => { navigator.clipboard?.writeText(inv.number); this.toast.success(this.t('Copied', 'تم النسخ')); } },
    ]);
  }

  onCustomerContext(ev: MouseEvent, c: Customer): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: this.t('View customer', 'عرض العميل'), icon: '👁', action: () => this.openCustomer(c.id) },
      { id: 'statement', label: this.t('Statement of account', 'كشف حساب'), icon: '📊', action: () => this.toast.info(this.t('Statement', 'كشف'), c.name) },
      { id: 'sep', label: '', separatorBefore: true },
      { id: 'email', label: this.t('Send email', 'إرسال بريد'), icon: '✉', action: () => this.toast.info(this.t('Email', 'بريد'), c.email) },
    ]);
  }
}