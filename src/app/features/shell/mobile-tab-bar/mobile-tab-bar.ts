import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommandPaletteService } from '../../../core/services/command-palette.service';
import { LayoutService } from '../../../core/services/layout.service';
import { TabsService } from '../../../core/services/tabs.service';

interface MobileTab {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  action: () => void;
}

@Component({
  selector: 'app-mobile-tab-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="tab-bar">
      @for (tab of mobileTabs(); track tab.id) {
        <button
          class="tab-btn"
          [class.active]="isActive(tab.id)"
          (click)="tab.action()"
          [attr.aria-label]="tab.label"
        >
          <span class="tab-icon-wrap">
            <span class="tab-icon">{{ tab.icon }}</span>
            @if (tab.badge) {
              <span class="tab-badge">{{ tab.badge }}</span>
            }
          </span>
          <span class="tab-label">{{ tab.label }}</span>
          <span class="tab-indicator"></span>
        </button>
      }
    </nav>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 300;
      padding-bottom: env(safe-area-inset-bottom, 0);
    }

    .tab-bar {
      height: 64px;
      background: var(--bg-elevated);
      backdrop-filter: blur(40px) saturate(180%);
      -webkit-backdrop-filter: blur(40px) saturate(180%);
      border-top: 0.5px solid var(--separator);
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      align-items: center;
      padding: 0 4px;
      box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.15);
    }

    .tab-btn {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      height: 100%;
      background: transparent;
      border: 0;
      color: var(--label-2);
      cursor: pointer;
      transition: color 180ms ease;
      padding: 6px 0;
      -webkit-tap-highlight-color: transparent;
      overflow: hidden;
    }

    .tab-btn.active {
      color: var(--accent);
    }

    .tab-icon-wrap {
      position: relative;
      display: grid;
      place-items: center;
      height: 26px;
      width: 26px;
    }

    .tab-icon {
      font-size: 20px;
      line-height: 1;
      transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .tab-btn:active .tab-icon {
      transform: scale(0.85);
    }

    .tab-btn.active .tab-icon {
      transform: translateY(-1px);
    }

    .tab-badge {
      position: absolute;
      top: -2px;
      right: -6px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      background: #ff3b30;
      color: #fff;
      border-radius: 8px;
      font-size: 9px;
      font-weight: 800;
      display: grid;
      place-items: center;
      border: 2px solid var(--bg-elevated);
    }

    .tab-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }

    .tab-indicator {
      position: absolute;
      bottom: 2px;
      left: 50%;
      transform: translateX(-50%) scaleX(0);
      width: 20px;
      height: 3px;
      background: var(--accent);
      border-radius: 3px 3px 0 0;
      transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .tab-btn.active .tab-indicator {
      transform: translateX(-50%) scaleX(1);
    }
  `],
})
export class MobileTabBarComponent {
  readonly layout = inject(LayoutService);
  private tabsService = inject(TabsService);
  private palette = inject(CommandPaletteService);

  readonly mobileTabs = computed<MobileTab[]>(() => [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      action: () => {
        this.layout.closeSidebar();
        this.tabsService.setActive('welcome');
      },
    },
    {
      id: 'explorer',
      label: 'Files',
      icon: '📁',
      action: () => this.layout.toggleSidebar('explorer'),
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: '🧩',
      action: () => this.layout.toggleSidebar('projects'),
    },
    {
      id: 'palette',
      label: 'Command',
      icon: '⌘',
      action: () => this.palette.toggle(),
    },
    {
      id: 'contact',
      label: 'Me',
      icon: '👤',
      action: () => this.layout.toggleSidebar('contact'),
    },
  ]);

  isActive(id: string): boolean {
    if (id === 'palette') return this.palette.open();

    if (id === 'home') {
      return this.tabsService.activeId() === 'welcome' && !this.layout.mobileSidebarOpen();
    }

    if (id === 'explorer' || id === 'projects' || id === 'contact') {
      return this.layout.mobileSidebarOpen() && this.layout.sidebarPanel() === id;
    }

    return false;
  }
}