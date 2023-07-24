import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'removeLinker'
})
export class RemoveLinkerPipe implements PipeTransform {
  transform(value: Object) : Object {
    return value.toString().replace(/_/g, ' ').replace(/-/g, ' ');
  }
}
