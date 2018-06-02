import SymbolDictionary from './SymbolDictionary';
import { ArrayType } from './array-type';
import { FunctionType } from './function-type';
import { IConstructable } from 'trampoline-framework';
import { ISymbol, SymbolIdentifier } from './types';
import { ISyntaxTree } from '../../../parser/common/syntax-types';
import { ObjectType } from './object-type';

/**
 * @todo @description
 */
export default abstract class AbstractSymbolResolver {
  private namespaceStack: string[] = [];
  private symbolDictionary: SymbolDictionary;

  public constructor (symbolDictionary: SymbolDictionary) {
    this.symbolDictionary = symbolDictionary;
  }

  public abstract resolve (syntaxTree: ISyntaxTree): void;

  /**
   * Takes the name of a given construct being resolved and returns
   * a namespaced identifier based on the current namespace stack.
   */
  protected createSymbolIdentifier (typeName: string): SymbolIdentifier {
    return this.namespaceStack.concat(typeName).join('.');
  }

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

  protected enterNamespace (namespace: string): void {
    this.namespaceStack.push(namespace);
  }

  protected exitNamespace (): void {
    this.namespaceStack.pop();
  }
}
