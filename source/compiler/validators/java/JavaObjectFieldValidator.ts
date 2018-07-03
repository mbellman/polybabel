import AbstractValidator from '../common/AbstractValidator';
import JavaExpressionStatementValidator from './JavaExpressionStatementValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { TypeExpectation } from '../common/types';

export default class JavaObjectFieldValidator extends AbstractValidator<JavaSyntax.IJavaObjectField> {
  @Implements public validate (): void {
    const { type, value, isAbstract, isStatic } = this.syntaxNode;
    const parentObjectTypeDefinition = this.context.objectVisitor.getCurrentVisitedObject();

    if (isAbstract) {
      this.check(
        parentObjectTypeDefinition.requiresImplementation,
        'Abstract fields are only allowed in abstract classes'
      );

      this.check(
        !value,
        `Abstract fields cannot have values`
      );
    }

    if (value) {
      this.setFlags({
        shouldAllowReturn: false,
        shouldAllowInstanceKeywords: !isStatic
      });

      this.expectType({
        constraint: this.createTypeConstraint(type.namespaceChain, type.arrayDimensions),
        expectation: TypeExpectation.ASSIGNMENT
      });

      this.validateNodeWith(JavaExpressionStatementValidator, value);
      this.resetExpectedType();
    }
  }
}
