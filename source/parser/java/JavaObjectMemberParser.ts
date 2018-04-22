import AbstractParser from '../common/AbstractParser';
import JavaModifiableParser from './JavaModifiableParser';
import JavaTypeParser from './JavaTypeParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaSyntax } from './java-syntax';
import { TokenUtils } from '../../tokenizer/token-utils';

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

    this.assert(TokenUtils.isWord(this.currentToken));
    this.finish();
  }
}
