import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { HashLocationStrategy, LocationStrategy } from "@angular/common";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    BrowserAnimationsModule
  ],
  providers: [
    { provide: LocationStrategy, useClass: HashLocationStrategy}
  ],
  bootstrap: [
    AppComponent
  ]
})

export class AppModule { }
