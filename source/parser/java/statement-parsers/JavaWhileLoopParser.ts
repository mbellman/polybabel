import AbstractParser from '../../common/AbstractParser';
import JavaBlockParser from '../JavaBlockParser';
import JavaStatementParser from '../JavaStatementParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';
import { Match } from '../../common/parser-decorators';

export default class JavaWhileLoopParser extends AbstractParser<JavaSyntax.IJavaWhileLoop> {
  @Implements protected getDefault (): JavaSyntax.IJavaWhileLoop {
    return {
      node: JavaSyntax.JavaSyntaxNode.WHILE_LOOP,
      condition: null,
      block: null
    };
  }

  @Override protected onFirstToken (): void {
    this.assertCurrentTokenMatch(JavaConstants.Keyword.WHILE);
    this.next();
  }

  @Match('(')
  protected onCondition (): void {
    this.next();

    this.parsed.condition = this.parseNextWith(JavaStatementParser);

    this.assertCurrentTokenMatch(')');
    this.next();
  }

  @Match('{')
  protected onBlock (): void {
    this.parsed.block = this.parseNextWith(JavaBlockParser);

    this.stop();
  }
}
