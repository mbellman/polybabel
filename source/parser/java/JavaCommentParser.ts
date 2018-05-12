import AbstractParser from '../common/AbstractParser';
import { Allow, Eat } from '../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { ISyntaxNode } from '../common/syntax-types';
import { TokenUtils } from '../../tokenizer/token-utils';
import { JavaUtils } from './java-utils';

export default class JavaCommentParser extends AbstractParser<ISyntaxNode> {
  @Implements protected getDefault (): ISyntaxNode {
    return {
      node: null
    };
  }

  @Eat('/')
  protected onStartComment (): void {
    this.next();
  }

  @Allow('/')
  protected onSingleLineComment (): void {
    while (!this.isEOF()) {
      this.currentToken = this.nextToken;

      if (this.currentTokenMatches(TokenUtils.isNewline)) {
        break;
      }
    }

    this.next();
    this.safelyStopComment();
  }

  @Allow('*')
  protected onMultiLineComment (): void {
    while (!this.isEOF()) {
      this.currentToken = this.nextToken;

      const isEndOfComment = (
        this.currentTokenMatches('*') &&
        this.nextToken.value === '/'
      );

      if (isEndOfComment) {
        this.next();
        this.next();

        break;
      }
    }

    this.safelyStopComment();
  }

  /**
   * Stops after parsing the comment, with a contingency for the
   * presence of an additional comment. All comments should be
   * skipped through so valid code can continue being parsed.
   */
  private safelyStopComment (): void {
    if (this.currentTokenMatches(JavaUtils.isComment)) {
      this.parseNextWith(JavaCommentParser);
    }

    this.stop();
  }
}
