import { Dynamic, ISymbol, SymbolIdentifier, TypeDefinition } from './types';
import { IHashMap } from 'trampoline-framework';
import { TypeUtils } from './type-utils';

/**
 * A symbol dictionary containing type definitions for the
 * given symbols within a program.
 */
export default class SymbolDictionary {
  private symbolMap: IHashMap<ISymbol> = {};

  public addSymbol (symbol: ISymbol): void {
    this.symbolMap[symbol.identifier] = symbol;
  }

  /**
   * Returns a symbol based on its identifier, or a dynamically
   * typed symbol created on the fly for identifiers without
   * dictionary entries.
   */
  public getSymbol (symbolIdentifier: SymbolIdentifier): ISymbol {
    return (
      this.symbolMap[symbolIdentifier] || {
        identifier: symbolIdentifier,
        type: TypeUtils.createDynamicType()
      }
    );
  }

  /**
   * Returns the type of a symbol based on its identifier,
   * or a Dynamic type definition if the symbol isn't defined.
   * Since files outside of the main project workspace don't
   * undergo symbol resolution, returning a dynamic type
   * definition as a fallback for unknown symbol identifiers
   * allows project-external imports to still be used without
   * validation failures. Validators should, however, affirm
   * that the searched identifier is in scope.
   */
  public getSymbolType (symbolIdentifier: SymbolIdentifier): TypeDefinition {
    const { type } = this.getSymbol(symbolIdentifier);

    return type;
  }
}
