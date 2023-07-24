
export interface AST {
    type: string,
    text: string,
    rest: string,
    start: number,
    end: number,
    fullText: string,
    errors: [],
    children: AST[],
    parent: AST
  }