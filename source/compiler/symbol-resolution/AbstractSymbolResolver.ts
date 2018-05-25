import SymbolDictionary from '../symbol-resolution/SymbolDictionary';
import { IHashMap } from 'trampoline-framework';
import { ISymbol, TypeDefinition } from '../symbol-resolution/types';
import { ISyntaxTree } from '../../parser/common/syntax-types';

/**
 * @todo @description
 */
export default abstract class AbstractSymbolResolver {
  private symbolDictionary: SymbolDictionary;

  public constructor (symbolDictionary: SymbolDictionary) {
    this.symbolDictionary = symbolDictionary;
  }

  public abstract resolve (syntaxTree: ISyntaxTree): void;

  protected save (symbol: ISymbol): void {
    this.symbolDictionary.addSymbol(symbol);
  }
}
