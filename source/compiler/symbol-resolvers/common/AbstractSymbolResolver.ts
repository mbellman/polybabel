import SymbolDictionary from './SymbolDictionary';
import { ArrayType } from './array-type';
import { FunctionType } from './function-type';
import { IConstructable, IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from '../../../parser/common/syntax-types';
import { ObjectType } from './object-type';
import { SymbolIdentifier, TypeDefinition, ITypeConstraint } from './types';

/**
 * @todo @description
 */
export default abstract class AbstractSymbolResolver {
  protected readonly file: string;
  protected nativeTypeConstraintMap: IHashMap<ITypeConstraint>;
  protected symbolDictionary: SymbolDictionary;
  private importToSourceFileMap: IHashMap<string> = {};
  private namespaceStack: string[] = [];

  public constructor (file: string, symbolDictionary: SymbolDictionary, nativeTypeConstraintMap: IHashMap<ITypeConstraint> = {}) {
    this.file = file;
    this.symbolDictionary = symbolDictionary;
    this.nativeTypeConstraintMap = nativeTypeConstraintMap;
  }

  public abstract resolve (syntaxTree: ISyntaxTree): void;

  /**
   * Takes the name of a given symbol being resolved and
   * returns a file-scoped, namespaced identifier to use to
   * look up its type definition at validation time.
   */
  protected createSymbolIdentifier (constructName: string): SymbolIdentifier {
    return this.file + this.namespaceStack.concat(constructName).join('.');
  }

  /**
   * Returns an instance of a provided type definer class,
   * supplying its constructor with the symbol dictionary
   * originally provided to this resolver by the Compiler.
   */
  protected createTypeDefiner <T extends ObjectType.Definer | FunctionType.Definer | ArrayType.Definer>(TypeDefiner: IConstructable<T>): T {
    return new TypeDefiner(this.symbolDictionary);
  }

  protected enterNamespace (namespace: string): void {
    this.namespaceStack.push(namespace);
  }

  protected exitNamespace (): void {
    this.namespaceStack.pop();
  }

  /**
   * Returns a list of possible symbol identifiers for a
   * provided symbol name reference, given that during
   * symbol resolution time it is impossible to know where
   * in scope or in the local object nesting hierarchy the
   * desired symbol resides. For example:
   *
   * ```
   * Object B { }
   *
   * Object A {
   *   B getB () { }
   *
   *   Object B { }
   * }
   * ```
   *
   * In the above pseudo-code, the return type 'B' of A.getB()
   * could represent two possible symbols, one being the symbol
   * in the module scope, the other being a nested symbol within
   * the 'A' object itself. Due to lexical scoping rules, the
   * correct symbol should be the 'B' enclosed within 'A'. Upon
   * encountering a type name not stored in the imports map, we
   * must assume that the name is contained within the current
   * file, and may be found in the symbol dictionary either by:
   *
   *  1. file + A.B
   *  2. file + B
   *
   * At validation time, the set of possible symbol identifiers
   * for an given symbol name reference will be looked up in
   * order in the global symbol dictionary when attempting to
   * recover its actual type definition. In this example the
   * first identifier will correctly yield the desired symbol.
   *
   * If the symbol name reference or the outer portion of its
   * namespace chain is an import, we return one possible
   * symbol identifier: the import source file name + the full
   * symbol name reference. For example:
   *
   * ```
   * import Symbol from path/to/symbol
   *
   * Object A {
   *   Symbol getSymbol () { }
   * }
   * ```
   *
   * In the above case, the encountered 'Symbol' return type
   * of A.getSymbol() will yield a possible symbol identifier
   * of 'path/to/symbolSymbol', which will correctly yield
   * the desired symbol when looked up in the global symbol
   * dictionary.
   *
   * @see createSymbolIdentifier()
   * @see SymbolDictionary
   */
  protected getPossibleSymbolIdentifiers (symbolNameReference: string): SymbolIdentifier[] {
    const outerName = symbolNameReference.split('.', 1).shift();
    const isImportedSymbol = outerName in this.importToSourceFileMap;

    if (isImportedSymbol) {
      // If the symbol name is the same as, or has its outer name from
      // an import, the symbol identifier is that of the corresponding
      // symbol resolved within its import source file
      return [ this.importToSourceFileMap[outerName] + symbolNameReference ];
    } else {
      return this.namespaceStack
        .map((namespace, index) => {
          // Take the current namespace stack and generate a list
          // of possible namespaces working backward up the stack.
          // The closest-proximity identifier found will determine
          // the symbol we ultimately recover.
          const possibleEnclosingNamespace = this.namespaceStack
            .slice(0, this.namespaceStack.length - index)
            .join('.');

          return `${this.file}${possibleEnclosingNamespace}.${symbolNameReference}`;
        })
        // As a last resort, we consider that the symbol could be
        // somewhere within the file scope
        .concat(this.file + symbolNameReference);
    }
  }

  protected mapImportToSourceFile (importName: string, sourceFile: string): void {
    this.importToSourceFileMap[importName] = sourceFile;
  }
}
