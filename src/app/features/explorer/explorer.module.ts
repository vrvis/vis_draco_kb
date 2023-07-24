import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';

import * as fromComponents from './components';
import { HypergraphComponent } from 'src/app/shared/components';

@NgModule({
  declarations: [fromComponents.components],
  imports: [
    CommonModule,
    SharedModule
  ]
})
export class ExplorerModule { }
