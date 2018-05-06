import AbstractParser from '../../common/AbstractParser';
import JavaBlockParser from '../JavaBlockParser';
import JavaStatementParser from '../JavaStatementParser';
import { Eat, Match } from '../../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';

/**
 * Parses for-loops. Stops after parsing and breaking
 * out of the main loop block.
 *
 * @example
 *
 *  for (int i = 0; i <= 10; i++) {
 *    ...
 *  }
 *
 *  for (int index : indices) {
 *    ...
 *  }
 */
export default class JavaForLoopParser extends AbstractParser<JavaSyntax.IJavaForLoop> {
  /**
   * Tracks the total number of ; loop statement
   * separators encountered. Since statements can
   * be omitted between separators, we can't assert
   * a maximum limit on separator tokens based on
   * total statements alone.
   */
  private totalLoopStatementSeparators: number = 0;

  @Implements protected getDefault (): JavaSyntax.IJavaForLoop {
    return {
      node: JavaSyntax.JavaSyntaxNode.FOR_LOOP,
      statements: [],
      block: null
    };
  }

  @Eat(JavaConstants.Keyword.FOR)
  protected onFor (): void {
    this.next();
  }

  @Eat('(')
  protected onEnterLoopStatementBlock (): void {
    this.next();
  }

  @Match(/./)
  protected onLoopStatement (): void {
    this.assert(
      this.parsed.isEnhanced
        ? this.parsed.statements.length === 1
        : this.parsed.statements.length < 3
    );

    const statement = this.parseNextWith(JavaStatementParser);

    this.parsed.statements.push(statement);
  }

  @Match(';')
  protected onLoopStatementSeparator (): void {
    this.assert(
      !this.parsed.isEnhanced &&
      ++this.totalLoopStatementSeparators < 3
    );

    if (this.totalLoopStatementSeparators > this.parsed.statements.length) {
      this.parsed.statements.push(null);
    }
  }

  @Match(':')
  protected onEnhancedLoopSeparator (): void {
    this.assert(
      this.parsed.statements.length === 1 &&
      this.totalLoopStatementSeparators === 0
    );

    this.parsed.isEnhanced = true;

    this.next();
  }

  @Match(')')
  protected onLoopStatementEnd (): void {
    this.assert(
      // Either the loop should have been defined in
      // initialization-terminization-increment form...
      this.totalLoopStatementSeparators === 2 ||
      // ...or it should have been defined as an
      // enhanced for-loop
      this.parsed.statements.length === 2
    );

    if (!this.parsed.isEnhanced && this.parsed.statements.length < 3) {
      this.parsed.statements.push(null);
    }

    this.next();
  }

  @Match('{')
  protected onOpenBrace (): void {
    const isLoopBlockStart = this.previousTextToken.value === ')';

    if (isLoopBlockStart) {
      this.parsed.block = this.parseNextWith(JavaBlockParser);

      this.stop();
    } else {
      // An array literal may be used as one of the
      // loop's statements, in which case it would
      // have been matched here
      this.onLoopStatement();
    }
  }
}
