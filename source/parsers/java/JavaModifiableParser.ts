import AbstractParser from '../common/AbstractParser';
import { Implements, Override } from 'trampoline-framework';
import { isAccessModifierKeyword, isModifierKeyword } from './java-utils';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

export default class JavaModifiableParser extends AbstractParser<JavaSyntax.IJavaModifiable> {
  @Implements public getDefault (): JavaSyntax.IJavaModifiable {
    return {
      node: null,
      access: JavaSyntax.JavaAccessModifier.PACKAGE
    };
  }

  @Override public onFirstToken (): void {
    const { value } = this.currentToken;

    if (isAccessModifierKeyword(value)) {
      this.parsed.access = JavaConstants.AccessModifierMap[value];

      this.next();
    }

    while (isModifierKeyword(this.currentToken.value)) {
      this.match([
        [JavaConstants.Keyword.FINAL, () => this.parsed.isFinal = true],
        [JavaConstants.Keyword.STATIC, () => this.parsed.isStatic = true],
        [JavaConstants.Keyword.ABSTRACT, () => this.parsed.isAbstract = true]
      ]);

      this.next();
    }

    this.stop();
  }
}
