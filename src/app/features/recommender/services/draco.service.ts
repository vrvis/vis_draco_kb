import { Injectable } from '@angular/core';

import { constraints, constraints2json, data2schema, json2constraints, schema2asp } from 'draco-core';
import { Constraints } from 'src/app/shared/interfaces/constraints.interface';
import { Options } from 'src/app/shared/interfaces/options.interface';
import { Schema } from 'src/app/shared/interfaces/schema.interface';
import { SolutionSet } from 'src/app/shared/interfaces/solution-set.interface';

import { ModelService } from './model.service';

import Clingo from 'wasm-clingo';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { AspVlMapperService } from './asp-vl-mapper';
import { TopLevelUnitSpec } from 'vega-lite/build/src/spec/unit';
import { Constraint } from 'src/app/shared/interfaces/constraint.interface';
import { ParserService } from '../../explorer/services/parser.service';

@Injectable({
  providedIn: 'root'
})
export class DracoService {
  public initialized = false;

  private Module: any;
  private stdout: string = '';
  private schema: Schema | null;
  private soft: Constraint[];
  private hard: Constraint[];
  private constraints: any;

  private _solutionSet: BehaviorSubject<SolutionSet> = new BehaviorSubject<SolutionSet>(null);

  //private urlToBinary: string = 'https://unpkg.com/wasm-clingo@0.2.2';
  private urlToBinary: string = 'assets/binaries';

  constructor(private modelService: ModelService, private parserService: ParserService,private aspVlMapperService: AspVlMapperService) {
    this.setup();
  }

  get solutionSet(): Observable<SolutionSet> {
    return this._solutionSet;
  }

  setup() {
    // add / if it's missing from the URL
    if (this.urlToBinary.substr(this.urlToBinary.length - 1) !== '/') {
      this.urlToBinary += '/';
    }

    const that = this;
    const m = {
      // Where to locate clingo.wasm
      //locateFile: (file: string) => `${this.url}${file}`,
      locateFile: (file: string) => `${this.urlToBinary}${file}`,

      // Status change logger
      setStatus: (text: string) => console.log,

      print(text: string) {
        that.stdout += text;
      },

      // Dependencies
      totalDependencies: 0,
      monitorRunDependencies(left: number) {
        m.totalDependencies = Math.max(m.totalDependencies, left);
        m.setStatus(
          left
            ? 'Preparing... (' + (m.totalDependencies - left) + '/' + m.totalDependencies + ')'
            : 'All downloads complete.'
        );
      },

      printErr(err: Error) {
        if (err) {
          m.setStatus('Received output on stderr.');
          //console.warn(err);
        }
      },
    };

    this.Module = m;
    this.schema = null;

    this.hard = constraints2json(constraints.HARD).map((constraint:any) => { return {...constraint, constraintType: constraint.type};});
    this.soft = constraints2json(constraints.SOFT, constraints.WEIGHTS).map((constraint:any) => { return {...constraint, constraintType: constraint.type};});

    this.constraints = constraints;
  }

  /**
   * Initializes the underlying solver.
   *
   * @returns A promise that resolves when the solver is ready.
   */
  async init() {
    this.Module.setStatus('Downloading...');
    await this.Module.onRuntimeInitialized;
    this.initialized = true;

    Clingo(this.Module);
  }



  /**
   * Solves with the given constraints.
   *
   * @param program The constraint to solve (e.g. the partial specification in ASP)
   * @param options Options for solving.
   *
   * @returns The solution from Clingo as JSON.
   */
  solve(program: string, options: Options = {}): Observable<SolutionSet> {
    if (!this.initialized) {
      throw Error('Draco is not initialized. Call `init() first.`');
    }

    this.Module.setStatus('Running Draco Query...');

    const dataDecl = this.getDataDeclaration();
    program += dataDecl;

    const programs =
      options.constraints ||
      Object.keys(this.constraints).filter(name => !(name === 'SOFT' || name === 'HARD' || name === 'WEIGHTS'));

    if (options.relaxHard && programs.indexOf('HARD_INTEGRITY') !== -1) {
      programs.splice(programs.indexOf('HARD_INTEGRITY'), 1);
    }

    program += programs.map((name: string) => (this.constraints as any)[name]).join('\n\n');

    const softAsp = json2constraints(this.soft);
    const hardAsp = json2constraints(this.hard);

    program += hardAsp.definitions + '\n\n';
    program += softAsp.definitions + '\n\n' + softAsp.weights + '\n\n' + softAsp.assigns;

    const opt = [
      '--outf=2', // JSON output
      '--opt-mode=OptN', // find multiple optimal models
      '--quiet=1', // only output optimal models
      '--project', // every model only once
      options.models === undefined ? 1 : options.models,
    ]
      .concat((options.weights || []).map(d => `-c ${d.name}=${d.value}`))
      .join(' ');

    // reset stdout before running clingo
    this.stdout = '';

    this.Module.ccall('run', 'number', ['string', 'string'], [program, opt]);

    const result = JSON.parse(this.stdout);

    if (result.Result === 'UNSATISFIABLE') {
      console.debug('UNSATISFIABLE');
      console.debug(result);
      return null;
    }

    const models = this.modelService.getModels(result, this.soft.concat(this.hard));

    if (models.length > (options.models || 1)) {
      throw new Error('Too many models.');
    }

    const specs = this.modelService.models2vl(models);

    // done
    this.Module.setStatus('');

    this._solutionSet.next({ models, programs, specs, result });

    return this._solutionSet;
  }

  getSchema(): Schema | null {
    return this.schema;
  }

  prepareData(data: any[]) {
    this.schema = data2schema(data);
  }

  updateAsp(aspSet: any) {
    this.constraints = {
      ...this.constraints,
      ...aspSet,
    };
  }

  getConstraintSet(): Constraints {
    return {
      soft: this.soft,
      hard: this.hard,
    };
  }

  setConstraintSet(constraintSet: Constraints) {
    this.hard = constraintSet.hard;
    this.soft = constraintSet.soft;
  }

  private getDataDeclaration(): string {
    if (!this.schema) {
      return '';
    }

    return schema2asp(this.schema).join('\n');
  }

  vl2asp(vlSpec: TopLevelUnitSpec<any>) {
    return this.aspVlMapperService.vl2asp(vlSpec);
  }
}
