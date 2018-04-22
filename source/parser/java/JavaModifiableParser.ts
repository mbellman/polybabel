import AbstractParser from '../common/AbstractParser';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';
import { TokenUtils } from '../../tokenizer/token-utils';

export default class JavaModifiableParser extends AbstractParser<JavaSyntax.IJavaModifiable> {
  @Implements protected getDefault (): JavaSyntax.IJavaModifiable {
    return {
      node: null,
      access: JavaSyntax.JavaAccessModifier.PACKAGE
    };
  }

  @Match(JavaConstants.AccessModifiers)
  protected onAccessModifier (): void {
    this.parsed.access = JavaConstants.AccessModifierMap[this.currentToken.value];
  }

  @Match(JavaConstants.Modifiers)
  protected onModifier (): void {
    const modifiableKey = JavaConstants.ModifiableKeyMap[this.currentToken.value];

    this.parsed[modifiableKey] = true;
  }

  @Match(/./)
  protected onNonModifier (): void {
    this.stop();
  }
}
