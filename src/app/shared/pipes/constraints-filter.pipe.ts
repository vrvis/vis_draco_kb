import {Pipe, PipeTransform} from '@angular/core';
import { Constraint } from '../interfaces/constraint.interface';

@Pipe({
  name: 'constraintsFilter'
})
export class ConstraintsFilterPipe implements PipeTransform {
  transform(constraints: Constraint[], term) : Object {
    if(term) {
      return constraints.filter(constraint =>
        constraint.asp.includes(term) || 
        constraint.name.includes(term) ||
        constraint.description.includes(term) ||
        constraint.weight == term
      );
    } else {
      return constraints;
    }
  }
}
