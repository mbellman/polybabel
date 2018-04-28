import AbstractParser from '../common/AbstractParser';
import JavaStatementParser from './JavaStatementParser';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';

/**
 * Parses Java code blocks. Finishes upon encountering
 * a } token, and stops upon encountering a 'case' or
 * 'default' keyword in switch statements.
 *
 * @example
 *
 *  {
 *    ...
 *  }
 *
 *  case {statement}:
 *    ...
 *
 *  default:
 *    ...
 */
export default class JavaBlockParser extends AbstractParser<JavaSyntax.IJavaBlock> {
  @Implements protected getDefault (): JavaSyntax.IJavaBlock {
    return {
      node: JavaSyntax.JavaSyntaxNode.BLOCK,
      nodes: []
    };
  }

  @Match('{')
  protected onEnterBlock (): void {
    this.next();
  }

  @Match(/./)
  protected onStatement (): void {
    const statement = this.parseNextWith(JavaStatementParser);

    this.parsed.nodes.push(statement);
  }

  @Match(';')
  protected onStatementEnd (): void {
    this.next();
  }

  @Match('}')
  protected onExitBlock (): void {
    this.finish();
  }

  @Match(JavaConstants.Keyword.CASE)
  @Match(JavaConstants.Keyword.DEFAULT)
  protected onSwitchCaseBlockEnd (): void {
    this.stop();
  }
}
