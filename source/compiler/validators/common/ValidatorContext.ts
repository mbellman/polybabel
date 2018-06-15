import ObjectVisitor from './ObjectVisitor';
import ScopeManager from '../../ScopeManager';
import SymbolDictionary from '../../symbol-resolvers/common/SymbolDictionary';
import { IExpectedType, IValidatorError } from './types';
import { IHashMap } from 'trampoline-framework';
import { TypeDefinition } from '../../symbol-resolvers/common/types';

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
  public errors: IValidatorError[] = [];
  public expectedTypeStack: IExpectedType[] = [];
  public importToSourceFileMap: IHashMap<string> = {};
  public namespaceStack: string[] = [];
  public shouldAllowAnyType: boolean = false;

  public constructor (file: string, symbolDictionary: SymbolDictionary) {
    this.file = file;
    this.symbolDictionary = symbolDictionary;
  }
}
