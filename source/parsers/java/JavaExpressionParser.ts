import AbstractParser from '../common/AbstractParser';
import { JavaSyntax } from './java-syntax';
import { Implements } from 'trampoline-framework';

export default abstract class JavaExpressionParser extends AbstractParser<JavaSyntax.IJavaExpression> {
  @Implements public getDefault (): JavaSyntax.IJavaExpression {
    return {
      node: JavaSyntax.JavaSyntaxNode.EXPRESSION
    };
  }
}
