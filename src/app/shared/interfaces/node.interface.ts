import { Constraint, ConstraintHighlight } from "./constraint.interface";

export interface Node extends Constraint {
  id: number;
}
export interface NodeHighlight extends ConstraintHighlight {
  id: number;
}