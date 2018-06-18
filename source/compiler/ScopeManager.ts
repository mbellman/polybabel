import { IHashMap } from 'trampoline-framework';
import { IScopedReference } from './symbol-resolvers/common/types';

export default class ScopeManager {
  private scopes: IHashMap<IScopedReference>[] = [];

  public get activeScope (): IHashMap<any> {
    return this.scopes[this.scopes.length - 1];
  }

  public constructor () {
    this.enterScope();
  }

  public addToScope (name: string, value?: IScopedReference): void {
    this.activeScope[name] = value;
  }

  public enterScope (): void {
    this.scopes.push({});
  }

  public exitScope (): void {
    this.scopes.pop();
  }

  public getScopedReference (name: string): IScopedReference {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const reference = this.scopes[i][name];

      if (reference) {
        return reference;
      }
    }

    return null;
  }
}
