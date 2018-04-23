import AbstractParser from '../../common/AbstractParser';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';
import { Match } from '../../common/parser-decorators';
import { ParserUtils } from '../../common/parser-utils';
import { TokenUtils } from '../../../tokenizer/token-utils';
import SequenceParser from '../../common/SequenceParser';
import JavaStatementParser from '../JavaStatementParser';

/**
 * Parses literal values and finishes at their termination.
 *
 * @example Literals:
 *
 *  true
 *  false
 *  null
 *  5
 *  'hello'
 *  { 1, 2, 3 }
 */
export default class JavaLiteralParser extends AbstractParser<JavaSyntax.IJavaLiteral> {
  @Implements protected getDefault (): JavaSyntax.IJavaLiteral {
    return {
      node: JavaSyntax.JavaSyntaxNode.LITERAL,
      type: null,
      value: null
    };
  }

  @Match([
    JavaConstants.Keyword.TRUE,
    JavaConstants.Keyword.FALSE,
    JavaConstants.Keyword.NULL
  ])
  protected onKeywordLiteral (): void {
    this.parsed.type = JavaSyntax.JavaLiteralType.KEYWORD;
    this.parsed.value = this.currentToken.value;

    this.finish();
  }

  @Match(TokenUtils.isNumber)
  protected onNumberLiteral (): void {
    this.parsed.type = JavaSyntax.JavaLiteralType.NUMBER;
    this.parsed.value = this.currentToken.value;

    this.finish();
  }

  @Match(/['"]/)
  protected onStringLiteral (): void {
    const isSingleQuote = this.currentTokenMatches("'");
    const terminatorQuote = isSingleQuote ? "'" : '"';
    let isBackslashed = false;

    this.parsed.type = JavaSyntax.JavaLiteralType.STRING;
    this.parsed.value = '';

    while (!this.isEOF()) {
      this.parsed.value += this.currentToken.value;

      this.next();

      if (TokenUtils.isNewline(this.nextToken)) {
        this.throw('String literals must be single-line only');
      }

      if (this.currentTokenMatches(terminatorQuote) && !isBackslashed) {
        this.parsed.value += this.currentToken.value;

        break;
      }

      isBackslashed = this.currentTokenMatches('\\') && !isBackslashed;
    }

    this.finish();
  }

  @Match('{')
  protected onArrayLiteral (): void {
    this.next();

    const arrayLiteralParser = new SequenceParser({
      ValueParser: JavaStatementParser,
      delimiter: ',',
      terminator: '}'
    });

    const { values } = this.parseNextWith(arrayLiteralParser);

    this.parsed.type = JavaSyntax.JavaLiteralType.ARRAY;
    this.parsed.value = values;

    this.finish();
  }
}
