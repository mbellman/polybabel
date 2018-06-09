import ObjectVisitor from './ObjectVisitor';
import ScopeManager from '../../ScopeManager';
import SymbolDictionary from '../../symbol-resolvers/common/SymbolDictionary';
import { IHashMap } from 'trampoline-framework';
import { ISymbol, TypeDefinition } from '../../symbol-resolvers/common/types';

/**
 * A container providing access to essential validation APIs
 * and state, shareable between AbstractValidator instances.
 * A single ValidatorContext instance is created for each file.
 */
export default class ValidatorContext {
  public readonly file: string;
  public objectVisitor: ObjectVisitor = new ObjectVisitor();
  public scopeManager: ScopeManager<TypeDefinition> = new ScopeManager();
  public symbolDictionary: SymbolDictionary;
  public errors: string[] = [];
  public namespaceStack: string[] = [];
  public importToSourceFileMap: IHashMap<string> = {};

  public constructor (file: string, symbolDictionary: SymbolDictionary) {
    this.file = file;
    this.symbolDictionary = symbolDictionary;
  }

  public enterNamespace (name: string): void {
    this.namespaceStack.push(name);
  }

  public exitNamespace (): void {
    this.namespaceStack.pop();
  }

  public mapImportToSourceFile (name: string, sourceFile: string): void {
    this.importToSourceFileMap[name] = sourceFile;
  }
}
