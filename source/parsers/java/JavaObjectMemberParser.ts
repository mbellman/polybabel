import AbstractParser from '../common/AbstractParser';
import JavaModifiableParser from './JavaModifiableParser';
import { Implements, Override } from 'trampoline-framework';
import { isAccessModifierKeyword, isModifierKeyword } from './java-utils';
import { IToken, TokenType } from 'tokenizer/types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Parser } from '../common/parser-decorators';

export default class JavaObjectMemberParser extends AbstractParser<JavaSyntax.IJavaObjectMember> {
  @Implements public getDefault (): JavaSyntax.IJavaObjectMember {
    return {
      node: null,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      type: null,
      name: null
    };
  }

  @Override public onFirstToken (): void {
    this.emulate(JavaModifiableParser);
    this.validateMember(this.currentToken, this.nextToken);

    this.parsed.type = this.currentToken.value;
    this.parsed.name = this.nextToken.value;

    this.skip(2);
    this.stop();
  }

  public validateMember (typeToken: IToken, nameToken: IToken): void {
    this.assert(
      typeToken.type === TokenType.WORD && nameToken.type === TokenType.WORD,
      `Invalid member '${typeToken.value} ${nameToken.value}'`
    );
  }
}
