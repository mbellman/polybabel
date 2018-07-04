import AbstractValidator from '../common/AbstractValidator';
import JavaBlockValidator from './JavaBlockValidator';
import JavaExpressionStatementValidator from './JavaExpressionStatementValidator';
import { DynamicTypeConstraint } from '../../native-type-constraints/common';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { TypeExpectation } from '../common/types';
import { ArrayType } from '../../symbol-resolvers/common/array-type';
import { ITypeConstraint } from '../../symbol-resolvers/common/types';

export default class JavaForLoopValidator extends AbstractValidator<JavaSyntax.IJavaForLoop> {
  @Implements public validate (): void {
    const { statements, block, isEnhanced } = this.syntaxNode;

    if (isEnhanced) {
      // TODO: Validate that the second statement in an enhanced for loop
      // is an array type with an element type matching that of the first
      this.validateNodeWith(JavaExpressionStatementValidator, statements[0]);

      this.expectType({
        expectation: TypeExpectation.STATEMENT,
        constraint: this.createDynamicArrayTypeConstraint()
      });

      this.validateNodeWith(JavaExpressionStatementValidator, statements[1]);
    } else {
      statements.forEach(statement => {
        if (statement) {
          this.validateNodeWith(JavaExpressionStatementValidator, statement);
        }
      });
    }

    this.validateNodeWith(JavaBlockValidator, block);
  }

  private createDynamicArrayTypeConstraint (): ITypeConstraint {
    const arrayTypeConstraint = new ArrayType.Definer(this.context.symbolDictionary);

    arrayTypeConstraint.defineElementTypeConstraint({
      typeDefinition: DynamicTypeConstraint.typeDefinition
    });

    return {
      typeDefinition: arrayTypeConstraint
    };
  }
}
