import { IHashMap } from 'trampoline-framework';
import { INamed, ISyntaxNode } from '../parser/common/syntax-types';

export default class ScopeManager {
  private scopes: IHashMap<any>[] = [];

  public get activeScope (): IHashMap<any> {
    return this.scopes[this.scopes.length - 1];
  }

  public constructor () {
    this.enterScope();
  }

  public addToScope (name: string, value?: any): void {
    this.activeScope[name] = value;
  }

  public enterScope (): void {
    this.scopes.push({});
  }

  public isInScope (name: string): boolean {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (name in this.scopes[i]) {
        return true;
      }
    }

    return false;
  }

  public leaveScope (): void {
    this.scopes.pop();
  }
}
