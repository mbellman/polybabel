import AbstractParser from '../../common/AbstractParser';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';
import { Match } from '../../common/parser-decorators';
import { ParserUtils } from '../../common/parser-utils';
import { TokenUtils } from '../../../tokenizer/token-utils';

export default class JavaLiteralParser extends AbstractParser<JavaSyntax.IJavaLiteral> {
  @Implements protected getDefault (): JavaSyntax.IJavaLiteral {
    return {
      node: JavaSyntax.JavaSyntaxNode.LITERAL,
      value: ''
    };
  }

  @Match([
    JavaConstants.Keyword.TRUE,
    JavaConstants.Keyword.FALSE,
    JavaConstants.Keyword.NULL
  ])
  @Match(TokenUtils.isNumber)
  protected onLiteralToken (): void {
    this.addTokenToValue();
    this.finish();
  }

  @Match(/['"]/)
  protected onOpenQuote (): void {
    const isSingleQuote = this.currentTokenMatches("'");
    const terminatorQuote = isSingleQuote ? "'" : '"';
    let isBackslashed = false;

    while (!this.isEOF()) {
      this.addTokenToValue();
      this.next();

      if (TokenUtils.isNewline(this.nextToken)) {
        this.throw('Quotes must be single-line only');
      }

      if (this.currentTokenMatches(terminatorQuote) && !isBackslashed) {
        this.addTokenToValue();

        break;
      }

      isBackslashed = this.currentTokenMatches('\\') && !isBackslashed;
    }

    this.finish();
  }

  @Match('{')
  protected onArray (): void {

  }

  private addTokenToValue (): void {
    this.parsed.value += this.currentToken.value;
  }
}
