import AbstractValidator from '../common/AbstractValidator';
import JavaBlockValidator from './JavaBlockValidator';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../../../parser/java/java-constants';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectCategory, TypeDefinition } from '../../symbol-resolvers/common/types';
import { TypeExpectation } from '../common/types';
import { ValidatorUtils } from '../common/validator-utils';
import { ArrayType } from '../../symbol-resolvers/common/array-type';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';

export default class JavaObjectMethodValidator extends AbstractValidator<JavaSyntax.IJavaObjectMethod> {
  @Implements public validate (): void {
    const { type, name, isAbstract, block } = this.syntaxNode;
    const parentObjectTypeDefinition = this.context.objectVisitor.getCurrentVisitedObject();
    const isInterfaceMethod = parentObjectTypeDefinition.category === ObjectCategory.INTERFACE;
    const identifier = `${parentObjectTypeDefinition.name}.${name}`;

    this.focusToken(type.token);

    if (isAbstract) {
      const abstractKeywordToken = ValidatorUtils.findKeywordToken(JavaConstants.Keyword.ABSTRACT, type.token, token => token.previousTextToken);

      this.focusToken(abstractKeywordToken);

      this.check(
        parentObjectTypeDefinition.requiresImplementation,
        'Abstract methods are only allowed in abstract classes'
      );

      this.check(
        !isInterfaceMethod,
        `Interface method '${identifier}' cannot be abstract`
      );

      this.check(
        block === null,
        `Abstract method '${identifier}' cannot have an implementation`
      );
    } else {
      this.check(
        block !== null || isInterfaceMethod,
        `Non-abstract method '${identifier}' must have an implementation`
      );
    }

    if (block) {
      this.validateMethodBody();
    }
  }

  private getReturnTypeDefinition (): TypeDefinition {
    const { type } = this.syntaxNode;
    const { symbolDictionary } = this.context;
    const returnType = this.findTypeDefinition(type.namespaceChain);

    return type.arrayDimensions > 0
      ? TypeUtils.createArrayType(symbolDictionary, returnType, type.arrayDimensions)
      : returnType;
  }

  private validateMethodBody (): void {
    const { parameters, block } = this.syntaxNode;
    const { scopeManager } = this.context;

    this.expectType({
      type: this.getReturnTypeDefinition(),
      expectation: TypeExpectation.RETURN
    });

    scopeManager.enterScope();

    parameters.forEach(({ type: parameterType, name: parameterName, isFinal }) => {
      const typeDefinition = this.findTypeDefinition(parameterType.namespaceChain);

      scopeManager.addToScope(parameterName, {
        signature: {
          definition: typeDefinition
        },
        isConstant: isFinal
      });
    });

    this.validateNodeWith(JavaBlockValidator, block);
    this.resetExpectedType();
    scopeManager.exitScope();
  }
}
