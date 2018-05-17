import AbstractParser from '../common/AbstractParser';
import { Allow, Expect } from '../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { ISyntaxNode } from '../common/syntax-types';
import { JavaUtils } from './java-utils';
import { TokenUtils } from '../../tokenizer/token-utils';

export default class JavaCommentParser extends AbstractParser<ISyntaxNode> {
  @Implements protected getDefault (): ISyntaxNode {
    return {
      node: null
    };
  }

  @Expect('/')
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
    let depth = 1;

    while (!this.isEOF()) {
      this.next();

      if (this.isAtMultiLineCommentStart()) {
        depth++;
      }

      const isEndOfComment = (
        this.isAtMultiLineCommentEnd() &&
        --depth === 0
      );

      if (isEndOfComment) {
        this.next(); // '*'
        this.next(); // '/'

        break;
      }
    }

    this.safelyStopComment();
  }

  private isAtMultiLineCommentStart (): boolean {
    return (
      this.currentToken.value === '/' &&
      this.nextToken.value === '*'
    );
  }

  private isAtMultiLineCommentEnd (): boolean {
    return (
      this.currentToken.value === '*' &&
      this.nextToken.value === '/'
    );
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
