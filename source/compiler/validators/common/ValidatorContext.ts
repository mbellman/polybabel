import ObjectVisitor from './ObjectVisitor';
import ScopeManager from '../../ScopeManager';
import SymbolDictionary from '../../symbol-resolvers/common/SymbolDictionary';
import { IExpectedTypeConstraint, IValidatorContextFlags, IValidatorError } from './types';
import { IHashMap } from 'trampoline-framework';
import { ITypeConstraint } from '../../symbol-resolvers/common/types';

/**
 * A container providing access to essential validation APIs
 * and state, shareable between AbstractValidator instances.
 * A single ValidatorContext instance is created for each file.
 */
export default class ValidatorContext {
  public readonly file: string;
  public errors: IValidatorError[] = [];
  public expectedTypeConstraintStack: IExpectedTypeConstraint[] = [];
  public flags: Partial<IValidatorContextFlags> = {};
  public lastCheckedTypeConstraint: ITypeConstraint;
  public namespaceStack: string[] = [];
  public nativeTypeConstraintMap: IHashMap<ITypeConstraint>;
  public objectVisitor: ObjectVisitor = new ObjectVisitor();
  public scopeManager: ScopeManager = new ScopeManager();
  public symbolDictionary: SymbolDictionary;

  public constructor (file: string, symbolDictionary: SymbolDictionary, nativeTypeConstraintMap: IHashMap<ITypeConstraint> = {}) {
    this.file = file;
    this.symbolDictionary = symbolDictionary;
    this.nativeTypeConstraintMap = nativeTypeConstraintMap;
  }
}
