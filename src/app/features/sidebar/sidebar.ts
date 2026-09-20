import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LayoutService } from '../../core/services/layout.service';
import { CompaniesPanelComponent } from './panels/companies-panel/companies-panel';
import { ContactPanelComponent } from './panels/contact-panel/contact-panel';
import { ProjectsPanelComponent } from './panels/projects-panel/projects-panel';
import { SearchPanelComponent } from './panels/search-panel/search-panel';
import { SkillsPanelComponent } from './panels/skills-panel/skills-panel';
import { ThemesPanelComponent } from './panels/themes-panel/themes-panel';
import { ExplorerPanel } from './panels/explorer-panel/explorer-panel';
import { DotnetPanelComponent } from './panels/dotnet-panel/dotnet-panel/dotnet-panel';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    ExplorerPanel,
    SearchPanelComponent,
    CompaniesPanelComponent,
    ProjectsPanelComponent,
    SkillsPanelComponent,
    ThemesPanelComponent,
    ContactPanelComponent,
    DotnetPanelComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-ctx]': '"sidebar"' },
  template: `
    <aside class="sidebar">
      @switch (layout.sidebarPanel()) {
        @case ('explorer')  { <app-explorer-panel /> }
        @case ('search')    { <app-search-panel /> }
        @case ('dotnet')    { <app-dotnet-panel /> }
        @case ('companies') { <app-companies-panel /> }
        @case ('projects')  { <app-projects-panel /> }
        @case ('skills')    { <app-skills-panel /> }
        @case ('themes')    { <app-themes-panel /> }
        @case ('contact')   { <app-contact-panel /> }
      }
    </aside>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: hidden; }
    .sidebar {
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      background: var(--bg-sidebar);
      backdrop-filter: var(--blur-regular);
      -webkit-backdrop-filter: var(--blur-regular);
      border-right: 0.5px solid var(--separator);
    }
  `],
})
export class SidebarComponent {
  readonly layout = inject(LayoutService);
}