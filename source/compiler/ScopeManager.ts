import { IHashMap } from 'trampoline-framework';
import { INamed, ISyntaxNode } from '../parser/common/syntax-types';

export default class ScopeManager<V extends any = any> {
  private scopes: IHashMap<V>[] = [];

  public get activeScope (): IHashMap<any> {
    return this.scopes[this.scopes.length - 1];
  }

  public constructor () {
    this.enterScope();
  }

  public addToScope (name: string, value?: V): void {
    this.activeScope[name] = value;
  }

  public enterScope (): void {
    this.scopes.push({});
  }

  public exitScope (): void {
    this.scopes.pop();
  }

  public getScopedValue (name: string): V {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const value = this.scopes[i][name];

      if (value) {
        return value;
      }
    }

    return null;
  }
}
