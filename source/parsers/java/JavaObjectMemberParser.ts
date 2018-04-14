import AbstractParser from '../common/AbstractParser';
import { isAccessModifierKeyword, isModifierKeyword } from './java-utils';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

export default abstract class JavaObjectMemberParser extends AbstractParser<JavaSyntax.IJavaObjectMember> {
  protected onFirstToken (): void {
    const { value } = this.currentToken;

    if (isAccessModifierKeyword(value)) {
      this.parsed.access = JavaConstants.AccessModifierMap[value];

      this.skip(1);
    }

    while (isModifierKeyword(this.currentToken.value)) {
      this.match([
        [JavaConstants.Keyword.STATIC, () => this.parsed.isStatic = true],
        [JavaConstants.Keyword.FINAL, () => this.parsed.isFinal = true],
        [JavaConstants.Keyword.ABSTRACT, () => this.parsed.isAbstract = true]
      ]);

      this.skip(1);
    }

    this.parsed.type = this.currentToken.value;
    this.parsed.name = this.nextToken.value;

    this.skip(2);
  }
}
