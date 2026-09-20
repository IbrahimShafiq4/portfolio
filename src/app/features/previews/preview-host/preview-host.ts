import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DemoKind } from '../../../core/models/project.model';
import { AfkarPreviewComponent } from '../projects/afkar-preview/afkar-preview';
import { AlMotafiqPreviewComponent } from '../projects/almotafiq-preview/almotafiq-preview';
import { ArRoomPreviewComponent } from '../projects/ar-room-preview/ar-room-preview';
import { AzAccountingPreviewComponent } from '../projects/az-accounting-preview/az-accounting-preview';
import { BoxShadowPreviewComponent } from '../projects/boxshadow-preview/boxshadow-preview';
import { BusinessStepPreviewComponent } from '../projects/business-step-preview/business-step-preview';
import { BwtPreviewComponent } from '../projects/bwt-preview/bwt-preview';
import { EnlistedPreviewComponent } from '../projects/enlisted-preview/enlisted-preview';
import { EnnwyPreviewComponent } from '../projects/ennwy-preview/ennwy-preview';
import { FoodyPreviewComponent } from '../projects/foody-preview/foody-preview';
import { HotelPreviewComponent } from '../projects/hotel-preview/hotel-preview';
import { ImageEditorPreviewComponent } from '../projects/image-editor-preview/image-editor-preview';
import { MvcProjectPreviewComponent } from '../projects/mvc-project-preview/mvc-project-preview';
import { NormalizationPreviewComponent } from '../projects/normalization-preview/normalization-preview';
import { OmniSocialPreviewComponent } from '../projects/omnisocial-preview/omnisocial-preview';
import { PmPreviewComponent } from '../projects/pm-preview/pm-preview';
import { QuizPreviewComponent } from '../projects/quiz-preview/quiz-preview';
import { ReminderPreviewComponent } from '../projects/reminder-preview/reminder-preview';
import { SectorReportsPreviewComponent } from '../projects/sector-reports-preview/sector-reports-preview';
import { TaskFlowPreviewComponent } from '../projects/taskflow-preview/taskflow-preview';
import { TransferOrdersPreviewComponent } from '../projects/transfer-orders-preview/transfer-orders-preview';
import { WeatherPreviewComponent } from '../projects/weather-preview/weather-preview';
import { CreatorHubPreviewComponent } from '../projects/creatorhub-preview/creatorhub-preview';

@Component({
  selector: 'app-preview-host',
  standalone: true,
  imports: [
    OmniSocialPreviewComponent,
    TaskFlowPreviewComponent,
    TransferOrdersPreviewComponent,
    QuizPreviewComponent,
    PmPreviewComponent,
    HotelPreviewComponent,
    FoodyPreviewComponent,
    WeatherPreviewComponent,
    BoxShadowPreviewComponent,
    ImageEditorPreviewComponent,
    AfkarPreviewComponent,
    EnnwyPreviewComponent,
    ArRoomPreviewComponent,
    AlMotafiqPreviewComponent,
    AzAccountingPreviewComponent,
    BwtPreviewComponent,
    BusinessStepPreviewComponent,
    ReminderPreviewComponent,
    EnlistedPreviewComponent,
    SectorReportsPreviewComponent,
    NormalizationPreviewComponent,
    MvcProjectPreviewComponent,
    CreatorHubPreviewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (kind()) {
      @case ('omnisocial')     { <app-omnisocial-preview /> }
      @case ('taskflow')       { <app-taskflow-preview /> }
      @case ('transferorders') { <app-transfer-orders-preview /> }
      @case ('quiz')           { <app-quiz-preview /> }
      @case ('pm')             { <app-pm-preview /> }
      @case ('hotel')          { <app-hotel-preview /> }
      @case ('foody')          { <app-foody-preview /> }
      @case ('weather')        { <app-weather-preview /> }
      @case ('boxshadow')      { <app-boxshadow-preview /> }
      @case ('imageeditor')    { <app-image-editor-preview /> }
      @case ('afkar')          { <app-afkar-preview /> }
      @case ('ennwy')          { <app-ennwy-preview /> }
      @case ('arroom')         { <app-ar-room-preview /> }
      @case ('almotafiq')      { <app-almotafiq-preview /> }
      @case ('azaccounting')   { <app-az-accounting-preview /> }
      @case ('bwt')            { <app-bwt-preview /> }
      @case ('businessstep')   { <app-business-step-preview /> }
      @case ('reminder')       { <app-reminder-preview /> }
      @case ('enlisted')       { <app-enlisted-preview /> }
      @case ('sectorreports')  { <app-sector-reports-preview /> }
      @case ('normalization')  { <app-normalization-preview /> }
      @case ('mvc') {
        @if (projectId(); as id) {
          @if (id === 'creatorhub') {
            <app-creatorhub-preview />
          } @else {
            <app-mvc-project-preview [projectId]="id" />
          }
        }
      }

      @default {
        <div class="coming">
          <div class="coming-icon">🚧</div>
          <h3>Preview coming soon</h3>
          <p>Full interactive preview for this project is under construction.</p>
          <small>Project: <code>{{ kind() }}</code></small>
        </div>
      }
    }
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .coming {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%; gap: 10px; text-align: center; padding: 40px;
    }
    .coming-icon { font-size: 56px; opacity: 0.6; }
    .coming h3 { font-size: var(--fs-lg); font-weight: 700; }
    .coming p { font-size: var(--fs-sm); color: var(--label-2); }
    .coming code {
      background: var(--bg-fill-2); padding: 2px 8px; border-radius: var(--r-xs);
      font-family: var(--sf-mono); font-size: var(--fs-xs);
    }
  `],
})
export class PreviewHostComponent {
  kind = input.required<DemoKind>();
  projectId = input<string | null>(null);
}