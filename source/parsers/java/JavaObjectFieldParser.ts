import AbstractParser from '../common/AbstractParser';
import JavaExpressionParser from './JavaExpressionParser';
import JavaObjectMemberParser from './JavaObjectMemberParser';
import Parser from '../common/Parser';
import { Composes, Matches } from '../common/parser-decorators';
import { ISymbols, TokenMatcher } from '../common/parser-types';
import { JavaSyntax } from './java-syntax';

@Matches<ISymbols>()
@Composes(
  Parser,
  JavaObjectMemberParser
)
export default abstract class JavaObjectFieldParser extends AbstractParser<JavaSyntax.IJavaObjectField> {
  public static readonly symbols: TokenMatcher<JavaObjectFieldParser>[] = [
    ['=', parser => parser._onAssignment],
    [';', parser => parser.finish]
  ];

  protected getDefault (): JavaSyntax.IJavaObjectField {
    return {
      node: JavaSyntax.JavaSyntaxNode.OBJECT_FIELD,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      type: null
    };
  }

  private _onAssignment (): void {
    const expression = this.parseNextWith(JavaExpressionParser);

    this.parsed.value = expression;
  }
}
