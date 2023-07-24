import { ASP_FEATURE_TYPE } from "../models/asp-feature-type.model";
import { Feature } from "./feature.interface";
import { Graph } from "./graph.interface";

export interface RadialHypergraphData {
    graph: Graph,
    hierarchy: any;
    feature: Feature
  }