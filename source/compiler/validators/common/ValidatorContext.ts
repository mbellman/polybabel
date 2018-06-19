import ObjectVisitor from './ObjectVisitor';
import ScopeManager from '../../ScopeManager';
import SymbolDictionary from '../../symbol-resolvers/common/SymbolDictionary';
import { IExpectedType, IValidatorContextFlags, IValidatorError } from './types';
import { IHashMap } from 'trampoline-framework';
import { TypeDefinition } from '../../symbol-resolvers/common/types';

/**
 * A container providing access to essential validation APIs
 * and state, shareable between AbstractValidator instances.
 * A single ValidatorContext instance is created for each file.
 */
export default class ValidatorContext {
  public readonly file: string;
  public errors: IValidatorError[] = [];
  public expectedTypeStack: IExpectedType[] = [];
  public flags: Partial<IValidatorContextFlags> = {};
  public namespaceStack: string[] = [];
  public nativeTypeMap: IHashMap<TypeDefinition>;
  public objectVisitor: ObjectVisitor = new ObjectVisitor();
  public scopeManager: ScopeManager = new ScopeManager();
  public symbolDictionary: SymbolDictionary;

  public constructor (file: string, symbolDictionary: SymbolDictionary, nativeTypeMap: IHashMap<TypeDefinition> = {}) {
    this.file = file;
    this.symbolDictionary = symbolDictionary;
    this.nativeTypeMap = nativeTypeMap;
  }
}
