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
   * or Dynamic if the symbol isn't defined.
   */
  public getSymbolType (symbolIdentifier: SymbolIdentifier): TypeDefinition {
    const symbol = this.getSymbol(symbolIdentifier);

    return symbol
      ? symbol.type
      : { type: Dynamic };
  }
}
