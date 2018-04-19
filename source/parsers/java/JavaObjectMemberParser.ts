import AbstractParser from '../common/AbstractParser';
import JavaModifiableParser from './JavaModifiableParser';
import JavaTypeParser from './JavaTypeParser';
import { Implements, Override } from 'trampoline-framework';
import { IToken, TokenType } from 'tokenizer/types';
import { JavaSyntax } from './java-syntax';

export default class JavaObjectMemberParser extends AbstractParser<JavaSyntax.IJavaObjectMember> {
  @Implements protected getDefault (): JavaSyntax.IJavaObjectMember {
    return {
      node: null,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      type: null,
      name: null
    };
  }

  @Override protected onFirstToken (): void {
    this.emulate(JavaModifiableParser);

    this.parsed.type = this.parseNextWith(JavaTypeParser);
    this.parsed.name = this.currentToken.value;

    this.assert(this.currentToken.type === TokenType.WORD);
    this.finish();
  }
}
