import ValidatorContext from './ValidatorContext';
import { Callback } from '../../../system/types';
import { Constructor, IConstructable } from 'trampoline-framework';
import { Dynamic, IObjectMember, IScopedReference, ITypeConstraint, TypeDefinition } from '../../symbol-resolvers/common/types';
import { DynamicTypeConstraint } from '../../native-type-constraints/common';
import { GlobalTypeConstraintMap } from '../../native-type-constraints/global';
import { IExpectedTypeConstraint, IValidatorContextFlags, IValidatorError, TypeExpectation } from './types';
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

  protected checkIfTypeConstraintMatchesExpected (constraint: ITypeConstraint): void {
    this.context.lastCheckedTypeConstraint = constraint;

    if (this.context.flags.shouldAllowAnyType) {
      this.setFlags({
        shouldAllowAnyType: false
      });

      return;
    }

    const { expectedTypeConstraintStack } = this.context;
    const { constraint: expectedTypeconstraint, expectation } = expectedTypeConstraintStack[expectedTypeConstraintStack.length - 1];
    const typeDescription = ValidatorUtils.getTypeConstraintDescription(constraint);
    const expectedTypeDescription = ValidatorUtils.getTypeConstraintDescription(expectedTypeconstraint);

    this.check(
      TypeValidation.typeConstraintMatches(constraint, expectedTypeconstraint),
      `Expected ${expectation} '${expectedTypeDescription}'; got '${typeDescription}' instead`
    );
  }

  protected createTypeConstraint (namespaceChain: string[], arrayDimensions: number): ITypeConstraint {
    const { symbolDictionary } = this.context;
    const { typeDefinition } = this.findOriginalTypeConstraint(namespaceChain);

    if (arrayDimensions > 0) {
      return TypeUtils.createArrayTypeConstraint(symbolDictionary, { typeDefinition }, arrayDimensions);
    } else {
      return { typeDefinition };
    }
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

  protected expectType (expectedTypeConstraint: IExpectedTypeConstraint): void {
    this.context.flags.shouldAllowAnyType = false;

    this.context.expectedTypeConstraintStack.push(expectedTypeConstraint);
  }

  public findReferenceOrMember (name: string): IScopedReference | IObjectMember {
    return (
      this.context.scopeManager.getScopedReference(name) ||
      this.context.objectVisitor.findParentObjectMember(name)
    );
  }

  /**
   * Attempts to find and return the original type constraint for a
   * given symbol or namespaced type. The outer name in the namespace
   * chain represents the top-level object or namespace within which
   * the desired symbol or namespaced type should be found. If the
   * namespace chain contains only one value, the constraint of that
   * of that top-level object or namespace is returned. Otherwise,
   * the chain is traversed until either an invalid lookup terminates
   * the search, or the desired symbol or construct is found.
   *
   * If the found symbol or namespaced type is in fact not an original
   * type constraint, but merely a construct matching some constraint,
   * we report an error. This helps enforce that type annotations use
   * actual types and not just random constructs.
   *
   * When the outer name is an unknown identifier, or if invalid lookups
   * lookups occur, we report the error and return a dynamic constraint
   * as a graceful fallback.
   */
  public findOriginalTypeConstraint (namespaceChain: string[]): ITypeConstraint {
    const outerName = namespaceChain[0];
    const outerTypeConstraint = this.findTypeConstraintByName(namespaceChain[0]);
    const shouldSearchDeep = namespaceChain.length > 1;

    if (shouldSearchDeep) {
      if (ValidatorUtils.isSimpleTypeOf(Dynamic, outerTypeConstraint.typeDefinition)) {
        // If the outer type of the namespace chain is already
        // dynamic, simply return a dynamic type constraint, since
        // dynamic types permit arbitrarily deep member chains
        return DynamicTypeConstraint;
      }

      const currentNamespaceChain = [ outerName ];
      let nextConstraint = outerTypeConstraint;
      let chainIndex = 0;

      while (nextConstraint) {
        if (!(nextConstraint.typeDefinition instanceof ObjectType.Definition)) {
          // If the next type in the deep search isn't an object
          // type, we can't go any further in the chain.
          this.reportNonObjectMemberAccess(`${currentNamespaceChain.join('.')}'`);

          return DynamicTypeConstraint;
        }

        const nextMemberName = namespaceChain[++chainIndex];
        const nextObjectMember = nextConstraint.typeDefinition.getObjectMember(nextMemberName);

        if (!nextObjectMember) {
          this.reportUnknownMember(`${currentNamespaceChain.join('.')}`, nextMemberName);

          return DynamicTypeConstraint;
        }

        if (chainIndex === namespaceChain.length - 1) {
          // End of namespace chain reached!
          const { constraint } = nextObjectMember;

          if (!constraint.isOriginal) {
            this.reportNonType(namespaceChain.join('.'));

            return DynamicTypeConstraint;
          }

          return constraint;
        }

        if (ValidatorUtils.isSimpleTypeOf(Dynamic, nextObjectMember.constraint.typeDefinition)) {
          // If the next member in the chain is dynamic, return
          // a new dynamic type immediately, since dynamic types
          // can have any of the remaining deep members
          return DynamicTypeConstraint;
        }

        currentNamespaceChain.push(nextMemberName);

        nextConstraint = nextObjectMember.constraint;
      }

      return DynamicTypeConstraint;
    } else if (!outerTypeConstraint.isOriginal) {
      this.reportNonType(outerName);

      return DynamicTypeConstraint;
    } else {
      return outerTypeConstraint;
    }
  }

  /**
   * @todo @description
   */
  public findTypeConstraintByName (name: string): ITypeConstraint {
    const nativeTypeConstraint = this.context.nativeTypeConstraintMap[name];

    if (nativeTypeConstraint) {
      // If the name corresponds to a native type as specified
      // by a language-native type map, return that before
      // anything else
      return nativeTypeConstraint;
    }

    const { scopeManager, objectVisitor, symbolDictionary, file } = this.context;
    const scopedReference = scopeManager.getScopedReference(name);

    if (scopedReference) {
      // If the name is in scope, the scoped type definition
      // value should take precedence over other references
      return scopedReference.constraint;
    }

    const parentObjectMember = objectVisitor.findParentObjectMember(name);

    if (parentObjectMember) {
      // If the name is a parent object member, we return
      // its type constraint
      return parentObjectMember.constraint;
    }

    const symbol = symbolDictionary.getDefinedSymbol(file + name);

    if (symbol) {
      // If the name is a symbol in the current file, we
      // return its type
      return symbol.constraint;
    }

    const globalTypeConstraint = GlobalTypeConstraintMap[name];

    if (globalTypeConstraint) {
      // If the name is a global type constraint (i.e. native
      // to JavaScript) we return its mapped type
      return globalTypeConstraint;
    }

    this.reportUnknownIdentifier(name);

    return DynamicTypeConstraint;
  }

  protected focusToken (token: IToken): void {
    this.focusedToken = token || this.focusedToken;
  }

  protected getCurrentNamespace (): string {
    const { namespaceStack } = this.context;

    return namespaceStack[namespaceStack.length - 1];
  }

  protected getLastExpectedTypeConstraintFor (typeExpectation: TypeExpectation): ITypeConstraint {
    const { expectedTypeConstraintStack } = this.context;

    for (let i = expectedTypeConstraintStack.length - 1; i >= 0; i--) {
      const { expectation, constraint } = expectedTypeConstraintStack[i];

      if (expectation === typeExpectation) {
        return constraint;
      }
    }

    return DynamicTypeConstraint;
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

  protected reportInvalidFunctionArguments (functionName: string, argumentTypeConstraints: ITypeConstraint[]): void {
    const argumentTypeDescriptions = argumentTypeConstraints.map(argumentTypeConstraint => `'${ValidatorUtils.getTypeConstraintDescription(argumentTypeConstraint)}'`);

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

  protected reportNonType (name: string): void {
    this.report(`'${name}' is not a type`);
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
    this.context.expectedTypeConstraintStack.pop();
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
