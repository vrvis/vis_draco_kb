import { TopLevelUnitSpec } from "vega-lite/build/src/spec/unit";
import { Model } from "./model.interface";

export interface SolutionSet {
  models: Model[]; // ASP models
  programs: string[];
  specs: TopLevelUnitSpec<any>[]; // vega-lite specs
  result: any; // result object from Clingo (for misc. use).
}

export interface SelectedSet {
  model: Model;
  spec: TopLevelUnitSpec<any>;
  index: number;
}
