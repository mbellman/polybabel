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
      this.validateNodeWith(JavaExpressionStatementValidator, statements[0]);

      this.expectType({
        expectation: TypeExpectation.STATEMENT,
        constraint: this.creatArrayTypeConstraint(this.context.lastCheckedTypeConstraint)
      });

      this.validateNodeWith(JavaExpressionStatementValidator, statements[1]);
    } else {
      statements.forEach(statement => {
        if (statement) {
          this.setFlags({
            shouldAllowAnyType: true
          });

          this.validateNodeWith(JavaExpressionStatementValidator, statement);
        }
      });
    }

    this.validateNodeWith(JavaBlockValidator, block);
  }

  private creatArrayTypeConstraint ({ typeDefinition }: ITypeConstraint): ITypeConstraint {
    const arrayTypeConstraint = new ArrayType.Definer(this.context.symbolDictionary);

    arrayTypeConstraint.defineElementTypeConstraint({ typeDefinition });

    return {
      typeDefinition: arrayTypeConstraint
    };
  }
}
