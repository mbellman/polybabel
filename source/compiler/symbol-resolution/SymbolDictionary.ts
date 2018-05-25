import { IHashMap } from 'trampoline-framework';
import { ISymbol, SymbolIdentifier } from './types';

/**
 * @todo @description
 */
export default class SymbolDictionary {
  private symbolMap: IHashMap<ISymbol> = {};

  public addSymbol (symbol: ISymbol): void {
    this.symbolMap[symbol.identifier] = symbol;
  }

  public getSymbol (symbolIdentifier: SymbolIdentifier): ISymbol {
    return this.symbolMap[symbolIdentifier];
  }
}
