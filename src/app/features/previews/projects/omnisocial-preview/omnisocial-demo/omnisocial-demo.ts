import {
  ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ContextMenuService } from '../../../../../core/services/context-menu.service';
import { ToastService } from '../../../../../core/services/toast.service';

type Platform = 'facebook' | 'instagram' | 'twitter';
type ProfileTab = 'main' | Platform;
type DemoView =
  | 'feed' | 'stories' | 'reels' | 'explore'
  | 'messages' | 'calls' | 'bookmarks' | 'notifications'
  | 'designs' | 'profile';

type DesignKind =
  | 'fb' | 'ig' | 'tw'
  | 'fb-ig' | 'fb-tw' | 'ig-tw'
  | 'premium';

interface DemoComment {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
  likes: number;
  liked: boolean;
  platform?: Platform;
  replies: DemoComment[];
  showReplies?: boolean;
}

interface DemoPost {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  platforms: Platform[];
  design: DesignKind;
  text: string;
  media: string;
  hashtags: string[];
  createdAt: string;
  likes: number;
  loves: number;
  retweets: number;
  comments: DemoComment[];
  shares: number;
  liked: boolean;
  saved: boolean;
  verified: boolean;
}

interface StoryItem {
  id: string;
  type: 'image' | 'video';
  emoji: string;
  caption?: string;
  music?: string;
  duration: number;
  views: number;
  reactions: { emoji: string; count: number; }[];
  gradient: string;
}

interface StoryUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  platform: Platform;
  items: StoryItem[];
  seen: boolean;
  live?: boolean;
}

interface DemoConversation {
  id: string;
  platform: Platform | 'main';
  name: string;
  handle: string;
  avatar: string;
  online: boolean;
  typing: boolean;
  unread: number;
  lastMessage: string;
  lastTime: string;
  messages: { id: string; fromMe: boolean; text: string; time: string; seen?: boolean; }[];
}

interface DemoCall {
  id: string;
  type: 'voice' | 'video';
  platform: Platform | 'main';
  direction: 'incoming' | 'outgoing' | 'missed';
  contact: string;
  avatar: string;
  duration: string;
  time: string;
}

interface Reel {
  id: string;
  handle: string;
  avatar: string;
  caption: string;
  media: string;
  music: string;
  likes: number;
  commentsCount: number;
  shares: number;
  saves: number;
  liked: boolean;
  saved: boolean;
  progress: number;
  comments: DemoComment[];
}

@Component({
  selector: 'app-omnisocial-demo',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #commentTpl let-c let-depth="depth">
      <div class="comment-row" [style.--depth]="depth">
        <span class="comment-avatar" [style.background]="commentAvatarBg(c)">
          {{ c.authorAvatar }}
        </span>
        <div class="comment-body">
          <div class="comment-bubble">
            <div class="comment-head">
              <b>{{ c.authorName }}</b>
              <span class="comment-handle">{{ c.authorHandle }}</span>
              @if (c.platform) {
                <span class="comment-plat" [attr.data-p]="c.platform">
                  {{ platformIcon(c.platform) }}
                </span>
              }
            </div>
            <p class="comment-text">{{ c.text }}</p>
          </div>
          <div class="comment-actions">
            <span class="c-action">{{ c.createdAt }}</span>
            <button class="c-action" [class.liked]="c.liked" (click)="likeComment(c)">
              {{ c.liked ? '❤️' : '👍' }} {{ c.likes }}
            </button>
            <button class="c-action" (click)="toggleReplyBox(c.id)">
              Reply
            </button>
            @if (c.replies.length) {
              <button class="c-action" (click)="toggleReplies(c.id)">
                {{ c.showReplies ? 'Hide' : 'View' }} {{ c.replies.length }} {{ c.replies.length === 1 ? 'reply' : 'replies' }}
              </button>
            }
          </div>

          @if (replyingToId() === c.id) {
            <div class="reply-input-box">
              <span class="reply-avatar">{{ myAvatar }}</span>
              <input
                class="reply-input"
                placeholder="Write a reply…"
                [(ngModel)]="replyText"
                (keydown.enter)="submitReply(c)"
              />
              <button class="reply-send" [disabled]="!replyText.toString().trim()" (click)="submitReply(c)">➤</button>
            </div>
          }

          @if (c.showReplies && c.replies.length) {
            <div class="comment-replies">
              @for (r of c.replies; track r.id) {
                <ng-container
                  *ngTemplateOutlet="commentTpl; context: { $implicit: r, depth: depth + 1 }"
                ></ng-container>
              }
            </div>
          }
        </div>
      </div>
    </ng-template>
 <div class="os-topbar">
      <div class="topbar-left">
        <span class="logo">◈</span>
        <span class="brand">OmniSocial</span>
      </div>

      <div class="profile-switch">
        @for (p of profiles; track p.id) {
          <button
            class="ps-btn"
            [class.active]="activeProfile() === p.id"
            [style.--p]="p.color"
            (click)="switchProfile(p.id)"
          >
            <span class="ps-icon">{{ p.icon }}</span>
            <span class="ps-label">{{ p.label }}</span>
          </button>
        }
      </div>

      <div class="topbar-right">
        <button class="icon-btn" title="Search" (click)="activeView.set('explore')">🔍</button>
        <button class="icon-btn has-dot" title="Notifications" (click)="activeView.set('notifications')">
          🔔<span class="dot-count">5</span>
        </button>
        <button class="user-av" title="Profile" (click)="activeView.set('profile')">IS</button>
      </div>
    </div>

    <div class="os-layout">
          <div class="pc-cover"></div>
          <div class="pc-avatar">IS</div>
          <h3>Ibrahim Shafiq</h3>
          <p class="pc-handle">{{ activeProfileHandle() }}</p>
          <div class="pc-stats">
            <div><b>{{ activeStats().posts }}</b><small>Posts</small></div>
            <div><b>{{ activeStats().followers }}</b><small>Followers</small></div>
            <div><b>{{ activeStats().following }}</b><small>Following</small></div>
          </div>
        </div>

        <nav class="side-nav">
          @for (item of sideNav(); track item.id) {
            <button
              class="sn-item"
              [class.active]="activeView() === item.id"
              (click)="activeView.set($any(item.id))"
            >
              <span class="sn-icon">{{ item.icon }}</span>
              <span class="sn-label">{{ item.label }}</span>
              @if (item.badge) { <span class="sn-badge">{{ item.badge }}</span> }
            </button>
          }
        </nav>

        <div class="side-footer">
          <button class="compose-btn" (click)="openComposer()">✏️ Create Post</button>
        </div>

        @if (activeView() === 'feed') {
          <div class="feed-container" [attr.data-profile]="activeProfile()">
            <div class="inline-composer" (click)="openComposer()">
              <div class="ic-avatar">IS</div>
              <div class="ic-input">What's on your mind, Ibrahim?</div>
              <div class="ic-icons">
                <span>🖼</span><span>🎥</span><span>📊</span><span>📍</span>
              </div>
            </div>

            <div class="stories-bar">
              <button class="story-add" (click)="toast.info('Add story')">
                <div class="sa-circle">＋</div>
                <span>Add Story</span>
              </button>
              @for (s of stories(); track s.id) {
                <button class="story" (click)="openStoryViewer(s.id)">
                  <div class="story-ring" [class.seen]="s.seen" [class.live]="s.live">
                    <div class="story-avatar">{{ s.avatar }}</div>
                  </div>
                  <span class="story-name">{{ s.name }}</span>
                  @if (s.live) { <span class="live-dot">LIVE</span> }
                </button>
              }
            </div>

            @for (post of filteredFeed(); track post.id) {
              <article class="post" [attr.data-design]="post.design">
                <header class="post-head">
                  <div class="ph-avatar">{{ post.authorAvatar }}</div>
                  <div class="ph-info">
                    <div class="ph-name-row">
                      <b>{{ post.authorName }}</b>
                      @if (post.verified) { <span class="verified">✓</span> }
                    </div>
                    <small class="ph-handle">{{ post.authorHandle }} · {{ post.createdAt }}</small>
                    <div class="ph-platforms">
                      @for (pl of post.platforms; track pl) {
                        <span class="plat-chip" [attr.data-p]="pl">{{ platformIcon(pl) }}</span>
                      }
                    </div>
                  </div>
                  <button class="ph-menu" (click)="openPostMenu($event, post)">⋯</button>
                </header>

                <div class="post-body" (click)="openPostDetail(post)">
                  <p class="pb-text">{{ post.text }}</p>
                  @if (post.media) {
                    <div class="pb-media">{{ post.media }}</div>
                  }
                  @if (post.hashtags.length) {
                    <div class="pb-hashtags">
                      @for (h of post.hashtags; track h) {
                        <span class="hashtag">#{{ h }}</span>
                      }
                    </div>
                  }
                </div>

                <div class="post-stats">
                  <span class="pstat">👍 {{ post.likes | number }}</span>
                  <span class="pstat">❤️ {{ post.loves | number }}</span>
                  @if (post.platforms.includes('twitter')) {
                    <span class="pstat">🔁 {{ post.retweets }}</span>
                  }
                  <button class="pstat-right" (click)="openPostDetail(post)">
                    {{ commentCount(post.comments) }} comments · {{ post.shares }} shares
                  </button>
                </div>

                <footer class="post-actions" [attr.data-design]="post.design">
                  <button class="pa-btn" [class.liked]="post.liked" (click)="toggleLike(post.id)">
                    <span>{{ post.liked ? '❤️' : '👍' }}</span>
                    <span>{{ post.liked ? 'Liked' : 'Like' }}</span>
                  </button>
                  <button class="pa-btn" (click)="openPostDetail(post)">
                    <span>💬</span><span>Comment</span>
                  </button>
                  <button class="pa-btn" (click)="toast.info('Share', post.id)">
                    <span>↗</span><span>Share</span>
                  </button>
                  <button class="pa-btn" [class.saved]="post.saved" (click)="toggleSave(post.id)">
                    <span>{{ post.saved ? '🔖' : '📑' }}</span>
                    <span>{{ post.saved ? 'Saved' : 'Save' }}</span>
                  </button>
                </footer>
              </article>
            }
          </div>
        }

        @if (activeView() === 'stories') {
          <div class="stories-view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Ephemeral</span>
                <h2>Stories</h2>
                <p>{{ stories().length }} active · 24-hour ephemeral content</p>
              </div>
              <button class="btn-primary" (click)="toast.info('Create story')">＋ New Story</button>
            </header>

            <div class="stories-grid">
              @for (s of stories(); track s.id) {
                <article class="story-card" [attr.data-p]="s.platform" (click)="openStoryViewer(s.id)">
                  <div class="sc-preview" [style.background]="s.items[0].gradient">
                    <span class="sc-emoji">{{ s.items[0].emoji }}</span>
                    @if (s.live) { <span class="sc-live">● LIVE</span> }
                    <span class="sc-platform">{{ platformIcon(s.platform) }}</span>
                    <span class="sc-count">{{ s.items.length }} items</span>
                  </div>
                  <div class="sc-info">
                    <div class="sc-user">
                      <span class="sc-avatar">{{ s.avatar }}</span>
                      <div>
                        <b>{{ s.name }}</b>
                        <small>{{ s.seen ? 'Seen' : 'New' }}</small>
                      </div>
                    </div>
                    <span class="sc-views">👁 {{ totalStoryViews(s) }}</span>
                  </div>
                </article>
              }
            </div>
          </div>
        }

        @if (activeView() === 'reels') {
          <div class="tiktok-wrap">
            <header class="tk-head">
              <div class="tk-tabs">
                <button class="tk-tab active">Following</button>
                <button class="tk-tab">For You</button>
                <button class="tk-tab">Trending</button>
              </div>
              <div class="tk-search">🔍 Search</div>
            </header>

            <div class="tiktok-feed" #tiktokFeed>
              @for (r of reels(); track r.id; let i = $index) {
                <article class="tiktok-reel" (dblclick)="doubleTapLike(r)">
                  <div class="tr-bg" [style.background]="reelGradient(r)">
                    <span class="tr-bg-emoji">{{ r.media }}</span>
                  </div>

                  <!-- Double-tap heart burst -->
                  @if (doubleTapHeart() === r.id) {
                    <span class="heart-burst">❤️</span>
                  }

                  <!-- Follow button -->
                  @if (!r.following) {
                    <button class="tr-follow" (click)="toggleFollowReel(r.id)">
                      <span class="tr-avatar">{{ r.avatar }}</span>
                      <span class="tr-plus">＋</span>
                    </button>
                  }

                  <!-- Right action rail -->
                  <div class="tr-actions">
                    <button class="tra-btn" [class.active]="r.liked" (click)="toggleReelLike(r.id)">
                      <span class="tra-icon">❤️</span>
                      <small>{{ r.likes | number }}</small>
                    </button>
                    <button class="tra-btn" (click)="openReelComments(r)">
                      <span class="tra-icon">💬</span>
                      <small>{{ r.commentsCount }}</small>
                    </button>
                    <button class="tra-btn" (click)="toast.success('Shared')">
                      <span class="tra-icon">↗</span>
                      <small>{{ r.shares }}</small>
                    </button>
                    <button class="tra-btn" [class.saved]="r.saved" (click)="toggleReelSave(r.id)">
                      <span class="tra-icon">{{ r.saved ? '🔖' : '📑' }}</span>
                      <small>{{ r.saved ? 'Saved' : 'Save' }}</small>
                    </button>
                    <div class="tra-disc" [style.animation-play-state]="'running'">
                      <span>{{ r.avatar }}</span>
                    </div>
                  </div>

                  <!-- Bottom info -->
                  <div class="tr-info">
                    <b class="tr-user">@{{ r.handle }}</b>
                    <p class="tr-caption">{{ r.caption }}</p>
                    <div class="tr-music">
                      <span class="trm-icon">🎵</span>
                      <div class="trm-ticker">
                        <span [style.animation-delay]="(-i * 2) + 's'">{{ r.music }} · {{ r.music }} · {{ r.music }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Progress dots -->
                  <div class="tr-progress">
                    <span class="trp-dot" [class.done]="r.progress > 25"></span>
                    <span class="trp-dot" [class.done]="r.progress > 50"></span>
                    <span class="trp-dot" [class.done]="r.progress > 75"></span>
                    <span class="trp-bar" [style.width.%]="r.progress"></span>
                  </div>
                </article>
              }
            </div>

            <div class="tiktok-hint">⟵ Swipe up for more ⟶</div>
          </div>
        }

        @if (activeView() === 'explore') {
          <div class="explore-view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Discover</span>
                <h2>Explore</h2>
                <p>Trending content across all platforms</p>
              </div>
            </header>

            <div class="explore-tags">
              @for (t of trending; track t.tag) {
                <button class="exp-tag" (click)="toast.info('#' + t.tag)">
                  <b>#{{ t.tag }}</b>
                  <small>{{ t.count }} posts</small>
                </button>
              }
            </div>

            <div class="explore-grid">
              @for (post of posts(); track post.id; let i = $index) {
                <div class="explore-tile" [attr.data-i]="i % 6" (click)="openPostDetail(post)">
                  <span class="et-emoji">{{ post.media || '📝' }}</span>
                  <div class="et-overlay">
                    <span>❤️ {{ post.likes }}</span>
                    <span>💬 {{ commentCount(post.comments) }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        @if (activeView() === 'messages') {
          <div class="messages-layout">
            <aside class="msg-list-panel">
              <header class="mlp-head">
                <h3>Messages</h3>
                <div class="msg-platform-filter">
                  @for (p of ['all', 'facebook', 'instagram', 'twitter']; track p) {
                    <button
                      class="mpf"
                      [class.active]="msgPlatformFilter() === p"
                      (click)="msgPlatformFilter.set($any(p))"
                    >
                      {{ p === 'all' ? 'All' : platformIcon($any(p)) }}
                    </button>
                  }
                </div>
              </header>

              <ul class="convo-list">
                @for (c of filteredConversations(); track c.id) {
                  <li
                    class="convo"
                    [class.active]="activeConvo()?.id === c.id"
                    [class.unread]="c.unread > 0"
                    (click)="selectConvo(c.id)"
                  >
                    <div class="conv-avatar">
                      {{ c.avatar }}
                      @if (c.online) { <span class="online-dot"></span> }
                    </div>
                    <div class="conv-body">
                      <div class="conv-row">
                        <b>{{ c.name }}</b>
                        <span class="conv-time">{{ c.lastTime }}</span>
                      </div>
                      <small class="conv-handle">{{ platformIcon(c.platform) }} {{ c.handle }}</small>
                      <p class="conv-preview">
                        @if (c.typing) { <em>typing…</em> }
                        @else { {{ c.lastMessage }} }
                      </p>
                    </div>
                    @if (c.unread > 0) {
                      <span class="unread-badge">{{ c.unread }}</span>
                    }
                  </li>
                }
              </ul>
            </aside>

            <section class="msg-thread-panel">
              @if (activeConvo(); as c) {
                <header class="mtp-head">
                  <div class="mtp-avatar">{{ c.avatar }}</div>
                  <div class="mtp-info">
                    <b>{{ c.name }}</b>
                    <small>
                      {{ platformIcon(c.platform) }} {{ platformLabel(c.platform) }} ·
                      @if (c.online) { <span class="online-txt">Online</span> } @else { Offline }
                    </small>
                  </div>
                  <div class="mtp-actions">
                    <button class="ic-btn" title="Voice call" (click)="startCall(c.id, 'voice')">📞</button>
                    <button class="ic-btn" title="Video call" (click)="startCall(c.id, 'video')">🎥</button>
                  </div>
                </header>

                <div class="mtp-body">
                  @for (m of c.messages; track m.id) {
                    <div class="bubble-row" [class.from-me]="m.fromMe">
                      @if (!m.fromMe) {
                        <span class="bubble-avatar">{{ c.avatar }}</span>
                      }
                      <div class="bubble" [attr.data-p]="c.platform">
                        <p>{{ m.text }}</p>
                        <small>
                          {{ m.time }}
                          @if (m.fromMe && m.seen) { <span class="seen">✓✓</span> }
                        </small>
                      </div>
                    </div>
                  }
                </div>

                <footer class="mtp-composer">
                  <button class="cmb-icon">😀</button>
                  <button class="cmb-icon">📎</button>
                  <input placeholder="Type a message..." [(ngModel)]="messageInput" (keydown.enter)="sendMessage()" />
                  <button class="cmb-icon">🎤</button>
                  <button class="cmb-send" (click)="sendMessage()">➤</button>
                </footer>
              } @else {
                <div class="empty-state">
                  <span>💬</span>
                  <b>Select a conversation</b>
                </div>
              }
            </section>
          </div>
        }

        @if (activeView() === 'calls') {
          <div class="calls-view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Communication</span>
                <h2>Call History</h2>
                <p>{{ calls().length }} recent calls</p>
              </div>
              <div class="call-actions">
                <button class="btn-primary" (click)="startCall('c1', 'voice')">📞 Voice</button>
                <button class="btn-primary" (click)="startCall('c1', 'video')">🎥 Video</button>
              </div>
            </header>

            <div class="calls-stats">
              <div class="cst"><span>📞</span><b>{{ outgoingCount() }}</b><small>Outgoing</small></div>
              <div class="cst"><span>📲</span><b>{{ incomingCount() }}</b><small>Incoming</small></div>
              <div class="cst danger"><span>❌</span><b>{{ missedCount() }}</b><small>Missed</small></div>
              <div class="cst"><span>⏱</span><b>{{ totalCallTime() }}</b><small>Total</small></div>
            </div>

            <ul class="calls-list">
              @for (c of calls(); track c.id) {
                <li class="call-row" [attr.data-dir]="c.direction">
                  <span class="call-avatar">{{ c.avatar }}</span>
                  <div class="call-info">
                    <b>{{ c.contact }}</b>
                    <small>
                      {{ c.direction === 'outgoing' ? '↗' : c.direction === 'incoming' ? '↙' : '✕' }}
                      {{ c.type === 'video' ? 'Video' : 'Voice' }} · {{ platformLabel(c.platform) }} · {{ c.time }}
                    </small>
                  </div>
                  <span class="call-duration mono">{{ c.duration }}</span>
                  <div class="call-quick">
                    <button (click)="startCall(c.id, 'voice')">📞</button>
                    <button (click)="startCall(c.id, 'video')">🎥</button>
                  </div>
                </li>
              }
            </ul>
          </div>
        }

        @if (activeView() === 'bookmarks') {
          <div class="view-generic">
            <header class="view-head">
              <div>
                <span class="eyebrow">Saved</span>
                <h2>Bookmarks</h2>
                <p>{{ bookmarks().length }} saved posts</p>
              </div>
            </header>
            <div class="bm-grid">
              @for (b of bookmarks(); track b.id) {
                <article class="bm-card" [attr.data-d]="b.design" (click)="openPostDetail(b)">
                  <span class="bm-avatar">{{ b.authorAvatar }}</span>
                  <b>{{ b.authorName }}</b>
                  <p>{{ b.text.slice(0, 90) }}…</p>
                  <div class="bm-chips">
                    @for (pl of b.platforms; track pl) {
                      <span [attr.data-p]="pl">{{ platformIcon(pl) }}</span>
                    }
                  </div>
                </article>
              }
            </div>
          </div>
        }

        @if (activeView() === 'notifications') {
          <div class="view-generic">
            <header class="view-head">
              <div>
                <span class="eyebrow">Activity</span>
                <h2>Notifications</h2>
                <p>Grouped by AI</p>
              </div>
            </header>
            <ul class="notif-list">
              @for (n of notifications; track n.id) {
                <li class="notif-row">
                  <span class="notif-icon" [style.background]="n.color + '22'">{{ n.icon }}</span>
                  <div class="notif-body">
                    <b>{{ n.title }}</b>
                    <p>{{ n.body }}</p>
                    <small>{{ n.time }}</small>
                  </div>
                  <span class="notif-platform">{{ platformIcon(n.platform) }}</span>
                </li>
              }
            </ul>
          </div>
        }

        @if (activeView() === 'designs') {
          <div class="designs-view">
            <header class="view-head">
              <div>
                <span class="eyebrow">Design Lab</span>
                <h2>7 Design Combinations</h2>
                <p>Every platform combination produces a unique design</p>
              </div>
            </header>

            <div class="design-tabs">
              @for (d of designOptions; track d.id) {
                <button
                  class="dt-chip"
                  [class.active]="previewDesign() === d.id"
                  (click)="previewDesign.set(d.id)"
                >
                  <span class="dt-icons">
                    @for (pl of d.platforms; track pl) {
                      <span>{{ platformIcon(pl) }}</span>
                    }
                  </span>
                  <span class="dt-label">{{ d.label }}</span>
                </button>
              }
            </div>

            <div class="design-preview" [attr.data-d]="previewDesign()">
              <div class="dp-mock">
                <header class="dp-head">
                  <span class="dp-avatar">👨‍💻</span>
                  <div>
                    <b>Ibrahim Shafiq</b>
                    <small>@ibrahim · 2m ago</small>
                  </div>
                </header>
                <p class="dp-text">Just shipped OmniSocial v1! 🚀</p>
                <div class="dp-media">🚀📱💻</div>
                <div class="dp-hashtags">
                  <span>#angular</span><span>#dotnet</span>
                </div>
                <footer class="dp-actions">
                  @for (a of designActions(previewDesign()); track a.id) {
                    <button class="dpa-btn">
                      <span>{{ a.icon }}</span><span>{{ a.label }}</span>
                    </button>
                  }
                </footer>
              </div>
              <aside class="dp-meta">
                <h3>{{ currentDesignMeta().title }}</h3>
                <p>{{ currentDesignMeta().description }}</p>
                <div class="dp-features">
                  @for (f of currentDesignMeta().features; track f) {
                    <span class="dpf-chip">✓ {{ f }}</span>
                  }
                </div>
              </aside>
            </div>
          </div>
        }

        @if (activeView() === 'profile') {
          <div class="profile-view" [style.--p]="activeProfileColor()">
            <div class="profile-hero">
              <div class="ph-cover"></div>
              <div class="ph-body">
                <div class="ph-avatar-lg">IS</div>
                <div class="ph-info-lg">
                  <h2>Ibrahim Shafiq
                    @if (activeProfile() === 'twitter') { <span class="verified">✓</span> }
                  </h2>
                  <p class="ph-handle-lg">{{ activeProfileHandle() }}</p>
                  <p class="ph-bio">
                    Full-Stack Engineer · Angular &amp; .NET · Building OmniSocial
                  </p>
                  <div class="ph-stats-lg">
                    <div><b>{{ activeStats().posts }}</b><small>Posts</small></div>
                    <div><b>{{ activeStats().followers }}</b><small>Followers</small></div>
                    <div><b>{{ activeStats().following }}</b><small>Following</small></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="profile-posts">
              <h3>Posts on {{ platformLabel(activeProfile()) }}</h3>
              <div class="profile-grid">
                @for (p of filteredFeed(); track p.id) {
                  <div class="profile-tile" (click)="openPostDetail(p)">
                    <span class="pt-emoji">{{ p.media || '📝' }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }
          <header><b>🔥 Trending</b></header>
          <ul class="trending-list">
            @for (t of trending; track t.tag) {
              <li><span class="tr">#{{ t.tag }}</span><small>{{ t.count }}</small></li>
            }
          </ul>

        <section class="side-card">
          <header><b>👥 Online</b></header>
          <ul class="online-list">
            @for (c of onlineContacts(); track c.id) {
              <li class="online-row">
                <span class="ol-avatar">
                  {{ c.avatar }}
                  <span class="ol-dot" [attr.data-p]="c.platform"></span>
                </span>
                <div><b>{{ c.name }}</b><small>{{ platformLabel(c.platform) }}</small></div>
              </li>
            }
          </ul>
        </section>

    @if (storyViewerOpen(); as sv) {
      <div class="story-viewer" [attr.data-p]="sv.platform">
        <div class="sv-progress">
          @for (item of sv.items; track item.id; let i = $index) {
            <div class="svp-track">
              <div
                class="svp-fill"
                [style.width.%]="i < svItemIndex() ? 100 : (i === svItemIndex() ? svProgress() : 0)"
              ></div>
            </div>
          }
        </div>

        <header class="sv-head">
          <div class="sv-user">
            <span class="sv-avatar">{{ sv.avatar }}</span>
            <div>
              <b>{{ sv.name }}</b>
              <small>{{ sv.handle }} · {{ svItemIndex() + 1 }}/{{ sv.items.length }}</small>
            </div>
          </div>
          <div class="sv-actions">
            <button class="sv-icon" title="More">⋯</button>
            <button class="sv-icon" (click)="closeStoryViewer()" title="Close">✕</button>
          </div>
        </header>

        <div class="sv-content">
          <div
            class="sv-media"
            [style.background]="currentStoryItem()?.gradient"
            (click)="storyTap($event, sv)"
          >
            <span class="sv-emoji">{{ currentStoryItem()?.emoji }}</span>
            @if (currentStoryItem()?.caption) {
              <p class="sv-caption">{{ currentStoryItem()?.caption }}</p>
            }
          </div>

          <!-- Tap zones -->
          <button class="sv-zone sv-zone-left" (click)="prevStoryItem(sv)" aria-label="Previous"></button>
          <button class="sv-zone sv-zone-right" (click)="nextStoryItem(sv)" aria-label="Next"></button>

          <!-- Reactions -->
          <div class="sv-reactions-bar">
            @for (r of currentStoryItem()?.reactions ?? []; track r.emoji) {
              <button class="svr-btn" (click)="reactToStory(r.emoji)">
                <span>{{ r.emoji }}</span>
                <small>{{ r.count }}</small>
              </button>
            }
          </div>

          <!-- Reply -->
          <div class="sv-reply">
            <input
              placeholder="Send message…"
              [(ngModel)]="storyReplyText"
              (keydown.enter)="sendStoryReply()"
            />
            <button class="svr-send" (click)="sendStoryReply()">➤</button>
          </div>
        </div>

        @if (currentStoryItem()?.music) {
          <div class="sv-music">
            🎵 {{ currentStoryItem()?.music }}
          </div>
        }
      </div>
    }

    @if (postDetailOpen(); as p) {
      <div class="modal-backdrop" (click)="closePostDetail()">
        <div class="post-detail-modal" (click)="$event.stopPropagation()">
          <header class="pdm-head">
            <div class="ph-avatar">{{ p.authorAvatar }}</div>
            <div>
              <div class="ph-name-row">
                <b>{{ p.authorName }}</b>
                @if (p.verified) { <span class="verified">✓</span> }
              </div>
              <small class="ph-handle">{{ p.authorHandle }} · {{ p.createdAt }}</small>
            </div>
            <button class="modal-close" (click)="closePostDetail()">✕</button>
          </header>

          <div class="pdm-body">
            <div class="pdm-content">
              <p class="pdm-text">{{ p.text }}</p>
              @if (p.media) {
                <div class="pdm-media" [attr.data-design]="p.design">{{ p.media }}</div>
              }
              @if (p.hashtags.length) {
                <div class="pb-hashtags">
                  @for (h of p.hashtags; track h) {
                    <span class="hashtag">#{{ h }}</span>
                  }
                </div>
              }
              <div class="pdm-post-actions">
                <button class="pa-btn" [class.liked]="p.liked" (click)="toggleLike(p.id)">
                  <span>❤️</span><span>{{ p.likes | number }}</span>
                </button>
                <button class="pa-btn"><span>💬</span><span>{{ commentCount(p.comments) }}</span></button>
                <button class="pa-btn"><span>↗</span><span>{{ p.shares }}</span></button>
                <button class="pa-btn"><span>🔖</span><span>Save</span></button>
              </div>
            </div>

            <div class="pdm-comments">
              <header class="pdm-comments-head">
                <b>{{ commentCount(p.comments) }} Comments</b>
                <div class="pdm-sort">
                  <button class="pds-chip active">Top</button>
                  <button class="pds-chip">Newest</button>
                </div>
              </header>

              <div class="pdm-comments-list">
                @for (c of p.comments; track c.id) {
                  <ng-container
                    *ngTemplateOutlet="commentTpl; context: { $implicit: c, depth: 0 }"
                  ></ng-container>
                } @empty {
                  <div class="empty-mini">
                    <span>💬</span>
                    <b>No comments yet</b>
                    <small>Be the first to comment</small>
                  </div>
                }
              </div>

              <footer class="pdm-composer">
                <span class="pdm-avatar">{{ myAvatar }}</span>
                <input
                  class="pdm-input"
                  placeholder="Write a comment…"
                  [(ngModel)]="commentText"
                  (keydown.enter)="submitComment(p)"
                />
                <button class="pdm-send" [disabled]="!commentText.toString().trim()" (click)="submitComment(p)">➤</button>
              </footer>
            </div>
          </div>
        </div>
      </div>
    }

    @if (reelCommentsOpen(); as r) {
      <div class="modal-backdrop sheet-backdrop" (click)="closeReelComments()">
        <div class="comments-sheet" (click)="$event.stopPropagation()">
          <div class="sheet-handle"><span></span></div>

          <header class="cs-head">
            <b>{{ r.commentsCount }} comments</b>
            <button class="modal-close" (click)="closeReelComments()">✕</button>
          </header>

          <div class="cs-body">
            @for (c of r.comments; track c.id) {
              <ng-container
                *ngTemplateOutlet="commentTpl; context: { $implicit: c, depth: 0 }"
              ></ng-container>
            } @empty {
              <div class="empty-mini">
                <span>💬</span>
                <b>No comments yet</b>
              </div>
            }
          </div>

          <footer class="cs-composer">
            <input placeholder="Add a comment…" [(ngModel)]="reelCommentText" (keydown.enter)="submitReelComment(r)" />
            <button class="cs-send" [disabled]="!reelCommentText.toString().trim()" (click)="submitReelComment(r)">➤</button>
          </footer>
        </div>
      </div>
    }

    @if (composerOpen()) {
      <div class="modal-backdrop" (click)="composerOpen.set(false)">
        <div class="composer-modal" (click)="$event.stopPropagation()">
          <header class="cm-head">
            <h3>Create Post</h3>
            <button class="modal-close" (click)="composerOpen.set(false)">✕</button>
          </header>

          <div class="cm-platforms">
            <span class="cmp-label">Publish to:</span>
            @for (p of platformOptions; track p.id) {
              <button
                class="cmp-chip"
                [class.active]="composerPlatforms().includes(p.id)"
                [attr.data-p]="p.id"
                (click)="toggleComposerPlatform(p.id)"
              >
                <span>{{ p.icon }}</span>
                <span>{{ p.label }}</span>
                @if (composerPlatforms().includes(p.id)) { <span class="cmp-check">✓</span> }
              </button>
            }
          </div>

          @if (composerPlatforms().length) {
            <div class="cm-design-preview">
              <span class="cdp-label">Auto design:</span>
              <b>{{ composerDesignLabel() }}</b>
            </div>
          }

          <textarea
            class="cm-textarea"
            placeholder="What's on your mind?"
            [(ngModel)]="composerText"
          ></textarea>

          <div class="cm-toolbar">
            <button>🖼 Photo</button>
            <button>🎥 Video</button>
            <button>😀 Emoji</button>
            <button>📊 Poll</button>
          </div>

          <footer class="cm-foot">
            <button class="btn-ghost" (click)="composerOpen.set(false)">Cancel</button>
            <button
              class="btn-primary"
              (click)="publishPost()"
              [disabled]="!composerText.toString().trim() || !composerPlatforms().length"
            >
              Publish to {{ composerPlatforms().length }} platform(s)
            </button>
          </footer>
        </div>
      </div>
    }

    @if (callState(); as cs) {
      <div class="call-modal" [attr.data-type]="cs.type">
        <div class="call-bg"></div>
        <div class="call-content">
          <div class="call-avatar-big">{{ cs.avatar }}</div>
          <h2>{{ cs.contact }}</h2>
          <p class="call-status">{{ cs.status }}</p>
          <p class="call-platform">{{ platformIcon(cs.platform) }} {{ platformLabel(cs.platform) }}</p>

          @if (cs.type === 'video') {
            <div class="video-preview">
              <div class="vp-self">IS</div>
            </div>
          }

          <div class="call-controls">
            <button class="cc-btn">🎤</button>
            <button class="cc-btn" [disabled]="cs.type === 'voice'">🎥</button>
            <button class="cc-btn danger" (click)="endCall()">📞</button>
            <button class="cc-btn">🔊</button>
            <button class="cc-btn">⋯</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .mono { font-family: var(--sf-mono); font-variant-numeric: tabular-nums; }

    .os-topbar {
      display: grid; grid-template-columns: auto 1fr auto;
      align-items: center; gap: 20px; padding: 10px 20px;
      background: var(--bg-surface-solid);
      border-bottom: 0.5px solid var(--separator);
      position: sticky; top: 0; z-index: 20;
    }
    .topbar-left { display: flex; align-items: center; gap: 10px; }
    .logo {
      width: 32px; height: 32px; display: grid; place-items: center;
      background: linear-gradient(135deg, #007aff, #af52de);
      color: #fff; border-radius: 50%; font-size: 16px;
    }
    .brand { font-size: 15px; font-weight: 800; letter-spacing: -0.02em; }

    .profile-switch {
      display: flex; gap: 4px; justify-content: center;
      padding: 4px; background: var(--bg-fill-2); border-radius: var(--r-pill);
      justify-self: center;
    }
    .ps-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: var(--r-pill);
      font-size: 12px; font-weight: 600;
      color: var(--label-2); background: transparent; border: 0;
      cursor: pointer; transition: all 160ms;
    }
    .ps-btn.active { background: var(--p); color: #fff; }
    .ps-icon { font-size: 14px; }

    .topbar-right { display: flex; align-items: center; gap: 8px; }
    .icon-btn {
      width: 34px; height: 34px; display: grid; place-items: center;
      border-radius: 50%; background: transparent; border: 0;
      color: var(--label-2); cursor: pointer; position: relative;
    }
    .icon-btn:hover { background: var(--bg-hover); color: var(--label); }
    .icon-btn.has-dot .dot-count {
      position: absolute; top: 2px; right: 2px;
      min-width: 16px; height: 16px; padding: 0 4px;
      background: #ff3b30; color: #fff; border-radius: 8px;
      font-size: 9px; font-weight: 800; display: grid; place-items: center;
      border: 2px solid var(--bg-surface-solid);
    }
    .user-av {
      width: 34px; height: 34px; display: grid; place-items: center;
      border-radius: 50%; background: var(--accent); color: #fff;
      font-size: 11px; font-weight: 800; border: 0; cursor: pointer;
    }

    .os-layout {
      padding: 20px; max-width: 1440px; margin: 0 auto;
    }
    @media (max-width: 1200px) { .os-layout { grid-template-columns: 240px 1fr; } .os-right { display: none; } }
    @media (max-width: 900px) { .os-layout { grid-template-columns: 1fr; } .os-side { display: none; } }

    .os-side { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 80px; align-self: flex-start; }
    .profile-card {
      padding: 0 0 16px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md);
      overflow: hidden; text-align: center;
    }
    .pc-cover { height: 60px; background: linear-gradient(135deg, var(--p), color-mix(in srgb, var(--p) 60%, #000)); }
    .pc-avatar {
      width: 64px; height: 64px; margin: -32px auto 8px;
      display: grid; place-items: center;
      background: var(--bg-surface-solid);
      border: 3px solid var(--bg-surface-solid);
      border-radius: 50%; font-size: 22px; font-weight: 800; color: var(--p);
    }
    .profile-card h3 { font-size: 14px; font-weight: 700; }
    .pc-handle { font-size: 11px; color: var(--label-2); font-family: var(--sf-mono); margin-top: 2px; }
    .pc-stats {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 6px; padding: 12px 16px 0; margin-top: 12px;
      border-top: 0.5px solid var(--separator);
    }
    .pc-stats > div { text-align: center; }
    .pc-stats b { font-size: 14px; font-weight: 800; font-variant-numeric: tabular-nums; display: block; }
    .pc-stats small { font-size: 9px; color: var(--label-3); text-transform: uppercase; font-weight: 700; }

    .side-nav { display: flex; flex-direction: column; gap: 2px; }
    .sn-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: var(--r-sm);
      color: var(--label-2); font-size: 13px; font-weight: 600;
      background: transparent; border: 0; cursor: pointer;
      text-align: left; transition: all 140ms;
    }
    .sn-item:hover { background: var(--bg-hover); color: var(--label); }
    .sn-item.active { background: var(--accent-soft); color: var(--accent); }
    .sn-icon { font-size: 16px; }
    .sn-label { flex: 1; }
    .sn-badge { padding: 2px 8px; background: #ff3b30; color: #fff; border-radius: 10px; font-size: 10px; font-weight: 800; }

    .compose-btn {
      width: 100%; padding: 12px;
      background: linear-gradient(135deg, #007aff, #af52de);
      color: #fff; border: 0; border-radius: var(--r-sm);
      font-size: 13px; font-weight: 800; cursor: pointer;
    }

    .os-main { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

    .feed-container { display: flex; flex-direction: column; gap: 16px; max-width: 640px; margin: 0 auto; width: 100%; }

    .inline-composer {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 18px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md);
      cursor: pointer;
    }
    .inline-composer:hover { border-color: var(--accent); }
    .ic-avatar {
      width: 40px; height: 40px; display: grid; place-items: center;
      background: var(--accent); color: #fff; border-radius: 50%;
      font-size: 13px; font-weight: 800; flex-shrink: 0;
    }
    .ic-input { flex: 1; padding: 10px 16px; background: var(--bg-fill-2); border-radius: var(--r-pill); font-size: 13px; color: var(--label-2); }
    .ic-icons { display: flex; gap: 6px; font-size: 16px; }

    .stories-bar {
      display: flex; gap: 12px; padding: 12px;
      background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); overflow-x: auto; scrollbar-width: none;
    }
    .stories-bar::-webkit-scrollbar { display: none; }
    .story-add, .story {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      background: transparent; border: 0; cursor: pointer; flex-shrink: 0;
    }
    .sa-circle { width: 62px; height: 62px; display: grid; place-items: center;
      background: var(--bg-fill-2); border-radius: 50%; font-size: 22px; color: var(--label-2); }
    .story-add span { font-size: 10px; color: var(--label-2); font-weight: 600; }
    .story-ring {
      width: 62px; height: 62px; display: grid; place-items: center;
      border-radius: 50%; padding: 3px;
      background: linear-gradient(135deg, #ff2d55, #ff9500, #af52de);
    }
    .story-ring.seen { background: var(--separator); }
    .story-ring.live { background: linear-gradient(135deg, #ff3b30, #ff2d55); animation: pulse-live 2s infinite; }
    @keyframes pulse-live { 0%,100% { box-shadow: 0 0 0 0 rgba(255,59,48,0.6); } 50% { box-shadow: 0 0 0 8px rgba(255,59,48,0); } }
    .story-avatar { width: 100%; height: 100%; display: grid; place-items: center;
      background: var(--bg-surface-solid); border-radius: 50%; font-size: 24px; }
    .story-name { font-size: 10px; font-weight: 600; max-width: 62px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .post {
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md); padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .post[data-design='fb'] { border-left: 3px solid #1877f2; }
    .post[data-design='fb'] .post-actions[data-design='fb'] {
      background: #f0f2f5; margin: 0 -16px -16px; padding: 8px 16px;
      border-radius: 0 0 var(--r-md) var(--r-md);
    }
    .post[data-design='fb'] .post-actions[data-design='fb'] .pa-btn { color: #1877f2; font-weight: 700; }
    .post[data-design='ig'] { padding: 0; overflow: hidden; }
    .post[data-design='ig'] .post-head { padding: 14px 16px 8px; }
    .post[data-design='ig'] .post-body { padding: 0 16px; }
    .post[data-design='ig'] .post-actions[data-design='ig'] { padding: 12px 16px; border-top: 0.5px solid var(--separator); }
    .post[data-design='ig'] .post-stats { padding: 0 16px; }
    .post[data-design='tw'] { border-radius: 0; border-left: 0; border-right: 0; border-top: 0.5px solid var(--separator); padding: 12px 16px; }
    .post[data-design='tw'] .post-actions[data-design='tw'] .pa-btn { color: #1d9bf0; }
    .post[data-design='fb-ig'] { border-left: 3px solid #1877f2; }
    .post[data-design='fb-tw'] { border-left: 3px solid #1877f2; padding: 12px 16px; }
    .post[data-design='ig-tw'] { border-radius: 16px; padding: 0; overflow: hidden; }
    .post[data-design='ig-tw'] .post-head { padding: 14px; }
    .post[data-design='ig-tw'] .post-body { padding: 0 14px 14px; }
    .post[data-design='ig-tw'] .post-actions[data-design='ig-tw'] {
      background: linear-gradient(90deg, #1d9bf0 0%, #ff2d55 100%);
      color: #fff; padding: 12px 14px;
    }
    .post[data-design='ig-tw'] .post-actions[data-design='ig-tw'] .pa-btn { color: #fff; }
    .post[data-design='premium'] {
      border: 2px solid transparent;
      background:
        linear-gradient(var(--bg-surface-solid), var(--bg-surface-solid)) padding-box,
        linear-gradient(135deg, #1877f2, #ff2d55, #1d9bf0) border-box;
      position: relative; box-shadow: 0 8px 32px rgba(175, 82, 222, 0.15);
    }
    .post[data-design='premium']::before {
      content: '⚡ Premium Unified';
      position: absolute; top: -10px; left: 20px;
      padding: 3px 10px;
      background: linear-gradient(135deg, #1877f2, #ff2d55, #1d9bf0);
      color: #fff; border-radius: var(--r-pill);
      font-size: 9px; font-weight: 800;
    }

    .post-head { display: flex; align-items: flex-start; gap: 12px; }
    .ph-avatar {
      width: 44px; height: 44px; display: grid; place-items: center;
      background: var(--bg-fill-2); border-radius: 50%; font-size: 22px; flex-shrink: 0;
    }
    .ph-info { flex: 1; min-width: 0; }
    .ph-name-row { display: flex; align-items: center; gap: 6px; }
    .ph-name-row b { font-size: 13px; font-weight: 700; }
    .verified { width: 14px; height: 14px; display: grid; place-items: center;
      background: #1d9bf0; color: #fff; border-radius: 50%; font-size: 9px; font-weight: 800; }
    .ph-handle { font-size: 11px; color: var(--label-2); display: block; margin-top: 2px; font-family: var(--sf-mono); }
    .ph-platforms { display: flex; gap: 4px; margin-top: 6px; }
    .plat-chip { width: 20px; height: 20px; display: grid; place-items: center; border-radius: 50%; font-size: 11px; }
    .plat-chip[data-p='facebook'] { background: rgba(24, 119, 242, 0.15); }
    .plat-chip[data-p='instagram'] { background: rgba(255, 45, 85, 0.15); }
    .plat-chip[data-p='twitter'] { background: rgba(29, 155, 240, 0.15); }
    .ph-menu {
      width: 28px; height: 28px; display: grid; place-items: center;
      background: transparent; border: 0; color: var(--label-3);
      border-radius: 50%; cursor: pointer; font-size: 16px;
    }
    .ph-menu:hover { background: var(--bg-hover); }

    .post-body { display: flex; flex-direction: column; gap: 10px; cursor: pointer; }
    .pb-text { font-size: 13px; line-height: 1.5; color: var(--label); white-space: pre-wrap; }
    .pb-media {
      display: grid; place-items: center;
      background: var(--bg-fill-2); border-radius: var(--r-sm);
      min-height: 160px; font-size: 72px;
    }
    .pb-hashtags { display: flex; flex-wrap: wrap; gap: 6px; }
    .hashtag { font-size: 12px; color: #1d9bf0; font-weight: 600; }

    .post-stats {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0; border-bottom: 0.5px solid var(--separator);
      font-size: 11px; color: var(--label-2);
    }
    .pstat { font-weight: 600; }
    .pstat-right { background: transparent; border: 0; cursor: pointer; color: var(--label-2); font-size: 11px; font-family: inherit; }
    .pstat-right:hover { color: var(--accent); }

    .post-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding-top: 4px; }
    .pa-btn {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 8px; border-radius: var(--r-sm); border: 0;
      background: transparent; color: var(--label-2);
      font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .pa-btn:hover { background: var(--bg-hover); color: var(--label); }
    .pa-btn.liked { color: #ff2d55; }
    .pa-btn.saved { color: #ff9500; }

    .stories-view { display: flex; flex-direction: column; gap: 20px; }
    .view-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
    .view-head h2 { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
    .view-head p { font-size: 13px; color: var(--label-2); margin-top: 4px; }
    .eyebrow { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); margin-bottom: 6px; }
    .btn-primary {
      padding: 9px 18px; background: var(--accent); color: var(--accent-contrast);
      border: 0; border-radius: var(--r-pill); font-size: 12px; font-weight: 700;
      cursor: pointer;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost {
      padding: 9px 18px; background: var(--bg-fill-2); color: var(--label);
      border: 0; border-radius: var(--r-pill); font-size: 12px; font-weight: 700;
      cursor: pointer;
    }

    .stories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
    .story-card {
      background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); overflow: hidden; cursor: pointer;
      transition: transform 180ms;
    }
    .story-card:hover { transform: translateY(-3px); }
    .sc-preview {
      height: 240px; display: grid; place-items: center; position: relative;
    }
    .sc-emoji { font-size: 72px; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.25)); }
    .sc-live { position: absolute; top: 10px; left: 10px;
      padding: 3px 8px; background: #ff3b30; color: #fff;
      border-radius: var(--r-pill); font-size: 9px; font-weight: 800; }
    .sc-platform { position: absolute; top: 10px; right: 10px; font-size: 20px; }
    .sc-count { position: absolute; bottom: 10px; right: 10px;
      padding: 3px 8px; background: rgba(0,0,0,0.55); color: #fff;
      border-radius: var(--r-pill); font-size: 10px; font-weight: 700; }
    .sc-info { padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; }
    .sc-user { display: flex; align-items: center; gap: 8px; }
    .sc-avatar { width: 32px; height: 32px; display: grid; place-items: center;
      background: var(--bg-fill-2); border-radius: 50%; font-size: 16px; }
    .sc-user b { font-size: 12px; font-weight: 700; display: block; }
    .sc-user small { font-size: 10px; color: var(--label-2); }
    .sc-views { font-size: 11px; color: var(--label-3); }

    .tiktok-wrap { display: flex; flex-direction: column; max-width: 480px; margin: 0 auto; width: 100%; }
    .tk-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 12px; border-bottom: 0.5px solid var(--separator);
      background: var(--bg-surface-solid); position: sticky; top: 0; z-index: 10;
    }
    .tk-tabs { display: flex; gap: 4px; }
    .tk-tab {
      padding: 8px 16px; border-radius: var(--r-pill);
      background: transparent; border: 0; color: var(--label-2);
      font-size: 13px; font-weight: 700; cursor: pointer;
    }
    .tk-tab.active { background: var(--accent-soft); color: var(--accent); }
    .tk-search { font-size: 12px; color: var(--label-2); padding: 6px 12px;
      background: var(--bg-fill-2); border-radius: var(--r-pill); cursor: pointer; }

    .tiktok-feed {
      display: flex; flex-direction: column;
      scroll-snap-type: y mandatory;
      overflow-y: auto;
      height: 640px;
      border-radius: var(--r-md);
      scrollbar-width: none;
      background: #000;
    }
    .tiktok-feed::-webkit-scrollbar { display: none; }

    .tiktok-reel {
      position: relative; min-height: 640px; height: 640px;
      scroll-snap-align: start;
      overflow: hidden;
      display: grid; place-items: center;
      cursor: pointer;
    }
    .tr-bg {
      position: absolute; inset: 0;
      display: grid; place-items: center;
    }
    .tr-bg-emoji { font-size: 140px; opacity: 0.85; filter: drop-shadow(0 8px 20px rgba(0,0,0,0.5)); }

    .heart-burst {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      font-size: 120px; pointer-events: none;
      animation: heartBurst 800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes heartBurst {
      0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
      40%  { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(1.7); }
    }

    .tr-follow {
      position: absolute; top: 20px; left: 20px;
      width: 44px; height: 44px; display: grid; place-items: center;
      background: rgba(255,255,255,0.15); backdrop-filter: blur(20px);
      border: 0; border-radius: 50%; cursor: pointer;
    }
    .tr-avatar { font-size: 22px; }
    .tr-plus {
      position: absolute; bottom: -4px; right: -4px;
      width: 18px; height: 18px; display: grid; place-items: center;
      background: #ff2d55; color: #fff; border-radius: 50%;
      font-size: 12px; font-weight: 800;
    }

    .tr-actions {
      position: absolute; right: 12px; bottom: 100px;
      display: flex; flex-direction: column; gap: 16px; align-items: center;
      z-index: 3;
    }
    .tra-btn {
      display: flex; flex-direction: column; align-items: center; gap: 3px;
      background: transparent; border: 0; color: #fff; cursor: pointer; padding: 4px;
    }
    .tra-btn.active .tra-icon { animation: heartBeat 400ms; }
    @keyframes heartBeat { 0%,100% { transform: scale(1); } 50% { transform: scale(1.35); } }
    .tra-icon { font-size: 28px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6)); }
    .tra-btn small { font-size: 11px; font-weight: 700; text-shadow: 0 1px 3px rgba(0,0,0,0.8); }

    .tra-disc {
      width: 44px; height: 44px;
      display: grid; place-items: center;
      background: rgba(255,255,255,0.15); backdrop-filter: blur(20px);
      border-radius: 50%;
      animation: discSpin 4s linear infinite;
      margin-top: 8px;
    }
    .tra-disc span { font-size: 20px; }
    @keyframes discSpin { to { transform: rotate(360deg); } }

    .tr-info {
      position: absolute; bottom: 60px; left: 16px; right: 80px;
      z-index: 3; color: #fff;
      background: linear-gradient(180deg, transparent, rgba(0,0,0,0.7));
      padding: 40px 16px 20px;
      border-radius: 0 0 var(--r-md) var(--r-md);
      margin: 0 -16px -60px;
    }
    .tr-user { font-size: 15px; font-weight: 800; display: block; margin-bottom: 6px; text-shadow: 0 2px 6px rgba(0,0,0,0.8); }
    .tr-caption { font-size: 13px; line-height: 1.4; margin-bottom: 10px; text-shadow: 0 1px 3px rgba(0,0,0,0.7); }
    .tr-music {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 12px;
      background: rgba(255,255,255,0.15); backdrop-filter: blur(20px);
      border-radius: var(--r-pill);
      font-size: 12px; max-width: 100%; overflow: hidden;
    }
    .trm-icon { font-size: 14px; flex-shrink: 0; }
    .trm-ticker {
      overflow: hidden; max-width: 200px; white-space: nowrap; position: relative;
    }
    .trm-ticker span {
      display: inline-block;
      padding-left: 100%;
      animation: marquee 12s linear infinite;
    }
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-100%); }
    }

    .tr-progress {
      position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
      background: rgba(255,255,255,0.15);
      display: flex; gap: 2px; align-items: center; z-index: 3;
    }
    .trp-dot { flex: 1; height: 100%; background: rgba(255,255,255,0.3); }
    .trp-dot.done { background: #fff; }
    .trp-bar { position: absolute; bottom: 0; left: 0; height: 3px; background: #fff; }

    .tiktok-hint {
      text-align: center; padding: 12px; font-size: 11px;
      color: var(--label-3); letter-spacing: 0.15em; font-weight: 700;
      animation: fade-blink 2.5s infinite;
    }
    @keyframes fade-blink { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }

    .explore-view { display: flex; flex-direction: column; gap: 20px; }
    .explore-tags { display: flex; gap: 8px; flex-wrap: wrap; }
    .exp-tag {
      padding: 8px 14px; background: var(--bg-fill-2);
      border: 0; border-radius: var(--r-pill);
      display: flex; flex-direction: column; align-items: flex-start;
      cursor: pointer; transition: all 140ms;
    }
    .exp-tag:hover { background: var(--accent-soft); }
    .exp-tag b { font-size: 12px; font-weight: 800; color: var(--accent); }
    .exp-tag small { font-size: 9px; color: var(--label-3); }
    .explore-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
    .explore-tile {
      aspect-ratio: 1; display: grid; place-items: center;
      background: var(--bg-fill-2); border-radius: var(--r-sm);
      cursor: pointer; position: relative; overflow: hidden;
    }
    .explore-tile[data-i='0'] { background: linear-gradient(135deg, #1877f2, #007aff); }
    .explore-tile[data-i='1'] { background: linear-gradient(135deg, #ff2d55, #ff9500); }
    .explore-tile[data-i='2'] { background: linear-gradient(135deg, #1d9bf0, #af52de); }
    .explore-tile[data-i='3'] { background: linear-gradient(135deg, #34c759, #00c7be); }
    .explore-tile[data-i='4'] { background: linear-gradient(135deg, #af52de, #ff2d55); }
    .explore-tile[data-i='5'] { background: linear-gradient(135deg, #ffcc00, #ff9500); }
    .et-emoji { font-size: 64px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3)); }
    .et-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,0.5);
      opacity: 0; display: flex; align-items: center; justify-content: center;
      gap: 20px; color: #fff; font-size: 14px; font-weight: 800;
      transition: opacity 200ms;
    }
    .explore-tile:hover .et-overlay { opacity: 1; }

    .messages-layout {
      display: grid; grid-template-columns: 340px 1fr;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md);
      overflow: hidden; height: 640px;
    }
    @media (max-width: 800px) { .messages-layout { grid-template-columns: 1fr; height: auto; } }
    .msg-list-panel { border-right: 0.5px solid var(--separator); display: flex; flex-direction: column; min-height: 0; }
    .mlp-head { padding: 16px; border-bottom: 0.5px solid var(--separator); }
    .mlp-head h3 { font-size: 16px; font-weight: 800; margin-bottom: 10px; }
    .msg-platform-filter { display: flex; gap: 4px; }
    .mpf {
      padding: 5px 12px; border-radius: var(--r-pill);
      background: var(--bg-fill-2); color: var(--label-2);
      font-size: 11px; font-weight: 700; border: 0; cursor: pointer;
    }
    .mpf.active { background: var(--accent); color: var(--accent-contrast); }
    .convo-list { list-style: none; flex: 1; overflow-y: auto; }
    .convo {
      display: grid; grid-template-columns: 48px 1fr auto;
      gap: 12px; align-items: center;
      padding: 12px 16px; cursor: pointer;
      border-bottom: 0.5px solid var(--separator);
    }
    .convo:hover { background: var(--bg-hover); }
    .convo.active { background: var(--accent-soft); }
    .convo.unread { border-left: 3px solid var(--accent); }
    .conv-avatar {
      width: 48px; height: 48px; display: grid; place-items: center;
      background: var(--bg-fill-2); border-radius: 50%; font-size: 22px; position: relative;
    }
    .online-dot {
      position: absolute; bottom: 2px; right: 2px;
      width: 12px; height: 12px; background: #34c759;
      border: 2px solid var(--bg-surface-solid); border-radius: 50%;
    }
    .conv-body { min-width: 0; }
    .conv-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .conv-row b { font-size: 13px; font-weight: 700; }
    .conv-time { font-size: 10px; color: var(--label-3); }
    .conv-handle { font-size: 10px; color: var(--label-2); display: block; font-family: var(--sf-mono); }
    .conv-preview { font-size: 12px; color: var(--label-2); margin-top: 3px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .conv-preview em { color: var(--accent); }
    .unread-badge { padding: 2px 8px; background: #ff3b30; color: #fff;
      border-radius: 10px; font-size: 10px; font-weight: 800; }

    .msg-thread-panel { display: flex; flex-direction: column; min-height: 0; }
    .mtp-head {
      display: grid; grid-template-columns: 44px 1fr auto;
      gap: 12px; align-items: center; padding: 12px 20px;
      border-bottom: 0.5px solid var(--separator); flex-shrink: 0;
    }
    .mtp-avatar {
      width: 44px; height: 44px; display: grid; place-items: center;
      background: var(--bg-fill-2); border-radius: 50%; font-size: 22px;
    }
    .mtp-info b { font-size: 14px; font-weight: 700; display: block; }
    .mtp-info small { font-size: 11px; color: var(--label-2); }
    .online-txt { color: #34c759; font-weight: 700; }
    .mtp-actions { display: flex; gap: 4px; }
    .ic-btn {
      width: 36px; height: 36px; display: grid; place-items: center;
      background: transparent; border: 0; border-radius: 50%;
      color: var(--label-2); cursor: pointer; font-size: 16px;
    }
    .ic-btn:hover { background: var(--bg-hover); color: var(--label); }
    .mtp-body {
      flex: 1; overflow-y: auto; padding: 20px;
      display: flex; flex-direction: column; gap: 12px; background: var(--bg-root);
    }
    .bubble-row { display: flex; gap: 8px; align-items: flex-end; }
    .bubble-row.from-me { flex-direction: row-reverse; }
    .bubble-avatar { width: 28px; height: 28px; display: grid; place-items: center;
      background: var(--bg-fill-2); border-radius: 50%; font-size: 14px; flex-shrink: 0; }
    .bubble {
      max-width: 70%; padding: 10px 14px;
      background: var(--bg-surface-solid); border-radius: 16px 16px 16px 4px;
      border: 0.5px solid var(--separator);
    }
    .bubble-row.from-me .bubble {
      background: var(--accent); color: var(--accent-contrast);
      border-color: transparent; border-radius: 16px 16px 4px 16px;
    }
    .bubble p { font-size: 13px; line-height: 1.45; }
    .bubble small { font-size: 10px; opacity: 0.75; display: block; margin-top: 4px; }
    .seen { color: #34c759; font-weight: 700; }
    .mtp-composer {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; border-top: 0.5px solid var(--separator); flex-shrink: 0;
    }
    .mtp-composer input {
      flex: 1; padding: 10px 16px;
      background: var(--bg-input); border: 0.5px solid var(--separator);
      border-radius: var(--r-pill); font-size: 13px; outline: none; font-family: inherit;
      color: var(--label);
    }
    .cmb-icon {
      width: 34px; height: 34px; display: grid; place-items: center;
      background: transparent; border: 0; border-radius: 50%; font-size: 16px; cursor: pointer;
    }
    .cmb-icon:hover { background: var(--bg-hover); }
    .cmb-send {
      width: 38px; height: 38px; display: grid; place-items: center;
      background: var(--accent); color: var(--accent-contrast);
      border: 0; border-radius: 50%; font-size: 14px; cursor: pointer;
    }
    .empty-state {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 8px; color: var(--label-2);
    }
    .empty-state span { font-size: 56px; opacity: 0.4; }
    .empty-state b { font-size: 14px; }

    .calls-view { display: flex; flex-direction: column; gap: 20px; }
    .call-actions { display: flex; gap: 8px; }
    .calls-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .cst {
      padding: 16px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md); text-align: center;
    }
    .cst.danger { border-left: 3px solid #ff3b30; }
    .cst span { font-size: 22px; }
    .cst b { display: block; font-size: 24px; font-weight: 800; margin: 6px 0 2px; font-variant-numeric: tabular-nums; }
    .cst small { font-size: 11px; color: var(--label-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .calls-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .call-row {
      display: grid; grid-template-columns: 44px 1fr auto auto;
      gap: 14px; align-items: center;
      padding: 12px 16px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-sm);
    }
    .call-row[data-dir='missed'] { border-left: 3px solid #ff3b30; }
    .call-row[data-dir='incoming'] { border-left: 3px solid #34c759; }
    .call-row[data-dir='outgoing'] { border-left: 3px solid #007aff; }
    .call-avatar { width: 44px; height: 44px; display: grid; place-items: center;
      background: var(--bg-fill-2); border-radius: 50%; font-size: 20px; }
    .call-info b { font-size: 13px; font-weight: 700; display: block; }
    .call-info small { font-size: 11px; color: var(--label-2); }
    .call-duration { font-size: 12px; font-weight: 700; color: var(--label-2); }
    .call-quick { display: flex; gap: 4px; }
    .call-quick button {
      width: 32px; height: 32px; display: grid; place-items: center;
      background: var(--bg-fill-2); border: 0; border-radius: 50%;
      cursor: pointer; font-size: 14px;
    }
    .call-quick button:hover { background: var(--accent); color: var(--accent-contrast); }

    .view-generic { display: flex; flex-direction: column; gap: 20px; }
    .bm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
    .bm-card {
      padding: 14px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md);
      display: flex; flex-direction: column; gap: 8px; cursor: pointer;
    }
    .bm-avatar { font-size: 24px; }
    .bm-card b { font-size: 12px; font-weight: 700; }
    .bm-card p { font-size: 11px; color: var(--label-2); line-height: 1.4; }
    .bm-chips { display: flex; gap: 4px; }

    .notif-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .notif-row {
      display: grid; grid-template-columns: 44px 1fr auto;
      gap: 14px; align-items: center;
      padding: 14px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-sm);
    }
    .notif-icon { width: 44px; height: 44px; display: grid; place-items: center;
      border-radius: var(--r-sm); font-size: 20px; }
    .notif-body b { font-size: 13px; font-weight: 700; }
    .notif-body p { font-size: 12px; color: var(--label-2); margin-top: 3px; }
    .notif-body small { font-size: 10px; color: var(--label-3); }
    .notif-platform { font-size: 18px; }

    .designs-view { display: flex; flex-direction: column; gap: 20px; }
    .design-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .dt-chip {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 14px; border-radius: var(--r-pill);
      background: var(--bg-fill-2); color: var(--label-2);
      font-size: 11px; font-weight: 700; border: 2px solid transparent;
      cursor: pointer;
    }
    .dt-chip.active { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
    .design-preview {
      display: grid; grid-template-columns: 1fr 320px;
      gap: 20px; align-items: flex-start;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md);
      padding: 24px;
    }
    @media (max-width: 800px) { .design-preview { grid-template-columns: 1fr; } }
    .dp-mock { background: var(--bg-root); border-radius: var(--r-md); padding: 20px; max-width: 520px; width: 100%; }
    .design-preview[data-d='fb'] .dp-mock .dp-actions { background: #f0f2f5; margin: 12px -20px -20px; padding: 12px 20px; border-radius: 0 0 var(--r-md) var(--r-md); }
    .design-preview[data-d='fb'] .dp-mock .dp-actions .dpa-btn { color: #1877f2; font-weight: 700; }
    .design-preview[data-d='ig'] .dp-mock { padding: 0; overflow: hidden; }
    .design-preview[data-d='ig'] .dp-mock .dp-head { padding: 14px; }
    .design-preview[data-d='ig'] .dp-mock .dp-text { padding: 0 14px; }
    .design-preview[data-d='ig'] .dp-mock .dp-media {
      margin: 12px 0 0; aspect-ratio: 1;
      background: linear-gradient(135deg, #ff2d55, #ff9500, #af52de);
      font-size: 96px;
    }
    .design-preview[data-d='ig'] .dp-mock .dp-hashtags { padding: 0 14px; }
    .design-preview[data-d='ig'] .dp-mock .dp-actions { padding: 14px; border-top: 0.5px solid var(--separator); }
    .design-preview[data-d='tw'] .dp-mock { padding: 12px 16px; }
    .design-preview[data-d='tw'] .dp-mock .dp-actions .dpa-btn { color: #1d9bf0; }
    .design-preview[data-d='ig-tw'] .dp-mock {
      border-radius: 16px;
      background: linear-gradient(var(--bg-surface-solid), var(--bg-surface-solid)) padding-box,
        linear-gradient(135deg, #ff2d55, #1d9bf0) border-box;
      border: 2px solid transparent; padding: 16px;
    }
    .design-preview[data-d='ig-tw'] .dp-mock .dp-actions {
      background: linear-gradient(90deg, #ff2d55 0%, #1d9bf0 100%);
      margin: 12px -16px -16px; padding: 12px 16px;
      border-radius: 0 0 14px 14px;
    }
    .design-preview[data-d='ig-tw'] .dp-mock .dp-actions .dpa-btn { color: #fff; }
    .design-preview[data-d='premium'] .dp-mock {
      background: linear-gradient(var(--bg-surface-solid), var(--bg-surface-solid)) padding-box,
        linear-gradient(135deg, #1877f2, #ff2d55, #1d9bf0) border-box;
      border: 2px solid transparent;
      box-shadow: 0 12px 40px rgba(175, 82, 222, 0.2);
    }
    .design-preview[data-d='premium'] .dp-mock::before {
      content: '⚡ Premium Unified Design';
      display: block; margin-bottom: 16px;
      font-size: 10px; font-weight: 800; letter-spacing: 0.08em;
      color: transparent;
      background: linear-gradient(135deg, #1877f2, #ff2d55, #1d9bf0);
      -webkit-background-clip: text; background-clip: text;
    }
    .dp-head { display: flex; align-items: center; gap: 12px; }
    .dp-avatar { width: 48px; height: 48px; display: grid; place-items: center;
      background: var(--accent); color: #fff; border-radius: 50%; font-size: 22px; }
    .dp-head b { font-size: 14px; font-weight: 700; }
    .dp-head small { font-size: 11px; color: var(--label-2); display: block; }
    .dp-text { font-size: 14px; line-height: 1.5; padding: 12px 0; }
    .dp-media {
      display: grid; place-items: center;
      background: var(--bg-fill-2); border-radius: var(--r-sm);
      min-height: 200px; font-size: 88px; margin-bottom: 12px;
    }
    .dp-hashtags { display: flex; gap: 8px; flex-wrap: wrap; }
    .dp-hashtags span { font-size: 13px; color: #1d9bf0; font-weight: 700; }
    .dp-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding-top: 12px; }
    .dpa-btn {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 8px; border-radius: var(--r-sm); border: 0;
      background: transparent; color: var(--label-2);
      font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .dp-meta { padding: 20px; background: var(--bg-fill-2); border-radius: var(--r-md);
      display: flex; flex-direction: column; gap: 14px; }
    .dp-meta h3 { font-size: 16px; font-weight: 800; }
    .dp-meta p { font-size: 12px; line-height: 1.5; color: var(--label-2); }
    .dp-features { display: flex; flex-direction: column; gap: 6px; }
    .dpf-chip { font-size: 11px; color: #34c759; font-weight: 700; }

    .profile-view { display: flex; flex-direction: column; gap: 20px; }
    .profile-hero {
      background: var(--bg-surface-solid); border: 0.5px solid var(--separator);
      border-radius: var(--r-md); overflow: hidden;
    }
    .ph-cover { height: 140px; background: linear-gradient(135deg, var(--p), color-mix(in srgb, var(--p) 60%, #000)); }
    .ph-body { padding: 0 24px 24px; position: relative; }
    .ph-avatar-lg {
      width: 100px; height: 100px; display: grid; place-items: center;
      background: var(--bg-surface-solid); border: 4px solid var(--bg-surface-solid);
      border-radius: 50%; font-size: 44px; font-weight: 800; color: var(--p);
      margin-top: -50px; margin-bottom: 12px;
    }
    .ph-info-lg h2 { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; display: flex; align-items: center; gap: 8px; }
    .ph-handle-lg { font-size: 13px; color: var(--label-2); font-family: var(--sf-mono); margin-top: 3px; }
    .ph-bio { font-size: 14px; color: var(--label); margin-top: 10px; line-height: 1.5; }
    .ph-stats-lg { display: flex; gap: 24px; margin-top: 16px; padding-top: 16px; border-top: 0.5px solid var(--separator); }
    .ph-stats-lg > div { text-align: center; }
    .ph-stats-lg b { font-size: 18px; font-weight: 800; display: block; font-variant-numeric: tabular-nums; }
    .ph-stats-lg small { font-size: 10px; color: var(--label-3); text-transform: uppercase; font-weight: 700; }
    .profile-posts h3 { font-size: 15px; font-weight: 800; margin-bottom: 14px; }
    .profile-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
    .profile-tile {
      aspect-ratio: 1; display: grid; place-items: center;
      background: var(--bg-fill-2); border-radius: var(--r-sm); cursor: pointer;
    }
    .pt-emoji { font-size: 56px; }

    .os-right { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 80px; align-self: flex-start; }
    .side-card { padding: 16px; background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator); border-radius: var(--r-md); }
    .side-card > header { margin-bottom: 12px; }
    .side-card > header b { font-size: 13px; font-weight: 800; }
    .trending-list, .online-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .trending-list li { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
    .tr { font-weight: 700; color: var(--accent); }
    .trending-list small { font-size: 10px; color: var(--label-3); }
    .online-row { display: grid; grid-template-columns: 36px 1fr; gap: 10px; align-items: center; }
    .ol-avatar { width: 36px; height: 36px; display: grid; place-items: center;
      background: var(--bg-fill-2); border-radius: 50%; font-size: 18px; position: relative; }
    .ol-dot { position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px;
      border-radius: 50%; border: 2px solid var(--bg-surface-solid); }
    .ol-dot[data-p='facebook'] { background: #1877f2; }
    .ol-dot[data-p='instagram'] { background: #ff2d55; }
    .ol-dot[data-p='twitter'] { background: #1d9bf0; }
    .online-row b { font-size: 12px; font-weight: 700; display: block; }
    .online-row small { font-size: 10px; color: var(--label-3); }

    .comment-row {
      display: flex; gap: 10px; padding: 10px 0;
      padding-left: calc(var(--depth, 0) * 32px);
      position: relative;
    }
    .comment-row::before {
      content: '';
      position: absolute;
      left: calc(var(--depth, 0) * 32px + 14px);
      top: 0; bottom: -4px;
      width: 2px;
      background: var(--separator);
      border-radius: 2px;
      opacity: calc(var(--depth, 0) * 1);
    }
    .comment-row[style*='--depth: 0']::before { display: none; }
    .comment-avatar {
      width: 36px; height: 36px; display: grid; place-items: center;
      background: var(--bg-fill-2); border-radius: 50%; font-size: 18px;
      flex-shrink: 0;
    }
    .comment-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .comment-bubble {
      background: var(--bg-fill-2); border-radius: 14px;
      padding: 10px 14px;
    }
    .comment-head { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap; }
    .comment-head b { font-size: 12px; font-weight: 700; }
    .comment-handle { font-size: 10px; color: var(--label-3); font-family: var(--sf-mono); }
    .comment-plat {
      width: 18px; height: 18px; display: grid; place-items: center;
      border-radius: 50%; font-size: 10px;
    }
    .comment-plat[data-p='facebook'] { background: rgba(24,119,242,0.15); }
    .comment-plat[data-p='instagram'] { background: rgba(255,45,85,0.15); }
    .comment-plat[data-p='twitter'] { background: rgba(29,155,240,0.15); }
    .comment-text { font-size: 13px; line-height: 1.45; color: var(--label); white-space: pre-wrap; }
    .comment-actions { display: flex; gap: 12px; padding-left: 4px; }
    .c-action {
      font-size: 11px; color: var(--label-2); font-weight: 600;
      background: transparent; border: 0; cursor: pointer; padding: 2px 0;
    }
    .c-action:hover { color: var(--accent); }
    .c-action.liked { color: #ff2d55; }
    .comment-replies { display: flex; flex-direction: column; gap: 0; margin-top: 4px; }

    .reply-input-box {
      display: flex; align-items: center; gap: 8px;
      margin-top: 8px; padding: 6px 6px 6px 10px;
      background: var(--bg-input); border-radius: var(--r-pill);
    }
    .reply-avatar {
      width: 26px; height: 26px; display: grid; place-items: center;
      background: var(--accent); color: #fff; border-radius: 50%;
      font-size: 10px; font-weight: 800; flex-shrink: 0;
    }
    .reply-input {
      flex: 1; background: transparent; border: 0; outline: none;
      font-size: 12px; color: var(--label); font-family: inherit; padding: 6px 0;
    }
    .reply-send {
      width: 30px; height: 30px; display: grid; place-items: center;
      background: var(--accent); color: var(--accent-contrast);
      border: 0; border-radius: 50%; font-size: 12px; cursor: pointer;
    }
    .reply-send:disabled { opacity: 0.4; cursor: not-allowed; }

    .story-viewer {
      position: fixed; inset: 0; z-index: 9500;
      background: #000; color: #fff;
      display: flex; flex-direction: column;
      animation: fadeIn 200ms;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .sv-progress {
      position: absolute; top: 12px; left: 12px; right: 12px;
      display: flex; gap: 4px; z-index: 3;
    }
    .svp-track {
      flex: 1; height: 3px;
      background: rgba(255,255,255,0.25);
      border-radius: 3px; overflow: hidden;
    }
    .svp-fill {
      height: 100%; background: #fff;
      transition: width 100ms linear;
    }
    .sv-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 32px 16px 12px; z-index: 2;
    }
    .sv-user { display: flex; align-items: center; gap: 10px; }
    .sv-avatar {
      width: 40px; height: 40px; display: grid; place-items: center;
      background: rgba(255,255,255,0.2); backdrop-filter: blur(20px);
      border-radius: 50%; font-size: 20px;
    }
    .sv-user b { font-size: 13px; font-weight: 700; display: block; }
    .sv-user small { font-size: 11px; opacity: 0.75; }
    .sv-actions { display: flex; gap: 4px; }
    .sv-icon {
      width: 36px; height: 36px; display: grid; place-items: center;
      background: transparent; border: 0; color: #fff; cursor: pointer;
      font-size: 18px; border-radius: 50%;
    }
    .sv-icon:hover { background: rgba(255,255,255,0.15); }

    .sv-content { flex: 1; position: relative; overflow: hidden; display: flex; flex-direction: column; }
    .sv-media {
      flex: 1; display: grid; place-items: center;
      position: relative;
      transition: background 300ms;
    }
    .sv-emoji {
      font-size: 180px;
      filter: drop-shadow(0 12px 30px rgba(0,0,0,0.5));
    }
    .sv-caption {
      position: absolute; bottom: 24px; left: 24px; right: 24px;
      font-size: 20px; font-weight: 700; text-align: center;
      text-shadow: 0 4px 12px rgba(0,0,0,0.6);
    }
    .sv-zone {
      position: absolute; top: 0; bottom: 60px;
      width: 40%; background: transparent; border: 0; cursor: pointer; z-index: 1;
    }
    .sv-zone-left { left: 0; }
    .sv-zone-right { right: 0; }

    .sv-reactions-bar {
      display: flex; justify-content: center; gap: 12px;
      padding: 12px; z-index: 2;
    }
    .svr-btn {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 10px 14px; background: rgba(255,255,255,0.15);
      backdrop-filter: blur(20px);
      border: 0; border-radius: var(--r-pill);
      color: #fff; cursor: pointer;
      transition: transform 140ms;
    }
    .svr-btn:hover { transform: scale(1.15); background: rgba(255,255,255,0.25); }
    .svr-btn span { font-size: 24px; }
    .svr-btn small { font-size: 10px; font-weight: 700; }

    .sv-reply {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; z-index: 2;
    }
    .sv-reply input {
      flex: 1; padding: 12px 18px;
      background: rgba(255,255,255,0.15); backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: var(--r-pill);
      color: #fff; font-size: 13px; outline: none; font-family: inherit;
    }
    .sv-reply input::placeholder { color: rgba(255,255,255,0.6); }
    .svr-send {
      width: 44px; height: 44px; display: grid; place-items: center;
      background: #fff; color: #000; border: 0; border-radius: 50%;
      font-size: 14px; cursor: pointer;
    }

    .sv-music {
      position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
      padding: 6px 14px;
      background: rgba(255,255,255,0.15); backdrop-filter: blur(20px);
      border-radius: var(--r-pill);
      font-size: 12px; z-index: 2;
    }

    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7);
      backdrop-filter: blur(8px); z-index: 9000;
      display: grid; place-items: center; padding: 20px;
      animation: fadeIn 200ms;
    }
    .post-detail-modal {
      max-width: 920px; width: 100%; max-height: 90vh;
      background: var(--bg-elevated); border-radius: var(--r-lg);
      box-shadow: var(--shadow-xl); display: flex; flex-direction: column;
      overflow: hidden;
    }
    .pdm-head {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 20px; border-bottom: 0.5px solid var(--separator);
    }
    .modal-close {
      width: 32px; height: 32px; display: grid; place-items: center;
      background: transparent; border: 0; border-radius: var(--r-xs);
      color: var(--label-3); font-size: 16px; cursor: pointer;
      margin-left: auto;
    }
    .modal-close:hover { background: var(--bg-hover); color: var(--label); }
    .pdm-body {
      display: grid; grid-template-columns: 1fr 1fr;
      flex: 1; min-height: 0; overflow: hidden;
    }
    @media (max-width: 800px) { .pdm-body { grid-template-columns: 1fr; } }
    .pdm-content { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
    .pdm-text { font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
    .pdm-media {
      display: grid; place-items: center;
      background: var(--bg-fill-2); border-radius: var(--r-sm);
      min-height: 200px; font-size: 96px;
    }
    .pdm-post-actions {
      display: flex; gap: 8px; padding-top: 14px;
      border-top: 0.5px solid var(--separator); flex-wrap: wrap;
    }
    .pdm-post-actions .pa-btn { flex: 1; }

    .pdm-comments {
      border-left: 0.5px solid var(--separator);
      display: flex; flex-direction: column; min-height: 0;
    }
    .pdm-comments-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px; border-bottom: 0.5px solid var(--separator);
      flex-shrink: 0;
    }
    .pdm-comments-head b { font-size: 14px; font-weight: 800; }
    .pdm-sort { display: flex; gap: 4px; }
    .pds-chip {
      padding: 4px 10px; border-radius: var(--r-pill);
      background: var(--bg-fill-2); color: var(--label-2);
      font-size: 11px; font-weight: 700; border: 0; cursor: pointer;
    }
    .pds-chip.active { background: var(--accent-soft); color: var(--accent); }

    .pdm-comments-list {
      flex: 1; overflow-y: auto; padding: 8px 20px 20px;
    }
    .empty-mini {
      padding: 60px 20px; text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .empty-mini span { font-size: 40px; opacity: 0.4; }
    .empty-mini b { font-size: 13px; font-weight: 700; }
    .empty-mini small { font-size: 11px; color: var(--label-2); }

    .pdm-composer {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 20px; border-top: 0.5px solid var(--separator);
      flex-shrink: 0;
    }
    .pdm-avatar {
      width: 34px; height: 34px; display: grid; place-items: center;
      background: var(--accent); color: var(--accent-contrast);
      border-radius: 50%; font-size: 11px; font-weight: 800; flex-shrink: 0;
    }
    .pdm-input {
      flex: 1; padding: 10px 16px;
      background: var(--bg-input); border: 0.5px solid var(--separator);
      border-radius: var(--r-pill); font-size: 13px; outline: none;
      font-family: inherit; color: var(--label);
    }
    .pdm-send {
      width: 38px; height: 38px; display: grid; place-items: center;
      background: var(--accent); color: var(--accent-contrast);
      border: 0; border-radius: 50%; font-size: 13px; cursor: pointer;
    }
    .pdm-send:disabled { opacity: 0.4; cursor: not-allowed; }

    .sheet-backdrop { align-items: end; }
    .comments-sheet {
      width: 100%; max-width: 560px;
      max-height: 78vh; background: var(--bg-elevated);
      border-radius: var(--r-lg) var(--r-lg) 0 0;
      display: flex; flex-direction: column;
      animation: sheetUp 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
      overflow: hidden;
    }
    @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .sheet-handle { display: flex; justify-content: center; padding: 12px 0 6px; }
    .sheet-handle span { width: 40px; height: 4px; background: var(--label-3);
      border-radius: 999px; opacity: 0.5; }
    .cs-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 20px 12px; border-bottom: 0.5px solid var(--separator);
    }
    .cs-head b { font-size: 14px; font-weight: 800; }
    .cs-body {
      flex: 1; overflow-y: auto; padding: 12px 20px;
    }
    .cs-composer {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 20px; border-top: 0.5px solid var(--separator);
    }
    .cs-composer input {
      flex: 1; padding: 10px 16px;
      background: var(--bg-input); border: 0.5px solid var(--separator);
      border-radius: var(--r-pill); font-size: 13px; outline: none;
      font-family: inherit; color: var(--label);
    }
    .cs-send {
      width: 38px; height: 38px; display: grid; place-items: center;
      background: var(--accent); color: var(--accent-contrast);
      border: 0; border-radius: 50%; font-size: 13px; cursor: pointer;
    }
    .cs-send:disabled { opacity: 0.4; cursor: not-allowed; }

    .composer-modal {
      max-width: 620px; width: 100%; max-height: 90vh;
      background: var(--bg-elevated); border-radius: var(--r-lg);
      box-shadow: var(--shadow-xl);
      display: flex; flex-direction: column; overflow: hidden;
    }
    .cm-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px 22px; border-bottom: 0.5px solid var(--separator);
    }
    .cm-head h3 { font-size: 16px; font-weight: 800; }
    .cm-platforms { display: flex; align-items: center; gap: 8px; padding: 16px 22px 8px; flex-wrap: wrap; }
    .cmp-label { font-size: 12px; color: var(--label-2); font-weight: 700; }
    .cmp-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: var(--r-pill);
      background: var(--bg-fill-2); color: var(--label-2);
      font-size: 12px; font-weight: 700; border: 2px solid transparent;
      cursor: pointer;
    }
    .cmp-chip[data-p='facebook'].active { background: rgba(24,119,242,0.15); border-color: #1877f2; color: #1877f2; }
    .cmp-chip[data-p='instagram'].active { background: rgba(255,45,85,0.15); border-color: #ff2d55; color: #ff2d55; }
    .cmp-chip[data-p='twitter'].active { background: rgba(29,155,240,0.15); border-color: #1d9bf0; color: #1d9bf0; }
    .cm-design-preview {
      margin: 8px 22px; padding: 10px 14px;
      background: var(--bg-fill-2); border-radius: var(--r-sm);
      display: flex; align-items: center; justify-content: space-between; font-size: 12px;
    }
    .cdp-label { color: var(--label-2); }
    .cm-design-preview b { color: var(--accent); font-weight: 800; }
    .cm-textarea {
      margin: 8px 22px;
      padding: 16px; background: var(--bg-input);
      border: 0.5px solid var(--separator); border-radius: var(--r-md);
      font-size: 14px; font-family: inherit; color: var(--label);
      outline: none; resize: vertical; min-height: 120px;
    }
    .cm-toolbar { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 22px; }
    .cm-toolbar button {
      padding: 6px 12px; background: var(--bg-fill-2); border: 0;
      border-radius: var(--r-pill); font-size: 11px; font-weight: 600;
      color: var(--label-2); cursor: pointer;
    }
    .cm-foot {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 16px 22px; border-top: 0.5px solid var(--separator);
    }

    .call-modal {
      position: fixed; inset: 0; z-index: 9100;
      display: grid; place-items: center;
    }
    .call-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #0a0a14, #1a1a3e); }
    .call-content {
      position: relative; z-index: 1;
      display: flex; flex-direction: column; align-items: center; gap: 16px;
      padding: 40px; max-width: 500px; text-align: center; color: #fff;
    }
    .call-avatar-big {
      width: 140px; height: 140px; display: grid; place-items: center;
      background: rgba(255,255,255,0.15); backdrop-filter: blur(20px);
      border-radius: 50%; font-size: 64px;
      animation: pulse-ring 2s infinite;
    }
    @keyframes pulse-ring {
      0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
      50% { box-shadow: 0 0 0 20px rgba(255,255,255,0); }
    }
    .call-content h2 { font-size: 28px; font-weight: 800; }
    .call-status { font-size: 14px; color: rgba(255,255,255,0.75); }
    .call-platform { font-size: 12px; color: rgba(255,255,255,0.55); }
    .video-preview {
      width: 240px; height: 180px; border-radius: var(--r-md);
      background: rgba(255,255,255,0.1); position: relative;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .vp-self {
      position: absolute; bottom: 8px; right: 8px;
      width: 60px; height: 60px; display: grid; place-items: center;
      background: rgba(255,255,255,0.2); border-radius: var(--r-sm);
      font-size: 12px; font-weight: 800;
    }
    .call-controls { display: flex; gap: 12px; margin-top: 20px; }
    .cc-btn {
      width: 56px; height: 56px; display: grid; place-items: center;
      background: rgba(255,255,255,0.15); backdrop-filter: blur(20px);
      border: 0; border-radius: 50%; font-size: 22px; cursor: pointer;
      color: #fff;
    }
    .cc-btn.danger { background: #ff3b30; }
    .cc-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  `],
})
export class OmniSocialDemoComponent implements OnDestroy {
  public toast = inject(ToastService);
  private menu = inject(ContextMenuService);

  readonly myAvatar = 'IS';

  readonly activeProfile = signal<ProfileTab>('main');
  readonly activeView = signal<DemoView>('feed');
  readonly msgPlatformFilter = signal<'all' | Platform>('all');
  readonly activeConvo = signal<DemoConversation | null>(null);
  readonly messageInput = signal('');
  readonly composerOpen = signal(false);
  readonly composerPlatforms = signal<Platform[]>(['facebook']);
  readonly composerText = signal('');
  readonly previewDesign = signal<DesignKind>('fb');

  readonly storyViewerOpen = signal<StoryUser | null>(null);
  readonly svItemIndex = signal(0);
  readonly svProgress = signal(0);
  readonly storyReplyText = signal('');
  private storyTimer: number | null = null;

  readonly postDetailOpen = signal<DemoPost | null>(null);
  readonly commentText = signal('');
  readonly replyText = signal('');
  readonly replyingToId = signal<string | null>(null);

  readonly reelCommentsOpen = signal<Reel | null>(null);
  readonly reelCommentText = signal('');

  readonly doubleTapHeart = signal<string | null>(null);

  readonly callState = signal<{
    id: string;
    type: 'voice' | 'video';
    platform: Platform | 'main';
    contact: string;
    avatar: string;
    status: string;
  } | null>(null);

  readonly profiles: { id: ProfileTab; label: string; icon: string; color: string; handle: string; }[] = [
    { id: 'main', label: 'Main', icon: '◈', color: '#af52de', handle: '@ibrahim' },
    { id: 'facebook', label: 'Facebook', icon: '📘', color: '#1877f2', handle: 'facebook.com/ibrahim' },
    { id: 'instagram', label: 'Instagram', icon: '📷', color: '#ff2d55', handle: '@ibrahim.dev' },
    { id: 'twitter', label: 'Twitter', icon: '🐦', color: '#1d9bf0', handle: '@ibrahim_dev' },
  ];

  readonly platformOptions = [
    { id: 'facebook' as const, label: 'Facebook', icon: '📘' },
    { id: 'instagram' as const, label: 'Instagram', icon: '📷' },
    { id: 'twitter' as const, label: 'Twitter', icon: '🐦' },
  ];

  readonly designOptions: { id: DesignKind; label: string; platforms: Platform[]; }[] = [
    { id: 'fb', label: 'Facebook only', platforms: ['facebook'] },
    { id: 'ig', label: 'Instagram only', platforms: ['instagram'] },
    { id: 'tw', label: 'Twitter only', platforms: ['twitter'] },
    { id: 'fb-ig', label: 'Facebook + Instagram', platforms: ['facebook', 'instagram'] },
    { id: 'fb-tw', label: 'Facebook + Twitter', platforms: ['facebook', 'twitter'] },
    { id: 'ig-tw', label: 'Instagram + Twitter', platforms: ['instagram', 'twitter'] },
    { id: 'premium', label: 'All 3 (Premium)', platforms: ['facebook', 'instagram', 'twitter'] },
  ];

  readonly sideNav = computed(() => [
    { id: 'feed', icon: '🏠', label: 'Feed', badge: null },
    { id: 'stories', icon: '📸', label: 'Stories', badge: String(this.stories().length) },
    { id: 'reels', icon: '🎬', label: 'Reels', badge: null },
    { id: 'explore', icon: '🔍', label: 'Explore', badge: null },
    { id: 'messages', icon: '💬', label: 'Messages', badge: String(this.unreadCount()) },
    { id: 'calls', icon: '📞', label: 'Calls', badge: null },
    { id: 'bookmarks', icon: '🔖', label: 'Bookmarks', badge: String(this.bookmarks().length) },
    { id: 'notifications', icon: '🔔', label: 'Notifications', badge: '5' },
    { id: 'designs', icon: '🎨', label: 'Design Lab', badge: null },
    { id: 'profile', icon: '👤', label: 'Profile', badge: null },
  ]);

  readonly activeProfileColor = computed(() =>
    this.profiles.find(p => p.id === this.activeProfile())?.color ?? '#007aff'
  );
  readonly activeProfileHandle = computed(() =>
    this.profiles.find(p => p.id === this.activeProfile())?.handle ?? '@ibrahim'
  );
  readonly activeStats = computed(() => {
    const p = this.activeProfile();
    if (p === 'facebook') return { posts: 142, followers: '2.4K', following: '487' };
    if (p === 'instagram') return { posts: 89, followers: '8.9K', following: '342' };
    if (p === 'twitter') return { posts: 234, followers: '5.1K', following: '218' };
    return { posts: 465, followers: '16.4K', following: '1,047' };
  });

  private seedComments(): DemoComment[] {
    return [
      {
        id: 'cmt1',
        authorName: 'Sara Ahmed', authorHandle: '@sara.dev', authorAvatar: '👩‍💻',
        text: 'This is amazing work! The design combination feature is 🔥',
        createdAt: '2m', likes: 12, liked: false, platform: 'instagram',
        replies: [
          {
            id: 'cmt1-r1',
            authorName: 'Ibrahim Shafiq', authorHandle: '@ibrahim', authorAvatar: '👨‍💻',
            text: 'Thanks Sara! Took a lot of iterations 😅',
            createdAt: '1m', likes: 5, liked: true, platform: 'instagram',
            replies: [
              {
                id: 'cmt1-r1-1',
                authorName: 'Sara Ahmed', authorHandle: '@sara.dev', authorAvatar: '👩‍💻',
                text: 'Worth every minute 👏',
                createdAt: '30s', likes: 3, liked: false, platform: 'instagram',
                replies: [],
              },
            ],
          },
        ],
      },
      {
        id: 'cmt2',
        authorName: 'Omar Khaled', authorHandle: '@omar', authorAvatar: '🧔',
        text: 'Angular Signals + SignalR combo is unbeatable 💪',
        createdAt: '15m', likes: 24, liked: false, platform: 'twitter',
        replies: [
          {
            id: 'cmt2-r1',
            authorName: 'Nour Adel', authorHandle: '@nour', authorAvatar: '👩‍💻',
            text: 'Agreed! Real-time without the pain',
            createdAt: '10m', likes: 8, liked: false, platform: 'twitter',
            replies: [],
          },
        ],
      },
      {
        id: 'cmt3',
        authorName: 'Layla Hassan', authorHandle: '@layla', authorAvatar: '👩‍🎨',
        text: 'The premium design is chef\'s kiss 👨‍🍳💋',
        createdAt: '1h', likes: 47, liked: false, platform: 'facebook',
        replies: [],
      },
    ];
  }

  readonly stories = signal<StoryUser[]>([
    {
      id: 's1', name: 'Sara', handle: '@sara.dev', avatar: '👩‍💻', platform: 'instagram',
      seen: false, live: true,
      items: [
        { id: 's1-1', type: 'image', emoji: '🌅', caption: 'Sunset vibes', duration: 5, views: 1240, gradient: 'linear-gradient(135deg, #ff6b6b, #ffa500)', reactions: [{ emoji: '❤️', count: 342 }, { emoji: '🔥', count: 218 }, { emoji: '😍', count: 156 }] },
        { id: 's1-2', type: 'video', emoji: '🎬', caption: 'Behind the scenes', duration: 8, views: 892, gradient: 'linear-gradient(135deg, #667eea, #764ba2)', reactions: [{ emoji: '👍', count: 187 }, { emoji: '🎉', count: 92 }] },
      ],
    },
    {
      id: 's2', name: 'Ahmed', handle: 'ahmed', avatar: '👨', platform: 'facebook',
      seen: false,
      items: [
        { id: 's2-1', type: 'image', emoji: '⚽', caption: 'Match day!', duration: 5, views: 512, gradient: 'linear-gradient(135deg, #34c759, #00c7be)', reactions: [{ emoji: '👍', count: 98 }] },
      ],
    },
    {
      id: 's3', name: 'Layla', handle: '@layla', avatar: '👩‍🎨', platform: 'instagram',
      seen: false,
      items: [
        { id: 's3-1', type: 'image', emoji: '🎨', caption: 'New artwork drop', duration: 5, views: 2104, gradient: 'linear-gradient(135deg, #ff2d55, #af52de)', reactions: [{ emoji: '😍', count: 847 }, { emoji: '🎨', count: 234 }] },
        { id: 's3-2', type: 'image', emoji: '✨', caption: 'Sketching', duration: 6, views: 1876, gradient: 'linear-gradient(135deg, #ffcc00, #ff9500)', reactions: [{ emoji: '❤️', count: 621 }] },
        { id: 's3-3', type: 'video', emoji: '🎭', caption: 'Time-lapse', duration: 10, views: 1420, gradient: 'linear-gradient(135deg, #af52de, #5856d6)', reactions: [{ emoji: '🔥', count: 412 }] },
      ],
    },
    {
      id: 's4', name: 'Omar', handle: '@omar', avatar: '🧔', platform: 'twitter',
      seen: true,
      items: [
        { id: 's4-1', type: 'image', emoji: '💻', caption: 'Late night coding', duration: 5, views: 892, gradient: 'linear-gradient(135deg, #1d9bf0, #007aff)', reactions: [{ emoji: '💪', count: 187 }] },
      ],
    },
    {
      id: 's5', name: 'Nour', handle: '@nour', avatar: '👩‍💻', platform: 'instagram',
      seen: false, live: true,
      items: [
        { id: 's5-1', type: 'video', emoji: '🎤', caption: 'Live Q&A', duration: 15, views: 3204, gradient: 'linear-gradient(135deg, #ff3b30, #ff2d55)', reactions: [{ emoji: '👏', count: 1247 }, { emoji: '❤️', count: 892 }] },
      ],
    },
  ]);

  readonly posts = signal<DemoPost[]>([
    {
      id: 'p1',
      authorId: 'ME',
      authorName: 'Ibrahim Shafiq',
      authorHandle: '@ibrahim',
      authorAvatar: '👨‍💻',
      platforms: ['facebook', 'instagram', 'twitter'],
      design: 'premium',
      text: 'Excited to share my new project — OmniSocial! A single platform for Facebook, Instagram, and Twitter. Built with Angular + .NET + SignalR for real-time features. 🚀',
      media: '🚀',
      hashtags: ['angular', 'dotnet', 'fullstack', 'signalr'],
      createdAt: '2m ago',
      likes: 342, loves: 187, retweets: 64, shares: 28,
      comments: this.seedComments(),
      liked: true, saved: false, verified: true,
    },
    {
      id: 'p2',
      authorId: 'C-001', authorName: 'Sara Ahmed', authorHandle: '@sara.dev', authorAvatar: '👩‍💻',
      platforms: ['instagram'], design: 'ig',
      text: 'Sunset views from the office today 🌅 #nofilter',
      media: '🌅', hashtags: ['sunset', 'vibes'], createdAt: '15m ago',
      likes: 1240, loves: 892, retweets: 0, shares: 32,
      comments: [
        {
          id: 'p2c1', authorName: 'Nour', authorHandle: '@nour', authorAvatar: '👩‍💻',
          text: 'Breathtaking! 😍', createdAt: '5m', likes: 24, liked: false, platform: 'instagram', replies: []
        },
      ],
      liked: false, saved: true, verified: true,
    },
    {
      id: 'p3',
      authorId: 'C-002', authorName: 'Omar Khaled', authorHandle: '@omar', authorAvatar: '🧔',
      platforms: ['twitter'], design: 'tw',
      text: 'Hot take: Angular signals are the biggest DX improvement in years. Change my mind.',
      media: '', hashtags: ['angular', 'signals'], createdAt: '1h ago',
      likes: 89, loves: 34, retweets: 42, shares: 12,
      comments: [
        {
          id: 'p3c1', authorName: 'Khaled', authorHandle: '@khaled', authorAvatar: '👨‍💼',
          text: 'Signals are great, but NgRx still has its place for complex state.',
          createdAt: '30m', likes: 15, liked: false, platform: 'twitter',
          replies: [
            {
              id: 'p3c1-r1', authorName: 'Omar Khaled', authorHandle: '@omar', authorAvatar: '🧔',
              text: 'Fair point, but for local component state — signals win.',
              createdAt: '20m', likes: 8, liked: false, platform: 'twitter', replies: []
            },
          ]
        },
      ],
      liked: false, saved: false, verified: false,
    },
    {
      id: 'p4',
      authorId: 'C-003', authorName: 'Layla Hassan', authorHandle: '@layla', authorAvatar: '👩‍🎨',
      platforms: ['facebook', 'instagram'], design: 'fb-ig',
      text: 'Just finished redesigning my portfolio! Would love some feedback. Link in bio. ✨',
      media: '🎨', hashtags: ['design', 'portfolio', 'ui'], createdAt: '3h ago',
      likes: 187, loves: 234, retweets: 0, shares: 24,
      comments: [],
      liked: true, saved: false, verified: true,
    },
    {
      id: 'p5',
      authorId: 'C-004', authorName: 'Khaled Sami', authorHandle: '@khaled', authorAvatar: '👨‍💼',
      platforms: ['facebook', 'twitter'], design: 'fb-tw',
      text: 'Sharing my experience migrating a large codebase from class components to signals.',
      media: '📝', hashtags: ['angular', 'migration'], createdAt: '5h ago',
      likes: 145, loves: 67, retweets: 28, shares: 18,
      comments: [],
      liked: false, saved: true, verified: true,
    },
    {
      id: 'p6',
      authorId: 'C-005', authorName: 'Nour Adel', authorHandle: '@nour', authorAvatar: '👩‍💻',
      platforms: ['instagram', 'twitter'], design: 'ig-tw',
      text: 'Late night coding session with a fresh cup of coffee ☕ Nothing beats shipping features at 2 AM.',
      media: '☕', hashtags: ['coding', 'latenight'], createdAt: '8h ago',
      likes: 412, loves: 298, retweets: 54, shares: 22,
      comments: [],
      liked: true, saved: false, verified: false,
    },
  ]);

  readonly bookmarks = computed(() => this.posts().filter(p => p.saved));

  readonly filteredFeed = computed(() => {
    const p = this.activeProfile();
    if (p === 'main') return this.posts();
    return this.posts().filter(post => post.platforms.includes(p));
  });

  readonly conversations = signal<DemoConversation[]>([
    {
      id: 'c1', platform: 'facebook', name: 'Sara Ahmed', handle: 'facebook.com/sara', avatar: '👩',
      online: true, typing: false, unread: 2, lastMessage: 'Did you see the new PR?', lastTime: '2m',
      messages: [
        { id: 'm1', fromMe: false, text: 'Hey Ibrahim! How are you?', time: '10:20' },
        { id: 'm2', fromMe: true, text: 'Hi Sara! Doing great', time: '10:22', seen: true },
        { id: 'm3', fromMe: false, text: 'Did you see the new PR?', time: '10:25' },
      ]
    },
    {
      id: 'c2', platform: 'instagram', name: 'Layla Hassan', handle: '@layla', avatar: '👩‍🎨',
      online: true, typing: true, unread: 0, lastMessage: 'typing…', lastTime: '5m',
      messages: [
        { id: 'm1', fromMe: false, text: 'Your new design looks amazing! 🔥', time: '09:45' },
        { id: 'm2', fromMe: true, text: 'Thanks Layla! 💜', time: '09:48', seen: true },
      ]
    },
    {
      id: 'c3', platform: 'twitter', name: 'Omar Khaled', handle: '@omar', avatar: '🧔',
      online: false, typing: false, unread: 0, lastMessage: 'Check DM', lastTime: '1h',
      messages: [
        { id: 'm1', fromMe: false, text: 'Check DM', time: '09:15' },
      ]
    },
    {
      id: 'c4', platform: 'facebook', name: 'Ahmed Mohamed', handle: 'facebook.com/ahmed', avatar: '👨',
      online: true, typing: false, unread: 5, lastMessage: 'Meeting at 3?', lastTime: '15m',
      messages: [
        { id: 'm1', fromMe: false, text: 'Meeting at 3?', time: '08:30' },
      ]
    },
    {
      id: 'c5', platform: 'instagram', name: 'Nour Adel', handle: '@nour', avatar: '👩‍💻',
      online: true, typing: false, unread: 0, lastMessage: 'Love it ❤️', lastTime: '30m',
      messages: [
        { id: 'm1', fromMe: false, text: 'Love it ❤️', time: '08:00' },
      ]
    },
  ]);

  readonly filteredConversations = computed(() => {
    const f = this.msgPlatformFilter();
    if (f === 'all') return this.conversations();
    return this.conversations().filter(c => c.platform === f);
  });

  readonly unreadCount = computed(() =>
    this.conversations().reduce((sum, c) => sum + c.unread, 0)
  );

  readonly onlineContacts = computed(() => this.conversations().filter(c => c.online));

  readonly calls = signal<DemoCall[]>([
    { id: 'call1', type: 'video', platform: 'instagram', direction: 'incoming', contact: 'Layla Hassan', avatar: '👩‍🎨', duration: '12:34', time: '10:00' },
    { id: 'call2', type: 'voice', platform: 'facebook', direction: 'outgoing', contact: 'Sara Ahmed', avatar: '👩', duration: '5:12', time: '09:30' },
    { id: 'call3', type: 'voice', platform: 'twitter', direction: 'missed', contact: 'Omar Khaled', avatar: '🧔', duration: '—', time: 'Yesterday' },
    { id: 'call4', type: 'video', platform: 'facebook', direction: 'incoming', contact: 'Ahmed Mohamed', avatar: '👨', duration: '8:47', time: 'Yesterday' },
    { id: 'call5', type: 'video', platform: 'instagram', direction: 'outgoing', contact: 'Nour Adel', avatar: '👩‍💻', duration: '22:15', time: '2 days ago' },
  ]);

  readonly incomingCount = computed(() => this.calls().filter(c => c.direction === 'incoming').length);
  readonly outgoingCount = computed(() => this.calls().filter(c => c.direction === 'outgoing').length);
  readonly missedCount = computed(() => this.calls().filter(c => c.direction === 'missed').length);
  readonly totalCallTime = computed(() => {
    const total = this.calls()
      .filter(c => c.duration !== '—')
      .reduce((sum, c) => {
        const [m, s] = c.duration.split(':').map(Number);
        return sum + m + (s / 60);
      }, 0);
    return `${Math.round(total)}m`;
  });

  readonly reels = signal<(Reel & { following?: boolean })[]>([
    {
      id: 'r1', handle: 'ibrahim', avatar: '👨‍💻',
      caption: 'Shipping features at 2 AM 🚀',
      media: '🌌', music: 'Lo-Fi Beats · ChillVibes',
      likes: 1240, commentsCount: 89, shares: 47, saves: 12,
      liked: false, saved: false, progress: 65,
      comments: [
        {
          id: 'rc1', authorName: 'Sara', authorHandle: '@sara', authorAvatar: '👩‍💻',
          text: 'Insane progress! 🔥', createdAt: '2m', likes: 12, liked: false,
          replies: []
        },
      ],
    },
    {
      id: 'r2', handle: 'sara.dev', avatar: '👩‍💻',
      caption: 'Coffee + code = perfect Sunday ☕',
      media: '☕', music: 'Morning Jazz',
      likes: 892, commentsCount: 42, shares: 18, saves: 8,
      liked: true, saved: false, progress: 30,
      comments: [
        {
          id: 'rc2', authorName: 'Omar', authorHandle: '@omar', authorAvatar: '🧔',
          text: 'Relatable 😂', createdAt: '10m', likes: 8, liked: false,
          replies: [
            {
              id: 'rc2-r1', authorName: 'Sara', authorHandle: '@sara', authorAvatar: '👩‍💻',
              text: 'Every single day!', createdAt: '5m', likes: 4, liked: false, replies: []
            },
          ]
        },
      ],
    },
    {
      id: 'r3', handle: 'omar', avatar: '🧔',
      caption: 'Angular signals are 🔥',
      media: '⚡', music: 'Tech Talk',
      likes: 2340, commentsCount: 187, shares: 92, saves: 34,
      liked: false, saved: true, progress: 88,
      comments: [],
    },
    {
      id: 'r4', handle: 'nour', avatar: '👩‍💻',
      caption: 'Design systems are my life',
      media: '🎨', music: 'Creative Flow',
      likes: 542, commentsCount: 34, shares: 12, saves: 5,
      liked: false, saved: false, progress: 15,
      comments: [],
    },
  ]);

  readonly trending = [
    { tag: 'angular22', count: 1240 },
    { tag: 'dotnet9', count: 892 },
    { tag: 'signals', count: 742 },
    { tag: 'omnirun', count: 618 },
    { tag: 'cleancode', count: 534 },
  ];

  readonly notifications = [
    { id: 'n1', icon: '👍', color: '#1d9bf0', title: 'Omar liked your post', body: 'About your Angular signals article', time: '5m', type: 'like', platform: 'twitter' as Platform },
    { id: 'n2', icon: '❤️', color: '#ff2d55', title: 'Layla loved your story', body: 'Your coding setup photo', time: '12m', type: 'love', platform: 'instagram' as Platform },
    { id: 'n3', icon: '💬', color: '#1877f2', title: 'Sara commented', body: '"Great article!"', time: '1h', type: 'comment', platform: 'facebook' as Platform },
    { id: 'n4', icon: '👥', color: '#af52de', title: 'Ahmed started following you', body: 'Mutual: 12 friends', time: '2h', type: 'follow', platform: 'facebook' as Platform },
    { id: 'n5', icon: '🔁', color: '#1d9bf0', title: 'Nour retweeted', body: 'Your thread on signals', time: '3h', type: 'retweet', platform: 'twitter' as Platform },
  ];

  platformIcon(p: Platform | 'main' | string): string {
    return p === 'facebook' ? '📘' : p === 'instagram' ? '📷' : p === 'twitter' ? '🐦' : '◈';
  }

  platformLabel(p: Platform | 'main'): string {
    return p === 'facebook' ? 'Facebook' : p === 'instagram' ? 'Instagram' : p === 'twitter' ? 'Twitter' : 'Main';
  }

  commentAvatarBg(c: DemoComment): string {
    const colors: Record<string, string> = {
      '👩‍💻': 'linear-gradient(135deg, #ff2d55, #ff9500)',
      '👨‍💻': 'linear-gradient(135deg, #1877f2, #1d9bf0)',
      '🧔': 'linear-gradient(135deg, #34c759, #00c7be)',
      '👩‍🎨': 'linear-gradient(135deg, #af52de, #5856d6)',
      '👨‍💼': 'linear-gradient(135deg, #ffcc00, #ff9500)',
    };
    return colors[c.authorAvatar] ?? 'var(--bg-fill-2)';
  }

  commentCount(list: DemoComment[]): number {
    let total = 0;
    const walk = (arr: DemoComment[]): void => {
      for (const c of arr) {
        total += 1;
        walk(c.replies);
      }
    };
    walk(list);
    return total;
  }

  totalStoryViews(s: StoryUser): number {
    return s.items.reduce((sum, i) => sum + i.views, 0);
  }

  reelGradient(r: Reel): string {
    const map: Record<string, string> = {
      r1: 'linear-gradient(135deg, #0a0a2e, #1a1a5e, #2d2d8a)',
      r2: 'linear-gradient(135deg, #2d1810, #5e3010, #8a4818)',
      r3: 'linear-gradient(135deg, #2e0a0a, #5e1a1a, #8a2a2a)',
      r4: 'linear-gradient(135deg, #2e0a2e, #5e1a5e, #8a2a8a)',
    };
    return map[r.id] ?? 'linear-gradient(135deg, #1a1a2e, #16213e)';
  }

  designActions(design: DesignKind): { id: string; icon: string; label: string; }[] {
    switch (design) {
      case 'fb': return [
        { id: 'like', icon: '👍', label: 'Like' },
        { id: 'comment', icon: '💬', label: 'Comment' },
        { id: 'share', icon: '↗', label: 'Share' },
        { id: 'save', icon: '🔖', label: 'Save' },
      ];
      case 'ig': return [
        { id: 'like', icon: '❤️', label: 'Like' },
        { id: 'comment', icon: '💬', label: 'Comment' },
        { id: 'share', icon: '➤', label: 'Share' },
        { id: 'save', icon: '🔖', label: 'Save' },
      ];
      case 'tw': return [
        { id: 'reply', icon: '💬', label: 'Reply' },
        { id: 'retweet', icon: '🔁', label: 'Retweet' },
        { id: 'like', icon: '❤️', label: 'Like' },
        { id: 'share', icon: '↗', label: 'Share' },
      ];
      case 'fb-ig': return [
        { id: 'like', icon: '👍', label: 'Like' },
        { id: 'love', icon: '❤️', label: 'Love' },
        { id: 'comment', icon: '💬', label: 'Comment' },
        { id: 'save', icon: '🔖', label: 'Save' },
      ];
      case 'fb-tw': return [
        { id: 'like', icon: '👍', label: 'Like' },
        { id: 'reply', icon: '💬', label: 'Reply' },
        { id: 'retweet', icon: '🔁', label: 'Retweet' },
        { id: 'share', icon: '↗', label: 'Share' },
      ];
      case 'ig-tw': return [
        { id: 'heart', icon: '❤️', label: 'Love' },
        { id: 'reply', icon: '💬', label: 'Reply' },
        { id: 'retweet', icon: '🔁', label: 'Repost' },
        { id: 'share', icon: '➤', label: 'Share' },
      ];
      case 'premium': return [
        { id: 'like', icon: '👍', label: 'Like' },
        { id: 'love', icon: '❤️', label: 'Love' },
        { id: 'reply', icon: '💬', label: 'Reply' },
        { id: 'retweet', icon: '🔁', label: 'Repost' },
      ];
    }
  }

  readonly currentDesignMeta = computed(() => {
    const d = this.previewDesign();
    const map: Record<DesignKind, any> = {
      'fb': { title: 'Facebook Design', description: 'Wide cards, blue accent, reactions bar.', features: ['Reactions', 'Comments', 'Shares'] },
      'ig': { title: 'Instagram Design', description: 'Clean, image-first, gradient ring.', features: ['Image-first', 'Gradient ring', 'Minimal'] },
      'tw': { title: 'Twitter Design', description: 'Text-focused, 280-char cards.', features: ['280 chars', 'Retweet', 'Reply'] },
      'fb-ig': { title: 'Facebook + Instagram', description: 'Wide card with hero image + split actions.', features: ['Wide + Hero', 'Split actions'] },
      'fb-tw': { title: 'Facebook + Twitter', description: 'Text-heavy with FB chrome + TW actions.', features: ['Text-first', 'FB chrome', 'TW actions'] },
      'ig-tw': { title: 'Instagram + Twitter', description: 'Rounded card with gradient CTA bar.', features: ['Rounded', 'Gradient CTA'] },
      'premium': { title: '⚡ Premium Unified', description: 'All 3 platforms merged — gradient border.', features: ['Gradient border', 'All reactions', 'Cross-platform'] },
    };
    return map[d];
  });

  readonly composerDesign = computed<DesignKind>(() => {
    const ps = this.composerPlatforms().slice().sort();
    if (ps.length === 3) return 'premium';
    if (ps.length === 1) return ps[0] === 'facebook' ? 'fb' : ps[0] === 'instagram' ? 'ig' : 'tw';
    if (ps.includes('facebook') && ps.includes('instagram')) return 'fb-ig';
    if (ps.includes('facebook') && ps.includes('twitter')) return 'fb-tw';
    if (ps.includes('instagram') && ps.includes('twitter')) return 'ig-tw';
    return 'fb';
  });

  readonly composerDesignLabel = computed(() =>
    this.currentDesignMeta().title
  );

  readonly currentStoryItem = computed<StoryItem | undefined>(() => {
    const sv = this.storyViewerOpen();
    if (!sv) return undefined;
    return sv.items[this.svItemIndex()];
  });

  switchProfile(p: ProfileTab): void {
    this.activeProfile.set(p);
  }

  openStoryViewer(id: string): void {
    const s = this.stories().find(x => x.id === id);
    if (!s) return;
    this.storyViewerOpen.set(s);
    this.svItemIndex.set(0);
    this.svProgress.set(0);
    this.startStoryTimer();
  }

  closeStoryViewer(): void {
    this.clearStoryTimer();
    this.storyViewerOpen.set(null);
  }

  storyTap(ev: MouseEvent, sv: StoryUser): void {
    const target = ev.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    if (x < rect.width / 2) {
      this.prevStoryItem(sv);
    } else {
      this.nextStoryItem(sv);
    }
  }

  nextStoryItem(sv: StoryUser): void {
    const next = this.svItemIndex() + 1;
    if (next >= sv.items.length) {
      this.closeStoryViewer();
    } else {
      this.svItemIndex.set(next);
      this.svProgress.set(0);
      this.startStoryTimer();
    }
  }

  prevStoryItem(sv: StoryUser): void {
    const prev = this.svItemIndex() - 1;
    if (prev < 0) {
      this.svItemIndex.set(0);
      this.svProgress.set(0);
      this.startStoryTimer();
    } else {
      this.svItemIndex.set(prev);
      this.svProgress.set(0);
      this.startStoryTimer();
    }
  }

  reactToStory(emoji: string): void {
    this.toast.success(`Reacted ${emoji}`, '');
  }

  sendStoryReply(): void {
    const text = this.storyReplyText().trim();
    if (!text) return;
    this.toast.success('Reply sent', text);
    this.storyReplyText.set('');
  }

  private startStoryTimer(): void {
    this.clearStoryTimer();
    const sv = this.storyViewerOpen();
    const item = this.currentStoryItem();
    if (!sv || !item) return;

    const totalMs = item.duration * 1000;
    const startTime = Date.now();

    this.storyTimer = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / totalMs) * 100);
      this.svProgress.set(pct);

      if (pct >= 100) {
        this.nextStoryItem(sv);
      }
    }, 50);
  }

  private clearStoryTimer(): void {
    if (this.storyTimer !== null) {
      window.clearInterval(this.storyTimer);
      this.storyTimer = null;
    }
  }

  openPostDetail(p: DemoPost): void {
    this.postDetailOpen.set({ ...p });
  }

  closePostDetail(): void {
    this.postDetailOpen.set(null);
    this.commentText.set('');
    this.replyText.set('');
    this.replyingToId.set(null);
  }

  submitComment(p: DemoPost): void {
    const text = this.commentText().trim();
    if (!text) return;

    const newComment: DemoComment = {
      id: `cmt-${Date.now()}`,
      authorName: 'Ibrahim Shafiq',
      authorHandle: '@ibrahim',
      authorAvatar: '👨‍💻',
      text,
      createdAt: 'just now',
      likes: 0,
      liked: false,
      platform: p.platforms[0],
      replies: [],
    };

    this.posts.update(list => list.map(x =>
      x.id === p.id ? { ...x, comments: [newComment, ...x.comments] } : x
    ));

    this.postDetailOpen.update(cur =>
      cur && cur.id === p.id
        ? { ...cur, comments: [newComment, ...cur.comments] }
        : cur
    );

    this.commentText.set('');
    this.toast.success('Comment posted', '');
  }

  toggleReplyBox(commentId: string): void {
    this.replyingToId.update(id => id === commentId ? null : commentId);
    this.replyText.set('');
  }

  submitReply(parent: DemoComment): void {
    const text = this.replyText().trim();
    if (!text) return;

    const newReply: DemoComment = {
      id: `r-${Date.now()}`,
      authorName: 'Ibrahim Shafiq',
      authorHandle: '@ibrahim',
      authorAvatar: '👨‍💻',
      text,
      createdAt: 'just now',
      likes: 0,
      liked: false,
      replies: [],
    };

    const addReply = (list: DemoComment[]): DemoComment[] =>
      list.map(c =>
        c.id === parent.id
          ? { ...c, replies: [...c.replies, newReply], showReplies: true }
          : { ...c, replies: addReply(c.replies) }
      );

    const post = this.postDetailOpen();
    if (post) {
      this.posts.update(list => list.map(x =>
        x.id === post.id ? { ...x, comments: addReply(x.comments) } : x
      ));
      this.postDetailOpen.update(cur =>
        cur && cur.id === post.id
          ? { ...cur, comments: addReply(cur.comments) }
          : cur
      );
    }

    this.replyText.set('');
    this.replyingToId.set(null);
    this.toast.success('Reply posted', '');
  }

  toggleReplies(commentId: string): void {
    const toggle = (list: DemoComment[]): DemoComment[] =>
      list.map(c =>
        c.id === commentId
          ? { ...c, showReplies: !c.showReplies }
          : { ...c, replies: toggle(c.replies) }
      );

    const post = this.postDetailOpen();
    if (post) {
      this.postDetailOpen.update(cur =>
        cur && cur.id === post.id
          ? { ...cur, comments: toggle(cur.comments) }
          : cur
      );
      this.posts.update(list => list.map(x =>
        x.id === post.id ? { ...x, comments: toggle(x.comments) } : x
      ));
    }

    const reel = this.reelCommentsOpen();
    if (reel) {
      this.reelCommentsOpen.update(cur =>
        cur && cur.id === reel.id
          ? { ...cur, comments: toggle(cur.comments) }
          : cur
      );
    }
  }

  likeComment(c: DemoComment): void {
    const update = (list: DemoComment[]): DemoComment[] =>
      list.map(x =>
        x.id === c.id
          ? { ...x, liked: !x.liked, likes: x.liked ? x.likes - 1 : x.likes + 1 }
          : { ...x, replies: update(x.replies) }
      );

    this.posts.update(list => list.map(p => ({ ...p, comments: update(p.comments) })));
    this.postDetailOpen.update(cur =>
      cur ? { ...cur, comments: update(cur.comments) } : cur
    );
    this.reelCommentsOpen.update(cur =>
      cur ? { ...cur, comments: update(cur.comments) } : cur
    );
  }

  openReelComments(r: Reel): void {
    this.reelCommentsOpen.set(r);
  }

  closeReelComments(): void {
    this.reelCommentsOpen.set(null);
    this.reelCommentText.set('');
  }

  submitReelComment(r: Reel): void {
    const text = this.reelCommentText().trim();
    if (!text) return;

    const newComment: DemoComment = {
      id: `rc-${Date.now()}`,
      authorName: 'Ibrahim Shafiq',
      authorHandle: '@ibrahim',
      authorAvatar: '👨‍💻',
      text,
      createdAt: 'just now',
      likes: 0,
      liked: false,
      replies: [],
    };

    this.reels.update(list => list.map(x =>
      x.id === r.id
        ? { ...x, comments: [newComment, ...x.comments], commentsCount: x.commentsCount + 1 }
        : x
    ));

    this.reelCommentsOpen.update(cur =>
      cur && cur.id === r.id
        ? { ...cur, comments: [newComment, ...cur.comments], commentsCount: cur.commentsCount + 1 }
        : cur
    );

    this.reelCommentText.set('');
    this.toast.success('Comment posted', '');
  }

  toggleReelLike(id: string): void {
    this.reels.update(list => list.map(r =>
      r.id === id ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 } : r
    ));
  }

  toggleReelSave(id: string): void {
    this.reels.update(list => list.map(r =>
      r.id === id ? { ...r, saved: !r.saved } : r
    ));
  }

  toggleFollowReel(id: string): void {
    this.reels.update(list => list.map(r =>
      r.id === id ? { ...r, following: true } : r
    ));
    this.toast.success('Followed', '');
  }

  doubleTapLike(r: Reel): void {
    if (!r.liked) this.toggleReelLike(r.id);
    this.doubleTapHeart.set(r.id);
    setTimeout(() => this.doubleTapHeart.set(null), 800);
  }

  toggleLike(id: string): void {
    this.posts.update(list => list.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
    this.postDetailOpen.update(cur =>
      cur && cur.id === id
        ? { ...cur, liked: !cur.liked, likes: cur.liked ? cur.likes - 1 : cur.likes + 1 }
        : cur
    );
  }

  toggleSave(id: string): void {
    this.posts.update(list => list.map(p =>
      p.id === id ? { ...p, saved: !p.saved } : p
    ));
    this.postDetailOpen.update(cur =>
      cur && cur.id === id ? { ...cur, saved: !cur.saved } : cur
    );
    const p = this.posts().find(x => x.id === id);
    if (p) this.toast.success(p.saved ? 'Saved' : 'Removed', p.id);
  }

  openComposer(): void {
    this.composerText.set('');
    this.composerPlatforms.set([
      this.activeProfile() === 'main' ? 'facebook' : (this.activeProfile() as Platform),
    ]);
    this.composerOpen.set(true);
  }

  toggleComposerPlatform(p: Platform): void {
    this.composerPlatforms.update(list =>
      list.includes(p) ? list.filter(x => x !== p) : [...list, p]
    );
  }

  publishPost(): void {
    if (!this.composerText().trim() || !this.composerPlatforms().length) return;

    const platforms = this.composerPlatforms();
    const design = this.composerDesign();
    const newPost: DemoPost = {
      id: `p-${Date.now()}`,
      authorId: 'ME',
      authorName: 'Ibrahim Shafiq',
      authorHandle: '@ibrahim',
      authorAvatar: '👨‍💻',
      platforms,
      design,
      text: this.composerText(),
      media: '✨',
      hashtags: ['omnirun', 'newpost'],
      createdAt: 'just now',
      likes: 0, loves: 0, retweets: 0, shares: 0,
      comments: [],
      liked: false, saved: false, verified: true,
    };

    this.posts.update(list => [newPost, ...list]);
    this.composerOpen.set(false);
    this.toast.success('Post published!', `To ${platforms.length} platform(s) · ${this.composerDesignLabel()}`, '🚀');
  }

  selectConvo(id: string): void {
    const c = this.conversations().find(x => x.id === id);
    if (c) {
      this.activeConvo.set(c);
      this.conversations.update(list => list.map(x => x.id === id ? { ...x, unread: 0 } : x));
    }
  }

  sendMessage(): void {
    const text = this.messageInput().trim();
    const c = this.activeConvo();
    if (!text || !c) return;

    this.conversations.update(list => list.map(conv =>
      conv.id === c.id
        ? {
          ...conv,
          messages: [...conv.messages, {
            id: `m${Date.now()}`, fromMe: true, text,
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            seen: false,
          }],
          lastMessage: text,
          lastTime: 'now',
        }
        : conv
    ));

    const updated = this.conversations().find(x => x.id === c.id);
    if (updated) this.activeConvo.set(updated);

    this.messageInput.set('');
  }

  startCall(convoId: string, type: 'voice' | 'video'): void {
    const c = this.conversations().find(x => x.id === convoId);
    const call = this.calls().find(x => x.id === convoId);
    const name = c?.name ?? call?.contact ?? 'Unknown';
    const avatar = c?.avatar ?? call?.avatar ?? '👤';
    const platform = (c?.platform ?? call?.platform ?? 'main') as Platform | 'main';

    this.callState.set({ id: convoId, type, platform, contact: name, avatar, status: 'Calling…' });

    setTimeout(() => {
      this.callState.update(s => s ? { ...s, status: 'Connected' } : null);
    }, 1500);
  }

  endCall(): void {
    this.callState.set(null);
    this.toast.info('Call ended', '');
  }

  openPostMenu(ev: MouseEvent, post: DemoPost): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.menu.open(ev.clientX, ev.clientY, [
      { id: 'view', label: 'View post', icon: '👁', action: () => this.openPostDetail(post) },
      { id: 'save', label: post.saved ? 'Remove bookmark' : 'Save post', icon: '🔖', action: () => this.toggleSave(post.id) },
      { id: 'share', label: 'Share', icon: '↗', action: () => this.toast.success('Link copied') },
      { id: 'sep', label: '', separatorBefore: true },
      { id: 'hide', label: 'Hide post', icon: '🚫', action: () => this.toast.info('Hidden', post.id) },
      { id: 'report', label: 'Report', icon: '⚠️', danger: true, action: () => this.toast.warning('Reported') },
    ]);
  }

  ngOnDestroy(): void {
    this.clearStoryTimer();
  }
}