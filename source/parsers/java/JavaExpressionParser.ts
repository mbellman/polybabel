import AbstractParser from '../common/AbstractParser';
import Parser from '../common/Parser';
import { Composes, Matches } from '../common/parser-decorators';
import { INumbers, IWords, TokenMatcher } from '../common/parser-types';
import { JavaSyntax } from './java-syntax';

@Matches<INumbers>()
@Matches<IWords>()
@Composes(Parser)
export default abstract class JavaExpressionParser extends AbstractParser<JavaSyntax.IJavaExpression> {
  public static readonly numbers: TokenMatcher<JavaExpressionParser>[] = [];
  public static readonly words: TokenMatcher<JavaExpressionParser>[] = [];

  protected getDefault (): JavaSyntax.IJavaExpression {
    return {
      node: JavaSyntax.JavaSyntaxNode.EXPRESSION,
      nodes: []
    };
  }
}
