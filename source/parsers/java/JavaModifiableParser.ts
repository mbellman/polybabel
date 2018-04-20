import AbstractParser from '../common/AbstractParser';
import { IHashMap } from '../../system/types';
import { Implements, Override } from 'trampoline-framework';
import { isAccessModifierKeyword, isModifierKeyword } from './java-utils';
import { ISyntaxNode } from '../common/syntax-types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';
import { Pattern } from '../common/parser-types';

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
    const modifiableKey = JavaConstants.ModifierFlagMap[this.currentToken.value];

    this.parsed[modifiableKey] = true;
  }

  @Match(Pattern.ANY)
  protected onNonModifier (): void {
    this.stop();
  }
}
