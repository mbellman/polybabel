import { ISyntaxNode } from './syntax';

export default class SyntaxNodeBuilder<N extends ISyntaxNode = ISyntaxNode> {
  private _syntaxNode: N;

  public constructor (nodeType: N['nodeType']) {
    this._syntaxNode = { nodeType } as N;
  }

  public add <K extends keyof N>(key: K, values: N[K]): void {
    const existingValues = this._syntaxNode[key];

    this._syntaxNode[key] = existingValues.concat(values);
  }

  public getSyntaxNode (): N {
    return this._syntaxNode as N;
  }

  public update <K extends keyof N>(key: K, value: N[K]): void {
    this._syntaxNode[key] = value;
  }
}
