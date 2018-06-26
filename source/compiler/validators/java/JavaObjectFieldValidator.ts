import AbstractValidator from '../common/AbstractValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { TypeExpectation } from '../common/types';
import JavaStatementValidator from './JavaStatementValidator';
import { TypeDefinition, ITypeConstraint } from '../../symbol-resolvers/common/types';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';

export default class JavaObjectFieldValidator extends AbstractValidator<JavaSyntax.IJavaObjectField> {
  @Implements public validate (): void {
    const { value, isAbstract, isStatic } = this.syntaxNode;
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
        constraint: this.getFieldTypeConstraint(),
        expectation: TypeExpectation.ASSIGNMENT
      });

      this.validateNodeWith(JavaStatementValidator, value);
      this.resetExpectedType();
    }
  }

  private getFieldTypeConstraint (): ITypeConstraint {
    const { type } = this.syntaxNode;
    const { symbolDictionary } = this.context;
    const typeConstraint = this.findOriginalTypeConstraint(type.namespaceChain);

    return type.arrayDimensions > 0
      ? TypeUtils.createArrayTypeConstraint(symbolDictionary, typeConstraint, type.arrayDimensions)
      : typeConstraint;
  }
}
