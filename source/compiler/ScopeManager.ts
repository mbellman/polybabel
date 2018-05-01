import { IHashMap } from 'trampoline-framework';
import { INamed, ISyntaxNode } from '../parser/common/syntax-types';

/**
 * @todo @description
 *
 * @internal
 */
type Scope = IHashMap<ISyntaxNode>;

export default class ScopeManager {
  private scopes: Scope[] = [];

  public get activeScope (): Scope {
    return this.scopes[this.scopes.length - 1];
  }

  public addNode (node: ISyntaxNode & INamed): void {
    this.activeScope[node.name] = node;
  }

  public enterScope (): void {
    this.scopes.push({});
  }

  public isInScope (name: string): boolean {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (!!this.scopes[i][name]) {
        return true;
      }
    }

    return false;
  }

  public leaveScope (): void {
    this.scopes.pop();
  }
}
