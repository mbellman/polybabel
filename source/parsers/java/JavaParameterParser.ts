import AbstractParser from '../common/AbstractParser';
import { Implements, Override } from 'trampoline-framework';
import { isReservedWord } from './java-utils';
import { IToken, TokenType } from 'tokenizer/types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Parser } from '../common/parser-decorators';

export default class JavaParameterParser extends AbstractParser<JavaSyntax.IJavaParameter> {
  @Implements public getDefault (): JavaSyntax.IJavaParameter {
    return {
      node: JavaSyntax.JavaSyntaxNode.PARAMETER,
      type: null,
      name: null
    };
  }

  @Override public onFirstToken (): void {
    this.assert(/[(,]/.test(this.previousToken.value));

    const isFinalParameter = this.currentToken.value === JavaConstants.Keyword.FINAL;

    if (isFinalParameter) {
      this.parsed.isFinal = true;

      this.next();
    }

    this.validateParameter(this.currentToken, this.nextToken);

    this.parsed.type = this.currentToken.value;
    this.parsed.name = this.nextToken.value;

    this.skip(2);
    this.stop();
  }

  public validateParameter (typeToken: IToken, nameToken: IToken): void {
    this.assert(
      typeToken.type === TokenType.WORD && nameToken.type === TokenType.WORD,
      `Invalid parameter '${typeToken.value} ${nameToken.value}'`
    );

    this.assert(
      !isReservedWord(nameToken.value),
      `Invalid parameter name '${nameToken.value}'`
    );
  }
}
