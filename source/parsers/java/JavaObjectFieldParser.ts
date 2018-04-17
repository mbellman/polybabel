import AbstractParser from '../common/AbstractParser';
import JavaExpressionParser from './JavaExpressionParser';
import JavaObjectMemberParser from './JavaObjectMemberParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';

export default abstract class JavaObjectFieldParser extends AbstractParser<JavaSyntax.IJavaObjectField> {
  @Implements protected getDefault (): JavaSyntax.IJavaObjectField {
    return {
      node: JavaSyntax.JavaSyntaxNode.OBJECT_FIELD,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      type: null
    };
  }

  @Match('=')
  private onAssignment (): void {
    const expression = this.parseNextWith(JavaExpressionParser);

    this.parsed.value = expression;
  }

  @Override protected onFirstToken (): void {
    this.emulate(JavaObjectMemberParser);
  }

  @Match(';')
  private onEnd (): void {
    this.finish();
  }
}
