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
  protected syntaxNode: S;
  private namespaceStack: string[] = [];
  private errors: string[] = [];

  public constructor (symbolDictionary: SymbolDictionary, syntaxNode: S) {
    this.symbolDictionary = symbolDictionary;
    this.syntaxNode = syntaxNode;
  }

  public forErrors (callback: Callback<string>): void {
    this.errors.forEach(error => callback(error));
  }

  public hasErrors (): boolean {
    return this.errors.length > 0;
  }

  public abstract validate (): void;

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

  protected enterNamespace (namespace: string): void {
    this.namespaceStack.push(namespace);
  }

  protected exitNamespace (): void {
    this.namespaceStack.pop();
  }

  protected getTypeDefinitionInCurrentNamespace (typeName: string): TypeDefinition {
    const symbolIdentifier = this.namespaceStack.length > 0
      ? `${this.namespaceStack.join('.')}.${typeName}`
      : typeName;

    return this.symbolDictionary.getSymbolType(symbolIdentifier);
  }

  /**
   * Retrieves a deeply-nested object member using a provided member
   * chain, starting with the top-level object. If the object itself
   * is not in scope, or if at any point in the chain a member isn't
   * found, we log the error and return null.
   *
   * @todo Allow optional visibility restrictions
   */
  protected findDeepObjectMember (memberChain: string[]): IObjectMember {
    const objectName = memberChain.shift();

    if (!this.scopeManager.isInScope(objectName)) {
      this.reportUnknownIdentifier(objectName);

      return null;
    }

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
        this.reportNonObjectType(`${identifier}.${currentChain.join('.')}'`);

        return null;
      }

      const nextMemberName = memberChain.shift();
      const objectMember = searchTarget.getObjectMember(nextMemberName);

      if (!objectMember) {
        this.reportUnknownMember(`${identifier}.${currentChain.join('.')}`, nextMemberName);

        return null;
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

      currentChain.push(nextMemberName);

      searchTarget = objectMember.type;
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
    const validator = new (Validator as IConstructable<AbstractValidator>)(this.symbolDictionary, syntaxNode);

    validator.scopeManager = this.scopeManager;
    validator.errors = this.errors;

    try {
      validator.validate();
    } catch (e) {
      this.report(e.toString());
    }
  }

  protected validateType (namespaceChain: string[], validator: TypeValidator): void {
    const outerName = namespaceChain[0];
    const symbolIdentifier = namespaceChain.join('.');

    if (!this.scopeManager.isInScope(outerName)) {
      this.reportUnknownIdentifier(outerName);

      return;
    }

    if (namespaceChain.length === 1) {
      const objectSymbol = this.symbolDictionary.getSymbol(outerName);
      const { type, identifier } = objectSymbol;

      validator(type, identifier);
    } else {
      const objectMember = this.findDeepObjectMember(namespaceChain);

      if (objectMember) {
        validator(objectMember.type, symbolIdentifier);
      }
    }
  }

  private reportNonObjectType (name: string): void {
    this.report(`Identifier '${name}' does not have any members`);
  }

  private reportUnknownIdentifier (name: string): void {
    this.report(`Unknown identifier '${name}'`);
  }

  private reportUnknownMember (source: string, member: string): void {
    this.report(`Member '${member}' not found on '${source}'`);
  }
}
