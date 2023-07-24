import { Constraint } from "./constraint.interface";

export interface Violation extends Constraint {
    witness: string;
  }