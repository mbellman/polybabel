import { IHashMap } from 'trampoline-framework';
import { ISymbol, SymbolIdentifier, Dynamic, TypeDefinition, ISimpleType } from './types';

/**
 * A symbol dictionary containing type definitions for the
 * given symbols within a program.
 */
export default class SymbolDictionary {
  private symbolMap: IHashMap<ISymbol> = {};

  public addSymbol (symbol: ISymbol): void {
    this.symbolMap[symbol.identifier] = symbol;
  }

  public getSymbol (symbolIdentifier: SymbolIdentifier): ISymbol {
    return this.symbolMap[symbolIdentifier];
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
    const symbol = this.getSymbol(symbolIdentifier);

    return symbol
      ? symbol.type
      : { type: Dynamic };
  }
}
