import AbstractParser from '../common/AbstractParser';
import JavaObjectMemberParser from './JavaObjectMemberParser';
import JavaStatementParser from './JavaStatementParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';

export default abstract class JavaObjectFieldParser extends AbstractParser<JavaSyntax.IJavaObjectField> {
  @Implements protected getDefault (): JavaSyntax.IJavaObjectField {
    return {
      node: JavaSyntax.JavaSyntaxNode.OBJECT_FIELD,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      type: null,
      name: null,
      value: null
    };
  }

  @Override protected onFirstToken (): void {
    this.emulate(JavaObjectMemberParser);
  }

  @Match('=')
  protected onAssignment (): void {
    this.next();

    this.parsed.value = this.parseNextWith(JavaStatementParser);
  }

  @Match(';')
  protected onEnd (): void {
    this.finish();
  }
}
