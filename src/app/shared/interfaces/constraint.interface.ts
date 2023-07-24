interface Doc {
  description: string;
}

interface DocHighlight {
  description: string[];
}

interface Hierarchy {
  hierarchy?: string[];
}

interface AspCode {
  asp: string;
}

interface AspCodeHighlight {
  asp: string[];
}

interface Asp extends AspCode {
  constraintType: string;
  type: string;
  name: string;
}

interface AspHighlight extends AspCodeHighlight {
  constraintType: string;
  type: string;
  name: string;
}

export interface Constraint extends Doc, Asp, Hierarchy {
  weight?: number;
}

export interface ConstraintHighlight extends Doc, AspHighlight {
  weight?: number;
}