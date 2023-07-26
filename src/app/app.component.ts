import { Component } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'vis-for-draco-kb';

  constructor(private db : NgxIndexedDBService) {
  }

  deleteDatabase() {
    this.db.deleteDatabase().subscribe(deleted => {
      if(deleted) {
        window.location.reload();
      }
    });
  }
}
