import AbstractParser from '../common/AbstractParser';
import JavaTypeParser from './JavaTypeParser';
import { Implements, Override } from 'trampoline-framework';
import { isReservedWord } from './java-utils';
import { IToken, TokenType } from 'tokenizer/types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

export default class JavaParameterParser extends AbstractParser<JavaSyntax.IJavaParameter> {
  @Implements protected getDefault (): JavaSyntax.IJavaParameter {
    return {
      node: JavaSyntax.JavaSyntaxNode.PARAMETER,
      type: null,
      name: null
    };
  }

  @Override protected onFirstToken (): void {
    this.assert(/[(,]/.test(this.previousToken.value));

    const isFinalParameter = this.currentToken.value === JavaConstants.Keyword.FINAL;

    if (isFinalParameter) {
      this.parsed.isFinal = true;

      this.next();
    }

    this.parsed.type = this.parseNextWith(JavaTypeParser);
    this.parsed.name = this.currentToken.value;

    this.assert(this.currentToken.type === TokenType.WORD);
    this.finish();
  }
}
