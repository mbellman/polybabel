import AbstractParser from '../common/AbstractParser';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';
import { ParserUtils } from '../common/parser-utils';
import { TokenUtils } from '../../tokenizer/token-utils';

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
    this.assert(this.parsed.value === '');

    this.parsed.value = this.currentToken.value;

    this.finish();
  }

  @Match('"')
  @Match("'")
  protected onOpenQuote (): void {
    this.assert(this.parsed.value === '');

    const isSingleQuote = this.currentTokenMatches("'");
    const terminatorQuote = isSingleQuote ? "'" : '"';

    while (!this.isEOF()) {
      this.addTokenToValue();
      this.next();

      if (this.currentTokenMatches(terminatorQuote)) {
        this.addTokenToValue();

        break;
      }
    }

    this.finish();
  }

  @Match('{')
  protected onArray (): void {
    this.assert(this.parsed.value === '');
  }

  private addTokenToValue (): void {
    this.parsed.value += this.currentToken.value;
  }
}
