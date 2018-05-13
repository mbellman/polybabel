import AbstractParser from '../../common/AbstractParser';
import JavaBlockParser from '../JavaBlockParser';
import JavaStatementParser from '../JavaStatementParser';
import { Eat, Match } from '../../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';

/**
 * Parses for-loops. Stops after parsing and stepping
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
   * separators encountered, and also helps determine
   * whether null statements need to be supplied in
   * place of deliberately omitted statements.
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
  protected onStartLoopStatementBlock (): void {
    this.next();
  }

  @Match(/./)
  protected onLoopStatement (): void {
    const { statements } = this.parsed;

    // If we encounter any token other than a { after all
    // statements are parsed, we treat it as a statement
    // for a single-line loop
    const isSingleLineForLoop = (
      this.parsed.isEnhanced
        ? statements.length === 2
        : statements.length === 3
    );

    const statement = this.parseNextWith(JavaStatementParser);

    if (isSingleLineForLoop) {
      this.parsed.block = {
        node: JavaSyntax.JavaSyntaxNode.BLOCK,
        nodes: [ statement ]
      };

      this.stop();
    } else {
      this.parsed.statements.push(statement);
    }
  }

  @Match(';')
  protected onLoopStatementSeparator (): void {
    this.assert(
      !this.parsed.isEnhanced &&
      ++this.totalLoopStatementSeparators < 3
    );

    if (this.totalLoopStatementSeparators > this.parsed.statements.length) {
      // No statement supplied before this separator,
      // so supply a null value in its place
      this.parsed.statements.push(null);
    }
  }

  @Match(':')
  protected onEnhancedLoopSeparator (): void {
    this.assert(
      !this.parsed.isEnhanced &&
      this.parsed.statements.length === 1 &&
      this.totalLoopStatementSeparators === 0
    );

    this.parsed.isEnhanced = true;

    this.next();
  }

  @Match(')')
  protected onEndLoopStatementBlock (): void {
    const totalStatements = this.parsed.statements.length;

    this.assert(
      // Either the loop should have been defined in
      // initialization-termination-increment form...
      totalStatements === 3 ||
      // ...or it should have been defined as an
      // enhanced for-loop; alternatively, it may
      // be a normal loop with an omitted third
      // statement
      totalStatements === 2
    );

    if (!this.parsed.isEnhanced && totalStatements < 3) {
      // If a normal loop omits its third statement,
      // supply a null value in its place
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
      // loop's statements, in which case we need
      // to parse it as such
      this.onLoopStatement();
    }
  }
}
