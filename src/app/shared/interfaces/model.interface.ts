import { Violation } from "./violoation.interface";

export interface Model {
    costs: number[];
    facts: string[];
    violations: Violation[];
  }