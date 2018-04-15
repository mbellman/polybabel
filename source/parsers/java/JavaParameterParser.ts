import AbstractParser from '../common/AbstractParser';
import { isReservedWord } from './java-utils';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Parser } from '../common/parser-decorators';
import { TokenType, IToken } from 'tokenizer/types';

export default class JavaParameterParser extends AbstractParser<JavaSyntax.IJavaParameter> {
  public getDefault (): JavaSyntax.IJavaParameter {
    return {
      node: JavaSyntax.JavaSyntaxNode.PARAMETER,
      type: null,
      name: null
    };
  }

  public onFirstToken (): void {
    const isFinalParameter = this.currentToken.value === JavaConstants.Keyword.FINAL;

    if (isFinalParameter) {
      this.parsed.isFinal = true;

      this.skip(1);
    }

    this.validateParameter(this.currentToken, this.nextToken);

    this.parsed.type = this.currentToken.value;
    this.parsed.name = this.nextToken.value;

    this.skip(2);
    this.stop();
  }

  public validateParameter (typeToken: IToken, nameToken: IToken): void {
    this.assert(typeToken.type === TokenType.WORD && nameToken.type === TokenType.WORD);

    this.assert(
      !isReservedWord(nameToken.value),
      `Invalid parameter name '${nameToken.value}'`
    );
  }
}
