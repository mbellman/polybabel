import ObjectVisitor from './ObjectVisitor';
import ScopeManager from '../../ScopeManager';
import SymbolDictionary from '../../symbol-resolvers/common/SymbolDictionary';
import ValidatorContext from './ValidatorContext';
import { Callback } from '../../../system/types';
import { Constructor, IConstructable, IHashMap } from 'trampoline-framework';
import { Dynamic, IObjectMember, TypeDefinition, ISymbol } from '../../symbol-resolvers/common/types';
import { ISyntaxNode } from '../../../parser/common/syntax-types';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';
import { ValidatorUtils } from './validator-utils';
import { IValidationHelper } from './types';

/**
 * @todo @description
 *
 * @internal
 */
interface IResolvedConstruct {
  type: TypeDefinition;
  name: string;
}

export default abstract class AbstractValidator<S extends ISyntaxNode = ISyntaxNode> {
  protected context: ValidatorContext;
  protected syntaxNode: S;
  private parentValidator: AbstractValidator;

  public constructor (context: ValidatorContext, syntaxNode: S) {
    this.context = context;
    this.syntaxNode = syntaxNode;
  }

  public forErrors (callback: Callback<string>): void {
    this.context.errors.forEach(callback);
  }

  public hasErrors (): boolean {
    return this.context.errors.length > 0;
  }

  public abstract validate (): void;

  protected assert (condition: boolean, message: string, shouldHalt: boolean = true): void {
    if (!condition) {
      this.context.errors.push(message);

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

  protected createValidationHelper (): IValidationHelper {
    return {
      symbolDictionary: this.context.symbolDictionary,
      findTypeDefinition: (namespaceChain: string[]) => this.findTypeDefinition(namespaceChain)
    };
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

  public findTypeDefinition (namespaceChain: string[]): TypeDefinition {
    const { importToSourceFileMap, objectVisitor, symbolDictionary, scopeManager, file } = this.context;
    const outerName = namespaceChain[0];
    const isImportedSymbol = outerName in importToSourceFileMap;
    const foundParentObjectMember = objectVisitor.findParentObjectMember(outerName);
    const shouldSearchDeep = namespaceChain.length > 1;
    let outerType: TypeDefinition;

    if (foundParentObjectMember) {
      outerType = foundParentObjectMember.type;
    } else if (isImportedSymbol) {
      const sourceFile = importToSourceFileMap[outerName];

      outerType = symbolDictionary.getSymbol(sourceFile + outerName).type;
    } else {
      outerType = scopeManager.getScopedValue(outerName);

      if (!outerType) {
        // If the outer name isn't in scope, stop here
        this.reportUnknownIdentifier(outerName);

        return TypeUtils.createSimpleType(Dynamic);
      }
    }

    if (shouldSearchDeep) {
      if (ValidatorUtils.isDynamicType(outerType)) {
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

        if (ValidatorUtils.isDynamicType(nextObjectMember.type)) {
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

  protected getImmediateNamespacedIdentifier (identifier: string): string {
    const { namespaceStack } = this.context;

    return `${namespaceStack[namespaceStack.length - 1]}.${identifier}`;
  }

  protected getNamespacedIdentifier (identifier: string): string {
    return this.context.namespaceStack.concat(identifier).join('.');
  }

  protected getTypeInCurrentNamespace (name: string): TypeDefinition {
    const parentObjectMember = this.context.objectVisitor.findParentObjectMember(name);

    if (parentObjectMember) {
      return parentObjectMember.type;
    } else {
      const { symbolDictionary, file } = this.context;

      return symbolDictionary.getSymbol(file + name).type;
    }
  }

  protected report (message: string): void {
    this.context.errors.push(message);
  }

  /**
   * Validates a provided syntax node using an AbstractValidator
   * subclass. Hands off both the instance's ScopeManager and its
   * errors list so both can be used and manipulated by reference.
   */
  protected validateNodeWith <T extends ISyntaxNode>(Validator: Constructor<AbstractValidator<T>>, syntaxNode: T): void {
    const validator = new (Validator as IConstructable<AbstractValidator>)(this.context, syntaxNode);

    validator.parentValidator = this;
    validator.context = this.context;

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
