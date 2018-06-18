import AbstractValidator from '../common/AbstractValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { TypeExpectation } from '../common/types';
import JavaStatementValidator from './JavaStatementValidator';
import { TypeDefinition } from '../../symbol-resolvers/common/types';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';

export default class JavaObjectFieldValidator extends AbstractValidator<JavaSyntax.IJavaObjectField> {
  @Implements public validate (): void {
    const { value, isAbstract } = this.syntaxNode;
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
      this.expectType({
        type: this.getFieldTypeDefinition(),
        expectation: TypeExpectation.ASSIGNMENT
      });

      this.validateNodeWith(JavaStatementValidator, value);
      this.resetExpectedType();
    }
  }

  private getFieldTypeDefinition (): TypeDefinition {
    const { type } = this.syntaxNode;
    const { symbolDictionary } = this.context;
    const fieldType = this.findTypeDefinition(type.namespaceChain);

    return type.arrayDimensions > 0
      ? TypeUtils.createArrayType(symbolDictionary, fieldType, type.arrayDimensions)
      : fieldType;
  }
}
