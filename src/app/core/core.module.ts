import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExplorerModule } from '../features/explorer/explorer.module';
import { RecommenderModule } from '../features/recommender/recommender.module';

import { NgxIndexedDBModule } from 'ngx-indexed-db';
import { dbConfig } from './services/config';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ExplorerModule,
    RecommenderModule,
    NgxIndexedDBModule.forRoot(dbConfig)
  ]
})
export class CoreModule { }
