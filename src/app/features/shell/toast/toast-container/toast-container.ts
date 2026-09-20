import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-stack">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [attr.data-k]="t.kind" (click)="toast.dismiss(t.id)">
          <span class="toast-icon">{{ t.icon }}</span>
          <div class="toast-body">
            <b>{{ t.title }}</b>
            @if (t.message) { <small>{{ t.message }}</small> }
            @if (t.action) {
              <button class="toast-action"
                      (click)="$event.stopPropagation(); t.action!.run(); toast.dismiss(t.id)">
                {{ t.action.label }}
              </button>
            }
          </div>
          <button class="toast-close" (click)="$event.stopPropagation(); toast.dismiss(t.id)">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      bottom: 44px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 9999;
      pointer-events: none;
      max-width: 380px;
    }
    .toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      background: var(--bg-elevated);
      backdrop-filter: var(--blur-thick);
      -webkit-backdrop-filter: var(--blur-thick);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
      box-shadow: var(--shadow-lg);
      cursor: pointer;
      animation: toastIn 320ms var(--ease-spring);
      transition: transform 200ms var(--ease-smooth);
    }
    .toast:hover { transform: translateX(-2px); }
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(40px) scale(0.95); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }
    .toast-icon {
      width: 26px; height: 26px;
      display: grid; place-items: center;
      border-radius: 50%;
      font-size: 13px;
      font-weight: 800;
      color: #fff;
      flex-shrink: 0;
    }
    .toast[data-k='success'] .toast-icon { background: #34c759; }
    .toast[data-k='error']   .toast-icon { background: #ff3b30; }
    .toast[data-k='info']    .toast-icon { background: var(--accent); }
    .toast[data-k='warning'] .toast-icon { background: #ff9500; }
    .toast[data-k='success'] { border-left: 3px solid #34c759; }
    .toast[data-k='error']   { border-left: 3px solid #ff3b30; }
    .toast[data-k='info']    { border-left: 3px solid var(--accent); }
    .toast[data-k='warning'] { border-left: 3px solid #ff9500; }
    .toast-body { flex: 1; min-width: 0; }
    .toast-body b { font-size: var(--fs-sm); font-weight: 700; display: block; }
    .toast-body small { font-size: var(--fs-2xs); color: var(--label-2); display: block;
                        margin-top: 2px; line-height: 1.4; }
    .toast-action {
      margin-top: 8px;
      padding: 4px 10px;
      background: var(--bg-fill-2);
      color: var(--label);
      border-radius: var(--r-pill);
      font-size: 10px;
      font-weight: 700;
    }
    .toast-action:hover { background: var(--bg-fill-3); }
    .toast-close {
      width: 22px; height: 22px;
      display: grid; place-items: center;
      border-radius: var(--r-xs);
      color: var(--label-3);
      font-size: 10px;
      flex-shrink: 0;
    }
    .toast-close:hover { background: var(--bg-hover); color: var(--label); }
  `],
})
export class ToastContainerComponent {
  readonly toast = inject(ToastService);
}