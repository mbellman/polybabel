import ScopeManager from '../../ScopeManager';
import SymbolDictionary from '../../symbol-resolvers/common/SymbolDictionary';
import { Callback } from '../../../system/types';
import { Constructor, IConstructable } from 'trampoline-framework';
import { IObjectMember, TypeDefinition, Dynamic } from '../../symbol-resolvers/common/types';
import { ISyntaxNode } from '../../../parser/common/syntax-types';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';
import { ValidatorUtils } from './validator-utils';

/**
 * @internal
 */
interface IResolvedConstruct {
  type: TypeDefinition;
  name: string;
}

export default abstract class AbstractValidator<S extends ISyntaxNode = ISyntaxNode> {
  protected scopeManager: ScopeManager = new ScopeManager();
  protected symbolDictionary: SymbolDictionary;
  protected syntaxNode: S;
  private errors: string[] = [];
  private namespaceStack: string[] = [];
  private parentValidator: AbstractValidator;

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
   * Asserts without halting the validator, even on failure.
   */
  protected check (condition: boolean, message: string): void {
    this.assert(condition, message, false);
  }

  protected enterNamespace (namespace: string): void {
    this.namespaceStack.push(namespace);
  }

  protected exitNamespace (): void {
    this.namespaceStack.pop();
  }

  /**
   * Retrieves a deeply-nested object member using a provided member
   * chain, starting with the top-level object. If the object itself
   * is not in scope, or if at any point in the chain a member isn't
   * found, we log the error and return a dynamically-typed object
   * member. In this case validation can proceed without explicitly
   * invalidating any checks on the member type, though compilation
   * will nevertheless fail.
   *
   * @todo Allow optional visibility restrictions
   */
  protected findDeepObjectMember (memberChain: string[]): IObjectMember {
    const objectName = memberChain.shift();

    if (!this.scopeManager.isInScope(objectName)) {
      this.reportUnknownIdentifier(objectName);

      return TypeUtils.createDynamicObjectMember();
    }

    const { type, identifier } = this.symbolDictionary.getSymbol(objectName);

    if (ValidatorUtils.isDynamicType(type)) {
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

        return TypeUtils.createDynamicObjectMember();
      }

      const nextMemberName = memberChain.shift();
      const objectMember = searchTarget.getObjectMember(nextMemberName);

      if (!objectMember) {
        this.reportUnknownMember(`${identifier}.${currentChain.join('.')}`, nextMemberName);

        return TypeUtils.createDynamicObjectMember();
      }

      if (memberChain.length === 0) {
        return objectMember;
      }

      if (ValidatorUtils.isDynamicType(objectMember.type)) {
        // If one of the members in the chain is dynamic, return
        // a new dynamic object member immediately, since dynamic
        // types can have any of the remaining deep members
        return TypeUtils.createDynamicObjectMember();
      }

      currentChain.push(nextMemberName);

      searchTarget = objectMember.type;
    }

    return TypeUtils.createDynamicObjectMember();
  }

  /**
   * @todo @description
   */
  protected findParentNode (node: any): ISyntaxNode {
    if (this.syntaxNode.node === node) {
      return this.syntaxNode;
    }

    if (this.parentValidator) {
      return this.parentValidator.findParentNode(node);
    }

    return null;
  }

  protected findResolvedConstruct (namespaceChain: string[]): IResolvedConstruct {
    const outerName = namespaceChain[0];

    if (!this.scopeManager.isInScope(outerName)) {
      this.reportUnknownIdentifier(outerName);
    }

    if (namespaceChain.length === 1) {
      const objectSymbol = this.symbolDictionary.getSymbol(outerName);
      const { type, identifier } = objectSymbol;

      return {
        type,
        name: identifier
      };
    } else {
      const objectMember = this.findDeepObjectMember(namespaceChain);
      const name = namespaceChain.join('.');

      const type = objectMember
        ? objectMember.type
        : TypeUtils.createSimpleType(Dynamic);

      return { type, name };
    }
  }

  protected findResolvedConstructInCurrentNamespace (identifier: string): IResolvedConstruct {
    const namespaceChain = this.namespaceStack.concat(identifier);

    return this.findResolvedConstruct(namespaceChain);
  }

  protected getNamespacedIdentifier (identifier: string): string {
    return this.namespaceStack.concat(identifier).join('.');
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

    validator.parentValidator = this;
    validator.namespaceStack = this.namespaceStack;
    validator.scopeManager = this.scopeManager;
    validator.errors = this.errors;

    try {
      validator.validate();
    } catch (e) {
      this.report(e.toString());
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
