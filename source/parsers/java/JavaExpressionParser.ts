import AbstractParser from '../common/AbstractParser';
import JavaInstantiationParser from './JavaInstantiationParser';
import JavaLiteralParser from './JavaLiteralParser';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from './java-syntax';
import { JavaUtils } from './java-utils';
import { Match } from '../common/parser-decorators';

export default class JavaExpressionParser extends AbstractParser<JavaSyntax.IJavaExpression> {
  @Implements protected getDefault (): JavaSyntax.IJavaExpression {
    return {
      node: JavaSyntax.JavaSyntaxNode.EXPRESSION,
      value: null
    };
  }

  @Match(JavaUtils.isLiteral)
  protected onLiteralAssignment (): void {
    this.parsed.value = this.parseNextWith(JavaLiteralParser);
  }

  @Match(JavaUtils.isInstantiation)
  protected onInstantiationAssignment (): void {
    this.parsed.value = this.parseNextWith(JavaInstantiationParser);
  }

  @Match(';')
  protected onEnd (): void {
    this.stop();
  }
}
