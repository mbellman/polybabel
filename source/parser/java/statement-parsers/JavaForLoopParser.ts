import AbstractParser from '../../common/AbstractParser';
import JavaBlockParser from '../JavaBlockParser';
import JavaPropertyChainParser from './JavaPropertyChainParser';
import JavaStatementParser from '../JavaStatementParser';
import SequenceParser from '../../common/SequenceParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';
import { Match } from '../../common/parser-decorators';

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

  @Override protected onFirstToken (): void {
    this.next();
  }

  @Match('(')
  protected onEnterLoopStatementBlock (): void {
    this.next();
  }

  @Match(/./)
  protected onLoopStatement (): void {
    const statement = this.parseNextWith(JavaStatementParser);

    this.parsed.statements.push(statement);
  }

  @Match(';')
  protected onLoopStatementSeparator (): void {
    this.assert(++this.totalLoopStatementSeparators < 3);
    this.next();
  }

  @Match(':')
  protected onEnhancedLoopSeparator (): void {
    this.assert(
      this.parsed.statements.length === 1 &&
      this.totalLoopStatementSeparators === 0
    );

    this.parsed.isEnhanced = true;

    this.next();

    const collection = this.parseNextWith(JavaStatementParser);

    this.parsed.statements.push(collection);
    this.assertCurrentTokenMatch(')');
    this.next();
  }

  @Match(')')
  protected onLoopStatementEnd (): void {
    this.next();
  }

  @Match('{')
  protected onBlock (): void {
    this.assert(
      // Either the loop should have been defined in
      // initialization-terminization-increment form...
      this.totalLoopStatementSeparators === 2 ||
      // ...or it should have been defined as an
      // enhanced for-loop
      this.parsed.statements.length === 2
    );

    this.parsed.block = this.parseNextWith(JavaBlockParser);

    this.stop();
  }
}
