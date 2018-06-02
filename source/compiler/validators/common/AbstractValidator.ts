import ScopeManager from '../../ScopeManager';
import SymbolDictionary from '../../symbol-resolvers/common/SymbolDictionary';
import { Callback } from '../../../system/types';
import { Constructor, IConstructable } from 'trampoline-framework';
import { IObjectMember, ISymbol } from '../../symbol-resolvers/common/types';
import { ISyntaxNode } from '../../../parser/common/syntax-types';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';

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
  protected findDeepObjectMember ({ type, identifier }: ISymbol<ObjectType.Definition>, memberChain: string[]): IObjectMember {
    if (TypeUtils.isDynamic(type)) {
      // If the symbol being searched is already dynamic,
      // simply return a new dynamic object member, since
      // dynamic types permit arbitrary deep member chains
      return TypeUtils.createDynamicObjectMember();
    }

    const currentChain: string[] = [];
    let searchTarget = type;

    while (searchTarget) {
      const nextMemberName = memberChain.shift();
      const objectMember = searchTarget.getObjectMember(nextMemberName);

      currentChain.push(nextMemberName);

      if (!objectMember) {
        this.report(`Could not find object member '${identifier}.${currentChain.join('.')}'`);

        return null;
      }

      if (memberChain.length === 0) {
        return objectMember;
      }

      if (TypeUtils.isDynamic(objectMember.type)) {
        // If one of the members in the chain is dynamic, return
        // a new dynamic object member immediately, since dynamic
        // types can have any of the remaining deep members
        return TypeUtils.createDynamicObjectMember();
      }

      searchTarget = objectMember.type instanceof ObjectType.Definition
        ? objectMember.type
        : null;
    }

    return null;
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
}
