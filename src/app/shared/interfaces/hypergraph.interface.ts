import { Hyperlink } from "./hyperlink.interface";
import { Node } from "./node.interface";

export interface HypergraphData {
    nodes: Node[],
    links: Hyperlink[]
  }