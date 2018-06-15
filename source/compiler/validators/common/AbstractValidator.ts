import ValidatorContext from './ValidatorContext';
import { Callback } from '../../../system/types';
import { Constructor, IConstructable } from 'trampoline-framework';
import { Dynamic, TypeDefinition } from '../../symbol-resolvers/common/types';
import { ISyntaxNode } from '../../../parser/common/syntax-types';
import { IToken } from '../../../tokenizer/types';
import { IValidatorError, IValidatorHelper, IExpectedType, TypeExpectation } from './types';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';
import { TypeValidation } from './type-validation';
import { ValidatorUtils } from './validator-utils';

export default abstract class AbstractValidator<S extends ISyntaxNode = ISyntaxNode> {
  protected context: ValidatorContext;
  protected syntaxNode: S;
  private focusedToken: IToken;
  private parentValidator: AbstractValidator;

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

  /**
   * Temporarily allows any type to be checked against the current
   * expected type without errors. As soon as a type is checked,
   * the original expected type becomes active again.
   */
  protected allowAnyType (): void {
    this.context.shouldAllowAnyType = true;
  }

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
    if (!this.context.shouldAllowAnyType) {
      this.context.shouldAllowAnyType = false;

      return;
    }

    const { expectedTypeStack } = this.context;
    const { type: expectedTypeDefinition, expectation } = expectedTypeStack[expectedTypeStack.length - 1];
    const typeDescription = ValidatorUtils.getTypeDescription(type);
    const expectedTypeDescription = ValidatorUtils.getTypeDescription(expectedTypeDefinition);

    this.check(
      TypeValidation.typeMatches(type, expectedTypeDefinition),
      `'${typeDescription}' does not match expected ${expectation} '${expectedTypeDescription}'`
    );
  }

  protected enterNamespace (name: string): void {
    this.context.namespaceStack.push(name);
  }

  protected exitNamespace (): void {
    this.context.namespaceStack.pop();
  }

  protected expectType (expectedType: IExpectedType): void {
    this.context.shouldAllowAnyType = false;

    this.context.expectedTypeStack.push(expectedType);
  }

  protected expectsType (): boolean {
    return !this.context.shouldAllowAnyType;
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

  public findTypeDefinitionByName (name: string): TypeDefinition {
    const scopedType = this.context.scopeManager.getScopedValue(name);
    const { objectVisitor, symbolDictionary, file } = this.context;

    if (scopedType) {
      // If the name is in scope, the scoped type definition
      // value should take precedence over all else
      return scopedType;
    }

    const parentObjectMember = objectVisitor.findParentObjectMember(name);

    if (parentObjectMember) {
      // If the name is a parent object member, return its type
      // TODO: Check member visibility
      return parentObjectMember.type;
    }

    const importSourceFile = this.getImportSourceFile(name);

    if (importSourceFile) {
      // If the name is an import, we return its symbol type
      return symbolDictionary.getSymbolType(importSourceFile + name);
    }

    const symbol = symbolDictionary.getDefinedSymbol(file + name);

    if (symbol) {
      // If all else fails, return the symbol in the current file
      return symbol.type;
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

    return null;
  }

  protected getImportSourceFile (importName: string): string {
    return this.context.importToSourceFileMap[importName];
  }

  protected getNamespacedIdentifier (identifier: string): string {
    return `${this.getCurrentNamespace()}.${identifier}`;
  }

  protected mapImportToSourceFile (name: string, sourceFile: string): void {
    this.context.importToSourceFileMap[name] = sourceFile;
  }

  protected report (message: string): void {
    this.context.errors.push({
      message,
      token: this.focusedToken
    });
  }

  protected reportNonObjectMemberAccess (name: string): void {
    this.report(`Identifier '${name}' does not have any members`);
  }

  protected reportUnknownIdentifier (name: string): void {
    this.report(`Unknown identifier '${name}'`);
  }

  protected reportUnknownMember (source: string, member: string): void {
    this.report(`Member '${member}' not found on '${source}'`);
  }

  protected resetExpectedType (): void {
    this.context.expectedTypeStack.pop();
  }

  /**
   * Validates a provided syntax node using an AbstractValidator
   * subclass. Hands off both the instance's ScopeManager and its
   * errors list so both can be used and manipulated by reference.
   */
  protected validateNodeWith <T extends ISyntaxNode, N extends T>(Validator: Constructor<AbstractValidator<T>>, syntaxNode: N): void {
    const validator = new (Validator as IConstructable<AbstractValidator>)(this.context, syntaxNode);

    validator.parentValidator = this;

    try {
      validator.validate();
    } catch (e) {
      this.report(e.toString());
    }
  }
}
