import AbstractParser from '../common/AbstractParser';
import JavaTypeParser from './JavaTypeParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { TokenType } from '../../tokenizer/types';
import { TokenUtils } from '../../tokenizer/token-utils';

export default class JavaParameterParser extends AbstractParser<JavaSyntax.IJavaParameter> {
  @Implements protected getDefault (): JavaSyntax.IJavaParameter {
    return {
      node: JavaSyntax.JavaSyntaxNode.PARAMETER,
      type: null,
      name: null
    };
  }

  @Override protected onFirstToken (): void {
    const isFinalParameter = this.currentToken.value === JavaConstants.Keyword.FINAL;

    if (isFinalParameter) {
      this.parsed.isFinal = true;

      this.next();
    }

    this.parsed.type = this.parseNextWith(JavaTypeParser);
    this.parsed.name = this.currentToken.value;

    this.assert(TokenUtils.isWord(this.currentToken));
    this.finish();
  }
}
