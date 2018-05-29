import SymbolDictionary from '../symbol-resolution/SymbolDictionary';
import { ArrayType } from './array-type';
import { Dynamic, ISimpleType, ISymbol, Primitive, Void } from '../symbol-resolution/types';
import { FunctionType } from './function-type';
import { IConstructable } from 'trampoline-framework';
import { ISyntaxTree } from '../../parser/common/syntax-types';
import { ObjectType } from './object-type';

/**
 * @todo @description
 */
export default abstract class AbstractSymbolResolver {
  private symbolDictionary: SymbolDictionary;

  public constructor (symbolDictionary: SymbolDictionary) {
    this.symbolDictionary = symbolDictionary;
  }

  public abstract resolve (syntaxTree: ISyntaxTree): void;

  /**
   * Returns an instance of a provided type definer class,
   * supplying its constructor with the symbol dictionary
   * originally provided to this resolver by the Compiler.
   */
  protected createTypeDefiner <T extends ObjectType.Definer | FunctionType.Definer | ArrayType.Definer>(TypeDefiner: IConstructable<T>): T {
    return new TypeDefiner(this.symbolDictionary);
  }

  protected defineSymbol (symbol: ISymbol): void {
    this.symbolDictionary.addSymbol(symbol);
  }
}
