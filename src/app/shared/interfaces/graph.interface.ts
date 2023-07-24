import { Hyperlink } from "./hyperlink.interface";
import { Node } from "./node.interface";

export interface Graph {
    nodes: Node[],
    nodesSorted: Node[],
    links: Hyperlink[]
  }