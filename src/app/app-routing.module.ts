import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ExplorerComponent } from './features/explorer/components/explorer/explorer.component';
import { RecommenderComponent } from './features/recommender/components';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'recommender', pathMatch: 'full' },
  { path: 'explorer', component: ExplorerComponent },
  {
    path: 'recommender',
    component: RecommenderComponent
  },
  { path: '**', redirectTo: 'recommender', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
