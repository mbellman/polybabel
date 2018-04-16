import AbstractParser from '../common/AbstractParser';
import { isAccessModifierKeyword, isModifierKeyword } from './java-utils';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Parser } from '../common/parser-decorators';
import { IToken, TokenType } from 'tokenizer/types';

@Parser({
  symbols: [
    [/[=(]/, 'finish']
  ]
})
export default class JavaObjectMemberParser extends AbstractParser<JavaSyntax.IJavaObjectMember> {
  public getDefault (): JavaSyntax.IJavaObjectMember {
    return {
      node: null,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      type: null,
      name: null
    };
  }

  public onFirstToken (): void {
    const { value } = this.currentToken;

    if (isAccessModifierKeyword(value)) {
      this.parsed.access = JavaConstants.AccessModifierMap[value];

      this.next();
    }

    while (isModifierKeyword(this.currentToken.value)) {
      this.match([
        [JavaConstants.Keyword.STATIC, () => this.parsed.isStatic = true],
        [JavaConstants.Keyword.FINAL, () => this.parsed.isFinal = true],
        [JavaConstants.Keyword.ABSTRACT, () => this.parsed.isAbstract = true]
      ]);

      this.next();
    }

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
