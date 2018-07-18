import AbstractValidator from '../common/AbstractValidator';
import JavaBlockValidator from './JavaBlockValidator';
import { Implements } from 'trampoline-framework';
import { ITypeConstraint, ObjectCategory, Void } from '../../symbol-resolvers/common/types';
import { JavaConstants } from '../../../parser/java/java-constants';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { TypeExpectation } from '../common/types';
import { ValidatorUtils } from '../common/validator-utils';

export default class JavaObjectMethodValidator extends AbstractValidator<JavaSyntax.IJavaObjectMethod> {
  private ownReturnTypeConstraint: ITypeConstraint;

  @Implements public validate (): void {
    const { type, name, isAbstract, isConstructor, block } = this.syntaxNode;
    const parentObjectTypeDefinition = this.context.objectVisitor.getCurrentVisitedObject();
    const isInterfaceMethod = parentObjectTypeDefinition.category === ObjectCategory.INTERFACE;
    const identifier = `${parentObjectTypeDefinition.name}.${name}`;

    this.focusTokenRange(type.tokenRange);

    this.ownReturnTypeConstraint = this.createTypeConstraint(type.namespaceChain, type.arrayDimensions);

    if (isConstructor) {
      this.check(
        name === parentObjectTypeDefinition.name,
        `Constructor '${name}' must match the name of its class, '${parentObjectTypeDefinition.name}'`
      );
    }

    if (isAbstract) {
      const abstractKeywordToken = ValidatorUtils.findKeywordToken(
        JavaConstants.Keyword.ABSTRACT,
        type.tokenRange.start,
        token => token.previousTextToken
      );

      this.focusTokenRange({
        start: abstractKeywordToken,
        end: abstractKeywordToken
      });

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
      const parameterTypeConstraint = this.createTypeConstraint(parameterType.namespaceChain, parameterType.arrayDimensions);

      scopeManager.addToScope(parameterName, {
        constraint: parameterTypeConstraint,
        isConstant: isFinal
      });
    });

    this.validateNodeWith(JavaBlockValidator, block);
    this.resetExpectedType();

    if (lastStatement && isConstructor) {
      this.focusTokenRange(lastStatement.tokenRange);

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
