import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import * as fromComponents from './components';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AngularResizeEventModule } from 'angular-resize-event';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EnumToArrayPipe, RemoveLinkerPipe, ConstraintsFilterPipe } from './pipes';


@NgModule({
  declarations: [fromComponents.components, EnumToArrayPipe, RemoveLinkerPipe, ConstraintsFilterPipe],
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    AngularResizeEventModule,
    MatIconModule,
    MatTooltipModule
  ],
  exports: [FormsModule, ...fromComponents.components, EnumToArrayPipe, RemoveLinkerPipe, ConstraintsFilterPipe]
})
export class SharedModule { }
