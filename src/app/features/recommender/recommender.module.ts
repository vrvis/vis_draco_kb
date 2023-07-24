import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';

import * as fromComponents from './components';
import { AngularSplitModule } from 'angular-split';

import { RecommendationsComponent } from './components/recommendations/recommendations.component';

import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatOptionModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { ConstraintsInspectorComponent } from './components/knowledge-base-inspector/constraints-inspector/constraints-inspector.component';
import { FeaturesViewerComponent } from './components/knowledge-base-inspector/features-viewer/features-viewer.component';
import { KnowledgeBaseInspectorComponent } from './components/knowledge-base-inspector/knowledge-base-inspector.component';

@NgModule({
  declarations: [fromComponents.components, RecommendationsComponent, KnowledgeBaseInspectorComponent, ConstraintsInspectorComponent, FeaturesViewerComponent],
  imports: [
    CommonModule,
    SharedModule,
    MatGridListModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    AngularSplitModule,
    MatIconModule,
    MatTabsModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    NgxJsonViewerModule
  ]
})
export class RecommenderModule { }
