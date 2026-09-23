import {
  ChangeDetectionStrategy, Component, HostListener,
  inject, signal,
} from '@angular/core';
import { LayoutService } from '../../../core/services/layout.service';
import { SidebarComponent } from '../../sidebar/sidebar';

@Component({
  selector: 'app-mobile-sheet',
  standalone: true,
  imports: [SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sheet-backdrop" (click)="close()"></div>

    <div
      class="sheet"
      [style.transform]="'translateY(' + dragY() + 'px)'"
      [class.dragging]="dragging()"
      (touchstart)="onTouchStart($event)"
      (touchmove)="onTouchMove($event)"
      (touchend)="onTouchEnd()"
    >
      <div class="sheet-handle">
        <span class="handle-bar"></span>
      </div>

      <div class="sheet-header">
        <span class="sheet-title">
          @switch (layout.sidebarPanel()) {
            @case ('explorer')  { Explorer }
            @case ('search')    { Search }
            @case ('companies') { Companies }
            @case ('projects')  { Projects }
            @case ('skills')    { Skills }
            @case ('themes')    { Themes }
            @case ('contact')   { Contact }
          }
        </span>
        <button class="sheet-close" (click)="close()" aria-label="Close">✕</button>
      </div>

      <div class="sheet-body">
        <app-sidebar />
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 290;
      pointer-events: none;
    }

    .sheet-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      pointer-events: auto;
      animation: fadeIn 220ms ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .sheet {
      position: absolute;
      left: 0; right: 0; bottom: 0;
      height: 88vh;
      max-height: 88vh;
      background: var(--bg-elevated);
      backdrop-filter: blur(40px) saturate(180%);
      -webkit-backdrop-filter: blur(40px) saturate(180%);
      border-top-left-radius: 24px;
      border-top-right-radius: 24px;
      border-top: 0.5px solid var(--separator);
      box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.3);
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      animation: sheetUp 340ms cubic-bezier(0.34, 1.56, 0.64, 1);
      transition: transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
      overflow: hidden;
      will-change: transform;
    }

    .sheet.dragging {
      transition: none;
    }

    @keyframes sheetUp {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }

    .sheet-handle {
      display: flex;
      justify-content: center;
      padding: 10px 0 6px;
      flex-shrink: 0;
      cursor: grab;
      touch-action: none;
    }

    .handle-bar {
      width: 40px;
      height: 5px;
      background: var(--label-3);
      border-radius: 999px;
      opacity: 0.5;
    }

    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 20px 12px;
      border-bottom: 0.5px solid var(--separator);
      flex-shrink: 0;
    }

    .sheet-title {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--label);
    }

    .sheet-close {
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--bg-fill-2);
      color: var(--label-2);
      font-size: 14px;
      border: 0;
      cursor: pointer;
      transition: background 120ms ease;
    }

    .sheet-close:active {
      background: var(--bg-fill-3);
      transform: scale(0.92);
    }

    .sheet-body {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }
  `],
})
export class MobileSheetComponent {
  readonly layout = inject(LayoutService);
  readonly dragY = signal(0);
  readonly dragging = signal(false);

  private startY = 0;
  private currentY = 0;

  onTouchStart(ev: TouchEvent): void {
    const target = ev.target as HTMLElement;
    const isHandle = target.closest('.sheet-handle');
    if (!isHandle && this.layout.mobileSheetDragY() === 0) return;

    this.startY = ev.touches[0].clientY;
    this.dragging.set(true);
  }

  onTouchMove(ev: TouchEvent): void {
    if (!this.dragging()) return;
    this.currentY = ev.touches[0].clientY;
    const delta = Math.max(0, this.currentY - this.startY);
    this.dragY.set(delta);
  }

  onTouchEnd(): void {
    if (!this.dragging()) return;
    const delta = this.dragY();
    this.dragging.set(false);

    if (delta > 120) {
      this.close();
    } else {
      this.dragY.set(0);
    }
  }

  close(): void {
    this.dragY.set(0);
    this.layout.mobileSidebarOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.close();
  }
}