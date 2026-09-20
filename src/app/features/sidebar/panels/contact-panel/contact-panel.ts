import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProjectsService } from '../../../../core/services/projects.service';
import { PanelHeaderComponent } from '../panel-header/panel-header';

@Component({
  selector: 'app-contact-panel',
  standalone: true,
  imports: [PanelHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-panel-header eyebrow="Get in touch" title="Contact" />

    <div class="card">
      <div class="avatar">IS</div>
      <h3>{{ c.name }}</h3>
      <p class="role">{{ c.title }}</p>
      <p class="loc">📍 {{ c.location }}</p>

      <div class="links">
        <a [href]="'mailto:' + c.email" class="link">
          <span class="ico">✉️</span>
          <div class="l-info"><b>Email</b><span>{{ c.email }}</span></div>
        </a>
        <a [href]="'tel:' + c.phone.replace(' ', '')" class="link">
          <span class="ico">📞</span>
          <div class="l-info"><b>Phone</b><span>{{ c.phone }}</span></div>
        </a>
        <a [href]="'https://' + c.linkedin" target="_blank" rel="noopener" class="link">
          <span class="ico">💼</span>
          <div class="l-info"><b>LinkedIn</b><span>{{ c.linkedin }}</span></div>
        </a>
        <a [href]="'https://' + c.github" target="_blank" rel="noopener" class="link">
          <span class="ico">🐙</span>
          <div class="l-info"><b>GitHub</b><span>{{ c.github }}</span></div>
        </a>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .card {
      margin: 0 12px 24px;
      padding: 20px;
      background: var(--bg-surface-solid);
      border: 0.5px solid var(--separator);
      border-radius: var(--r-md);
    }
    .avatar {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: var(--accent);
      display: grid; place-items: center;
      color: var(--accent-contrast);
      font-weight: 800;
      font-size: 22px;
      letter-spacing: 0.02em;
      margin-bottom: 14px;
      box-shadow: 0 8px 24px var(--accent-soft);
    }
    h3 { font-size: var(--fs-md); font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px; }
    .role { font-size: var(--fs-xs); color: var(--accent); font-weight: 600; margin-bottom: 3px; }
    .loc { font-size: var(--fs-2xs); color: var(--label-2); margin-bottom: 18px; }

    .links { display: flex; flex-direction: column; gap: 6px; }
    .link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: var(--bg-fill-2);
      border-radius: var(--r-sm);
      text-decoration: none;
      color: var(--label);
      transition: all var(--t-fast) var(--ease-smooth);
      overflow: hidden;
    }
    .link:hover { background: var(--accent-soft); }
    .link:hover .l-info span { color: var(--accent); }
    .ico { font-size: 16px; flex-shrink: 0; }
    .l-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
    .l-info b { font-size: var(--fs-2xs); text-transform: uppercase; letter-spacing: 0.06em; color: var(--label-3); font-weight: 600; }
    .l-info span { font-size: var(--fs-xs); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--label); transition: color var(--t-fast); }
  `],
})
export class ContactPanelComponent {
  private svc = inject(ProjectsService);
  readonly c = this.svc.contact;
}