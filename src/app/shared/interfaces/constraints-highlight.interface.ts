import { INTERACTION_TYPE } from "../models/interaction-type.model";
import { Constraint } from "./constraint.interface";

export interface ConstraintsHighlight {
    constraints: Constraint[];
    type: INTERACTION_TYPE;
  }