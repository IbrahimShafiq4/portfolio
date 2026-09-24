import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PreviewShellComponent, PreviewNavItem, ToolbarAction, PreviewNotification } from '../../shared/preview-shell/preview-shell';

type AfkarView =
  | 'feed' | 'profile' | 'network' | 'jobs'
  | 'applied' | 'saved' | 'messages' | 'notifications'
  | 'companies' | 'recruiter' | 'analytics' | 'settings';

type Lang = 'en' | 'ar';

interface UserProfile {
  id: string; name: string; nameAr: string;
  headline: string; headlineAr: string;
  location: string; locationAr: string;
  avatar: string; coverGradient: string;
  about: string; aboutAr: string;
  connections: number;
  followers: number;
  profileViews: number;
  searchAppearances: number;
  openToWork: boolean;
  verified: boolean;
  premium: boolean;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  languages: string[];
  certifications: Certification[];
}

interface Experience {
  id: string; role: string; roleAr: string;
  company: string; companyAr: string;
  companyLogo: string;
  location: string; locationAr: string;
  start: string; end: string;
  duration: string;
  description: string; descriptionAr: string;
  skills: string[];
}

interface Education {
  id: string; school: string; schoolAr: string;
  logo: string;
  degree: string; degreeAr: string;
  field: string; fieldAr: string;
  start: string; end: string;
  grade: string;
}

interface Skill {
  id: string; name: string; nameAr: string;
  endorsements: number;
  endorsed: boolean;
}

interface Certification {
  id: string; name: string; issuer: string;
  issuedAt: string;
}

interface Post {
  id: string; authorId: string;
  authorName: string; authorNameAr: string;
  authorHeadline: string; authorHeadlineAr: string;
  authorAvatar: string;
  time: string; timeAr: string;
  content: string; contentAr: string;
  image?: string;
  hashtags: string[];
  likes: number; comments: number; shares: number;
  liked: boolean;
  type: 'post' | 'job-share' | 'article' | 'achievement';
}

interface Connection {
  id: string; name: string; nameAr: string;
  headline: string; headlineAr: string;
  avatar: string;
  mutualConnections: number;
  location: string;
  status: 'connected' | 'pending-sent' | 'pending-received' | 'suggested';
}

interface Job {
  id: string; title: string; titleAr: string;
  company: string; companyAr: string;
  companyLogo: string;
  location: string; locationAr: string;
  workType: 'onsite' | 'hybrid' | 'remote';
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience: 'entry' | 'mid' | 'senior' | 'lead';
  salaryMin: number; salaryMax: number; currency: string;
  posted: string; postedAr: string;
  applicants: number;
  easyApply: boolean;
  promoted: boolean;
  matchScore: number;
  skills: string[];
  description: string; descriptionAr: string;
  saved: boolean;
  applied: boolean;
}

interface Application {
  id: string; jobId: string;
  jobTitle: string; jobTitleAr: string;
  company: string; companyAr: string;
  companyLogo: string;
  appliedAt: string;
  stage: 'applied' | 'viewed' | 'screening' | 'interview' | 'offer' | 'rejected';
  stageProgress: number;
  notes: string;
  interviewDate?: string;
  recruiterName?: string;
  recruiterAvatar?: string;
}

interface Message {
  id: string; fromId: string;
  fromName: string; fromNameAr: string;
  fromAvatar: string;
  fromHeadline: string; fromHeadlineAr: string;
  preview: string; previewAr: string;
  time: string; timeAr: string;
  unread: boolean;
  starred: boolean;
}

interface Notification {
  id: string; icon: string; color: string;
  title: string; titleAr: string;
  body: string; bodyAr: string;
  time: string; timeAr: string;
  read: boolean;
  type: 'job' | 'connection' | 'post' | 'message' | 'achievement';
}

interface CompanyPage {
  id: string; name: string; nameAr: string;
  logo: string; color: string;
  industry: string; industryAr: string;
  size: string;
  location: string; locationAr: string;
  followers: number;
  openJobs: number;
  about: string; aboutAr: string;
  verified: boolean;
}

interface RecruiterCandidate {
  id: string; name: string; nameAr: string;
  headline: string; headlineAr: string;
  avatar: string;
  location: string;
  experience: number;
  matchScore: number;
  skills: string[];
  available: boolean;
  salaryExpectation: string;
  stage: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
}

@Component({
  selector: 'app-afkar-preview',
  standalone: true,
  imports: [PreviewShellComponent, DecimalPipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="💼"
      title="Afkar"
      [subtitle]="lang() === 'ar' ? 'منصة مهنية · وظائف · شبكة احترافية' : 'Professional Network · Jobs · Career'"
      [nav]="nav()"
      [active]="active()"
      (activeChange)="onNav($any($event))"
      [toolbarActions]="toolbar()"
      [notifications]="notifs()"
      [searchPlaceholder]="searchPlaceholder()"
      (searchChange)="onSearch($event)"
    >
      <div class="af-bar">
        <div class="lang-switch">
          <button class="ls-btn" [class.active]="lang() === 'en'" (click)="lang.set('en')">EN</button>
          <button class="ls-btn" [class.active]="lang() === 'ar'" (click)="lang.set('ar')">AR</button>
        </div>
        <div class="mode-pill" [class.recruiter]="isRecruiterMode()">
          <span class="mp-dot"></span>
          <span>{{ isRecruiterMode() ? t('Recruiter Mode', 'وضع المسؤول') : t('Job Seeker', 'باحث عن عمل') }}</span>
        </div>
        @if (me().openToWork) {
          <div class="otw-pill">
            <span>#</span>
            <span>{{ t('Open to work', 'متاح للعمل') }}</span>
          </div>
        }
        <div class="quick-stats">
          <span><b>{{ appliedCount() }}</b> {{ t('applied', 'تقديم') }}</span>
          <span class="qs-sep">·</span>
          <span><b>{{ savedJobs().length }}</b> {{ t('saved', 'محفوظة') }}</span>
          <span class="qs-sep">·</span>
          <span><b>{{ unreadMessages() }}</b> {{ t('messages', 'رسالة') }}</span>
        </div>
      </div>

      @switch (active()) {

        @case ('feed') {
          <div class="view feed-view">
            <aside class="feed-left">
              <section class="profile-card">
                <div class="pc-cover" [style.background]="me().coverGradient">
                  @if (me().premium) {
                    <span class="pc-premium">⭐ Premium</span>
                  }
                </div>
                <div class="pc-avatar-wrap">
                  <span class="pc-avatar">{{ me().avatar }}</span>
                </div>
                <div class="pc-body">
                  <div class="pc-name-row">
                    <h3>{{ t(me().name, me().nameAr) }}</h3>
                    @if (me().verified) { <span class="verify-badge" title="Verified">✓</span> }
                  </div>
                  <p class="pc-headline">{{ t(me().headline, me().headlineAr) }}</p>
                  <p class="pc-location">📍 {{ t(me().location, me().locationAr) }}</p>
                  <div class="pc-stats">
                    <div class="pcs-item">
                      <b>{{ me().profileViews }}</b>
                      <small>{{ t('Views', 'مشاهدات') }}</small>
                    </div>
                    <div class="pcs-item">
                      <b>{{ me().searchAppearances }}</b>
                      <small>{{ t('Searches', 'بحث') }}</small>
                    </div>
                  </div>
                  <button class="pc-cta" (click)="active.set('profile')">
                    {{ t('View full profile', 'عرض الملف كامل') }} →
                  </button>
                </div>
              </section>

              <section class="mini-card">
                <header>
                  <b>📊 {{ t('Your Analytics', 'تحليلاتك') }}</b>
                </header>
                <div class="an-list">
                  @for (a of analyticsMini(); track a.label) {
                    <div class="an-row">
                      <span class="an-icon">{{ a.icon }}</span>
                      <div>
                        <b class="mono">{{ a.value }}</b>
                        <small>{{ t(a.label, a.labelAr) }}</small>
                      </div>
                    </div>
                  }
                </div>
              </section>

              <section class="mini-card">
                <header>
                  <b>💼 {{ t('Recent applications', 'أحدث التقديمات') }}</b>
                  <button class="link-btn" (click)="active.set('applied')">{{ t('All', 'الكل') }}</button>
                </header>
                <ul class="mini-list">
                  @for (app of applications().slice(0, 3); track app.id) {
                    <li (click)="openApplication(app.id)">
                      <span class="mini-logo">{{ app.companyLogo }}</span>
                      <div>
                        <b>{{ t(app.jobTitle, app.jobTitleAr) }}</b>
                        <small>{{ t(app.company, app.companyAr) }} · {{ t(app.stage, appStageAr(app.stage)) }}</small>
                      </div>
                    </li>
                  }
                </ul>
              </section>
            </aside>

            <main class="feed-main">
              <section class="composer">
                <span class="cmp-avatar">{{ me().avatar }}</span>
                <button class="cmp-input" (click)="createPost()">{{ t('Start a post…', 'ابدأ منشوراً…') }}</button>
                <div class="cmp-actions">
                  <button class="cmp-btn" (click)="toast.info(t('Upload image', 'رفع صورة'))"><span>🖼</span> {{ t('Photo', 'صورة') }}</button>
                  <button class="cmp-btn" (click)="toast.info(t('Add video', 'إضافة فيديو'))"><span>🎥</span> {{ t('Video', 'فيديو') }}</button>
                  <button class="cmp-btn" (click)="toast.info(t('Write article', 'كتابة مقال'))"><span>📝</span> {{ t('Article', 'مقال') }}</button>
                </div>
              </section>

              <div class="filter-bar-feed">
                <span class="fb-line"></span>
                <div class="fb-tabs">
                  @for (f of feedFilters; track f.id) {
                    <button class="fb-tab" [class.active]="feedFilter() === f.id" (click)="feedFilter.set(f.id)">
                      {{ t(f.label, f.labelAr) }}
                    </button>
                  }
                </div>
              </div>

              @for (post of filteredFeed(); track post.id) {
                <article class="post-card" (contextmenu)="onPostContext($event, post)">
                  <header class="post-head">
                    <span class="post-avatar">{{ post.authorAvatar }}</span>
                    <div class="post-author">
                      <div class="pa-row">
                        <b>{{ t(post.authorName, post.authorNameAr) }}</b>
                        @if (post.type === 'achievement') { <span class="pa-badge">🎉</span> }
                      </div>
                      <small>{{ t(post.authorHeadline, post.authorHeadlineAr) }}</small>
                      <span class="post-time">🕐 {{ t(post.time, post.timeAr) }}</span>
                    </div>
                    <button class="post-menu">⋯</button>
                  </header>

                  @if (post.type === 'job-share') {
                    <div class="post-tag job-tag">💼 {{ t('Job Opening', 'وظيفة مفتوحة') }}</div>
                  } @else if (post.type === 'article') {
                    <div class="post-tag article-tag">📝 {{ t('Article', 'مقال') }}</div>
                  } @else if (post.type === 'achievement') {
                    <div class="post-tag achievement-tag">🎉 {{ t('Achievement', 'إنجاز') }}</div>
                  }

                  <p class="post-content">{{ t(post.content, post.contentAr) }}</p>

                  @if (post.image) {
                    <div class="post-image">{{ post.image }}</div>
                  }

                  @if (post.hashtags.length) {
                    <div class="post-hashtags">
                      @for (tag of post.hashtags; track tag) {
                        <span class="hashtag">#{{ tag }}</span>
                      }
                    </div>
                  }

                  <div class="post-stats">
                    <span class="ps-likes">👍❤️ {{ post.likes | number }}</span>
                    <span class="ps-comments">{{ post.comments }} {{ t('comments', 'تعليق') }} · {{ post.shares }} {{ t('shares', 'مشاركة') }}</span>
                  </div>

                  <div class="post-actions">
                    <button class="pa-btn" [class.liked]="post.liked" (click)="toggleLike(post.id)">
                      <span>{{ post.liked ? '👍' : '👍' }}</span>
                      <span>{{ post.liked ? t('Liked', 'أعجبني') : t('Like', 'إعجاب') }}</span>
                    </button>
                    <button class="pa-btn" (click)="toast.info(t('Comments', 'التعليقات'))">
                      <span>💬</span><span>{{ t('Comment', 'تعليق') }}</span>
                    </button>
                    <button class="pa-btn" (click)="toast.info(t('Shared', 'تمت المشاركة'))">
                      <span>↗</span><span>{{ t('Share', 'مشاركة') }}</span>
                    </button>
                    <button class="pa-btn" (click)="toast.info(t('Sent', 'تم الإرسال'))">
                      <span>✉</span><span>{{ t('Send', 'إرسال') }}</span>
                    </button>
                  </div>
                </article>
              }
            </main>

            <aside class="feed-right">
              <section class="mini-card">
                <header>
                  <b>👥 {{ t('People you may know', 'أشخاص قد تعرفهم') }}</b>
                </header>
                <ul class="conn-list">
                  @for (c of suggestedConnections(); track c.id) {
                    <li>
                      <span class="conn-avatar">{{ c.avatar }}</span>
                      <div>
                        <b>{{ t(c.name, c.nameAr) }}</b>
                        <small>{{ t(c.headline, c.headlineAr) }}</small>
                        <span class="conn-mutual">{{ c.mutualConnections }} {{ t('mutual', 'مشترك') }}</span>
                      </div>
                      <button class="conn-btn" (click)="connect(c.id)">+</button>
                    </li>
                  }
                </ul>
              </section>

              <section class="mini-card">
                <header>
                  <b>🎯 {{ t('Recommended jobs', 'وظائف مقترحة') }}</b>
                  <button class="link-btn" (click)="active.set('jobs')">{{ t('All', 'الكل') }}</button>
                </header>
                <ul class="mini-list">
                  @for (j of recommendedJobs().slice(0, 4); track j.id) {
                    <li (click)="openJob(j.id)">
                      <span class="mini-logo">{{ j.companyLogo }}</span>
                      <div>
                        <b>{{ t(j.title, j.titleAr) }}</b>
                        <small>{{ t(j.company, j.companyAr) }} · {{ t(j.location, j.locationAr) }}</small>
                        <span class="match-chip">Match {{ j.matchScore }}%</span>
                      </div>
                    </li>
                  }
                </ul>
              </section>

              <section class="mini-card trending-card">
                <header>
                  <b>🔥 {{ t('Trending', 'الأكثر رواجاً') }}</b>
                </header>
                <ul class="trending-list">
                  @for (tr of trendingTopics; track tr.tag) {
                    <li>
                      <div class="tr-rank">#{{ tr.rank }}</div>
                      <div>
                        <b>{{ tr.tag }}</b>
                        <small>{{ tr.posts | number }} {{ t('posts', 'منشور') }}</small>
                      </div>
                    </li>
                  }
                </ul>
              </section>
            </aside>
          </div>
        }

        @case ('profile') {
          <div class="view">
            <section class="profile-hero">
              <div class="ph-cover" [style.background]="me().coverGradient"></div>
              <div class="ph-body">
                <div class="ph-avatar-wrap">
                  <span class="ph-avatar">{{ me().avatar }}</span>
                </div>
                <div class="ph-info">
                  <h2>
                    {{ t(me().name, me().nameAr) }}
                    @if (me().verified) { <span class="verify-badge" title="Verified">✓</span> }
                  </h2>
                  <p class="ph-headline">{{ t(me().headline, me().headlineAr) }}</p>
                  <p class="ph-meta">📍 {{ t(me().location, me().locationAr) }} · <b class="link">{{ t('Contact info', 'معلومات التواصل') }}</b></p>
                  <p class="ph-connections"><b class="link">{{ me().connections }}+ {{ t('connections', 'اتصال') }}</b></p>
                  <div class="ph-actions">
                    <button class="pill primary" (click)="active.set('jobs')">{{ t('Open to', 'متاح لـ') }}</button>
                    <button class="pill" (click)="toast.success(t('Profile link copied', 'تم نسخ رابط الملف'))">{{ t('Copy link', 'نسخ الرابط') }}</button>
                    <button class="pill" (click)="toast.info(t('Edit profile', 'تعديل الملف'))">✎ {{ t('Edit', 'تعديل') }}</button>
                  </div>
                </div>
              </div>
            </section>

            <div class="profile-layout">
              <div class="profile-main">
                <section class="card">
                  <header class="card-head">
                    <h3>{{ t('About', 'نبذة') }}</h3>
                    <button class="edit-btn">✎</button>
                  </header>
                  <p class="about-text">{{ t(me().about, me().aboutAr) }}</p>
                </section>

                <section class="card">
                  <header class="card-head">
                    <h3>{{ t('Experience', 'الخبرات') }}</h3>
                    <button class="edit-btn">＋</button>
                  </header>
                  <ul class="exp-list">
                    @for (e of me().experience; track e.id) {
                      <li class="exp-item">
                        <span class="exp-logo">{{ e.companyLogo }}</span>
                        <div class="exp-body">
                          <div class="exp-head">
                            <div>
                              <b>{{ t(e.role, e.roleAr) }}</b>
                              <span class="exp-company">{{ t(e.company, e.companyAr) }}</span>
                            </div>
                          </div>
                          <p class="exp-dates">{{ e.start }} – {{ e.end }} · {{ e.duration }}</p>
                          <p class="exp-loc">📍 {{ t(e.location, e.locationAr) }}</p>
                          <p class="exp-desc">{{ t(e.description, e.descriptionAr) }}</p>
                          <div class="exp-skills">
                            @for (s of e.skills; track s) {
                              <span class="exp-skill">{{ s }}</span>
                            }
                          </div>
                        </div>
                      </li>
                    }
                  </ul>
                </section>

                <section class="card">
                  <header class="card-head">
                    <h3>{{ t('Education', 'التعليم') }}</h3>
                    <button class="edit-btn">＋</button>
                  </header>
                  <ul class="edu-list">
                    @for (e of me().education; track e.id) {
                      <li class="edu-item">
                        <span class="edu-logo">{{ e.logo }}</span>
                        <div>
                          <b>{{ t(e.school, e.schoolAr) }}</b>
                          <p>{{ t(e.degree, e.degreeAr) }} · {{ t(e.field, e.fieldAr) }}</p>
                          <p class="edu-dates">{{ e.start }} – {{ e.end }} · {{ e.grade }}</p>
                        </div>
                      </li>
                    }
                  </ul>
                </section>

                <section class="card">
                  <header class="card-head">
                    <h3>{{ t('Skills', 'المهارات') }}</h3>
                    <button class="edit-btn">＋</button>
                  </header>
                  <ul class="skills-list">
                    @for (s of me().skills; track s.id) {
                      <li class="skill-row" [class.endorsed]="s.endorsed" (click)="endorseSkill(s.id)">
                        <div>
                          <b>{{ t(s.name, s.nameAr) }}</b>
                          <small>{{ s.endorsements }} {{ t('endorsements', 'تزكية') }}</small>
                        </div>
                        <button class="endorse-btn" [class.on]="s.endorsed">
                          {{ s.endorsed ? '✓' : '＋' }}
                        </button>
                      </li>
                    }
                  </ul>
                </section>

                <section class="card">
                  <header class="card-head">
                    <h3>{{ t('Certifications', 'الشهادات') }}</h3>
                  </header>
                  <ul class="cert-list">
                    @for (c of me().certifications; track c.id) {
                      <li>
                        <span class="cert-icon">🏆</span>
                        <div>
                          <b>{{ c.name }}</b>
                          <small>{{ c.issuer }} · {{ c.issuedAt }}</small>
                        </div>
                      </li>
                    }
                  </ul>
                </section>
              </div>

              <aside class="profile-side">
                <section class="card">
                  <header class="card-head">
                    <h3>{{ t('Profile performance', 'أداء الملف') }}</h3>
                  </header>
                  <div class="perf-list">
                    @for (a of analyticsFull(); track a.label) {
                      <div class="perf-row">
                        <span class="perf-icon">{{ a.icon }}</span>
                        <div>
                          <b class="mono">{{ a.value }}</b>
                          <small>{{ t(a.label, a.labelAr) }}</small>
                        </div>
                      </div>
                    }
                  </div>
                </section>

                <section class="card">
                  <header class="card-head">
                    <h3>{{ t('Languages', 'اللغات') }}</h3>
                  </header>
                  <ul class="lang-list">
                    @for (l of me().languages; track l) {
                      <li><span class="lang-icon">🌐</span> {{ l }}</li>
                    }
                  </ul>
                </section>
              </aside>
            </div>
          </div>
        }

        @case ('network') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Connections', 'الاتصالات') }}</span>
                <h3>{{ t('My Network', 'شبكتي') }}</h3>
                <p>{{ me().connections }} {{ t('connections', 'اتصال') }} · {{ pendingReceived().length }} {{ t('pending', 'معلّق') }}</p>
              </div>
            </header>

            <div class="network-tabs">
              @for (f of networkFilters; track f.id) {
                <button class="nt-chip" [class.active]="networkFilter() === f.id" (click)="networkFilter.set(f.id)">
                  <span>{{ f.icon }}</span>
                  <span>{{ t(f.label, f.labelAr) }}</span>
                  <span class="nt-count">{{ countByNetwork(f.id) }}</span>
                </button>
              }
            </div>

            @if (networkFilter() === 'invitations' && pendingReceived().length) {
              <section class="card">
                <header class="card-head">
                  <h3>{{ t('Pending Invitations', 'الدعوات المعلقة') }}</h3>
                  <small>{{ pendingReceived().length }} {{ t('waiting for you', 'بانتظارك') }}</small>
                </header>
                <ul class="inv-list">
                  @for (c of pendingReceived(); track c.id) {
                    <li class="inv-row">
                      <span class="inv-avatar">{{ c.avatar }}</span>
                      <div class="inv-body">
                        <b>{{ t(c.name, c.nameAr) }}</b>
                        <small>{{ t(c.headline, c.headlineAr) }}</small>
                        <span class="inv-mutual">{{ c.mutualConnections }} {{ t('mutual connections', 'اتصال مشترك') }}</span>
                      </div>
                      <div class="inv-actions">
                        <button class="pill primary" (click)="acceptConnection(c.id)">{{ t('Accept', 'قبول') }}</button>
                        <button class="pill" (click)="ignoreConnection(c.id)">{{ t('Ignore', 'تجاهل') }}</button>
                      </div>
                    </li>
                  }
                </ul>
              </section>
            }

            <div class="connections-grid">
              @for (c of filteredConnections(); track c.id) {
                <article class="conn-card" [attr.data-s]="c.status">
                  <span class="cc-avatar">{{ c.avatar }}</span>
                  <b>{{ t(c.name, c.nameAr) }}</b>
                  <p class="cc-headline">{{ t(c.headline, c.headlineAr) }}</p>
                  <p class="cc-mutual">{{ c.mutualConnections }} {{ t('mutual', 'مشترك') }}</p>
                  <footer class="cc-foot">
                    @if (c.status === 'connected') {
                      <button class="pill" (click)="toast.info(t('Message sent', 'تم إرسال الرسالة'))">{{ t('Message', 'رسالة') }}</button>
                    } @else if (c.status === 'pending-sent') {
                      <button class="pill" disabled>{{ t('Pending', 'معلّق') }}</button>
                    } @else if (c.status === 'pending-received') {
                      <button class="pill primary" (click)="acceptConnection(c.id)">{{ t('Accept', 'قبول') }}</button>
                    } @else {
                      <button class="pill primary" (click)="connect(c.id)">＋ {{ t('Connect', 'تواصل') }}</button>
                    }
                  </footer>
                </article>
              }
            </div>
          </div>
        }

        @case ('jobs') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Discover', 'اكتشف') }}</span>
                <h3>{{ t('Jobs', 'الوظائف') }}</h3>
                <p>{{ filteredJobs().length }} {{ t('of', 'من') }} {{ jobs().length }} {{ t('jobs', 'وظيفة') }} · {{ t('matched to your profile', 'مطابقة لملفك') }}</p>
              </div>
              <div class="view-actions">
                <select class="sel" [ngModel]="jobSort()" (ngModelChange)="jobSort.set($event)">
                  <option value="match">{{ t('Best match', 'الأفضل تطابقاً') }}</option>
                  <option value="recent">{{ t('Most recent', 'الأحدث') }}</option>
                  <option value="salary">{{ t('Highest salary', 'الأعلى راتباً') }}</option>
                </select>
              </div>
            </header>

            <div class="jobs-layout">
              <aside class="jobs-filters">
                <section class="jf-group">
                  <h4>{{ t('Work type', 'نوع العمل') }}</h4>
                  @for (w of workTypes; track w.id) {
                    <label class="jf-check">
                      <input type="checkbox" [checked]="filterWorkType().includes(w.id)" (change)="toggleWorkType(w.id)" />
                      <span>{{ t(w.label, w.labelAr) }}</span>
                    </label>
                  }
                </section>
                <section class="jf-group">
                  <h4>{{ t('Experience', 'الخبرة') }}</h4>
                  @for (e of experienceLevels; track e.id) {
                    <label class="jf-check">
                      <input type="checkbox" [checked]="filterExperience().includes(e.id)" (change)="toggleExperience(e.id)" />
                      <span>{{ t(e.label, e.labelAr) }}</span>
                    </label>
                  }
                </section>
                <section class="jf-group">
                  <h4>{{ t('Job type', 'طبيعة الوظيفة') }}</h4>
                  @for (t2 of jobTypes; track t2.id) {
                    <label class="jf-check">
                      <input type="checkbox" [checked]="filterJobType().includes(t2.id)" (change)="toggleJobType(t2.id)" />
                      <span>{{ t(t2.label, t2.labelAr) }}</span>
                    </label>
                  }
                </section>
                <section class="jf-group">
                  <h4>{{ t('Salary (EGP)', 'الراتب (جنيه)') }}</h4>
                  <div class="salary-range">
                    <input type="number" class="input-sm" [value]="salaryMin()" (input)="salaryMin.set(+$any($event.target).value)" />
                    <span>—</span>
                    <input type="number" class="input-sm" [value]="salaryMax()" (input)="salaryMax.set(+$any($event.target).value)" />
                  </div>
                </section>
                <button class="pill full" (click)="resetJobFilters()">{{ t('Reset filters', 'إعادة تعيين') }}</button>
              </aside>

              <div class="jobs-list">
                @for (j of filteredJobs(); track j.id) {
                  <article class="job-card" [class.promoted]="j.promoted" (click)="openJob(j.id)" (contextmenu)="onJobContext($event, j)">
                    @if (j.promoted) {
                      <span class="jc-promoted">⭐ {{ t('Promoted', 'مميز') }}</span>
                    }
                    <header class="jc-head">
                      <span class="jc-logo">{{ j.companyLogo }}</span>
                      <div class="jc-title">
                        <div class="jc-title-row">
                          <h4>{{ t(j.title, j.titleAr) }}</h4>
                          @if (j.matchScore >= 90) {
                            <span class="jc-top-match">🎯 {{ t('Top match', 'أفضل تطابق') }}</span>
                          }
                        </div>
                        <p class="jc-company">{{ t(j.company, j.companyAr) }} · {{ t(j.location, j.locationAr) }}</p>
                        <div class="jc-meta">
                          <span class="jc-tag" [attr.data-t]="j.workType">{{ t(j.workType, workTypeAr(j.workType)) }}</span>
                          <span class="jc-tag" [attr.data-t]="j.jobType">{{ t(j.jobType, jobTypeAr(j.jobType)) }}</span>
                          <span class="jc-tag" [attr.data-t]="j.experience">{{ t(j.experience, expLevelAr(j.experience)) }}</span>
                        </div>
                      </div>
                      <button class="jc-save" [class.saved]="j.saved" (click)="$event.stopPropagation(); toggleSaveJob(j.id)" title="Save">
                        {{ j.saved ? '🔖' : '📑' }}
                      </button>
                    </header>
                    <p class="jc-desc">{{ t(j.description, j.descriptionAr) }}</p>
                    <div class="jc-skills">
                      @for (s of j.skills; track s) {
                        <span class="jc-skill">{{ s }}</span>
                      }
                    </div>
                    <footer class="jc-foot">
                      <div class="jc-foot-left">
                        <span class="jc-salary">{{ j.salaryMin | number }} - {{ j.salaryMax | number }} {{ j.currency }}</span>
                        <span class="jc-posted">🕐 {{ t(j.posted, j.postedAr) }} · 👥 {{ j.applicants }} {{ t('applicants', 'متقدم') }}</span>
                      </div>
                      <div class="jc-foot-right">
                        @if (j.applied) {
                          <span class="jc-applied">✓ {{ t('Applied', 'تم التقديم') }}</span>
                        } @else if (j.easyApply) {
                          <button class="pill primary" (click)="$event.stopPropagation(); applyJob(j.id)">⚡ {{ t('Easy Apply', 'تقديم سريع') }}</button>
                        } @else {
                          <button class="pill primary" (click)="$event.stopPropagation(); applyJob(j.id)">{{ t('Apply', 'تقديم') }}</button>
                        }
                      </div>
                    </footer>
                  </article>
                } @empty {
                  <div class="empty-state">
                    <span>🔍</span>
                    <b>{{ t('No jobs match your filters', 'لا توجد وظائف مطابقة') }}</b>
                    <small>{{ t('Try adjusting the filters', 'حاول تعديل الفلاتر') }}</small>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        @case ('applied') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Pipeline', 'المسار') }}</span>
                <h3>{{ t('My Applications', 'تقديماتي') }}</h3>
                <p>{{ applications().length }} {{ t('applications', 'تقديم') }} · {{ interviewsCount() }} {{ t('interviews', 'مقابلة') }}</p>
              </div>
            </header>

            <section class="pipeline-stats">
              @for (s of pipelineStats(); track s.label) {
                <div class="ps-card" [style.--c]="s.color">
                  <span class="ps-icon">{{ s.icon }}</span>
                  <b class="ps-val">{{ s.value }}</b>
                  <small>{{ s.label }}</small>
                </div>
              }
            </section>

            <div class="pipeline-board">
              @for (col of pipelineColumns; track col.id) {
                <div class="pb-col" [style.--c]="col.color">
                  <header class="pbc-head">
                    <span class="pbc-icon">{{ col.icon }}</span>
                    <span class="pbc-label">{{ t(col.label, col.labelAr) }}</span>
                    <span class="pbc-count">{{ appsInStage(col.id).length }}</span>
                  </header>
                  <div class="pbc-body">
                    @for (a of appsInStage(col.id); track a.id) {
                      <article class="pb-card" (click)="openApplication(a.id)" (contextmenu)="onApplicationContext($event, a)">
                        <header>
                          <span class="pbc-logo">{{ a.companyLogo }}</span>
                          <div>
                            <b>{{ t(a.jobTitle, a.jobTitleAr) }}</b>
                            <small>{{ t(a.company, a.companyAr) }}</small>
                          </div>
                        </header>
                        <div class="pbc-progress">
                          <div class="pbc-track"><div class="pbc-fill" [style.width.%]="a.stageProgress" [style.background]="col.color"></div></div>
                          <span class="pbc-pct mono">{{ a.stageProgress }}%</span>
                        </div>
                        @if (a.interviewDate) {
                          <div class="pbc-interview">📅 {{ a.interviewDate }}</div>
                        }
                        @if (a.recruiterName) {
                          <footer class="pbc-foot">
                            <span class="pbc-rec-av">{{ a.recruiterAvatar }}</span>
                            <small>{{ t(a.recruiterName, a.recruiterName) }}</small>
                          </footer>
                        }
                      </article>
                    } @empty {
                      <div class="pbc-empty">{{ t('No items', 'لا يوجد') }}</div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        @case ('saved') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Bookmarks', 'المحفوظات') }}</span>
                <h3>{{ t('Saved Jobs', 'الوظائف المحفوظة') }}</h3>
                <p>{{ savedJobs().length }} {{ t('saved jobs', 'وظيفة محفوظة') }}</p>
              </div>
            </header>

            <div class="jobs-list saved-jobs">
              @for (j of savedJobs(); track j.id) {
                <article class="job-card" (click)="openJob(j.id)" (contextmenu)="onJobContext($event, j)">
                  <header class="jc-head">
                    <span class="jc-logo">{{ j.companyLogo }}</span>
                    <div class="jc-title">
                      <h4>{{ t(j.title, j.titleAr) }}</h4>
                      <p class="jc-company">{{ t(j.company, j.companyAr) }} · {{ t(j.location, j.locationAr) }}</p>
                      <div class="jc-meta">
                        <span class="jc-tag" [attr.data-t]="j.workType">{{ t(j.workType, workTypeAr(j.workType)) }}</span>
                        <span class="jc-tag" [attr.data-t]="j.jobType">{{ t(j.jobType, jobTypeAr(j.jobType)) }}</span>
                      </div>
                    </div>
                    <button class="jc-save saved" (click)="$event.stopPropagation(); toggleSaveJob(j.id)" title="Remove">
                      🔖
                    </button>
                  </header>
                  <footer class="jc-foot">
                    <span class="jc-salary">{{ j.salaryMin | number }} - {{ j.salaryMax | number }} {{ j.currency }}</span>
                    @if (j.applied) {
                      <span class="jc-applied">✓ {{ t('Applied', 'تم التقديم') }}</span>
                    } @else {
                      <button class="pill primary" (click)="$event.stopPropagation(); applyJob(j.id)">{{ t('Apply', 'تقديم') }}</button>
                    }
                  </footer>
                </article>
              } @empty {
                <div class="empty-state">
                  <span>🔖</span>
                  <b>{{ t('No saved jobs yet', 'لا توجد وظائف محفوظة') }}</b>
                  <small>{{ t('Save jobs to view them later', 'احفظ الوظائف لعرضها لاحقاً') }}</small>
                </div>
              }
            </div>
          </div>
        }

        @case ('messages') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Inbox', 'الوارد') }}</span>
                <h3>{{ t('Messages', 'الرسائل') }}</h3>
                <p>{{ unreadMessages() }} {{ t('unread', 'غير مقروء') }} · {{ messages().length }} {{ t('total', 'إجمالي') }}</p>
              </div>
              <button class="pill primary" (click)="newMessage()">＋ {{ t('New message', 'رسالة جديدة') }}</button>
            </header>

            <div class="messages-layout">
              <aside class="msg-sidebar">
                <div class="msg-search">
                  <span>🔍</span>
                  <input placeholder="{{ t('Search messages…', 'ابحث في الرسائل…') }}" />
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
                        <small class="msg-headline">{{ t(m.fromHeadline, m.fromHeadlineAr) }}</small>
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
                      <small>{{ t(m.fromHeadline, m.fromHeadlineAr) }}</small>
                    </div>
                    <div class="mt-actions">
                      <button class="icon-btn" (click)="toast.info(t('Starred', 'تم التمييز'))">⭐</button>
                      <button class="icon-btn" (click)="toast.info(t('Archived', 'تم الأرشفة'))">📁</button>
                      <button class="icon-btn" (click)="toast.info(t('Deleted', 'تم الحذف'))">🗑</button>
                    </div>
                  </header>
                  <div class="mt-body">
                    <div class="mt-bubble incoming">{{ t(m.preview, m.previewAr) }}</div>
                    <div class="mt-bubble outgoing">Thanks for reaching out! I'd love to hear more.</div>
                    <div class="mt-bubble incoming">Great! Are you available for a call this week?</div>
                  </div>
                  <footer class="mt-composer">
                    <input placeholder="{{ t('Type a message…', 'اكتب رسالة…') }}" />
                    <button class="pill primary" (click)="sendMessage()">{{ t('Send', 'إرسال') }}</button>
                  </footer>
                } @else {
                  <div class="empty-state tall">
                    <span>💬</span>
                    <b>{{ t('Select a conversation', 'اختر محادثة') }}</b>
                    <small>{{ t('Choose a message from the list', 'اختر رسالة من القائمة') }}</small>
                  </div>
                }
              </main>
            </div>
          </div>
        }

        @case ('notifications') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Activity', 'النشاط') }}</span>
                <h3>{{ t('Notifications', 'الإشعارات') }}</h3>
                <p>{{ unreadNotifications() }} {{ t('unread', 'غير مقروء') }} · {{ notifications().length }} {{ t('total', 'إجمالي') }}</p>
              </div>
              <button class="pill" (click)="markAllRead()">✓ {{ t('Mark all read', 'تحديد الكل كمقروء') }}</button>
            </header>

            <div class="notif-filters">
              @for (f of notifFilters; track f.id) {
                <button class="nf-chip" [class.active]="notifFilter() === f.id" (click)="notifFilter.set(f.id)">
                  <span>{{ f.icon }}</span>
                  <span>{{ t(f.label, f.labelAr) }}</span>
                  <span class="nf-count">{{ countNotifsByType(f.id) }}</span>
                </button>
              }
            </div>

            <div class="notif-list">
              @for (n of filteredNotifications(); track n.id) {
                <article class="notif-item" [class.unread]="!n.read" (click)="markRead(n.id)">
                  <span class="notif-icon" [style.background]="n.color + '22'" [style.color]="n.color">{{ n.icon }}</span>
                  <div class="notif-body">
                    <div class="notif-row">
                      <b>{{ t(n.title, n.titleAr) }}</b>
                      <span class="notif-time">{{ t(n.time, n.timeAr) }}</span>
                    </div>
                    <p>{{ t(n.body, n.bodyAr) }}</p>
                  </div>
                  @if (!n.read) {
                    <span class="notif-dot"></span>
                  }
                </article>
              }
            </div>
          </div>
        }

        @case ('companies') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Discover', 'اكتشف') }}</span>
                <h3>{{ t('Companies', 'الشركات') }}</h3>
                <p>{{ companies().length }} {{ t('companies hiring now', 'شركة توظف الآن') }}</p>
              </div>
            </header>

            <div class="companies-grid">
              @for (c of companies(); track c.id) {
                <article class="company-card" [style.--c]="c.color" (click)="openCompany(c.id)">
                  <div class="co-cover" [style.background]="c.color + '22'"></div>
                  <div class="co-body">
                    <div class="co-logo-wrap">
                      <span class="co-logo">{{ c.logo }}</span>
                    </div>
                    <div class="co-name-row">
                      <h4>{{ t(c.name, c.nameAr) }}</h4>
                      @if (c.verified) { <span class="verify-badge">✓</span> }
                    </div>
                    <p class="co-industry">{{ t(c.industry, c.industryAr) }} · {{ c.size }}</p>
                    <p class="co-location">📍 {{ t(c.location, c.locationAr) }}</p>
                    <p class="co-about">{{ t(c.about, c.aboutAr) }}</p>
                    <div class="co-stats">
                      <div class="cos-item">
                        <b class="mono">{{ c.followers | number }}</b>
                        <small>{{ t('Followers', 'متابع') }}</small>
                      </div>
                      <div class="cos-item">
                        <b class="mono">{{ c.openJobs }}</b>
                        <small>{{ t('Open jobs', 'وظائف مفتوحة') }}</small>
                      </div>
                    </div>
                    <footer class="co-foot">
                      <button class="pill primary" (click)="$event.stopPropagation(); toast.success(t('Following', 'تمت المتابعة'))">+ {{ t('Follow', 'متابعة') }}</button>
                      <button class="pill" (click)="$event.stopPropagation(); active.set('jobs')">{{ t('View jobs', 'عرض الوظائف') }}</button>
                    </footer>
                  </div>
                </article>
              }
            </div>
          </div>
        }

        @case ('recruiter') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Hiring', 'التوظيف') }}</span>
                <h3>{{ t('Recruiter Dashboard', 'لوحة المسؤول') }}</h3>
                <p>{{ t('Manage candidates and open positions', 'إدارة المرشحين والوظائف المفتوحة') }}</p>
              </div>
              <button class="pill primary" (click)="toast.info(t('Post new job', 'نشر وظيفة جديدة'))">＋ {{ t('Post job', 'نشر وظيفة') }}</button>
            </header>

            <section class="recruiter-kpis">
              @for (k of recruiterKpis(); track k.label) {
                <div class="rk-card" [style.--c]="k.color">
                  <span class="rk-icon">{{ k.icon }}</span>
                  <b class="rk-val">{{ k.value }}</b>
                  <small>{{ k.label }}</small>
                  <div class="rk-trend" [class.up]="k.trendUp">
                    {{ k.trendUp ? '▲' : '▼' }} {{ k.trend }}
                  </div>
                </div>
              }
            </section>

            <div class="recruiter-layout">
              <section class="card">
                <header class="card-head">
                  <div>
                    <h3>{{ t('Top candidates', 'أفضل المرشحين') }}</h3>
                    <small>{{ t('Matched to your open roles', 'مطابقين لوظائفك') }}</small>
                  </div>
                </header>
                <ul class="candidates-list">
                  @for (c of recruiterCandidates(); track c.id) {
                    <li class="cand-row" (click)="openCandidate(c.id)">
                      <span class="cand-avatar">{{ c.avatar }}</span>
                      <div class="cand-body">
                        <div class="cand-name-row">
                          <b>{{ t(c.name, c.nameAr) }}</b>
                          <span class="cand-match" [class.high]="c.matchScore >= 90">{{ c.matchScore }}%</span>
                        </div>
                        <small>{{ t(c.headline, c.headlineAr) }}</small>
                        <div class="cand-skills">
                          @for (s of c.skills.slice(0, 3); track s) {
                            <span class="cand-skill">{{ s }}</span>
                          }
                        </div>
                      </div>
                      <div class="cand-actions">
                        <button class="pill-sm primary" (click)="$event.stopPropagation(); toast.success(t('Message sent', 'تم إرسال الرسالة'))">{{ t('Message', 'رسالة') }}</button>
                        <button class="pill-sm" (click)="$event.stopPropagation(); toast.info(t('Saved', 'تم الحفظ'))">{{ t('Save', 'حفظ') }}</button>
                      </div>
                    </li>
                  }
                </ul>
              </section>

              <section class="card">
                <header class="card-head">
                  <div>
                    <h3>{{ t('Open positions', 'الوظائف المفتوحة') }}</h3>
                    <small>{{ t('Your active job posts', 'منشوراتك النشطة') }}</small>
                  </div>
                </header>
                <ul class="open-positions">
                  @for (j of jobs().slice(0, 5); track j.id) {
                    <li class="op-row" (click)="openJob(j.id)">
                      <span class="op-logo">{{ j.companyLogo }}</span>
                      <div>
                        <b>{{ t(j.title, j.titleAr) }}</b>
                        <small>{{ j.applicants }} {{ t('applicants', 'متقدم') }} · {{ t(j.posted, j.postedAr) }}</small>
                      </div>
                      <span class="op-status">{{ t('Active', 'نشط') }}</span>
                    </li>
                  }
                </ul>
              </section>
            </div>

            <section class="card">
              <header class="card-head">
                <div>
                  <h3>{{ t('Application pipeline', 'مسار التقديمات') }}</h3>
                  <small>{{ t('Candidates across stages', 'المرشحون في كل مرحلة') }}</small>
                </div>
              </header>
              <div class="rec-pipeline">
                @for (col of pipelineColumns; track col.id) {
                  <div class="rp-col" [style.--c]="col.color">
                    <header>
                      <span>{{ col.icon }}</span>
                      <b>{{ t(col.label, col.labelAr) }}</b>
                      <span class="rp-count">{{ appsInStage(col.id).length }}</span>
                    </header>
                    <div class="rp-body">
                      @for (a of appsInStage(col.id); track a.id) {
                        <div class="rp-item" (click)="openApplication(a.id)">
                          <b>{{ t(a.jobTitle, a.jobTitleAr) }}</b>
                          <small>{{ t(a.company, a.companyAr) }}</small>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </section>
          </div>
        }

        @case ('analytics') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Insights', 'الرؤى') }}</span>
                <h3>{{ t('Analytics', 'التحليلات') }}</h3>
                <p>{{ t('Your job search performance', 'أداء البحث عن عمل') }}</p>
              </div>
            </header>

            <section class="analytics-kpis">
              @for (k of analyticsKpis(); track k.label) {
                <div class="ak-card" [style.--c]="k.color">
                  <span class="ak-icon">{{ k.icon }}</span>
                  <b class="ak-val">{{ k.value }}</b>
                  <small>{{ k.label }}</small>
                  <div class="ak-trend" [class.up]="k.trendUp">
                    {{ k.trendUp ? '▲' : '▼' }} {{ k.trend }}
                  </div>
                </div>
              }
            </section>

            <div class="grid-2">
              <section class="card">
                <header class="card-head">
                  <h3>{{ t('Profile views', 'مشاهدات الملف') }}</h3>
                  <small>{{ t('Last 30 days', 'آخر 30 يوم') }}</small>
                </header>
                <div class="bar-chart">
                  @for (v of profileViewsData; track $index) {
                    <div class="bc-col">
                      <div class="bc-bar" [style.height.%]="v" [title]="v + ' views'"></div>
                    </div>
                  }
                </div>
                <div class="chart-axis">
                  <span>30d ago</span>
                  <span>Now</span>
                </div>
              </section>

              <section class="card">
                <header class="card-head">
                  <h3>{{ t('Applications by stage', 'التقديمات حسب المرحلة') }}</h3>
                </header>
                <ul class="stage-breakdown">
                  @for (s of stageBreakdown(); track s.label) {
                    <li class="sb-row">
                      <span class="sb-dot" [style.background]="s.color"></span>
                      <span class="sb-label">{{ t(s.label, s.labelAr) }}</span>
                      <div class="sb-track"><div class="sb-fill" [style.width.%]="s.pct" [style.background]="s.color"></div></div>
                      <span class="sb-count mono">{{ s.count }}</span>
                    </li>
                  }
                </ul>
              </section>
            </div>

            <section class="card">
              <header class="card-head">
                <h3>{{ t('Top skills demanded', 'أعلى المهارات المطلوبة') }}</h3>
              </header>
              <div class="skills-demand">
                @for (s of topSkills(); track s.name) {
                  <div class="sd-row">
                    <span class="sd-icon">{{ s.icon }}</span>
                    <span class="sd-name">{{ s.name }}</span>
                    <div class="sd-track"><div class="sd-fill" [style.width.%]="s.pct" [style.background]="s.color"></div></div>
                    <span class="sd-pct mono">{{ s.pct }}%</span>
                  </div>
                }
              </div>
            </section>
          </div>
        }

        @case ('settings') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Preferences', 'التفضيلات') }}</span>
                <h3>{{ t('Settings', 'الإعدادات') }}</h3>
                <p>{{ t('Profile, privacy, and notifications', 'الملف والخصوصية والإشعارات') }}</p>
              </div>
              <button class="pill primary" (click)="saveSettings()">💾 {{ t('Save', 'حفظ') }}</button>
            </header>

            <section class="card">
              <header class="card-head"><h3>{{ t('Profile visibility', 'ظهور الملف') }}</h3></header>
              <div class="settings-list">
                @for (s of visibilitySettings; track s.key) {
                  <div class="setting-row">
                    <div>
                      <b>{{ t(s.label, s.labelAr) }}</b>
                      <small>{{ t(s.desc, s.descAr) }}</small>
                    </div>
                    @if (s.type === 'toggle') {
                      <button class="toggle" [class.on]="settingValue(s.key)" (click)="toggleSetting(s.key)">
                        <span class="knob"></span>
                      </button>
                    } @else {
                      <input class="input-sm" [value]="settingValue(s.key)" (input)="updateSetting(s.key, $any($event.target).value)" />
                    }
                  </div>
                }
              </div>
            </section>

            <section class="card">
              <header class="card-head"><h3>{{ t('Job preferences', 'تفضيلات العمل') }}</h3></header>
              <div class="settings-list">
                @for (s of jobPreferenceSettings; track s.key) {
                  <div class="setting-row">
                    <div>
                      <b>{{ t(s.label, s.labelAr) }}</b>
                      <small>{{ t(s.desc, s.descAr) }}</small>
                    </div>
                    @if (s.type === 'toggle') {
                      <button class="toggle" [class.on]="settingValue(s.key)" (click)="toggleSetting(s.key)">
                        <span class="knob"></span>
                      </button>
                    } @else {
                      <input class="input-sm" [value]="settingValue(s.key)" (input)="updateSetting(s.key, $any($event.target).value)" />
                    }
                  </div>
                }
              </div>
            </section>

            <section class="card">
              <header class="card-head"><h3>{{ t('Notifications', 'الإشعارات') }}</h3></header>
              <div class="settings-list">
                @for (s of notificationSettings; track s.key) {
                  <div class="setting-row">
                    <div>
                      <b>{{ t(s.label, s.labelAr) }}</b>
                      <small>{{ t(s.desc, s.descAr) }}</small>
                    </div>
                    <button class="toggle" [class.on]="settingValue(s.key)" (click)="toggleSetting(s.key)">
                      <span class="knob"></span>
                    </button>
                  </div>
                }
              </div>
            </section>

            <section class="card danger-zone">
              <header class="card-head">
                <h3>⚠️ {{ t('Account actions', 'إجراءات الحساب') }}</h3>
              </header>
              <div class="dz-actions">
                <button class="pill danger" (click)="toast.warning(t('Deactivated', 'تم التعطيل'))">{{ t('Deactivate account', 'تعطيل الحساب') }}</button>
                <button class="pill danger" (click)="toast.warning(t('Exported', 'تم التصدير'))">{{ t('Export my data', 'تصدير بياناتي') }}</button>
              </div>
            </section>
          </div>
        }
      }

      @if (selectedJob(); as j) {
        <div class="modal-backdrop" (click)="selectedJob.set(null)">
          <div class="modal job-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon">{{ j.companyLogo }}</span>
              <div>
                <h3>{{ t(j.title, j.titleAr) }}</h3>
                <p>{{ t(j.company, j.companyAr) }} · {{ t(j.location, j.locationAr) }}</p>
              </div>
              <button class="modal-close" (click)="selectedJob.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="jm-tags">
                <span class="jc-tag" [attr.data-t]="j.workType">{{ t(j.workType, workTypeAr(j.workType)) }}</span>
                <span class="jc-tag" [attr.data-t]="j.jobType">{{ t(j.jobType, jobTypeAr(j.jobType)) }}</span>
                <span class="jc-tag" [attr.data-t]="j.experience">{{ t(j.experience, expLevelAr(j.experience)) }}</span>
                @if (j.promoted) { <span class="jc-tag promoted">⭐ {{ t('Promoted', 'مميز') }}</span> }
              </div>

              <div class="jm-hero">
                <div><small>{{ t('Salary', 'الراتب') }}</small><b class="mono">{{ j.salaryMin | number }} - {{ j.salaryMax | number }} {{ j.currency }}</b></div>
                <div><small>{{ t('Applicants', 'متقدمون') }}</small><b class="mono">{{ j.applicants }}</b></div>
                <div><small>{{ t('Match', 'تطابق') }}</small><b class="mono accent">{{ j.matchScore }}%</b></div>
              </div>

              <div class="jm-section">
                <span class="om-label">{{ t('Description', 'الوصف') }}</span>
                <p>{{ t(j.description, j.descriptionAr) }}</p>
              </div>

              <div class="jm-section">
                <span class="om-label">{{ t('Required skills', 'المهارات المطلوبة') }}</span>
                <div class="jm-skills">
                  @for (s of j.skills; track s) {
                    <span class="jc-skill">{{ s }}</span>
                  }
                </div>
              </div>
            </div>
            <footer class="modal-foot">
              <button class="pill" (click)="toggleSaveJob(j.id)">{{ j.saved ? '🔖 ' + t('Saved', 'محفوظة') : '📑 ' + t('Save', 'حفظ') }}</button>
              @if (j.applied) {
                <span class="mf-done">✓ {{ t('Applied', 'تم التقديم') }}</span>
              } @else {
                <button class="pill primary" (click)="applyJob(j.id); selectedJob.set(null)">
                  {{ j.easyApply ? '⚡ ' + t('Easy Apply', 'تقديم سريع') : t('Apply now', 'قدم الآن') }}
                </button>
              }
            </footer>
          </div>
        </div>
      }

      @if (selectedApplication(); as a) {
        <div class="modal-backdrop" (click)="selectedApplication.set(null)">
          <div class="modal app-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon">{{ a.companyLogo }}</span>
              <div>
                <h3>{{ t(a.jobTitle, a.jobTitleAr) }}</h3>
                <p>{{ t(a.company, a.companyAr) }} · {{ t(a.stage, appStageAr(a.stage)) }}</p>
              </div>
              <button class="modal-close" (click)="selectedApplication.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="am-progress">
                <div class="am-steps">
                  @for (s of pipelineColumns; track s.id) {
                    <div class="ams-step" [class.done]="isStageComplete(a.stage, s.id)" [class.current]="a.stage === s.id">
                      <span class="ams-dot" [style.background]="isStageComplete(a.stage, s.id) ? s.color : 'var(--bg-fill-3)'"></span>
                      <span class="ams-label">{{ t(s.label, s.labelAr) }}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="am-grid">
                <div class="am-block"><span class="om-label">{{ t('Applied', 'تم التقديم') }}</span><b class="mono">{{ a.appliedAt }}</b></div>
                @if (a.interviewDate) {
                  <div class="am-block"><span class="om-label">{{ t('Interview', 'المقابلة') }}</span><b>📅 {{ a.interviewDate }}</b></div>
                }
                @if (a.recruiterName) {
                  <div class="am-block"><span class="om-label">{{ t('Recruiter', 'المسؤول') }}</span><b>{{ a.recruiterAvatar }} {{ a.recruiterName }}</b></div>
                }
              </div>

              @if (a.notes) {
                <div class="am-block full">
                  <span class="om-label">{{ t('Notes', 'ملاحظات') }}</span>
                  <p>{{ a.notes }}</p>
                </div>
              }
            </div>
            <footer class="modal-foot">
              <button class="pill" (click)="toast.info(t('Withdrawn', 'تم السحب'))">{{ t('Withdraw', 'سحب الطلب') }}</button>
              <button class="pill primary" (click)="selectedApplication.set(null)">{{ t('Close', 'إغلاق') }}</button>
            </footer>
          </div>
        </div>
      }

      @if (selectedCandidate(); as c) {
        <div class="modal-backdrop" (click)="selectedCandidate.set(null)">
          <div class="modal cand-modal" (click)="$event.stopPropagation()">
            <header class="modal-head">
              <span class="modal-icon">{{ c.avatar }}</span>
              <div>
                <h3>{{ t(c.name, c.nameAr) }}</h3>
                <p>{{ t(c.headline, c.headlineAr) }}</p>
              </div>
              <button class="modal-close" (click)="selectedCandidate.set(null)">✕</button>
            </header>
            <div class="modal-body">
              <div class="cm-hero">
                <div><small>{{ t('Experience', 'الخبرة') }}</small><b>{{ c.experience }}y</b></div>
                <div><small>{{ t('Match', 'تطابق') }}</small><b class="accent">{{ c.matchScore }}%</b></div>
                <div><small>{{ t('Expected', 'متوقع') }}</small><b class="mono">{{ c.salaryExpectation }}</b></div>
              </div>
              <div class="cm-section">
                <span class="om-label">{{ t('Skills', 'المهارات') }}</span>
                <div class="cm-chips">
                  @for (s of c.skills; track s) {
                    <span class="cm-chip">{{ s }}</span>
                  }
                </div>
              </div>
            </div>
            <footer class="modal-foot">
              <button class="pill" (click)="selectedCandidate.set(null)">{{ t('Close', 'إغلاق') }}</button>
              <button class="pill primary" (click)="toast.success(t('Message sent', 'تم إرسال الرسالة')); selectedCandidate.set(null)">{{ t('Message', 'رسالة') }}</button>
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
    .accent { color: #0a66c2; }
    .link { color: #0a66c2; cursor: pointer; }
    .link:hover { text-decoration: underline; }

    .af-bar {
      display: flex; align-items: center; gap: 14px; padding: 12px 16px;
      background: linear-gradient(135deg, rgba(10, 102, 194, 0.06) 0%, rgba(0, 119, 181, 0.04) 100%);
      border: 0.5px solid var(--separator); border-radius: var(--r-md); flex-wrap: wrap;
    }
    .lang-switch { display: flex; gap: 2px; padding: 3px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .ls-btn { padding: 5px 12px; border-radius: calc(var(--r-sm) - 4px); font-size: 11px; font-weight: 700; color: var(--label-2); background: transparent; border: 0; cursor: pointer; }
    .ls-btn.active { background: var(--bg-surface-solid); color: var(--label); box-shadow: var(--shadow-xs); }
    .mode-pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-size: 11px; font-weight: 700; color: #0077b5; }
    .mode-pill.recruiter { color: #ff9500; }
    .mp-dot { width: 8px; height: 8px; background: currentColor; border-radius: 50%; }
    .otw-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(52, 199, 89, 0.12); border-radius: var(--r-pill); font-size: 11px; font-weight: 700; color: #34c759; }
    .otw-pill span:first-child { font-size: 13px; }
    .quick-stats { display: flex; gap: 8px; font-size: 11px; color: var(--label-2); margin-left: auto; }
    .quick-stats b { color: #0077b5; font-weight: 800; font-family: var(--sf-mono); }
    .qs-sep { color: var(--label-4); }

    .view-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
    .view-head h3 { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.025em; }
    .view-head p { font-size: var(--fs-sm); color: var(--label-2); margin-top: 4px; }
    .eyebrow { display: block; font-size: var(--fs-2xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #0077b5; margin-bottom: 6px; }
    .view-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

    .pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: var(--bg-fill-2); color: var(--label); border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 700; border: 0; cursor: pointer; transition: all 140ms; }
    .pill:hover { background: var(--bg-fill-3); }
    .pill:disabled { opacity: 0.5; cursor: not-allowed; }
    .pill.primary { background: #0a66c2; color: #fff; }
    .pill.primary:hover { background: #004182; }
    .pill.danger { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .pill.full { width: 100%; justify-content: center; }
    .pill-sm { padding: 6px 12px; background: var(--bg-fill-2); color: var(--label); border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 700; border: 0; cursor: pointer; }
    .pill-sm.primary { background: #0a66c2; color: #fff; }
    .sel { padding: 7px 12px; background: var(--bg-input); color: var(--label); border: 0.5px solid var(--separator); border-radius: var(--r-sm); font-size: var(--fs-xs); cursor: pointer; outline: none; font-family: inherit; }
    .input-sm { padding: 6px 10px; background: var(--bg-input); color: var(--label); border: 0.5px solid var(--separator); border-radius: var(--r-xs); font-size: var(--fs-xs); outline: none; font-family: inherit; min-width: 100px; }

    .card { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 14px; }
    .card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .card-head h3 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .card-head small { font-size: var(--fs-2xs); color: var(--label-2); display: block; margin-top: 2px; }
    .edit-btn { width: 28px; height: 28px; display: grid; place-items: center; border-radius: var(--r-xs); background: transparent; border: 0; color: var(--label-3); cursor: pointer; font-size: 13px; }
    .edit-btn:hover { background: var(--bg-hover); color: var(--label); }
    .card.danger-zone { border-left: 3px solid #ff3b30; }

    .feed-view { display: grid; grid-template-columns: 260px 1fr 300px; gap: 20px; align-items: flex-start; }
    @media (max-width: 1100px) { .feed-view { grid-template-columns: 260px 1fr; } .feed-right { display: none; } }
    @media (max-width: 800px) { .feed-view { grid-template-columns: 1fr; } .feed-left { display: none; } }

    .feed-left, .feed-right { display: flex; flex-direction: column; gap: 14px; top: 12px; }
    .feed-main { display: flex; flex-direction: column; gap: 12px; }

    @media (min-width: 767px) {
      .feed-left, .feed-right {
        position: sticky;
      }
    }

    @media(max-width:767px) {
      .feedt-left, .feed-right { position: relative !important; }
    }

    @media(max-width:720px) {
      .feedt-left, .feed-right { position: relative !important; }
    }

    .profile-card { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; }
    .pc-cover { height: 60px; position: relative; }
    .pc-premium { position: absolute; top: 8px; right: 8px; padding: 3px 8px; background: rgba(255, 204, 0, 0.95); color: #1a1a1a; border-radius: var(--r-pill); font-size: 9px; font-weight: 800; }
    .pc-avatar-wrap { position: relative; margin-top: -36px; padding-left: 16px; }
    .pc-avatar { width: 72px; height: 72px; display: grid; place-items: center; background: var(--bg-surface-solid); border: 3px solid var(--bg-surface-solid); border-radius: 50%; font-size: 32px; box-shadow: var(--shadow-sm); }
    .pc-body { padding: 10px 16px 16px; display: flex; flex-direction: column; gap: 6px; }
    .pc-name-row { display: flex; align-items: center; gap: 6px; }
    .pc-name-row h3 { font-size: var(--fs-sm); font-weight: 700; }
    .verify-badge { width: 14px; height: 14px; display: grid; place-items: center; background: #0077b5; color: #fff; border-radius: 50%; font-size: 9px; font-weight: 800; flex-shrink: 0; }
    .pc-headline { font-size: var(--fs-2xs); color: var(--label-2); line-height: 1.4; }
    .pc-location { font-size: 10px; color: var(--label-3); }
    .pc-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 10px 0; border-top: 0.5px solid var(--separator); border-bottom: 0.5px solid var(--separator); margin: 6px 0; }
    .pcs-item { text-align: center; }
    .pcs-item b { font-size: var(--fs-sm); font-weight: 800; color: #0a66c2; display: block; font-variant-numeric: tabular-nums; }
    .pcs-item small { font-size: 9px; color: var(--label-3); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; }
    .pc-cta { padding: 8px 12px; background: var(--bg-fill-2); border: 0; border-radius: var(--r-sm); font-size: var(--fs-2xs); font-weight: 700; color: var(--label); cursor: pointer; transition: all 140ms; }
    .pc-cta:hover { background: rgba(10, 102, 194, 0.1); color: #0a66c2; }

    .mini-card { padding: 14px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 10px; }
    .mini-card > header { display: flex; justify-content: space-between; align-items: center; }
    .mini-card > header b { font-size: var(--fs-2xs); font-weight: 700; }
    .link-btn { background: transparent; border: 0; color: #0a66c2; font-size: 10px; font-weight: 700; cursor: pointer; }
    .link-btn:hover { text-decoration: underline; }
    .an-list { display: flex; flex-direction: column; gap: 8px; }
    .an-row { display: grid; grid-template-columns: 24px 1fr; gap: 10px; align-items: center; }
    .an-icon { font-size: 16px; text-align: center; }
    .an-row b { font-size: var(--fs-xs); font-weight: 800; color: #0a66c2; display: block; }
    .an-row small { font-size: 9px; color: var(--label-2); }
    .mini-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .mini-list li { display: grid; grid-template-columns: 32px 1fr; gap: 10px; align-items: start; cursor: pointer; transition: all 140ms; padding: 4px; border-radius: var(--r-xs); }
    .mini-list li:hover { background: var(--bg-hover); }
    .mini-logo { width: 32px; height: 32px; display: grid; place-items: center; background: var(--bg-fill-2); border-radius: var(--r-xs); font-size: 16px; }
    .mini-list b { font-size: var(--fs-2xs); font-weight: 700; display: block; line-height: 1.3; }
    .mini-list small { font-size: 9px; color: var(--label-2); display: block; margin-top: 2px; line-height: 1.3; }
    .match-chip { display: inline-block; margin-top: 3px; padding: 1px 6px; background: rgba(10, 102, 194, 0.12); color: #0a66c2; border-radius: var(--r-pill); font-size: 8px; font-weight: 800; }

    .conn-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .conn-list li { display: grid; grid-template-columns: 40px 1fr auto; gap: 10px; align-items: center; }
    .conn-avatar { width: 40px; height: 40px; display: grid; place-items: center; background: var(--bg-fill-2); border-radius: 50%; font-size: 18px; }
    .conn-list b { font-size: var(--fs-2xs); font-weight: 700; display: block; }
    .conn-list small { font-size: 9px; color: var(--label-2); display: block; line-height: 1.3; margin-top: 2px; }
    .conn-mutual { font-size: 9px; color: var(--label-3); display: block; margin-top: 2px; }
    .conn-btn { width: 28px; height: 28px; display: grid; place-items: center; background: transparent; border: 1.5px solid #0a66c2; color: #0a66c2; border-radius: 50%; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 140ms; }
    .conn-btn:hover { background: #0a66c2; color: #fff; }

    .trending-card { background: linear-gradient(135deg, rgba(255, 149, 0, 0.06), rgba(255, 59, 48, 0.04)); }
    .trending-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .trending-list li { display: grid; grid-template-columns: 24px 1fr; gap: 10px; align-items: start; }
    .tr-rank { font-size: var(--fs-sm); font-weight: 800; color: #ff9500; font-family: var(--sf-mono); }
    .trending-list b { font-size: var(--fs-2xs); font-weight: 700; display: block; }
    .trending-list small { font-size: 9px; color: var(--label-2); }

    .composer { padding: 14px 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 12px; }
    .cmp-avatar { display: none; }
    .cmp-input { padding: 12px 16px; background: var(--bg-fill-2); border: 1px solid var(--separator); border-radius: var(--r-pill); font-size: var(--fs-sm); color: var(--label-2); text-align: left; cursor: pointer; transition: all 140ms; }
    .cmp-input:hover { background: var(--bg-fill-3); border-color: #0a66c2; }
    .cmp-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .cmp-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: transparent; border: 0; border-radius: var(--r-sm); font-size: var(--fs-2xs); font-weight: 700; color: var(--label-2); cursor: pointer; }
    .cmp-btn:hover { background: var(--bg-hover); color: var(--label); }
    .cmp-btn span { font-size: 14px; }

    .filter-bar-feed { display: flex; align-items: center; gap: 12px; }
    .fb-line { flex: 1; height: 1px; background: var(--separator); }
    .fb-tabs { display: flex; gap: 4px; padding: 3px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .fb-tab { padding: 6px 12px; border-radius: calc(var(--r-sm) - 4px); font-size: var(--fs-2xs); font-weight: 600; color: var(--label-2); background: transparent; border: 0; cursor: pointer; }
    .fb-tab.active { background: var(--bg-surface-solid); color: var(--label); box-shadow: var(--shadow-xs); }

    .post-card { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 10px; }
    .post-head { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: flex-start; }
    .post-avatar { width: 44px; height: 44px; display: grid; place-items: center; background: var(--bg-fill-2); border-radius: 50%; font-size: 20px; }
    .post-author b { font-size: var(--fs-xs); font-weight: 700; }
    .pa-row { display: flex; align-items: center; gap: 6px; }
    .pa-badge { font-size: 12px; }
    .post-author small { font-size: 10px; color: var(--label-2); display: block; margin-top: 2px; }
    .post-time { font-size: 9px; color: var(--label-3); display: block; margin-top: 3px; }
    .post-menu { background: transparent; border: 0; color: var(--label-3); cursor: pointer; font-size: 16px; padding: 4px; }
    .post-menu:hover { color: var(--label); }
    .post-tag { padding: 3px 10px; border-radius: var(--r-pill); font-size: 10px; font-weight: 700; width: fit-content; }
    .job-tag { background: rgba(10, 102, 194, 0.12); color: #0a66c2; }
    .article-tag { background: rgba(255, 149, 0, 0.12); color: #ff9500; }
    .achievement-tag { background: rgba(52, 199, 89, 0.12); color: #34c759; }
    .post-content { font-size: var(--fs-sm); line-height: 1.6; color: var(--label); white-space: pre-wrap; }
    .post-image { padding: 40px; background: var(--bg-fill-2); border-radius: var(--r-sm); text-align: center; font-size: 48px; }
    .post-hashtags { display: flex; flex-wrap: wrap; gap: 6px; }
    .hashtag { font-size: var(--fs-2xs); color: #0a66c2; font-weight: 600; }
    .post-stats { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 0.5px solid var(--separator); font-size: 10px; color: var(--label-2); }
    .ps-likes { color: #0a66c2; font-weight: 700; }
    .post-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding-top: 4px; }
    .pa-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border-radius: var(--r-sm); border: 0; background: transparent; font-size: var(--fs-2xs); font-weight: 700; color: var(--label-2); cursor: pointer; transition: all 140ms; }
    .pa-btn:hover { background: var(--bg-hover); color: var(--label); }
    .pa-btn.liked { color: #0a66c2; background: rgba(10, 102, 194, 0.06); }
    .pa-btn span:first-child { font-size: 14px; }

    .profile-hero { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; }
    .ph-cover { height: 180px; }
    .ph-body { padding: 0 24px 24px; position: relative; }
    .ph-avatar-wrap { margin-top: -72px; margin-bottom: 12px; }
    .ph-avatar { width: 144px; height: 144px; display: grid; place-items: center; background: var(--bg-surface-solid); border: 4px solid var(--bg-surface-solid); border-radius: 50%; font-size: 64px; box-shadow: var(--shadow-md); }
    .ph-info h2 { font-size: var(--fs-3xl); font-weight: 800; letter-spacing: -0.03em; display: flex; align-items: center; gap: 8px; }
    .ph-info .verify-badge { width: 22px; height: 22px; font-size: 12px; }
    .ph-headline { font-size: var(--fs-base); color: var(--label); margin-top: 6px; }
    .ph-meta { font-size: var(--fs-xs); color: var(--label-2); margin-top: 8px; }
    .ph-connections { font-size: var(--fs-xs); margin-top: 4px; }
    .ph-actions { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }

    .profile-layout { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: flex-start; }
    @media (max-width: 900px) { .profile-layout { grid-template-columns: 1fr; } }
    .profile-main, .profile-side { display: flex; flex-direction: column; gap: 14px; }
    .about-text { font-size: var(--fs-sm); line-height: 1.7; color: var(--label); white-space: pre-wrap; }
    .exp-list, .edu-list, .cert-list, .skills-list, .lang-list { list-style: none; display: flex; flex-direction: column; gap: 16px; }
    .exp-item, .edu-item { display: grid; grid-template-columns: 48px 1fr; gap: 14px; align-items: start; }
    .exp-logo, .edu-logo { width: 48px; height: 48px; display: grid; place-items: center; background: var(--bg-fill-2); border-radius: var(--r-sm); font-size: 22px; }
    .exp-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .exp-head b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .exp-company { font-size: var(--fs-xs); color: var(--label); display: block; margin-top: 2px; }
    .exp-dates, .exp-loc { font-size: 10px; color: var(--label-3); margin-top: 3px; }
    .exp-desc { font-size: var(--fs-xs); line-height: 1.6; color: var(--label-2); margin-top: 8px; }
    .exp-skills { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
    .exp-skill { font-size: 10px; padding: 3px 9px; background: var(--bg-fill-2); border-radius: var(--r-pill); color: var(--label-2); }
    .edu-item b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .edu-item p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 3px; }
    .edu-dates { font-size: 10px; color: var(--label-3); }

    .skill-row { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; padding: 10px; border-radius: var(--r-sm); cursor: pointer; transition: all 140ms; }
    .skill-row:hover { background: var(--bg-hover); }
    .skill-row b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .skill-row small { font-size: 10px; color: var(--label-2); }
    .endorse-btn { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; border: 1.5px solid var(--separator); background: transparent; color: var(--label-3); font-size: 14px; font-weight: 800; cursor: pointer; transition: all 140ms; }
    .endorse-btn.on { background: #0a66c2; border-color: #0a66c2; color: #fff; }
    .cert-list li { display: grid; grid-template-columns: 32px 1fr; gap: 12px; align-items: start; }
    .cert-icon { font-size: 22px; }
    .cert-list b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .cert-list small { font-size: 10px; color: var(--label-2); }
    .lang-list li { display: flex; align-items: center; gap: 10px; font-size: var(--fs-xs); }
    .lang-icon { font-size: 16px; }

    .perf-list { display: flex; flex-direction: column; gap: 12px; }
    .perf-row { display: grid; grid-template-columns: 32px 1fr; gap: 12px; align-items: center; }
    .perf-icon { font-size: 22px; text-align: center; }
    .perf-row b { font-size: var(--fs-base); font-weight: 800; color: #0a66c2; display: block; }
    .perf-row small { font-size: 10px; color: var(--label-2); }

    .network-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .nt-chip { padding: 8px 14px; border-radius: var(--r-pill); background: var(--bg-fill-2); color: var(--label-2); font-size: var(--fs-2xs); font-weight: 600; border: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 140ms; }
    .nt-chip.active { background: #0a66c2; color: #fff; }
    .nt-count { background: rgba(255, 255, 255, 0.2); padding: 1px 6px; border-radius: var(--r-pill); font-size: 9px; font-weight: 700; }

    .inv-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
    .inv-row { display: grid; grid-template-columns: 56px 1fr auto; gap: 16px; align-items: center; padding: 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .inv-avatar { width: 56px; height: 56px; display: grid; place-items: center; background: var(--bg-surface-solid); border-radius: 50%; font-size: 26px; }
    .inv-body b { font-size: var(--fs-sm); font-weight: 700; }
    .inv-body small { font-size: var(--fs-2xs); color: var(--label-2); display: block; margin-top: 2px; }
    .inv-mutual { font-size: 10px; color: var(--label-3); display: block; margin-top: 4px; }
    .inv-actions { display: flex; gap: 6px; }

    .connections-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
    .conn-card { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
    .conn-card[data-s='pending-received'] { border-left: 3px solid #ff9500; }
    .conn-card[data-s='connected'] { border-left: 3px solid #34c759; }
    .cc-avatar { width: 64px; height: 64px; display: grid; place-items: center; background: var(--bg-fill-2); border-radius: 50%; font-size: 28px; }
    .conn-card b { font-size: var(--fs-sm); font-weight: 700; }
    .cc-headline { font-size: var(--fs-2xs); color: var(--label-2); line-height: 1.4; }
    .cc-mutual { font-size: 10px; color: var(--label-3); }
    .cc-foot { width: 100%; margin-top: 8px; padding-top: 12px; border-top: 0.5px solid var(--separator); }
    .cc-foot .pill { width: 100%; justify-content: center; }

    .jobs-layout { display: grid; grid-template-columns: 260px 1fr; gap: 20px; align-items: flex-start; }
    @media (max-width: 900px) { .jobs-layout { grid-template-columns: 1fr; } .jobs-filters { position: static; } }
    .jobs-filters { position: sticky; top: 12px; padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 18px; }
    .jf-group { display: flex; flex-direction: column; gap: 8px; }
    .jf-group h4 { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-3); }
    .jf-check { display: flex; align-items: center; gap: 8px; font-size: var(--fs-xs); color: var(--label); cursor: pointer; }
    .jf-check input { accent-color: #0a66c2; }
    .salary-range { display: flex; align-items: center; gap: 6px; }
    .salary-range span { color: var(--label-3); font-size: 11px; }

    .jobs-list { display: flex; flex-direction: column; gap: 14px; }
    .job-card { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 12px; cursor: pointer; transition: all 180ms; position: relative; }
    .job-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: #0a66c2; }
    .job-card.promoted { border-top: 3px solid #ffcc00; }
    .jc-promoted { position: absolute; top: -1px; right: 16px; padding: 3px 10px; background: #ffcc00; color: #1a1a1a; border-radius: 0 0 6px 6px; font-size: 9px; font-weight: 800; }
    .jc-head { display: grid; grid-template-columns: 52px 1fr auto; gap: 14px; align-items: flex-start; }
    .jc-logo { width: 52px; height: 52px; display: grid; place-items: center; background: var(--bg-fill-2); border-radius: var(--r-sm); font-size: 26px; }
    .jc-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .jc-title h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .jc-top-match { padding: 2px 8px; background: rgba(52, 199, 89, 0.15); color: #34c759; border-radius: var(--r-pill); font-size: 9px; font-weight: 800; }
    .jc-company { font-size: var(--fs-xs); color: var(--label-2); margin-top: 3px; }
    .jc-meta { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
    .jc-tag { padding: 3px 10px; border-radius: var(--r-pill); font-size: 10px; font-weight: 700; text-transform: capitalize; }
    .jc-tag[data-t='remote'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .jc-tag[data-t='hybrid'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .jc-tag[data-t='onsite'] { background: var(--bg-fill-2); color: var(--label-2); }
    .jc-tag[data-t='full-time'] { background: rgba(10, 102, 194, 0.12); color: #0a66c2; }
    .jc-tag[data-t='part-time'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .jc-tag[data-t='contract'] { background: rgba(175, 82, 222, 0.15); color: #af52de; }
    .jc-tag[data-t='internship'] { background: var(--bg-fill-3); color: var(--label-2); }
    .jc-tag[data-t='entry'] { background: var(--bg-fill-3); color: var(--label-2); }
    .jc-tag[data-t='mid'] { background: rgba(10, 102, 194, 0.12); color: #0a66c2; }
    .jc-tag[data-t='senior'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .jc-tag[data-t='lead'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .jc-tag.promoted { background: #ffcc00; color: #1a1a1a; }
    .jc-save { width: 36px; height: 36px; display: grid; place-items: center; background: transparent; border: 1px solid var(--separator); border-radius: var(--r-sm); font-size: 16px; cursor: pointer; transition: all 140ms; }
    .jc-save:hover { background: var(--bg-hover); }
    .jc-save.saved { background: rgba(255, 204, 0, 0.15); border-color: #ffcc00; }
    .jc-desc { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .jc-skills { display: flex; flex-wrap: wrap; gap: 4px; }
    .jc-skill { font-size: 10px; padding: 3px 9px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-family: var(--sf-mono); color: var(--label-2); }
    .jc-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 0.5px solid var(--separator); flex-wrap: wrap; gap: 12px; }
    .jc-foot-left { display: flex; flex-direction: column; gap: 3px; }
    .jc-salary { font-size: var(--fs-sm); font-weight: 800; color: #34c759; font-family: var(--sf-mono); }
    .jc-posted { font-size: 10px; color: var(--label-3); }
    .jc-foot-right { display: flex; align-items: center; gap: 8px; }
    .jc-applied { padding: 6px 12px; background: rgba(52, 199, 89, 0.15); color: #34c759; border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 800; }

    .empty-state { padding: 60px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; background: var(--bg-fill-2); border-radius: var(--r-md); }
    .empty-state.tall { padding: 120px 20px; }
    .empty-state span { font-size: 48px; opacity: 0.5; }
    .empty-state b { font-size: var(--fs-base); font-weight: 700; }
    .empty-state small { font-size: var(--fs-xs); color: var(--label-2); }

    .pipeline-stats, .analytics-kpis, .recruiter-kpis {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
    }
    @media (max-width: 820px) { .pipeline-stats, .analytics-kpis, .recruiter-kpis { grid-template-columns: repeat(2, 1fr); } }
    .ps-card, .ak-card, .rk-card {
      padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); border-left: 3px solid var(--c);
      display: flex; flex-direction: column; gap: 4px;
    }
    .ps-icon, .ak-icon, .rk-icon { font-size: 20px; }
    .ps-val, .ak-val, .rk-val { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
    .ps-card small, .ak-card small, .rk-card small { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .ak-trend, .rk-trend { font-size: 10px; font-weight: 700; color: #ff3b30; }
    .ak-trend.up, .rk-trend.up { color: #34c759; }

    .pipeline-board { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
    @media (max-width: 1200px) { .pipeline-board { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 700px) { .pipeline-board { grid-template-columns: 1fr; } }
    .pb-col { padding: 12px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-top: 3px solid var(--c); display: flex; flex-direction: column; gap: 10px; }
    .pbc-head { display: flex; align-items: center; gap: 8px; }
    .pbc-icon { font-size: 16px; }
    .pbc-label { font-size: var(--fs-2xs); font-weight: 700; flex: 1; text-transform: uppercase; letter-spacing: 0.04em; }
    .pbc-count { padding: 1px 8px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-size: 10px; font-weight: 800; color: var(--label-2); }
    .pbc-body { display: flex; flex-direction: column; gap: 8px; }
    .pb-card { padding: 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: all 140ms; }
    .pb-card:hover { background: var(--bg-fill-3); transform: translateX(2px); }
    .pb-card > header { display: grid; grid-template-columns: 32px 1fr; gap: 8px; align-items: center; }
    .pbc-logo { width: 32px; height: 32px; display: grid; place-items: center; background: var(--bg-surface-solid); border-radius: var(--r-xs); font-size: 16px; }
    .pb-card b { font-size: var(--fs-2xs); font-weight: 700; display: block; line-height: 1.3; }
    .pb-card small { font-size: 9px; color: var(--label-2); }
    .pbc-progress { display: flex; align-items: center; gap: 8px; }
    .pbc-track { flex: 1; height: 4px; background: var(--bg-surface-solid); border-radius: var(--r-pill); overflow: hidden; }
    .pbc-fill { height: 100%; border-radius: var(--r-pill); transition: width 400ms; }
    .pbc-pct { font-size: 9px; color: var(--label-3); }
    .pbc-interview { font-size: 10px; color: #ff9500; font-weight: 700; }
    .pbc-foot { display: flex; align-items: center; gap: 6px; padding-top: 6px; border-top: 0.5px solid var(--separator); }
    .pbc-rec-av { font-size: 14px; }
    .pbc-foot small { font-size: 9px; color: var(--label-3); }
    .pbc-empty { padding: 20px; text-align: center; font-size: 10px; color: var(--label-3); font-style: italic; }

    .messages-layout { display: grid; grid-template-columns: 380px 1fr; gap: 0; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; min-height: 600px; }
    @media (max-width: 900px) { .messages-layout { grid-template-columns: 1fr; min-height: auto; } }
    .msg-sidebar { border-right: 0.5px solid var(--separator); display: flex; flex-direction: column; }
    .msg-search { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 0.5px solid var(--separator); }
    .msg-search span { font-size: 14px; }
    .msg-search input { flex: 1; background: transparent; border: 0; outline: none; font-size: var(--fs-xs); color: var(--label); font-family: inherit; }
    .msg-list { list-style: none; overflow-y: auto; flex: 1; }
    .msg-item { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: start; padding: 14px 16px; border-bottom: 0.5px solid var(--separator); cursor: pointer; transition: background 140ms; position: relative; }
    .msg-item:hover { background: var(--bg-hover); }
    .msg-item.active { background: rgba(10, 102, 194, 0.06); }
    .msg-item.unread { border-left: 3px solid #0a66c2; }
    .msg-avatar { width: 44px; height: 44px; display: grid; place-items: center; background: var(--bg-fill-2); border-radius: 50%; font-size: 20px; }
    .msg-body { min-width: 0; }
    .msg-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .msg-row b { font-size: var(--fs-xs); font-weight: 700; }
    .msg-time { font-size: 9px; color: var(--label-3); }
    .msg-headline { font-size: 10px; color: var(--label-2); display: block; margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .msg-preview { font-size: 10px; color: var(--label-3); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 4px; line-height: 1.4; }
    .msg-dot { width: 8px; height: 8px; background: #0a66c2; border-radius: 50%; align-self: center; }

    .msg-thread { display: flex; flex-direction: column; background: var(--bg-root); }
    .mt-head { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; padding: 14px 20px; background: var(--bg-surface-solid); border-bottom: 0.5px solid var(--separator); }
    .mt-avatar { width: 44px; height: 44px; display: grid; place-items: center; background: var(--bg-fill-2); border-radius: 50%; font-size: 20px; }
    .mt-head b { font-size: var(--fs-sm); font-weight: 700; }
    .mt-head small { font-size: 10px; color: var(--label-2); }
    .mt-actions { display: flex; gap: 4px; }
    .icon-btn { width: 32px; height: 32px; display: grid; place-items: center; background: transparent; border: 0; border-radius: var(--r-xs); cursor: pointer; font-size: 14px; }
    .icon-btn:hover { background: var(--bg-hover); }
    .mt-body { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
    .mt-bubble { padding: 12px 16px; border-radius: var(--r-md); font-size: var(--fs-xs); line-height: 1.5; max-width: 70%; }
    .mt-bubble.incoming { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); align-self: flex-start; }
    .mt-bubble.outgoing { background: #0a66c2; color: #fff; align-self: flex-end; }
    .mt-composer { display: flex; gap: 10px; padding: 14px 20px; background: var(--bg-surface-solid); border-top: 0.5px solid var(--separator); }
    .mt-composer input { flex: 1; padding: 10px 16px; background: var(--bg-input); border: 0.5px solid var(--separator); border-radius: var(--r-pill); font-size: var(--fs-xs); outline: none; font-family: inherit; }

    .notif-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .nf-chip { padding: 8px 14px; border-radius: var(--r-pill); background: var(--bg-fill-2); color: var(--label-2); font-size: var(--fs-2xs); font-weight: 600; border: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 140ms; }
    .nf-chip.active { background: #0a66c2; color: #fff; }
    .nf-count { background: rgba(255, 255, 255, 0.2); padding: 1px 6px; border-radius: var(--r-pill); font-size: 9px; font-weight: 700; }

    .notif-list { display: flex; flex-direction: column; gap: 8px; }
    .notif-item { display: grid; grid-template-columns: 48px 1fr auto; gap: 14px; align-items: start; padding: 14px 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-sm); cursor: pointer; transition: all 140ms; }
    .notif-item:hover { background: var(--bg-hover); }
    .notif-item.unread { background: rgba(10, 102, 194, 0.04); border-left: 3px solid #0a66c2; }
    .notif-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 22px; }
    .notif-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .notif-body b { font-size: var(--fs-xs); font-weight: 700; }
    .notif-body p { font-size: var(--fs-2xs); color: var(--label-2); line-height: 1.5; margin-top: 4px; }
    .notif-time { font-size: 10px; color: var(--label-3); }
    .notif-dot { width: 8px; height: 8px; background: #0a66c2; border-radius: 50%; align-self: center; }

    .companies-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .company-card { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; cursor: pointer; transition: all 200ms; display: flex; flex-direction: column; }
    .company-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .co-cover { height: 70px; }
    .co-body { padding: 0 18px 18px; position: relative; display: flex; flex-direction: column; gap: 6px; }
    .co-logo-wrap { margin-top: -30px; margin-bottom: 6px; }
    .co-logo { width: 60px; height: 60px; display: grid; place-items: center; background: var(--bg-surface-solid); border: 3px solid var(--bg-surface-solid); border-radius: var(--r-md); font-size: 28px; box-shadow: var(--shadow-sm); }
    .co-name-row { display: flex; align-items: center; gap: 6px; }
    .co-body h4 { font-size: var(--fs-base); font-weight: 700; }
    .co-industry { font-size: var(--fs-2xs); color: var(--label-2); }
    .co-location { font-size: 10px; color: var(--label-3); }
    .co-about { font-size: var(--fs-2xs); color: var(--label-2); line-height: 1.5; margin-top: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .co-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 10px 0; border-top: 0.5px solid var(--separator); border-bottom: 0.5px solid var(--separator); margin: 6px 0; }
    .cos-item { text-align: center; }
    .cos-item b { font-size: var(--fs-sm); font-weight: 800; display: block; color: var(--c); }
    .cos-item small { font-size: 9px; color: var(--label-3); text-transform: uppercase; font-weight: 700; }
    .co-foot { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

    .recruiter-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 900px) { .recruiter-layout { grid-template-columns: 1fr; } }
    .candidates-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .cand-row { display: grid; grid-template-columns: 48px 1fr auto; gap: 12px; align-items: center; padding: 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); cursor: pointer; transition: all 140ms; }
    .cand-row:hover { background: var(--bg-fill-3); transform: translateX(2px); }
    .cand-avatar { width: 48px; height: 48px; display: grid; place-items: center; background: var(--bg-surface-solid); border-radius: 50%; font-size: 22px; }
    .cand-name-row { display: flex; align-items: center; gap: 8px; }
    .cand-row b { font-size: var(--fs-xs); font-weight: 700; }
    .cand-row small { font-size: 10px; color: var(--label-2); display: block; margin-top: 2px; }
    .cand-match { padding: 2px 8px; background: var(--bg-fill-3); border-radius: var(--r-pill); font-size: 9px; font-weight: 800; color: var(--label-2); }
    .cand-match.high { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .cand-skills { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 6px; }
    .cand-skill { font-size: 9px; padding: 2px 6px; background: var(--bg-surface-solid); border-radius: var(--r-pill); color: var(--label-2); font-family: var(--sf-mono); }
    .cand-actions { display: flex; flex-direction: column; gap: 6px; }

    .open-positions { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .op-row { display: grid; grid-template-columns: 40px 1fr auto; gap: 12px; align-items: center; padding: 10px; background: var(--bg-fill-2); border-radius: var(--r-sm); cursor: pointer; transition: all 140ms; }
    .op-row:hover { background: var(--bg-fill-3); }
    .op-logo { width: 40px; height: 40px; display: grid; place-items: center; background: var(--bg-surface-solid); border-radius: var(--r-xs); font-size: 20px; }
    .op-row b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .op-row small { font-size: 10px; color: var(--label-2); }
    .op-status { padding: 3px 9px; background: rgba(52, 199, 89, 0.15); color: #34c759; border-radius: var(--r-pill); font-size: 9px; font-weight: 800; text-transform: uppercase; }

    .rec-pipeline { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
    @media (max-width: 1100px) { .rec-pipeline { grid-template-columns: repeat(3, 1fr); } }
    .rp-col { padding: 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); border-top: 3px solid var(--c); display: flex; flex-direction: column; gap: 8px; }
    .rp-col > header { display: flex; align-items: center; gap: 6px; }
    .rp-col header b { font-size: 10px; font-weight: 800; text-transform: uppercase; flex: 1; letter-spacing: 0.04em; }
    .rp-count { font-size: 10px; font-weight: 800; color: var(--label-2); }
    .rp-body { display: flex; flex-direction: column; gap: 6px; }
    .rp-item { padding: 8px; background: var(--bg-surface-solid); border-radius: var(--r-xs); cursor: pointer; }
    .rp-item b { font-size: 10px; font-weight: 700; display: block; }
    .rp-item small { font-size: 9px; color: var(--label-3); }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 800px) { .grid-2 { grid-template-columns: 1fr; } }

    .bar-chart { display: flex; align-items: flex-end; gap: 3px; height: 180px; padding: 4px 0; }
    .bc-col { flex: 1; height: 100%; display: flex; align-items: flex-end; }
    .bc-bar { width: 100%; background: linear-gradient(180deg, #0a66c2, #004182); border-radius: 2px 2px 0 0; min-height: 3px; transition: opacity 140ms; }
    .bc-bar:hover { opacity: 0.75; }
    .chart-axis { display: flex; justify-content: space-between; font-size: 10px; color: var(--label-3); font-family: var(--sf-mono); padding-top: 6px; }

    .stage-breakdown { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .sb-row { display: grid; grid-template-columns: 12px 100px 1fr 40px; gap: 12px; align-items: center; font-size: var(--fs-xs); }
    .sb-dot { width: 10px; height: 10px; border-radius: 50%; }
    .sb-label { color: var(--label-2); }
    .sb-track { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .sb-fill { height: 100%; border-radius: var(--r-pill); }
    .sb-count { text-align: right; font-weight: 700; }

    .skills-demand { display: flex; flex-direction: column; gap: 10px; }
    .sd-row { display: grid; grid-template-columns: 28px 180px 1fr 50px; gap: 12px; align-items: center; font-size: var(--fs-xs); }
    .sd-icon { font-size: 18px; text-align: center; }
    .sd-name { font-weight: 600; }
    .sd-track { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .sd-fill { height: 100%; border-radius: var(--r-pill); transition: width 500ms; }
    .sd-pct { text-align: right; font-weight: 700; }

    .settings-list { display: flex; flex-direction: column; gap: 4px; }
    .setting-row { display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: center; padding: 12px 0; border-bottom: 0.5px solid var(--separator); }
    .setting-row:last-child { border-bottom: 0; }
    .setting-row b { font-size: var(--fs-sm); font-weight: 600; display: block; }
    .setting-row small { font-size: var(--fs-2xs); color: var(--label-2); }
    .toggle { position: relative; width: 44px; height: 26px; border-radius: var(--r-pill); background: var(--bg-fill-3); border: 0; cursor: pointer; transition: background 200ms; flex-shrink: 0; }
    .toggle.on { background: #0a66c2; }
    .toggle .knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: #fff; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 200ms; }
    .toggle.on .knob { transform: translateX(18px); }
    .dz-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(8px); z-index: 9990; display: grid; place-items: center; padding: 40px 20px; animation: fadeIn 200ms; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal { max-width: 720px; width: 100%; max-height: 88vh; background: var(--bg-elevated); border: 0.5px solid var(--separator); border-radius: var(--r-lg); box-shadow: var(--shadow-xl); display: flex; flex-direction: column; overflow: hidden; animation: modalIn 300ms var(--ease-spring); }
    .modal.job-modal { max-width: 780px; }
    .modal.app-modal { max-width: 680px; }
    .modal.cand-modal { max-width: 620px; }
    @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .modal-head { display: flex; align-items: center; gap: 14px; padding: 20px 24px; border-bottom: 0.5px solid var(--separator); }
    .modal-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: var(--r-md); background: var(--bg-fill-2); font-size: 24px; flex-shrink: 0; }
    .modal-head > div { flex: 1; }
    .modal-head h3 { font-size: var(--fs-lg); font-weight: 700; letter-spacing: -0.015em; }
    .modal-head p { font-size: var(--fs-xs); color: var(--label-2); margin-top: 2px; }
    .modal-close { width: 32px; height: 32px; display: grid; place-items: center; border-radius: var(--r-xs); color: var(--label-3); font-size: 16px; background: transparent; border: 0; cursor: pointer; }
    .modal-close:hover { background: var(--bg-hover); color: var(--label); }
    .modal-body { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .modal-foot { padding: 16px 24px; border-top: 0.5px solid var(--separator); display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; align-items: center; }
    .mf-done { padding: 8px 16px; background: rgba(52, 199, 89, 0.15); color: #34c759; border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 800; }

    .jm-tags { display: flex; gap: 6px; flex-wrap: wrap; }
    .jm-hero { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 16px; background: var(--bg-fill-2); border-radius: var(--r-md); }
    .jm-hero > div { text-align: center; }
    .jm-hero small { font-size: 10px; color: var(--label-3); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px; }
    .jm-hero b { font-size: var(--fs-base); font-weight: 800; }
    .jm-section { display: flex; flex-direction: column; gap: 8px; }
    .jm-section p { font-size: var(--fs-sm); line-height: 1.65; color: var(--label); white-space: pre-wrap; }
    .jm-skills { display: flex; flex-wrap: wrap; gap: 6px; }
    .om-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-3); }

    .am-progress { padding: 16px; background: var(--bg-fill-2); border-radius: var(--r-md); }
    .am-steps { display: flex; justify-content: space-between; gap: 6px; }
    .ams-step { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }
    .ams-dot { width: 16px; height: 16px; border-radius: 50%; transition: background 200ms; }
    .ams-step.done .ams-dot { box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.2); }
    .ams-step.current .ams-dot { box-shadow: 0 0 0 3px rgba(10, 102, 194, 0.25); }
    .ams-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: var(--label-3); text-align: center; }
    .ams-step.done .ams-label { color: var(--label); }
    .am-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .am-block { display: flex; flex-direction: column; gap: 4px; padding: 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .am-block.full { grid-column: 1 / -1; }
    .am-block b { font-size: var(--fs-sm); font-weight: 700; }
    .am-block p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.55; }

    .cm-hero { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 16px; background: var(--bg-fill-2); border-radius: var(--r-md); }
    .cm-hero > div { text-align: center; }
    .cm-hero small { font-size: 10px; color: var(--label-3); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px; }
    .cm-hero b { font-size: var(--fs-base); font-weight: 800; }
    .cm-section { display: flex; flex-direction: column; gap: 8px; }
    .cm-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .cm-chip { font-size: 11px; padding: 4px 10px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-family: var(--sf-mono); color: var(--label); }
  `],
})
export class AfkarPreviewComponent {
  readonly Math = Math;
  public toast = inject(ToastService);
  private menu = inject(ContextMenuService);

  readonly lang = signal<Lang>('en');
  readonly active = signal<AfkarView>('feed');
  readonly feedFilter = signal<string>('all');
  readonly networkFilter = signal<string>('all');
  readonly notifFilter = signal<string>('all');
  readonly jobSort = signal<string>('match');
  readonly searchQuery = signal('');
  readonly isRecruiterMode = signal(false);

  readonly filterWorkType = signal<string[]>(['remote', 'hybrid', 'onsite']);
  readonly filterExperience = signal<string[]>(['entry', 'mid', 'senior', 'lead']);
  readonly filterJobType = signal<string[]>(['full-time', 'part-time', 'contract']);
  readonly salaryMin = signal<number>(0);
  readonly salaryMax = signal<number>(100000);

  readonly selectedJob = signal<Job | null>(null);
  readonly selectedApplication = signal<Application | null>(null);
  readonly selectedCandidate = signal<RecruiterCandidate | null>(null);
  readonly selectedMessage = signal<Message | null>(null);

  private settingsStore = signal<Record<string, any>>({
    publicProfile: true,
    showEmail: false,
    showPhone: false,
    showInSearch: true,
    openToWork: true,
    openToRecruiters: true,
    salaryVisible: false,
    emailAlerts: true,
    pushJobAlerts: true,
    weeklyDigest: true,
    connectionRequests: true,
    postReactions: true,
    messageNotifications: true,
  });

  readonly me = signal<UserProfile>({
    id: 'ME',
    name: 'Ibrahim Shafiq',
    nameAr: 'إبراهيم شفيق',
    headline: 'Full-Stack Software Engineer — Angular & .NET',
    headlineAr: 'مهندس برمجيات متكامل — Angular و .NET',
    location: 'Cairo, Egypt',
    locationAr: 'القاهرة، مصر',
    avatar: '👨‍💻',
    coverGradient: 'linear-gradient(135deg, #0a66c2, #004182, #0077b5)',
    about: 'Full-Stack Software Engineer with 3 years of experience building production systems end-to-end with Angular and ASP.NET Core. Comfortable owning features from database and REST API design through to polished, responsive UIs.\n\nBackground spans startup product development, mission-critical full-stack systems during military service, and freelance full-stack delivery. Strong foundation in Clean Architecture, SOLID principles, and RESTful API design.',
    aboutAr: 'مهندس برمجيات متكامل بخبرة 3 سنوات في بناء أنظمة إنتاجية من البداية للنهاية بـ Angular و ASP.NET Core. متمكن من امتلاك الميزات من تصميم قاعدة البيانات وواجهات REST حتى واجهات المستخدم عالية الجودة.',
    connections: 487,
    followers: 1247,
    profileViews: 892,
    searchAppearances: 124,
    openToWork: true,
    verified: true,
    premium: true,
    experience: [
      { id: 'E-001', role: 'Full-Stack Developer', roleAr: 'مطور متكامل', company: 'X-BLEND', companyAr: 'إكس بلند', companyLogo: '🚀', location: 'Cairo, Egypt', locationAr: 'القاهرة، مصر', start: 'Oct 2024', end: 'Present', duration: '1 yr 3 mos', description: 'Delivered Angular-based front-end solutions across multiple client projects. Owned features end-to-end from Figma handoff to production deploys.', descriptionAr: 'تسليم حلول واجهات بـ Angular عبر مشاريع عملاء متعددة. امتلاك الميزات من التسليم إلى النشر.', skills: ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'PrimeNG'] },
      { id: 'E-002', role: 'Full-Stack Developer', roleAr: 'مطور متكامل', company: 'FOE — Military Service', companyAr: 'القوات المسلحة', companyLogo: '🎖️', location: 'Cairo, Egypt', locationAr: 'القاهرة، مصر', start: 'Jan 2023', end: 'Sep 2024', duration: '1 yr 9 mos', description: 'Built mission-critical operational systems with Angular and ASP.NET Core — from document generation to data normalization across 10 sectors.', descriptionAr: 'بناء أنظمة تشغيلية حساسة بـ Angular و ASP.NET Core — من توليد المستندات إلى تطبيع البيانات عبر 10 قطاعات.', skills: ['Angular', 'ASP.NET Core', 'EF Core', 'SQL Server', 'Firebase'] },
      { id: 'E-003', role: 'Freelance Full-Stack Developer', roleAr: 'مطور متكامل مستقل', company: 'Freelance', companyAr: 'عمل حر', companyLogo: '💼', location: 'Remote', locationAr: 'عن بعد', start: 'Jun 2022', end: 'Dec 2022', duration: '7 mos', description: 'Delivered full-stack web applications for clients — job platforms and e-commerce. Complete ownership of architecture, implementation, and deployment.', descriptionAr: 'تسليم تطبيقات ويب متكاملة للعملاء — منصات وظائف وتجارة إلكترونية. مسؤولية كاملة عن الهندسة والتنفيذ والنشر.', skills: ['Angular', 'ASP.NET Core', 'EF Core', 'JWT'] },
    ],
    education: [
      { id: 'ED-001', school: 'Cairo University', schoolAr: 'جامعة القاهرة', logo: '🎓', degree: 'Bachelor of Science', degreeAr: 'بكالوريوس علوم', field: 'Computer Science', fieldAr: 'علوم الحاسب', start: '2018', end: '2022', grade: 'Very Good' },
    ],
    skills: [
      { id: 'S-001', name: 'Angular', nameAr: 'أنجولار', endorsements: 87, endorsed: false },
      { id: 'S-002', name: 'TypeScript', nameAr: 'تايب سكريبت', endorsements: 82, endorsed: true },
      { id: 'S-003', name: 'ASP.NET Core', nameAr: 'ASP.NET Core', endorsements: 74, endorsed: false },
      { id: 'S-004', name: 'C#', nameAr: 'سي شارب', endorsements: 71, endorsed: true },
      { id: 'S-005', name: 'RxJS', nameAr: 'RxJS', endorsements: 63, endorsed: false },
      { id: 'S-006', name: 'SQL Server', nameAr: 'SQL Server', endorsements: 58, endorsed: false },
      { id: 'S-007', name: 'Clean Architecture', nameAr: 'هندسة نظيفة', endorsements: 54, endorsed: true },
      { id: 'S-008', name: 'NgRx', nameAr: 'NgRx', endorsements: 41, endorsed: false },
    ],
    languages: ['Arabic — Native', 'English — B2'],
    certifications: [
      { id: 'C-001', name: 'Angular: The Complete Guide', issuer: 'Udemy · Maximilian Schwarzmüller', issuedAt: '2023' },
      { id: 'C-002', name: 'ASP.NET Core Web API', issuer: 'Udemy', issuedAt: '2023' },
      { id: 'C-003', name: 'Advanced Angular Development', issuer: 'Angular University', issuedAt: '2024' },
    ],
  });

  readonly posts = signal<Post[]>([
    { id: 'P-001', authorId: 'ME', authorName: 'Ibrahim Shafiq', authorNameAr: 'إبراهيم شفيق', authorHeadline: 'Full-Stack Software Engineer — Angular & .NET', authorHeadlineAr: 'مهندس برمجيات متكامل — Angular و .NET', authorAvatar: '👨‍💻', time: '2h', timeAr: 'منذ ساعتين', content: 'Excited to share that I\'ve wrapped up a comprehensive Angular + .NET full-stack project this week — 71 controllers, SignalR real-time features, and a premium multi-platform post designer. Sharing the architecture breakdown soon!', contentAr: 'سعيد بمشاركة أنني أنهيت هذا الأسبوع مشروع متكامل بـ Angular و .NET — 71 كنترولر وميزات SignalR في الوقت الفعلي. سأشارك تفصيل الهندسة قريباً!', image: '🚀💻', hashtags: ['angular', 'dotnet', 'fullstack'], likes: 342, comments: 47, shares: 18, liked: true, type: 'post' },
    { id: 'P-002', authorId: 'C-001', authorName: 'Ahmad Abo Nahar', authorNameAr: 'أحمد أبو نهار', authorHeadline: 'Team Leader @ X-BLEND', authorHeadlineAr: 'قائد فريق @ إكس بلند', authorAvatar: '👨‍💼', time: '4h', timeAr: 'منذ 4 ساعات', content: 'We\'re hiring! Looking for a Senior Angular Developer to join our team at X-BLEND. Hybrid role in Cairo, competitive salary, and a chance to work on enterprise-scale products.', contentAr: 'نوظف! نبحث عن مطور Angular أول للانضمام لفريقنا في X-BLEND. دور مرن في القاهرة، راتب تنافسي، وفرصة للعمل على منتجات مؤسسية.', hashtags: ['hiring', 'angular', 'cairo'], likes: 128, comments: 24, shares: 32, liked: false, type: 'job-share' },
    { id: 'P-003', authorId: 'C-002', authorName: 'Sara Adel', authorNameAr: 'سارة عادل', authorHeadline: 'Lead Designer @ X-BLEND', authorHeadlineAr: 'مصممة رئيسية @ إكس بلند', authorAvatar: '👩‍🎨', time: '1d', timeAr: 'منذ يوم', content: 'Just published a deep-dive article on design systems for enterprise products. 5 lessons learned from building Figma libraries that scale across 20+ projects.', contentAr: 'نشرت للتو مقالاً معمقاً عن أنظمة التصميم للمنتجات المؤسسية. 5 دروس من بناء مكتبات Figma تتوسع عبر 20+ مشروع.', image: '🎨📐', hashtags: ['design', 'figma', 'ux'], likes: 189, comments: 31, shares: 12, liked: false, type: 'article' },
    { id: 'P-004', authorId: 'C-003', authorName: 'Omar Khaled', authorNameAr: 'عمر خالد', authorHeadline: 'Senior Backend Engineer @ FinBank', authorHeadlineAr: 'مهندس خلفية أول @ بنك مصر', authorAvatar: '👨‍🔧', time: '2d', timeAr: 'منذ يومين', content: 'Thrilled to announce that I\'ve completed my Azure Solutions Architect certification. Months of study finally paid off!', contentAr: 'متحمس للإعلان عن إتمامي شهادة Azure Solutions Architect. أشهر من الدراسة أثمرت أخيراً!', hashtags: ['azure', 'certification', 'cloud'], likes: 412, comments: 68, shares: 8, liked: false, type: 'achievement' },
    { id: 'P-005', authorId: 'C-004', authorName: 'Maram Essam', authorNameAr: 'مرام عصام', authorHeadline: 'Angular Developer @ X-BLEND', authorHeadlineAr: 'مطورة Angular @ إكس بلند', authorAvatar: '👩‍💻', time: '3d', timeAr: 'منذ 3 أيام', content: 'Angular signals have completely changed how I think about state. Here\'s a short thread on migrating a legacy NgRx feature to signals in production — the wins, the gotchas, and the surprises. 🧵', contentAr: 'Signals في Angular غيّرت تماماً طريقة تفكيري في الحالة. هنا سلسلة قصيرة عن ترحيل ميزة NgRx قديمة إلى signals في الإنتاج.', hashtags: ['angular', 'signals', 'ngrx'], likes: 267, comments: 42, shares: 21, liked: true, type: 'post' },
    { id: 'P-006', authorId: 'C-005', authorName: 'Ahmad Ehab', authorNameAr: 'أحمد إيهاب', authorHeadline: 'UI/UX Designer @ X-BLEND', authorHeadlineAr: 'مصمم واجهات @ إكس بلند', avatar: '', authorAvatar: '🎨', time: '4d', timeAr: 'منذ 4 أيام', content: 'Latest case study: redesigning the onboarding flow for an EdTech platform — dropped drop-off by 34% and cut time-to-first-value from 8 minutes to 90 seconds.', contentAr: 'أحدث دراسة حالة: إعادة تصميم مسار التسجيل لمنصة تعليمية — انخفض التخلي عن التسجيل بنسبة 34%.', hashtags: ['ux', 'onboarding', 'casestudy'], likes: 341, comments: 52, shares: 27, liked: false, type: 'post' } as any,
  ]);

  readonly feedFilters = [
    { id: 'all', label: 'All posts', labelAr: 'كل المنشورات' },
    { id: 'connections', label: 'Connections', labelAr: 'الاتصالات' },
    { id: 'jobs', label: 'Jobs', labelAr: 'وظائف' },
  ];

  readonly trendingTopics = [
    { rank: 1, tag: '#Angular20', posts: 1240 },
    { rank: 2, tag: '#DotNet9', posts: 892 },
    { rank: 3, tag: '#AIEngineering', posts: 742 },
    { rank: 4, tag: '#CleanArchitecture', posts: 618 },
    { rank: 5, tag: '#RemoteWork', posts: 534 },
  ];

  readonly connections = signal<Connection[]>([
    { id: 'ME', name: 'Ibrahim Shafiq', nameAr: 'إبراهيم شفيق', headline: 'Full-Stack Engineer — Angular & .NET', headlineAr: 'مهندس متكامل — Angular و .NET', avatar: '👨‍💻', mutualConnections: 0, location: 'Cairo', status: 'connected' },
    { id: 'C-000', name: 'Ahmed El-Desouky', nameAr: 'أحمد الدسوقي', headline: 'Backend Engineer — .NET & C#', headlineAr: 'مهندس خلفية — .NET و C#', avatar: '👨‍💻', mutualConnections: 8, location: 'Cairo', status: 'connected' },
    { id: 'C-006', name: 'Layla Hassan', nameAr: 'ليلى حسن', headline: 'Frontend Engineer @ TechCorp', headlineAr: 'مهندسة واجهات @ تك كورب', avatar: '👩‍💼', mutualConnections: 18, location: 'Alexandria', status: 'pending-received' },
    { id: 'C-007', name: 'Khaled Sami', nameAr: 'خالد سامي', headline: 'DevOps Engineer @ CloudLink', headlineAr: 'مهندس DevOps @ كلاود لينك', avatar: '⚙️', mutualConnections: 12, location: 'Remote', status: 'pending-received' },
    { id: 'C-008', name: 'Nour Mostafa', nameAr: 'نور مصطفى', headline: 'Product Manager @ StartupX', headlineAr: 'مديرة منتج @ ستارت أب إكس', avatar: '📋', mutualConnections: 24, location: 'Cairo', status: 'pending-sent' },
    { id: 'C-009', name: 'Youssef Karim', nameAr: 'يوسف كريم', headline: 'Solutions Architect @ Azure Partner', headlineAr: 'معماري حلول @ شريك أزور', avatar: '👨‍💻', mutualConnections: 8, location: 'Dubai', status: 'suggested' },
    { id: 'C-010', name: 'Hana Farouk', nameAr: 'هنا فاروق', headline: 'Senior UX Researcher @ MNC', headlineAr: 'باحثة UX أولى @ شركة متعددة الجنسيات', avatar: '👩‍🔬', mutualConnections: 15, location: 'Cairo', status: 'suggested' },
    { id: 'C-011', name: 'Tarek Mansour', nameAr: 'طارق منصور', headline: 'CTO @ FinTech Startup', headlineAr: 'المدير التقني @ شركة تقنية مالية', avatar: '👨‍💼', mutualConnections: 22, location: 'Cairo', status: 'suggested' },
    { id: 'C-012', name: 'Salma Adel', nameAr: 'سلمى عادل', headline: 'Staff Engineer @ MAANG', headlineAr: 'مهندسة أولى @ شركة كبرى', avatar: '👩‍💻', mutualConnections: 6, location: 'Remote', status: 'suggested' },
  ]);

  readonly networkFilters = [
    { id: 'all', label: 'All connections', labelAr: 'كل الاتصالات', icon: '👥' },
    { id: 'invitations', label: 'Invitations', labelAr: 'الدعوات', icon: '📬' },
    { id: 'suggested', label: 'Suggestions', labelAr: 'اقتراحات', icon: '✨' },
  ];

  readonly jobs = signal<Job[]>([
    { id: 'J-001', title: 'Senior Angular Developer', titleAr: 'مطور Angular أول', company: 'TechCorp Egypt', companyAr: 'تك كورب مصر', companyLogo: '🚀', location: 'Cairo (Hybrid)', locationAr: 'القاهرة (مرن)', workType: 'hybrid', jobType: 'full-time', experience: 'senior', salaryMin: 35000, salaryMax: 55000, currency: 'EGP', posted: '2 days ago', postedAr: 'منذ يومين', applicants: 42, easyApply: true, promoted: true, matchScore: 96, skills: ['Angular', 'TypeScript', 'RxJS', 'NgRx'], description: 'Lead frontend development on enterprise applications with a focus on performance, accessibility, and clean architecture.', descriptionAr: 'قيادة تطوير الواجهات لتطبيقات مؤسسية مع تركيز على الأداء وإمكانية الوصول والهندسة النظيفة.', saved: true, applied: false },
    { id: 'J-002', title: '.NET Backend Engineer', titleAr: 'مهندس .NET Backend', company: 'StartupX', companyAr: 'ستارت أب إكس', companyLogo: '⚙️', location: 'Remote', locationAr: 'عن بعد', workType: 'remote', jobType: 'full-time', experience: 'mid', salaryMin: 25000, salaryMax: 40000, currency: 'EGP', posted: '5 hours ago', postedAr: 'منذ 5 ساعات', applicants: 18, easyApply: true, promoted: false, matchScore: 92, skills: ['C#', '.NET', 'EF Core', 'SQL Server'], description: 'Build scalable RESTful APIs and background services with ASP.NET Core.', descriptionAr: 'بناء واجهات REST وخدمات خلفية قابلة للتوسع بـ ASP.NET Core.', saved: false, applied: true },
    { id: 'J-003', title: 'Full-Stack Engineer (Angular + .NET)', titleAr: 'مهندس متكامل (Angular + .NET)', company: 'FinBank', companyAr: 'بنك مصر', companyLogo: '🏦', location: 'Hybrid, Cairo', locationAr: 'مرن، القاهرة', workType: 'hybrid', jobType: 'full-time', experience: 'mid', salaryMin: 45000, salaryMax: 65000, currency: 'EGP', posted: '1 day ago', postedAr: 'منذ يوم', applicants: 67, easyApply: false, promoted: true, matchScore: 98, skills: ['Angular', 'ASP.NET', 'SQL Server', 'Clean Architecture'], description: 'Ship features end-to-end for our digital banking platform.', descriptionAr: 'تسليم ميزات من البداية للنهاية لمنصتنا المصرفية الرقمية.', saved: true, applied: false },
    { id: 'J-004', title: 'Frontend Developer (Angular)', titleAr: 'مطور واجهات (Angular)', company: 'Design Studio', companyAr: 'استوديو التصميم', companyLogo: '🎨', location: 'Cairo', locationAr: 'القاهرة', workType: 'onsite', jobType: 'contract', experience: 'mid', salaryMin: 20000, salaryMax: 30000, currency: 'EGP', posted: '3 days ago', postedAr: 'منذ 3 أيام', applicants: 15, easyApply: true, promoted: false, matchScore: 88, skills: ['Angular', 'SCSS', 'Figma'], description: 'Build a marketing website for a design studio — pixel-perfect and fast.', descriptionAr: 'بناء موقع تسويقي لاستوديو تصميم — دقيق وسريع.', saved: false, applied: false },
    { id: 'J-005', title: 'Angular Team Lead', titleAr: 'قائد فريق Angular', company: 'BigCo', companyAr: 'شركة كبرى', companyLogo: '🏢', location: 'New Cairo', locationAr: 'القاهرة الجديدة', workType: 'hybrid', jobType: 'full-time', experience: 'lead', salaryMin: 60000, salaryMax: 90000, currency: 'EGP', posted: '1 week ago', postedAr: 'منذ أسبوع', applicants: 12, easyApply: false, promoted: false, matchScore: 85, skills: ['Angular', 'Leadership', 'Architecture'], description: 'Lead a team of 6 Angular engineers.', descriptionAr: 'قيادة فريق من 6 مهندسين Angular.', saved: false, applied: false },
    { id: 'J-006', title: 'Backend Engineer (ASP.NET Core)', titleAr: 'مهندس خلفية (ASP.NET Core)', company: 'HealthTech', companyAr: 'هيلث تك', companyLogo: '🏥', location: 'Remote', locationAr: 'عن بعد', workType: 'remote', jobType: 'full-time', experience: 'mid', salaryMin: 30000, salaryMax: 48000, currency: 'EGP', posted: '2 days ago', postedAr: 'منذ يومين', applicants: 34, easyApply: true, promoted: false, matchScore: 90, skills: ['ASP.NET Core', 'EF Core', 'SQL Server'], description: 'Build APIs for our telemedicine platform.', descriptionAr: 'بناء واجهات برمجية لمنصة الطب عن بعد.', saved: false, applied: false },
    { id: 'J-007', title: 'Junior Angular Developer', titleAr: 'مطور Angular مبتدئ', company: 'EduTech Solutions', companyAr: 'حلول تعليمية', companyLogo: '📚', location: 'Cairo', locationAr: 'القاهرة', workType: 'onsite', jobType: 'full-time', experience: 'entry', salaryMin: 12000, salaryMax: 18000, currency: 'EGP', posted: '4 days ago', postedAr: 'منذ 4 أيام', applicants: 87, easyApply: true, promoted: false, matchScore: 72, skills: ['Angular', 'TypeScript', 'HTML', 'CSS'], description: 'Join our team and grow your Angular skills on real production projects.', descriptionAr: 'انضم لفريقنا وطوّر مهاراتك في Angular على مشاريع إنتاجية.', saved: false, applied: false },
    { id: 'J-008', title: 'Full-Stack Developer (Remote)', titleAr: 'مطور متكامل (عن بعد)', company: 'CloudLink', companyAr: 'كلاود لينك', companyLogo: '☁️', location: 'Remote (MENA)', locationAr: 'عن بعد (الشرق الأوسط)', workType: 'remote', jobType: 'full-time', experience: 'mid', salaryMin: 40000, salaryMax: 60000, currency: 'EGP', posted: '6 hours ago', postedAr: 'منذ 6 ساعات', applicants: 24, easyApply: true, promoted: true, matchScore: 94, skills: ['Angular', '.NET', 'Docker', 'Azure'], description: 'Join our distributed team building SaaS products for MENA market.', descriptionAr: 'انضم لفريقنا الموزع لبناء منتجات SaaS لسوق الشرق الأوسط.', saved: false, applied: false },
  ]);

  readonly applications = signal<Application[]>([
    { id: 'A-001', jobId: 'J-002', jobTitle: '.NET Backend Engineer', jobTitleAr: 'مهندس .NET Backend', company: 'StartupX', companyAr: 'ستارت أب إكس', companyLogo: '⚙️', appliedAt: '2 days ago', stage: 'interview', stageProgress: 60, notes: 'Technical interview scheduled for Thursday 2 PM', interviewDate: '2024-12-12 14:00', recruiterName: 'Yasmin Adel', recruiterAvatar: '👩‍💼' },
    { id: 'A-002', jobId: 'J-001', jobTitle: 'Senior Angular Developer', jobTitleAr: 'مطور Angular أول', company: 'TechCorp Egypt', companyAr: 'تك كورب مصر', companyLogo: '🚀', appliedAt: '5 days ago', stage: 'screening', stageProgress: 30, notes: 'Resume under review', recruiterName: 'Omar Hassan', recruiterAvatar: '👨‍💼' },
    { id: 'A-003', jobId: 'J-006', jobTitle: 'Backend Engineer (ASP.NET Core)', jobTitleAr: 'مهندس خلفية (ASP.NET Core)', company: 'HealthTech', companyAr: 'هيلث تك', companyLogo: '🏥', appliedAt: '1 week ago', stage: 'viewed', stageProgress: 20, notes: 'Recruiter viewed profile' },
    { id: 'A-004', jobId: 'J-003', jobTitle: 'Full-Stack Engineer (Angular + .NET)', jobTitleAr: 'مهندس متكامل (Angular + .NET)', company: 'FinBank', companyAr: 'بنك مصر', companyLogo: '🏦', appliedAt: '2 weeks ago', stage: 'offer', stageProgress: 90, notes: 'Verbal offer received — negotiating salary', recruiterName: 'Layla Ibrahim', recruiterAvatar: '👩‍💼' },
    { id: 'A-005', jobId: 'J-007', jobTitle: 'Junior Angular Developer', jobTitleAr: 'مطور Angular مبتدئ', company: 'EduTech Solutions', companyAr: 'حلول تعليمية', companyLogo: '📚', appliedAt: '3 weeks ago', stage: 'rejected', stageProgress: 100, notes: 'Position filled with internal candidate' },
    { id: 'A-006', jobId: 'J-008', jobTitle: 'Full-Stack Developer (Remote)', jobTitleAr: 'مطور متكامل (عن بعد)', company: 'CloudLink', companyAr: 'كلاود لينك', companyLogo: '☁️', appliedAt: '1 day ago', stage: 'applied', stageProgress: 10, notes: 'Application submitted' },
    { id: 'A-007', jobId: 'J-005', jobTitle: 'Angular Team Lead', jobTitleAr: 'قائد فريق Angular', company: 'BigCo', companyAr: 'شركة كبرى', companyLogo: '🏢', appliedAt: '10 days ago', stage: 'screening', stageProgress: 35, notes: 'HR screening call completed', recruiterName: 'Sara Mahmoud', recruiterAvatar: '👩‍💼' },
  ]);

  readonly pipelineColumns = [
    { id: 'applied', label: 'Applied', labelAr: 'تم التقديم', icon: '📤', color: '#8e8e93' },
    { id: 'viewed', label: 'Viewed', labelAr: 'تم العرض', icon: '👁', color: '#007aff' },
    { id: 'screening', label: 'Screening', labelAr: 'فرز', icon: '🔍', color: '#ff9500' },
    { id: 'interview', label: 'Interview', labelAr: 'مقابلة', icon: '💼', color: '#af52de' },
    { id: 'offer', label: 'Offer', labelAr: 'عرض', icon: '🎉', color: '#34c759' },
    { id: 'rejected', label: 'Rejected', labelAr: 'مرفوض', icon: '❌', color: '#ff3b30' },
  ];

  readonly messages = signal<Message[]>([
    { id: 'M-002', fromId: 'R-001', fromName: 'Yasmin Adel', fromNameAr: 'ياسمين عادل', fromAvatar: '👩‍💼', fromHeadline: 'Talent Acquisition @ StartupX', fromHeadlineAr: 'استقطاب مواهب @ ستارت أب إكس', preview: 'Hi! I reviewed your application for the .NET Backend Engineer role — let\'s schedule a call', previewAr: 'مرحباً! راجعت طلبك لوظيفة مهندس .NET Backend — لنحدد موعد مكالمة', time: '2h', timeAr: 'منذ ساعتين', unread: true, starred: false },
    { id: 'M-004', fromId: 'R-002', fromName: 'Omar Hassan', fromNameAr: 'عمر حسن', fromAvatar: '👨‍💼', fromHeadline: 'Senior Recruiter @ TechCorp', fromHeadlineAr: 'مسؤول توظيف أول @ تك كورب', preview: 'Your profile looks great! Are you available for a quick screening call this week?', previewAr: 'ملفك يبدو رائعاً! هل أنت متاح لمكالمة فرز سريعة هذا الأسبوع؟', time: '2d', timeAr: 'منذ يومين', unread: false, starred: false },
  ]);

  readonly notifications = signal<Notification[]>([
    { id: 'N-001', icon: '💼', color: '#0a66c2', title: 'New job match: 96%', titleAr: 'تطابق وظيفة جديد: 96%', body: 'Senior Angular Developer at TechCorp Egypt', bodyAr: 'مطور Angular أول في تك كورب مصر', time: '5m', timeAr: 'منذ 5 دقائق', read: false, type: 'job' },
    { id: 'N-002', icon: '👥', color: '#34c759', title: 'Connection request from Layla Hassan', titleAr: 'طلب تواصل من ليلى حسن', body: 'Frontend Engineer @ TechCorp', bodyAr: 'مهندسة واجهات @ تك كورب', time: '1h', timeAr: 'منذ ساعة', read: false, type: 'connection' },
    { id: 'N-003', icon: '👍', color: '#ff9500', title: 'Ahmad Abo Nahar liked your post', titleAr: 'أحمد أبو نهار أعجبه منشورك', body: 'About your Angular + .NET project update', bodyAr: 'عن تحديثك لمشروع Angular + .NET', time: '2h', timeAr: 'منذ ساعتين', read: false, type: 'post' },
    { id: 'N-004', icon: '💬', color: '#af52de', title: 'New message from Yasmin Adel', titleAr: 'رسالة جديدة من ياسمين عادل', body: 'Talent Acquisition @ StartupX', bodyAr: 'استقطاب مواهب @ ستارت أب إكس', time: '3h', timeAr: 'منذ 3 ساعات', read: false, type: 'message' },
    { id: 'N-005', icon: '🎯', color: '#34c759', title: 'Application viewed by FinBank', titleAr: 'تم عرض طلبك من بنك مصر', body: 'Full-Stack Engineer (Angular + .NET)', bodyAr: 'مهندس متكامل (Angular + .NET)', time: '1d', timeAr: 'منذ يوم', read: true, type: 'job' },
    { id: 'N-006', icon: '🎉', color: '#ffcc00', title: 'You appeared in 47 searches', titleAr: 'ظهرت في 47 بحثاً', body: 'This week — up 18% from last week', bodyAr: 'هذا الأسبوع — بزيادة 18% عن الأسبوع الماضي', time: '2d', timeAr: 'منذ يومين', read: true, type: 'achievement' },
    { id: 'N-007', icon: '⭐', color: '#ff9500', title: 'Sara Adel endorsed your Angular skill', titleAr: 'سارة عادل زكّت مهارتك في Angular', body: 'Lead Designer @ X-BLEND', bodyAr: 'مصممة رئيسية @ إكس بلند', time: '3d', timeAr: 'منذ 3 أيام', read: true, type: 'post' },
  ]);

  readonly notifFilters = [
    { id: 'all', label: 'All', labelAr: 'الكل', icon: '🔔' },
    { id: 'job', label: 'Jobs', labelAr: 'وظائف', icon: '💼' },
    { id: 'connection', label: 'Network', labelAr: 'الشبكة', icon: '👥' },
    { id: 'message', label: 'Messages', labelAr: 'الرسائل', icon: '💬' },
    { id: 'post', label: 'Posts', labelAr: 'المنشورات', icon: '📝' },
  ];

  readonly companies = signal<CompanyPage[]>([
    { id: 'CO-001', name: 'TechCorp Egypt', nameAr: 'تك كورب مصر', logo: '🚀', color: '#0a66c2', industry: 'Technology', industryAr: 'تقنية', size: '500-1000 employees', location: 'Cairo, Egypt', locationAr: 'القاهرة، مصر', followers: 12480, openJobs: 12, about: 'A leading software development company building enterprise solutions for MENA region.', aboutAr: 'شركة تطوير برمجيات رائدة تبني حلولاً مؤسسية لمنطقة الشرق الأوسط.', verified: true },
    { id: 'CO-002', name: 'FinBank Group', nameAr: 'مجموعة بنك مصر', logo: '🏦', color: '#34c759', industry: 'Banking', industryAr: 'بنوك', size: '5000+ employees', location: 'Cairo, Egypt', locationAr: 'القاهرة، مصر', followers: 45200, openJobs: 8, about: 'One of Egypt\'s largest banks, driving digital transformation across all services.', aboutAr: 'أحد أكبر بنوك مصر، يقود التحول الرقمي في جميع الخدمات.', verified: true },
    { id: 'CO-003', name: 'StartupX', nameAr: 'ستارت أب إكس', logo: '⚙️', color: '#ff9500', industry: 'SaaS', industryAr: 'SaaS', size: '50-200 employees', location: 'Remote', locationAr: 'عن بعد', followers: 8420, openJobs: 15, about: 'Building the next generation of SaaS tools for emerging markets.', aboutAr: 'نبني الجيل القادم من أدوات SaaS للأسواق الناشئة.', verified: false },
    { id: 'CO-004', name: 'HealthTech', nameAr: 'هيلث تك', logo: '🏥', color: '#ff2d55', industry: 'Healthcare', industryAr: 'رعاية صحية', size: '200-500 employees', location: 'Cairo, Egypt', locationAr: 'القاهرة، مصر', followers: 6180, openJobs: 5, about: 'Digital healthcare platform connecting patients with doctors across Egypt.', aboutAr: 'منصة رعاية صحية رقمية تربط المرضى بالأطباء في جميع أنحاء مصر.', verified: true },
    { id: 'CO-005', name: 'EduTech Solutions', nameAr: 'حلول تعليمية', logo: '📚', color: '#af52de', industry: 'Education', industryAr: 'تعليم', size: '100-500 employees', location: 'Cairo, Egypt', locationAr: 'القاهرة، مصر', followers: 9240, openJobs: 6, about: 'Empowering learners across MENA with modern education technology.', aboutAr: 'تمكين المتعلمين في الشرق الأوسط بتقنية تعليمية حديثة.', verified: true },
    { id: 'CO-006', name: 'CloudLink', nameAr: 'كلاود لينك', logo: '☁️', color: '#007aff', industry: 'Cloud Services', industryAr: 'خدمات سحابية', size: '100-300 employees', location: 'Remote', locationAr: 'عن بعد', followers: 5420, openJobs: 9, about: 'Cloud infrastructure and DevOps consulting for growing teams.', aboutAr: 'بنية سحابية واستشارات DevOps للفرق النامية.', verified: false },
  ]);

  readonly recruiterCandidates = signal<RecruiterCandidate[]>([
    { id: 'RC-001', name: 'Mohamed Adel', nameAr: 'محمد عادل', headline: 'Senior Angular Developer · 6 years', headlineAr: 'مطور Angular أول · 6 سنوات', avatar: '👨‍💻', location: 'Cairo', experience: 6, matchScore: 96, skills: ['Angular', 'NgRx', 'RxJS', 'Signals'], available: true, salaryExpectation: '50K EGP', stage: 'interview' },
    { id: 'RC-002', name: 'Sara Hosny', nameAr: 'سارة حسني', headline: 'Full-Stack Engineer · 4 years', headlineAr: 'مهندسة متكاملة · 4 سنوات', avatar: '👩‍💻', location: 'Giza', experience: 4, matchScore: 92, skills: ['Angular', '.NET', 'SQL'], available: true, salaryExpectation: '38K EGP', stage: 'screening' },
    { id: 'RC-003', name: 'Omar El-Sayed', nameAr: 'عمر السيد', headline: 'Angular Developer · 5 years', headlineAr: 'مطور Angular · 5 سنوات', avatar: '👨‍💻', location: 'Remote', experience: 5, matchScore: 89, skills: ['Angular', 'TypeScript', 'SCSS'], available: true, salaryExpectation: '42K EGP', stage: 'new' },
    { id: 'RC-004', name: 'Nour Ibrahim', nameAr: 'نور إبراهيم', headline: 'Frontend Engineer · 3 years', headlineAr: 'مهندسة واجهات · 3 سنوات', avatar: '👩‍💻', location: 'Alexandria', experience: 3, matchScore: 84, skills: ['Angular', 'RxJS'], available: false, salaryExpectation: '28K EGP', stage: 'screening' },
    { id: 'RC-005', name: 'Ahmed Tarek', nameAr: 'أحمد طارق', headline: 'Senior .NET Engineer · 7 years', headlineAr: 'مهندس .NET أول · 7 سنوات', avatar: '👨‍💻', location: 'Cairo', experience: 7, matchScore: 94, skills: ['.NET', 'C#', 'SQL Server', 'Azure'], available: true, salaryExpectation: '55K EGP', stage: 'offer' },
    { id: 'RC-006', name: 'Layla Fahmy', nameAr: 'ليلى فهمي', headline: 'Full-Stack Developer · 5 years', headlineAr: 'مطورة متكاملة · 5 سنوات', avatar: '👩‍💻', location: 'Cairo', experience: 5, matchScore: 91, skills: ['Angular', '.NET', 'EF Core'], available: true, salaryExpectation: '45K EGP', stage: 'interview' },
  ]);

  readonly workTypes = [
    { id: 'onsite', label: 'On-site', labelAr: 'من المكتب' },
    { id: 'hybrid', label: 'Hybrid', labelAr: 'مرن' },
    { id: 'remote', label: 'Remote', labelAr: 'عن بعد' },
  ];

  readonly experienceLevels = [
    { id: 'entry', label: 'Entry level', labelAr: 'مبتدئ' },
    { id: 'mid', label: 'Mid level', labelAr: 'متوسط' },
    { id: 'senior', label: 'Senior', labelAr: 'أول' },
    { id: 'lead', label: 'Lead', labelAr: 'قائد' },
  ];

  readonly jobTypes = [
    { id: 'full-time', label: 'Full-time', labelAr: 'دوام كامل' },
    { id: 'part-time', label: 'Part-time', labelAr: 'دوام جزئي' },
    { id: 'contract', label: 'Contract', labelAr: 'عقد' },
    { id: 'internship', label: 'Internship', labelAr: 'تدريب' },
  ];

  readonly visibilitySettings = [
    { key: 'publicProfile', label: 'Public profile', labelAr: 'ملف عام', desc: 'Anyone can view your profile', descAr: 'يمكن لأي شخص عرض ملفك', type: 'toggle' },
    { key: 'showEmail', label: 'Show email', labelAr: 'إظهار البريد', desc: 'Display your email on profile', descAr: 'إظهار بريدك في الملف', type: 'toggle' },
    { key: 'showPhone', label: 'Show phone', labelAr: 'إظهار الهاتف', desc: 'Display phone to connections', descAr: 'إظهار الهاتف للاتصالات', type: 'toggle' },
    { key: 'showInSearch', label: 'Appear in searches', labelAr: 'الظهور في البحث', desc: 'Show up in recruiter searches', descAr: 'الظهور في بحث المسؤولين', type: 'toggle' },
  ];

  readonly jobPreferenceSettings = [
    { key: 'openToWork', label: 'Open to work', labelAr: 'متاح للعمل', desc: 'Show green badge on profile', descAr: 'إظهار شارة خضراء على الملف', type: 'toggle' },
    { key: 'openToRecruiters', label: 'Open to recruiters', labelAr: 'متاح للمسؤولين', desc: 'Allow recruiter messages', descAr: 'السماح برسائل المسؤولين', type: 'toggle' },
    { key: 'salaryVisible', label: 'Show salary expectation', labelAr: 'إظهار توقع الراتب', desc: 'Visible to recruiters', descAr: 'مرئي للمسؤولين', type: 'toggle' },
  ];

  readonly notificationSettings = [
    { key: 'emailAlerts', label: 'Email alerts', labelAr: 'تنبيهات البريد', desc: 'Important updates via email', descAr: 'التحديثات المهمة بالبريد', type: 'toggle' },
    { key: 'pushJobAlerts', label: 'Push job alerts', labelAr: 'تنبيهات الوظائف', desc: 'Daily job match digest', descAr: 'ملخص يومي للوظائف المطابقة', type: 'toggle' },
    { key: 'weeklyDigest', label: 'Weekly digest', labelAr: 'ملخص أسبوعي', desc: 'Weekly network summary', descAr: 'ملخص أسبوعي للشبكة', type: 'toggle' },
    { key: 'connectionRequests', label: 'Connection requests', labelAr: 'طلبات التواصل', desc: 'Notify on new requests', descAr: 'تنبيه عند الطلبات الجديدة', type: 'toggle' },
    { key: 'postReactions', label: 'Post reactions', labelAr: 'تفاعلات المنشورات', desc: 'Likes and comments on posts', descAr: 'الإعجابات والتعليقات على المنشورات', type: 'toggle' },
  ];

  readonly profileViewsData = Array.from({ length: 30 }, (_, i) => 20 + Math.floor(Math.sin(i / 3) * 15 + Math.random() * 25));
  readonly topSkillsData = [
    { name: 'Angular', icon: '🅰️', pct: 96, color: '#dd0031' },
    { name: 'TypeScript', icon: '📘', pct: 92, color: '#3178c6' },
    { name: '.NET', icon: '🟪', pct: 88, color: '#512bd4' },
    { name: 'SQL Server', icon: '💾', pct: 82, color: '#cc2927' },
    { name: 'RxJS', icon: '⚡', pct: 78, color: '#b7178c' },
  ];

  readonly nav = computed<PreviewNavItem[]>(() => [
    { id: 'feed', label: this.t('Feed', 'الرئيسية'), icon: '🏠', group: this.t('Home', 'الرئيسية') },
    { id: 'profile', label: this.t('Profile', 'الملف'), icon: '👤', group: this.t('Home', 'الرئيسية') },
    { id: 'network', label: this.t('My Network', 'شبكتي'), icon: '👥', badge: this.connections().length, group: this.t('Home', 'الرئيسية') },
    { id: 'messages', label: this.t('Messages', 'الرسائل'), icon: '💬', badge: this.unreadMessages(), group: this.t('Home', 'الرئيسية') },
    { id: 'notifications', label: this.t('Notifications', 'الإشعارات'), icon: '🔔', badge: this.unreadNotifications(), group: this.t('Home', 'الرئيسية') },
    { id: 'jobs', label: this.t('Jobs', 'الوظائف'), icon: '💼', badge: this.jobs().length, group: this.t('Career', 'المسار') },
    { id: 'applied', label: this.t('Applications', 'التقديمات'), icon: '📤', badge: this.applications().length, group: this.t('Career', 'المسار') },
    { id: 'saved', label: this.t('Saved Jobs', 'المحفوظة'), icon: '🔖', badge: this.savedJobs().length, group: this.t('Career', 'المسار') },
    { id: 'analytics', label: this.t('Analytics', 'التحليلات'), icon: '📊', group: this.t('Career', 'المسار') },
    { id: 'companies', label: this.t('Companies', 'الشركات'), icon: '🏢', badge: this.companies().length, group: this.t('Discover', 'اكتشف') },
    { id: 'recruiter', label: this.t('Recruiter', 'المسؤول'), icon: '💼', group: this.t('Discover', 'اكتشف') },
    { id: 'settings', label: this.t('Settings', 'الإعدادات'), icon: '⚙️', group: this.t('Discover', 'اكتشف') },
  ]);

  readonly toolbar = computed<ToolbarAction[]>(() => [
    { id: 'refresh', label: this.t('Refresh', 'تحديث'), icon: '⟳', action: () => this.toast.success(this.t('Refreshed', 'تم التحديث')) },
    { id: 'post', label: this.t('New post', 'منشور جديد'), icon: '＋', primary: true, action: () => this.createPost() },
  ]);

  readonly notifs = computed<PreviewNotification[]>(() => this.notifications().filter(n => !n.read).slice(0, 4).map(n => ({
    id: parseInt(n.id.replace('N-', '')) || 1,
    icon: n.icon,
    title: this.t(n.title, n.titleAr),
    body: this.t(n.body, n.bodyAr),
    time: this.t(n.time, n.timeAr),
  })));

  readonly searchPlaceholder = computed(() =>
    this.active() === 'jobs' ? this.t('Search jobs…', 'ابحث عن وظائف…') :
      this.active() === 'companies' ? this.t('Search companies…', 'ابحث عن شركات…') :
        this.active() === 'messages' ? this.t('Search messages…', 'ابحث في الرسائل…') : ''
  );

  readonly unreadMessages = computed(() => this.messages().filter(m => m.unread).length);
  readonly unreadNotifications = computed(() => this.notifications().filter(n => !n.read).length);
  readonly appliedCount = computed(() => this.applications().length);
  readonly savedJobs = computed(() => this.jobs().filter(j => j.saved));
  readonly pendingReceived = computed(() => this.connections().filter(c => c.status === 'pending-received'));
  readonly suggestedConnections = computed(() => this.connections().filter(c => c.status === 'suggested' || c.status === 'pending-received').slice(0, 4));
  readonly recommendedJobs = computed(() => [...this.jobs()].sort((a, b) => b.matchScore - a.matchScore));
  readonly interviewsCount = computed(() => this.applications().filter(a => a.stage === 'interview').length);

  readonly analyticsMini = computed(() => [
    { icon: '👁', label: 'Profile views', labelAr: 'مشاهدات الملف', value: this.me().profileViews.toString() },
    { icon: '🔍', label: 'Search appearances', labelAr: 'ظهور في البحث', value: this.me().searchAppearances.toString() },
    { icon: '📤', label: 'Applications sent', labelAr: 'تقديمات مرسلة', value: this.applications().length.toString() },
  ]);

  readonly analyticsFull = computed(() => [
    { icon: '👁', label: 'Profile views (7d)', labelAr: 'مشاهدات (7 أيام)', value: '84' },
    { icon: '🔍', label: 'Search appearances', labelAr: 'ظهور في البحث', value: this.me().searchAppearances.toString() },
    { icon: '📊', label: 'Profile strength', labelAr: 'قوة الملف', value: 'Advanced' },
    { icon: '🎯', label: 'Skills endorsed', labelAr: 'مهارات مزكاة', value: this.me().skills.filter(s => s.endorsed).length.toString() },
  ]);

  readonly analyticsKpis = computed(() => [
    { icon: '👁', label: this.t('Profile views', 'مشاهدات الملف'), value: '892', color: '#0a66c2', trend: '+18%', trendUp: true },
    { icon: '🔍', label: this.t('Search appearances', 'ظهور في البحث'), value: '124', color: '#34c759', trend: '+8%', trendUp: true },
    { icon: '📤', label: this.t('Applications', 'تقديمات'), value: this.applications().length.toString(), color: '#ff9500', trend: '+3', trendUp: true },
    { icon: '🎯', label: this.t('Interviews', 'مقابلات'), value: this.interviewsCount().toString(), color: '#af52de', trend: '+1', trendUp: true },
  ]);

  readonly recruiterKpis = computed(() => [
    { icon: '💼', label: this.t('Active jobs', 'وظائف نشطة'), value: '8', color: '#0a66c2', trend: '+2', trendUp: true },
    { icon: '👥', label: this.t('Total candidates', 'إجمالي المرشحين'), value: '247', color: '#34c759', trend: '+18', trendUp: true },
    { icon: '📥', label: this.t('Applications this week', 'تقديمات هذا الأسبوع'), value: '34', color: '#ff9500', trend: '+12%', trendUp: true },
    { icon: '🎯', label: this.t('Interviews scheduled', 'مقابلات مجدولة'), value: '6', color: '#af52de', trend: '+2', trendUp: true },
  ]);

  readonly stageBreakdown = computed(() => {
    const colors: Record<string, string> = {
      applied: '#8e8e93', viewed: '#007aff', screening: '#ff9500',
      interview: '#af52de', offer: '#34c759', rejected: '#ff3b30',
    };
    const total = this.applications().length;
    return this.pipelineColumns.map(c => {
      const count = this.applications().filter(a => a.stage === c.id).length;
      return { label: c.label, labelAr: c.labelAr, count, pct: total ? (count / total) * 100 : 0, color: colors[c.id] };
    });
  });

  readonly topSkills = computed(() => this.topSkillsData);

  readonly filteredFeed = computed(() => {
    const f = this.feedFilter();
    let list = this.posts();
    if (f === 'jobs') list = list.filter(p => p.type === 'job-share');
    else if (f === 'connections') list = list.filter(p => p.authorId !== 'ME');
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(p =>
      p.content.toLowerCase().includes(q) ||
      p.authorName.toLowerCase().includes(q)
    );
    return list;
  });

  readonly filteredConnections = computed(() => {
    const f = this.networkFilter();
    let list = this.connections();
    if (f === 'invitations') list = list.filter(c => c.status === 'pending-received');
    else if (f === 'suggested') list = list.filter(c => c.status === 'suggested');
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.headline.toLowerCase().includes(q)
    );
    return list;
  });

  readonly filteredJobs = computed(() => {
    let list = this.jobs();
    const wt = this.filterWorkType();
    if (wt.length) list = list.filter(j => wt.includes(j.workType));
    const exp = this.filterExperience();
    if (exp.length) list = list.filter(j => exp.includes(j.experience));
    const jt = this.filterJobType();
    if (jt.length) list = list.filter(j => jt.includes(j.jobType));
    if (this.salaryMin() > 0) list = list.filter(j => j.salaryMax >= this.salaryMin());
    if (this.salaryMax() < 100000) list = list.filter(j => j.salaryMin <= this.salaryMax());
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.skills.some(s => s.toLowerCase().includes(q))
    );
    const sort = this.jobSort();
    if (sort === 'match') return [...list].sort((a, b) => b.matchScore - a.matchScore);
    if (sort === 'salary') return [...list].sort((a, b) => b.salaryMax - a.salaryMax);
    return list;
  });

  readonly filteredNotifications = computed(() => {
    const f = this.notifFilter();
    if (f === 'all') return this.notifications();
    return this.notifications().filter(n => n.type === f);
  });

  readonly pipelineStats = computed(() => [
    { icon: '📤', label: this.t('Total applied', 'إجمالي التقديمات'), value: this.applications().length.toString(), color: '#0a66c2' },
    { icon: '💼', label: this.t('In progress', 'قيد المعالجة'), value: this.applications().filter(a => !['rejected'].includes(a.stage)).length.toString(), color: '#ff9500' },
    { icon: '🎯', label: this.t('Interviews', 'مقابلات'), value: this.interviewsCount().toString(), color: '#af52de' },
    { icon: '🎉', label: this.t('Offers', 'عروض'), value: this.applications().filter(a => a.stage === 'offer').length.toString(), color: '#34c759' },
  ]);

  t(en: string, ar: string): string { return this.lang() === 'ar' ? ar : en; }
  onNav(id: string): void { this.active.set(id as AfkarView); }
  onSearch(q: string): void { this.searchQuery.set(q); }

  countByNetwork(id: string): number {
    if (id === 'all') return this.connections().length;
    if (id === 'invitations') return this.pendingReceived().length;
    if (id === 'suggested') return this.connections().filter(c => c.status === 'suggested').length;
    return 0;
  }

  countNotifsByType(id: string): number {
    if (id === 'all') return this.notifications().length;
    return this.notifications().filter(n => n.type === id).length;
  }

  appsInStage(stage: string): Application[] {
    return this.applications().filter(a => a.stage === stage);
  }

  isStageComplete(current: string, stage: string): boolean {
    const order = ['applied', 'viewed', 'screening', 'interview', 'offer'];
    const currentIdx = order.indexOf(current);
    const stageIdx = order.indexOf(stage);
    return stageIdx <= currentIdx;
  }

  workTypeAr(t: string): string {
    const map: Record<string, string> = { onsite: 'من المكتب', hybrid: 'مرن', remote: 'عن بعد' };
    return map[t] ?? t;
  }

  jobTypeAr(t: string): string {
    const map: Record<string, string> = { 'full-time': 'دوام كامل', 'part-time': 'دوام جزئي', contract: 'عقد', internship: 'تدريب' };
    return map[t] ?? t;
  }

  expLevelAr(e: string): string {
    const map: Record<string, string> = { entry: 'مبتدئ', mid: 'متوسط', senior: 'أول', lead: 'قائد' };
    return map[e] ?? e;
  }

  appStageAr(s: string): string {
    const map: Record<string, string> = {
      applied: 'تم التقديم', viewed: 'تم العرض', screening: 'فرز',
      interview: 'مقابلة', offer: 'عرض', rejected: 'مرفوض',
    };
    return map[s] ?? s;
  }

  toggleWorkType(id: string): void {
    this.filterWorkType.update(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  }
  toggleExperience(id: string): void {
    this.filterExperience.update(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  }
  toggleJobType(id: string): void {
    this.filterJobType.update(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  }

  resetJobFilters(): void {
    this.filterWorkType.set(['remote', 'hybrid', 'onsite']);
    this.filterExperience.set(['entry', 'mid', 'senior', 'lead']);
    this.filterJobType.set(['full-time', 'part-time', 'contract']);
    this.salaryMin.set(0);
    this.salaryMax.set(100000);
  }

  toggleLike(id: string): void {
    this.posts.update(list => list.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  }

  toggleSaveJob(id: string): void {
    this.jobs.update(list => list.map(j => j.id === id ? { ...j, saved: !j.saved } : j));
    const j = this.jobs().find(x => x.id === id);
    if (j) this.toast.success(j.saved ? this.t('Saved', 'تم الحفظ') : this.t('Removed', 'تم الحذف'), this.t(j.title, j.titleAr));
  }

  connect(id: string): void {
    this.connections.update(list => list.map(c => c.id === id ? { ...c, status: 'pending-sent' as const } : c));
    this.toast.success(this.t('Request sent', 'تم إرسال الطلب'));
  }

  acceptConnection(id: string): void {
    this.connections.update(list => list.map(c => c.id === id ? { ...c, status: 'connected' as const } : c));
    this.toast.success(this.t('Connected!', 'تم الاتصال!'));
  }

  ignoreConnection(id: string): void {
    this.connections.update(list => list.filter(c => c.id !== id));
  }

  endorseSkill(id: string): void {
    this.me.update(m => ({
      ...m,
      skills: m.skills.map(s => s.id === id
        ? { ...s, endorsed: !s.endorsed, endorsements: s.endorsed ? s.endorsements - 1 : s.endorsements + 1 }
        : s
      ),
    }));
  }

  openJob(id: string): void {
    const j = this.jobs().find(x => x.id === id);
    if (j) this.selectedJob.set(j);
  }

  openApplication(id: string): void {
    const a = this.applications().find(x => x.id === id);
    if (a) this.selectedApplication.set(a);
  }

  openCandidate(id: string): void {
    const c = this.recruiterCandidates().find(x => x.id === id);
    if (c) this.selectedCandidate.set(c);
  }

  openCompany(id: string): void {
    const c = this.companies().find(x => x.id === id);
    if (c) this.toast.info(this.t(c.name, c.nameAr), `${c.openJobs} ${this.t('open positions', 'وظيفة مفتوحة')}`);
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

  newMessage(): void {
    this.toast.info(this.t('New message', 'رسالة جديدة'), this.t('Select a connection', 'اختر اتصالاً'));
  }

  markRead(id: string): void {
    this.notifications.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
  }

  markAllRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.toast.success(this.t('All marked read', 'تم تحديد الكل كمقروء'));
  }

  applyJob(id: string): void {
    const j = this.jobs().find(x => x.id === id);
    if (!j || j.applied) return;
    this.jobs.update(list => list.map(x => x.id === id ? { ...x, applied: true, applicants: x.applicants + 1 } : x));
    const newApp: Application = {
      id: `A-${Date.now()}`,
      jobId: j.id,
      jobTitle: j.title,
      jobTitleAr: j.titleAr,
      company: j.company,
      companyAr: j.companyAr,
      companyLogo: j.companyLogo,
      appliedAt: 'just now',
      stage: 'applied',
      stageProgress: 10,
      notes: 'Application submitted via Easy Apply',
    };
    this.applications.update(list => [newApp, ...list]);
    this.selectedJob.update(cur => cur && cur.id === id ? { ...cur, applied: true } : cur);
    this.toast.success(this.t('Application sent!', 'تم إرسال الطلب!'), this.t(j.title, j.titleAr));
  }

  createPost(): void {
    this.toast.success(this.t('New post', 'منشور جديد'), this.t('Composer opened', 'تم فتح المحرر'));
  }

  saveSettings(): void {
    this.toast.success(this.t('Settings saved', 'تم حفظ الإعدادات'));
  }

  settingValue(key: string): any { return this.settingsStore()[key]; }
  updateSetting(key: string, value: any): void { this.settingsStore.update(s => ({ ...s, [key]: value })); }
  toggleSetting(key: string): void { this.settingsStore.update(s => ({ ...s, [key]: !s[key] })); }

  onPostContext(ev: MouseEvent, p: Post): void {
    ev.preventDefault(); ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'save', label: this.t('Save post', 'حفظ المنشور'), icon: '🔖', action: () => this.toast.success(this.t('Saved', 'تم الحفظ')) },
      { id: 'hide', label: this.t('Hide post', 'إخفاء المنشور'), icon: '🚫', action: () => this.toast.info(this.t('Hidden', 'تم الإخفاء')) },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      { id: 'copy', label: this.t('Copy link', 'نسخ الرابط'), icon: '🔗', action: () => { navigator.clipboard?.writeText(`afkar.com/posts/${p.id}`); this.toast.success(this.t('Copied', 'تم النسخ')); } },
      { id: 'report', label: this.t('Report', 'إبلاغ'), icon: '⚠️', danger: true, action: () => this.toast.warning(this.t('Reported', 'تم الإبلاغ')) },
    ]);
  }

  onJobContext(ev: MouseEvent, j: Job): void {
    ev.preventDefault(); ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: this.t('View job', 'عرض الوظيفة'), icon: '👁', action: () => this.openJob(j.id) },
      { id: 'save', label: j.saved ? this.t('Remove saved', 'إزالة الحفظ') : this.t('Save job', 'حفظ الوظيفة'), icon: '🔖', action: () => this.toggleSaveJob(j.id) },
      { id: 'apply', label: this.t('Apply now', 'قدم الآن'), icon: '✉', disabled: j.applied, action: () => this.applyJob(j.id) },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      { id: 'copy', label: this.t('Copy link', 'نسخ الرابط'), icon: '🔗', action: () => { navigator.clipboard?.writeText(`afkar.com/jobs/${j.id}`); this.toast.success(this.t('Copied', 'تم النسخ')); } },
    ]);
  }

  onApplicationContext(ev: MouseEvent, a: Application): void {
    ev.preventDefault(); ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: this.t('View application', 'عرض الطلب'), icon: '👁', action: () => this.openApplication(a.id) },
      { id: 'contact', label: this.t('Contact recruiter', 'تواصل مع المسؤول'), icon: '✉', disabled: !a.recruiterName, action: () => this.toast.info(this.t('Message sent', 'تم إرسال الرسالة')) },
      { id: 'sep', label: '', separatorBefore: true, action: () => { } },
      { id: 'withdraw', label: this.t('Withdraw', 'سحب الطلب'), icon: '✕', danger: true, action: () => { this.applications.update(list => list.filter(x => x.id !== a.id)); this.toast.warning(this.t('Withdrawn', 'تم السحب')); } },
    ]);
  }
}