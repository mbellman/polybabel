import AbstractParser from '../common/AbstractParser';
import JavaModifiableParser from './JavaModifiableParser';
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
    this.validateMember(this.currentToken, this.nextToken);

    this.parsed.type = this.currentToken.value;
    this.parsed.name = this.nextToken.value;

    this.skip(2);
    this.stop();
  }

  private validateMember (typeToken: IToken, nameToken: IToken): void {
    this.assert(
      typeToken.type === TokenType.WORD && nameToken.type === TokenType.WORD,
      `Invalid member '${typeToken.value} ${nameToken.value}'`
    );
  }
}
