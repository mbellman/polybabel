import AbstractParser from '../../common/AbstractParser';
import JavaBlockParser from '../JavaBlockParser';
import JavaStatementParser from '../JavaStatementParser';
import { Expect } from '../../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';

export default class JavaDoWhileLoopParser extends AbstractParser<JavaSyntax.IJavaDoWhileLoop> {
  @Implements protected getDefault (): JavaSyntax.IJavaDoWhileLoop {
    return {
      node: JavaSyntax.JavaSyntaxNode.DO_WHILE_LOOP,
      block: null,
      condition: null
    };
  }

  @Expect(JavaConstants.Keyword.DO)
  protected onDo (): void {
    this.next();
  }

  @Expect('{')
  protected onDoBlock (): void {
    this.next();

    this.parsed.block = this.parseNextWith(JavaBlockParser);
  }

  @Expect(JavaConstants.Keyword.WHILE)
  protected onWhile (): void {
    this.next();
  }

  @Expect('(')
  protected onWhileCondition (): void {
    this.next();

    this.parsed.condition = this.parseNextWith(JavaStatementParser);
  }

  @Expect(')')
  protected onEnd (): void {
    this.finish();
  }
}
