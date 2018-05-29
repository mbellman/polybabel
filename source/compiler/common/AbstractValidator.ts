import ScopeManager from '../ScopeManager';
import SymbolDictionary from '../symbol-resolution/SymbolDictionary';
import { Autowired, IHashMap, Wired } from 'trampoline-framework';
import { Callback } from '../../system/types';
import { ISyntaxNode, ISyntaxTree } from '../../parser/common/syntax-types';

export default abstract class AbstractValidator<S extends ISyntaxNode = ISyntaxNode> {
  protected scopeManager: ScopeManager = new ScopeManager();
  protected symbolDictionary: SymbolDictionary;
  private errors: string[] = [];

  public constructor (symbolDictionary: SymbolDictionary) {
    this.symbolDictionary = symbolDictionary;
  }

  public forErrors (callback: Callback<string>): void {
    this.errors.forEach(error => callback(error));
  }

  public hasErrors (): boolean {
    return this.errors.length > 0;
  }

  public abstract validate (syntaxTree: ISyntaxTree): void;

  protected error (message: string): void {
    this.errors.push(message);
  }
}
