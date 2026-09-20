import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '../../../../core/services/theme.service';
import { AccentColor, ThemeId } from '../../../../core/models/theme.model';
import { PanelHeaderComponent } from '../panel-header/panel-header';

@Component({
  selector: 'app-themes-panel',
  standalone: true,
  imports: [PanelHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-panel-header eyebrow="Appearance" title="Themes" />

    <section class="block">
      <div class="block-label">Color Scheme</div>
      <div class="themes">
        @for (t of theme.themes; track t.id) {
          <button
            class="theme-item"
            [class.active]="theme.themeId() === t.id"
            (click)="theme.setTheme(t.id)"
          >
            <span class="preview" [style.background]="t.preview.bg">
              <span class="preview-accent" [style.background]="t.preview.accent"></span>
              <span class="preview-line" [style.background]="t.preview.fg"></span>
              <span class="preview-line short" [style.background]="t.preview.fg"></span>
            </span>
            <div class="theme-info">
              <b>{{ t.label }}</b>
              <small>{{ t.kind === 'dark' ? '🌙 Dark' : '☀️ Light' }}</small>
            </div>
            @if (theme.themeId() === t.id) {
              <svg class="check" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 8 3.5 3.5L13 5" />
              </svg>
            }
          </button>
        }
      </div>
    </section>

    <section class="block">
      <div class="block-label">Accent Color</div>
      <div class="swatches">
        @for (a of theme.accents; track a.id) {
          <button
            class="swatch"
            [class.active]="theme.accent() === a.id"
            [style.background]="a.swatch"
            (click)="theme.setAccent(a.id)"
            [attr.aria-label]="a.label"
            [title]="a.label"
          >
            @if (theme.accent() === a.id) {
              <svg viewBox="0 0 14 14" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 7 3 3 5-6" />
              </svg>
            }
          </button>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; padding-bottom: 24px; }

    .block { padding: 0 16px 20px; }
    .block-label {
      font-size: var(--fs-2xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--label-3);
      margin-bottom: 10px;
      padding-left: 2px;
    }

    .themes { display: flex; flex-direction: column; gap: 6px; }
    .theme-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-sm);
      text-align: left;
      transition: all var(--t-fast) var(--ease-smooth);
    }
    .theme-item:hover { border-color: var(--accent); }
    .theme-item.active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }

    .preview {
      width: 40px;
      height: 34px;
      border-radius: var(--r-xs);
      padding: 6px 5px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
    }
    .preview-accent { width: 12px; height: 3px; border-radius: 2px; }
    .preview-line { height: 2px; border-radius: 2px; opacity: 0.6; }
    .preview-line.short { width: 60%; }

    .theme-info { flex: 1; }
    .theme-info b { font-size: var(--fs-sm); font-weight: 600; display: block; }
    .theme-info small { font-size: var(--fs-2xs); color: var(--label-2); }
    .check { width: 16px; height: 16px; flex-shrink: 0; }

    .swatches {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      padding: 4px;
    }
    .swatch {
      aspect-ratio: 1;
      border-radius: 50%;
      display: grid;
      place-items: center;
      box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.08) inset, 0 2px 6px rgba(0, 0, 0, 0.12);
      transition: transform var(--t-base) var(--ease-spring), box-shadow var(--t-fast);
    }
    .swatch:hover { transform: scale(1.08); }
    .swatch.active {
      box-shadow: 0 0 0 2px var(--bg-surface-solid), 0 0 0 3.5px var(--accent);
    }
    .swatch svg { width: 14px; height: 14px; }
  `],
})
export class ThemesPanelComponent {
  readonly theme = inject(ThemeService);
}