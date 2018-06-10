import ValidatorContext from './ValidatorContext';
import { Callback } from '../../../system/types';
import { Constructor, IConstructable } from 'trampoline-framework';
import { Dynamic, TypeDefinition } from '../../symbol-resolvers/common/types';
import { ISyntaxNode } from '../../../parser/common/syntax-types';
import { IToken } from '../../../tokenizer/types';
import { IValidationError, IValidationHelper } from './types';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';
import { TypeValidation } from './type-validation';
import { ValidatorUtils } from './validator-utils';

export default abstract class AbstractValidator<S extends ISyntaxNode = ISyntaxNode> {
  protected context: ValidatorContext;
  protected syntaxNode: S;
  protected validationHelper: IValidationHelper;
  private focusedToken: IToken;
  private parentValidator: AbstractValidator;

  public constructor (context: ValidatorContext, syntaxNode: S) {
    this.context = context;
    this.syntaxNode = syntaxNode;
    this.focusedToken = syntaxNode.token;

    this.validationHelper = {
      symbolDictionary: this.context.symbolDictionary,
      findTypeDefinition: (namespaceChain: string[]) => this.findTypeDefinition(namespaceChain)
    };
  }

  public forErrors (callback: Callback<IValidationError>): void {
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
    const { type: expectedTypeDefinition, expectation } = this.context.getCurrentExpectedType();
    const typeDescription = ValidatorUtils.getTypeDescription(type);
    const expectedTypeDescription = ValidatorUtils.getTypeDescription(expectedTypeDefinition);

    this.check(
      TypeValidation.typeMatches(type, expectedTypeDefinition),
      `'${typeDescription}' does not match expected ${expectation} '${expectedTypeDescription}'`
    );
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
      return parentObjectMember.type;
    }

    const importSourceFile = this.context.getImportSourceFile(name);

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

  protected focus (token: IToken): void {
    this.focusedToken = token || this.focusedToken;
  }

  protected getNamespacedIdentifier (identifier: string): string {
    return `${this.context.getCurrentNamespace()}.${identifier}`;
  }

  protected report (message: string): void {
    this.context.errors.push({
      message,
      token: this.focusedToken
    });
  }

  /**
   * Validates a provided syntax node using an AbstractValidator
   * subclass. Hands off both the instance's ScopeManager and its
   * errors list so both can be used and manipulated by reference.
   */
  protected validateNodeWith <T extends ISyntaxNode>(Validator: Constructor<AbstractValidator<T>>, syntaxNode: T): void {
    const validator = new (Validator as IConstructable<AbstractValidator>)(this.context, syntaxNode);

    validator.parentValidator = this;

    try {
      validator.validate();
    } catch (e) {
      this.report(e.toString());
    }
  }

  private reportNonObjectMemberAccess (name: string): void {
    this.report(`Identifier '${name}' does not have any members`);
  }

  private reportUnknownIdentifier (name: string): void {
    this.report(`Unknown identifier '${name}'`);
  }

  private reportUnknownMember (source: string, member: string): void {
    this.report(`Member '${member}' not found on '${source}'`);
  }
}
