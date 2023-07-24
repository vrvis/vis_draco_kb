import { Injectable } from '@angular/core';
import { combineLatest, concat, empty, forkJoin, NEVER, never, Observable, ObservableInput, of } from 'rxjs';
import { combineAll, concatAll, map, switchMap, tap } from 'rxjs/operators';
import { AST } from 'src/app/shared/interfaces/ast.interface';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class DatabaseHelperService {

  constructor(private dbService : DatabaseService) { }

  /**
   * Add constraints if not exist
   * @param db_name 
   * @param rules 
   */
  addRules(db_name, rules): Observable<any> {
    return this.dbService.count(db_name).pipe(map(count => {
      if(count === 0) {
        let observeables: Observable<any>[] = [];
        rules.forEach(rule => {
          observeables.push(this.dbService.add(db_name, rule));
        });
        return forkJoin(observeables);
      } else {
        return this.dbService.getAll(db_name);
      }
    }), concatAll());
  }
}
