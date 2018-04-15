import AbstractParser from '../common/AbstractParser';
import { JavaSyntax } from './java-syntax';

export default abstract class JavaExpressionParser extends AbstractParser<JavaSyntax.IJavaExpression> {
  public getDefault (): JavaSyntax.IJavaExpression {
    return {
      node: JavaSyntax.JavaSyntaxNode.EXPRESSION
    };
  }
}
