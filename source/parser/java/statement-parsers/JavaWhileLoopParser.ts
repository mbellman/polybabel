import AbstractParser from '../../common/AbstractParser';
import JavaBlockParser from '../JavaBlockParser';
import JavaStatementParser from '../JavaStatementParser';
import { Allow, Expect } from '../../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';

export default class JavaWhileLoopParser extends AbstractParser<JavaSyntax.IJavaWhileLoop> {
  @Implements protected getDefault (): JavaSyntax.IJavaWhileLoop {
    return {
      node: JavaSyntax.JavaSyntaxNode.WHILE_LOOP,
      condition: null,
      block: null
    };
  }

  @Expect(JavaConstants.Keyword.WHILE)
  protected onWhile (): void {
    this.next();
  }

  @Expect('(')
  protected onCondition (): void {
    this.next();

    this.parsed.condition = this.parseNextWith(JavaStatementParser);
  }

  @Expect(')')
  protected onConditionEnd (): void {
    this.next();
  }

  @Allow('{')
  protected onBlock (): void {
    this.parsed.block = this.parseNextWith(JavaBlockParser);

    this.stop();
  }

  @Allow(/./)
  protected onInlineLineWhileLoop (): void {
    const statement = this.parseNextWith(JavaStatementParser);

    this.parsed.block = {
      node: JavaSyntax.JavaSyntaxNode.BLOCK,
      nodes: [ statement ]
    };

    this.stop();
  }
}
