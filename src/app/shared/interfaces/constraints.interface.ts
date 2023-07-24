import { Constraint } from "./constraint.interface";

export interface Constraints {
    soft?: Constraint[];
    hard?: Constraint[];
  }