import { AbstractParser, INumberParser, IWordParser, Matcher } from '../common/parsers';
import { JavaSyntax } from './java-syntax';

export default class JavaExpressionParser extends AbstractParser<JavaSyntax.IJavaExpression> implements INumberParser, IWordParser {
  public readonly numbers: Matcher[] = [];
  public readonly words: Matcher[] = [];

  protected getDefault (): JavaSyntax.IJavaExpression {
    return {
      node: JavaSyntax.JavaSyntaxNode.EXPRESSION,
      nodes: []
    };
  }
}
