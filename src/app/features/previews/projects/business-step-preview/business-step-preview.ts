import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PreviewShellComponent, PreviewNavItem, ToolbarAction, PreviewNotification } from '../../shared/preview-shell/preview-shell';

type XbView =
  | 'home' | 'services' | 'portfolio' | 'projects'
  | 'team' | 'about' | 'process' | 'tech'
  | 'clients' | 'careers' | 'blog' | 'contact';

type Lang = 'en' | 'ar';

interface Service {
  id: string; icon: string; color: string;
  title: string; titleAr: string;
  tagline: string; taglineAr: string;
  bullets: string[]; bulletsAr: string[];
  startingAt: number;
  timeline: string; timelineAr: string;
}

interface PortfolioProject {
  id: string; name: string; nameAr: string;
  category: string; categoryAr: string;
  icon: string; color: string; gradient: string;
  tagline: string; taglineAr: string;
  description: string; descriptionAr: string;
  techStack: string[];
  year: string;
  duration: string; durationAr: string;
  team: number;
  client: string; clientAr: string;
  featured: boolean;
  metrics: { label: string; labelAr: string; value: string; trend: 'up' | 'down' | 'neutral'; }[];
}

interface TeamMember {
  id: string; name: string; nameAr: string;
  role: string; roleAr: string;
  bio: string; bioAr: string;
  avatar: string; color: string;
  skills: string[];
  socials: { linkedin?: string; github?: string; twitter?: string; };
  joinedAt: string;
  featured: boolean;
}

interface Client {
  id: string; name: string; nameAr: string;
  industry: string; industryAr: string;
  logo: string; color: string;
  since: string;
  projectsDelivered: number;
}

interface Testimonial {
  id: string; clientId: string;
  clientName: string; clientNameAr: string;
  role: string; roleAr: string;
  company: string; companyAr: string;
  avatar: string;
  quote: string; quoteAr: string;
  rating: number;
  projectRef: string;
}

interface ProcessStep {
  id: string; num: string;
  title: string; titleAr: string;
  description: string; descriptionAr: string;
  icon: string; color: string;
  duration: string; durationAr: string;
  deliverables: string[]; deliverablesAr: string[];
}

interface TechItem {
  id: string; name: string; icon: string; color: string;
  category: 'frontend' | 'backend' | 'mobile' | 'cloud' | 'design' | 'database' | 'devops';
  level: number;
  yearsUsed: number;
  projectsCount: number;
}

interface JobPosition {
  id: string; title: string; titleAr: string;
  department: string; departmentAr: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  level: 'junior' | 'mid' | 'senior' | 'lead';
  location: string; locationAr: string;
  salaryRange: string;
  posted: string;
  applicants: number;
  skills: string[];
  description: string; descriptionAr: string;
  open: boolean;
}

interface BlogPost {
  id: string; title: string; titleAr: string;
  excerpt: string; excerptAr: string;
  author: string; authorAr: string;
  category: string; categoryAr: string;
  tags: string[];
  readTime: number;
  publishedAt: string;
  views: number;
  likes: number;
  featured: boolean;
  thumbnail: string;
  color: string;
}

interface Office {
  id: string; city: string; cityAr: string;
  country: string; countryAr: string;
  address: string; addressAr: string;
  phone: string;
  email: string;
  timezone: string;
  team: number;
  main: boolean;
  icon: string;
}

@Component({
  selector: 'app-business-step-preview',
  standalone: true,
  imports: [PreviewShellComponent, DecimalPipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="⬡"
      title="X-BLEND"
      [subtitle]="lang() === 'ar' ? 'شركة تطوير برمجيات · القاهرة · 2022' : 'Software Studio · Cairo · Est. 2022'"
      [nav]="nav()"
      [active]="active()"
      (activeChange)="onNav($any($event))"
      [toolbarActions]="toolbar()"
      [notifications]="notifs()"
      [searchPlaceholder]="searchPlaceholder()"
      (searchChange)="onSearch($event)"
    >
      <div class="xb-bar">
        <div class="lang-switch">
          <button class="ls-btn" [class.active]="lang() === 'en'" (click)="lang.set('en')">EN</button>
          <button class="ls-btn" [class.active]="lang() === 'ar'" (click)="lang.set('ar')">AR</button>
        </div>
        <div class="est-pill"><span>◈</span> EST. 2022</div>
        <div class="status-pill" [class.hiring]="hiringCount() > 0">
          <span class="status-dot"></span>
          <span>{{ hiringCount() > 0 ? hiringCount() + ' ' + t('open roles', 'وظيفة مفتوحة') : t('Not hiring', 'لا نوظف حالياً') }}</span>
        </div>
        <div class="quick-stats">
          <span><b>{{ projects().length }}</b> {{ t('projects', 'مشروع') }}</span>
          <span class="qs-sep">·</span>
          <span><b>{{ clients().length }}</b> {{ t('clients', 'عميل') }}</span>
          <span class="qs-sep">·</span>
          <span><b>{{ team().length }}</b> {{ t('team', 'فريق') }}</span>
        </div>
        <button class="cta-pill" (click)="active.set('contact')">{{ t('Start a project', 'ابدأ مشروع') }} →</button>
      </div>

      @switch (active()) {

        @case ('home') {
          <div class="view">
            <section class="xb-hero">
              <div class="hero-inner">
                <span class="hero-eyebrow">◈ {{ t('Digital Product Studio', 'استوديو منتجات رقمية') }}</span>
                <h1 class="hero-title">
                  {{ t('We build', 'نبني') }}<br>
                  <em>{{ t('digital products', 'منتجات رقمية') }}</em><br>
                  {{ t('that scale.', 'تنمو بلا حدود.') }}
                </h1>
                <p class="hero-lede">
                  {{ t('Full-stack product studio crafting web apps, mobile experiences, and enterprise platforms with Angular, .NET, and modern cloud.', 'استوديو متكامل لبناء تطبيقات ويب، تجارب موبايل، ومنصات مؤسسية باستخدام Angular و .NET والحوسبة السحابية.') }}
                </p>
                <div class="hero-cta">
                  <button class="btn-primary" (click)="active.set('contact')">
                    <span>{{ t('Get a quote', 'اطلب عرض سعر') }}</span>
                    <span class="btn-arrow">→</span>
                  </button>
                  <button class="btn-ghost" (click)="active.set('portfolio')">
                    <span class="play-icon">▶</span>
                    <span>{{ t('See our work', 'شاهد أعمالنا') }}</span>
                  </button>
                </div>
                <div class="hero-trust">
                  <span class="ht-label">{{ t('Trusted by', 'موثوقون من') }}</span>
                  @for (c of clients().slice(0, 5); track c.id) {
                    <span class="ht-logo" [style.color]="c.color">{{ c.logo }}</span>
                  }
                </div>
              </div>
              <aside class="hero-side">
                <div class="side-card">
                  <span class="sc-num">{{ yearsActive() }}</span>
                  <span class="sc-label">{{ t('Years', 'سنة') }}</span>
                </div>
                <div class="side-card">
                  <span class="sc-num">{{ projects().length }}</span>
                  <span class="sc-label">{{ t('Projects', 'مشروع') }}</span>
                </div>
                <div class="side-card">
                  <span class="sc-num">{{ clients().length }}</span>
                  <span class="sc-label">{{ t('Clients', 'عميل') }}</span>
                </div>
                <div class="side-card accent">
                  <span class="sc-num">4.9<span class="sc-star">★</span></span>
                  <span class="sc-label">{{ t('Avg rating', 'التقييم') }}</span>
                </div>
              </aside>
            </section>

            <section class="xb-stats-strip">
              @for (s of stats(); track s.label) {
                <div class="strip-item">
                  <span class="si-icon">{{ s.icon }}</span>
                  <div>
                    <b class="si-val">{{ s.value }}</b>
                    <span class="si-label">{{ t(s.label, s.labelAr) }}</span>
                  </div>
                </div>
              }
            </section>

            <section class="xb-section">
              <header class="sec-head">
                <span class="sec-eyebrow">{{ t('What we do', 'ما نقدمه') }}</span>
                <h2 class="sec-title">{{ t('Services built for', 'خدمات مبنية لـ') }} <em>{{ t('ambitious teams', 'الفرق الطموحة') }}</em></h2>
              </header>
              <div class="services-grid">
                @for (s of services().slice(0, 4); track s.id) {
                  <article class="service-card" [style.--c]="s.color" (click)="openService(s.id)">
                    <span class="svc-icon" [style.background]="s.color + '22'" [style.color]="s.color">{{ s.icon }}</span>
                    <h3>{{ t(s.title, s.titleAr) }}</h3>
                    <p>{{ t(s.tagline, s.taglineAr) }}</p>
                    <ul class="svc-bullets">
                      @for (b of t(s.bullets[0], s.bulletsAr[0]) ? s.bullets.slice(0, 3) : s.bullets.slice(0, 3); track b) {
                        <li>{{ b }}</li>
                      }
                    </ul>
                    <footer class="svc-foot">
                      <span class="svc-price">{{ t('From', 'من') }} <b>{{ s.startingAt | number }} EGP</b></span>
                      <span class="svc-arrow">→</span>
                    </footer>
                  </article>
                }
              </div>
              <div class="sec-cta">
                <button class="pill" (click)="active.set('services')">{{ t('View all services', 'عرض كل الخدمات') }} →</button>
              </div>
            </section>

            <section class="xb-section">
              <header class="sec-head">
                <span class="sec-eyebrow">{{ t('Featured work', 'أعمال مميزة') }}</span>
                <h2 class="sec-title">{{ t('Recent', 'أحدث') }} <em>{{ t('case studies', 'دراسات الحالة') }}</em></h2>
              </header>
              <div class="featured-grid">
                @for (p of featuredProjects(); track p.id) {
                  <article class="featured-card" [style.--c]="p.color" [style.background]="p.gradient" (click)="openProject(p.id)">
                    <header class="fc-head">
                      <span class="fc-icon">{{ p.icon }}</span>
                      <span class="fc-category">{{ t(p.category, p.categoryAr) }}</span>
                    </header>
                    <h3>{{ t(p.name, p.nameAr) }}</h3>
                    <p>{{ t(p.tagline, p.taglineAr) }}</p>
                    <div class="fc-stack">
                      @for (tech of p.techStack.slice(0, 4); track tech) {
                        <span class="fc-tech">{{ tech }}</span>
                      }
                    </div>
                    <footer class="fc-foot">
                      <span class="mono">{{ p.year }} · {{ p.duration }}</span>
                      <span class="fc-open">{{ t('View case', 'شاهد الحالة') }} →</span>
                    </footer>
                  </article>
                }
              </div>
              <div class="sec-cta">
                <button class="pill" (click)="active.set('portfolio')">{{ t('View full portfolio', 'عرض كل الأعمال') }} →</button>
              </div>
            </section>

            <section class="xb-section dark">
              <header class="sec-head center">
                <span class="sec-eyebrow green">{{ t('Client voices', 'آراء العملاء') }}</span>
                <h2 class="sec-title light">{{ t('What our clients', 'ماذا يقول') }} <em>{{ t('say about us', 'عملاؤنا عنا') }}</em></h2>
              </header>
              <div class="testimonials-grid">
                @for (tm of testimonials().slice(0, 3); track tm.id) {
                  <article class="testimonial-card">
                    <div class="tm-quote-mark">"</div>
                    <p class="tm-quote">{{ t(tm.quote, tm.quoteAr) }}</p>
                    <div class="tm-stars">
                      @for (i of [1,2,3,4,5]; track i) {
                        <span [class.filled]="i <= tm.rating">★</span>
                      }
                    </div>
                    <footer class="tm-foot">
                      <span class="tm-avatar" [style.background]="clientColor(tm.clientId) + '22'" [style.color]="clientColor(tm.clientId)">{{ initials(tm.clientName) }}</span>
                      <div>
                        <b>{{ t(tm.clientName, tm.clientNameAr) }}</b>
                        <small>{{ t(tm.role, tm.roleAr) }} · {{ t(tm.company, tm.companyAr) }}</small>
                      </div>
                    </footer>
                  </article>
                }
              </div>
            </section>

            <section class="xb-section">
              <header class="sec-head">
                <span class="sec-eyebrow">{{ t('How we work', 'كيف نعمل') }}</span>
                <h2 class="sec-title">{{ t('A process that', 'عملية') }} <em>{{ t('ships on time', 'تسلّم في الوقت') }}</em></h2>
              </header>
              <div class="process-row">
                @for (step of process().slice(0, 4); track step.id) {
                  <div class="process-mini" (click)="openProcessStep(step.id)">
                    <span class="pm-num">{{ step.num }}</span>
                    <span class="pm-icon">{{ step.icon }}</span>
                    <b>{{ t(step.title, step.titleAr) }}</b>
                    <small>{{ t(step.duration, step.durationAr) }}</small>
                  </div>
                }
              </div>
            </section>

            <section class="xb-section accent-bg">
              <div class="cta-block">
                <div>
                  <span class="sec-eyebrow on-accent">{{ t('Ready to start?', 'جاهز للبدء؟') }}</span>
                  <h2 class="cta-title">{{ t('Let\'s build something', 'لنبنِ شيئاً') }} <em>{{ t('remarkable', 'استثنائياً') }}</em> {{ t('together.', 'معاً.') }}</h2>
                  <p class="cta-lede">{{ t('Free 30-minute discovery call. No commitment, no sales pitch — just honest technical advice.', 'جلسة استكشاف مجانية 30 دقيقة. بدون التزام، بدون بيع — نصيحة تقنية صادقة فقط.') }}</p>
                </div>
                <div class="cta-actions">
                  <button class="btn-light" (click)="active.set('contact')">
                    <span>{{ t('Book a call', 'احجز جلسة') }}</span>
                    <span>→</span>
                  </button>
                  <a class="btn-outline-light" [href]="'mailto:' + company.email">
                    <span>✉</span>
                    <span>{{ company.email }}</span>
                  </a>
                </div>
              </div>
            </section>

            <section class="xb-section">
              <header class="sec-head">
                <span class="sec-eyebrow">{{ t('Latest thinking', 'أحدث المقالات') }}</span>
                <h2 class="sec-title">{{ t('From the', 'من') }} <em>{{ t('engineering blog', 'مدونة الهندسة') }}</em></h2>
              </header>
              <div class="blog-row">
                @for (post of blogPosts().slice(0, 3); track post.id) {
                  <article class="blog-mini" [style.--c]="post.color" (click)="openBlogPost(post.id)">
                    <div class="bm-thumb" [style.background]="post.color + '22'">
                      <span>{{ post.thumbnail }}</span>
                    </div>
                    <div class="bm-body">
                      <span class="bm-cat">{{ t(post.category, post.categoryAr) }}</span>
                      <b>{{ t(post.title, post.titleAr) }}</b>
                      <small class="bm-meta">{{ post.readTime }} {{ t('min read', 'دقيقة') }} · {{ post.views }} {{ t('views', 'مشاهدة') }}</small>
                    </div>
                  </article>
                }
              </div>
            </section>
          </div>
        }

        @case ('services') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Capabilities', 'القدرات') }}</span>
                <h3>{{ t('Our Services', 'خدماتنا') }}</h3>
                <p>{{ services().length }} {{ t('end-to-end offerings', 'خدمة متكاملة') }} · {{ t('from idea to launch', 'من الفكرة للإطلاق') }}</p>
              </div>
              <button class="pill primary" (click)="active.set('contact')">💬 {{ t('Request proposal', 'اطلب عرض') }}</button>
            </header>

            <section class="service-stats">
              @for (s of serviceStats(); track s.label) {
                <div class="ss-card" [style.--c]="s.color">
                  <span class="ss-icon">{{ s.icon }}</span>
                  <b class="ss-val">{{ s.value }}</b>
                  <small>{{ s.label }}</small>
                </div>
              }
            </section>

            <div class="services-full">
              @for (s of services(); track s.id) {
                <article class="service-full" [style.--c]="s.color">
                  <header class="sf-head">
                    <span class="sf-icon" [style.background]="s.color + '22'" [style.color]="s.color">{{ s.icon }}</span>
                    <div>
                      <h3>{{ t(s.title, s.titleAr) }}</h3>
                      <p>{{ t(s.tagline, s.taglineAr) }}</p>
                    </div>
                    <div class="sf-meta">
                      <span class="sf-price">{{ t('From', 'من') }} <b>{{ s.startingAt | number }} EGP</b></span>
                      <span class="sf-timeline">⏱ {{ t(s.timeline, s.timelineAr) }}</span>
                    </div>
                  </header>
                  <div class="sf-body">
                    <div class="sf-bullets">
                      <span class="sf-label">{{ t('What you get', 'ما تحصل عليه') }}</span>
                      <ul>
                        @for (b of s.bullets; track b) {
                          <li><span class="bullet-check">✓</span> {{ b }}</li>
                        }
                      </ul>
                    </div>
                    <div class="sf-actions">
                      <button class="pill primary" (click)="requestService(s)">💬 {{ t('Get started', 'ابدأ الآن') }}</button>
                      <button class="pill" (click)="active.set('portfolio')">{{ t('See examples', 'أمثلة') }}</button>
                    </div>
                  </div>
                </article>
              }
            </div>

            <section class="card">
              <header class="card-head">
                <div>
                  <h4>{{ t('Engagement models', 'نماذج التعاون') }}</h4>
                  <small>{{ t('Choose what fits your stage', 'اختر ما يناسب مرحلتك') }}</small>
                </div>
              </header>
              <div class="engagements">
                @for (e of engagementModels; track e.id) {
                  <div class="engage-card" [style.--c]="e.color" [class.popular]="e.popular">
                    @if (e.popular) {
                      <span class="popular-badge">{{ t('Most popular', 'الأكثر طلباً') }}</span>
                    }
                    <span class="engage-icon">{{ e.icon }}</span>
                    <b>{{ t(e.name, e.nameAr) }}</b>
                    <span class="engage-price mono">{{ e.price }}</span>
                    <p>{{ t(e.description, e.descriptionAr) }}</p>
                    <ul class="engage-features">
                      @for (f of e.features; track f) {
                        <li>✓ {{ f }}</li>
                      }
                    </ul>
                    <button class="pill primary full" (click)="requestEngagement(e)">{{ t('Choose', 'اختر') }}</button>
                  </div>
                }
              </div>
            </section>
          </div>
        }

        @case ('portfolio') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Showcase', 'المعرض') }}</span>
                <h3>{{ t('Portfolio', 'الأعمال') }}</h3>
                <p>{{ filteredProjects().length }} {{ t('of', 'من') }} {{ projects().length }} {{ t('projects', 'مشروع') }}</p>
              </div>
              <div class="view-actions">
                <select class="sel" [ngModel]="projectFilter()" (ngModelChange)="projectFilter.set($event)">
                  <option value="all">{{ t('All categories', 'كل الفئات') }}</option>
                  @for (c of projectCategories; track c.id) {
                    <option [value]="c.id">{{ t(c.label, c.labelAr) }}</option>
                  }
                </select>
              </div>
            </header>

            <div class="filter-chips">
              @for (c of projectCategories; track c.id) {
                <button class="fc-chip" [class.active]="projectFilter() === c.id" (click)="projectFilter.set(c.id)">
                  <span>{{ c.icon }}</span>
                  <span>{{ t(c.label, c.labelAr) }}</span>
                  <span class="fc-count">{{ countByCategory(c.id) }}</span>
                </button>
              }
            </div>

            <div class="projects-grid">
              @for (p of filteredProjects(); track p.id) {
                <article class="project-card" [style.--c]="p.color" (click)="openProject(p.id)" (contextmenu)="onProjectContext($event, p)">
                  <div class="pc-thumb" [style.background]="p.gradient">
                    <span class="pc-emoji">{{ p.icon }}</span>
                    @if (p.featured) {
                      <span class="pc-featured">⭐ {{ t('Featured', 'مميز') }}</span>
                    }
                  </div>
                  <div class="pc-body">
                    <div class="pc-cat-row">
                      <span class="pc-cat" [style.color]="p.color">{{ t(p.category, p.categoryAr) }}</span>
                      <span class="pc-year mono">{{ p.year }}</span>
                    </div>
                    <h4>{{ t(p.name, p.nameAr) }}</h4>
                    <p class="pc-tagline">{{ t(p.tagline, p.taglineAr) }}</p>
                    <div class="pc-stack">
                      @for (tech of p.techStack.slice(0, 4); track tech) {
                        <span class="pc-tech">{{ tech }}</span>
                      }
                      @if (p.techStack.length > 4) {
                        <span class="pc-tech more">+{{ p.techStack.length - 4 }}</span>
                      }
                    </div>
                    <div class="pc-metrics">
                      @for (m of p.metrics.slice(0, 2); track m.label) {
                        <div class="pcm-item">
                          <b [class.up]="m.trend === 'up'" [class.down]="m.trend === 'down'">{{ m.value }}</b>
                          <small>{{ t(m.label, m.labelAr) }}</small>
                        </div>
                      }
                    </div>
                    <footer class="pc-foot">
                      <span class="pc-client">👤 {{ t(p.client, p.clientAr) }}</span>
                      <span class="pc-open">{{ t('View', 'عرض') }} →</span>
                    </footer>
                  </div>
                </article>
              }
            </div>
          </div>
        }

        @case ('projects') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Deep dive', 'نظرة تفصيلية') }}</span>
                <h3>{{ t('Projects Detail', 'تفاصيل المشاريع') }}</h3>
                <p>{{ t('Case studies with metrics, tech stack, and outcomes', 'دراسات حالة مع الأرقام والتقنيات والنتائج') }}</p>
              </div>
            </header>

            <div class="projects-detail-list">
              @for (p of projects(); track p.id) {
                <article class="project-detail" [style.--c]="p.color">
                  <header class="pd-head">
                    <span class="pd-icon" [style.background]="p.gradient">{{ p.icon }}</span>
                    <div class="pd-title">
                      <h4>{{ t(p.name, p.nameAr) }}</h4>
                      <p>{{ t(p.tagline, p.taglineAr) }}</p>
                    </div>
                    <div class="pd-meta">
                      <span class="pd-year mono">{{ p.year }}</span>
                      <span class="pd-duration">⏱ {{ t(p.duration, p.durationAr) }}</span>
                      <span class="pd-team">👥 {{ p.team }}</span>
                    </div>
                  </header>
                  <p class="pd-desc">{{ t(p.description, p.descriptionAr) }}</p>
                  <div class="pd-metrics">
                    @for (m of p.metrics; track m.label) {
                      <div class="pdm-card" [attr.data-t]="m.trend">
                        <b>{{ m.value }}</b>
                        <small>{{ t(m.label, m.labelAr) }}</small>
                      </div>
                    }
                  </div>
                  <div class="pd-stack">
                    <span class="pd-label">{{ t('Tech stack', 'التقنيات') }}</span>
                    <div class="pd-chips">
                      @for (tech of p.techStack; track tech) {
                        <span class="pd-chip">{{ tech }}</span>
                      }
                    </div>
                  </div>
                  <footer class="pd-foot">
                    <span class="pd-client">{{ t('Client', 'العميل') }}: <b>{{ t(p.client, p.clientAr) }}</b></span>
                    <button class="pill primary" (click)="openProject(p.id)">{{ t('Full case study', 'دراسة كاملة') }} →</button>
                  </footer>
                </article>
              }
            </div>
          </div>
        }

        @case ('team') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('The crew', 'الفريق') }}</span>
                <h3>{{ t('Meet the Team', 'تعرّف على الفريق') }}</h3>
                <p>{{ team().length }} {{ t('specialists across engineering, design, and delivery', 'متخصص في الهندسة والتصميم والتسليم') }}</p>
              </div>
              <button class="pill primary" (click)="active.set('careers')">＋ {{ t('Join us', 'انضم إلينا') }}</button>
            </header>

            <section class="team-stats">
              @for (s of teamStats(); track s.label) {
                <div class="ts-card" [style.--c]="s.color">
                  <span class="ts-icon">{{ s.icon }}</span>
                  <b class="ts-val">{{ s.value }}</b>
                  <small>{{ s.label }}</small>
                </div>
              }
            </section>

            <div class="team-grid">
              @for (m of team(); track m.id) {
                <article class="team-card" [style.--c]="m.color" (click)="openTeamMember(m.id)">
                  <div class="tc-avatar" [style.background]="m.color + '22'" [style.color]="m.color">
                    {{ m.avatar }}
                  </div>
                  <h4>{{ t(m.name, m.nameAr) }}</h4>
                  <p class="tc-role">{{ t(m.role, m.roleAr) }}</p>
                  <p class="tc-bio">{{ t(m.bio, m.bioAr) }}</p>
                  <div class="tc-skills">
                    @for (s of m.skills.slice(0, 4); track s) {
                      <span class="tc-chip">{{ s }}</span>
                    }
                  </div>
                  <footer class="tc-foot">
                    <span class="mono small">📅 {{ m.joinedAt }}</span>
                    @if (m.socials.linkedin) {
                      <span class="tc-social">🔗</span>
                    }
                  </footer>
                </article>
              }
            </div>
          </div>
        }

        @case ('about') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Who we are', 'من نحن') }}</span>
                <h3>{{ t('About X-BLEND', 'عن X-BLEND') }}</h3>
                <p>{{ t('A Cairo-based product studio built by engineers, for founders', 'استوديو منتجات بالقاهرة، بُني بمهندسين، لمؤسسين') }}</p>
              </div>
            </header>

            <section class="about-hero">
              <div class="about-story">
                <h2>{{ t('Our Story', 'قصتنا') }}</h2>
                <p>{{ t('X-BLEND started in 2022 with a simple belief: great software comes from teams that ship fast, care deeply, and never outsource the hard thinking.', 'بدأت X-BLEND عام 2022 بإيمان بسيط: البرمجيات العظيمة تأتي من فرق تسلّم بسرعة وتهتم بعمق ولا تفوّض التفكير الصعب.') }}</p>
                <p>{{ t('Today we\'re a full-stack studio specializing in Angular and .NET, with a growing portfolio of production systems — from e-commerce and ed-tech to military logistics and enterprise platforms.', 'اليوم نحن استوديو متكامل متخصص في Angular و .NET، بمحفظة متزايدة من الأنظمة الإنتاجية — من التجارة الإلكترونية والتعليم إلى اللوجستيات العسكرية والمنصات المؤسسية.') }}</p>
                <div class="about-values">
                  <h3>{{ t('Our Values', 'قيمنا') }}</h3>
                  @for (v of values; track v.id) {
                    <div class="value-row" [style.--c]="v.color">
                      <span class="vr-icon" [style.background]="v.color + '22'" [style.color]="v.color">{{ v.icon }}</span>
                      <div>
                        <b>{{ t(v.title, v.titleAr) }}</b>
                        <p>{{ t(v.description, v.descriptionAr) }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
              <aside class="about-side">
                <div class="office-list">
                  <h3>{{ t('Our Offices', 'مكاتبنا') }}</h3>
                  @for (o of offices(); track o.id) {
                    <div class="office-card" [class.main]="o.main">
                      <span class="oc-icon">{{ o.icon }}</span>
                      <div>
                        <b>{{ t(o.city, o.cityAr) }}@if (o.main) { <span class="main-badge">HQ</span> }</b>
                        <small>{{ t(o.address, o.addressAr) }}</small>
                        <small class="mono">🌍 {{ o.timezone }} · 👥 {{ o.team }}</small>
                      </div>
                    </div>
                  }
                </div>
                <div class="about-numbers">
                  <h3>{{ t('By the Numbers', 'بالأرقام') }}</h3>
                  @for (n of aboutNumbers(); track n.label) {
                    <div class="an-row" [style.--c]="n.color">
                      <span class="an-icon">{{ n.icon }}</span>
                      <div>
                        <b class="an-val">{{ n.value }}</b>
                        <small>{{ t(n.label, n.labelAr) }}</small>
                      </div>
                    </div>
                  }
                </div>
              </aside>
            </section>

            <section class="card">
              <header class="card-head">
                <div>
                  <h4>{{ t('Timeline', 'الخط الزمني') }}</h4>
                  <small>{{ t('Our journey so far', 'رحلتنا حتى الآن') }}</small>
                </div>
              </header>
              <div class="timeline-list">
                @for (t2 of timeline; track t2.year) {
                  <div class="timeline-row" [style.--c]="t2.color">
                    <span class="tr-year">{{ t2.year }}</span>
                    <span class="tr-dot" [style.background]="t2.color"></span>
                    <div class="tr-body">
                      <b>{{ t(t2.title, t2.titleAr) }}</b>
                      <p>{{ t(t2.description, t2.descriptionAr) }}</p>
                    </div>
                  </div>
                }
              </div>
            </section>
          </div>
        }

        @case ('process') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Methodology', 'المنهجية') }}</span>
                <h3>{{ t('How We Work', 'كيف نعمل') }}</h3>
                <p>{{ t('Transparent, structured, and built to ship', 'شفاف، منظم، ومبني على التسليم') }}</p>
              </div>
            </header>

            <div class="process-full">
              @for (step of process(); track step.id; let i = $index) {
                <article class="process-step" [style.--c]="step.color">
                  <div class="ps-num-col">
                    <span class="ps-num">{{ step.num }}</span>
                    @if (i < process().length - 1) {
                      <span class="ps-connector"></span>
                    }
                  </div>
                  <div class="ps-body">
                    <header>
                      <span class="ps-icon" [style.background]="step.color + '22'" [style.color]="step.color">{{ step.icon }}</span>
                      <div>
                        <h4>{{ t(step.title, step.titleAr) }}</h4>
                        <span class="ps-duration">⏱ {{ t(step.duration, step.durationAr) }}</span>
                      </div>
                    </header>
                    <p>{{ t(step.description, step.descriptionAr) }}</p>
                    <div class="ps-deliverables">
                      <span class="ps-label">{{ t('Deliverables', 'المخرجات') }}</span>
                      <div class="ps-chips">
                        @for (d of step.deliverables; track d) {
                          <span class="ps-chip">✓ {{ d }}</span>
                        }
                      </div>
                    </div>
                  </div>
                </article>
              }
            </div>
          </div>
        }

        @case ('tech') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Stack', 'التقنيات') }}</span>
                <h3>{{ t('Technologies We Use', 'التقنيات التي نستخدمها') }}</h3>
                <p>{{ tech().length }} {{ t('technologies across our delivery stack', 'تقنية في منظومة التسليم') }}</p>
              </div>
            </header>

            <section class="tech-filters">
              @for (c of techCategories; track c.id) {
                <button class="tf-chip" [class.active]="techCategory() === c.id" [style.--c]="c.color" (click)="techCategory.set(c.id)">
                  <span>{{ c.icon }}</span>
                  <span>{{ t(c.label, c.labelAr) }}</span>
                  <span class="tf-count">{{ countTechByCategory(c.id) }}</span>
                </button>
              }
            </section>

            <div class="tech-grid">
              @for (t2 of filteredTech(); track t2.id) {
                <article class="tech-card" [style.--c]="t2.color">
                  <header class="tc-head">
                    <span class="tc-icon" [style.background]="t2.color + '22'" [style.color]="t2.color">{{ t2.icon }}</span>
                    <div>
                      <b>{{ t2.name }}</b>
                      <small>{{ t(t2.category, techCategoryAr(t2.category)) }}</small>
                    </div>
                    <span class="tc-years mono">{{ t2.yearsUsed }}y</span>
                  </header>
                  <div class="tc-level">
                    <div class="tcl-head">
                      <span>{{ t('Proficiency', 'الإتقان') }}</span>
                      <b class="mono">{{ t2.level }}%</b>
                    </div>
                    <div class="tcl-track"><div class="tcl-fill" [style.width.%]="t2.level" [style.background]="t2.color"></div></div>
                  </div>
                  <footer class="tc-foot-row">
                    <span class="mono small">📦 {{ t2.projectsCount }} {{ t('projects', 'مشروع') }}</span>
                  </footer>
                </article>
              }
            </div>
          </div>
        }

        @case ('clients') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Partners', 'الشركاء') }}</span>
                <h3>{{ t('Clients & Testimonials', 'العملاء والآراء') }}</h3>
                <p>{{ clients().length }} {{ t('long-term partners', 'شريك طويل الأمد') }}</p>
              </div>
            </header>

            <section class="clients-strip">
              @for (c of clients(); track c.id) {
                <div class="client-logo-card" [style.--c]="c.color" (click)="openClient(c.id)">
                  <span class="clc-logo">{{ c.logo }}</span>
                  <b>{{ t(c.name, c.nameAr) }}</b>
                  <small>{{ t(c.industry, c.industryAr) }}</small>
                  <div class="clc-meta">
                    <span class="mono">Since {{ c.since }}</span>
                    <span class="mono">{{ c.projectsDelivered }} proj.</span>
                  </div>
                </div>
              }
            </section>

            <section class="card">
              <header class="card-head">
                <div>
                  <h4>{{ t('What clients say', 'ماذا يقول العملاء') }}</h4>
                  <small>{{ testimonials().length }} {{ t('verified reviews', 'تقييم موثق') }}</small>
                </div>
              </header>
              <div class="testimonials-full">
                @for (tm of testimonials(); track tm.id) {
                  <article class="testimonial-full" [style.--c]="clientColor(tm.clientId)">
                    <div class="tfull-head">
                      <span class="tfull-avatar" [style.background]="clientColor(tm.clientId) + '22'" [style.color]="clientColor(tm.clientId)">
                        {{ initials(tm.clientName) }}
                      </span>
                      <div>
                        <b>{{ t(tm.clientName, tm.clientNameAr) }}</b>
                        <small>{{ t(tm.role, tm.roleAr) }} · {{ t(tm.company, tm.companyAr) }}</small>
                      </div>
                      <div class="tfull-rating">
                        @for (i of [1,2,3,4,5]; track i) {
                          <span [class.filled]="i <= tm.rating">★</span>
                        }
                      </div>
                    </div>
                    <p class="tfull-quote">"{{ t(tm.quote, tm.quoteAr) }}"</p>
                    <footer class="tfull-foot">
                      <span class="mono small">📁 {{ tm.projectRef }}</span>
                    </footer>
                  </article>
                }
              </div>
            </section>
          </div>
        }

        @case ('careers') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Join us', 'انضم إلينا') }}</span>
                <h3>{{ t('Open Positions', 'الوظائف المفتوحة') }}</h3>
                <p>{{ openJobs().length }} {{ t('open roles', 'وظيفة مفتوحة') }} · {{ t('Remote-friendly', 'مرن عن بعد') }}</p>
              </div>
            </header>

            <section class="careers-hero">
              <div class="ch-content">
                <h2>{{ t('Build the future with us', 'ابنِ المستقبل معنا') }}</h2>
                <p>{{ t('We hire engineers who care about craft, designers who think in systems, and PMs who ship.', 'نوظف مهندسين يهتمون بالحِرفة، ومصممين يفكرون بالأنظمة، ومديري مشاريع يسلّمون.') }}</p>
                <div class="ch-perks">
                  @for (p of perks; track p.id) {
                    <div class="perk" [style.--c]="p.color">
                      <span class="perk-icon">{{ p.icon }}</span>
                      <b>{{ t(p.title, p.titleAr) }}</b>
                      <small>{{ t(p.description, p.descriptionAr) }}</small>
                    </div>
                  }
                </div>
              </div>
            </section>

            <section class="jobs-list">
              @for (j of jobs(); track j.id) {
                <article class="job-card" [attr.data-open]="j.open" (click)="openJob(j.id)" (contextmenu)="onJobContext($event, j)">
                  <header class="jc-head">
                    <div>
                      <h4>{{ t(j.title, j.titleAr) }}</h4>
                      <div class="jc-meta">
                        <span class="jc-dept" [style.color]="departmentColor(j.department)">{{ t(j.department, j.departmentAr) }}</span>
                        <span class="jc-dot">·</span>
                        <span class="jc-type" [attr.data-t]="j.type">{{ t(j.type, jobTypeAr(j.type)) }}</span>
                        <span class="jc-dot">·</span>
                        <span class="jc-level" [attr.data-l]="j.level">{{ t(j.level, jobLevelAr(j.level)) }}</span>
                        <span class="jc-dot">·</span>
                        <span class="jc-loc">📍 {{ t(j.location, j.locationAr) }}</span>
                      </div>
                    </div>
                    <div class="jc-right">
                      <span class="jc-salary">{{ j.salaryRange }}</span>
                      @if (!j.open) {
                        <span class="jc-closed">{{ t('Closed', 'مغلقة') }}</span>
                      }
                    </div>
                  </header>
                  <p class="jc-desc">{{ t(j.description, j.descriptionAr) }}</p>
                  <div class="jc-skills">
                    @for (s of j.skills; track s) {
                      <span class="jc-skill">{{ s }}</span>
                    }
                  </div>
                  <footer class="jc-foot">
                    <span class="mono small">📅 {{ j.posted }} · 👥 {{ j.applicants }} {{ t('applicants', 'متقدم') }}</span>
                    @if (j.open) {
                      <button class="pill primary" (click)="$event.stopPropagation(); applyJob(j)">{{ t('Apply now', 'قدم الآن') }} →</button>
                    }
                  </footer>
                </article>
              }
            </section>

            <section class="card">
              <header class="card-head">
                <h4>{{ t('Don\'t see your role?', 'لم تجد وظيفتك؟') }}</h4>
              </header>
              <p class="muted small">{{ t('We\'re always looking for exceptional talent. Send us your portfolio.', 'نبحث دائماً عن مواهب استثنائية. أرسل لنا ملف أعمالك.') }}</p>
              <div class="dz-actions" style="margin-top: 12px;">
                <button class="pill primary" (click)="speculativeApplication()">✉ {{ t('Send application', 'أرسل طلبك') }}</button>
              </div>
            </section>
          </div>
        }

        @case ('blog') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Insights', 'رؤى') }}</span>
                <h3>{{ t('Engineering Blog', 'مدونة الهندسة') }}</h3>
                <p>{{ blogPosts().length }} {{ t('articles on craft, architecture, and shipping', 'مقالة عن الحرفة والهندسة والتسليم') }}</p>
              </div>
            </header>

            @if (featuredPost(); as fp) {
              <article class="blog-featured" [style.--c]="fp.color" (click)="openBlogPost(fp.id)">
                <div class="bf-thumb" [style.background]="fp.color + '22'">
                  <span class="bf-emoji">{{ fp.thumbnail }}</span>
                  <span class="bf-badge">⭐ {{ t('Featured', 'مميز') }}</span>
                </div>
                <div class="bf-body">
                  <span class="bf-cat" [style.color]="fp.color">{{ t(fp.category, fp.categoryAr) }}</span>
                  <h4>{{ t(fp.title, fp.titleAr) }}</h4>
                  <p>{{ t(fp.excerpt, fp.excerptAr) }}</p>
                  <div class="bf-meta">
                    <span>✍ {{ t(fp.author, fp.authorAr) }}</span>
                    <span>·</span>
                    <span>📅 {{ fp.publishedAt }}</span>
                    <span>·</span>
                    <span>⏱ {{ fp.readTime }} {{ t('min read', 'دقيقة') }}</span>
                  </div>
                  <div class="bf-stats">
                    <span>👁 {{ fp.views | number }}</span>
                    <span>❤ {{ fp.likes }}</span>
                  </div>
                </div>
              </article>
            }

            <div class="blog-grid">
              @for (post of regularBlogPosts(); track post.id) {
                <article class="blog-card" [style.--c]="post.color" (click)="openBlogPost(post.id)" (contextmenu)="onBlogContext($event, post)">
                  <div class="bc-thumb" [style.background]="post.color + '22'">
                    <span class="bc-emoji">{{ post.thumbnail }}</span>
                    <span class="bc-cat-chip" [style.color]="post.color">{{ t(post.category, post.categoryAr) }}</span>
                  </div>
                  <div class="bc-body">
                    <h4>{{ t(post.title, post.titleAr) }}</h4>
                    <p>{{ t(post.excerpt, post.excerptAr) }}</p>
                    <div class="bc-tags">
                      @for (tag of post.tags.slice(0, 3); track tag) {
                        <span class="bc-tag">#{{ tag }}</span>
                      }
                    </div>
                    <footer class="bc-foot">
                      <span class="mono small">{{ post.publishedAt }}</span>
                      <div class="bc-stats">
                        <span>👁 {{ post.views | number }}</span>
                        <span>❤ {{ post.likes }}</span>
                      </div>
                    </footer>
                  </div>
                </article>
              }
            </div>
          </div>
        }

        @case ('contact') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Get in touch', 'تواصل معنا') }}</span>
                <h3>{{ t('Contact X-BLEND', 'تواصل مع X-BLEND') }}</h3>
                <p>{{ t('Tell us about your project — we respond within 24 hours', 'أخبرنا عن مشروعك — نرد خلال 24 ساعة') }}</p>
              </div>
            </header>

            <section class="contact-layout">
              <div class="contact-form-card">
                <h3>{{ t('Send us a message', 'أرسل لنا رسالة') }}</h3>
                <form class="contact-form" (submit)="$event.preventDefault(); submitContact()">
                  <div class="cf-row">
                    <label class="field">
                      <span>{{ t('Your name', 'اسمك') }}</span>
                      <input placeholder="Ahmed Mohamed" />
                    </label>
                    <label class="field">
                      <span>{{ t('Email', 'البريد') }}</span>
                      <input type="email" placeholder="you@company.com" />
                    </label>
                  </div>
                  <div class="cf-row">
                    <label class="field">
                      <span>{{ t('Company', 'الشركة') }}</span>
                      <input placeholder="Acme Inc." />
                    </label>
                    <label class="field">
                      <span>{{ t('Budget range', 'الميزانية') }}</span>
                      <select>
                        <option>{{ t('Less than 50K EGP', 'أقل من 50 ألف') }}</option>
                        <option>50K - 150K EGP</option>
                        <option>150K - 500K EGP</option>
                        <option>{{ t('More than 500K EGP', 'أكثر من 500 ألف') }}</option>
                      </select>
                    </label>
                  </div>
                  <label class="field">
                    <span>{{ t('Project type', 'نوع المشروع') }}</span>
                    <div class="type-chips">
                      @for (t2 of projectTypeOptions; track t2.id) {
                        <button type="button" class="type-chip" [class.active]="selectedProjectType() === t2.id" (click)="selectedProjectType.set(t2.id)">
                          <span>{{ t2.icon }}</span>
                          <span>{{ t(t2.label, t2.labelAr) }}</span>
                        </button>
                      }
                    </div>
                  </label>
                  <label class="field">
                    <span>{{ t('Project details', 'تفاصيل المشروع') }}</span>
                    <textarea placeholder="{{ t('Tell us about your goals, timeline, and any constraints…', 'أخبرنا عن أهدافك والجدول الزمني وأي قيود…') }}"></textarea>
                  </label>
                  <button class="pill primary submit-btn" type="submit">
                    {{ sent() ? '✓ ' + t('Sent! We\'ll be in touch', 'تم! سنتواصل معك') : '✉ ' + t('Send message', 'أرسل الرسالة') }}
                  </button>
                </form>
              </div>

              <aside class="contact-info-col">
                <div class="info-card">
                  <h4>{{ t('Reach us directly', 'تواصل مباشر') }}</h4>
                  <div class="info-rows">
                    <a class="info-row" [href]="'mailto:' + company.email">
                      <span class="ir-icon">✉</span>
                      <div>
                        <small>{{ t('Email', 'البريد') }}</small>
                        <b>{{ company.email }}</b>
                      </div>
                    </a>
                    <a class="info-row" [href]="'tel:' + company.phone.replace(' ', '')">
                      <span class="ir-icon">☎</span>
                      <div>
                        <small>{{ t('Phone', 'الهاتف') }}</small>
                        <b class="mono">{{ company.phone }}</b>
                      </div>
                    </a>
                    <a class="info-row" [href]="company.website" target="_blank">
                      <span class="ir-icon">🌐</span>
                      <div>
                        <small>{{ t('Website', 'الموقع') }}</small>
                        <b>{{ company.website }}</b>
                      </div>
                    </a>
                    <div class="info-row">
                      <span class="ir-icon">📍</span>
                      <div>
                        <small>{{ t('Main office', 'المكتب الرئيسي') }}</small>
                        <b>{{ t(company.address, company.addressAr) }}</b>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="info-card">
                  <h4>{{ t('Response times', 'أوقات الرد') }}</h4>
                  <div class="sla-list">
                    @for (sla of slaItems; track sla.id) {
                      <div class="sla-row" [style.--c]="sla.color">
                        <span class="sla-icon">{{ sla.icon }}</span>
                        <div>
                          <b>{{ t(sla.title, sla.titleAr) }}</b>
                          <small>{{ t(sla.value, sla.valueAr) }}</small>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <div class="info-card">
                  <h4>{{ t('Follow us', 'تابعنا') }}</h4>
                  <div class="socials-grid">
                    @for (s of socialLinks; track s.id) {
                      <a class="social-btn" [href]="s.url" target="_blank" [style.--c]="s.color">
                        <span>{{ s.icon }}</span>
                        <span>{{ s.label }}</span>
                      </a>
                    }
                  </div>
                </div>
              </aside>
            </section>
          </div>
        }
      }

      @if (selectedProject(); as p) {
        <div class="modal-backdrop" (click)="selectedProject.set(null)">
          <div class="modal project-modal" (click)="$event.stopPropagation()">
            <header class="modal-head" [style.borderBottomColor]="p.color">
              <span class="modal-icon" [style.background]="p.gradient">{{ p.icon }}</span>
              <div>
                <h3>{{ t(p.name, p.nameAr) }}</h3>
                <p>{{ t(p.category, p.categoryAr) }} · {{ p.year }}</p>
              </div>
              <button class="modal-close" (click)="selectedProject.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="pm-hero" [style.background]="p.gradient">
                <span class="pm-hero-icon">{{ p.icon }}</span>
                <h2>{{ t(p.name, p.nameAr) }}</h2>
                <p>{{ t(p.tagline, p.taglineAr) }}</p>
              </div>

              <p class="pm-desc">{{ t(p.description, p.descriptionAr) }}</p>

              <div class="pm-metrics">
                @for (m of p.metrics; track m.label) {
                  <div class="pm-metric" [attr.data-t]="m.trend">
                    <b>{{ m.value }}</b>
                    <small>{{ t(m.label, m.labelAr) }}</small>
                  </div>
                }
              </div>

              <div class="pm-grid">
                <div class="pm-block">
                  <span class="pm-label">{{ t('Client', 'العميل') }}</span>
                  <b>{{ t(p.client, p.clientAr) }}</b>
                </div>
                <div class="pm-block">
                  <span class="pm-label">{{ t('Duration', 'المدة') }}</span>
                  <b>{{ t(p.duration, p.durationAr) }}</b>
                </div>
                <div class="pm-block">
                  <span class="pm-label">{{ t('Team size', 'حجم الفريق') }}</span>
                  <b>{{ p.team }} {{ t('people', 'أشخاص') }}</b>
                </div>
                <div class="pm-block">
                  <span class="pm-label">{{ t('Year', 'السنة') }}</span>
                  <b class="mono">{{ p.year }}</b>
                </div>
              </div>

              <div class="pm-block">
                <span class="pm-label">{{ t('Tech stack', 'التقنيات') }}</span>
                <div class="pm-chips">
                  @for (tech of p.techStack; track tech) {
                    <span class="pm-chip">{{ tech }}</span>
                  }
                </div>
              </div>
            </div>
            <footer class="modal-foot">
              <button class="mf-btn" (click)="selectedProject.set(null)">{{ t('Close', 'إغلاق') }}</button>
              <button class="mf-btn primary" (click)="requestSimilar(p)">💬 {{ t('Request similar', 'اطلب مشابهاً') }}</button>
            </footer>
          </div>
        </div>
      }

      @if (selectedTeamMember(); as m) {
        <div class="modal-backdrop" (click)="selectedTeamMember.set(null)">
          <div class="modal team-member-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon" [style.background]="m.color + '22'" [style.color]="m.color">{{ m.avatar }}</span>
              <div>
                <h3>{{ t(m.name, m.nameAr) }}</h3>
                <p>{{ t(m.role, m.roleAr) }}</p>
              </div>
              <button class="modal-close" (click)="selectedTeamMember.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <p class="tm-bio-full">{{ t(m.bio, m.bioAr) }}</p>
              <div class="tm-section">
                <span class="tm-label">{{ t('Skills', 'المهارات') }}</span>
                <div class="tm-chips">
                  @for (s of m.skills; track s) {
                    <span class="tm-chip">{{ s }}</span>
                  }
                </div>
              </div>
              <div class="tm-grid">
                <div class="tm-block">
                  <span class="tm-label">{{ t('Joined', 'تاريخ الانضمام') }}</span>
                  <b class="mono">{{ m.joinedAt }}</b>
                </div>
                <div class="tm-block">
                  <span class="tm-label">{{ t('Role', 'الدور') }}</span>
                  <b>{{ t(m.role, m.roleAr) }}</b>
                </div>
              </div>
            </div>
            <footer class="modal-foot">
              <button class="mf-btn" (click)="selectedTeamMember.set(null)">{{ t('Close', 'إغلاق') }}</button>
              @if (m.socials.linkedin) {
                <a class="mf-btn primary" [href]="m.socials.linkedin" target="_blank">🔗 {{ t('LinkedIn', 'لينكد إن') }}</a>
              }
            </footer>
          </div>
        </div>
      }

      @if (selectedJob(); as j) {
        <div class="modal-backdrop" (click)="selectedJob.set(null)">
          <div class="modal job-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon" [style.background]="departmentColor(j.department) + '22'" [style.color]="departmentColor(j.department)">💼</span>
              <div>
                <h3>{{ t(j.title, j.titleAr) }}</h3>
                <p>{{ t(j.department, j.departmentAr) }} · {{ t(j.location, j.locationAr) }}</p>
              </div>
              <button class="modal-close" (click)="selectedJob.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="job-hero">
                <div class="jh-item"><small>{{ t('Type', 'النوع') }}</small><b>{{ t(j.type, jobTypeAr(j.type)) }}</b></div>
                <div class="jh-item"><small>{{ t('Level', 'المستوى') }}</small><b>{{ t(j.level, jobLevelAr(j.level)) }}</b></div>
                <div class="jh-item"><small>{{ t('Salary', 'الراتب') }}</small><b class="mono">{{ j.salaryRange }}</b></div>
              </div>
              <p>{{ t(j.description, j.descriptionAr) }}</p>
              <div class="om-block">
                <span class="om-label">{{ t('Required skills', 'المهارات المطلوبة') }}</span>
                <div class="jc-skills">
                  @for (s of j.skills; track s) {
                    <span class="jc-skill">{{ s }}</span>
                  }
                </div>
              </div>
            </div>
            <footer class="modal-foot">
              <button class="mf-btn" (click)="selectedJob.set(null)">{{ t('Close', 'إغلاق') }}</button>
              @if (j.open) {
                <button class="mf-btn primary" (click)="applyJob(j); selectedJob.set(null)">{{ t('Apply now', 'قدم الآن') }}</button>
              }
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
    .muted { color: var(--label-2); }

    .xb-bar {
      display: flex; align-items: center; gap: 14px; padding: 12px 18px;
      background: linear-gradient(135deg, rgba(88, 86, 214, 0.08) 0%, rgba(0, 122, 255, 0.05) 100%);
      border: 0.5px solid var(--separator); border-radius: var(--r-md); flex-wrap: wrap;
    }
    .lang-switch { display: flex; gap: 2px; padding: 3px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .ls-btn { padding: 5px 12px; border-radius: calc(var(--r-sm) - 4px); font-size: 11px; font-weight: 700; color: var(--label-2); background: transparent; border: 0; cursor: pointer; }
    .ls-btn.active { background: var(--bg-surface-solid); color: var(--label); box-shadow: var(--shadow-xs); }
    .est-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-size: 11px; font-weight: 700; color: var(--label-2); }
    .est-pill span { color: #5856d6; }
    .status-pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-size: 11px; font-weight: 700; color: var(--label-2); }
    .status-pill.hiring { color: #34c759; }
    .status-pill .status-dot { width: 8px; height: 8px; background: currentColor; border-radius: 50%; }
    .quick-stats { display: flex; gap: 8px; font-size: 11px; color: var(--label-2); }
    .quick-stats b { color: #5856d6; font-weight: 800; font-family: var(--sf-mono); }
    .qs-sep { color: var(--label-4); }
    .cta-pill {
      margin-left: auto; padding: 8px 18px;
      background: linear-gradient(135deg, #5856d6, #007aff); color: #fff;
      border: 0; border-radius: var(--r-pill); font-size: 11px; font-weight: 800;
      cursor: pointer; transition: transform 140ms;
    }
    .cta-pill:hover { transform: translateY(-1px); }

    .view-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
    .view-head h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .view-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }
    .eyebrow { display: block; font-size: var(--fs-2xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #5856d6; margin-bottom: 6px; }
    .view-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

    .pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: var(--bg-fill-2); color: var(--label); border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 600; border: 0; cursor: pointer; transition: all 140ms; }
    .pill:hover { background: var(--bg-fill-3); }
    .pill.primary { background: linear-gradient(135deg, #5856d6, #007aff); color: #fff; }
    .pill.primary:hover { opacity: 0.9; }
    .pill.full { width: 100%; justify-content: center; }
    .sel { padding: 7px 12px; background: var(--bg-input); color: var(--label); border: 0.5px solid var(--separator); border-radius: var(--r-sm); font-size: var(--fs-xs); cursor: pointer; outline: none; font-family: inherit; }

    .xb-hero {
      display: grid; grid-template-columns: 1fr 340px; gap: 32px;
      padding: 48px 0 40px;
    }
    @media (max-width: 1000px) { .xb-hero { grid-template-columns: 1fr; padding: 32px 0; } }
    .hero-inner { display: flex; flex-direction: column; gap: 18px; }
    .hero-eyebrow {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: var(--fs-2xs); font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
      color: #5856d6; width: fit-content;
      padding: 6px 14px; background: rgba(88, 86, 214, 0.1); border-radius: var(--r-pill);
    }
    .hero-title {
      font-size: clamp(40px, 7vw, 88px); font-weight: 900;
      line-height: 0.98; letter-spacing: -0.045em;
      color: var(--label);
    }
    .hero-title em {
      font-style: italic; font-weight: 300;
      background: linear-gradient(135deg, #5856d6, #007aff, #34c759);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .hero-lede { font-size: var(--fs-md); line-height: 1.6; color: var(--label-2); max-width: 620px; }
    .hero-cta { display: flex; gap: 12px; flex-wrap: wrap; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 10px; padding: 14px 26px;
      background: linear-gradient(135deg, #5856d6, #007aff); color: #fff;
      border: 0; border-radius: var(--r-pill); font-size: var(--fs-sm); font-weight: 800;
      cursor: pointer; transition: all 180ms;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(88, 86, 214, 0.35); }
    .btn-arrow { font-size: 16px; }
    .btn-ghost {
      display: inline-flex; align-items: center; gap: 10px; padding: 14px 22px;
      background: var(--bg-fill-2); color: var(--label);
      border: 1.5px solid var(--separator); border-radius: var(--r-pill);
      font-size: var(--fs-sm); font-weight: 700; cursor: pointer; transition: all 180ms;
    }
    .btn-ghost:hover { border-color: #5856d6; color: #5856d6; }
    .play-icon { font-size: 11px; }
    .hero-trust {
      display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
      margin-top: 12px; padding-top: 20px; border-top: 0.5px solid var(--separator);
    }
    .ht-label { font-size: var(--fs-2xs); color: var(--label-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .ht-logo { font-size: 22px; opacity: 0.7; transition: opacity 140ms; }
    .ht-logo:hover { opacity: 1; }

    .hero-side { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .side-card {
      padding: 20px 18px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md);
      display: flex; flex-direction: column; gap: 4px;
    }
    .side-card.accent { background: linear-gradient(135deg, rgba(88, 86, 214, 0.1), rgba(0, 122, 255, 0.05)); border-color: rgba(88, 86, 214, 0.3); }
    .sc-num { font-size: var(--fs-3xl); font-weight: 900; letter-spacing: -0.04em; color: #5856d6; line-height: 1; font-variant-numeric: tabular-nums; }
    .sc-star { color: #ffcc00; font-size: 0.7em; margin-left: 2px; }
    .sc-label { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    .xb-stats-strip {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
      padding: 20px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md);
    }
    @media (max-width: 800px) { .xb-stats-strip { grid-template-columns: repeat(2, 1fr); } }
    .strip-item { display: flex; align-items: center; gap: 12px; }
    .si-icon { font-size: 28px; }
    .si-val { display: block; font-size: var(--fs-xl); font-weight: 800; color: #5856d6; font-variant-numeric: tabular-nums; line-height: 1; }
    .si-label { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    .xb-section { display: flex; flex-direction: column; gap: 24px; }
    .xb-section.dark { background: linear-gradient(135deg, #0a0a14, #141428); padding: 40px 24px; border-radius: var(--r-lg); margin: 0 -8px; }
    .xb-section.accent-bg { background: linear-gradient(135deg, #5856d6, #007aff); padding: 40px 24px; border-radius: var(--r-lg); margin: 0 -8px; }
    .sec-head { display: flex; flex-direction: column; gap: 8px; }
    .sec-head.center { align-items: center; text-align: center; }
    .sec-eyebrow { font-size: var(--fs-2xs); font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #5856d6; }
    .sec-eyebrow.green { color: #34c759; }
    .sec-eyebrow.on-accent { color: rgba(255, 255, 255, 0.85); }
    .sec-title { font-size: clamp(28px, 4vw, 48px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; color: var(--label); }
    .sec-title.light { color: #fff; }
    .sec-title em { font-style: italic; font-weight: 300; color: #5856d6; }
    .sec-title.light em { color: #34c759; }
    .sec-cta { display: flex; justify-content: center; }

    .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .service-card {
      padding: 24px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md);
      border-top: 3px solid var(--c); display: flex; flex-direction: column; gap: 12px;
      cursor: pointer; transition: all 200ms;
    }
    .service-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .svc-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 24px; }
    .service-card h3 { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.02em; }
    .service-card > p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.55; }
    .svc-bullets { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .svc-bullets li { font-size: var(--fs-2xs); color: var(--label-2); padding-left: 16px; position: relative; }
    .svc-bullets li::before { content: '✓'; position: absolute; left: 0; color: var(--c); font-weight: 800; }
    .svc-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 0.5px solid var(--separator); margin-top: auto; }
    .svc-price { font-size: var(--fs-2xs); color: var(--label-2); }
    .svc-price b { color: var(--c); font-weight: 800; font-family: var(--sf-mono); }
    .svc-arrow { color: var(--c); font-weight: 800; }

    .featured-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .featured-card {
      padding: 28px; border-radius: var(--r-lg); color: #fff;
      display: flex; flex-direction: column; gap: 14px;
      cursor: pointer; transition: all 200ms; min-height: 280px;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.15);
    }
    .featured-card:hover { transform: translateY(-4px); box-shadow: 0 28px 64px rgba(0, 0, 0, 0.25); }
    .fc-head { display: flex; justify-content: space-between; align-items: center; }
    .fc-icon { font-size: 40px; }
    .fc-category { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 10px; background: rgba(255, 255, 255, 0.2); border-radius: var(--r-pill); backdrop-filter: blur(8px); }
    .featured-card h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .featured-card > p { font-size: var(--fs-sm); line-height: 1.55; opacity: 0.9; }
    .fc-stack { display: flex; flex-wrap: wrap; gap: 6px; }
    .fc-tech { font-size: 10px; padding: 3px 9px; background: rgba(255, 255, 255, 0.18); border-radius: var(--r-pill); font-family: var(--sf-mono); font-weight: 600; }
    .fc-foot { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.2); font-size: 11px; }
    .fc-open { font-weight: 700; }

    .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .testimonial-card {
      padding: 24px; background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--r-md);
      display: flex; flex-direction: column; gap: 14px; color: #fff;
      backdrop-filter: blur(20px);
    }
    .tm-quote-mark { font-size: 48px; line-height: 0.5; color: #34c759; font-family: Georgia, serif; }
    .tm-quote { font-size: var(--fs-sm); line-height: 1.65; color: rgba(255, 255, 255, 0.92); }
    .tm-stars { display: flex; gap: 3px; }
    .tm-stars span { color: rgba(255, 255, 255, 0.25); font-size: 16px; }
    .tm-stars span.filled { color: #ffcc00; }
    .tm-foot { display: flex; align-items: center; gap: 12px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.1); }
    .tm-avatar { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%; font-size: 14px; font-weight: 800; }
    .tm-foot b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .tm-foot small { font-size: 10px; color: rgba(255, 255, 255, 0.6); }

    .process-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    @media (max-width: 900px) { .process-row { grid-template-columns: repeat(2, 1fr); } }
    .process-mini {
      padding: 20px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md);
      display: flex; flex-direction: column; gap: 8px; align-items: flex-start;
      cursor: pointer; transition: all 180ms;
    }
    .process-mini:hover { border-color: #5856d6; transform: translateY(-3px); }
    .pm-num { font-size: 28px; font-weight: 900; color: #5856d6; font-family: var(--sf-mono); line-height: 1; }
    .pm-icon { font-size: 24px; }
    .process-mini b { font-size: var(--fs-sm); font-weight: 700; }
    .process-mini small { font-size: 10px; color: var(--label-2); }

    .cta-block { display: grid; grid-template-columns: 1fr auto; gap: 32px; align-items: center; color: #fff; }
    @media (max-width: 800px) { .cta-block { grid-template-columns: 1fr; } }
    .cta-title { font-size: clamp(28px, 4vw, 44px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin-top: 8px; }
    .cta-title em { font-style: italic; font-weight: 300; color: #ffcc00; }
    .cta-lede { font-size: var(--fs-sm); line-height: 1.6; opacity: 0.92; margin-top: 12px; }
    .cta-actions { display: flex; flex-direction: column; gap: 10px; }
    .btn-light {
      display: inline-flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 16px 24px; background: #fff; color: #5856d6;
      border: 0; border-radius: var(--r-pill); font-size: var(--fs-sm); font-weight: 800;
      cursor: pointer; transition: all 180ms;
    }
    .btn-light:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2); }
    .btn-outline-light {
      display: inline-flex; align-items: center; gap: 10px; padding: 14px 22px;
      background: rgba(255, 255, 255, 0.12); color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.3); border-radius: var(--r-pill);
      font-size: var(--fs-xs); font-weight: 700; text-decoration: none;
      transition: all 180ms;
    }
    .btn-outline-light:hover { background: rgba(255, 255, 255, 0.2); }

    .blog-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media (max-width: 800px) { .blog-row { grid-template-columns: 1fr; } }
    .blog-mini {
      padding: 20px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md);
      display: grid; grid-template-columns: 56px 1fr; gap: 14px; align-items: center;
      cursor: pointer; transition: all 180ms;
    }
    .blog-mini:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .bm-thumb { width: 56px; height: 56px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 26px; }
    .bm-cat { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--c); }
    .bm-body b { font-size: var(--fs-sm); font-weight: 700; display: block; margin-top: 2px; line-height: 1.35; }
    .bm-meta { font-size: 10px; color: var(--label-3); margin-top: 4px; display: block; }

    .service-stats, .team-stats {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
    }
    @media (max-width: 800px) { .service-stats, .team-stats { grid-template-columns: repeat(2, 1fr); } }
    .ss-card, .ts-card {
      padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); border-left: 3px solid var(--c);
      display: flex; flex-direction: column; gap: 4px;
    }
    .ss-icon, .ts-icon { font-size: 20px; }
    .ss-val, .ts-val { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
    .ss-card small, .ts-card small { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    .services-full { display: flex; flex-direction: column; gap: 16px; }
    .service-full {
      padding: 24px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md);
      border-left: 4px solid var(--c); display: flex; flex-direction: column; gap: 16px;
    }
    .sf-head { display: grid; grid-template-columns: 56px 1fr auto; gap: 16px; align-items: center; }
    @media (max-width: 700px) { .sf-head { grid-template-columns: 1fr; } }
    .sf-icon { width: 56px; height: 56px; display: grid; place-items: center; border-radius: var(--r-md); font-size: 26px; }
    .sf-head h3 { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.015em; }
    .sf-head p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 3px; }
    .sf-meta { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; text-align: right; }
    .sf-price { font-size: 11px; color: var(--label-2); }
    .sf-price b { color: var(--c); font-weight: 800; font-family: var(--sf-mono); }
    .sf-timeline { font-size: 11px; color: var(--label-3); }
    .sf-body { display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center; }
    @media (max-width: 700px) { .sf-body { grid-template-columns: 1fr; } }
    .sf-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-3); display: block; margin-bottom: 8px; }
    .sf-bullets ul { list-style: none; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    @media (max-width: 600px) { .sf-bullets ul { grid-template-columns: 1fr; } }
    .sf-bullets li { font-size: var(--fs-xs); color: var(--label-2); display: flex; gap: 8px; align-items: flex-start; }
    .bullet-check { color: var(--c); font-weight: 800; flex-shrink: 0; }
    .sf-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    .card { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 14px; }
    .card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .card-head h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .card-head small { font-size: var(--fs-2xs); color: var(--label-2); display: block; margin-top: 2px; }

    .engagements { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    @media (max-width: 800px) { .engagements { grid-template-columns: 1fr; } }
    .engage-card {
      padding: 22px; background: var(--bg-fill-2); border-radius: var(--r-md);
      border: 1.5px solid var(--separator); position: relative;
      display: flex; flex-direction: column; gap: 10px;
    }
    .engage-card.popular { border-color: var(--c); box-shadow: 0 8px 32px rgba(88, 86, 214, 0.2); background: linear-gradient(180deg, rgba(88, 86, 214, 0.05), transparent); }
    .popular-badge {
      position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
      padding: 3px 12px; background: linear-gradient(135deg, #5856d6, #007aff); color: #fff;
      border-radius: var(--r-pill); font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;
    }
    .engage-icon { font-size: 28px; }
    .engage-card > b { font-size: var(--fs-base); font-weight: 700; }
    .engage-price { font-size: var(--fs-lg); font-weight: 900; color: var(--c); }
    .engage-card > p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.55; }
    .engage-features { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 6px 0; }
    .engage-features li { font-size: var(--fs-2xs); color: var(--label); }

    .filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .fc-chip {
      padding: 8px 14px; border-radius: var(--r-pill); background: var(--bg-fill-2);
      color: var(--label-2); font-size: var(--fs-2xs); font-weight: 600;
      border: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
      transition: all 140ms;
    }
    .fc-chip:hover { background: var(--bg-fill-3); color: var(--label); }
    .fc-chip.active { background: linear-gradient(135deg, #5856d6, #007aff); color: #fff; }
    .fc-count { background: rgba(255, 255, 255, 0.2); padding: 1px 6px; border-radius: var(--r-pill); font-size: 9px; font-weight: 700; }

    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .project-card {
      background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); overflow: hidden; cursor: pointer; transition: all 200ms;
      display: flex; flex-direction: column;
    }
    .project-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .pc-thumb {
      height: 140px; display: grid; place-items: center; position: relative;
    }
    .pc-emoji { font-size: 56px; filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2)); }
    .pc-featured {
      position: absolute; top: 10px; right: 10px;
      padding: 4px 10px; background: rgba(255, 204, 0, 0.95); color: #1a1a1a;
      border-radius: var(--r-pill); font-size: 10px; font-weight: 800;
    }
    .pc-body { padding: 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .pc-cat-row { display: flex; justify-content: space-between; align-items: center; }
    .pc-cat { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
    .pc-year { font-size: 10px; color: var(--label-3); font-weight: 700; }
    .pc-body h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .pc-tagline { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5; }
    .pc-stack { display: flex; flex-wrap: wrap; gap: 4px; }
    .pc-tech { font-size: 9px; padding: 3px 8px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-family: var(--sf-mono); color: var(--label-2); }
    .pc-tech.more { background: rgba(88, 86, 214, 0.15); color: #5856d6; font-weight: 700; }
    .pc-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding-top: 10px; border-top: 0.5px solid var(--separator); }
    .pcm-item b { font-size: var(--fs-sm); font-weight: 800; font-variant-numeric: tabular-nums; display: block; }
    .pcm-item b.up { color: #34c759; }
    .pcm-item b.down { color: #ff3b30; }
    .pcm-item small { font-size: 9px; color: var(--label-3); text-transform: uppercase; font-weight: 700; letter-spacing: 0.04em; }
    .pc-foot { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 10px; border-top: 0.5px solid var(--separator); }
    .pc-client { font-size: 10px; color: var(--label-2); }
    .pc-open { font-size: 11px; color: #5856d6; font-weight: 800; }

    .projects-detail-list { display: flex; flex-direction: column; gap: 16px; }
    .project-detail {
      padding: 24px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md);
      border-left: 4px solid var(--c); display: flex; flex-direction: column; gap: 16px;
    }
    .pd-head { display: grid; grid-template-columns: 64px 1fr auto; gap: 18px; align-items: center; }
    @media (max-width: 700px) { .pd-head { grid-template-columns: 1fr; } }
    .pd-icon { width: 64px; height: 64px; display: grid; place-items: center; border-radius: var(--r-md); font-size: 30px; color: #fff; }
    .pd-title h4 { font-size: var(--fs-lg); font-weight: 800; letter-spacing: -0.02em; }
    .pd-title p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 3px; }
    .pd-meta { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; text-align: right; font-size: 11px; color: var(--label-2); }
    .pd-desc { font-size: var(--fs-sm); line-height: 1.6; color: var(--label); }
    .pd-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    @media (max-width: 700px) { .pd-metrics { grid-template-columns: repeat(2, 1fr); } }
    .pdm-card {
      padding: 12px 14px; background: var(--bg-fill-2); border-radius: var(--r-sm);
      border-left: 3px solid #5856d6;
    }
    .pdm-card[data-t='up'] { border-left-color: #34c759; }
    .pdm-card[data-t='down'] { border-left-color: #ff9500; }
    .pdm-card b { font-size: var(--fs-base); font-weight: 800; display: block; font-variant-numeric: tabular-nums; }
    .pdm-card small { font-size: 10px; color: var(--label-2); text-transform: uppercase; font-weight: 700; letter-spacing: 0.04em; }
    .pd-stack { display: flex; flex-direction: column; gap: 8px; }
    .pd-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--label-3); letter-spacing: 0.06em; }
    .pd-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .pd-chip { font-size: 10px; padding: 4px 10px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-family: var(--sf-mono); color: var(--label-2); }
    .pd-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 0.5px solid var(--separator); flex-wrap: wrap; gap: 12px; }
    .pd-client { font-size: var(--fs-xs); color: var(--label-2); }
    .pd-client b { color: var(--label); }

    .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .team-card {
      padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); display: flex; flex-direction: column; align-items: center; gap: 10px;
      text-align: center; cursor: pointer; transition: all 200ms;
    }
    .team-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--c); }
    .tc-avatar { width: 72px; height: 72px; display: grid; place-items: center; border-radius: 50%; font-size: 32px; margin-bottom: 4px; }
    .team-card h4 { font-size: var(--fs-base); font-weight: 700; }
    .tc-role { font-size: var(--fs-xs); font-weight: 700; color: var(--c); }
    .tc-bio { font-size: var(--fs-2xs); color: var(--label-2); line-height: 1.55; }
    .tc-skills { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
    .tc-chip { font-size: 9px; padding: 3px 8px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-family: var(--sf-mono); color: var(--label-2); }
    .tc-foot { display: flex; justify-content: space-between; width: 100%; padding-top: 12px; border-top: 0.5px solid var(--separator); margin-top: 4px; color: var(--label-3); }

    .about-hero { display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; align-items: flex-start; }
    @media (max-width: 900px) { .about-hero { grid-template-columns: 1fr; } }
    .about-story { padding: 28px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 16px; }
    .about-story h2 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.02em; }
    .about-story p { font-size: var(--fs-sm); line-height: 1.7; color: var(--label-2); }
    .about-values { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; padding-top: 20px; border-top: 0.5px solid var(--separator); }
    .about-values h3 { font-size: var(--fs-base); font-weight: 800; }
    .value-row { display: grid; grid-template-columns: 40px 1fr; gap: 14px; align-items: flex-start; padding: 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); border-left: 3px solid var(--c); }
    .vr-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 20px; }
    .value-row b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .value-row p { font-size: var(--fs-2xs); color: var(--label-2); line-height: 1.5; margin-top: 3px; }
    .about-side { display: flex; flex-direction: column; gap: 16px; }
    .office-list, .about-numbers { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 12px; }
    .office-list h3, .about-numbers h3 { font-size: var(--fs-sm); font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-3); }
    .office-card { display: grid; grid-template-columns: 40px 1fr; gap: 12px; padding: 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .office-card.main { border-left: 3px solid #5856d6; }
    .oc-icon { font-size: 24px; text-align: center; }
    .office-card b { font-size: var(--fs-xs); font-weight: 700; display: flex; align-items: center; gap: 6px; }
    .main-badge { font-size: 8px; font-weight: 800; padding: 2px 6px; background: #5856d6; color: #fff; border-radius: var(--r-pill); letter-spacing: 0.04em; }
    .office-card small { font-size: 10px; color: var(--label-2); display: block; margin-top: 3px; }
    .an-row { display: grid; grid-template-columns: 32px 1fr; gap: 12px; align-items: center; padding: 8px 0; border-bottom: 0.5px solid var(--separator); }
    .an-row:last-child { border-bottom: 0; }
    .an-icon { font-size: 20px; text-align: center; }
    .an-val { font-size: var(--fs-base); font-weight: 800; color: var(--c); font-variant-numeric: tabular-nums; }
    .an-row small { font-size: 10px; color: var(--label-2); display: block; }

    .timeline-list { display: flex; flex-direction: column; gap: 0; }
    .timeline-row { display: grid; grid-template-columns: 80px 24px 1fr; gap: 16px; align-items: flex-start; padding: 12px 0; position: relative; }
    .timeline-row::before { content: ''; position: absolute; left: 92px; top: 30px; bottom: -12px; width: 1px; background: var(--separator); }
    .timeline-row:last-child::before { display: none; }
    .tr-year { font-family: var(--sf-mono); font-size: var(--fs-base); font-weight: 800; color: var(--c); text-align: right; padding-top: 2px; }
    .tr-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--c); margin-top: 4px; border: 3px solid var(--bg-surface-solid); box-shadow: 0 0 0 1px var(--c); position: relative; z-index: 1; }
    .tr-body b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .tr-body p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5; margin-top: 3px; }

    .process-full { display: flex; flex-direction: column; gap: 0; }
    .process-step { display: grid; grid-template-columns: 80px 1fr; gap: 24px; padding: 8px 0; }
    .ps-num-col { display: flex; flex-direction: column; align-items: center; gap: 0; position: relative; }
    .ps-num { font-size: 32px; font-weight: 900; color: var(--c); font-family: var(--sf-mono); line-height: 1; padding: 12px 0; }
    .ps-connector { flex: 1; width: 2px; background: linear-gradient(180deg, var(--c), transparent); opacity: 0.3; }
    .ps-body { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-left: 4px solid var(--c); display: flex; flex-direction: column; gap: 12px; }
    .ps-body header { display: flex; align-items: center; gap: 14px; }
    .ps-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 24px; flex-shrink: 0; }
    .ps-body h4 { font-size: var(--fs-lg); font-weight: 800; letter-spacing: -0.02em; }
    .ps-duration { font-size: 10px; font-weight: 700; color: var(--label-3); letter-spacing: 0.04em; }
    .ps-body > p { font-size: var(--fs-sm); color: var(--label-2); line-height: 1.6; }
    .ps-deliverables { display: flex; flex-direction: column; gap: 8px; padding-top: 12px; border-top: 0.5px solid var(--separator); }
    .ps-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--label-3); letter-spacing: 0.06em; }
    .ps-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .ps-chip { font-size: 10px; padding: 4px 10px; background: rgba(88, 86, 214, 0.1); color: #5856d6; border-radius: var(--r-pill); font-weight: 600; }

    .tech-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .tf-chip {
      padding: 8px 14px; border-radius: var(--r-pill); background: var(--bg-fill-2);
      color: var(--label-2); font-size: var(--fs-2xs); font-weight: 600;
      border: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
      border-left: 3px solid var(--c); transition: all 140ms;
    }
    .tf-chip.active { background: linear-gradient(135deg, #5856d6, #007aff); color: #fff; }
    .tf-count { font-size: 9px; font-weight: 700; opacity: 0.8; }

    .tech-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
    .tech-card {
      padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); border-left: 3px solid var(--c);
      display: flex; flex-direction: column; gap: 12px;
    }
    .tc-head { display: grid; grid-template-columns: 40px 1fr auto; gap: 12px; align-items: center; }
    .tc-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 20px; }
    .tc-head b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .tc-head small { font-size: 10px; color: var(--label-2); }
    .tc-years { font-size: 11px; font-weight: 800; color: var(--c); }
    .tc-level { display: flex; flex-direction: column; gap: 6px; }
    .tcl-head { display: flex; justify-content: space-between; font-size: 10px; color: var(--label-2); }
    .tcl-head b { color: var(--c); font-weight: 800; }
    .tcl-track { height: 5px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .tcl-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms; }
    .tc-foot-row { padding-top: 10px; border-top: 0.5px solid var(--separator); color: var(--label-3); }

    .clients-strip { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
    .client-logo-card {
      padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); display: flex; flex-direction: column; align-items: center; gap: 8px;
      cursor: pointer; transition: all 200ms; text-align: center;
    }
    .client-logo-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--c); }
    .clc-logo { font-size: 40px; }
    .client-logo-card b { font-size: var(--fs-sm); font-weight: 700; }
    .client-logo-card small { font-size: 10px; color: var(--label-2); }
    .clc-meta { display: flex; gap: 10px; font-size: 10px; color: var(--label-3); margin-top: 6px; padding-top: 8px; border-top: 0.5px solid var(--separator); width: 100%; justify-content: center; }

    .testimonials-full { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }
    .testimonial-full { padding: 20px; background: var(--bg-fill-2); border-radius: var(--r-md); border-left: 3px solid var(--c); display: flex; flex-direction: column; gap: 12px; }
    .tfull-head { display: grid; grid-template-columns: 40px 1fr auto; gap: 12px; align-items: center; }
    .tfull-avatar { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%; font-size: 14px; font-weight: 800; }
    .tfull-head b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .tfull-head small { font-size: 10px; color: var(--label-2); }
    .tfull-rating { display: flex; gap: 2px; }
    .tfull-rating span { color: var(--label-4); font-size: 13px; }
    .tfull-rating span.filled { color: #ffcc00; }
    .tfull-quote { font-size: var(--fs-sm); line-height: 1.6; font-style: italic; color: var(--label); }
    .tfull-foot { padding-top: 10px; border-top: 0.5px solid var(--separator); color: var(--label-3); }

    .careers-hero { padding: 32px; background: linear-gradient(135deg, rgba(88, 86, 214, 0.08), rgba(0, 122, 255, 0.05)); border-radius: var(--r-lg); border: 0.5px solid var(--separator); }
    .ch-content h2 { font-size: var(--fs-3xl); font-weight: 800; letter-spacing: -0.03em; margin-bottom: 8px; }
    .ch-content > p { font-size: var(--fs-sm); color: var(--label-2); line-height: 1.6; max-width: 720px; margin-bottom: 24px; }
    .ch-perks { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
    .perk { padding: 16px; background: var(--bg-surface-solid); border-radius: var(--r-sm); border-left: 3px solid var(--c); display: flex; flex-direction: column; gap: 4px; }
    .perk-icon { font-size: 24px; }
    .perk b { font-size: var(--fs-xs); font-weight: 700; }
    .perk small { font-size: 10px; color: var(--label-2); line-height: 1.4; }

    .jobs-list { display: flex; flex-direction: column; gap: 12px; }
    .job-card {
      padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); display: flex; flex-direction: column; gap: 12px;
      cursor: pointer; transition: all 180ms; border-left: 4px solid #34c759;
    }
    .job-card[data-open='false'] { opacity: 0.6; border-left-color: var(--label-3); }
    .job-card:hover { transform: translateX(3px); box-shadow: var(--shadow-md); }
    .jc-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    .jc-head h4 { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.015em; }
    .jc-meta { display: flex; gap: 8px; align-items: center; font-size: 11px; color: var(--label-2); margin-top: 4px; flex-wrap: wrap; }
    .jc-dept { font-weight: 800; }
    .jc-type, .jc-level { padding: 2px 8px; border-radius: var(--r-pill); font-size: 10px; font-weight: 700; }
    .jc-type[data-t='full-time'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .jc-type[data-t='part-time'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .jc-type[data-t='contract'] { background: rgba(175, 82, 222, 0.15); color: #af52de; }
    .jc-type[data-t='internship'] { background: var(--accent-soft); color: var(--accent); }
    .jc-level[data-l='junior'] { background: var(--bg-fill-2); color: var(--label-2); }
    .jc-level[data-l='mid'] { background: rgba(0, 122, 255, 0.15); color: #007aff; }
    .jc-level[data-l='senior'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .jc-level[data-l='lead'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .jc-dot { color: var(--label-4); }
    .jc-right { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
    .jc-salary { font-size: var(--fs-sm); font-weight: 800; color: #34c759; font-family: var(--sf-mono); }
    .jc-closed { font-size: 10px; font-weight: 700; padding: 3px 8px; background: rgba(255, 59, 48, 0.15); color: #ff3b30; border-radius: var(--r-pill); }
    .jc-desc { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.55; }
    .jc-skills { display: flex; flex-wrap: wrap; gap: 4px; }
    .jc-skill { font-size: 10px; padding: 3px 9px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-family: var(--sf-mono); color: var(--label-2); }
    .jc-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 0.5px solid var(--separator); color: var(--label-3); flex-wrap: wrap; gap: 8px; }

    .blog-featured { display: grid; grid-template-columns: 340px 1fr; gap: 24px; padding: 24px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-lg); cursor: pointer; transition: all 200ms; }
    .blog-featured:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    @media (max-width: 800px) { .blog-featured { grid-template-columns: 1fr; } }
    .bf-thumb { position: relative; height: 220px; border-radius: var(--r-md); display: grid; place-items: center; }
    .bf-emoji { font-size: 80px; }
    .bf-badge { position: absolute; top: 12px; left: 12px; padding: 4px 12px; background: rgba(255, 204, 0, 0.95); color: #1a1a1a; border-radius: var(--r-pill); font-size: 10px; font-weight: 800; }
    .bf-body { display: flex; flex-direction: column; gap: 12px; justify-content: center; }
    .bf-cat { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
    .bf-body h4 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; line-height: 1.15; }
    .bf-body > p { font-size: var(--fs-sm); color: var(--label-2); line-height: 1.6; }
    .bf-meta { display: flex; gap: 8px; font-size: 11px; color: var(--label-3); flex-wrap: wrap; }
    .bf-stats { display: flex; gap: 16px; font-size: 11px; color: var(--label-2); padding-top: 10px; border-top: 0.5px solid var(--separator); }

    .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .blog-card { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; cursor: pointer; transition: all 200ms; display: flex; flex-direction: column; }
    .blog-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .bc-thumb { height: 120px; display: grid; place-items: center; position: relative; }
    .bc-emoji { font-size: 48px; }
    .bc-cat-chip { position: absolute; top: 10px; left: 10px; padding: 3px 10px; background: rgba(255, 255, 255, 0.95); border-radius: var(--r-pill); font-size: 9px; font-weight: 800; text-transform: uppercase; }
    .bc-body { padding: 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .bc-body h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; line-height: 1.3; }
    .bc-body > p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.55; flex: 1; }
    .bc-tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .bc-tag { font-size: 10px; color: var(--c); font-family: var(--sf-mono); }
    .bc-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 0.5px solid var(--separator); color: var(--label-3); }
    .bc-stats { display: flex; gap: 10px; font-size: 10px; }

    .contact-layout { display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; align-items: flex-start; }
    @media (max-width: 900px) { .contact-layout { grid-template-columns: 1fr; } }
    .contact-form-card { padding: 28px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .contact-form-card h3 { font-size: var(--fs-lg); font-weight: 800; margin-bottom: 20px; }
    .contact-form { display: flex; flex-direction: column; gap: 16px; }
    .cf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 600px) { .cf-row { grid-template-columns: 1fr; } }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field > span { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-3); }
    .field input, .field select, .field textarea {
      padding: 12px 14px; background: var(--bg-input); color: var(--label);
      border: 1px solid var(--separator); border-radius: var(--r-sm);
      font-size: var(--fs-sm); outline: none; font-family: inherit;
      transition: border-color 140ms;
    }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: #5856d6; }
    .field textarea { min-height: 100px; resize: vertical; }
    .type-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .type-chip { padding: 8px 14px; background: var(--bg-fill-2); border: 1px solid var(--separator); border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 600; color: var(--label-2); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 140ms; }
    .type-chip.active { background: linear-gradient(135deg, #5856d6, #007aff); color: #fff; border-color: transparent; }
    .submit-btn { align-self: flex-start; padding: 14px 28px; font-weight: 800; }

    .contact-info-col { display: flex; flex-direction: column; gap: 16px; }
    .info-card { padding: 22px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 14px; }
    .info-card h4 { font-size: var(--fs-sm); font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-3); }
    .info-rows { display: flex; flex-direction: column; gap: 10px; }
    .info-row { display: grid; grid-template-columns: 40px 1fr; gap: 12px; align-items: center; padding: 10px; border-radius: var(--r-sm); background: var(--bg-fill-2); text-decoration: none; color: var(--label); transition: all 140ms; }
    .info-row:hover { background: var(--bg-fill-3); }
    .ir-icon { font-size: 22px; text-align: center; }
    .info-row small { font-size: 10px; color: var(--label-3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; display: block; }
    .info-row b { font-size: var(--fs-xs); font-weight: 700; display: block; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sla-list { display: flex; flex-direction: column; gap: 10px; }
    .sla-row { display: grid; grid-template-columns: 32px 1fr; gap: 12px; align-items: center; padding: 10px; background: var(--bg-fill-2); border-radius: var(--r-sm); border-left: 3px solid var(--c); }
    .sla-icon { font-size: 20px; text-align: center; }
    .sla-row b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .sla-row small { font-size: 10px; color: var(--label-2); }
    .socials-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .social-btn { padding: 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); text-decoration: none; color: var(--label); font-size: var(--fs-2xs); font-weight: 700; display: flex; align-items: center; gap: 8px; border-left: 3px solid var(--c); transition: all 140ms; }
    .social-btn:hover { background: var(--bg-fill-3); transform: translateX(2px); }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(8px); z-index: 9990; display: grid; place-items: center; padding: 40px 20px; animation: fadeIn 200ms; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal { max-width: 720px; width: 100%; max-height: 88vh; background: var(--bg-elevated); border: 0.5px solid var(--separator); border-radius: var(--r-lg); box-shadow: var(--shadow-xl); display: flex; flex-direction: column; overflow: hidden; animation: modalIn 300ms var(--ease-spring); }
    .modal.team-member-modal { max-width: 620px; }
    .modal.job-modal { max-width: 640px; }
    @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .modal-head { display: flex; align-items: center; gap: 14px; padding: 20px 24px; border-bottom: 0.5px solid var(--separator); }
    .modal-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: var(--r-md); font-size: 24px; flex-shrink: 0; }
    .modal-head > div { flex: 1; }
    .modal-head h3 { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.015em; }
    .modal-head p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 2px; }
    .modal-close { width: 32px; height: 32px; display: grid; place-items: center; border-radius: var(--r-xs); color: var(--label-3); font-size: 16px; background: transparent; border: 0; cursor: pointer; }
    .modal-close:hover { background: var(--bg-hover); color: var(--label); }
    .modal-body { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .modal-foot { padding: 16px 24px; border-top: 0.5px solid var(--separator); display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
    .mf-btn { padding: 10px 18px; background: var(--bg-fill-2); color: var(--label); border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 700; border: 0; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
    .mf-btn:hover { background: var(--bg-fill-3); }
    .mf-btn.primary { background: linear-gradient(135deg, #5856d6, #007aff); color: #fff; }

    .pm-hero { padding: 32px; border-radius: var(--r-md); display: flex; flex-direction: column; align-items: center; gap: 12px; color: #fff; text-align: center; }
    .pm-hero-icon { font-size: 64px; }
    .pm-hero h2 { font-size: var(--fs-3xl); font-weight: 800; letter-spacing: -0.03em; }
    .pm-hero p { font-size: var(--fs-sm); opacity: 0.9; max-width: 480px; }
    .pm-desc { font-size: var(--fs-sm); line-height: 1.7; color: var(--label-2); }
    .pm-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    @media (max-width: 600px) { .pm-metrics { grid-template-columns: 1fr; } }
    .pm-metric { padding: 14px; background: var(--bg-fill-2); border-radius: var(--r-sm); text-align: center; border-left: 3px solid #5856d6; }
    .pm-metric[data-t='up'] { border-left-color: #34c759; }
    .pm-metric[data-t='down'] { border-left-color: #ff9500; }
    .pm-metric b { font-size: var(--fs-xl); font-weight: 800; display: block; font-variant-numeric: tabular-nums; }
    .pm-metric small { font-size: 10px; color: var(--label-2); text-transform: uppercase; font-weight: 700; }
    .pm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 600px) { .pm-grid { grid-template-columns: 1fr; } }
    .pm-block { display: flex; flex-direction: column; gap: 4px; }
    .pm-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-3); }
    .pm-block > b { font-size: var(--fs-sm); font-weight: 700; }
    .pm-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
    .pm-chip { font-size: 10px; padding: 4px 10px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-family: var(--sf-mono); color: var(--label-2); }

    .tm-bio-full { font-size: var(--fs-sm); line-height: 1.6; color: var(--label-2); }
    .tm-section { display: flex; flex-direction: column; gap: 8px; }
    .tm-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-3); }
    .tm-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .tm-chip { font-size: 10px; padding: 4px 10px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-family: var(--sf-mono); color: var(--label); }
    .tm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .tm-block { display: flex; flex-direction: column; gap: 4px; }
    .tm-block > b { font-size: var(--fs-sm); font-weight: 700; }

    .job-hero { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .jh-item { padding: 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); text-align: center; }
    .jh-item small { font-size: 10px; color: var(--label-3); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px; }
    .jh-item b { font-size: var(--fs-sm); font-weight: 700; }

    .om-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-3); }
    .om-block { display: flex; flex-direction: column; gap: 8px; }
  `],
})
export class BusinessStepPreviewComponent {
  public toast = inject(ToastService);
  private menu = inject(ContextMenuService);

  readonly Math = Math;

  readonly lang = signal<Lang>('en');
  readonly active = signal<XbView>('home');
  readonly projectFilter = signal<string>('all');
  readonly techCategory = signal<string>('all');
  readonly searchQuery = signal('');
  readonly selectedProjectType = signal<string>('web');
  readonly sent = signal(false);

  readonly selectedProject = signal<PortfolioProject | null>(null);
  readonly selectedTeamMember = signal<TeamMember | null>(null);
  readonly selectedJob = signal<JobPosition | null>(null);

  readonly company = {
    name: 'X-BLEND',
    email: 'hello@xblend.co',
    phone: '+20 2 2404 7777',
    website: 'xblend.co',
    address: 'Hadaek Al-Ahram, Old Gate 2, Giza',
    addressAr: 'حدائق الأهرام ، البوابة الثانية القديمة ، الجيزة',
  };

  readonly services = signal<Service[]>([
    { id: 'web', icon: '🌐', color: '#007aff', title: 'Web Development', titleAr: 'تطوير الويب', tagline: 'Production-grade web apps built with Angular and modern frameworks', taglineAr: 'تطبيقات ويب بمستوى إنتاجي مبنية بـ Angular والأطر الحديثة', bullets: ['Angular 17+ standalone architecture', 'SSR & performance optimization', 'Progressive Web Apps', 'Accessibility (WCAG 2.2 AA)', 'Mobile-first responsive design'], bulletsAr: [], startingAt: 45000, timeline: '6-12 weeks', timelineAr: '6-12 أسبوع' },
    { id: 'backend', icon: '🟪', color: '#512bd4', title: '.NET Backend', titleAr: 'الخلفية بـ .NET', tagline: 'Enterprise APIs and microservices with ASP.NET Core', taglineAr: 'واجهات برمجية مؤسسية وخدمات مصغرة بـ ASP.NET Core', bullets: ['REST & GraphQL APIs', 'EF Core with SQL Server', 'Identity & JWT authentication', 'SignalR real-time features', 'Clean Architecture with SOLID'], bulletsAr: [], startingAt: 55000, timeline: '8-16 weeks', timelineAr: '8-16 أسبوع' },
    { id: 'mobile', icon: '📱', color: '#34c759', title: 'Mobile Apps', titleAr: 'تطبيقات الموبايل', tagline: 'Cross-platform iOS & Android with modern tooling', taglineAr: 'تطبيقات iOS و Android بتقنيات حديثة', bullets: ['Ionic + Angular', 'React Native', 'Native device features', 'Push notifications', 'App Store & Play Store deployment'], bulletsAr: [], startingAt: 65000, timeline: '10-16 weeks', timelineAr: '10-16 أسبوع' },
    { id: 'uiux', icon: '🎨', color: '#ff2d55', title: 'UI/UX Design', titleAr: 'تصميم واجهات', tagline: 'Human-centered design that converts and delights', taglineAr: 'تصميم يركز على الإنسان ويحوّل ويُبهج', bullets: ['User research & personas', 'Wireframes & prototypes', 'Figma design systems', 'Usability testing', 'Motion & interaction design'], bulletsAr: [], startingAt: 35000, timeline: '4-8 weeks', timelineAr: '4-8 أسابيع' },
    { id: 'devops', icon: '⚙️', color: '#ff9500', title: 'DevOps & Cloud', titleAr: 'DevOps والسحابة', tagline: 'Reliable infrastructure, automated pipelines, zero-downtime deploys', taglineAr: 'بنية تحتية موثوقة وخطوط آلية ونشر بدون توقف', bullets: ['Docker & Kubernetes', 'CI/CD with GitHub Actions', 'Azure & AWS setup', 'Monitoring & alerting', 'Performance & cost optimization'], bulletsAr: [], startingAt: 25000, timeline: '2-6 weeks', timelineAr: '2-6 أسابيع' },
    { id: 'consulting', icon: '🧠', color: '#af52de', title: 'Technical Consulting', titleAr: 'استشارات تقنية', tagline: 'Architecture reviews, code audits, and team mentoring', taglineAr: 'مراجعة الهندسة وتدقيق الكود وتدريب الفرق', bullets: ['Architecture audits', 'Code review & refactoring', 'Performance diagnostics', 'Team training & pairing', 'Tech stack selection'], bulletsAr: [], startingAt: 15000, timeline: 'Ad-hoc', timelineAr: 'حسب الحاجة' },
  ]);

  readonly projects = signal<PortfolioProject[]>([
    { id: 'ar-room', name: 'AR-Room', nameAr: 'AR-Room', category: 'E-Commerce', categoryAr: 'تجارة إلكترونية', icon: '🔍', color: '#ff9900', gradient: 'linear-gradient(135deg, #ff9900, #f7a200)', tagline: 'Multi-platform product aggregator with parallel scraping engine', taglineAr: 'مُجمّع منتجات متعدد المنصات مع محرك استعلام متوازي', description: 'Real-time product scraping from 7 Egyptian e-commerce platforms. Unified search, price comparison, and match-scoring engine with 96% accuracy.', descriptionAr: 'استعلام فوري عن المنتجات من 7 منصات مصرية. بحث موحد ومقارنة أسعار ومحرك مطابقة بدقة 96%.', techStack: ['Angular', 'TypeScript', 'SCSS', 'PrimeNG', 'RxJS', 'Node.js'], year: '2024', duration: '4 months', durationAr: '4 أشهر', team: 3, client: 'Internal R&D', clientAr: 'بحث داخلي', featured: true, metrics: [{ label: 'Engagement', labelAr: 'التفاعل', value: '+30%', trend: 'up' }, { label: 'Products indexed', labelAr: 'منتجات مفهرسة', value: '284K', trend: 'up' }, { label: 'Response time', labelAr: 'وقت الاستجابة', value: '2.4s', trend: 'down' }] },
    { id: 'almotafiq', name: 'Al-Motafiq', nameAr: 'المتفوق', category: 'EdTech', categoryAr: 'تعليم', icon: '📚', color: '#34c759', gradient: 'linear-gradient(135deg, #34c759, #00c7be)', tagline: 'Interactive learning platform with teacher-student portals', taglineAr: 'منصة تعليم تفاعلية ببوابات معلم وطالب', description: 'Complete LMS with live streaming, quiz engine, and payment integration. Built with NgRx for complex state management across teacher and student portals.', descriptionAr: 'نظام إدارة تعلم كامل مع بث مباشر ومحرك اختبارات وتكامل دفع. مبني بـ NgRx لإدارة الحالة المعقدة.', techStack: ['Angular', 'NgRx', 'Angular Material', 'SCSS', 'RxJS'], year: '2024', duration: '5 months', durationAr: '5 أشهر', team: 4, client: 'Educational Client', clientAr: 'عميل تعليمي', featured: true, metrics: [{ label: 'Student engagement', labelAr: 'تفاعل الطلاب', value: '+25%', trend: 'up' }, { label: 'Class capacity', labelAr: 'سعة الفصل', value: '120', trend: 'up' }, { label: 'Courses launched', labelAr: 'كورسات', value: '48', trend: 'up' }] },
    { id: 'az-accounting', name: 'AZ-Accounting', nameAr: 'AZ Accounting', category: 'FinTech', categoryAr: 'تقنية مالية', icon: '💰', color: '#ff9500', gradient: 'linear-gradient(135deg, #ff9500, #ffcc00)', tagline: 'Automated financial tracking and budget management', taglineAr: 'تتبع مالي وإدارة ميزانية آلية', description: 'Financial dashboard with budget management, invoice tracking, and reporting. Angular Material tables with custom charts and 14% VAT calculations.', descriptionAr: 'لوحة مالية مع إدارة ميزانية وتتبع فواتير وتقارير. جداول Angular Material مع رسوم بيانية وحسابات ضريبة 14%.', techStack: ['Angular', 'Angular Material', 'SCSS', 'Chart.js'], year: '2024', duration: '3 months', durationAr: '3 أشهر', team: 3, client: 'Accounting Firm', clientAr: 'شركة محاسبة', featured: true, metrics: [{ label: 'Processing time', labelAr: 'وقت المعالجة', value: '-20%', trend: 'down' }, { label: 'Data errors', labelAr: 'أخطاء البيانات', value: '-45%', trend: 'down' }, { label: 'Monthly entries', labelAr: 'قيود شهرية', value: '2.4K', trend: 'up' }] },
    { id: 'bwt', name: 'BWT Platform', nameAr: 'منصة BWT', category: 'Enterprise', categoryAr: 'مؤسسي', icon: '⬡', color: '#5856d6', gradient: 'linear-gradient(135deg, #5856d6, #007aff)', tagline: 'SOLID-compliant enterprise platform with cross-browser support', taglineAr: 'منصة مؤسسية متوافقة مع SOLID ودعم متعدد للمتصفحات', description: 'Contributed to enterprise-grade Angular platform. Focus on clean architecture, testability, and cross-browser compatibility for critical business workflows.', descriptionAr: 'مشاركة في منصة Angular مؤسسية. تركيز على الهندسة النظيفة والاختبارات والتوافق مع المتصفحات.', techStack: ['Angular', 'TypeScript', 'SCSS', 'Jest'], year: '2024', duration: '6 months', durationAr: '6 أشهر', team: 6, client: 'Enterprise Client', clientAr: 'عميل مؤسسي', featured: false, metrics: [{ label: 'Code coverage', labelAr: 'تغطية الكود', value: '92%', trend: 'up' }, { label: 'Bundle size', labelAr: 'حجم الحزمة', value: '-18%', trend: 'down' }, { label: 'Browsers tested', labelAr: 'متصفحات', value: '6', trend: 'up' }] },
    { id: 'business-step', name: 'Business Step', nameAr: 'Business Step', category: 'Corporate', categoryAr: 'موقع شركة', icon: '📈', color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', tagline: 'Fully responsive corporate website with lead generation focus', taglineAr: 'موقع شركة متجاوب بالكامل مع تركيز على توليد العملاء', description: 'Angular + Bootstrap corporate site with optimized contact forms, SEO-friendly SSR, and serverless form handling for cost efficiency.', descriptionAr: 'موقع Angular مع Bootstrap بنماذج تواصل محسّنة و SSR صديق لمحركات البحث ومعالجة نماذج بدون سيرفر.', techStack: ['Angular', 'Bootstrap', 'SCSS', 'SSR'], year: '2023', duration: '6 weeks', durationAr: '6 أسابيع', team: 2, client: 'X-BLEND (Internal)', clientAr: 'X-BLEND (داخلي)', featured: false, metrics: [{ label: 'Lead conversion', labelAr: 'تحويل العملاء', value: '+42%', trend: 'up' }, { label: 'Page load', labelAr: 'تحميل الصفحة', value: '1.2s', trend: 'down' }, { label: 'Monthly visitors', labelAr: 'زيارات شهرية', value: '8.5K', trend: 'up' }] },
  ]);

  readonly team = signal<TeamMember[]>([
    { id: 'TM-001', name: 'Ahmad Abo Nahar', nameAr: 'أحمد أبو نهار', role: 'Team Leader', roleAr: 'قائد الفريق', bio: 'Led the X-BLEND team through multiple product deliveries. Balances technical depth with people leadership and client communication.', bioAr: 'قاد فريق X-BLEND عبر تسليمات متعددة. يوازن بين العمق التقني وقيادة الفريق والتواصل مع العملاء.', avatar: '👨‍💼', color: '#5856d6', skills: ['Team Leadership', 'Architecture', 'Client Management', 'Agile', 'Code Review', 'Mentoring'], socials: { linkedin: 'https://linkedin.com/in/ahmad-abo-nahar' }, joinedAt: '2022-01-15', featured: true },
    { id: 'TM-002', name: 'Ibrahim Shafiq', nameAr: 'إبراهيم شفيق', role: 'Full-Stack Engineer (Angular | .NET)', roleAr: 'مهندس متكامل (Angular | .NET)', bio: 'Full-stack engineer building production systems end-to-end with Angular on the frontend and ASP.NET Core on the backend.', bioAr: 'مهندس متكامل يبني أنظمة إنتاجية من البداية للنهاية بـ Angular في الواجهة و ASP.NET Core في الخلفية.', avatar: '👨‍💻', color: '#007aff', skills: ['Angular', 'TypeScript', 'RxJS', 'NgRx', '.NET', 'ASP.NET Core', 'EF Core', 'SQL Server'], socials: { linkedin: 'https://linkedin.com/in/ibrahim-shafiq', github: 'https://github.com/IbrahimShafiq4' }, joinedAt: '2022-03-20', featured: true },
    { id: 'TM-003', name: 'Maram Essam', nameAr: 'مرام عصام', role: 'Angular Developer', roleAr: 'مطورة Angular', bio: 'Angular developer focused on clean component architecture, reactive patterns, and pixel-perfect implementation.', bioAr: 'مطورة Angular تركز على هندسة مكونات نظيفة والأنماط التفاعلية والتنفيذ الدقيق للتصميم.', avatar: '👩‍💻', color: '#34c759', skills: ['Angular', 'TypeScript', 'RxJS', 'SCSS', 'Angular Material'], socials: { linkedin: 'https://linkedin.com/in/maram-essam', github: 'https://github.com/maram-essam' }, joinedAt: '2023-02-10', featured: true },
    { id: 'TM-004', name: 'Ahmad Ehab', nameAr: 'أحمد إيهاب', role: 'UI/UX Designer', roleAr: 'مصمم واجهات وتجربة المستخدم', bio: 'Designer crafting user-centered interfaces with a focus on usability, design systems, and clean visual language.', bioAr: 'مصمم يصنع واجهات تركز على المستخدم مع اهتمام بقابلية الاستخدام وأنظمة التصميم واللغة البصرية النظيفة.', avatar: '🎨', color: '#ff2d55', skills: ['Figma', 'Design Systems', 'Wireframing', 'Prototyping', 'User Research', 'Interaction Design'], socials: { linkedin: 'https://linkedin.com/in/ahmad-ehab' }, joinedAt: '2023-02-10', featured: true },
  ]);

  readonly clients = signal<Client[]>([
    { id: 'C-001', name: 'TechCorp Egypt', nameAr: 'تك كورب مصر', industry: 'Technology', industryAr: 'تقنية', logo: '🚀', color: '#007aff', since: '2022', projectsDelivered: 3 },
    { id: 'C-002', name: 'FinBank Group', nameAr: 'مجموعة بنك مصر', industry: 'Banking', industryAr: 'بنوك', logo: '🏦', color: '#34c759', since: '2022', projectsDelivered: 2 },
    { id: 'C-003', name: 'EduTech Solutions', nameAr: 'حلول تعليمية', industry: 'Education', industryAr: 'تعليم', logo: '🎓', color: '#ff9500', since: '2023', projectsDelivered: 4 },
    { id: 'C-004', name: 'HealthPlus', nameAr: 'هيلث بلاس', industry: 'Healthcare', industryAr: 'صحة', logo: '🏥', color: '#ff2d55', since: '2023', projectsDelivered: 2 },
    { id: 'C-005', name: 'RetailGiant', nameAr: 'ريتيل جاينت', industry: 'Retail', industryAr: 'تجارة', logo: '🛍', color: '#af52de', since: '2024', projectsDelivered: 3 },
    { id: 'C-006', name: 'LogiFlow', nameAr: 'لوجي فلو', industry: 'Logistics', industryAr: 'لوجستيات', logo: '📦', color: '#5856d6', since: '2024', projectsDelivered: 1 },
  ]);

  readonly testimonials = signal<Testimonial[]>([
    { id: 'TS-001', clientId: 'C-001', clientName: 'Ahmed Mostafa', clientNameAr: 'أحمد مصطفى', role: 'CTO', roleAr: 'المدير التقني', company: 'TechCorp Egypt', companyAr: 'تك كورب مصر', avatar: '👨‍💼', quote: 'X-BLEND delivered our platform ahead of schedule with exceptional code quality. They truly understand enterprise Angular.', quoteAr: 'سلّمت X-BLEND منصتنا قبل الموعد بجودة كود استثنائية. يفهمون Angular المؤسسي بعمق.', rating: 5, projectRef: 'AR-Room' },
    { id: 'TS-002', clientId: 'C-003', clientName: 'Fatima Hassan', clientNameAr: 'فاطمة حسن', role: 'Product Director', roleAr: 'مديرة المنتج', company: 'EduTech Solutions', companyAr: 'حلول تعليمية', avatar: '👩‍💼', quote: 'The most professional team we\'ve worked with. Communication was excellent and the final product exceeded expectations.', quoteAr: 'أكثر فريق احترافي عملنا معه. التواصل ممتاز والمنتج النهائي فاق التوقعات.', rating: 5, projectRef: 'Al-Motafiq' },
    { id: 'TS-003', clientId: 'C-002', clientName: 'Karim Abdel-Rahman', clientNameAr: 'كريم عبد الرحمن', role: 'VP Engineering', roleAr: 'نائب رئيس الهندسة', company: 'FinBank Group', companyAr: 'مجموعة بنك مصر', avatar: '👨‍💻', quote: 'Their .NET expertise and attention to security made them the ideal partner for our banking platform.', quoteAr: 'خبرتهم في .NET واهتمامهم بالأمان جعلهم الشريك المثالي لمنصتنا البنكية.', rating: 5, projectRef: 'AZ-Accounting' },
    { id: 'TS-004', clientId: 'C-004', clientName: 'Layla Ibrahim', clientNameAr: 'ليلى إبراهيم', role: 'CEO', roleAr: 'الرئيس التنفيذي', company: 'HealthPlus', companyAr: 'هيلث بلاس', avatar: '👩‍⚕️', quote: 'Fast, reliable, and honest. X-BLEND is now our go-to development partner for every new project.', quoteAr: 'سريعون وموثوقون وصادقون. X-BLEND الآن شريكنا المفضل لكل مشروع جديد.', rating: 5, projectRef: 'Multiple' },
    { id: 'TS-005', clientId: 'C-005', clientName: 'Omar El-Sayed', clientNameAr: 'عمر السيد', role: 'Founder', roleAr: 'المؤسس', company: 'RetailGiant', companyAr: 'ريتيل جاينت', avatar: '👨‍💼', quote: 'Our conversion rate jumped 18% after the redesign. The ROI speaks for itself.', quoteAr: 'ارتفع معدل التحويل 18% بعد إعادة التصميم. العائد يتحدث عن نفسه.', rating: 5, projectRef: 'Ennwy' },
    { id: 'TS-006', clientId: 'C-006', clientName: 'Nour Samir', clientNameAr: 'نور سمير', role: 'Operations Head', roleAr: 'مديرة العمليات', company: 'LogiFlow', companyAr: 'لوجي فلو', avatar: '👩‍💼', quote: 'The dashboard they built saves us 20+ hours per week in manual reporting.', quoteAr: 'اللوحة التي بنوها توفر لنا 20+ ساعة أسبوعياً في التقارير اليدوية.', rating: 4, projectRef: 'Custom Admin' },
  ]);

  readonly process = signal<ProcessStep[]>([
    { id: 'P-001', num: '01', title: 'Discovery', titleAr: 'الاكتشاف', description: 'Deep dive into your goals, users, and constraints. We map the problem before proposing solutions.', descriptionAr: 'تعمق في أهدافك ومستخدميك وقيودك. نرسم المشكلة قبل اقتراح الحلول.', icon: '🔍', color: '#007aff', duration: '1-2 weeks', durationAr: '1-2 أسبوع', deliverables: ['Problem statement', 'User personas', 'Technical scope'], deliverablesAr: [] },
    { id: 'P-002', num: '02', title: 'Design', titleAr: 'التصميم', description: 'Wireframes, prototypes, and design system. You approve every screen before we write code.', descriptionAr: 'مخططات ونماذج أولية ونظام تصميم. توافق على كل شاشة قبل كتابة الكود.', icon: '🎨', color: '#ff2d55', duration: '2-4 weeks', durationAr: '2-4 أسابيع', deliverables: ['Wireframes', 'High-fidelity mockups', 'Prototype', 'Design system'], deliverablesAr: [] },
    { id: 'P-003', num: '03', title: 'Build', titleAr: 'البناء', description: 'Agile sprints with weekly demos. Clean code, thorough tests, and continuous feedback loops.', descriptionAr: 'دورات Agile مع عروض أسبوعية. كود نظيف واختبارات شاملة وحلقات تغذية راجعة.', icon: '⚙️', color: '#ff9500', duration: '4-12 weeks', durationAr: '4-12 أسبوع', deliverables: ['Working software', 'Documentation', 'API spec', 'Test suite'], deliverablesAr: [] },
    { id: 'P-004', num: '04', title: 'Launch', titleAr: 'الإطلاق', description: 'Zero-downtime deployment, monitoring setup, and hypercare support for the first 30 days.', descriptionAr: 'نشر بدون توقف، وإعداد المراقبة، ودعم مكثف لأول 30 يوماً.', icon: '🚀', color: '#34c759', duration: '1-2 weeks', durationAr: '1-2 أسبوع', deliverables: ['Production deploy', 'Monitoring', 'Training', 'Handover docs'], deliverablesAr: [] },
    { id: 'P-005', num: '05', title: 'Support', titleAr: 'الدعم', description: 'Ongoing maintenance, feature development, and performance optimization on retainer.', descriptionAr: 'صيانة مستمرة وتطوير ميزات وتحسين الأداء بنظام التعاقد.', icon: '🛠', color: '#5856d6', duration: 'Ongoing', durationAr: 'مستمر', deliverables: ['SLA-backed support', 'Monthly reports', 'Feature backlog'], deliverablesAr: [] },
  ]);

  readonly tech = signal<TechItem[]>([
    { id: 'T-001', name: 'Angular 17+', icon: '🅰', color: '#dd0031', category: 'frontend', level: 95, yearsUsed: 3, projectsCount: 12 },
    { id: 'T-002', name: 'TypeScript', icon: '📘', color: '#3178c6', category: 'frontend', level: 94, yearsUsed: 3, projectsCount: 14 },
    { id: 'T-003', name: 'RxJS', icon: '⚡', color: '#b7178c', category: 'frontend', level: 90, yearsUsed: 3, projectsCount: 11 },
    { id: 'T-004', name: 'NgRx', icon: '🔮', color: '#ba2bd2', category: 'frontend', level: 85, yearsUsed: 2, projectsCount: 6 },
    { id: 'T-005', name: 'SCSS', icon: '💅', color: '#c6538c', category: 'frontend', level: 92, yearsUsed: 4, projectsCount: 15 },
    { id: 'T-006', name: 'Tailwind', icon: '🌊', color: '#38bdf8', category: 'frontend', level: 88, yearsUsed: 2, projectsCount: 8 },
    { id: 'T-007', name: 'C#', icon: '🎯', color: '#512bd4', category: 'backend', level: 92, yearsUsed: 3, projectsCount: 10 },
    { id: 'T-008', name: 'ASP.NET Core', icon: '🟪', color: '#512bd4', category: 'backend', level: 90, yearsUsed: 3, projectsCount: 9 },
    { id: 'T-009', name: 'EF Core', icon: '🗄', color: '#68217a', category: 'backend', level: 88, yearsUsed: 3, projectsCount: 9 },
    { id: 'T-010', name: 'SignalR', icon: '📡', color: '#007aff', category: 'backend', level: 80, yearsUsed: 2, projectsCount: 4 },
    { id: 'T-011', name: 'Node.js', icon: '🟢', color: '#339933', category: 'backend', level: 78, yearsUsed: 2, projectsCount: 3 },
    { id: 'T-012', name: 'SQL Server', icon: '💾', color: '#cc2927', category: 'database', level: 88, yearsUsed: 3, projectsCount: 10 },
    { id: 'T-013', name: 'PostgreSQL', icon: '🐘', color: '#336791', category: 'database', level: 82, yearsUsed: 2, projectsCount: 5 },
    { id: 'T-014', name: 'Redis', icon: '🔴', color: '#dc382d', category: 'database', level: 75, yearsUsed: 2, projectsCount: 3 },
    { id: 'T-015', name: 'Docker', icon: '🐳', color: '#2496ed', category: 'devops', level: 82, yearsUsed: 2, projectsCount: 6 },
    { id: 'T-016', name: 'Kubernetes', icon: '☸️', color: '#326ce5', category: 'devops', level: 70, yearsUsed: 1, projectsCount: 2 },
    { id: 'T-017', name: 'GitHub Actions', icon: '⚙️', color: '#2088ff', category: 'devops', level: 85, yearsUsed: 2, projectsCount: 5 },
    { id: 'T-018', name: 'Azure', icon: '☁️', color: '#0078d4', category: 'cloud', level: 78, yearsUsed: 2, projectsCount: 4 },
    { id: 'T-019', name: 'AWS', icon: '🌐', color: '#ff9900', category: 'cloud', level: 72, yearsUsed: 1, projectsCount: 2 },
    { id: 'T-020', name: 'Figma', icon: '🎨', color: '#f24e1e', category: 'design', level: 88, yearsUsed: 3, projectsCount: 12 },
    { id: 'T-021', name: 'Ionic', icon: '📱', color: '#3880ff', category: 'mobile', level: 75, yearsUsed: 1, projectsCount: 2 },
    { id: 'T-022', name: 'Capacitor', icon: '⚡', color: '#119eff', category: 'mobile', level: 72, yearsUsed: 1, projectsCount: 2 },
  ]);

  readonly jobs = signal<JobPosition[]>([
    { id: 'J-001', title: 'Senior Angular Developer', titleAr: 'مطور Angular أول', department: 'Engineering', departmentAr: 'هندسة', type: 'full-time', level: 'senior', location: 'Cairo (Hybrid)', locationAr: 'القاهرة (مرن)', salaryRange: '35K - 55K EGP', posted: '2 days ago', applicants: 24, skills: ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'SCSS'], description: 'Lead frontend development on enterprise-scale applications with a focus on performance and accessibility.', descriptionAr: 'قيادة تطوير الواجهات لتطبيقات مؤسسية مع تركيز على الأداء وإمكانية الوصول.', open: true },
    { id: 'J-002', title: '.NET Backend Engineer', titleAr: 'مهندس .NET Backend', department: 'Engineering', departmentAr: 'هندسة', type: 'full-time', level: 'mid', location: 'Cairo (Hybrid)', locationAr: 'القاهرة (مرن)', salaryRange: '25K - 40K EGP', posted: '5 days ago', applicants: 18, skills: ['C#', '.NET', 'EF Core', 'SQL Server', 'REST APIs'], description: 'Build scalable RESTful APIs and background services with ASP.NET Core.', descriptionAr: 'بناء واجهات REST وخدمات خلفية قابلة للتوسع بـ ASP.NET Core.', open: true },
    { id: 'J-003', title: 'UI/UX Designer', titleAr: 'مصمم واجهات', department: 'Design', departmentAr: 'تصميم', type: 'full-time', level: 'mid', location: 'Cairo', locationAr: 'القاهرة', salaryRange: '20K - 32K EGP', posted: '1 week ago', applicants: 42, skills: ['Figma', 'Design Systems', 'Prototyping', 'User Research'], description: 'Design beautiful, usable interfaces for web and mobile products.', descriptionAr: 'تصميم واجهات جميلة وقابلة للاستخدام لمنتجات الويب والموبايل.', open: true },
    { id: 'J-004', title: 'DevOps Engineer', titleAr: 'مهندس DevOps', department: 'Infrastructure', departmentAr: 'بنية تحتية', type: 'full-time', level: 'mid', location: 'Remote', locationAr: 'عن بعد', salaryRange: '28K - 45K EGP', posted: '3 days ago', applicants: 12, skills: ['Docker', 'Kubernetes', 'CI/CD', 'Azure'], description: 'Build and maintain CI/CD pipelines and cloud infrastructure.', descriptionAr: 'بناء وصيانة خطوط CI/CD والبنية السحابية.', open: true },
    { id: 'J-005', title: 'Frontend Developer (Junior)', titleAr: 'مطور واجهات (مبتدئ)', department: 'Engineering', departmentAr: 'هندسة', type: 'full-time', level: 'junior', location: 'Cairo', locationAr: 'القاهرة', salaryRange: '12K - 18K EGP', posted: '1 week ago', applicants: 87, skills: ['Angular', 'HTML', 'CSS', 'TypeScript'], description: 'Join our team and grow your Angular skills on real production projects.', descriptionAr: 'انضم لفريقنا وطوّر مهاراتك في Angular على مشاريع إنتاجية حقيقية.', open: true },
    { id: 'J-006', title: 'QA Engineer', titleAr: 'مهندس ضمان جودة', department: 'Quality', departmentAr: 'جودة', type: 'contract', level: 'mid', location: 'Cairo', locationAr: 'القاهرة', salaryRange: '18K - 26K EGP', posted: '4 days ago', applicants: 15, skills: ['Cypress', 'Playwright', 'Jest', 'Manual Testing'], description: 'Ensure the quality of our deliverables through automated and manual testing.', descriptionAr: 'ضمان جودة منتجاتنا من خلال الاختبارات الآلية واليدوية.', open: true },
    { id: 'J-007', title: 'Product Manager', titleAr: 'مدير منتج', department: 'Product', departmentAr: 'منتج', type: 'full-time', level: 'senior', location: 'Cairo (Hybrid)', locationAr: 'القاهرة (مرن)', salaryRange: '40K - 60K EGP', posted: '2 weeks ago', applicants: 9, skills: ['Product Strategy', 'Roadmapping', 'Analytics', 'User Research'], description: 'Own the product roadmap and drive discovery for our client projects.', descriptionAr: 'امتلاك خريطة الطريق وقيادة الاكتشاف لمشاريع عملائنا.', open: true },
    { id: 'J-008', title: 'Technical Writer', titleAr: 'كاتب تقني', department: 'Docs', departmentAr: 'توثيق', type: 'part-time', level: 'mid', location: 'Remote', locationAr: 'عن بعد', salaryRange: '8K - 14K EGP', posted: '3 weeks ago', applicants: 34, skills: ['Markdown', 'Docusaurus', 'API Docs'], description: 'Write clear, accurate documentation for our open-source and client projects.', descriptionAr: 'كتابة توثيق واضح ودقيق لمشاريعنا مفتوحة المصدر ومشاريع العملاء.', open: false },
  ]);

  readonly blogPosts = signal<BlogPost[]>([
    { id: 'B-001', title: 'Building Scalable Angular Apps with Signals', titleAr: 'بناء تطبيقات Angular قابلة للتوسع مع Signals', excerpt: 'How Angular Signals changed our approach to state management and reduced boilerplate by 40%.', excerptAr: 'كيف غيّرت Angular Signals نهجنا في إدارة الحالة وقلّلت الكود المتكرر بنسبة 40%.', author: 'Ibrahim Shafiq', authorAr: 'إبراهيم شفيق', category: 'Engineering', categoryAr: 'هندسة', tags: ['angular', 'signals', 'state'], readTime: 8, publishedAt: '2 days ago', views: 3247, likes: 142, featured: true, thumbnail: '⚡', color: '#dd0031' },
    { id: 'B-002', title: 'Clean Architecture in ASP.NET Core: A Practical Guide', titleAr: 'Clean Architecture في ASP.NET Core: دليل عملي', excerpt: 'A real-world walkthrough of structuring .NET projects for maintainability and testability.', excerptAr: 'شرح واقعي لهيكلة مشاريع .NET لتحقيق قابلية الصيانة والاختبار.', author: 'Omar Khaled', authorAr: 'عمر خالد', category: 'Backend', categoryAr: 'خلفية', tags: ['.net', 'architecture', 'clean-code'], readTime: 12, publishedAt: '1 week ago', views: 5184, likes: 218, featured: false, thumbnail: '🏛', color: '#512bd4' },
    { id: 'B-003', title: 'The Designer-Developer Handoff That Actually Works', titleAr: 'التسليم الفعال بين المصمم والمطور', excerpt: 'Our process for eliminating friction between design and engineering teams.', excerptAr: 'عمليتنا لإزالة الاحتكاك بين فرق التصميم والهندسة.', author: 'Sara Adel', authorAr: 'سارة عادل', category: 'Design', categoryAr: 'تصميم', tags: ['figma', 'handoff', 'process'], readTime: 6, publishedAt: '2 weeks ago', views: 2147, likes: 98, featured: false, thumbnail: '🎨', color: '#ff2d55' },
    { id: 'B-004', title: 'NgRx vs Signals: When to Use Which', titleAr: 'NgRx مقابل Signals: متى تستخدم أيهما', excerpt: 'A pragmatic comparison based on two years of shipping both in production.', excerptAr: 'مقارنة عملية بناءً على سنتين من استخدام كليهما في الإنتاج.', author: 'Layla Hassan', authorAr: 'ليلى حسن', category: 'Engineering', categoryAr: 'هندسة', tags: ['ngrx', 'signals', 'angular'], readTime: 10, publishedAt: '3 weeks ago', views: 4128, likes: 176, featured: false, thumbnail: '🔮', color: '#af52de' },
    { id: 'B-005', title: 'Docker for Angular Developers', titleAr: 'Docker لمطوري Angular', excerpt: 'Containerizing your Angular app the right way — with multi-stage builds and nginx.', excerptAr: 'تحويل تطبيقك إلى حاويات Docker بالطريقة الصحيحة — مع بناء متعدد المراحل و nginx.', author: 'Khaled Sami', authorAr: 'خالد سامي', category: 'DevOps', categoryAr: 'DevOps', tags: ['docker', 'angular', 'nginx'], readTime: 9, publishedAt: '1 month ago', views: 3819, likes: 154, featured: false, thumbnail: '🐳', color: '#2496ed' },
    { id: 'B-006', title: 'Why We Chose Angular for Enterprise Projects', titleAr: 'لماذا اخترنا Angular للمشاريع المؤسسية', excerpt: 'A deep dive into the tradeoffs that led us to standardize on Angular.', excerptAr: 'تعمق في المقايضات التي جعلتنا نعتمد Angular كمعيار.', author: 'Ibrahim Shafiq', authorAr: 'إبراهيم شفيق', category: 'Opinion', categoryAr: 'رأي', tags: ['angular', 'enterprise', 'architecture'], readTime: 11, publishedAt: '1 month ago', views: 6274, likes: 287, featured: false, thumbnail: '🅰', color: '#007aff' },
  ]);

  readonly offices = signal<Office[]>([
    { id: 'O-001', city: 'Cairo', cityAr: 'القاهرة', country: 'Egypt', countryAr: 'مصر', address: '14 Sheraton Heliopolis, Cairo', addressAr: '14 شيراتون هليوبوليس، القاهرة', phone: '+20 2 2404 7777', email: 'cairo@xblend.co', timezone: 'GMT+2', team: 6, main: true, icon: '🏛' },
    { id: 'O-002', city: 'Alexandria', cityAr: 'الإسكندرية', country: 'Egypt', countryAr: 'مصر', address: '22 Sidi Gaber Street, Alexandria', addressAr: '22 شارع سيدي جابر، الإسكندرية', phone: '+20 3 5777 8888', email: 'alex@xblend.co', timezone: 'GMT+2', team: 2, main: false, icon: '⚓' },
  ]);

  readonly projectCategories = [
    { id: 'all', label: 'All', labelAr: 'الكل', icon: '◈' },
    { id: 'E-Commerce', label: 'E-Commerce', labelAr: 'تجارة إلكترونية', icon: '🛍' },
    { id: 'EdTech', label: 'EdTech', labelAr: 'تعليم', icon: '📚' },
    { id: 'FinTech', label: 'FinTech', labelAr: 'تقنية مالية', icon: '💰' },
    { id: 'Enterprise', label: 'Enterprise', labelAr: 'مؤسسي', icon: '⬡' },
    { id: 'Corporate', label: 'Corporate', labelAr: 'شركات', icon: '🏢' },
    { id: 'Full-Stack', label: 'Full-Stack', labelAr: 'متكامل', icon: '🧩' },
  ];

  readonly techCategories = [
    { id: 'all', label: 'All', labelAr: 'الكل', icon: '◈', color: '#5856d6' },
    { id: 'frontend', label: 'Frontend', labelAr: 'واجهات', icon: '🎨', color: '#dd0031' },
    { id: 'backend', label: 'Backend', labelAr: 'خلفية', icon: '⚙️', color: '#512bd4' },
    { id: 'database', label: 'Database', labelAr: 'قواعد بيانات', icon: '💾', color: '#007aff' },
    { id: 'cloud', label: 'Cloud', labelAr: 'سحابة', icon: '☁️', color: '#ff9500' },
    { id: 'devops', label: 'DevOps', labelAr: 'DevOps', icon: '🐳', color: '#34c759' },
    { id: 'design', label: 'Design', labelAr: 'تصميم', icon: '🎨', color: '#ff2d55' },
    { id: 'mobile', label: 'Mobile', labelAr: 'موبايل', icon: '📱', color: '#af52de' },
  ];

  readonly projectTypeOptions = [
    { id: 'web', label: 'Web App', labelAr: 'تطبيق ويب', icon: '🌐' },
    { id: 'mobile', label: 'Mobile App', labelAr: 'تطبيق موبايل', icon: '📱' },
    { id: 'saas', label: 'SaaS Platform', labelAr: 'منصة SaaS', icon: '☁️' },
    { id: 'api', label: 'Backend/API', labelAr: 'خلفية/API', icon: '⚙️' },
    { id: 'redesign', label: 'Redesign', labelAr: 'إعادة تصميم', icon: '🎨' },
    { id: 'consulting', label: 'Consulting', labelAr: 'استشارة', icon: '🧠' },
  ];

  readonly engagementModels = [
    { id: 'E-001', icon: '⚡', name: 'Fixed Scope', nameAr: 'نطاق ثابت', price: '50K - 250K EGP', description: 'Defined deliverable, fixed price, fixed timeline. Best for MVPs and small projects.', descriptionAr: 'مخرج محدد، سعر ثابت، جدول زمني ثابت. الأفضل لـ MVP والمشاريع الصغيرة.', features: ['Defined scope document', 'Fixed price', 'Weekly demos', '30-day warranty'], popular: false, color: '#007aff' },
    { id: 'E-002', icon: '🚀', name: 'Dedicated Team', nameAr: 'فريق مخصص', price: '150K+ EGP/mo', description: 'A dedicated squad integrated with your team. Maximum flexibility and velocity.', descriptionAr: 'فريق مخصص مدمج مع فريقك. أقصى مرونة وسرعة.', features: ['2-6 engineers', 'Your tools & process', 'Monthly rolling contract', 'Direct access'], popular: true, color: '#5856d6' },
    { id: 'E-003', icon: '🛠', name: 'Retainer', nameAr: 'دعم مستمر', price: '35K - 120K EGP/mo', description: 'Ongoing maintenance and feature development with SLA-backed response times.', descriptionAr: 'صيانة مستمرة وتطوير ميزات مع أوقات استجابة مضمونة بـ SLA.', features: ['SLA-backed response', 'Monthly hours bucket', 'Priority support', 'Proactive monitoring'], popular: false, color: '#34c759' },
  ];

  readonly values = [
    { id: 'V-001', icon: '⚒️', title: 'Craft Over Speed', titleAr: 'الحِرفة قبل السرعة', description: 'We ship fast, but never at the cost of quality. Clean code is non-negotiable.', descriptionAr: 'نسلّم بسرعة، لكن ليس على حساب الجودة. الكود النظيف غير قابل للتفاوض.', color: '#5856d6' },
    { id: 'V-002', icon: '🔍', title: 'Radical Transparency', titleAr: 'شفافية مطلقة', description: 'Real-time access to our boards, honest timelines, no hidden surprises.', descriptionAr: 'وصول فوري إلى لوحاتنا، جداول زمنية صادقة، بدون مفاجآت مخفية.', color: '#34c759' },
    { id: 'V-003', icon: '📚', title: 'Always Learning', titleAr: 'نتعلم دائماً', description: 'Weekly deep-dives, post-mortems, and investments in the team\'s growth.', descriptionAr: 'تعمق أسبوعي وتحليلات لاحقة واستثمار في نمو الفريق.', color: '#ff9500' },
    { id: 'V-004', icon: '🤝', title: 'Long-Term Thinking', titleAr: 'تفكير طويل الأمد', description: 'We optimise for the fifth year, not the fifth sprint.', descriptionAr: 'نُحسّن للسنة الخامسة، لا للسبرنت الخامس.', color: '#ff2d55' },
  ];

  readonly timeline = [
    { year: '2022', title: 'Founded', titleAr: 'التأسيس', description: 'X-BLEND launched as a two-person studio in Cairo, focused on Angular contracts.', descriptionAr: 'انطلقت X-BLEND كاستوديو من شخصين في القاهرة، مع التركيز على عقود Angular.', color: '#5856d6' },
    { year: '2023', title: 'First Enterprise Client', titleAr: 'أول عميل مؤسسي', description: 'Signed our first enterprise engagement and grew the team to 5 specialists.', descriptionAr: 'أول ارتباط مؤسسي ونمو الفريق إلى 5 متخصصين.', color: '#007aff' },
    { year: '2024', title: 'Product Studio Pivot', titleAr: 'التحول لاستوديو منتجات', description: 'Expanded into full-stack product delivery with 8 clients across 4 industries.', descriptionAr: 'التوسع لتسليم منتجات متكاملة مع 8 عملاء في 4 قطاعات.', color: '#34c759' },
    { year: '2025', title: 'Regional Expansion', titleAr: 'التوسع الإقليمي', description: 'Opening second office in Alexandria and targeting GCC market entry.', descriptionAr: 'افتتاح مكتب ثانٍ في الإسكندرية واستهداف سوق الخليج.', color: '#ff9500' },
  ];

  readonly perks = [
    { id: 'PK-001', icon: '🏠', title: 'Remote First', titleAr: 'العمل عن بعد', description: 'Work from anywhere with flexible hours', descriptionAr: 'اعمل من أي مكان بساعات مرنة', color: '#007aff' },
    { id: 'PK-002', icon: '📈', title: 'Equity Options', titleAr: 'خيارات أسهم', description: 'Own a piece of what we build together', descriptionAr: 'امتلك جزءاً مما نبنيه معاً', color: '#34c759' },
    { id: 'PK-003', icon: '🎓', title: 'Learning Budget', titleAr: 'ميزانية تعلم', description: '10K EGP/year for courses and conferences', descriptionAr: '10 آلاف جنيه سنوياً للدورات والمؤتمرات', color: '#ff9500' },
    { id: 'PK-004', icon: '🏥', title: 'Health Insurance', titleAr: 'تأمين صحي', description: 'Premium coverage for you and family', descriptionAr: 'تغطية متميزة لك وللعائلة', color: '#ff2d55' },
    { id: 'PK-005', icon: '💻', title: 'Best Equipment', titleAr: 'أفضل معدات', description: 'MacBook Pro + monitor + peripherals', descriptionAr: 'ماك بوك برو + شاشة + ملحقات', color: '#af52de' },
    { id: 'PK-006', icon: '🎉', title: 'Team Retreats', titleAr: 'رحلات الفريق', description: 'Quarterly team-building events', descriptionAr: 'فعاليات بناء الفريق ربع سنوية', color: '#5856d6' },
  ];

  readonly slaItems = [
    { id: 'S-001', icon: '⚡', title: 'Initial Reply', titleAr: 'الرد الأولي', value: 'Within 4 business hours', valueAr: 'خلال 4 ساعات عمل', color: '#007aff' },
    { id: 'S-002', icon: '📝', title: 'Proposal', titleAr: 'العرض', value: 'Within 2 business days', valueAr: 'خلال يومين عمل', color: '#34c759' },
    { id: 'S-003', icon: '🎯', title: 'Project Kickoff', titleAr: 'بدء المشروع', value: 'Within 1 week of approval', valueAr: 'خلال أسبوع من الموافقة', color: '#ff9500' },
  ];

  readonly socialLinks = [
    { id: 'SL-001', icon: '💼', label: 'LinkedIn', url: 'https://linkedin.com/company/xblend', color: '#0077b5' },
    { id: 'SL-002', icon: '🐙', label: 'GitHub', url: 'https://github.com/xblend', color: '#333' },
    { id: 'SL-003', icon: '𝕏', label: 'Twitter', url: 'https://twitter.com/xblend', color: '#1da1f2' },
    { id: 'SL-004', icon: '📸', label: 'Instagram', url: 'https://instagram.com/xblend', color: '#e4405f' },
  ];

  readonly nav = computed<PreviewNavItem[]>(() => [
    { id: 'home', label: this.t('Home', 'الرئيسية'), icon: '🏠', group: this.t('Company', 'الشركة') },
    { id: 'about', label: this.t('About', 'عن الشركة'), icon: 'ℹ️', group: this.t('Company', 'الشركة') },
    { id: 'team', label: this.t('Team', 'الفريق'), icon: '👥', badge: this.team().length, group: this.t('Company', 'الشركة') },
    { id: 'services', label: this.t('Services', 'الخدمات'), icon: '⚡', badge: this.services().length, group: this.t('Work', 'العمل') },
    { id: 'portfolio', label: this.t('Portfolio', 'الأعمال'), icon: '🎨', badge: this.projects().length, group: this.t('Work', 'العمل') },
    { id: 'projects', label: this.t('Case Studies', 'دراسات الحالة'), icon: '📊', group: this.t('Work', 'العمل') },
    { id: 'process', label: this.t('Process', 'المنهجية'), icon: '📋', group: this.t('Work', 'العمل') },
    { id: 'tech', label: this.t('Tech Stack', 'التقنيات'), icon: '🛠', badge: this.tech().length, group: this.t('Capabilities', 'القدرات') },
    { id: 'clients', label: this.t('Clients', 'العملاء'), icon: '⭐', badge: this.clients().length, group: this.t('Capabilities', 'القدرات') },
    { id: 'blog', label: this.t('Blog', 'المدونة'), icon: '📝', badge: this.blogPosts().length, group: this.t('Content', 'المحتوى') },
    { id: 'careers', label: this.t('Careers', 'الوظائف'), icon: '💼', badge: this.openJobs().length, group: this.t('Content', 'المحتوى') },
    { id: 'contact', label: this.t('Contact', 'تواصل'), icon: '✉️', group: this.t('Content', 'المحتوى') },
  ]);

  readonly toolbar = computed<ToolbarAction[]>(() => [
    { id: 'refresh', label: this.t('Refresh', 'تحديث'), icon: '⟳', action: () => this.toast.success(this.t('Refreshed', 'تم التحديث')) },
    { id: 'cta', label: this.t('Start Project', 'ابدأ مشروع'), icon: '🚀', primary: true, action: () => this.active.set('contact') },
  ]);

  readonly notifs = computed<PreviewNotification[]>(() => [
    { id: 1, icon: '💼', title: this.t('Now hiring', 'نوظف الآن'), body: this.t('7 open positions across engineering', '7 وظائف مفتوحة في الهندسة'), time: '1h' },
    { id: 2, icon: '🎉', title: this.t('New case study', 'دراسة حالة جديدة'), body: this.t('AR-Room aggregator published', 'تم نشر مُجمّع AR-Room'), time: '3h' },
    { id: 3, icon: '📝', title: this.t('New blog post', 'مقالة جديدة'), body: this.t('Signals vs NgRx comparison', 'مقارنة Signals و NgRx'), time: '1d' },
    { id: 4, icon: '⭐', title: this.t('Client review', 'تقييم عميل'), body: this.t('5 stars from TechCorp', '5 نجوم من تك كورب'), time: '2d' },
  ]);

  readonly searchPlaceholder = computed(() =>
    this.active() === 'portfolio' ? this.t('Search projects…', 'ابحث في المشاريع…') :
      this.active() === 'blog' ? this.t('Search articles…', 'ابحث في المقالات…') :
        this.active() === 'careers' ? this.t('Search roles…', 'ابحث عن وظيفة…') : ''
  );

  readonly yearsActive = computed(() => new Date().getFullYear() - 2022);
  readonly hiringCount = computed(() => this.jobs().filter(j => j.open).length);
  readonly openJobs = computed(() => this.jobs().filter(j => j.open));
  readonly featuredProjects = computed(() => this.projects().filter(p => p.featured));
  readonly featuredPost = computed(() => this.blogPosts().find(p => p.featured));
  readonly regularBlogPosts = computed(() => this.blogPosts().filter(p => !p.featured));

  readonly stats = computed(() => [
    { icon: '🚀', label: 'Projects Delivered', labelAr: 'مشروع مسلّم', value: this.projects().length.toString() },
    { icon: '👥', label: 'Happy Clients', labelAr: 'عميل سعيد', value: this.clients().length.toString() },
    { icon: '⚡', label: 'Team Size', labelAr: 'حجم الفريق', value: this.team().length.toString() },
    { icon: '🏆', label: 'Client Rating', labelAr: 'تقييم العملاء', value: '4.9★' },
  ]);

  readonly serviceStats = computed(() => [
    { icon: '⚡', label: this.t('Active services', 'خدمات نشطة'), value: this.services().length.toString(), color: '#5856d6' },
    { icon: '🎯', label: this.t('Avg delivery', 'متوسط التسليم'), value: '8 weeks', color: '#34c759' },
    { icon: '💰', label: this.t('Starting at', 'تبدأ من'), value: '35K EGP', color: '#ff9500' },
    { icon: '⭐', label: this.t('Satisfaction', 'رضا العملاء'), value: '98%', color: '#ff2d55' },
  ]);

  readonly teamStats = computed(() => [
    { icon: '👥', label: this.t('Team members', 'أعضاء الفريق'), value: this.team().length.toString(), color: '#5856d6' },
    { icon: '🌍', label: this.t('Countries', 'دول'), value: '2', color: '#34c759' },
    { icon: '⏱', label: this.t('Avg tenure', 'متوسط الخبرة'), value: '2.5y', color: '#ff9500' },
    { icon: '🎓', label: this.t('Avg experience', 'متوسط الخبرة'), value: '5y', color: '#ff2d55' },
  ]);

  readonly aboutNumbers = computed(() => [
    { icon: '📦', label: 'Projects shipped', labelAr: 'مشروع مسلّم', value: '27+', color: '#5856d6' },
    { icon: '👥', label: 'Happy clients', labelAr: 'عميل سعيد', value: '15+', color: '#34c759' },
    { icon: '👨‍💻', label: 'Team members', labelAr: 'أعضاء الفريق', value: this.team().length.toString(), color: '#ff9500' },
    { icon: '🎯', label: 'Retention rate', labelAr: 'معدل الاحتفاظ', value: '94%', color: '#ff2d55' },
  ]);

  readonly filteredProjects = computed(() => {
    let list = this.projects();
    const f = this.projectFilter();
    if (f !== 'all') list = list.filter(p => p.category === f);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.techStack.some(t => t.toLowerCase().includes(q))
    );
    return list;
  });

  readonly filteredTech = computed(() => {
    let list = this.tech();
    const c = this.techCategory();
    if (c !== 'all') list = list.filter(t => t.category === c);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(t => t.name.toLowerCase().includes(q));
    return [...list].sort((a, b) => b.level - a.level);
  });

  t(en: string, ar: string): string { return this.lang() === 'ar' ? ar : en; }
  onNav(id: string): void { this.active.set(id as XbView); }
  onSearch(q: string): void { this.searchQuery.set(q); }
  initials(name: string): string { return name.split(' ').slice(0, 2).map(n => n.charAt(0)).join(''); }

  countByCategory(id: string): number {
    if (id === 'all') return this.projects().length;
    return this.projects().filter(p => p.category === id).length;
  }

  countTechByCategory(id: string): number {
    if (id === 'all') return this.tech().length;
    return this.tech().filter(t => t.category === id).length;
  }

  clientColor(clientId: string): string {
    return this.clients().find(c => c.id === clientId)?.color ?? '#007aff';
  }

  departmentColor(dept: string): string {
    const map: Record<string, string> = {
      Engineering: '#5856d6',
      Design: '#ff2d55',
      Infrastructure: '#ff9500',
      Quality: '#34c759',
      Product: '#007aff',
      Docs: '#af52de',
    };
    return map[dept] ?? '#5856d6';
  }

  techCategoryAr(cat: string): string {
    const map: Record<string, string> = {
      frontend: 'واجهات', backend: 'خلفية', database: 'قواعد بيانات',
      cloud: 'سحابة', devops: 'DevOps', design: 'تصميم', mobile: 'موبايل',
    };
    return map[cat] ?? cat;
  }

  jobTypeAr(t: string): string {
    const map: Record<string, string> = {
      'full-time': 'دوام كامل', 'part-time': 'دوام جزئي',
      contract: 'عقد', internship: 'تدريب',
    };
    return map[t] ?? t;
  }

  jobLevelAr(l: string): string {
    const map: Record<string, string> = {
      junior: 'مبتدئ', mid: 'متوسط', senior: 'أول', lead: 'قائد',
    };
    return map[l] ?? l;
  }

  openService(id: string): void {
    const s = this.services().find(x => x.id === id);
    if (s) this.toast.info(this.t(s.title, s.titleAr), this.t(s.tagline, s.taglineAr));
  }

  openProject(id: string): void {
    const p = this.projects().find(x => x.id === id);
    if (p) this.selectedProject.set(p);
  }

  openTeamMember(id: string): void {
    const m = this.team().find(x => x.id === id);
    if (m) this.selectedTeamMember.set(m);
  }

  openClient(id: string): void {
    const c = this.clients().find(x => x.id === id);
    if (c) this.toast.info(this.t(c.name, c.nameAr), `${c.projectsDelivered} ${this.t('projects', 'مشروع')}`);
  }

  openJob(id: string): void {
    const j = this.jobs().find(x => x.id === id);
    if (j) this.selectedJob.set(j);
  }

  openBlogPost(id: string): void {
    const b = this.blogPosts().find(x => x.id === id);
    if (b) this.toast.info(this.t(b.title, b.titleAr), `${b.readTime} min read · ${b.views} views`);
  }

  openProcessStep(id: string): void {
    const p = this.process().find(x => x.id === id);
    if (p) this.toast.info(this.t(p.title, p.titleAr), this.t(p.description, p.descriptionAr));
  }

  requestService(s: Service): void {
    this.toast.success(this.t('Inquiry sent', 'تم إرسال الطلب'), this.t(s.title, s.titleAr));
  }

  requestEngagement(e: { name: string; nameAr: string; }): void {
    this.toast.success(this.t('Inquiry sent', 'تم إرسال الطلب'), this.t(e.name, e.nameAr));
  }

  requestSimilar(p: PortfolioProject): void {
    this.selectedProject.set(null);
    this.toast.success(this.t('Inquiry sent', 'تم إرسال الطلب'), this.t(p.name, p.nameAr));
  }

  applyJob(j: JobPosition): void {
    this.toast.success(this.t('Application sent', 'تم إرسال الطلب'), this.t(j.title, j.titleAr));
  }

  speculativeApplication(): void {
    this.toast.success(this.t('Application sent', 'تم إرسال الطلب'), this.t('We\'ll review shortly', 'سنراجع قريباً'));
  }

  submitContact(): void {
    this.sent.set(true);
    this.toast.success(this.t('Message sent', 'تم إرسال الرسالة'), this.t('We\'ll reply within 24h', 'سنرد خلال 24 ساعة'));
    setTimeout(() => this.sent.set(false), 3500);
  }

  onProjectContext(ev: MouseEvent, p: PortfolioProject): void {
    ev.preventDefault(); ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: this.t('View project', 'عرض المشروع'), icon: '👁', action: () => this.openProject(p.id) },
      { id: 'similar', label: this.t('Request similar', 'اطلب مشابهاً'), icon: '💬', action: () => this.requestSimilar(p) },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      { id: 'copy', label: this.t('Copy project name', 'نسخ اسم المشروع'), icon: '📋', action: () => { navigator.clipboard?.writeText(p.name); this.toast.success(this.t('Copied', 'تم النسخ')); } },
    ]);
  }

  onJobContext(ev: MouseEvent, j: JobPosition): void {
    ev.preventDefault(); ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: this.t('View job', 'عرض الوظيفة'), icon: '👁', action: () => this.openJob(j.id) },
      { id: 'apply', label: this.t('Apply now', 'قدم الآن'), icon: '✉', action: () => this.applyJob(j), disabled: !j.open },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      { id: 'share', label: this.t('Share', 'مشاركة'), icon: '🔗', action: () => this.toast.success(this.t('Link copied', 'تم نسخ الرابط')) },
    ]);
  }

  onBlogContext(ev: MouseEvent, b: BlogPost): void {
    ev.preventDefault(); ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: this.t('Read post', 'اقرأ المقال'), icon: '📖', action: () => this.openBlogPost(b.id) },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      { id: 'share', label: this.t('Copy link', 'نسخ الرابط'), icon: '🔗', action: () => { navigator.clipboard?.writeText(`xblend.co/blog/${b.id}`); this.toast.success(this.t('Link copied', 'تم نسخ الرابط')); } },
      { id: 'save', label: this.t('Save for later', 'حفظ للاحقاً'), icon: '🔖', action: () => this.toast.success(this.t('Saved', 'تم الحفظ')) },
    ]);
  }
}