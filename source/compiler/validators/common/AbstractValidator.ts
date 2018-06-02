import ScopeManager from '../../ScopeManager';
import SymbolDictionary from '../../symbol-resolvers/common/SymbolDictionary';
import { Callback } from '../../../system/types';
import { Constructor, IConstructable } from 'trampoline-framework';
import { IObjectMember, TypeDefinition } from '../../symbol-resolvers/common/types';
import { ISyntaxNode } from '../../../parser/common/syntax-types';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';
import { ValidationUtils } from './validation-utils';

/**
 * @internal
 */
type TypeValidator = (typeDefinition: TypeDefinition, identifier: string) => void;

export default abstract class AbstractValidator<S extends ISyntaxNode = ISyntaxNode> {
  protected scopeManager: ScopeManager = new ScopeManager();
  protected symbolDictionary: SymbolDictionary;
  private errors: string[] = [];

  public constructor (symbolDictionary: SymbolDictionary) {
    this.symbolDictionary = symbolDictionary;
  }

  public forErrors (callback: Callback<string>): void {
    this.errors.forEach(error => callback(error));
  }

  public hasErrors (): boolean {
    return this.errors.length > 0;
  }

  public abstract validate (syntaxNode: S): void;

  protected assert (condition: boolean, message: string, shouldHalt: boolean = true): void {
    if (!condition) {
      this.errors.push(message);

      if (shouldHalt) {
        // Halt on negative assertions by default
        throw new Error();
      }
    }
  }

  /**
   * Asserts without halting the validator even on a failure.
   */
  protected assertAndContinue (condition: boolean, message: string): void {
    this.assert(condition, message, false);
  }

  /**
   * Provides a means for retrieving a deeply-nested object member
   * off an object symbol, given a provided member chain. If at
   * any point in the chain a member isn't found, we log the error
   * and return null.
   *
   * @todo Allow optional visibility restrictions
   */
  protected findDeepObjectMember (memberChain: string[]): IObjectMember {
    const objectName = memberChain.shift();
    const { type, identifier } = this.symbolDictionary.getSymbol(objectName);

    if (ValidationUtils.isDynamicType(type)) {
      // If the symbol being searched is already dynamic,
      // simply return a new dynamic object member, since
      // dynamic types permit arbitrary deep member chains
      return TypeUtils.createDynamicObjectMember();
    }

    const currentChain: string[] = [];
    let searchTarget = type;

    while (searchTarget) {
      if (!(searchTarget instanceof ObjectType.Definition)) {
        this.report(`Identifier '${identifier}.${currentChain.join('.')}' does not have additional members`);

        return;
      }

      const nextMemberName = memberChain.shift();
      const objectMember = searchTarget.getObjectMember(nextMemberName);

      currentChain.push(nextMemberName);

      if (!objectMember) {
        this.report(`Could not find object member '${identifier}.${currentChain.join('.')}'`);

        return;
      }

      if (memberChain.length === 0) {
        return objectMember;
      }

      if (ValidationUtils.isDynamicType(objectMember.type)) {
        // If one of the members in the chain is dynamic, return
        // a new dynamic object member immediately, since dynamic
        // types can have any of the remaining deep members
        return TypeUtils.createDynamicObjectMember();
      }

      searchTarget = objectMember.type;
    }

    return;
  }

  protected report (message: string): void {
    this.errors.push(message);
  }

  /**
   * Validates a provided syntax node using an AbstractValidator
   * subclass. Hands off both the instance's ScopeManager and its
   * errors list so both can be used and manipulated by reference.
   */
  protected validateNodeWith <T extends ISyntaxNode>(Validator: Constructor<AbstractValidator<T>>, syntaxNode: T): void {
    const validator = new (Validator as IConstructable<AbstractValidator>)(this.symbolDictionary);

    validator.scopeManager = this.scopeManager;
    validator.errors = this.errors;

    try {
      validator.validate(syntaxNode);
    } catch (e) { }
  }

  protected validateDeepObjectMemberType (memberChain: string[], validator: TypeValidator): void {
    const objectName = memberChain[0];
    const symbolIdentifier = memberChain.join('.');
    const isObjectNameInScope = this.scopeManager.isInScope(objectName);

    this.assertAndContinue(
      isObjectNameInScope,
      `Unknown identifier '${objectName}'`
    );

    if (memberChain.length === 1) {
      const objectSymbol = this.symbolDictionary.getSymbol(objectName);
      const { type, identifier } = objectSymbol;

      validator(type, identifier);
    } else {
      const objectMember = this.findDeepObjectMember(memberChain);

      if (objectMember) {
        validator(objectMember.type, symbolIdentifier);
      }
    }
  }
}
