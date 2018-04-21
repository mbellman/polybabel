import AbstractParser from '../common/AbstractParser';
import JavaExpressionParser from './JavaExpressionParser';
import JavaParameterParser from './JavaParameterParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';

export default class JavaVariableParser extends AbstractParser<JavaSyntax.IJavaVariable> {
  @Implements protected getDefault (): JavaSyntax.IJavaVariable {
    return {
      node: JavaSyntax.JavaSyntaxNode.VARIABLE,
      type: null,
      name: null,
      value: null
    };
  }

  @Override protected onFirstToken (): void {
    this.emulate(JavaParameterParser);
  }

  @Match('=')
  protected onAssignment (): void {
    this.next();

    this.parsed.value = this.parseNextWith(JavaExpressionParser);
  }

  @Match(';')
  protected onEnd (): void {
    this.finish();
  }
}
