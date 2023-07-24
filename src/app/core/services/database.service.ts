import { Injectable } from '@angular/core';

import { NgxIndexedDBModule, NgxIndexedDBService } from 'ngx-indexed-db';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  _db: NgxIndexedDBModule;

  constructor(private dbService: NgxIndexedDBService) {
    this._db = dbService;
  }

  add(store: string, value: any): Observable<any> {
    return this.dbService.add(store, value);
  }

  update(store: string, value) {
    return this.dbService.update(store, value);
  }

  getByID(store: string, id: number): Observable<any> {
    return this.dbService.getByKey(store, id);
  }

  getByKey(store: string, key_path: string, search: string) {
    return this.dbService.getByIndex(store, key_path, search);
  }

  getAll(store: string): Observable<any> {
    return this.dbService.getAll(store);
  }

  count(store: string): Observable<any> {
    return this.dbService.count(store);
  }

  delete(store: string, key: number): Observable<any> {
    return this.dbService.delete(store, key);
  }
}
