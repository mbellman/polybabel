import ValidatorContext from './ValidatorContext';
import { Callback } from '../../../system/types';
import { Constructor, IConstructable } from 'trampoline-framework';
import { Dynamic, TypeDefinition, IScopedReference, IObjectMember } from '../../symbol-resolvers/common/types';
import { GlobalNativeTypeMap } from '../../native-type-maps/global';
import { IExpectedType, IValidatorError, TypeExpectation, IValidatorContextFlags } from './types';
import { ISyntaxNode } from '../../../parser/common/syntax-types';
import { IToken } from '../../../tokenizer/types';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';
import { TypeValidation } from './type-validation';
import { ValidatorUtils } from './validator-utils';

export default abstract class AbstractValidator<S extends ISyntaxNode = ISyntaxNode> {
  protected context: ValidatorContext;
  protected syntaxNode: S;
  private focusedToken: IToken;

  public constructor (context: ValidatorContext, syntaxNode: S) {
    this.context = context;
    this.syntaxNode = syntaxNode;
    this.focusedToken = syntaxNode.token;
  }

  public forErrors (callback: Callback<IValidatorError>): void {
    this.context.errors.forEach(callback);
  }

  public hasErrors (): boolean {
    return this.context.errors.length > 0;
  }

  public abstract validate (): void;

  protected assert (condition: boolean, message: string, shouldHalt: boolean = true): void {
    if (!condition) {
      this.report(message);

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

  protected checkIfTypeMatchesExpected (type: TypeDefinition): void {
    if (this.context.flags.shouldAllowAnyType) {
      this.setFlags({
        shouldAllowAnyType: false
      });

      return;
    }

    const { expectedTypeStack } = this.context;
    const { type: expectedTypeDefinition, expectation } = expectedTypeStack[expectedTypeStack.length - 1];
    const typeDescription = ValidatorUtils.getTypeDescription(type);
    const expectedTypeDescription = ValidatorUtils.getTypeDescription(expectedTypeDefinition);

    this.check(
      TypeValidation.typeMatches(type, expectedTypeDefinition),
      `Expected ${expectation} '${expectedTypeDescription}'; got '${typeDescription}' instead`
    );
  }

  protected enterNamespace (name: string): void {
    this.context.namespaceStack.push(name);
  }

  protected exitNamespace (): void {
    this.context.namespaceStack.pop();
  }

  protected expectsType (): boolean {
    return !this.context.flags.shouldAllowAnyType;
  }

  protected expectType (expectedType: IExpectedType): void {
    this.context.flags.shouldAllowAnyType = false;

    this.context.expectedTypeStack.push(expectedType);
  }

  public findReferenceOrMember (name: string): IScopedReference | IObjectMember {
    return (
      this.context.scopeManager.getScopedReference(name) ||
      this.context.objectVisitor.findParentObjectMember(name)
    );
  }

  /**
   * Attempts to find and return the type definition for a given
   * symbol or construct identified by namespace chain. The outer
   * name in the chain represents the top-level object or namespace
   * within which the desired symbol or construct can be found.
   * If the namespace chain contains only one value, the type of
   * that top-level object or namespace is returned. Otherwise, the
   * chain is traversed until either an invalid lookup terminates
   * the search, or the desired symbol or construct is found.
   *
   * When the outer name is an unknown identifier, or if invalid
   * lookups occur, we report the error and return a dynamic type
   * to gracefully recover and accommodate checks dependent on the
   * found type definition.
   */
  public findTypeDefinition (namespaceChain: string[]): TypeDefinition {
    const outerName = namespaceChain[0];
    const outerType = this.findTypeDefinitionByName(namespaceChain[0]);
    const shouldSearchDeep = namespaceChain.length > 1;

    if (shouldSearchDeep) {
      if (ValidatorUtils.isSimpleTypeOf(Dynamic, outerType)) {
        // If the outer type of the namespace chain is already
        // dynamic, simply return a new dynamic type, since
        // dynamic types permit arbitrarily deep member chains
        return TypeUtils.createSimpleType(Dynamic);
      }

      const currentNamespaceChain = [ outerName ];
      let nextType = outerType;
      let chainIndex = 0;

      while (nextType) {
        if (!(nextType instanceof ObjectType.Definition)) {
          // If the next type in the deep search isn't an object
          // type, we can't go any further in the chain.
          this.reportNonObjectMemberAccess(`${currentNamespaceChain.join('.')}'`);

          return TypeUtils.createSimpleType(Dynamic);
        }

        const nextMemberName = namespaceChain[++chainIndex];
        const nextObjectMember = nextType.getObjectMember(nextMemberName);

        if (!nextObjectMember) {
          this.reportUnknownMember(`${currentNamespaceChain.join('.')}`, nextMemberName);

          return TypeUtils.createSimpleType(Dynamic);
        }

        if (chainIndex === namespaceChain.length - 1) {
          // End of namespace chain reached; return the type definition
          return nextObjectMember.type;
        }

        if (ValidatorUtils.isSimpleTypeOf(Dynamic, nextObjectMember.type)) {
          // If the next member in the chain is dynamic, return
          // a new dynamic type immediately, since dynamic types
          // can have any of the remaining deep members
          return TypeUtils.createSimpleType(Dynamic);
        }

        currentNamespaceChain.push(nextMemberName);

        nextType = nextObjectMember.type;
      }

      return TypeUtils.createSimpleType(Dynamic);
    } else {
      return outerType;
    }
  }

  /**
   * @todo @description
   */
  public findTypeDefinitionByName (name: string): TypeDefinition {
    const nativeType = this.context.nativeTypeMap[name];

    if (nativeType) {
      // If the name corresponds to a native type as specified
      // by a language-native type map, return that before
      // anything else
      return nativeType;
    }

    const { scopeManager, objectVisitor, symbolDictionary, file } = this.context;
    const scopedReference = scopeManager.getScopedReference(name);

    if (scopedReference) {
      // If the name is in scope, the scoped type definition
      // value should take precedence over other references
      //
      // TODO: Return full signature
      return scopedReference.signature.definition;
    }

    const parentObjectMember = objectVisitor.findParentObjectMember(name);

    if (parentObjectMember) {
      // If the name is a parent object member, we return
      // its type
      return parentObjectMember.type;
    }

    const symbol = symbolDictionary.getDefinedSymbol(file + name);

    if (symbol) {
      // If the name is a symbol in the current file, we
      // return its type
      return symbol.type;
    }

    const globalNativeType = GlobalNativeTypeMap[name];

    if (globalNativeType) {
      // If the name is a global native type (i.e. to JavaScript)
      // we return its mapped type
      return globalNativeType;
    }

    this.reportUnknownIdentifier(name);

    return TypeUtils.createSimpleType(Dynamic);
  }

  protected focusToken (token: IToken): void {
    this.focusedToken = token || this.focusedToken;
  }

  protected getCurrentNamespace (): string {
    const { namespaceStack } = this.context;

    return namespaceStack[namespaceStack.length - 1];
  }

  protected getLastExpectedTypeFor (typeExpectation: TypeExpectation): TypeDefinition {
    const { expectedTypeStack } = this.context;

    for (let i = expectedTypeStack.length - 1; i >= 0; i--) {
      const { expectation, type } = expectedTypeStack[i];

      if (expectation === typeExpectation) {
        return type;
      }
    }

    return TypeUtils.createSimpleType(Dynamic);
  }

  protected getNamespacedIdentifier (identifier: string): string {
    return `${this.getCurrentNamespace()}.${identifier}`;
  }

  protected report (message: string): void {
    this.context.errors.push({
      message,
      token: this.focusedToken
    });
  }

  protected reportInvalidFunctionArguments (functionName: string, argumentTypes: TypeDefinition[]): void {
    const argumentTypeDescriptions = argumentTypes.map(argumentType => `'${ValidatorUtils.getTypeDescription(argumentType)}'`);

    this.report(`'${functionName}' called with invalid arguments ${argumentTypeDescriptions.join(', ')}`);
  }

  protected reportNonConstructableInstantiation (name: string): void {
    this.report(`Object '${name}' cannot be constructed`);
  }

  protected reportNonConstructor (name: string): void {
    this.report(`'${name}' is not a constructor`);
  }

  protected reportNonFunctionCalled (name: string): void {
    this.report(`'${name}' is not a function`);
  }

  protected reportNonObjectMemberAccess (name: string): void {
    this.report(`Identifier '${name}' does not have any members`);
  }

  protected reportUnknownIdentifier (name: string): void {
    this.report(`Unknown identifier '${name}'`);
  }

  protected reportUnknownMember (source: string, memberName: string): void {
    this.report(`Unknown member '${source}.${memberName}'`);
  }

  protected reportUnreachableCode (): void {
    this.report('Unreachable code detected');
  }

  protected resetExpectedType (): void {
    this.context.expectedTypeStack.pop();
  }

  protected setFlags (flags: Partial<IValidatorContextFlags>): void {
    Object.assign(this.context.flags, flags);
  }

  /**
   * Validates a provided syntax node using an AbstractValidator
   * subclass, passing the current validator context along so it
   * can be shared between ancestor and descendant validators.
   */
  protected validateNodeWith <T extends ISyntaxNode, N extends T>(Validator: Constructor<AbstractValidator<T>>, syntaxNode: N): void {
    const validator = new (Validator as IConstructable<AbstractValidator>)(this.context, syntaxNode);

    this.focusToken(syntaxNode.token);

    try {
      validator.validate();
    } catch (e) {
      this.report(e.toString());
    }
  }
}
