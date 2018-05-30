import ScopeManager from '../ScopeManager';
import SymbolDictionary from '../symbol-resolution/SymbolDictionary';
import { Callback } from '../../system/types';
import { Constructor, IConstructable } from 'trampoline-framework';
import { Dynamic, ISimpleType, SymbolIdentifier, TypeDefinition } from '../symbol-resolution/types';
import { ISyntaxNode } from '../../parser/common/syntax-types';

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

  public abstract validate (syntaxNode: S): void;

  /**
   * Attempts to resolve a symbol from the symbol dictionary
   * by its identifier, and adds it to the active scope if
   * it exists.
   */
  protected addSymbolToScope (symbolIdentifier: SymbolIdentifier): void {
    const symbol = this.symbolDictionary.getSymbol(symbolIdentifier);

    this.scopeManager.addToScope(symbolIdentifier, symbol);
  }

  protected assert (condition: boolean, message: string, shouldHalt: boolean = true): void {
    if (!condition) {
      this.errors.push(message);

      if (shouldHalt) {
        // Halt on errors by default
        throw new Error();
      }
    }
  }

  protected isDynamic (typeDefinition: TypeDefinition): boolean {
    return (typeDefinition as ISimpleType).type === Dynamic;
  }

  /**
   * Validates a provided syntax node using an AbstractValidator
   * subclass. Hands off both the instance's ScopeManager and its
   * errors list so both can be used and manipulated by reference.
   */
  protected validateNodeWith <T extends ISyntaxNode>(Validator: Constructor<AbstractValidator<T>>, syntaxNode: T): void {
    const validator = new (Validator as IConstructable<AbstractValidator>)(this.symbolDictionary);

    validator.scopeManager = this.scopeManager;
    validator.errors = this.errors;

    try {
      validator.validate(syntaxNode);
    } catch (e) { }
  }
}
