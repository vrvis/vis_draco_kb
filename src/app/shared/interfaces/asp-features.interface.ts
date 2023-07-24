import { AST } from "./ast.interface";

export interface ASPFeatures {
    asps: AST[],
    variables: AST[],
    identifiers: AST[],
    facts: AST[],
    integrity_constraints: AST[],
    choice_rules: AST[],
    cardinality_constraints: AST[],
    weight_constraints: AST[],
    optimisation_constructs: AST[]
  }