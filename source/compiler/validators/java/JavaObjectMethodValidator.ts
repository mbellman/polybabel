import AbstractValidator from '../common/AbstractValidator';
import JavaBlockValidator from './JavaBlockValidator';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../../../parser/java/java-constants';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectCategory, Void, ITypeConstraint } from '../../symbol-resolvers/common/types';
import { TypeExpectation } from '../common/types';
import { ValidatorUtils } from '../common/validator-utils';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';

export default class JavaObjectMethodValidator extends AbstractValidator<JavaSyntax.IJavaObjectMethod> {
  private ownReturnTypeConstraint: ITypeConstraint;

  @Implements public validate (): void {
    const { type, name, isAbstract, isConstructor, block } = this.syntaxNode;
    const parentObjectTypeDefinition = this.context.objectVisitor.getCurrentVisitedObject();
    const isInterfaceMethod = parentObjectTypeDefinition.category === ObjectCategory.INTERFACE;
    const identifier = `${parentObjectTypeDefinition.name}.${name}`;

    this.focusToken(type.token);

    this.ownReturnTypeConstraint = this.getReturnTypeConstraint();

    if (isConstructor) {
      this.check(
        name === parentObjectTypeDefinition.name,
        `Constructor '${name}' must match the name of its class, '${parentObjectTypeDefinition.name}'`
      );
    }

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

  private getReturnTypeConstraint (): ITypeConstraint {
    const { type } = this.syntaxNode;
    const { symbolDictionary } = this.context;
    const returnTypeConstraint = this.findOriginalTypeConstraint(type.namespaceChain);

    if (type.arrayDimensions > 0) {
      return TypeUtils.createArrayTypeConstraint(symbolDictionary, returnTypeConstraint, type.arrayDimensions);
    } else {
      return {
        typeDefinition: returnTypeConstraint.typeDefinition
      };
    }
  }

  private validateMethodBody (): void {
    const { isConstructor, isStatic, parameters, block } = this.syntaxNode;
    const { scopeManager } = this.context;
    const lastStatement = block.nodes[block.nodes.length - 1];

    this.setFlags({
      shouldAllowReturnValue: !isConstructor,
      mustReturnValue: !isConstructor && !ValidatorUtils.isSimpleTypeOf(Void, this.ownReturnTypeConstraint.typeDefinition),
      shouldAllowReturn: true,
      shouldAllowInstanceKeywords: !isStatic
    });

    this.expectType({
      constraint: this.ownReturnTypeConstraint,
      expectation: TypeExpectation.RETURN
    });

    scopeManager.enterScope();

    parameters.forEach(({ type: parameterType, name: parameterName, isFinal }) => {
      const { typeDefinition } = this.findOriginalTypeConstraint(parameterType.namespaceChain);

      scopeManager.addToScope(parameterName, {
        constraint: { typeDefinition },
        isConstant: isFinal
      });
    });

    this.validateNodeWith(JavaBlockValidator, block);
    this.resetExpectedType();

    if (lastStatement && isConstructor) {
      this.focusToken(lastStatement.token);

      this.check(
        // TODO turn this into a utility/create java-validator-utils
        !!lastStatement.leftSide
          ? lastStatement.leftSide.node !== JavaSyntax.JavaSyntaxNode.INSTRUCTION
          : true,
        `Return statements are not allowed in the top-level block of a constructor`
      );
    }

    scopeManager.exitScope();
  }
}
