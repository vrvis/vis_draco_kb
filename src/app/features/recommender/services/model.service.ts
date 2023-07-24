import { Injectable } from '@angular/core';
import { Constraint } from 'src/app/shared/interfaces/constraint.interface';
import { Model } from 'src/app/shared/interfaces/model.interface';
import { TopLevelUnitSpec } from 'vega-lite/build/src/spec/unit';
import { AspVlMapperService } from './asp-vl-mapper';

const SOFT_REGEX = /(soft\(\w+).*?\)/;


@Injectable({
  providedIn: 'root'
})
export class ModelService {

  constructor(private aspVlMapperService: AspVlMapperService) { }

  /**
   * Get the array of witnesses from clingo output.
   * Return undefined if no witnesses were found.
   */
  getModels(result: any, constraints: Constraint[]): Model[] {
    return (result.Call || []).reduce((arr: any[], el: any) => {
      el.Witnesses.forEach((d: any) => {
        const facts = d.Value;
        const costs = d.Costs;

        const violationAsps = facts.filter((fact: string) => {
          return fact.startsWith('soft(');
        });

        const violations = violationAsps.map((asp: string) => {
          const matcher = SOFT_REGEX.exec(asp);

          if (!matcher) {
            throw Error(`invalid violation: ${asp}`);
          }
          const toMatch = matcher[1];

          const constraint = constraints.find((curr: Constraint) => {
            return curr.asp.startsWith(toMatch);
          });

          if (!constraint) {
            throw Error(`${toMatch} not found!`);
          }

          return {
            ...constraint,
            witness: asp,
          };
        });

        arr.push({
          costs,
          facts,
          violations,
        });
      });
      return arr;
    }, []);
  }

  models2vl(models: Model[]): TopLevelUnitSpec<any>[] {
    return models.map(model => this.aspVlMapperService.asp2vl(model.facts));
  }
}
