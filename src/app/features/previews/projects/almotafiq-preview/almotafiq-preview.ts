import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContextMenuService } from '../../../../core/services/context-menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PreviewShellComponent, PreviewNavItem, ToolbarAction, PreviewNotification } from '../../shared/preview-shell/preview-shell';

type AMView =
  | 'dashboard' | 'live' | 'recorded' | 'schedule'
  | 'courses' | 'library' | 'exams' | 'questions' | 'reviews' | 'homework'
  | 'students' | 'teachers' | 'parents' | 'classes'
  | 'admin' | 'finances' | 'reports'
  | 'blog' | 'announcements' | 'messages' | 'notifications'
  | 'analytics' | 'settings';

type Lang = 'en' | 'ar';
type Portal = 'admin' | 'teacher' | 'parent' | 'student';

interface LiveSession {
  id: string;
  title: string;
  titleAr: string;
  teacher: string;
  teacherAr: string;
  course: string;
  courseAr: string;
  status: 'live' | 'scheduled' | 'ended';
  viewers: number;
  peak: number;
  startedAt: string;
  duration: string;
  grade: string;
  gradeAr: string;
  subject: string;
  subjectAr: string;
  thumbnail: string;
  quality: '720p' | '1080p' | '480p';
  chatMessages: number;
  reactions: number;
}

interface Course {
  id: string;
  title: string;
  titleAr: string;
  teacher: string;
  teacherAr: string;
  grade: string;
  gradeAr: string;
  subject: string;
  subjectAr: string;
  price: number;
  discount?: number;
  lessons: number;
  hours: number;
  students: number;
  rating: number;
  reviews: number;
  thumbnail: string;
  icon: string;
  status: 'published' | 'draft' | 'review';
  language: 'ar' | 'en' | 'both';
  lastUpdate: string;
}

interface Exam {
  id: string;
  title: string;
  titleAr: string;
  course: string;
  courseAr: string;
  type: 'quiz' | 'midterm' | 'final' | 'practice';
  questions: number;
  duration: number;
  totalMarks: number;
  avgScore: number;
  attempts: number;
  passRate: number;
  scheduledFor?: string;
  status: 'draft' | 'published' | 'archived';
  grade: string;
}

interface Question {
  id: string;
  text: string;
  textAr: string;
  type: 'mcq' | 'true-false' | 'short' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  subjectAr: string;
  correctRate: number;
  usageCount: number;
  marks: number;
}

interface Student {
  id: string;
  name: string;
  nameAr: string;
  avatar: string;
  grade: string;
  gradeAr: string;
  school: string;
  parent: string;
  parentPhone: string;
  enrolledCourses: number;
  avgScore: number;
  attendance: number;
  attendancePct: number;
  lastActive: string;
  status: 'active' | 'inactive' | 'suspended';
  balance: number;
}

interface Teacher {
  id: string;
  name: string;
  nameAr: string;
  avatar: string;
  subject: string;
  subjectAr: string;
  courses: number;
  students: number;
  rating: number;
  reviews: number;
  liveHours: number;
  status: 'active' | 'away' | 'offline';
  salary: number;
  joinDate: string;
}

interface Parent {
  id: string;
  name: string;
  nameAr: string;
  avatar: string;
  phone: string;
  email: string;
  children: number;
  childrenNames: string[];
  notifications: boolean;
  balance: number;
  lastLogin: string;
}

interface BlogPost {
  id: string;
  title: string;
  titleAr: string;
  author: string;
  authorAr: string;
  excerpt: string;
  excerptAr: string;
  category: string;
  categoryAr: string;
  publishedAt: string;
  views: number;
  comments: number;
  likes: number;
  readTime: number;
  status: 'published' | 'draft';
  thumbnail: string;
}

interface LibraryItem {
  id: string;
  title: string;
  titleAr: string;
  type: 'pdf' | 'video' | 'audio' | 'slide' | 'doc';
  size: string;
  pages?: number;
  course: string;
  courseAr: string;
  downloads: number;
  views: number;
  uploadedAt: string;
  uploadedBy: string;
  icon: string;
}

interface Review {
  id: string;
  course: string;
  courseAr: string;
  student: string;
  studentAr: string;
  rating: number;
  comment: string;
  commentAr: string;
  date: string;
  helpful: number;
  replied: boolean;
}

interface Announcement {
  id: string;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  audience: 'all' | 'students' | 'parents' | 'teachers';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  author: string;
  pinned: boolean;
}

interface ClassRoom {
  id: string;
  name: string;
  nameAr: string;
  grade: string;
  gradeAr: string;
  teacher: string;
  teacherAr: string;
  students: number;
  capacity: number;
  room: string;
  schedule: string;
  nextSession: string;
  subject: string;
  subjectAr: string;
}

interface Message {
  id: number;
  from: string;
  fromAr: string;
  avatar: string;
  subject: string;
  subjectAr: string;
  preview: string;
  previewAr: string;
  time: string;
  unread: boolean;
  priority: 'low' | 'normal' | 'high';
}

interface ScheduleItem {
  id: string;
  day: string;
  dayAr: string;
  time: string;
  duration: string;
  title: string;
  titleAr: string;
  teacher: string;
  teacherAr: string;
  grade: string;
  gradeAr: string;
  type: 'live' | 'exam' | 'review' | 'homework';
  room: string;
}

interface FinancialRecord {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  categoryAr: string;
  amount: number;
  description: string;
  descriptionAr: string;
  by: string;
  status: 'completed' | 'pending' | 'failed';
}

@Component({
  selector: 'app-almotafiq-preview',
  standalone: true,
  imports: [PreviewShellComponent, DecimalPipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-preview-shell
      brand="📚"
      title="Al-Motafiq"
      [subtitle]="lang() === 'ar' ? 'منصة المتفوق التعليمية · 4 بوابات · بث مباشر' : 'Al-Motafiq Learning Platform · 4 Portals · Live Streaming'"
      [nav]="nav()"
      [active]="active()"
      (activeChange)="onNav($any($event))"
      [toolbarActions]="toolbar()"
      [notifications]="notifs()"
      [searchPlaceholder]="searchPlaceholder()"
      (searchChange)="onSearch($event)"
    >
      <div class="am-bar">
        <div class="lang-switch">
          <button class="ls-btn" [class.active]="lang() === 'en'" (click)="lang.set('en')">EN</button>
          <button class="ls-btn" [class.active]="lang() === 'ar'" (click)="lang.set('ar')">AR</button>
        </div>

        <div class="portal-switch">
          @for (p of portals; track p.id) {
            <button class="ps-btn"
                    [class.active]="portal() === p.id"
                    [style.--c]="p.color"
                    (click)="portal.set($any(p.id))">
              <span class="ps-icon">{{ p.icon }}</span>
              <span class="ps-label">{{ lang() === 'ar' ? p.labelAr : p.label }}</span>
            </button>
          }
        </div>

        <div class="live-indicator" [class.live]="liveNow() > 0">
          @if (liveNow() > 0) {
            <span class="live-dot"></span>
            <span>{{ liveNow() }} {{ lang() === 'ar' ? 'مباشر الآن' : 'live now' }}</span>
          } @else {
            <span class="idle-dot"></span>
            <span>{{ lang() === 'ar' ? 'لا يوجد بث' : 'no live' }}</span>
          }
        </div>
      </div>

      @switch (active()) {

        @case ('dashboard') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Overview', 'نظرة عامة') }}</span>
                <h3>{{ t('Dashboard', 'لوحة التحكم') }}</h3>
                <p>{{ t('Full platform snapshot across 4 portals', 'نظرة شاملة على المنصة عبر 4 بوابات') }}</p>
              </div>
              <div class="view-actions">
                @if (liveNow() > 0) {
                  <button class="pill danger" (click)="active.set('live')">
                    <span class="pulse"></span>
                    {{ liveNow() }} {{ t('live', 'مباشر') }}
                  </button>
                }
                <button class="pill primary" (click)="startLiveSession()">
                  🎥 {{ t('Go Live', 'بدء بث') }}
                </button>
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

            <div class="grid-2">
              <section class="card">
                <header class="card-head">
                  <div>
                    <h4>{{ t('Live sessions', 'الجلسات المباشرة') }}</h4>
                    <small>{{ sessions().length }} {{ t('total', 'إجمالي') }}</small>
                  </div>
                  <button class="pill-sm" (click)="active.set('live')">{{ t('View all', 'عرض الكل') }}</button>
                </header>
                <ul class="feed">
                  @for (s of sessions().slice(0, 5); track s.id) {
                    <li class="feed-item" [attr.data-s]="s.status" (click)="openSession(s.id)">
                      <span class="fi-icon" [attr.data-s]="s.status">
                        {{ s.status === 'live' ? '🔴' : s.status === 'scheduled' ? '📅' : '✅' }}
                      </span>
                      <div class="fi-body">
                        <div class="fi-row">
                          <b>{{ t(s.title, s.titleAr) }}</b>
                          <span class="fi-status" [attr.data-s]="s.status">{{ t(s.status, statusAr(s.status)) }}</span>
                        </div>
                        <div class="fi-meta">
                          <span>👨‍🏫 {{ t(s.teacher, s.teacherAr) }}</span>
                          <span>👥 {{ s.viewers }}</span>
                          <span>📚 {{ t(s.grade, s.gradeAr) }}</span>
                        </div>
                      </div>
                    </li>
                  }
                </ul>
              </section>

              <section class="card">
                <header class="card-head">
                  <div>
                    <h4>{{ t('Recent enrollments', 'أحدث التسجيلات') }}</h4>
                    <small>{{ t('Last 7 days', 'آخر 7 أيام') }}</small>
                  </div>
                </header>
                <ul class="feed">
                  @for (s of students().slice(0, 5); track s.id) {
                    <li class="feed-item" (click)="openStudent(s.id)">
                      <span class="fi-avatar">{{ s.avatar }}</span>
                      <div class="fi-body">
                        <div class="fi-row">
                          <b>{{ t(s.name, s.nameAr) }}</b>
                          <span class="fi-tag ok">{{ s.avgScore }}%</span>
                        </div>
                        <div class="fi-meta">
                          <span>{{ t(s.grade, s.gradeAr) }}</span>
                          <span>📚 {{ s.enrolledCourses }} {{ t('courses', 'كورسات') }}</span>
                        </div>
                      </div>
                    </li>
                  }
                </ul>
              </section>
            </div>

            <section class="card">
              <header class="card-head">
                <div>
                  <h4>{{ t('Top courses', 'أفضل الكورسات') }}</h4>
                  <small>{{ courses().length }} {{ t('published', 'منشور') }}</small>
                </div>
                <button class="pill-sm" (click)="active.set('courses')">{{ t('View all', 'عرض الكل') }}</button>
              </header>
              <div class="courses-row">
                @for (c of topCourses(); track c.id) {
                  <div class="course-mini" [style.--c]="courseColor(c)" (click)="openCourse(c.id)">
                    <span class="cm-icon">{{ c.icon }}</span>
                    <div class="cm-body">
                      <b>{{ t(c.title, c.titleAr) }}</b>
                      <small>{{ t(c.teacher, c.teacherAr) }}</small>
                    </div>
                    <div class="cm-meta">
                      <span class="cm-rating">★ {{ c.rating }}</span>
                      <span class="cm-students">{{ c.students }} 👥</span>
                    </div>
                  </div>
                }
              </div>
            </section>

            <div class="grid-2">
              <section class="card">
                <header class="card-head"><h4>{{ t('Today schedule', 'جدول اليوم') }}</h4></header>
                <ul class="schedule-list">
                  @for (sch of todaySchedule(); track sch.id) {
                    <li class="sch-row" [attr.data-t]="sch.type">
                      <span class="sch-time">{{ sch.time }}</span>
                      <div class="sch-body">
                        <b>{{ t(sch.title, sch.titleAr) }}</b>
                        <small>{{ t(sch.teacher, sch.teacherAr) }} · {{ t(sch.grade, sch.gradeAr) }}</small>
                      </div>
                      <span class="sch-type">{{ t(sch.type, schTypeAr(sch.type)) }}</span>
                    </li>
                  }
                </ul>
              </section>

              <section class="card">
                <header class="card-head"><h4>{{ t('System status', 'حالة النظام') }}</h4></header>
                <ul class="status-list">
                  @for (st of systemStatus(); track st.label) {
                    <li class="status-row">
                      <span class="status-dot" [attr.data-s]="st.status"></span>
                      <div>
                        <b>{{ st.label }}</b>
                        <small>{{ st.value }}</small>
                      </div>
                      <span class="status-tag" [attr.data-s]="st.status">{{ st.tag }}</span>
                    </li>
                  }
                </ul>
              </section>
            </div>
          </div>
        }

        @case ('live') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Streaming', 'البث') }}</span>
                <h3>{{ t('Live Sessions', 'الجلسات المباشرة') }}</h3>
                <p>{{ liveNow() }} {{ t('live', 'مباشر') }} · {{ sessions().length }} {{ t('total', 'إجمالي') }}</p>
              </div>
              <div class="view-actions">
                <button class="pill primary" (click)="startLiveSession()">🎥 {{ t('Start stream', 'بدء بث') }}</button>
              </div>
            </header>

            <div class="live-grid">
              @for (s of sessions(); track s.id) {
                <article class="live-card" [attr.data-s]="s.status" (click)="openSession(s.id)">
                  <div class="lc-thumb" [style.background]="liveBg(s)">
                    <span class="lc-emoji">{{ s.thumbnail }}</span>
                    @if (s.status === 'live') {
                      <span class="lc-badge live">
                        <span class="pulse"></span> LIVE
                      </span>
                    } @else if (s.status === 'scheduled') {
                      <span class="lc-badge scheduled">📅 {{ s.startedAt }}</span>
                    } @else {
                      <span class="lc-badge ended">✓ ENDED</span>
                    }
                    @if (s.status === 'live') {
                      <div class="lc-viewers">
                        <span>👁 {{ s.viewers }}</span>
                      </div>
                    }
                  </div>
                  <div class="lc-body">
                    <div class="lc-top">
                      <b>{{ t(s.title, s.titleAr) }}</b>
                      <span class="lc-quality">{{ s.quality }}</span>
                    </div>
                    <div class="lc-teacher">
                      <span>👨‍🏫 {{ t(s.teacher, s.teacherAr) }}</span>
                    </div>
                    <div class="lc-meta">
                      <span>📚 {{ t(s.course, s.courseAr) }}</span>
                      <span>🎓 {{ t(s.grade, s.gradeAr) }}</span>
                    </div>
                    <div class="lc-stats">
                      <span>💬 {{ s.chatMessages }}</span>
                      <span>❤️ {{ s.reactions }}</span>
                      <span>⏱ {{ s.duration }}</span>
                    </div>
                  </div>
                </article>
              }
            </div>
          </div>
        }

        @case ('recorded') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Library', 'المكتبة') }}</span>
                <h3>{{ t('Recorded Sessions', 'الجلسات المسجلة') }}</h3>
                <p>{{ recorded().length }} {{ t('recordings', 'تسجيل') }}</p>
              </div>
            </header>

            <div class="recorded-grid">
              @for (r of recorded(); track r.id) {
                <article class="rec-card" (click)="playRecording(r.id)">
                  <div class="rc-thumb" [style.background]="liveBg(r)">
                    <span class="rc-play">▶</span>
                    <span class="rc-duration">{{ r.duration }}</span>
                    <span class="rc-hd">{{ r.quality }}</span>
                  </div>
                  <div class="rc-body">
                    <b>{{ t(r.title, r.titleAr) }}</b>
                    <small>{{ t(r.teacher, r.teacherAr) }}</small>
                    <div class="rc-meta">
                      <span>👁 {{ r.peak }}</span>
                      <span>📅 {{ r.startedAt }}</span>
                    </div>
                  </div>
                </article>
              }
            </div>
          </div>
        }

        @case ('schedule') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Planning', 'التخطيط') }}</span>
                <h3>{{ t('Schedule', 'الجدول') }}</h3>
                <p>{{ t('Weekly sessions across all grades', 'الجلسات الأسبوعية لكل الصفوف') }}</p>
              </div>
              <div class="view-actions">
                <select class="sel" [ngModel]="scheduleGrade()" (ngModelChange)="scheduleGrade.set($event)">
                  <option value="all">{{ t('All grades', 'كل الصفوف') }}</option>
                  @for (g of grades; track g.id) {
                    <option [value]="g.id">{{ t(g.name, g.nameAr) }}</option>
                  }
                </select>
              </div>
            </header>

            <div class="schedule-grid">
              @for (day of weekDays; track day.id) {
                <div class="day-col">
                  <header class="day-head">
                    <b>{{ t(day.name, day.nameAr) }}</b>
                    <span>{{ countByDay(day.id) }}</span>
                  </header>
                  <div class="day-items">
                    @for (item of byDay(day.id); track item.id) {
                      <div class="day-item" [attr.data-t]="item.type">
                        <span class="di-time">{{ item.time }}</span>
                        <b>{{ t(item.title, item.titleAr) }}</b>
                        <small>{{ t(item.teacher, item.teacherAr) }}</small>
                        <div class="di-meta">
                          <span>{{ t(item.grade, item.gradeAr) }}</span>
                          <span class="di-type">{{ t(item.type, schTypeAr(item.type)) }}</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        @case ('courses') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Catalog', 'الكتالوج') }}</span>
                <h3>{{ t('Courses', 'الكورسات') }}</h3>
                <p>{{ courses().length }} {{ t('total', 'إجمالي') }}</p>
              </div>
              <div class="view-actions">
                <button class="pill primary" (click)="toast.success(t('New course', 'كورس جديد'), t('Coming soon', 'قريباً'))">＋ {{ t('New course', 'كورس جديد') }}</button>
              </div>
            </header>

            <section class="course-filters">
              <button class="cf-chip" [class.active]="courseFilter() === 'all'" (click)="courseFilter.set('all')">
                {{ t('All', 'الكل') }} <span class="cf-count">{{ courses().length }}</span>
              </button>
              <button class="cf-chip" [class.active]="courseFilter() === 'published'" (click)="courseFilter.set('published')">
                {{ t('Published', 'منشور') }} <span class="cf-count">{{ countByStatus('published') }}</span>
              </button>
              <button class="cf-chip" [class.active]="courseFilter() === 'draft'" (click)="courseFilter.set('draft')">
                {{ t('Draft', 'مسودة') }} <span class="cf-count">{{ countByStatus('draft') }}</span>
              </button>
              <button class="cf-chip" [class.active]="courseFilter() === 'review'" (click)="courseFilter.set('review')">
                {{ t('Review', 'مراجعة') }} <span class="cf-count">{{ countByStatus('review') }}</span>
              </button>
            </section>

            <div class="courses-grid">
              @for (c of filteredCourses(); track c.id) {
                <article class="course-card" [attr.data-s]="c.status" (click)="openCourse(c.id)" (contextmenu)="onCourseContext($event, c)">
                  <div class="cc-thumb" [style.background]="courseBg(c)">
                    <span class="cc-emoji">{{ c.icon }}</span>
                    <span class="cc-lang" [attr.data-l]="c.language">{{ c.language === 'ar' ? '🇪🇬 AR' : c.language === 'en' ? '🇬🇧 EN' : '🌐 BOTH' }}</span>
                    @if (c.discount) {
                      <span class="cc-discount">−{{ c.discount }}%</span>
                    }
                  </div>
                  <div class="cc-body">
                    <span class="cc-subject">{{ t(c.subject, c.subjectAr) }} · {{ t(c.grade, c.gradeAr) }}</span>
                    <b class="cc-title">{{ t(c.title, c.titleAr) }}</b>
                    <small class="cc-teacher">👨‍🏫 {{ t(c.teacher, c.teacherAr) }}</small>
                    <div class="cc-stats">
                      <span>📖 {{ c.lessons }} {{ t('lessons', 'درس') }}</span>
                      <span>⏱ {{ c.hours }}h</span>
                      <span>👥 {{ c.students }}</span>
                    </div>
                    <div class="cc-rating">
                      <span class="stars">★★★★★</span>
                      <span>{{ c.rating }}</span>
                      <span class="muted">({{ c.reviews }})</span>
                    </div>
                    <div class="cc-foot">
                      <div class="cc-price">
                        @if (c.discount) {
                          <s>{{ c.price | number }}</s>
                        }
                        <b>{{ (c.price * (100 - (c.discount ?? 0)) / 100) | number }} EGP</b>
                      </div>
                      <span class="cc-status" [attr.data-s]="c.status">{{ t(c.status, courseStatusAr(c.status)) }}</span>
                    </div>
                  </div>
                </article>
              }
            </div>
          </div>
        }

        @case ('library') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Files', 'الملفات') }}</span>
                <h3>{{ t('Library', 'المكتبة') }}</h3>
                <p>{{ library().length }} {{ t('files', 'ملف') }}</p>
              </div>
              <div class="view-actions">
                <select class="sel" [ngModel]="libType()" (ngModelChange)="libType.set($event)">
                  <option value="all">{{ t('All types', 'كل الأنواع') }}</option>
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="slide">Slides</option>
                  <option value="doc">Docs</option>
                </select>
                <button class="pill primary" (click)="toast.success(t('Upload', 'تحميل'))">＋ {{ t('Upload', 'تحميل') }}</button>
              </div>
            </header>

            <div class="library-grid">
              @for (l of filteredLibrary(); track l.id) {
                <article class="lib-card" [attr.data-t]="l.type" (click)="openLibraryItem(l.id)">
                  <div class="lc-head">
                    <span class="lc-icon">{{ l.icon }}</span>
                    <div>
                      <b>{{ t(l.title, l.titleAr) }}</b>
                      <small>{{ t(l.course, l.courseAr) }}</small>
                    </div>
                    <span class="lc-type">{{ l.type.toUpperCase() }}</span>
                  </div>
                  <div class="lc-body">
                    <div class="lc-meta">
                      <span>📦 {{ l.size }}</span>
                      @if (l.pages) { <span>📄 {{ l.pages }} {{ t('pages', 'صفحة') }}</span> }
                    </div>
                    <div class="lc-stats">
                      <span>👁 {{ l.views }}</span>
                      <span>⬇ {{ l.downloads }}</span>
                      <span>📅 {{ l.uploadedAt }}</span>
                    </div>
                  </div>
                </article>
              }
            </div>
          </div>
        }

        @case ('exams') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Assessment', 'التقييم') }}</span>
                <h3>{{ t('Exams', 'الامتحانات') }}</h3>
                <p>{{ exams().length }} {{ t('total', 'إجمالي') }}</p>
              </div>
              <div class="view-actions">
                <button class="pill primary" (click)="toast.success(t('New exam', 'امتحان جديد'))">＋ {{ t('New exam', 'امتحان جديد') }}</button>
              </div>
            </header>

            <section class="exam-filters">
              @for (f of examFilters; track f.id) {
                <button class="ef-chip" [class.active]="examFilter() === f.id" (click)="examFilter.set(f.id)">
                  {{ t(f.label, f.labelAr) }}
                  <span class="ef-count">{{ countExamsBy(f.id) }}</span>
                </button>
              }
            </section>

            <div class="exam-grid">
              @for (e of filteredExams(); track e.id) {
                <article class="exam-card" [attr.data-s]="e.status" [attr.data-t]="e.type">
                  <header class="ec-head">
                    <span class="ec-type">{{ t(e.type, examTypeAr(e.type)) }}</span>
                    <span class="ec-status" [attr.data-s]="e.status">{{ t(e.status, examStatusAr(e.status)) }}</span>
                  </header>
                  <b class="ec-title">{{ t(e.title, e.titleAr) }}</b>
                  <small class="ec-course">{{ t(e.course, e.courseAr) }} · {{ e.grade }}</small>
                  <div class="ec-stats">
                    <div class="ec-stat">
                      <b>{{ e.questions }}</b>
                      <small>{{ t('Questions', 'أسئلة') }}</small>
                    </div>
                    <div class="ec-stat">
                      <b>{{ e.duration }}m</b>
                      <small>{{ t('Duration', 'المدة') }}</small>
                    </div>
                    <div class="ec-stat">
                      <b>{{ e.totalMarks }}</b>
                      <small>{{ t('Marks', 'درجات') }}</small>
                    </div>
                  </div>
                  <div class="ec-progress">
                    <div class="ecp-head">
                      <span>{{ t('Avg score', 'متوسط') }}</span>
                      <b>{{ e.avgScore }}%</b>
                    </div>
                    <div class="ecp-track">
                      <div class="ecp-fill" [style.width.%]="e.avgScore" [class.good]="e.avgScore >= 75" [class.warn]="e.avgScore < 60"></div>
                    </div>
                  </div>
                  <div class="ec-foot">
                    <span>👥 {{ e.attempts }} {{ t('attempts', 'محاولة') }}</span>
                    <span>✓ {{ e.passRate }}% {{ t('pass', 'نجاح') }}</span>
                    @if (e.scheduledFor) {
                      <span class="ec-sched">📅 {{ e.scheduledFor }}</span>
                    }
                  </div>
                </article>
              }
            </div>
          </div>
        }

        @case ('questions') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Bank', 'البنك') }}</span>
                <h3>{{ t('Question Bank', 'بنك الأسئلة') }}</h3>
                <p>{{ questions().length }} {{ t('questions', 'سؤال') }}</p>
              </div>
              <div class="view-actions">
                <select class="sel" [ngModel]="qFilter()" (ngModelChange)="qFilter.set($event)">
                  <option value="all">{{ t('All subjects', 'كل المواد') }}</option>
                  @for (s of subjects; track s.id) {
                    <option [value]="s.id">{{ t(s.name, s.nameAr) }}</option>
                  }
                </select>
                <button class="pill primary" (click)="toast.success(t('Add question', 'إضافة سؤال'))">＋ {{ t('Add', 'إضافة') }}</button>
              </div>
            </header>

            <div class="questions-list">
              @for (q of filteredQuestions(); track q.id) {
                <article class="q-card" [attr.data-d]="q.difficulty" (contextmenu)="onQuestionContext($event, q)">
                  <header class="q-head">
                    <span class="q-id">#{{ q.id }}</span>
                    <span class="q-type" [attr.data-t]="q.type">{{ t(q.type, qTypeAr(q.type)) }}</span>
                    <span class="q-diff" [attr.data-d]="q.difficulty">{{ t(q.difficulty, qDiffAr(q.difficulty)) }}</span>
                    <span class="q-marks">{{ q.marks }} {{ t('marks', 'درجة') }}</span>
                  </header>
                  <p class="q-text">{{ t(q.text, q.textAr) }}</p>
                  <footer class="q-foot">
                    <div class="q-stats">
                      <span class="q-correct" [class.low]="q.correctRate < 50">✓ {{ q.correctRate }}%</span>
                      <span>📊 {{ q.usageCount }} {{ t('used', 'مرة') }}</span>
                      <span>📚 {{ t(subjectName(q.subject), subjectNameAr(q.subject)) }}</span>
                    </div>
                  </footer>
                </article>
              }
            </div>
          </div>
        }

        @case ('reviews') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Feedback', 'التقييمات') }}</span>
                <h3>{{ t('Reviews', 'المراجعات') }}</h3>
                <p>{{ reviews().length }} {{ t('total', 'إجمالي') }} · {{ avgRating() }} ★</p>
              </div>
            </header>

            <section class="rating-summary">
              <div class="rs-big">
                <b>{{ avgRating() }}</b>
                <span class="stars">★★★★★</span>
                <small>{{ reviews().length }} {{ t('reviews', 'تقييم') }}</small>
              </div>
              <div class="rs-bars">
                @for (r of ratingBreakdown(); track r.stars) {
                  <div class="rs-row">
                    <span>{{ r.stars }} ★</span>
                    <div class="rs-track"><div class="rs-fill" [style.width.%]="r.pct"></div></div>
                    <span class="rs-count">{{ r.count }}</span>
                  </div>
                }
              </div>
            </section>

            <div class="reviews-list">
              @for (r of reviews(); track r.id) {
                <article class="review-card">
                  <header class="rv-head">
                    <span class="rv-avatar">{{ r.student.charAt(0) }}</span>
                    <div>
                      <b>{{ t(r.student, r.studentAr) }}</b>
                      <small>{{ t(r.course, r.courseAr) }}</small>
                    </div>
                    <div class="rv-rating">
                      <span class="stars">{{ repeatStars(r.rating) }}</span>
                      <small class="mono">{{ r.date }}</small>
                    </div>
                  </header>
                  <p class="rv-comment">{{ t(r.comment, r.commentAr) }}</p>
                  <footer class="rv-foot">
                    <span>👍 {{ r.helpful }} {{ t('helpful', 'مفيد') }}</span>
                    @if (r.replied) {
                      <span class="rv-replied">✓ {{ t('Replied', 'تم الرد') }}</span>
                    } @else {
                      <button class="pill-sm primary" (click)="replyReview(r.id)">💬 {{ t('Reply', 'رد') }}</button>
                    }
                  </footer>
                </article>
              }
            </div>
          </div>
        }

        @case ('homework') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Assignments', 'الواجبات') }}</span>
                <h3>{{ t('Homework', 'الواجب المنزلي') }}</h3>
                <p>{{ t('Track submissions and grading', 'متابعة التسليمات والتصحيح') }}</p>
              </div>
            </header>

            <div class="homework-stats">
              @for (h of homeworkStats(); track h.label) {
                <div class="hw-card" [style.--c]="h.color">
                  <b>{{ h.value }}</b>
                  <small>{{ t(h.label, h.labelAr) }}</small>
                </div>
              }
            </div>

            <section class="card">
              <header class="card-head"><h4>{{ t('Pending grading', 'بانتظار التصحيح') }}</h4></header>
              <div class="table-wrap">
                <header class="thead cols-5">
                  <span>{{ t('Student', 'الطالب') }}</span>
                  <span>{{ t('Assignment', 'الواجب') }}</span>
                  <span>{{ t('Submitted', 'تم التسليم') }}</span>
                  <span>{{ t('Status', 'الحالة') }}</span>
                  <span></span>
                </header>
                @for (h of homeworkSubmissions(); track h.id) {
                  <div class="trow cols-5">
                    <span class="cell-name">{{ t(h.student, h.studentAr) }}</span>
                    <span>{{ t(h.assignment, h.assignmentAr) }}</span>
                    <span class="mono small">{{ h.submitted }}</span>
                    <span><span class="st" [attr.data-s]="h.status">{{ t(h.status, hwStatusAr(h.status)) }}</span></span>
                    <span class="row-actions">
                      @if (h.status === 'submitted') {
                        <button class="row-action primary" (click)="gradeHomework(h.id)">✎</button>
                      }
                      <button class="row-action" (click)="openStudent(h.studentId)">👁</button>
                    </span>
                  </div>
                }
              </div>
            </section>
          </div>
        }

        @case ('students') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('People', 'الأشخاص') }}</span>
                <h3>{{ t('Students', 'الطلاب') }}</h3>
                <p>{{ students().length }} {{ t('registered', 'مسجل') }}</p>
              </div>
              <div class="view-actions">
                <button class="pill primary" (click)="toast.success(t('Add student', 'إضافة طالب'))">＋ {{ t('Add student', 'إضافة طالب') }}</button>
              </div>
            </header>

            <div class="students-grid">
              @for (s of students(); track s.id) {
                <article class="student-card" [attr.data-s]="s.status" (click)="openStudent(s.id)" (contextmenu)="onStudentContext($event, s)">
                  <header class="sc-head">
                    <span class="sc-avatar">{{ s.avatar }}</span>
                    <div>
                      <b>{{ t(s.name, s.nameAr) }}</b>
                      <small>{{ t(s.grade, s.gradeAr) }}</small>
                    </div>
                    <span class="sc-status" [attr.data-s]="s.status">{{ t(s.status, studentStatusAr(s.status)) }}</span>
                  </header>
                  <div class="sc-stats">
                    <div><b class="mono">{{ s.avgScore }}%</b><small>{{ t('Avg', 'متوسط') }}</small></div>
                    <div><b class="mono">{{ s.attendancePct }}%</b><small>{{ t('Attend', 'حضور') }}</small></div>
                    <div><b class="mono">{{ s.enrolledCourses }}</b><small>{{ t('Courses', 'كورسات') }}</small></div>
                  </div>
                  <footer class="sc-foot">
                    <span>👨‍👩‍👧 {{ s.parent }}</span>
                    <span class="mono small">{{ s.lastActive }}</span>
                  </footer>
                </article>
              }
            </div>
          </div>
        }

        @case ('teachers') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Team', 'الفريق') }}</span>
                <h3>{{ t('Teachers', 'المعلمون') }}</h3>
                <p>{{ teachers().length }} {{ t('active', 'نشط') }}</p>
              </div>
              <div class="view-actions">
                <button class="pill primary" (click)="toast.success(t('Add teacher', 'إضافة معلم'))">＋ {{ t('Add', 'إضافة') }}</button>
              </div>
            </header>

            <div class="teachers-grid">
              @for (tc of teachers(); track tc.id) {
                <article class="teacher-card" [attr.data-s]="tc.status" (click)="openTeacher(tc.id)">
                  <header class="tc-head">
                    <span class="tc-avatar">{{ tc.avatar }}</span>
                    <div>
                      <b>{{ t(tc.name, tc.nameAr) }}</b>
                      <small>{{ t(tc.subject, tc.subjectAr) }}</small>
                    </div>
                    <span class="tc-status" [attr.data-s]="tc.status">{{ t(tc.status, teacherStatusAr(tc.status)) }}</span>
                  </header>
                  <div class="tc-stats">
                    <div><b class="mono">{{ tc.courses }}</b><small>{{ t('Courses', 'كورسات') }}</small></div>
                    <div><b class="mono">{{ tc.students }}</b><small>{{ t('Students', 'طلاب') }}</small></div>
                    <div><b class="mono">{{ tc.liveHours }}h</b><small>{{ t('Live', 'بث') }}</small></div>
                  </div>
                  <div class="tc-rating">
                    <span class="stars">★★★★★</span>
                    <b>{{ tc.rating }}</b>
                    <small class="muted">({{ tc.reviews }})</small>
                  </div>
                  <footer class="tc-foot">
                    <span>💰 {{ tc.salary | number }} EGP</span>
                    <span class="mono small">{{ tc.joinDate }}</span>
                  </footer>
                </article>
              }
            </div>
          </div>
        }

        @case ('parents') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Guardians', 'أولياء الأمور') }}</span>
                <h3>{{ t('Parents', 'الأهالي') }}</h3>
                <p>{{ parents().length }} {{ t('registered', 'مسجل') }}</p>
              </div>
            </header>

            <div class="parents-grid">
              @for (p of parents(); track p.id) {
                <article class="parent-card" (click)="openParent(p.id)">
                  <header class="pc-head">
                    <span class="pc-avatar">{{ p.avatar }}</span>
                    <div>
                      <b>{{ t(p.name, p.nameAr) }}</b>
                      <small class="mono">{{ p.phone }}</small>
                    </div>
                    <span class="pc-children">{{ p.children }} 👶</span>
                  </header>
                  <div class="pc-children-list">
                    @for (c of p.childrenNames; track c) {
                      <span class="pc-child">{{ c }}</span>
                    }
                  </div>
                  <footer class="pc-foot">
                    <span>💰 {{ p.balance | number }} EGP</span>
                    <span class="mono small">{{ p.lastLogin }}</span>
                  </footer>
                </article>
              }
            </div>
          </div>
        }

        @case ('classes') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Rooms', 'الفصول') }}</span>
                <h3>{{ t('Classes', 'الفصول الدراسية') }}</h3>
                <p>{{ classes().length }} {{ t('active', 'نشط') }}</p>
              </div>
            </header>

            <div class="classes-grid">
              @for (c of classes(); track c.id) {
                <article class="class-card" (click)="openClass(c.id)">
                  <header class="cl-head">
                    <span class="cl-icon">🏫</span>
                    <div>
                      <b>{{ t(c.name, c.nameAr) }}</b>
                      <small>{{ t(c.grade, c.gradeAr) }} · {{ t(c.subject, c.subjectAr) }}</small>
                    </div>
                    <span class="cl-room mono">{{ c.room }}</span>
                  </header>
                  <div class="cl-teacher">
                    <span>👨‍🏫 {{ t(c.teacher, c.teacherAr) }}</span>
                  </div>
                  <div class="cl-capacity">
                    <div class="cap-head">
                      <span>{{ t('Capacity', 'السعة') }}</span>
                      <span class="mono">{{ c.students }}/{{ c.capacity }}</span>
                    </div>
                    <div class="cap-track">
                      <div class="cap-fill" [style.width.%]="(c.students / c.capacity) * 100" [class.full]="c.students / c.capacity > 0.9"></div>
                    </div>
                  </div>
                  <footer class="cl-foot">
                    <span>🕐 {{ c.schedule }}</span>
                    <span class="cl-next">{{ t('Next', 'التالي') }}: {{ c.nextSession }}</span>
                  </footer>
                </article>
              }
            </div>
          </div>
        }

        @case ('admin') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Control', 'التحكم') }}</span>
                <h3>{{ t('Admin Portal', 'بوابة المدير') }}</h3>
                <p>{{ t('Full platform control', 'تحكم كامل بالمنصة') }}</p>
              </div>
            </header>

            <section class="admin-kpis">
              @for (k of adminKpis(); track k.label) {
                <article class="ak" [style.--c]="k.color">
                  <span class="ak-icon">{{ k.icon }}</span>
                  <b class="ak-val">{{ k.value }}</b>
                  <span class="ak-label">{{ k.label }}</span>
                  <div class="ak-bar"><div class="ak-fill" [style.width.%]="k.pct"></div></div>
                </article>
              }
            </section>

            <div class="grid-2">
              <section class="card">
                <header class="card-head"><h4>{{ t('Quick actions', 'إجراءات سريعة') }}</h4></header>
                <div class="quick-actions">
                  @for (a of adminActions; track a.id) {
                    <button class="qa-btn" (click)="runAdminAction(a)">
                      <span class="qa-icon">{{ a.icon }}</span>
                      <div>
                        <b>{{ t(a.label, a.labelAr) }}</b>
                        <small>{{ t(a.desc, a.descAr) }}</small>
                      </div>
                    </button>
                  }
                </div>
              </section>

              <section class="card">
                <header class="card-head"><h4>{{ t('Recent activity', 'النشاط الأخير') }}</h4></header>
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

            <section class="card">
              <header class="card-head"><h4>{{ t('Permissions matrix', 'مصفوفة الصلاحيات') }}</h4></header>
              <div class="perm-table">
                <header class="perm-head">
                  <span>{{ t('Feature', 'الميزة') }}</span>
                  @for (r of portalRoles; track r.id) {
                    <span [style.color]="r.color">{{ t(r.label, r.labelAr) }}</span>
                  }
                </header>
                @for (p of permissions(); track p.feature) {
                  <div class="perm-row">
                    <span class="pr-feature">{{ t(p.feature, p.featureAr) }}</span>
                    @for (v of p.values; track $index) {
                      <span class="pr-val" [class.yes]="v" [class.no]="!v">{{ v ? '✓' : '✕' }}</span>
                    }
                  </div>
                }
              </div>
            </section>
          </div>
        }

        @case ('finances') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Money', 'المالية') }}</span>
                <h3>{{ t('Finances', 'الشؤون المالية') }}</h3>
                <p>{{ t('Income, expenses, and balances', 'الإيرادات والمصروفات والأرصدة') }}</p>
              </div>
              <div class="view-actions">
                <button class="pill" (click)="exportFinances()">📊 {{ t('Export', 'تصدير') }}</button>
              </div>
            </header>

            <section class="finance-kpis">
              @for (k of financeKpis(); track k.label) {
                <div class="fk" [style.--c]="k.color">
                  <span class="fk-icon">{{ k.icon }}</span>
                  <b class="fk-val">{{ k.value }}</b>
                  <span class="fk-label">{{ k.label }}</span>
                </div>
              }
            </section>

            <section class="card">
              <header class="card-head"><h4>{{ t('Recent transactions', 'أحدث المعاملات') }}</h4></header>
              <div class="table-wrap">
                <header class="thead cols-5">
                  <span>{{ t('Date', 'التاريخ') }}</span>
                  <span>{{ t('Category', 'الفئة') }}</span>
                  <span>{{ t('Description', 'الوصف') }}</span>
                  <span>{{ t('Amount', 'المبلغ') }}</span>
                  <span>{{ t('Status', 'الحالة') }}</span>
                </header>
                @for (f of finances(); track f.id) {
                  <div class="trow cols-5">
                    <span class="mono small">{{ f.date }}</span>
                    <span class="tag">{{ t(f.category, f.categoryAr) }}</span>
                    <span>{{ t(f.description, f.descriptionAr) }}</span>
                    <span class="mono amount" [class.pos]="f.type === 'income'" [class.neg]="f.type === 'expense'">
                      {{ f.type === 'income' ? '+' : '−' }} {{ f.amount | number }} EGP
                    </span>
                    <span><span class="st" [attr.data-s]="f.status">{{ t(f.status, finStatusAr(f.status)) }}</span></span>
                  </div>
                }
              </div>
            </section>
          </div>
        }

        @case ('reports') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Insights', 'الرؤى') }}</span>
                <h3>{{ t('Reports', 'التقارير') }}</h3>
                <p>{{ t('Generate and analyze', 'إنشاء وتحليل') }}</p>
              </div>
            </header>

            <section class="report-grid">
              @for (r of reportTemplates; track r.id) {
                <article class="report-card" [style.--c]="r.color" (click)="generateReport(r)">
                  <span class="rc-icon">{{ r.icon }}</span>
                  <b>{{ t(r.name, r.nameAr) }}</b>
                  <p>{{ t(r.desc, r.descAr) }}</p>
                  <span class="rc-action">{{ t('Generate →', 'إنشاء →') }}</span>
                </article>
              }
            </section>

            <section class="card">
              <header class="card-head"><h4>{{ t('Analytics overview', 'نظرة تحليلية') }}</h4></header>
              <div class="analytics-grid">
                @for (a of analyticsCards(); track a.label) {
                  <div class="an-card" [style.--c]="a.color">
                    <span class="an-icon">{{ a.icon }}</span>
                    <b class="an-val">{{ a.value }}</b>
                    <span class="an-label">{{ a.label }}</span>
                    <div class="an-chart">
                      @for (bar of a.chart; track $index) {
                        <div class="an-bar" [style.height.%]="bar"></div>
                      }
                    </div>
                  </div>
                }
              </div>
            </section>
          </div>
        }

        @case ('blog') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Content', 'المحتوى') }}</span>
                <h3>{{ t('Blog', 'المدونة') }}</h3>
                <p>{{ blogs().length }} {{ t('posts', 'مقالة') }}</p>
              </div>
              <div class="view-actions">
                <button class="pill primary" (click)="toast.success(t('New post', 'مقال جديد'))">＋ {{ t('New post', 'مقال جديد') }}</button>
              </div>
            </header>

            <div class="blog-grid">
              @for (b of blogs(); track b.id) {
                <article class="blog-card" (click)="openBlog(b.id)">
                  <div class="bl-thumb" [style.background]="blogBg(b)">
                    <span class="bl-emoji">{{ b.thumbnail }}</span>
                    <span class="bl-cat">{{ t(b.category, b.categoryAr) }}</span>
                  </div>
                  <div class="bl-body">
                    <h4>{{ t(b.title, b.titleAr) }}</h4>
                    <p>{{ t(b.excerpt, b.excerptAr) }}</p>
                    <div class="bl-meta">
                      <span>✍ {{ t(b.author, b.authorAr) }}</span>
                      <span>📅 {{ b.publishedAt }}</span>
                      <span>⏱ {{ b.readTime }} min</span>
                    </div>
                    <div class="bl-stats">
                      <span>👁 {{ b.views | number }}</span>
                      <span>💬 {{ b.comments }}</span>
                      <span>❤️ {{ b.likes }}</span>
                    </div>
                  </div>
                </article>
              }
            </div>
          </div>
        }

        @case ('announcements') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Broadcast', 'البث') }}</span>
                <h3>{{ t('Announcements', 'الإعلانات') }}</h3>
                <p>{{ announcements().length }} {{ t('total', 'إجمالي') }}</p>
              </div>
              <div class="view-actions">
                <button class="pill primary" (click)="toast.success(t('New announcement', 'إعلان جديد'))">＋ {{ t('New', 'جديد') }}</button>
              </div>
            </header>

            <div class="announcements-list">
              @for (a of announcements(); track a.id) {
                <article class="ann-card" [attr.data-p]="a.priority" [class.pinned]="a.pinned">
                  @if (a.pinned) {
                    <span class="ann-pin">📌 {{ t('Pinned', 'مثبت') }}</span>
                  }
                  <header class="ann-head">
                    <span class="ann-priority" [attr.data-p]="a.priority">{{ t(a.priority, annPriorityAr(a.priority)) }}</span>
                    <span class="ann-audience">{{ t(a.audience, annAudienceAr(a.audience)) }}</span>
                    <span class="ann-time mono">{{ a.createdAt }}</span>
                  </header>
                  <h4>{{ t(a.title, a.titleAr) }}</h4>
                  <p>{{ t(a.body, a.bodyAr) }}</p>
                  <footer class="ann-foot">
                    <span>✍ {{ a.author }}</span>
                  </footer>
                </article>
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
                <p>{{ unreadMessages() }} {{ t('unread', 'غير مقروء') }}</p>
              </div>
              <button class="pill" (click)="markAllMessagesRead()">✓ {{ t('Mark all read', 'تحديد الكل كمقروء') }}</button>
            </header>

            <ul class="messages-list">
              @for (m of messages(); track m.id) {
                <li class="msg-row" [class.unread]="m.unread" [attr.data-p]="m.priority" (click)="openMessage(m.id)">
                  <span class="msg-avatar">{{ m.avatar }}</span>
                  <div class="msg-body">
                    <div class="msg-top">
                      <b>{{ t(m.from, m.fromAr) }}</b>
                      <span class="msg-time mono">{{ m.time }}</span>
                    </div>
                    <span class="msg-subject">{{ t(m.subject, m.subjectAr) }}</span>
                    <p class="msg-preview">{{ t(m.preview, m.previewAr) }}</p>
                  </div>
                  @if (m.unread) {
                    <span class="msg-dot"></span>
                  }
                </li>
              }
            </ul>
          </div>
        }

        @case ('notifications') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Alerts', 'التنبيهات') }}</span>
                <h3>{{ t('Notifications', 'التنبيهات') }}</h3>
                <p>{{ notificationItems().length }} {{ t('total', 'إجمالي') }}</p>
              </div>
            </header>

            <section class="notif-list-section">
              @for (n of notificationItems(); track n.id) {
                <div class="notif-item" [class.unread]="!n.read" (click)="markNotifRead(n.id)">
                  <span class="ni-icon" [style.background]="n.color + '22'" [style.color]="n.color">{{ n.icon }}</span>
                  <div class="ni-body">
                    <b>{{ t(n.title, n.titleAr) }}</b>
                    <p>{{ t(n.message, n.messageAr) }}</p>
                    <small class="mono">{{ n.time }}</small>
                  </div>
                  <span class="ni-type" [style.color]="n.color">{{ n.type }}</span>
                </div>
              }
            </section>
          </div>
        }

        @case ('analytics') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Deep dive', 'تحليل عميق') }}</span>
                <h3>{{ t('Analytics', 'التحليلات') }}</h3>
                <p>{{ t('Platform-wide metrics', 'مقاييس شاملة للمنصة') }}</p>
              </div>
              <div class="view-actions">
                <select class="sel" [ngModel]="analyticsPeriod()" (ngModelChange)="analyticsPeriod.set($event)">
                  <option value="7d">{{ t('Last 7 days', 'آخر 7 أيام') }}</option>
                  <option value="30d">{{ t('Last 30 days', 'آخر 30 يوم') }}</option>
                  <option value="90d">{{ t('Last 90 days', 'آخر 90 يوم') }}</option>
                </select>
              </div>
            </header>

            <section class="kpis">
              @for (k of analyticsKpis(); track k.label) {
                <article class="kpi" [style.--c]="k.color">
                  <span class="kpi-icon">{{ k.icon }}</span>
                  <b class="kpi-val">{{ k.value }}</b>
                  <span class="kpi-label">{{ k.label }}</span>
                </article>
              }
            </section>

            <section class="card">
              <header class="card-head">
                <h4>{{ t('Engagement over time', 'التفاعل عبر الوقت') }}</h4>
                <div class="legend-row">
                  <span><i class="dot" style="background:#007aff"></i> {{ t('Views', 'مشاهدات') }}</span>
                  <span><i class="dot" style="background:#34c759"></i> {{ t('Enrollments', 'تسجيلات') }}</span>
                  <span><i class="dot" style="background:#ff9500"></i> {{ t('Live', 'بث') }}</span>
                </div>
              </header>
              <div class="multi-chart">
                @for (d of engagementData(); track $index) {
                  <div class="mc-col">
                    <div class="mc-bar blue" [style.height.%]="d.views"></div>
                    <div class="mc-bar green" [style.height.%]="d.enrollments"></div>
                    <div class="mc-bar amber" [style.height.%]="d.live"></div>
                  </div>
                }
              </div>
            </section>

            <div class="grid-2">
              <section class="card">
                <header class="card-head"><h4>{{ t('Top subjects', 'أعلى المواد') }}</h4></header>
                <div class="subject-bars">
                  @for (s of topSubjects(); track s.id) {
                    <div class="subj-row">
                      <span class="sj-icon">{{ s.icon }}</span>
                      <span class="sj-name">{{ t(s.name, s.nameAr) }}</span>
                      <div class="sj-track"><div class="sj-fill" [style.width.%]="s.pct" [style.background]="s.color"></div></div>
                      <span class="sj-count mono">{{ s.count }}</span>
                    </div>
                  }
                </div>
              </section>

              <section class="card">
                <header class="card-head"><h4>{{ t('Grade performance', 'أداء الصفوف') }}</h4></header>
                <div class="grade-list">
                  @for (g of gradePerformance(); track g.id) {
                    <div class="grade-row">
                      <span class="gr-name">{{ t(g.name, g.nameAr) }}</span>
                      <div class="gr-track"><div class="gr-fill" [style.width.%]="g.avgScore" [class.good]="g.avgScore >= 75"></div></div>
                      <span class="gr-score mono">{{ g.avgScore }}%</span>
                    </div>
                  }
                </div>
              </section>
            </div>
          </div>
        }

        @case ('settings') {
          <div class="view">
            <header class="view-head">
              <div>
                <span class="eyebrow">{{ t('Config', 'الإعدادات') }}</span>
                <h3>{{ t('Settings', 'الإعدادات') }}</h3>
                <p>{{ t('Platform-wide preferences', 'تفضيلات المنصة') }}</p>
              </div>
              <button class="pill primary" (click)="saveSettings()">💾 {{ t('Save', 'حفظ') }}</button>
            </header>

            <section class="card">
              <header class="card-head"><h4>{{ t('General', 'عام') }}</h4></header>
              <div class="settings-list">
                @for (s of generalSettings; track s.key) {
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

            <section class="card">
              <header class="card-head"><h4>{{ t('Live streaming', 'البث المباشر') }}</h4></header>
              <div class="settings-list">
                @for (s of liveSettings; track s.key) {
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

            <section class="card danger-zone">
              <header class="card-head">
                <h4>⚠️ {{ t('Danger zone', 'منطقة الخطر') }}</h4>
                <small>{{ t('Irreversible operations', 'عمليات غير قابلة للتراجع') }}</small>
              </header>
              <div class="dz-actions">
                <button class="pill danger" (click)="clearCache()">{{ t('Clear cache', 'مسح الكاش') }}</button>
                <button class="pill danger" (click)="resetPlatform()">{{ t('Reset platform', 'إعادة تعيين') }}</button>
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
    .stars { color: #ff9500; letter-spacing: 0.5px; }

    .am-bar { display: flex; align-items: center; gap: 16px; padding: 12px 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); flex-wrap: wrap; }
    .lang-switch { display: flex; gap: 2px; padding: 3px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .ls-btn { padding: 5px 12px; border-radius: calc(var(--r-sm) - 4px); font-size: 11px; font-weight: 700; color: var(--label-2); background: transparent; border: 0; cursor: pointer; }
    .ls-btn.active { background: var(--bg-surface-solid); color: var(--label); box-shadow: var(--shadow-xs); }

    .portal-switch { display: flex; gap: 4px; padding: 3px; background: var(--bg-fill-2); border-radius: var(--r-sm); flex-wrap: wrap; }
    .ps-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: calc(var(--r-sm) - 4px); font-size: 11px; font-weight: 600; color: var(--label-2); background: transparent; border: 0; cursor: pointer; transition: all 140ms; }
    .ps-btn:hover { color: var(--label); }
    .ps-btn.active { background: var(--c); color: #fff; box-shadow: var(--shadow-xs); }
    .ps-icon { font-size: 14px; }

    .live-indicator { display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-size: 10px; font-weight: 700; color: var(--label-2); margin-left: auto; }
    .live-indicator.live { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #ff3b30; animation: pulse 1.6s infinite; }
    .idle-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--label-3); }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.5); } 50% { box-shadow: 0 0 0 6px rgba(255, 59, 48, 0); } }

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
    .pill.danger:hover { background: rgba(255, 59, 48, 0.25); }
    .pill-sm { padding: 6px 12px; background: var(--bg-fill-2); color: var(--label); border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 600; border: 0; cursor: pointer; }
    .pill-sm:hover { background: var(--bg-fill-3); }
    .pill-sm.primary { background: var(--accent); color: var(--accent-contrast); }
    .pulse { width: 8px; height: 8px; border-radius: 50%; background: #fff; animation: pulse 1.4s infinite; }

    .sel { padding: 7px 12px; background: var(--bg-input); color: var(--label); border: 0.5px solid var(--separator); border-radius: var(--r-sm); font-size: var(--fs-xs); cursor: pointer; outline: none; font-family: inherit; }
    .input-sm { padding: 6px 10px; background: var(--bg-input); color: var(--label); border: 0.5px solid var(--separator); border-radius: var(--r-xs); font-size: var(--fs-xs); outline: none; font-family: inherit; min-width: 100px; }

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

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 820px) { .grid-2 { grid-template-columns: 1fr; } }

    .card { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 14px; }
    .card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .card-head h4 { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; }
    .card-head small { font-size: var(--fs-2xs); color: var(--label-2); display: block; margin-top: 2px; }
    .card.danger-zone { border-left: 3px solid #ff3b30; }

    .feed { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .feed-item { display: grid; grid-template-columns: 40px 1fr; gap: 10px; align-items: center; padding: 10px; background: var(--bg-fill-2); border-radius: var(--r-sm); cursor: pointer; transition: all 140ms; }
    .feed-item:hover { background: var(--bg-fill-3); transform: translateX(2px); }
    .fi-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 18px; background: var(--bg-surface-solid); }
    .fi-icon[data-s='live'] { background: rgba(255, 59, 48, 0.15); }
    .fi-icon[data-s='scheduled'] { background: var(--accent-soft); }
    .fi-icon[data-s='ended'] { background: rgba(52, 199, 89, 0.15); }
    .fi-avatar { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%; background: var(--accent-soft); color: var(--accent); font-size: 20px; }
    .fi-body { min-width: 0; }
    .fi-row { display: flex; align-items: center; gap: 8px; }
    .fi-row b { font-size: var(--fs-xs); font-weight: 700; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .fi-status { font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: var(--r-pill); text-transform: uppercase; }
    .fi-status[data-s='live'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .fi-status[data-s='scheduled'] { background: var(--accent-soft); color: var(--accent); }
    .fi-status[data-s='ended'] { background: var(--bg-fill-3); color: var(--label-2); }
    .fi-tag { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: var(--r-pill); }
    .fi-tag.ok { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .fi-meta { display: flex; gap: 10px; font-size: 10px; color: var(--label-3); margin-top: 3px; flex-wrap: wrap; }

    .courses-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
    .course-mini { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; padding: 12px; background: var(--bg-fill-2); border-radius: var(--r-sm); border-left: 3px solid var(--c); cursor: pointer; transition: all 140ms; }
    .course-mini:hover { background: var(--bg-fill-3); transform: translateX(2px); }
    .cm-icon { font-size: 26px; text-align: center; }
    .cm-body b { font-size: var(--fs-xs); font-weight: 700; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cm-body small { font-size: 10px; color: var(--label-2); }
    .cm-meta { text-align: right; display: flex; flex-direction: column; gap: 3px; }
    .cm-rating { font-size: 10px; color: #ff9500; font-weight: 700; }
    .cm-students { font-size: 10px; color: var(--label-2); }

    .schedule-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .sch-row { display: grid; grid-template-columns: 60px 1fr auto; gap: 12px; align-items: center; padding: 10px; background: var(--bg-fill-2); border-radius: var(--r-sm); border-left: 3px solid var(--label-3); }
    .sch-row[data-t='live'] { border-left-color: #ff3b30; }
    .sch-row[data-t='exam'] { border-left-color: #ff9500; }
    .sch-row[data-t='review'] { border-left-color: #af52de; }
    .sch-row[data-t='homework'] { border-left-color: #007aff; }
    .sch-time { font-family: var(--sf-mono); font-size: var(--fs-sm); font-weight: 800; color: var(--accent); }
    .sch-body b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .sch-body small { font-size: 10px; color: var(--label-2); }
    .sch-type { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); background: var(--bg-fill-3); color: var(--label-2); text-transform: uppercase; }

    .status-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .status-row { display: grid; grid-template-columns: 12px 1fr auto; gap: 12px; align-items: center; padding: 8px 0; border-bottom: 0.5px solid var(--separator); }
    .status-row:last-child { border-bottom: 0; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; }
    .status-dot[data-s='ok'] { background: #34c759; box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.2); }
    .status-dot[data-s='warn'] { background: #ff9500; box-shadow: 0 0 0 3px rgba(255, 149, 0, 0.2); }
    .status-dot[data-s='err'] { background: #ff3b30; box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.2); }
    .status-row b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .status-row small { font-size: 10px; color: var(--label-2); }
    .status-tag { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); text-transform: uppercase; }
    .status-tag[data-s='ok'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .status-tag[data-s='warn'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .status-tag[data-s='err'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

    .live-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .live-card { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; cursor: pointer; transition: all 200ms; }
    .live-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    .live-card[data-s='live'] { border: 2px solid #ff3b30; }
    .lc-thumb { height: 160px; display: grid; place-items: center; position: relative; }
    .lc-emoji { font-size: 60px; filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3)); }
    .lc-badge { position: absolute; top: 12px; left: 12px; padding: 4px 10px; border-radius: var(--r-pill); font-size: 10px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px; }
    .lc-badge.live { background: #ff3b30; color: #fff; }
    .lc-badge.scheduled { background: var(--accent); color: var(--accent-contrast); }
    .lc-badge.ended { background: rgba(52, 199, 89, 0.9); color: #fff; }
    .lc-viewers { position: absolute; bottom: 12px; right: 12px; padding: 4px 10px; background: rgba(0, 0, 0, 0.7); color: #fff; border-radius: var(--r-pill); font-size: 11px; font-weight: 700; }
    .lc-body { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .lc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .lc-top b { font-size: var(--fs-base); font-weight: 700; letter-spacing: -0.015em; flex: 1; }
    .lc-quality { font-size: 10px; font-weight: 800; padding: 2px 8px; background: var(--bg-fill-2); color: var(--label-2); border-radius: var(--r-pill); }
    .lc-teacher { font-size: var(--fs-xs); color: var(--label-2); }
    .lc-meta { display: flex; gap: 10px; font-size: 10px; color: var(--label-3); flex-wrap: wrap; }
    .lc-stats { display: flex; gap: 14px; font-size: var(--fs-xs); font-weight: 600; padding-top: 8px; border-top: 0.5px solid var(--separator); }

    .recorded-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
    .rec-card { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; cursor: pointer; transition: all 200ms; }
    .rec-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .rc-thumb { height: 120px; display: grid; place-items: center; position: relative; }
    .rc-play { width: 48px; height: 48px; display: grid; place-items: center; background: rgba(255, 255, 255, 0.9); color: var(--label); border-radius: 50%; font-size: 18px; }
    .rc-duration { position: absolute; bottom: 8px; right: 8px; background: rgba(0, 0, 0, 0.7); color: #fff; padding: 2px 8px; border-radius: var(--r-xs); font-size: 10px; font-family: var(--sf-mono); }
    .rc-hd { position: absolute; top: 8px; right: 8px; background: var(--accent); color: var(--accent-contrast); padding: 2px 8px; border-radius: var(--r-pill); font-size: 9px; font-weight: 800; }
    .rc-body { padding: 12px; display: flex; flex-direction: column; gap: 6px; }
    .rc-body b { font-size: var(--fs-xs); font-weight: 700; }
    .rc-body small { font-size: 10px; color: var(--label-2); }
    .rc-meta { display: flex; justify-content: space-between; font-size: 10px; color: var(--label-3); }

    .schedule-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; }
    @media (max-width: 1100px) { .schedule-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 700px) { .schedule-grid { grid-template-columns: 1fr; } }
    .day-col { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); padding: 12px; display: flex; flex-direction: column; gap: 10px; min-height: 200px; }
    .day-head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 0.5px solid var(--separator); }
    .day-head b { font-size: var(--fs-xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent); }
    .day-head span { font-size: 10px; font-weight: 800; padding: 2px 8px; background: var(--bg-fill-2); border-radius: var(--r-pill); }
    .day-items { display: flex; flex-direction: column; gap: 8px; }
    .day-item { padding: 10px; background: var(--bg-fill-2); border-radius: var(--r-sm); border-left: 3px solid var(--label-3); display: flex; flex-direction: column; gap: 4px; }
    .day-item[data-t='live'] { border-left-color: #ff3b30; }
    .day-item[data-t='exam'] { border-left-color: #ff9500; }
    .day-item[data-t='review'] { border-left-color: #af52de; }
    .day-item[data-t='homework'] { border-left-color: #007aff; }
    .di-time { font-family: var(--sf-mono); font-size: 10px; font-weight: 800; color: var(--accent); }
    .day-item b { font-size: 11px; font-weight: 700; }
    .day-item small { font-size: 10px; color: var(--label-2); }
    .di-meta { display: flex; justify-content: space-between; font-size: 9px; color: var(--label-3); margin-top: 3px; }
    .di-type { font-weight: 800; text-transform: uppercase; }

    .course-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .cf-chip { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: var(--bg-fill-2); color: var(--label-2); border: 0; border-radius: var(--r-pill); font-size: var(--fs-xs); font-weight: 700; cursor: pointer; }
    .cf-chip.active { background: var(--accent); color: var(--accent-contrast); }
    .cf-count { background: rgba(255, 255, 255, 0.2); padding: 1px 6px; border-radius: var(--r-pill); font-size: 10px; }

    .courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .course-card { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; cursor: pointer; transition: all 200ms; display: flex; flex-direction: column; }
    .course-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    .course-card[data-s='published'] { border-top: 3px solid #34c759; }
    .course-card[data-s='draft'] { border-top: 3px solid var(--label-3); }
    .course-card[data-s='review'] { border-top: 3px solid #ff9500; }
    .cc-thumb { height: 130px; display: grid; place-items: center; position: relative; }
    .cc-emoji { font-size: 52px; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.25)); }
    .cc-lang { position: absolute; top: 10px; left: 10px; padding: 3px 8px; background: rgba(0, 0, 0, 0.65); color: #fff; border-radius: var(--r-pill); font-size: 9px; font-weight: 800; }
    .cc-discount { position: absolute; top: 10px; right: 10px; padding: 3px 9px; background: #ff3b30; color: #fff; border-radius: var(--r-pill); font-size: 10px; font-weight: 800; }
    .cc-body { padding: 14px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .cc-subject { font-size: 9px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 800; }
    .cc-title { font-size: var(--fs-sm); font-weight: 700; line-height: 1.3; }
    .cc-teacher { font-size: 10px; color: var(--label-2); }
    .cc-stats { display: flex; gap: 10px; font-size: 10px; color: var(--label-2); margin-top: 4px; }
    .cc-rating { display: flex; align-items: center; gap: 6px; font-size: 10px; }
    .cc-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 0.5px solid var(--separator); margin-top: auto; }
    .cc-price { display: flex; align-items: baseline; gap: 6px; }
    .cc-price b { font-size: var(--fs-md); font-weight: 800; color: var(--accent); font-variant-numeric: tabular-nums; }
    .cc-price s { font-size: 10px; color: var(--label-3); }
    .cc-status { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); text-transform: uppercase; }
    .cc-status[data-s='published'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .cc-status[data-s='draft'] { background: var(--bg-fill-3); color: var(--label-2); }
    .cc-status[data-s='review'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }

    .library-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .lib-card { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); cursor: pointer; transition: all 140ms; display: flex; flex-direction: column; gap: 12px; border-left: 3px solid var(--label-3); }
    .lib-card[data-t='pdf'] { border-left-color: #ff3b30; }
    .lib-card[data-t='video'] { border-left-color: #007aff; }
    .lib-card[data-t='audio'] { border-left-color: #af52de; }
    .lib-card[data-t='slide'] { border-left-color: #ff9500; }
    .lib-card[data-t='doc'] { border-left-color: #34c759; }
    .lib-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .lc-head { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; }
    .lc-icon { font-size: 28px; text-align: center; }
    .lc-head > div { min-width: 0; }
    .lc-head b { font-size: var(--fs-xs); font-weight: 700; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .lc-head small { font-size: 10px; color: var(--label-2); }
    .lc-type { font-family: var(--sf-mono); font-size: 9px; font-weight: 800; padding: 3px 8px; background: var(--bg-fill-2); border-radius: var(--r-pill); color: var(--label-2); }
    .lc-body { display: flex; flex-direction: column; gap: 6px; }
    .lc-meta { display: flex; gap: 12px; font-size: 10px; color: var(--label-2); }
    .lc-stats { display: flex; gap: 14px; font-size: 10px; color: var(--label-3); padding-top: 8px; border-top: 0.5px solid var(--separator); }

    .exam-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .ef-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; background: var(--bg-fill-2); color: var(--label-2); border: 0; border-radius: var(--r-pill); font-size: var(--fs-2xs); font-weight: 700; cursor: pointer; }
    .ef-chip.active { background: var(--accent); color: var(--accent-contrast); }
    .ef-count { background: rgba(255, 255, 255, 0.2); padding: 1px 6px; border-radius: var(--r-pill); font-size: 9px; }

    .exam-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .exam-card { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 10px; }
    .exam-card[data-t='final'] { border-left: 3px solid #ff3b30; }
    .exam-card[data-t='midterm'] { border-left: 3px solid #ff9500; }
    .exam-card[data-t='quiz'] { border-left: 3px solid #007aff; }
    .exam-card[data-t='practice'] { border-left: 3px solid #34c759; }
    .ec-head { display: flex; justify-content: space-between; align-items: center; }
    .ec-type { font-size: 9px; font-weight: 800; padding: 3px 9px; background: var(--accent-soft); color: var(--accent); border-radius: var(--r-pill); text-transform: uppercase; }
    .ec-status { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); text-transform: uppercase; }
    .ec-status[data-s='draft'] { background: var(--bg-fill-3); color: var(--label-2); }
    .ec-status[data-s='published'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .ec-status[data-s='archived'] { background: var(--bg-fill-3); color: var(--label-3); }
    .ec-title { font-size: var(--fs-sm); font-weight: 700; }
    .ec-course { font-size: 10px; color: var(--label-2); }
    .ec-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 10px 0; border-top: 0.5px solid var(--separator); border-bottom: 0.5px solid var(--separator); }
    .ec-stat { text-align: center; }
    .ec-stat b { font-size: var(--fs-base); font-weight: 800; display: block; font-variant-numeric: tabular-nums; }
    .ec-stat small { font-size: 9px; color: var(--label-3); text-transform: uppercase; letter-spacing: 0.04em; }
    .ec-progress { display: flex; flex-direction: column; gap: 6px; }
    .ecp-head { display: flex; justify-content: space-between; font-size: 10px; color: var(--label-2); }
    .ecp-head b { color: var(--label); font-weight: 800; }
    .ecp-track { height: 5px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .ecp-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill); transition: width 400ms; }
    .ecp-fill.good { background: #34c759; }
    .ecp-fill.warn { background: #ff9500; }
    .ec-foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 10px; color: var(--label-3); flex-wrap: wrap; }
    .ec-sched { padding: 2px 8px; background: var(--accent-soft); color: var(--accent); border-radius: var(--r-pill); font-weight: 700; }

    .questions-list { display: flex; flex-direction: column; gap: 10px; }
    .q-card { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-left: 3px solid var(--label-3); }
    .q-card[data-d='easy'] { border-left-color: #34c759; }
    .q-card[data-d='medium'] { border-left-color: #ff9500; }
    .q-card[data-d='hard'] { border-left-color: #ff3b30; }
    .q-head { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
    .q-id { font-family: var(--sf-mono); font-size: 11px; color: var(--accent); font-weight: 800; }
    .q-type { font-size: 9px; font-weight: 800; padding: 3px 9px; background: var(--bg-fill-2); color: var(--label-2); border-radius: var(--r-pill); text-transform: uppercase; }
    .q-diff { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); text-transform: uppercase; }
    .q-diff[data-d='easy'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .q-diff[data-d='medium'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .q-diff[data-d='hard'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .q-marks { margin-left: auto; font-size: 10px; font-weight: 700; color: var(--accent); }
    .q-text { font-size: var(--fs-sm); line-height: 1.6; margin-bottom: 10px; }
    .q-foot { display: flex; justify-content: space-between; padding-top: 10px; border-top: 0.5px solid var(--separator); }
    .q-stats { display: flex; gap: 14px; font-size: 10px; color: var(--label-2); flex-wrap: wrap; }
    .q-correct { color: #34c759; font-weight: 700; }
    .q-correct.low { color: #ff9500; }

    .rating-summary { display: grid; grid-template-columns: 220px 1fr; gap: 24px; padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); align-items: center; }
    @media (max-width: 700px) { .rating-summary { grid-template-columns: 1fr; } }
    .rs-big { text-align: center; display: flex; flex-direction: column; gap: 6px; align-items: center; }
    .rs-big b { font-size: 56px; font-weight: 900; color: var(--accent); letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums; }
    .rs-big small { font-size: 11px; color: var(--label-2); }
    .rs-bars { display: flex; flex-direction: column; gap: 8px; }
    .rs-row { display: grid; grid-template-columns: 40px 1fr 50px; gap: 12px; align-items: center; font-size: 11px; }
    .rs-track { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .rs-fill { height: 100%; background: #ff9500; border-radius: var(--r-pill); }
    .rs-count { text-align: right; font-weight: 700; color: var(--label-2); }

    .reviews-list { display: flex; flex-direction: column; gap: 10px; }
    .review-card { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 10px; }
    .rv-head { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; }
    .rv-avatar { width: 44px; height: 44px; display: grid; place-items: center; background: var(--accent-soft); color: var(--accent); border-radius: 50%; font-size: 20px; font-weight: 800; }
    .rv-head b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .rv-head small { font-size: 10px; color: var(--label-2); }
    .rv-rating { text-align: right; }
    .rv-rating .stars { display: block; font-size: 12px; }
    .rv-rating small { font-size: 10px; color: var(--label-3); }
    .rv-comment { font-size: var(--fs-sm); line-height: 1.6; color: var(--label); }
    .rv-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 0.5px solid var(--separator); font-size: 11px; color: var(--label-2); }
    .rv-replied { color: #34c759; font-weight: 700; }

    .homework-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
    .hw-card { padding: 14px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-left: 3px solid var(--c); }
    .hw-card b { font-size: var(--fs-xl); font-weight: 800; display: block; font-variant-numeric: tabular-nums; }
    .hw-card small { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    .students-grid, .teachers-grid, .parents-grid, .classes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .student-card, .teacher-card, .parent-card, .class-card { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 12px; cursor: pointer; transition: all 140ms; }
    .student-card:hover, .teacher-card:hover, .parent-card:hover, .class-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--accent); }
    .student-card[data-s='suspended'] { opacity: 0.65; border-left: 3px solid #ff3b30; }
    .student-card[data-s='inactive'] { opacity: 0.75; border-left: 3px solid var(--label-3); }
    .teacher-card[data-s='away'] { border-left: 3px solid #ff9500; }
    .teacher-card[data-s='offline'] { opacity: 0.7; border-left: 3px solid var(--label-3); }
    .teacher-card[data-s='active'] { border-left: 3px solid #34c759; }

    .sc-head, .tc-head, .pc-head, .cl-head { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; }
    .sc-avatar, .tc-avatar, .pc-avatar { width: 44px; height: 44px; display: grid; place-items: center; background: var(--accent-soft); border-radius: 50%; font-size: 22px; }
    .cl-icon { font-size: 32px; text-align: center; }
    .sc-head b, .tc-head b, .pc-head b, .cl-head b { font-size: var(--fs-sm); font-weight: 700; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sc-head small, .tc-head small, .pc-head small, .cl-head small { font-size: 10px; color: var(--label-2); }
    .sc-status, .tc-status { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); text-transform: uppercase; }
    .sc-status[data-s='active'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .sc-status[data-s='inactive'] { background: var(--bg-fill-3); color: var(--label-2); }
    .sc-status[data-s='suspended'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .tc-status[data-s='active'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .tc-status[data-s='away'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .tc-status[data-s='offline'] { background: var(--bg-fill-3); color: var(--label-2); }
    .sc-stats, .tc-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .sc-stats > div, .tc-stats > div { padding: 8px; background: var(--bg-fill-2); border-radius: var(--r-xs); text-align: center; }
    .sc-stats b, .tc-stats b { font-size: var(--fs-sm); font-weight: 800; display: block; }
    .sc-stats small, .tc-stats small { font-size: 9px; color: var(--label-3); text-transform: uppercase; }
    .sc-foot, .tc-foot, .pc-foot, .cl-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 0.5px solid var(--separator); font-size: 10px; color: var(--label-3); flex-wrap: wrap; gap: 8px; }
    .tc-rating { display: flex; align-items: center; gap: 8px; font-size: 11px; }
    .tc-rating b { color: var(--label); font-weight: 800; }
    .pc-children { padding: 3px 10px; background: var(--accent-soft); color: var(--accent); border-radius: var(--r-pill); font-size: 10px; font-weight: 800; }
    .pc-children-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .pc-child { padding: 4px 10px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-size: 10px; }
    .cl-room { font-size: 11px; font-weight: 800; padding: 3px 9px; background: var(--bg-fill-2); border-radius: var(--r-pill); color: var(--label-2); }
    .cl-teacher { font-size: var(--fs-xs); color: var(--label-2); }
    .cl-capacity { display: flex; flex-direction: column; gap: 6px; }
    .cap-head { display: flex; justify-content: space-between; font-size: 10px; color: var(--label-2); }
    .cap-track { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .cap-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill); }
    .cap-fill.full { background: #ff9500; }
    .cl-next { color: var(--accent); font-weight: 700; }

    .admin-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .admin-kpis { grid-template-columns: repeat(2, 1fr); } }
    .ak { padding: 16px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-left: 3px solid var(--c); display: flex; flex-direction: column; gap: 4px; }
    .ak-icon { font-size: 20px; }
    .ak-val { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
    .ak-label { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .ak-bar { height: 3px; background: var(--bg-fill-2); border-radius: var(--r-pill); margin-top: 8px; overflow: hidden; }
    .ak-fill { height: 100%; background: var(--c); border-radius: var(--r-pill); }

    .quick-actions { display: flex; flex-direction: column; gap: 8px; }
    .qa-btn { display: grid; grid-template-columns: 40px 1fr; gap: 12px; align-items: center; padding: 12px; background: var(--bg-fill-2); border: 0; border-radius: var(--r-sm); text-align: left; cursor: pointer; transition: all 140ms; }
    .qa-btn:hover { background: var(--bg-fill-3); transform: translateX(3px); }
    .qa-icon { width: 40px; height: 40px; display: grid; place-items: center; background: var(--accent-soft); border-radius: var(--r-sm); font-size: 20px; }
    .qa-btn b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .qa-btn small { font-size: 10px; color: var(--label-2); }

    .activity-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .act-row { display: grid; grid-template-columns: 36px 1fr auto; gap: 12px; align-items: center; padding: 10px; background: var(--bg-fill-2); border-radius: var(--r-sm); }
    .act-icon { width: 36px; height: 36px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 16px; }
    .act-row b { font-size: var(--fs-xs); font-weight: 700; display: block; }
    .act-row small { font-size: 10px; color: var(--label-2); }
    .act-time { font-size: 10px; color: var(--label-3); }

    .perm-table { background: var(--bg-fill-2); border-radius: var(--r-sm); overflow: hidden; }
    .perm-head, .perm-row { display: grid; grid-template-columns: 1.6fr repeat(4, 80px); gap: 12px; padding: 10px 16px; align-items: center; font-size: var(--fs-xs); }
    .perm-head { background: var(--bg-surface-solid); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 800; }
    .perm-head span:not(:first-child) { text-align: center; }
    .perm-row { border-top: 0.5px solid var(--separator); }
    .pr-feature { font-weight: 600; }
    .pr-val { text-align: center; font-weight: 800; font-size: 14px; }
    .pr-val.yes { color: #34c759; }
    .pr-val.no { color: var(--label-4); }

    .finance-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 820px) { .finance-kpis { grid-template-columns: repeat(2, 1fr); } }
    .fk { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-left: 3px solid var(--c); display: flex; flex-direction: column; gap: 4px; }
    .fk-icon { font-size: 22px; }
    .fk-val { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
    .fk-label { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }

    .table-wrap { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; }
    .thead, .trow { display: grid; gap: 12px; padding: 12px 16px; align-items: center; font-size: var(--fs-xs); }
    .thead { background: var(--bg-fill-2); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-2); font-weight: 700; }
    .trow { border-top: 0.5px solid var(--separator); }
    .trow:hover { background: var(--bg-hover); }
    .cols-5 { grid-template-columns: 100px 140px 1fr 140px 100px; }
    .cell-name { font-weight: 700; }
    .tag { display: inline-block; padding: 2px 8px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-size: 10px; color: var(--label-2); }
    .amount { text-align: right; font-weight: 800; }
    .amount.pos { color: #34c759; }
    .amount.neg { color: #ff3b30; }
    .row-actions { display: flex; gap: 4px; justify-content: flex-end; }
    .row-action { width: 26px; height: 26px; display: grid; place-items: center; border-radius: var(--r-xs); background: transparent; border: 0; color: var(--label-3); font-size: 12px; cursor: pointer; }
    .row-action:hover { background: var(--bg-fill-2); color: var(--label); }
    .row-action.primary { color: var(--accent); }
    .st { padding: 3px 10px; border-radius: var(--r-pill); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; display: inline-block; }
    .st[data-s='submitted'] { background: var(--accent-soft); color: var(--accent); }
    .st[data-s='graded'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='late'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='missing'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .st[data-s='completed'] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
    .st[data-s='pending'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .st[data-s='failed'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

    .report-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
    .report-card { padding: 20px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); border-left: 3px solid var(--c); display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: all 140ms; }
    .report-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .rc-icon { font-size: 32px; }
    .report-card b { font-size: var(--fs-base); font-weight: 700; }
    .report-card p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5; }
    .rc-action { color: var(--accent); font-weight: 700; font-size: var(--fs-2xs); }

    .analytics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
    .an-card { padding: 16px; background: var(--bg-fill-2); border-radius: var(--r-sm); border-left: 3px solid var(--c); display: flex; flex-direction: column; gap: 6px; }
    .an-icon { font-size: 20px; }
    .an-val { font-size: var(--fs-2xl); font-weight: 800; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
    .an-label { font-size: var(--fs-2xs); color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .an-chart { display: flex; align-items: flex-end; gap: 2px; height: 30px; margin-top: 6px; }
    .an-bar { flex: 1; background: var(--c); border-radius: 1px; min-height: 2px; opacity: 0.6; }

    .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .blog-card { background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); overflow: hidden; cursor: pointer; transition: all 200ms; }
    .blog-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    .bl-thumb { height: 140px; display: grid; place-items: center; position: relative; }
    .bl-emoji { font-size: 56px; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.25)); }
    .bl-cat { position: absolute; top: 10px; left: 10px; padding: 3px 10px; background: rgba(0, 0, 0, 0.65); color: #fff; border-radius: var(--r-pill); font-size: 10px; font-weight: 700; }
    .bl-body { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .bl-body h4 { font-size: var(--fs-base); font-weight: 700; line-height: 1.3; letter-spacing: -0.015em; }
    .bl-body p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .bl-meta { display: flex; gap: 12px; font-size: 10px; color: var(--label-3); flex-wrap: wrap; }
    .bl-stats { display: flex; gap: 14px; font-size: 10px; color: var(--label-2); padding-top: 8px; border-top: 0.5px solid var(--separator); }

    .announcements-list { display: flex; flex-direction: column; gap: 12px; }
    .ann-card { padding: 18px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-md); position: relative; display: flex; flex-direction: column; gap: 10px; }
    .ann-card[data-p='urgent'] { border-left: 4px solid #ff3b30; background: rgba(255, 59, 48, 0.03); }
    .ann-card[data-p='high'] { border-left: 4px solid #ff9500; }
    .ann-card[data-p='normal'] { border-left: 4px solid #007aff; }
    .ann-card[data-p='low'] { border-left: 4px solid var(--label-3); }
    .ann-card.pinned { box-shadow: 0 0 0 2px var(--accent-soft); }
    .ann-pin { position: absolute; top: -10px; right: 16px; padding: 3px 10px; background: var(--accent); color: var(--accent-contrast); border-radius: var(--r-pill); font-size: 9px; font-weight: 800; }
    .ann-head { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .ann-priority { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: var(--r-pill); text-transform: uppercase; }
    .ann-priority[data-p='urgent'] { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
    .ann-priority[data-p='high'] { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .ann-priority[data-p='normal'] { background: var(--accent-soft); color: var(--accent); }
    .ann-priority[data-p='low'] { background: var(--bg-fill-3); color: var(--label-2); }
    .ann-audience { font-size: 10px; padding: 3px 9px; background: var(--bg-fill-2); border-radius: var(--r-pill); color: var(--label-2); }
    .ann-time { margin-left: auto; font-size: 10px; color: var(--label-3); }
    .ann-card h4 { font-size: var(--fs-base); font-weight: 700; }
    .ann-card p { font-size: var(--fs-sm); line-height: 1.6; color: var(--label-2); }
    .ann-foot { font-size: 10px; color: var(--label-3); }

    .messages-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .msg-row { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: flex-start; padding: 14px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-sm); cursor: pointer; transition: all 140ms; position: relative; }
    .msg-row:hover { background: var(--bg-hover); }
    .msg-row.unread { border-left: 3px solid var(--accent); background: rgba(0, 122, 255, 0.03); }
    .msg-row[data-p='high'] { border-right: 3px solid #ff3b30; }
    .msg-avatar { width: 44px; height: 44px; display: grid; place-items: center; background: var(--accent-soft); border-radius: 50%; font-size: 20px; }
    .msg-body { min-width: 0; }
    .msg-top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .msg-top b { font-size: var(--fs-xs); font-weight: 700; }
    .msg-time { font-size: 10px; color: var(--label-3); }
    .msg-subject { display: block; font-size: var(--fs-xs); font-weight: 600; color: var(--accent); margin-top: 4px; }
    .msg-preview { font-size: 11px; color: var(--label-2); line-height: 1.5; margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .msg-dot { width: 10px; height: 10px; background: var(--accent); border-radius: 50%; align-self: center; }

    .notif-list-section { display: flex; flex-direction: column; gap: 8px; }
    .notif-item { display: grid; grid-template-columns: 44px 1fr auto; gap: 14px; align-items: flex-start; padding: 14px; background: var(--bg-surface-solid); border: 0.5px solid var(--separator); border-radius: var(--r-sm); cursor: pointer; transition: all 140ms; }
    .notif-item:hover { background: var(--bg-hover); }
    .notif-item.unread { border-left: 3px solid var(--accent); background: rgba(0, 122, 255, 0.03); }
    .ni-icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: var(--r-sm); font-size: 20px; }
    .ni-body b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .ni-body p { font-size: var(--fs-xs); color: var(--label-2); line-height: 1.5; margin-top: 4px; }
    .ni-body small { font-size: 10px; color: var(--label-3); }
    .ni-type { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }

    .legend-row { display: flex; gap: 16px; font-size: var(--fs-2xs); color: var(--label-2); flex-wrap: wrap; }
    .legend-row span { display: inline-flex; align-items: center; gap: 6px; }
    .legend-row .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

    .multi-chart { display: flex; align-items: flex-end; gap: 4px; height: 200px; padding: 4px 0; }
    .mc-col { flex: 1; height: 100%; display: flex; align-items: flex-end; gap: 1px; }
    .mc-bar { flex: 1; border-radius: 2px 2px 0 0; min-height: 2px; }
    .mc-bar.blue { background: #007aff; }
    .mc-bar.green { background: #34c759; }
    .mc-bar.amber { background: #ff9500; }

    .subject-bars { display: flex; flex-direction: column; gap: 10px; }
    .subj-row { display: grid; grid-template-columns: 28px 120px 1fr 50px; gap: 12px; align-items: center; font-size: var(--fs-xs); }
    .sj-icon { font-size: 18px; text-align: center; }
    .sj-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sj-track { height: 6px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .sj-fill { height: 100%; border-radius: var(--r-pill); }
    .sj-count { text-align: right; font-weight: 700; }

    .grade-list { display: flex; flex-direction: column; gap: 10px; }
    .grade-row { display: grid; grid-template-columns: 140px 1fr 60px; gap: 12px; align-items: center; font-size: var(--fs-xs); }
    .gr-name { font-weight: 600; }
    .gr-track { height: 8px; background: var(--bg-fill-2); border-radius: var(--r-pill); overflow: hidden; }
    .gr-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill); }
    .gr-fill.good { background: #34c759; }
    .gr-score { text-align: right; font-weight: 800; }

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
export class AlMotafiqPreviewComponent {
  public toast = inject(ToastService);
  private menu = inject(ContextMenuService);

  readonly Math = Math;

  readonly lang = signal<Lang>('en');
  readonly portal = signal<Portal>('admin');
  readonly active = signal<AMView>('dashboard');
  readonly courseFilter = signal<'all' | 'published' | 'draft' | 'review'>('all');
  readonly libType = signal<string>('all');
  readonly examFilter = signal<string>('all');
  readonly qFilter = signal<string>('all');
  readonly scheduleGrade = signal<string>('all');
  readonly analyticsPeriod = signal<'7d' | '30d' | '90d'>('7d');
  readonly searchQuery = signal('');

  private settingsStore = signal<Record<string, any>>({
    platformName: 'Al-Motafiq',
    supportEmail: 'support@almotafiq.com',
    timezone: 'Africa/Cairo',
    maxStudentsPerClass: 30,
    allowSelfEnroll: true,
    maintenanceMode: false,
    autoBackup: true,
    streamQuality: '1080p',
    maxConcurrentStreams: 50,
    recordingAuto: true,
  });

  readonly portals = [
    { id: 'admin' as const, label: 'Admin', labelAr: 'المدير', icon: '👑', color: '#ff3b30' },
    { id: 'teacher' as const, label: 'Teacher', labelAr: 'المعلم', icon: '👨‍🏫', color: '#007aff' },
    { id: 'parent' as const, label: 'Parent', labelAr: 'ولي الأمر', icon: '👨‍👩‍👧', color: '#af52de' },
    { id: 'student' as const, label: 'Student', labelAr: 'الطالب', icon: '👨‍🎓', color: '#34c759' },
  ];

  readonly portalRoles = [
    { id: 'admin', label: 'Admin', labelAr: 'المدير', color: '#ff3b30' },
    { id: 'teacher', label: 'Teacher', labelAr: 'المعلم', color: '#007aff' },
    { id: 'parent', label: 'Parent', labelAr: 'ولي الأمر', color: '#af52de' },
    { id: 'student', label: 'Student', labelAr: 'الطالب', color: '#34c759' },
  ];

  readonly subjects = [
    { id: 'math', name: 'Mathematics', nameAr: 'الرياضيات' },
    { id: 'physics', name: 'Physics', nameAr: 'الفيزياء' },
    { id: 'chemistry', name: 'Chemistry', nameAr: 'الكيمياء' },
    { id: 'biology', name: 'Biology', nameAr: 'الأحياء' },
    { id: 'arabic', name: 'Arabic', nameAr: 'اللغة العربية' },
    { id: 'english', name: 'English', nameAr: 'اللغة الإنجليزية' },
    { id: 'history', name: 'History', nameAr: 'التاريخ' },
    { id: 'cs', name: 'Computer Science', nameAr: 'علوم الحاسب' },
  ];

  readonly grades = [
    { id: 'g10', name: 'Grade 10', nameAr: 'الصف الأول الثانوي' },
    { id: 'g11', name: 'Grade 11', nameAr: 'الصف الثاني الثانوي' },
    { id: 'g12', name: 'Grade 12', nameAr: 'الصف الثالث الثانوي' },
  ];

  readonly weekDays = [
    { id: 'sat', name: 'Saturday', nameAr: 'السبت' },
    { id: 'sun', name: 'Sunday', nameAr: 'الأحد' },
    { id: 'mon', name: 'Monday', nameAr: 'الاثنين' },
    { id: 'tue', name: 'Tuesday', nameAr: 'الثلاثاء' },
    { id: 'wed', name: 'Wednesday', nameAr: 'الأربعاء' },
    { id: 'thu', name: 'Thursday', nameAr: 'الخميس' },
    { id: 'fri', name: 'Friday', nameAr: 'الجمعة' },
  ];

  readonly sessions = signal<LiveSession[]>([
    { id: 'LS-001', title: 'Algebra — Quadratic Equations', titleAr: 'الجبر — المعادلات التربيعية', teacher: 'Dr. Ahmed Hassan', teacherAr: 'د. أحمد حسن', course: 'Algebra Advanced', courseAr: 'الجبر المتقدم', status: 'live', viewers: 142, peak: 187, startedAt: '10:00 AM', duration: '45:23', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', subject: 'Mathematics', subjectAr: 'الرياضيات', thumbnail: '📐', quality: '1080p', chatMessages: 342, reactions: 128 },
    { id: 'LS-002', title: 'Physics — Newton Laws', titleAr: 'الفيزياء — قوانين نيوتن', teacher: 'Prof. Sara Ibrahim', teacherAr: 'أ.د. سارة إبراهيم', course: 'Physics Fundamentals', courseAr: 'أساسيات الفيزياء', status: 'live', viewers: 89, peak: 124, startedAt: '10:30 AM', duration: '32:11', grade: 'Grade 11', gradeAr: 'الثاني الثانوي', subject: 'Physics', subjectAr: 'الفيزياء', thumbnail: '⚛️', quality: '1080p', chatMessages: 187, reactions: 74 },
    { id: 'LS-003', title: 'Chemistry — Organic Compounds', titleAr: 'الكيمياء — المركبات العضوية', teacher: 'Dr. Khaled Sami', teacherAr: 'د. خالد سامي', course: 'Organic Chemistry', courseAr: 'الكيمياء العضوية', status: 'scheduled', viewers: 0, peak: 0, startedAt: '2:00 PM', duration: '—', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', subject: 'Chemistry', subjectAr: 'الكيمياء', thumbnail: '🧪', quality: '720p', chatMessages: 0, reactions: 0 },
    { id: 'LS-004', title: 'Arabic — Grammar Review', titleAr: 'العربية — مراجعة النحو', teacher: 'Mr. Mostafa Kamel', teacherAr: 'أ. مصطفى كامل', course: 'Arabic Grammar', courseAr: 'النحو العربي', status: 'scheduled', viewers: 0, peak: 0, startedAt: '4:00 PM', duration: '—', grade: 'Grade 10', gradeAr: 'الأول الثانوي', subject: 'Arabic', subjectAr: 'العربية', thumbnail: '📖', quality: '720p', chatMessages: 0, reactions: 0 },
    { id: 'LS-005', title: 'English — Essay Writing', titleAr: 'الإنجليزية — كتابة المقال', teacher: 'Ms. Layla Hassan', teacherAr: 'أ. ليلى حسن', course: 'English Composition', courseAr: 'الإنشاء الإنجليزي', status: 'ended', viewers: 0, peak: 156, startedAt: 'Yesterday', duration: '52:18', grade: 'Grade 11', gradeAr: 'الثاني الثانوي', subject: 'English', subjectAr: 'الإنجليزية', thumbnail: '✍️', quality: '1080p', chatMessages: 218, reactions: 92 },
    { id: 'LS-006', title: 'Biology — Cell Division', titleAr: 'الأحياء — انقسام الخلايا', teacher: 'Dr. Nour Adel', teacherAr: 'د. نور عادل', course: 'Cell Biology', courseAr: 'بيولوجيا الخلية', status: 'ended', viewers: 0, peak: 98, startedAt: 'Yesterday', duration: '41:05', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', subject: 'Biology', subjectAr: 'الأحياء', thumbnail: '🧬', quality: '1080p', chatMessages: 156, reactions: 68 },
  ]);

  readonly courses = signal<Course[]>([
    { id: 'C-001', title: 'Algebra Advanced', titleAr: 'الجبر المتقدم', teacher: 'Dr. Ahmed Hassan', teacherAr: 'د. أحمد حسن', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', subject: 'Mathematics', subjectAr: 'الرياضيات', price: 1500, discount: 20, lessons: 48, hours: 62, students: 1247, rating: 4.9, reviews: 342, thumbnail: '📐', icon: '📐', status: 'published', language: 'both', lastUpdate: '2 days ago' },
    { id: 'C-002', title: 'Physics Fundamentals', titleAr: 'أساسيات الفيزياء', teacher: 'Prof. Sara Ibrahim', teacherAr: 'أ.د. سارة إبراهيم', grade: 'Grade 11', gradeAr: 'الثاني الثانوي', subject: 'Physics', subjectAr: 'الفيزياء', price: 1200, discount: 15, lessons: 36, hours: 48, students: 892, rating: 4.8, reviews: 218, thumbnail: '⚛️', icon: '⚛️', status: 'published', language: 'ar', lastUpdate: '5 days ago' },
    { id: 'C-003', title: 'Organic Chemistry', titleAr: 'الكيمياء العضوية', teacher: 'Dr. Khaled Sami', teacherAr: 'د. خالد سامي', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', subject: 'Chemistry', subjectAr: 'الكيمياء', price: 1400, lessons: 42, hours: 54, students: 634, rating: 4.7, reviews: 156, thumbnail: '🧪', icon: '🧪', status: 'published', language: 'ar', lastUpdate: '1 day ago' },
    { id: 'C-004', title: 'Arabic Grammar', titleAr: 'النحو العربي', teacher: 'Mr. Mostafa Kamel', teacherAr: 'أ. مصطفى كامل', grade: 'Grade 10', gradeAr: 'الأول الثانوي', subject: 'Arabic', subjectAr: 'العربية', price: 800, lessons: 32, hours: 40, students: 1523, rating: 4.9, reviews: 487, thumbnail: '📖', icon: '📖', status: 'published', language: 'ar', lastUpdate: '1 week ago' },
    { id: 'C-005', title: 'English Composition', titleAr: 'الإنشاء الإنجليزي', teacher: 'Ms. Layla Hassan', teacherAr: 'أ. ليلى حسن', grade: 'Grade 11', gradeAr: 'الثاني الثانوي', subject: 'English', subjectAr: 'الإنجليزية', price: 1000, lessons: 28, hours: 36, students: 741, rating: 4.6, reviews: 183, thumbnail: '✍️', icon: '✍️', status: 'published', language: 'en', lastUpdate: '3 days ago' },
    { id: 'C-006', title: 'Cell Biology', titleAr: 'بيولوجيا الخلية', teacher: 'Dr. Nour Adel', teacherAr: 'د. نور عادل', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', subject: 'Biology', subjectAr: 'الأحياء', price: 1300, lessons: 38, hours: 46, students: 512, rating: 4.8, reviews: 142, thumbnail: '🧬', icon: '🧬', status: 'published', language: 'ar', lastUpdate: '4 days ago' },
    { id: 'C-007', title: 'Modern History', titleAr: 'التاريخ الحديث', teacher: 'Mr. Tarek Mostafa', teacherAr: 'أ. طارق مصطفى', grade: 'Grade 11', gradeAr: 'الثاني الثانوي', subject: 'History', subjectAr: 'التاريخ', price: 700, lessons: 24, hours: 30, students: 342, rating: 4.5, reviews: 89, thumbnail: '📜', icon: '📜', status: 'draft', language: 'ar', lastUpdate: '1 hour ago' },
    { id: 'C-008', title: 'Python Programming', titleAr: 'برمجة بايثون', teacher: 'Eng. Omar Khaled', teacherAr: 'م. عمر خالد', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', subject: 'Computer Science', subjectAr: 'علوم الحاسب', price: 1800, discount: 25, lessons: 56, hours: 72, students: 421, rating: 4.9, reviews: 218, thumbnail: '🐍', icon: '🐍', status: 'review', language: 'both', lastUpdate: '30 min ago' },
  ]);

  readonly library = signal<LibraryItem[]>([
    { id: 'L-001', title: 'Algebra Chapter 5 Notes', titleAr: 'ملخص الفصل الخامس جبر', type: 'pdf', size: '2.4 MB', pages: 42, course: 'Algebra Advanced', courseAr: 'الجبر المتقدم', downloads: 1247, views: 3421, uploadedAt: '2 days ago', uploadedBy: 'Dr. Ahmed', icon: '📄' },
    { id: 'L-002', title: 'Physics Labs Videos', titleAr: 'فيديوهات معامل الفيزياء', type: 'video', size: '850 MB', course: 'Physics Fundamentals', courseAr: 'أساسيات الفيزياء', downloads: 892, views: 2187, uploadedAt: '5 days ago', uploadedBy: 'Prof. Sara', icon: '🎥' },
    { id: 'L-003', title: 'Chemistry Slides Bundle', titleAr: 'مجموعة شرائح الكيمياء', type: 'slide', size: '48 MB', pages: 180, course: 'Organic Chemistry', courseAr: 'الكيمياء العضوية', downloads: 634, views: 1247, uploadedAt: '1 week ago', uploadedBy: 'Dr. Khaled', icon: '📊' },
    { id: 'L-004', title: 'Arabic Poetry Audio', titleAr: 'صوتيات الشعر العربي', type: 'audio', size: '120 MB', course: 'Arabic Grammar', courseAr: 'النحو العربي', downloads: 512, views: 892, uploadedAt: '3 days ago', uploadedBy: 'Mr. Mostafa', icon: '🎵' },
    { id: 'L-005', title: 'English Vocabulary PDF', titleAr: 'ملف مفردات الإنجليزية', type: 'pdf', size: '1.8 MB', pages: 68, course: 'English Composition', courseAr: 'الإنشاء الإنجليزي', downloads: 741, views: 1523, uploadedAt: '4 days ago', uploadedBy: 'Ms. Layla', icon: '📄' },
    { id: 'L-006', title: 'Biology Diagrams Pack', titleAr: 'حزمة مخططات الأحياء', type: 'doc', size: '12 MB', course: 'Cell Biology', courseAr: 'بيولوجيا الخلية', downloads: 421, views: 892, uploadedAt: '6 days ago', uploadedBy: 'Dr. Nour', icon: '📝' },
  ]);

  readonly exams = signal<Exam[]>([
    { id: 'E-001', title: 'Algebra Midterm', titleAr: 'امتحان منتصف الفصل — جبر', course: 'Algebra Advanced', courseAr: 'الجبر المتقدم', type: 'midterm', questions: 25, duration: 60, totalMarks: 100, avgScore: 78, attempts: 1124, passRate: 87, scheduledFor: '2024-12-20', status: 'published', grade: 'Grade 12' },
    { id: 'E-002', title: 'Physics Final', titleAr: 'الفيزياء — نهائي', course: 'Physics Fundamentals', courseAr: 'أساسيات الفيزياء', type: 'final', questions: 40, duration: 120, totalMarks: 150, avgScore: 72, attempts: 847, passRate: 82, scheduledFor: '2025-01-15', status: 'published', grade: 'Grade 11' },
    { id: 'E-003', title: 'Chemistry Quiz 3', titleAr: 'كويز الكيمياء 3', course: 'Organic Chemistry', courseAr: 'الكيمياء العضوية', type: 'quiz', questions: 15, duration: 30, totalMarks: 30, avgScore: 84, attempts: 421, passRate: 92, status: 'published', grade: 'Grade 12' },
    { id: 'E-004', title: 'Arabic Practice', titleAr: 'تدريب العربية', course: 'Arabic Grammar', courseAr: 'النحو العربي', type: 'practice', questions: 20, duration: 40, totalMarks: 40, avgScore: 88, attempts: 1523, passRate: 95, status: 'published', grade: 'Grade 10' },
    { id: 'E-005', title: 'English Final', titleAr: 'الإنجليزية — نهائي', course: 'English Composition', courseAr: 'الإنشاء الإنجليزي', type: 'final', questions: 35, duration: 90, totalMarks: 120, avgScore: 0, attempts: 0, passRate: 0, scheduledFor: '2025-01-20', status: 'draft', grade: 'Grade 11' },
    { id: 'E-006', title: 'Biology Midterm', titleAr: 'امتحان منتصف الفصل — أحياء', course: 'Cell Biology', courseAr: 'بيولوجيا الخلية', type: 'midterm', questions: 30, duration: 75, totalMarks: 100, avgScore: 81, attempts: 512, passRate: 89, status: 'published', grade: 'Grade 12' },
  ]);

  readonly questions = signal<Question[]>([
    { id: 'Q-001', text: 'Solve for x: 2x² + 5x - 3 = 0', textAr: 'أوجد قيمة x: 2x² + 5x - 3 = 0', type: 'mcq', difficulty: 'medium', subject: 'math', subjectAr: 'الرياضيات', correctRate: 72, usageCount: 24, marks: 3 },
    { id: 'Q-002', text: 'State Newton\'s Second Law', textAr: 'اذكر قانون نيوتن الثاني', type: 'short', difficulty: 'easy', subject: 'physics', subjectAr: 'الفيزياء', correctRate: 89, usageCount: 42, marks: 5 },
    { id: 'Q-003', text: 'Which of the following is an alkane?', textAr: 'أي من التالي يعتبر ألكان؟', type: 'mcq', difficulty: 'easy', subject: 'chemistry', subjectAr: 'الكيمياء', correctRate: 91, usageCount: 18, marks: 2 },
    { id: 'Q-004', text: 'Explain the process of mitosis', textAr: 'اشرح عملية الانقسام المتساوي', type: 'essay', difficulty: 'hard', subject: 'biology', subjectAr: 'الأحياء', correctRate: 45, usageCount: 8, marks: 10 },
    { id: 'Q-005', text: 'إعراب: "جاء الطالبُ المجتهدُ"', textAr: 'إعراب: "جاء الطالبُ المجتهدُ"', type: 'short', difficulty: 'medium', subject: 'arabic', subjectAr: 'العربية', correctRate: 68, usageCount: 32, marks: 5 },
    { id: 'Q-006', text: 'Is the following sentence correct?', textAr: 'هل الجملة التالية صحيحة؟', type: 'true-false', difficulty: 'easy', subject: 'english', subjectAr: 'الإنجليزية', correctRate: 82, usageCount: 28, marks: 1 },
    { id: 'Q-007', text: 'What is the capital of Egypt?', textAr: 'ما هي عاصمة مصر؟', type: 'mcq', difficulty: 'easy', subject: 'history', subjectAr: 'التاريخ', correctRate: 96, usageCount: 56, marks: 1 },
    { id: 'Q-008', text: 'Write a recursive function for factorial', textAr: 'اكتب دالة تفاعلية لحساب المضروب', type: 'essay', difficulty: 'hard', subject: 'cs', subjectAr: 'علوم الحاسب', correctRate: 38, usageCount: 12, marks: 10 },
  ]);

  readonly students = signal<Student[]>([
    { id: 'S-001', name: 'Omar Khaled Mohamed', nameAr: 'عمر خالد محمد', avatar: '👦', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', school: 'El-Nasr High School', parent: 'Khaled Mohamed', parentPhone: '+20 100 555 0001', enrolledCourses: 4, avgScore: 92, attendance: 96, attendancePct: 96, lastActive: '5m ago', status: 'active', balance: 0 },
    { id: 'S-002', name: 'Layla Hassan Ahmed', nameAr: 'ليلى حسن أحمد', avatar: '👧', grade: 'Grade 11', gradeAr: 'الثاني الثانوي', school: 'El-Salam Language School', parent: 'Hassan Ahmed', parentPhone: '+20 100 555 0002', enrolledCourses: 3, avgScore: 88, attendance: 94, attendancePct: 94, lastActive: '1h ago', status: 'active', balance: 0 },
    { id: 'S-003', name: 'Youssef Karim Sami', nameAr: 'يوسف كريم سامي', avatar: '👦', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', school: 'Modern Academy', parent: 'Karim Sami', parentPhone: '+20 100 555 0003', enrolledCourses: 5, avgScore: 95, attendance: 98, attendancePct: 98, lastActive: '10m ago', status: 'active', balance: 0 },
    { id: 'S-004', name: 'Nour Ibrahim Adel', nameAr: 'نور إبراهيم عادل', avatar: '👧', grade: 'Grade 10', gradeAr: 'الأول الثانوي', school: 'Cairo British School', parent: 'Ibrahim Adel', parentPhone: '+20 100 555 0004', enrolledCourses: 2, avgScore: 76, attendance: 82, attendancePct: 82, lastActive: '2h ago', status: 'active', balance: 500 },
    { id: 'S-005', name: 'Sara Tarek Mostafa', nameAr: 'سارة طارق مصطفى', avatar: '👧', grade: 'Grade 11', gradeAr: 'الثاني الثانوي', school: 'El-Nasr High School', parent: 'Tarek Mostafa', parentPhone: '+20 100 555 0005', enrolledCourses: 4, avgScore: 84, attendance: 90, attendancePct: 90, lastActive: '30m ago', status: 'active', balance: 0 },
    { id: 'S-006', name: 'Mohamed Amr Hassan', nameAr: 'محمد عمرو حسن', avatar: '👦', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', school: 'STEM School', parent: 'Amr Hassan', parentPhone: '+20 100 555 0006', enrolledCourses: 6, avgScore: 98, attendance: 99, attendancePct: 99, lastActive: '15m ago', status: 'active', balance: 0 },
    { id: 'S-007', name: 'Hana Walid Sayed', nameAr: 'هنا وليد سيد', avatar: '👧', grade: 'Grade 10', gradeAr: 'الأول الثانوي', school: 'El-Salam Language School', parent: 'Walid Sayed', parentPhone: '+20 100 555 0007', enrolledCourses: 1, avgScore: 62, attendance: 68, attendancePct: 68, lastActive: '1 day ago', status: 'inactive', balance: 1200 },
    { id: 'S-008', name: 'Khaled Nabil Rashad', nameAr: 'خالد نبيل رشاد', avatar: '👦', grade: 'Grade 11', gradeAr: 'الثاني الثانوي', school: 'Modern Academy', parent: 'Nabil Rashad', parentPhone: '+20 100 555 0008', enrolledCourses: 3, avgScore: 71, attendance: 74, attendancePct: 74, lastActive: '5h ago', status: 'suspended', balance: 2000 },
  ]);

  readonly teachers = signal<Teacher[]>([
    { id: 'T-001', name: 'Dr. Ahmed Hassan', nameAr: 'د. أحمد حسن', avatar: '👨‍🏫', subject: 'Mathematics', subjectAr: 'الرياضيات', courses: 3, students: 1247, rating: 4.9, reviews: 342, liveHours: 142, status: 'active', salary: 28000, joinDate: '2019-09-01' },
    { id: 'T-002', name: 'Prof. Sara Ibrahim', nameAr: 'أ.د. سارة إبراهيم', avatar: '👩‍🏫', subject: 'Physics', subjectAr: 'الفيزياء', courses: 2, students: 892, rating: 4.8, reviews: 218, liveHours: 118, status: 'active', salary: 24000, joinDate: '2020-03-15' },
    { id: 'T-003', name: 'Dr. Khaled Sami', nameAr: 'د. خالد سامي', avatar: '👨‍🔬', subject: 'Chemistry', subjectAr: 'الكيمياء', courses: 2, students: 634, rating: 4.7, reviews: 156, liveHours: 96, status: 'active', salary: 22000, joinDate: '2020-09-01' },
    { id: 'T-004', name: 'Mr. Mostafa Kamel', nameAr: 'أ. مصطفى كامل', avatar: '👨‍🏫', subject: 'Arabic', subjectAr: 'العربية', courses: 2, students: 1523, rating: 4.9, reviews: 487, liveHours: 168, status: 'active', salary: 26000, joinDate: '2018-09-01' },
    { id: 'T-005', name: 'Ms. Layla Hassan', nameAr: 'أ. ليلى حسن', avatar: '👩‍🏫', subject: 'English', subjectAr: 'الإنجليزية', courses: 2, students: 741, rating: 4.6, reviews: 183, liveHours: 102, status: 'away', salary: 20000, joinDate: '2021-01-10' },
    { id: 'T-006', name: 'Dr. Nour Adel', nameAr: 'د. نور عادل', avatar: '👩‍🔬', subject: 'Biology', subjectAr: 'الأحياء', courses: 2, students: 512, rating: 4.8, reviews: 142, liveHours: 84, status: 'active', salary: 23000, joinDate: '2020-06-20' },
    { id: 'T-007', name: 'Eng. Omar Khaled', nameAr: 'م. عمر خالد', avatar: '👨‍💻', subject: 'Computer Science', subjectAr: 'علوم الحاسب', courses: 1, students: 421, rating: 4.9, reviews: 218, liveHours: 72, status: 'active', salary: 25000, joinDate: '2022-09-01' },
    { id: 'T-008', name: 'Mr. Tarek Mostafa', nameAr: 'أ. طارق مصطفى', avatar: '👨‍🏫', subject: 'History', subjectAr: 'التاريخ', courses: 1, students: 342, rating: 4.5, reviews: 89, liveHours: 48, status: 'offline', salary: 18000, joinDate: '2023-02-01' },
  ]);

  readonly parents = signal<Parent[]>([
    { id: 'P-001', name: 'Khaled Mohamed Ali', nameAr: 'خالد محمد علي', avatar: '👨', phone: '+20 100 555 1001', email: 'khaled.m@example.com', children: 1, childrenNames: ['Omar Khaled'], notifications: true, balance: 0, lastLogin: '2h ago' },
    { id: 'P-002', name: 'Hassan Ahmed Mahmoud', nameAr: 'حسن أحمد محمود', avatar: '👨', phone: '+20 100 555 1002', email: 'hassan.a@example.com', children: 2, childrenNames: ['Layla Hassan', 'Ahmed Hassan'], notifications: true, balance: 0, lastLogin: '30m ago' },
    { id: 'P-003', name: 'Karim Sami Ibrahim', nameAr: 'كريم سامي إبراهيم', avatar: '👨', phone: '+20 100 555 1003', email: 'karim.s@example.com', children: 1, childrenNames: ['Youssef Karim'], notifications: false, balance: 0, lastLogin: '1h ago' },
    { id: 'P-004', name: 'Ibrahim Adel Mostafa', nameAr: 'إبراهيم عادل مصطفى', avatar: '👨', phone: '+20 100 555 1004', email: 'ibrahim.a@example.com', children: 1, childrenNames: ['Nour Ibrahim'], notifications: true, balance: 500, lastLogin: '3h ago' },
    { id: 'P-005', name: 'Tarek Mostafa Sayed', nameAr: 'طارق مصطفى سيد', avatar: '👨', phone: '+20 100 555 1005', email: 'tarek.m@example.com', children: 1, childrenNames: ['Sara Tarek'], notifications: true, balance: 0, lastLogin: '1 day ago' },
  ]);

  readonly classes = signal<ClassRoom[]>([
    { id: 'CL-001', name: 'Algebra A', nameAr: 'الجبر أ', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', teacher: 'Dr. Ahmed Hassan', teacherAr: 'د. أحمد حسن', students: 28, capacity: 30, room: 'R-201', schedule: 'Sun/Tue/Thu 10:00', nextSession: '10:00 AM', subject: 'Mathematics', subjectAr: 'الرياضيات' },
    { id: 'CL-002', name: 'Physics B', nameAr: 'الفيزياء ب', grade: 'Grade 11', gradeAr: 'الثاني الثانوي', teacher: 'Prof. Sara Ibrahim', teacherAr: 'أ.د. سارة إبراهيم', students: 24, capacity: 30, room: 'R-105', schedule: 'Sun/Tue 10:30', nextSession: '10:30 AM', subject: 'Physics', subjectAr: 'الفيزياء' },
    { id: 'CL-003', name: 'Chemistry C', nameAr: 'الكيمياء ج', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', teacher: 'Dr. Khaled Sami', teacherAr: 'د. خالد سامي', students: 29, capacity: 30, room: 'R-302', schedule: 'Mon/Wed 2:00', nextSession: '2:00 PM', subject: 'Chemistry', subjectAr: 'الكيمياء' },
    { id: 'CL-004', name: 'Arabic A', nameAr: 'العربية أ', grade: 'Grade 10', gradeAr: 'الأول الثانوي', teacher: 'Mr. Mostafa Kamel', teacherAr: 'أ. مصطفى كامل', students: 26, capacity: 30, room: 'R-401', schedule: 'Sun/Tue/Thu 4:00', nextSession: '4:00 PM', subject: 'Arabic', subjectAr: 'العربية' },
    { id: 'CL-005', name: 'English B', nameAr: 'الإنجليزية ب', grade: 'Grade 11', gradeAr: 'الثاني الثانوي', teacher: 'Ms. Layla Hassan', teacherAr: 'أ. ليلى حسن', students: 22, capacity: 25, room: 'R-105', schedule: 'Mon/Wed 11:00', nextSession: 'Tomorrow', subject: 'English', subjectAr: 'الإنجليزية' },
    { id: 'CL-006', name: 'Biology A', nameAr: 'الأحياء أ', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', teacher: 'Dr. Nour Adel', teacherAr: 'د. نور عادل', students: 18, capacity: 25, room: 'R-208', schedule: 'Tue/Thu 12:00', nextSession: 'Tomorrow', subject: 'Biology', subjectAr: 'الأحياء' },
  ]);

  readonly blogs = signal<BlogPost[]>([
    { id: 'B-001', title: '10 Tips for Acing Your Final Exams', titleAr: '10 نصائح للتفوق في الامتحانات النهائية', author: 'Dr. Ahmed Hassan', authorAr: 'د. أحمد حسن', excerpt: 'Discover the proven study techniques that top students use to prepare for final exams.', excerptAr: 'اكتشف تقنيات المذاكرة المُثبتة التي يستخدمها الطلاب المتفوقون للاستعداد للامتحانات النهائية.', category: 'Study Tips', categoryAr: 'نصائح المذاكرة', publishedAt: '2 days ago', views: 12470, comments: 142, likes: 892, readTime: 8, status: 'published', thumbnail: '📚' },
    { id: 'B-002', title: 'Understanding Quadratic Equations', titleAr: 'فهم المعادلات التربيعية', author: 'Prof. Sara Ibrahim', authorAr: 'أ.د. سارة إبراهيم', excerpt: 'A comprehensive guide to solving quadratic equations using different methods.', excerptAr: 'دليل شامل لحل المعادلات التربيعية بطرق مختلفة.', category: 'Mathematics', categoryAr: 'الرياضيات', publishedAt: '5 days ago', views: 8921, comments: 98, likes: 634, readTime: 12, status: 'published', thumbnail: '📐' },
    { id: 'B-003', title: 'How to Build Better Study Habits', titleAr: 'كيف تبني عادات مذاكرة أفضل', author: 'Ms. Layla Hassan', authorAr: 'أ. ليلى حسن', excerpt: 'Small daily habits that compound into massive academic success over time.', excerptAr: 'عادات يومية صغيرة تتحول إلى نجاح أكاديمي هائل مع الوقت.', category: 'Motivation', categoryAr: 'التحفيز', publishedAt: '1 week ago', views: 15234, comments: 218, likes: 1247, readTime: 6, status: 'published', thumbnail: '💡' },
    { id: 'B-004', title: 'Chemistry in Daily Life', titleAr: 'الكيمياء في الحياة اليومية', author: 'Dr. Khaled Sami', authorAr: 'د. خالد سامي', excerpt: 'Explore how chemical reactions shape the world around us every day.', excerptAr: 'استكشف كيف تشكل التفاعلات الكيميائية العالم من حولنا كل يوم.', category: 'Science', categoryAr: 'العلوم', publishedAt: '3 days ago', views: 4218, comments: 52, likes: 342, readTime: 10, status: 'published', thumbnail: '🧪' },
    { id: 'B-005', title: 'The Importance of Arabic Grammar', titleAr: 'أهمية النحو العربي', author: 'Mr. Mostafa Kamel', authorAr: 'أ. مصطفى كامل', excerpt: 'Why mastering Arabic grammar is essential for every student.', excerptAr: 'لماذا إتقان النحو العربي ضروري لكل طالب.', category: 'Languages', categoryAr: 'اللغات', publishedAt: '1 day ago', views: 6124, comments: 87, likes: 512, readTime: 9, status: 'published', thumbnail: '📖' },
    { id: 'B-006', title: 'Python for Beginners: Getting Started', titleAr: 'بايثون للمبتدئين: البداية', author: 'Eng. Omar Khaled', authorAr: 'م. عمر خالد', excerpt: 'Your first steps into programming with Python, the beginner-friendly language.', excerptAr: 'خطواتك الأولى في البرمجة مع بايثون، اللغة الصديقة للمبتدئين.', category: 'Programming', categoryAr: 'البرمجة', publishedAt: '4 days ago', views: 9842, comments: 156, likes: 741, readTime: 15, status: 'draft', thumbnail: '🐍' },
  ]);

  readonly reviews = signal<Review[]>([
    { id: 'R-001', course: 'Algebra Advanced', courseAr: 'الجبر المتقدم', student: 'Omar Khaled', studentAr: 'عمر خالد', rating: 5, comment: 'Best math course I have ever taken. Dr. Ahmed explains everything clearly.', commentAr: 'أفضل كورس رياضيات أخذته. د. أحمد يشرح كل شيء بوضوح.', date: '2024-12-08', helpful: 42, replied: false },
    { id: 'R-002', course: 'Physics Fundamentals', courseAr: 'أساسيات الفيزياء', student: 'Layla Hassan', studentAr: 'ليلى حسن', rating: 5, comment: 'Prof. Sara is amazing. The live sessions are very interactive.', commentAr: 'أ.د. سارة رائعة. الجلسات المباشرة تفاعلية للغاية.', date: '2024-12-07', helpful: 38, replied: true },
    { id: 'R-003', course: 'Organic Chemistry', courseAr: 'الكيمياء العضوية', student: 'Youssef Karim', studentAr: 'يوسف كريم', rating: 4, comment: 'Great content but the pace is a bit fast.', commentAr: 'المحتوى رائع لكن الإيقاع سريع قليلاً.', date: '2024-12-06', helpful: 24, replied: true },
    { id: 'R-004', course: 'Arabic Grammar', courseAr: 'النحو العربي', student: 'Nour Ibrahim', studentAr: 'نور إبراهيم', rating: 5, comment: 'Excellent explanation of complex grammar rules.', commentAr: 'شرح ممتاز لقواعد النحو المعقدة.', date: '2024-12-05', helpful: 56, replied: false },
    { id: 'R-005', course: 'English Composition', courseAr: 'الإنشاء الإنجليزي', student: 'Sara Tarek', studentAr: 'سارة طارق', rating: 4, comment: 'Very helpful for essay writing. Would love more exercises.', commentAr: 'مفيد جداً لكتابة المقال. أتمنى المزيد من التمارين.', date: '2024-12-04', helpful: 18, replied: false },
  ]);

  readonly announcements = signal<Announcement[]>([
    { id: 'AN-001', title: 'Final Exams Schedule Released', titleAr: 'تم إصدار جدول الامتحانات النهائية', body: 'Check your portal for the full final exam schedule. Exams begin January 15th.', bodyAr: 'تحقق من بوابتك لجدول الامتحانات النهائية الكامل. تبدأ الامتحانات في 15 يناير.', audience: 'all', priority: 'high', createdAt: '2h ago', author: 'Admin', pinned: true },
    { id: 'AN-002', title: 'New Course: Python Programming', titleAr: 'كورس جديد: برمجة بايثون', body: 'We are excited to announce our new Python Programming course for Grade 12 students.', bodyAr: 'يسعدنا الإعلان عن كورس برمجة بايثون الجديد لطلاب الثالث الثانوي.', audience: 'students', priority: 'normal', createdAt: '5h ago', author: 'Admin', pinned: false },
    { id: 'AN-003', title: 'Parent-Teacher Meeting', titleAr: 'اجتماع أولياء الأمور والمعلمين', body: 'The monthly parent-teacher meeting will be held on Saturday at 6 PM.', bodyAr: 'سيُعقد الاجتماع الشهري لأولياء الأمور والمعلمين يوم السبت الساعة 6 مساءً.', audience: 'parents', priority: 'high', createdAt: '1 day ago', author: 'Admin', pinned: false },
    { id: 'AN-004', title: 'System Maintenance Tonight', titleAr: 'صيانة النظام الليلة', body: 'The platform will be under maintenance tonight from 2 AM to 4 AM.', bodyAr: 'ستخضع المنصة للصيانة الليلة من 2 صباحاً حتى 4 صباحاً.', audience: 'all', priority: 'urgent', createdAt: '3h ago', author: 'Admin', pinned: true },
    { id: 'AN-005', title: 'Winter Break Dates', titleAr: 'مواعيد العطلة الشتوية', body: 'Winter break will begin on December 25th and last until January 5th.', bodyAr: 'تبدأ العطلة الشتوية من 25 ديسمبر وتستمر حتى 5 يناير.', audience: 'all', priority: 'normal', createdAt: '3 days ago', author: 'Admin', pinned: false },
  ]);

  readonly messages = signal<Message[]>([
    { id: 1, from: 'Dr. Ahmed Hassan', fromAr: 'د. أحمد حسن', avatar: '👨‍🏫', subject: 'Great work on the midterm', subjectAr: 'أداء رائع في امتحان منتصف الفصل', preview: 'I wanted to congratulate you on your excellent performance in the Algebra midterm...', previewAr: 'أردت أن أهنئك على أدائك الممتاز في امتحان منتصف الفصل في الجبر...', time: '10m ago', unread: true, priority: 'normal' },
    { id: 2, from: 'Admin', fromAr: 'الإدارة', avatar: '👑', subject: 'Fee Payment Reminder', subjectAr: 'تذكير بدفع الرسوم', preview: 'This is a friendly reminder that your December fees are due by the 20th...', previewAr: 'هذا تذكير ودود بأن رسوم ديسمبر مستحقة قبل يوم 20...', time: '2h ago', unread: true, priority: 'high' },
    { id: 3, from: 'Ms. Layla Hassan', fromAr: 'أ. ليلى حسن', avatar: '👩‍🏫', subject: 'Assignment Feedback', subjectAr: 'ملاحظات على الواجب', preview: 'Your essay was well-structured. Here are a few notes on how to improve further...', previewAr: 'مقالك كان منظم بشكل جيد. هذه بعض الملاحظات لتحسينه أكثر...', time: '1 day ago', unread: false, priority: 'normal' },
    { id: 4, from: 'Parent Council', fromAr: 'مجلس الأهالي', avatar: '👨‍👩‍👧', subject: 'Meeting Invitation', subjectAr: 'دعوة اجتماع', preview: 'You are cordially invited to attend the monthly parent council meeting...', previewAr: 'أنت مدعو بحرارة لحضور اجتماع مجلس الأهالي الشهري...', time: '3 days ago', unread: false, priority: 'normal' },
    { id: 5, from: 'System', fromAr: 'النظام', avatar: '⚙️', subject: 'Login from new device', subjectAr: 'تسجيل دخول من جهاز جديد', preview: 'We noticed a new login to your account from a new device...', previewAr: 'لاحظنا تسجيل دخول جديد إلى حسابك من جهاز جديد...', time: '5 days ago', unread: false, priority: 'low' },
  ]);

  readonly schedule: ScheduleItem[] = [
    { id: 'SCH-001', day: 'sat', dayAr: 'السبت', time: '10:00', duration: '60 min', title: 'Algebra Live', titleAr: 'بث مباشر جبر', teacher: 'Dr. Ahmed Hassan', teacherAr: 'د. أحمد حسن', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', type: 'live', room: 'R-201' },
    { id: 'SCH-002', day: 'sat', dayAr: 'السبت', time: '11:00', duration: '45 min', title: 'Physics Review', titleAr: 'مراجعة فيزياء', teacher: 'Prof. Sara Ibrahim', teacherAr: 'أ.د. سارة إبراهيم', grade: 'Grade 11', gradeAr: 'الثاني الثانوي', type: 'review', room: 'R-105' },
    { id: 'SCH-003', day: 'sun', dayAr: 'الأحد', time: '10:00', duration: '60 min', title: 'Algebra Live', titleAr: 'بث مباشر جبر', teacher: 'Dr. Ahmed Hassan', teacherAr: 'د. أحمد حسن', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', type: 'live', room: 'R-201' },
    { id: 'SCH-004', day: 'sun', dayAr: 'الأحد', time: '14:00', duration: '90 min', title: 'Chemistry Exam', titleAr: 'امتحان كيمياء', teacher: 'Dr. Khaled Sami', teacherAr: 'د. خالد سامي', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', type: 'exam', room: 'R-302' },
    { id: 'SCH-005', day: 'mon', dayAr: 'الاثنين', time: '11:00', duration: '45 min', title: 'English Class', titleAr: 'حصة إنجليزية', teacher: 'Ms. Layla Hassan', teacherAr: 'أ. ليلى حسن', grade: 'Grade 11', gradeAr: 'الثاني الثانوي', type: 'live', room: 'R-105' },
    { id: 'SCH-006', day: 'mon', dayAr: 'الاثنين', time: '14:00', duration: '60 min', title: 'Chemistry Live', titleAr: 'بث مباشر كيمياء', teacher: 'Dr. Khaled Sami', teacherAr: 'د. خالد سامي', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', type: 'live', room: 'R-302' },
    { id: 'SCH-007', day: 'tue', dayAr: 'الثلاثاء', time: '10:00', duration: '60 min', title: 'Algebra Live', titleAr: 'بث مباشر جبر', teacher: 'Dr. Ahmed Hassan', teacherAr: 'د. أحمد حسن', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', type: 'live', room: 'R-201' },
    { id: 'SCH-008', day: 'tue', dayAr: 'الثلاثاء', time: '12:00', duration: '60 min', title: 'Biology Live', titleAr: 'بث مباشر أحياء', teacher: 'Dr. Nour Adel', teacherAr: 'د. نور عادل', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', type: 'live', room: 'R-208' },
    { id: 'SCH-009', day: 'wed', dayAr: 'الأربعاء', time: '11:00', duration: '45 min', title: 'English Class', titleAr: 'حصة إنجليزية', teacher: 'Ms. Layla Hassan', teacherAr: 'أ. ليلى حسن', grade: 'Grade 11', gradeAr: 'الثاني الثانوي', type: 'live', room: 'R-105' },
    { id: 'SCH-010', day: 'wed', dayAr: 'الأربعاء', time: '14:00', duration: '60 min', title: 'Chemistry Live', titleAr: 'بث مباشر كيمياء', teacher: 'Dr. Khaled Sami', teacherAr: 'د. خالد سامي', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', type: 'live', room: 'R-302' },
    { id: 'SCH-011', day: 'thu', dayAr: 'الخميس', time: '10:00', duration: '60 min', title: 'Algebra Review', titleAr: 'مراجعة جبر', teacher: 'Dr. Ahmed Hassan', teacherAr: 'د. أحمد حسن', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', type: 'review', room: 'R-201' },
    { id: 'SCH-012', day: 'thu', dayAr: 'الخميس', time: '12:00', duration: '60 min', title: 'Biology Review', titleAr: 'مراجعة أحياء', teacher: 'Dr. Nour Adel', teacherAr: 'د. نور عادل', grade: 'Grade 12', gradeAr: 'الثالث الثانوي', type: 'review', room: 'R-208' },
  ];

  readonly finances = signal<FinancialRecord[]>([
    { id: 'F-001', date: '2024-12-08', type: 'income', category: 'Tuition', categoryAr: 'رسوم دراسية', amount: 45000, description: 'December fees - 30 students', descriptionAr: 'رسوم ديسمبر - 30 طالب', by: 'Admin', status: 'completed' },
    { id: 'F-002', date: '2024-12-08', type: 'expense', category: 'Salaries', categoryAr: 'رواتب', amount: 28000, description: 'Dr. Ahmed Hassan salary', descriptionAr: 'راتب د. أحمد حسن', by: 'Admin', status: 'completed' },
    { id: 'F-003', date: '2024-12-07', type: 'income', category: 'Courses', categoryAr: 'كورسات', amount: 18000, description: 'Algebra course sales', descriptionAr: 'مبيعات كورس الجبر', by: 'System', status: 'completed' },
    { id: 'F-004', date: '2024-12-07', type: 'expense', category: 'Infrastructure', categoryAr: 'بنية تحتية', amount: 3500, description: 'AWS hosting December', descriptionAr: 'استضافة AWS ديسمبر', by: 'Admin', status: 'completed' },
    { id: 'F-005', date: '2024-12-06', type: 'income', category: 'Tuition', categoryAr: 'رسوم دراسية', amount: 52000, description: 'December fees - 35 students', descriptionAr: 'رسوم ديسمبر - 35 طالب', by: 'Admin', status: 'completed' },
    { id: 'F-006', date: '2024-12-06', type: 'expense', category: 'Marketing', categoryAr: 'تسويق', amount: 8000, description: 'Social media ads', descriptionAr: 'إعلانات السوشيال ميديا', by: 'Admin', status: 'pending' },
    { id: 'F-007', date: '2024-12-05', type: 'income', category: 'Other', categoryAr: 'أخرى', amount: 4200, description: 'PDF library subscriptions', descriptionAr: 'اشتراكات المكتبة', by: 'System', status: 'completed' },
    { id: 'F-008', date: '2024-12-05', type: 'expense', category: 'Equipment', categoryAr: 'أجهزة', amount: 12000, description: 'New streaming camera', descriptionAr: 'كاميرا بث جديدة', by: 'Admin', status: 'completed' },
  ]);

  readonly notificationItems = signal([
    { id: 1, icon: '🔴', color: '#ff3b30', title: 'Live session started', titleAr: 'بدأ بث مباشر', message: 'Dr. Ahmed started "Algebra — Quadratic Equations"', messageAr: 'بدأ د. أحمد بث "الجبر — المعادلات التربيعية"', time: '2 min ago', type: 'live', read: false },
    { id: 2, icon: '📝', color: '#007aff', title: 'New exam published', titleAr: 'امتحان جديد', message: 'Physics Final exam is now available', messageAr: 'امتحان الفيزياء النهائي متاح الآن', time: '1h ago', type: 'exam', read: false },
    { id: 3, icon: '💬', color: '#34c759', title: 'New message from teacher', titleAr: 'رسالة جديدة من معلم', message: 'Prof. Sara replied to your question', messageAr: 'ردت أ.د. سارة على سؤالك', time: '3h ago', type: 'message', read: false },
    { id: 4, icon: '⭐', color: '#ff9500', title: 'New review received', titleAr: 'تقييم جديد', message: 'Omar Khaled rated Algebra Advanced 5 stars', messageAr: 'عمر خالد قيّم الجبر المتقدم 5 نجوم', time: '5h ago', type: 'review', read: true },
    { id: 5, icon: '💰', color: '#af52de', title: 'Payment received', titleAr: 'دفعة مستلمة', message: '45,000 EGP received from tuition fees', messageAr: 'تم استلام 45,000 جنيه من الرسوم الدراسية', time: '8h ago', type: 'finance', read: true },
    { id: 6, icon: '✅', color: '#34c759', title: 'Session ended', titleAr: 'انتهت الجلسة', message: 'English — Essay Writing session ended', messageAr: 'انتهت جلسة الإنجليزية — كتابة المقال', time: '1d ago', type: 'live', read: true },
  ]);

  readonly homeworkSubmissions = signal([
    { id: 'HW-001', studentId: 'S-001', student: 'Omar Khaled', studentAr: 'عمر خالد', assignment: 'Algebra Set 5', assignmentAr: 'مجموعة الجبر 5', submitted: '2h ago', status: 'submitted', score: 0, maxScore: 20 },
    { id: 'HW-002', studentId: 'S-002', student: 'Layla Hassan', studentAr: 'ليلى حسن', assignment: 'Physics Lab Report', assignmentAr: 'تقرير معمل الفيزياء', submitted: '5h ago', status: 'submitted', score: 0, maxScore: 30 },
    { id: 'HW-003', studentId: 'S-003', student: 'Youssef Karim', studentAr: 'يوسف كريم', assignment: 'Chemistry Quiz', assignmentAr: 'كويز الكيمياء', submitted: '1d ago', status: 'graded', score: 18, maxScore: 20 },
    { id: 'HW-004', studentId: 'S-004', student: 'Nour Ibrahim', studentAr: 'نور إبراهيم', assignment: 'Arabic Essay', assignmentAr: 'مقال العربية', submitted: '2d ago', status: 'late', score: 0, maxScore: 15 },
    { id: 'HW-005', studentId: 'S-005', student: 'Sara Tarek', studentAr: 'سارة طارق', assignment: 'English Composition', assignmentAr: 'الإنشاء الإنجليزي', submitted: '3d ago', status: 'graded', score: 26, maxScore: 30 },
    { id: 'HW-006', studentId: 'S-006', student: 'Mohamed Amr', studentAr: 'محمد عمرو', assignment: 'Python Project', assignmentAr: 'مشروع بايثون', submitted: '—', status: 'missing', score: 0, maxScore: 50 },
  ]);

  readonly reportTemplates = [
    { id: 'RPT-001', name: 'Student Performance', nameAr: 'أداء الطالب', desc: 'Detailed academic performance per student', descAr: 'أداء أكاديمي مفصل لكل طالب', icon: '📊', color: '#007aff' },
    { id: 'RPT-002', name: 'Attendance Report', nameAr: 'تقرير الحضور', desc: 'Monthly attendance breakdown', descAr: 'تفصيل الحضور الشهري', icon: '✓', color: '#34c759' },
    { id: 'RPT-003', name: 'Financial Summary', nameAr: 'ملخص مالي', desc: 'Income, expenses, and net profit', descAr: 'الإيرادات والمصروفات وصافي الربح', icon: '💰', color: '#ff9500' },
    { id: 'RPT-004', name: 'Course Analytics', nameAr: 'تحليلات الكورسات', desc: 'Enrollment, completion, and revenue per course', descAr: 'التسجيل والإكمال والإيراد لكل كورس', icon: '📈', color: '#af52de' },
    { id: 'RPT-005', name: 'Teacher Performance', nameAr: 'أداء المعلمين', desc: 'Ratings, hours, and student outcomes', descAr: 'التقييمات والساعات ونتائج الطلاب', icon: '👨‍🏫', color: '#5856d6' },
    { id: 'RPT-006', name: 'Live Session Report', nameAr: 'تقرير البث', desc: 'Streaming metrics and engagement', descAr: 'مقاييس البث والتفاعل', icon: '🎥', color: '#ff3b30' },
  ];

  readonly adminActions = [
    { id: 'A-001', label: 'Approve courses', labelAr: 'اعتماد الكورسات', desc: '3 pending review', descAr: '3 بانتظار المراجعة', icon: '✓' },
    { id: 'A-002', label: 'Process payments', labelAr: 'معالجة المدفوعات', desc: '8 pending transactions', descAr: '8 معاملات معلقة', icon: '💰' },
    { id: 'A-003', label: 'Review reports', labelAr: 'مراجعة التقارير', desc: '5 flagged items', descAr: '5 عناصر مُعلّمة', icon: '🚩' },
    { id: 'A-004', label: 'Manage users', labelAr: 'إدارة المستخدمين', desc: '1,247 active users', descAr: '1,247 مستخدم نشط', icon: '👥' },
    { id: 'A-005', label: 'Send announcement', labelAr: 'إرسال إعلان', desc: 'Broadcast to all', descAr: 'بث للجميع', icon: '📢' },
    { id: 'A-006', label: 'Backup database', labelAr: 'نسخ احتياطي', desc: 'Auto-backup is on', descAr: 'النسخ التلقائي مفعّل', icon: '💾' },
  ];

  readonly recentActivity = signal([
    { id: 1, icon: '✅', color: '#34c759', action: 'Course published', actionAr: 'تم نشر كورس', detail: 'Algebra Advanced by Dr. Ahmed', detailAr: 'الجبر المتقدم بواسطة د. أحمد', time: '2m ago' },
    { id: 2, icon: '💰', color: '#ff9500', action: 'Payment received', actionAr: 'دفعة مستلمة', detail: '45,000 EGP from tuition', detailAr: '45,000 جنيه من الرسوم', time: '5m ago' },
    { id: 3, icon: '👤', color: '#007aff', action: 'New student enrolled', actionAr: 'طالب جديد سجّل', detail: 'Omar Khaled joined Algebra Advanced', detailAr: 'عمر خالد انضم للجبر المتقدم', time: '15m ago' },
    { id: 4, icon: '⭐', color: '#ffcc00', action: 'New review', actionAr: 'تقييم جديد', detail: '5 stars for Physics Fundamentals', detailAr: '5 نجوم لأساسيات الفيزياء', time: '1h ago' },
    { id: 5, icon: '🎥', color: '#ff3b30', action: 'Live session started', actionAr: 'بدأ بث مباشر', detail: 'Algebra by Dr. Ahmed', detailAr: 'جبر بواسطة د. أحمد', time: '2h ago' },
  ]);

  readonly analyticsCards = computed(() => [
    { icon: '📈', color: '#007aff', label: this.t('Enrollments', 'التسجيلات'), value: '1,247', chart: this.spark(20) },
    { icon: '💰', color: '#34c759', label: this.t('Revenue', 'الإيراد'), value: '284K', chart: this.spark(22) },
    { icon: '🎥', color: '#ff3b30', label: this.t('Live hours', 'ساعات البث'), value: '892', chart: this.spark(18) },
    { icon: '⭐', color: '#ff9500', label: this.t('Avg rating', 'متوسط التقييم'), value: '4.82', chart: this.spark(24) },
  ]);

  readonly engagementData = computed(() => {
    const len = this.analyticsPeriod() === '7d' ? 7 : this.analyticsPeriod() === '30d' ? 30 : 90;
    return Array.from({ length: len }, () => ({
      views: Math.floor(Math.random() * 60) + 30,
      enrollments: Math.floor(Math.random() * 40) + 20,
      live: Math.floor(Math.random() * 30) + 10,
    }));
  });

  readonly topSubjects = computed(() => {
    const colors = ['#007aff', '#34c759', '#ff9500', '#af52de', '#ff3b30', '#5856d6', '#00c7be', '#ffcc00'];
    const icons: Record<string, string> = { math: '📐', physics: '⚛️', chemistry: '🧪', biology: '🧬', arabic: '📖', english: '✍️', history: '📜', cs: '💻' };
    const counts = new Map<string, number>();
    this.courses().forEach(c => counts.set(c.subject.toLowerCase(), (counts.get(c.subject.toLowerCase()) ?? 0) + c.students));
    const max = Math.max(...counts.values(), 1);
    return Array.from(counts.entries()).map(([id, count], i) => {
      const subj = this.subjects.find(s => s.name.toLowerCase() === id);
      return {
        id,
        name: subj?.name ?? id,
        nameAr: subj?.nameAr ?? id,
        count,
        pct: (count / max) * 100,
        color: colors[i % colors.length],
        icon: icons[id] ?? '📚',
      };
    }).sort((a, b) => b.count - a.count);
  });

  readonly gradePerformance = computed(() => {
    return this.grades.map(g => {
      const enrolled = this.students().filter(s => s.grade === g.name);
      const avg = enrolled.length ? Math.round(enrolled.reduce((sum, s) => sum + s.avgScore, 0) / enrolled.length) : 0;
      return { ...g, avgScore: avg };
    });
  });

  readonly analyticsKpis = computed(() => [
    { icon: '👁', label: this.t('Total views', 'إجمالي المشاهدات'), value: '248.7K', color: '#007aff' },
    { icon: '📈', label: this.t('Enrollment rate', 'معدل التسجيل'), value: '12.4%', color: '#34c759' },
    { icon: '⏱', label: this.t('Avg watch time', 'متوسط المشاهدة'), value: '38m', color: '#ff9500' },
    { icon: '🎯', label: this.t('Completion rate', 'معدل الإكمال'), value: '87.3%', color: '#af52de' },
  ]);

  readonly generalSettings = [
    { key: 'platformName', label: 'Platform name', labelAr: 'اسم المنصة', desc: 'Displayed across the app', descAr: 'يظهر في جميع أنحاء التطبيق', type: 'text' },
    { key: 'supportEmail', label: 'Support email', labelAr: 'بريد الدعم', desc: 'Where users send inquiries', descAr: 'حيث يرسل المستخدمون الاستفسارات', type: 'text' },
    { key: 'timezone', label: 'Timezone', labelAr: 'المنطقة الزمنية', desc: 'Used for scheduling', descAr: 'يُستخدم للجدولة', type: 'text' },
    { key: 'maxStudentsPerClass', label: 'Max students per class', labelAr: 'الحد الأقصى للطلاب في الفصل', desc: 'Enrollment cap', descAr: 'سقف التسجيل', type: 'number' },
    { key: 'allowSelfEnroll', label: 'Allow self enrollment', labelAr: 'السماح بالتسجيل الذاتي', desc: 'Students can enroll without approval', descAr: 'يمكن للطلاب التسجيل بدون موافقة', type: 'toggle' },
    { key: 'maintenanceMode', label: 'Maintenance mode', labelAr: 'وضع الصيانة', desc: 'Disable platform access', descAr: 'تعطيل الوصول للمنصة', type: 'toggle' },
    { key: 'autoBackup', label: 'Auto backup', labelAr: 'النسخ الاحتياطي التلقائي', desc: 'Daily database backups', descAr: 'نسخ احتياطي يومي', type: 'toggle' },
  ];

  readonly liveSettings = [
    { key: 'streamQuality', label: 'Default stream quality', labelAr: 'جودة البث الافتراضية', desc: '1080p, 720p, 480p', descAr: '1080p، 720p، 480p', type: 'text' },
    { key: 'maxConcurrentStreams', label: 'Max concurrent streams', labelAr: 'أقصى عدد بث متزامن', desc: 'Per server instance', descAr: 'لكل خادم', type: 'number' },
    { key: 'recordingAuto', label: 'Auto-record live sessions', labelAr: 'تسجيل تلقائي للجلسات', desc: 'Save all live streams', descAr: 'حفظ جميع البث المباشر', type: 'toggle' },
  ];

  readonly examFilters = [
    { id: 'all', label: 'All', labelAr: 'الكل' },
    { id: 'quiz', label: 'Quiz', labelAr: 'كويز' },
    { id: 'midterm', label: 'Midterm', labelAr: 'منتصف الفصل' },
    { id: 'final', label: 'Final', labelAr: 'نهائي' },
    { id: 'practice', label: 'Practice', labelAr: 'تدريب' },
  ];

  private spark(n: number): number[] {
    return Array.from({ length: n }, () => Math.floor(Math.random() * 80) + 20);
  }

  readonly nav = computed<PreviewNavItem[]>(() => [
    { id: 'dashboard', label: this.t('Dashboard', 'لوحة التحكم'), icon: '📊', group: this.t('Overview', 'نظرة عامة') },
    { id: 'live', label: this.t('Live', 'مباشر'), icon: '🔴', badge: this.liveNow(), group: this.t('Overview', 'نظرة عامة') },
    { id: 'recorded', label: this.t('Recorded', 'مسجل'), icon: '🎬', group: this.t('Overview', 'نظرة عامة') },
    { id: 'schedule', label: this.t('Schedule', 'الجدول'), icon: '📅', group: this.t('Overview', 'نظرة عامة') },
    { id: 'courses', label: this.t('Courses', 'الكورسات'), icon: '📚', badge: this.courses().length, group: this.t('Learning', 'التعليم') },
    { id: 'library', label: this.t('Library', 'المكتبة'), icon: '📁', badge: this.library().length, group: this.t('Learning', 'التعليم') },
    { id: 'exams', label: this.t('Exams', 'الامتحانات'), icon: '📝', badge: this.exams().length, group: this.t('Learning', 'التعليم') },
    { id: 'questions', label: this.t('Question Bank', 'بنك الأسئلة'), icon: '❓', badge: this.questions().length, group: this.t('Learning', 'التعليم') },
    { id: 'homework', label: this.t('Homework', 'الواجبات'), icon: '✎', badge: this.pendingHomework(), group: this.t('Learning', 'التعليم') },
    { id: 'reviews', label: this.t('Reviews', 'التقييمات'), icon: '⭐', badge: this.reviews().length, group: this.t('Learning', 'التعليم') },
    { id: 'students', label: this.t('Students', 'الطلاب'), icon: '👨‍🎓', badge: this.students().length, group: this.t('People', 'الأشخاص') },
    { id: 'teachers', label: this.t('Teachers', 'المعلمون'), icon: '👨‍🏫', badge: this.teachers().length, group: this.t('People', 'الأشخاص') },
    { id: 'parents', label: this.t('Parents', 'الأهالي'), icon: '👨‍👩‍👧', badge: this.parents().length, group: this.t('People', 'الأشخاص') },
    { id: 'classes', label: this.t('Classes', 'الفصول'), icon: '🏫', badge: this.classes().length, group: this.t('People', 'الأشخاص') },
    { id: 'admin', label: this.t('Admin', 'الإدارة'), icon: '👑', group: this.t('Admin', 'الإدارة') },
    { id: 'finances', label: this.t('Finances', 'المالية'), icon: '💰', group: this.t('Admin', 'الإدارة') },
    { id: 'reports', label: this.t('Reports', 'التقارير'), icon: '📊', group: this.t('Admin', 'الإدارة') },
    { id: 'analytics', label: this.t('Analytics', 'التحليلات'), icon: '📈', group: this.t('Admin', 'الإدارة') },
    { id: 'blog', label: this.t('Blog', 'المدونة'), icon: '📰', badge: this.blogs().length, group: this.t('Content', 'المحتوى') },
    { id: 'announcements', label: this.t('Announcements', 'الإعلانات'), icon: '📢', badge: this.announcements().length, group: this.t('Content', 'المحتوى') },
    { id: 'messages', label: this.t('Messages', 'الرسائل'), icon: '💬', badge: this.unreadMessages(), group: this.t('Content', 'المحتوى') },
    { id: 'notifications', label: this.t('Notifications', 'التنبيهات'), icon: '🔔', badge: this.unreadNotifs(), group: this.t('Content', 'المحتوى') },
    { id: 'settings', label: this.t('Settings', 'الإعدادات'), icon: '⚙️', group: this.t('Content', 'المحتوى') },
  ]);

  readonly toolbar = computed<ToolbarAction[]>(() => [
    { id: 'refresh', label: this.t('Refresh', 'تحديث'), icon: '⟳', action: () => this.toast.success(this.t('Refreshed', 'تم التحديث')) },
    { id: 'new', label: this.t('New', 'جديد'), icon: '＋', action: () => this.toast.success(this.t('Coming soon', 'قريباً')) },
  ]);

  readonly notifs = computed<PreviewNotification[]>(() => [
    { id: 1, icon: '🔴', title: this.t('2 live sessions', '2 جلسات مباشرة'), body: this.t('Algebra & Physics', 'الجبر والفيزياء'), time: '2m' },
    { id: 2, icon: '📝', title: this.t('New exam published', 'امتحان جديد'), body: this.t('Physics Final', 'الفيزياء النهائي'), time: '1h' },
    { id: 3, icon: '💰', title: this.t('Payment received', 'دفعة مستلمة'), body: '45,000 EGP', time: '5m' },
    { id: 4, icon: '⭐', title: this.t('New review', 'تقييم جديد'), body: this.t('5 stars', '5 نجوم'), time: '2h' },
  ]);

  readonly searchPlaceholder = computed(() =>
    this.active() === 'courses' ? this.t('Search courses…', 'ابحث في الكورسات…') :
      this.active() === 'students' ? this.t('Search students…', 'ابحث عن طالب…') :
        this.active() === 'blog' ? this.t('Search posts…', 'ابحث في المقالات…') : ''
  );

  readonly dashboardKpis = computed(() => [
    { icon: '👨‍🎓', label: this.t('Students', 'الطلاب'), value: this.students().length.toString(), color: '#007aff', trend: '+12%', trendUp: true, go: () => this.active.set('students') },
    { icon: '👨‍🏫', label: this.t('Teachers', 'المعلمون'), value: this.teachers().length.toString(), color: '#34c759', trend: '+2', trendUp: true, go: () => this.active.set('teachers') },
    { icon: '📚', label: this.t('Courses', 'الكورسات'), value: this.courses().length.toString(), color: '#ff9500', trend: '+3', trendUp: true, go: () => this.active.set('courses') },
    { icon: '🔴', label: this.t('Live now', 'مباشر الآن'), value: this.liveNow().toString(), color: '#ff3b30', trend: 'active', trendUp: true, go: () => this.active.set('live') },
  ]);

  readonly adminKpis = computed(() => [
    { icon: '👥', label: this.t('Total users', 'إجمالي المستخدمين'), value: (this.students().length + this.teachers().length + this.parents().length).toString(), color: '#007aff', pct: 78 },
    { icon: '💰', label: this.t('Monthly revenue', 'الإيراد الشهري'), value: '284K EGP', color: '#34c759', pct: 92 },
    { icon: '📚', label: this.t('Active courses', 'كورسات نشطة'), value: this.courses().filter(c => c.status === 'published').length.toString(), color: '#ff9500', pct: 65 },
    { icon: '⭐', label: this.t('Avg rating', 'متوسط التقييم'), value: '4.82', color: '#af52de', pct: 96 },
  ]);

  readonly financeKpis = computed(() => {
    const income = this.finances().filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0);
    const expense = this.finances().filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0);
    const pending = this.finances().filter(f => f.status === 'pending').reduce((s, f) => s + f.amount, 0);
    return [
      { icon: '📈', label: this.t('Income', 'الإيرادات'), value: income.toLocaleString() + ' EGP', color: '#34c759' },
      { icon: '📉', label: this.t('Expenses', 'المصروفات'), value: expense.toLocaleString() + ' EGP', color: '#ff3b30' },
      { icon: '💵', label: this.t('Net', 'الصافي'), value: (income - expense).toLocaleString() + ' EGP', color: '#007aff' },
      { icon: '⏳', label: this.t('Pending', 'معلّق'), value: pending.toLocaleString() + ' EGP', color: '#ff9500' },
    ];
  });

  readonly permissions = computed(() => [
    { feature: 'View dashboard', featureAr: 'عرض لوحة التحكم', values: [true, true, true, true] },
    { feature: 'Manage courses', featureAr: 'إدارة الكورسات', values: [true, true, false, false] },
    { feature: 'Start live session', featureAr: 'بدء بث مباشر', values: [true, true, false, false] },
    { feature: 'Create exams', featureAr: 'إنشاء امتحانات', values: [true, true, false, false] },
    { feature: 'Grade homework', featureAr: 'تصحيح الواجبات', values: [true, true, false, false] },
    { feature: 'Manage users', featureAr: 'إدارة المستخدمين', values: [true, false, false, false] },
    { feature: 'View finances', featureAr: 'عرض المالية', values: [true, false, false, false] },
    { feature: 'Send announcements', featureAr: 'إرسال إعلانات', values: [true, true, false, false] },
    { feature: 'View child progress', featureAr: 'متابعة الابن', values: [false, false, true, false] },
    { feature: 'Enroll in courses', featureAr: 'التسجيل في كورسات', values: [false, false, false, true] },
    { feature: 'Take exams', featureAr: 'أداء الامتحانات', values: [false, false, false, true] },
    { feature: 'View personal grades', featureAr: 'عرض درجاتي', values: [false, false, false, true] },
  ]);

  readonly liveNow = computed(() => this.sessions().filter(s => s.status === 'live').length);
  readonly pendingHomework = computed(() => this.homeworkSubmissions().filter(h => h.status === 'submitted').length);
  readonly unreadMessages = computed(() => this.messages().filter(m => m.unread).length);
  readonly unreadNotifs = computed(() => this.notificationItems().filter(n => !n.read).length);

  readonly topCourses = computed(() =>
    [...this.courses()].filter(c => c.status === 'published').sort((a, b) => b.students - a.students).slice(0, 4)
  );

  readonly filteredCourses = computed(() => {
    const f = this.courseFilter();
    const q = this.searchQuery().toLowerCase().trim();
    let list = this.courses();
    if (f !== 'all') list = list.filter(c => c.status === f);
    if (q) list = list.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.titleAr.includes(q) ||
      c.teacher.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q)
    );
    return list;
  });

  readonly filteredLibrary = computed(() => {
    const t = this.libType();
    return t === 'all' ? this.library() : this.library().filter(l => l.type === t);
  });

  readonly filteredExams = computed(() => {
    const f = this.examFilter();
    return f === 'all' ? this.exams() : this.exams().filter(e => e.type === f);
  });

  readonly filteredQuestions = computed(() => {
    const f = this.qFilter();
    return f === 'all' ? this.questions() : this.questions().filter(q => q.subject === f);
  });

  readonly avgRating = computed(() => {
    const rs = this.reviews();
    if (!rs.length) return 0;
    return Math.round((rs.reduce((s, r) => s + r.rating, 0) / rs.length) * 10) / 10;
  });

  readonly ratingBreakdown = computed(() => {
    const rs = this.reviews();
    return [5, 4, 3, 2, 1].map(stars => {
      const count = rs.filter(r => r.rating === stars).length;
      return { stars, count, pct: rs.length ? (count / rs.length) * 100 : 0 };
    });
  });

  readonly homeworkStats = computed(() => {
    const list = this.homeworkSubmissions();
    const total = list.length;
    const submitted = list.filter(h => h.status === 'submitted').length;
    const graded = list.filter(h => h.status === 'graded').length;
    const late = list.filter(h => h.status === 'late').length;
    const missing = list.filter(h => h.status === 'missing').length;
    const gradedItems = list.filter(h => h.status === 'graded');
    const avgScore = gradedItems.length
      ? Math.round(gradedItems.reduce((s, h) => s + (h.score / h.maxScore) * 100, 0) / gradedItems.length)
      : 0;

    return [
      { label: 'Total', labelAr: 'الإجمالي', value: total.toString(), color: '#007aff' },
      { label: 'Submitted', labelAr: 'تم التسليم', value: submitted.toString(), color: '#34c759' },
      { label: 'Graded', labelAr: 'تم التصحيح', value: graded.toString(), color: '#af52de' },
      { label: 'Late', labelAr: 'متأخرة', value: late.toString(), color: '#ff9500' },
      { label: 'Missing', labelAr: 'مفقودة', value: missing.toString(), color: '#ff3b30' },
      { label: 'Avg score', labelAr: 'متوسط الدرجات', value: avgScore + '%', color: '#5856d6' },
    ];
  });

  readonly recorded = computed(() => this.sessions().filter(s => s.status === 'ended'));
  readonly todaySchedule = computed(() => this.schedule.filter(s => s.day === 'sat').slice(0, 5));

  readonly systemStatus = computed(() => [
    { label: this.t('Live streaming', 'البث المباشر'), value: this.liveNow() + ' ' + this.t('active', 'نشط'), status: 'ok', tag: 'OK' },
    { label: this.t('Video CDN', 'شبكة الفيديو'), value: '12ms latency', status: 'ok', tag: 'OK' },
    { label: this.t('Database', 'قاعدة البيانات'), value: '8ms avg query', status: 'ok', tag: 'OK' },
    { label: this.t('Payment gateway', 'بوابة الدفع'), value: this.t('Operational', 'تعمل'), status: 'ok', tag: 'OK' },
    { label: this.t('Recording service', 'خدمة التسجيل'), value: this.t('84% storage used', '84% من التخزين'), status: 'warn', tag: 'WARN' },
    { label: this.t('Email service', 'خدمة البريد'), value: this.t('2 bounces today', '2 مرتجعات اليوم'), status: 'warn', tag: 'WARN' },
  ]);

  t(en: string, ar: string): string {
    return this.lang() === 'ar' ? ar : en;
  }

  statusAr(s: string): string {
    return { live: 'مباشر', scheduled: 'مجدول', ended: 'منتهي', active: 'نشط', inactive: 'غير نشط', suspended: 'موقوف', away: 'بعيد', offline: 'غير متصل', published: 'منشور', draft: 'مسودة', review: 'مراجعة', archived: 'مؤرشف' }[s] ?? s;
  }

  schTypeAr(t: string): string {
    return { live: 'بث مباشر', exam: 'امتحان', review: 'مراجعة', homework: 'واجب' }[t] ?? t;
  }

  courseStatusAr(s: string): string {
    return { published: 'منشور', draft: 'مسودة', review: 'مراجعة' }[s] ?? s;
  }

  examTypeAr(t: string): string {
    return { quiz: 'كويز', midterm: 'منتصف الفصل', final: 'نهائي', practice: 'تدريب' }[t] ?? t;
  }

  examStatusAr(s: string): string {
    return { draft: 'مسودة', published: 'منشور', archived: 'مؤرشف' }[s] ?? s;
  }

  qTypeAr(t: string): string {
    return { mcq: 'اختيار متعدد', 'true-false': 'صح/خطأ', short: 'قصير', essay: 'مقالي' }[t] ?? t;
  }

  qDiffAr(d: string): string {
    return { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }[d] ?? d;
  }

  hwStatusAr(s: string): string {
    return { submitted: 'تم التسليم', graded: 'تم التصحيح', late: 'متأخر', missing: 'مفقود' }[s] ?? s;
  }

  studentStatusAr(s: string): string {
    return { active: 'نشط', inactive: 'غير نشط', suspended: 'موقوف' }[s] ?? s;
  }

  teacherStatusAr(s: string): string {
    return { active: 'نشط', away: 'بعيد', offline: 'غير متصل' }[s] ?? s;
  }

  finStatusAr(s: string): string {
    return { completed: 'مكتمل', pending: 'معلق', failed: 'فشل' }[s] ?? s;
  }

  annPriorityAr(p: string): string {
    return { low: 'منخفضة', normal: 'عادية', high: 'عالية', urgent: 'عاجلة' }[p] ?? p;
  }

  annAudienceAr(a: string): string {
    return { all: 'الجميع', students: 'الطلاب', parents: 'الأهالي', teachers: 'المعلمون' }[a] ?? a;
  }

  subjectName(id: string): string {
    return this.subjects.find(s => s.id === id)?.name ?? id;
  }

  subjectNameAr(id: string): string {
    return this.subjects.find(s => s.id === id)?.nameAr ?? id;
  }

  repeatStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  courseColor(c: Course): string {
    const colors: Record<string, string> = { Mathematics: '#007aff', Physics: '#34c759', Chemistry: '#ff9500', Biology: '#af52de', Arabic: '#ff3b30', English: '#5856d6', History: '#00c7be', 'Computer Science': '#ffcc00' };
    return colors[c.subject] ?? '#007aff';
  }

  courseBg(c: Course): string {
    const palettes: Record<string, string> = {
      Mathematics: 'linear-gradient(135deg, #007aff, #5856d6)',
      Physics: 'linear-gradient(135deg, #34c759, #00c7be)',
      Chemistry: 'linear-gradient(135deg, #ff9500, #ffcc00)',
      Biology: 'linear-gradient(135deg, #af52de, #ff2d55)',
      Arabic: 'linear-gradient(135deg, #ff3b30, #ff9500)',
      English: 'linear-gradient(135deg, #5856d6, #007aff)',
      History: 'linear-gradient(135deg, #00c7be, #34c759)',
      'Computer Science': 'linear-gradient(135deg, #ffcc00, #ff9500)',
    };
    return palettes[c.subject] ?? 'linear-gradient(135deg, #8e8e93, #48484a)';
  }

  liveBg(s: LiveSession): string {
    const palettes: Record<string, string> = {
      Mathematics: 'linear-gradient(135deg, #007aff, #5856d6)',
      Physics: 'linear-gradient(135deg, #34c759, #00c7be)',
      Chemistry: 'linear-gradient(135deg, #ff9500, #ffcc00)',
      Biology: 'linear-gradient(135deg, #af52de, #ff2d55)',
      Arabic: 'linear-gradient(135deg, #ff3b30, #ff9500)',
      English: 'linear-gradient(135deg, #5856d6, #007aff)',
      History: 'linear-gradient(135deg, #00c7be, #34c759)',
      'Computer Science': 'linear-gradient(135deg, #ffcc00, #ff9500)',
    };
    return palettes[s.subject] ?? 'linear-gradient(135deg, #8e8e93, #48484a)';
  }

  blogBg(b: BlogPost): string {
    const palettes: Record<string, string> = {
      'Study Tips': 'linear-gradient(135deg, #007aff, #5856d6)',
      Mathematics: 'linear-gradient(135deg, #34c759, #00c7be)',
      Motivation: 'linear-gradient(135deg, #ff9500, #ffcc00)',
      Science: 'linear-gradient(135deg, #af52de, #ff2d55)',
      Languages: 'linear-gradient(135deg, #ff3b30, #ff9500)',
      Programming: 'linear-gradient(135deg, #5856d6, #007aff)',
    };
    return palettes[b.category] ?? 'linear-gradient(135deg, #8e8e93, #48484a)';
  }

  countByDay(dayId: string): number {
    return this.schedule.filter(s => s.day === dayId).length;
  }

  byDay(dayId: string): ScheduleItem[] {
    const grade = this.scheduleGrade();
    const items = this.schedule.filter(s => s.day === dayId);
    if (grade === 'all') return items;
    const gradeName = this.grades.find(g => g.id === grade)?.name;
    return items.filter(s => s.grade === gradeName);
  }

  countByStatus(s: string): number {
    return this.courses().filter(c => c.status === s).length;
  }

  countExamsBy(f: string): number {
    if (f === 'all') return this.exams().length;
    return this.exams().filter(e => e.type === f).length;
  }

  onNav(id: string): void {
    this.active.set(id as AMView);
  }

  onSearch(q: string): void {
    this.searchQuery.set(q);
  }

  openSession(id: string): void {
    const s = this.sessions().find(x => x.id === id);
    if (s) this.toast.info(this.t(s.title, s.titleAr), this.t(s.teacher, s.teacherAr));
  }

  playRecording(id: string): void {
    const r = this.recorded().find(x => x.id === id);
    if (r) this.toast.success(this.t('Playing recording', 'جارٍ تشغيل التسجيل'), this.t(r.title, r.titleAr));
  }

  startLiveSession(): void {
    this.toast.success(this.t('Live session created', 'تم إنشاء بث مباشر'), this.t('Ready to go live', 'جاهز للبث'));
    this.active.set('live');
  }

  openCourse(id: string): void {
    const c = this.courses().find(x => x.id === id);
    if (c) this.toast.info(this.t(c.title, c.titleAr), this.t(c.teacher, c.teacherAr));
  }

  openLibraryItem(id: string): void {
    const l = this.library().find(x => x.id === id);
    if (l) this.toast.info(this.t(l.title, l.titleAr), l.size);
  }

  openStudent(id: string): void {
    const s = this.students().find(x => x.id === id);
    if (s) this.toast.info(this.t(s.name, s.nameAr), `${s.avgScore}% · ${s.grade}`);
  }

  openTeacher(id: string): void {
    const t = this.teachers().find(x => x.id === id);
    if (t) this.toast.info(this.t(t.name, t.nameAr), `${t.rating} ★ · ${t.courses} courses`);
  }

  openParent(id: string): void {
    const p = this.parents().find(x => x.id === id);
    if (p) this.toast.info(this.t(p.name, p.nameAr), `${p.children} children`);
  }

  openClass(id: string): void {
    const c = this.classes().find(x => x.id === id);
    if (c) this.toast.info(this.t(c.name, c.nameAr), `${c.students}/${c.capacity}`);
  }

  openBlog(id: string): void {
    const b = this.blogs().find(x => x.id === id);
    if (b) this.toast.info(this.t(b.title, b.titleAr), this.t(b.author, b.authorAr));
  }

  openMessage(id: number): void {
    this.messages.update(list => list.map(m => m.id === id ? { ...m, unread: false } : m));
  }

  markAllMessagesRead(): void {
    this.messages.update(list => list.map(m => ({ ...m, unread: false })));
    this.toast.success(this.t('All marked as read', 'تم تحديد الكل كمقروء'));
  }

  markNotifRead(id: number): void {
    this.notificationItems.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
  }

  replyReview(id: string): void {
    this.reviews.update(list => list.map(r => r.id === id ? { ...r, replied: true } : r));
    this.toast.success(this.t('Reply sent', 'تم إرسال الرد'));
  }

  gradeHomework(id: string): void {
    this.homeworkSubmissions.update(list => list.map(h => h.id === id ? { ...h, status: 'graded' as const } : h));
    this.toast.success(this.t('Homework graded', 'تم تصحيح الواجب'));
  }

  runAdminAction(a: { label: string; labelAr: string }): void {
    this.toast.success(this.t(a.label, a.labelAr), this.t('Coming soon', 'قريباً'));
  }

  generateReport(r: { name: string; nameAr: string }): void {
    this.toast.success(this.t('Generating', 'جارٍ الإنشاء'), this.t(r.name, r.nameAr));
  }

  exportFinances(): void {
    this.toast.success(this.t('Exporting', 'جارٍ التصدير'), this.t('Finances report', 'تقرير المالية'));
  }

  saveSettings(): void {
    this.toast.success(this.t('Settings saved', 'تم حفظ الإعدادات'));
  }

  clearCache(): void {
    this.toast.warning(this.t('Cache cleared', 'تم مسح الكاش'));
  }

  resetPlatform(): void {
    this.toast.warning(this.t('Reset requested', 'تم طلب إعادة التعيين'));
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

  onCourseContext(ev: MouseEvent, c: Course): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: this.t('View course', 'عرض الكورس'), icon: '👁', action: () => this.openCourse(c.id) },
      { id: 'edit', label: this.t('Edit', 'تعديل'), icon: '✎', action: () => this.toast.info(this.t('Edit', 'تعديل'), this.t(c.title, c.titleAr)) },
      { id: 'sep', label: '', separatorBefore: true },
      { id: 'copy', label: this.t('Copy link', 'نسخ الرابط'), icon: '🔗', action: () => { navigator.clipboard?.writeText(`https://almotafiq.com/course/${c.id}`); this.toast.success(this.t('Copied', 'تم النسخ')); } },
      { id: 'delete', label: this.t('Delete', 'حذف'), icon: '🗑', danger: true, action: () => this.toast.warning(this.t('Deleted', 'تم الحذف')) },
    ]);
  }

  onStudentContext(ev: MouseEvent, s: Student): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: this.t('View profile', 'عرض الملف'), icon: '👁', action: () => this.openStudent(s.id) },
      { id: 'message', label: this.t('Send message', 'إرسال رسالة'), icon: '💬', action: () => this.toast.info(this.t('Message', 'رسالة'), s.name) },
      { id: 'sep', label: '', separatorBefore: true },
      { id: 'suspend', label: this.t('Suspend', 'إيقاف'), icon: '🚫', danger: true, action: () => this.toast.warning(this.t('Suspended', 'تم الإيقاف'), s.name) },
    ]);
  }

  onQuestionContext(ev: MouseEvent, q: Question): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'edit', label: this.t('Edit', 'تعديل'), icon: '✎', action: () => this.toast.info(this.t('Edit', 'تعديل'), q.id) },
      { id: 'duplicate', label: this.t('Duplicate', 'تكرار'), icon: '⧉', action: () => this.toast.success(this.t('Duplicated', 'تم التكرار'), q.id) },
      { id: 'sep', label: '', separatorBefore: true },
      { id: 'delete', label: this.t('Delete', 'حذف'), icon: '🗑', danger: true, action: () => this.toast.warning(this.t('Deleted', 'تم الحذف')) },
    ]);
  }
}