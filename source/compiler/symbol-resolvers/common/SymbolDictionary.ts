import { IHashMap } from 'trampoline-framework';
import { ISymbol, ITypeConstraint, SymbolIdentifier, Dynamic } from './types';
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
   * Returns a symbol based on its identifier, without any safeguard
   * against undefined symbols.
   */
  public getDefinedSymbol (symbolIdentifier: SymbolIdentifier): ISymbol {
    return this.symbolMap[symbolIdentifier];
  }

  /**
   * Attempts to look up a symbol from a list of symbol identifiers,
   * some of which may correspond to undefined entries. If none of
   * the provided identifiers match a defined symbol, we return a
   * dynamically typed symbol instead.
   */
  public getFirstDefinedSymbol (symbolIdentifiers: SymbolIdentifier[]): ISymbol {
    for (const symbolIdentifier of symbolIdentifiers) {
      const symbol = this.getDefinedSymbol(symbolIdentifier);

      if (symbol) {
        return symbol;
      }
    }

    return this.createDynamicSymbol();
  }

  /**
   * Returns a symbol based on its identifier, or a dynamically
   * typed symbol created on the fly for identifiers without
   * dictionary entries.
   */
  public getSymbol (symbolIdentifier: SymbolIdentifier): ISymbol {
    return this.getDefinedSymbol(symbolIdentifier) || this.createDynamicSymbol(symbolIdentifier);
  }

  /**
   * Returns the type of a symbol based on its identifier,
   * or a Dynamic type definition if the symbol isn't defined.
   * Since files outside of the main project workspace don't
   * undergo symbol resolution, returning a dynamic type
   * definition as a fallback for unknown symbol identifiers
   * allows project-external imports to still be used without
   * validation failures. Validators should, however, verify
   * that the searched identifier is in scope.
   */
  public getSymbolConstraint (symbolIdentifier: SymbolIdentifier): ITypeConstraint {
    return this.getSymbol(symbolIdentifier).constraint;
  }

  private createDynamicSymbol (name?: string): ISymbol {
    return {
      identifier: name,
      name,
      constraint: {
        typeDefinition: TypeUtils.createSimpleType(Dynamic),
        isOriginal: true
      }
    };
  }
}
