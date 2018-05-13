import AbstractParser from '../../common/AbstractParser';
import JavaBlockParser from '../JavaBlockParser';
import JavaStatementParser from '../JavaStatementParser';
import { Eat } from '../../common/parser-decorators';
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

  @Eat(JavaConstants.Keyword.DO)
  protected onDo (): void {
    this.next();
  }

  @Eat('{')
  protected onDoBlock (): void {
    this.next();

    this.parsed.block = this.parseNextWith(JavaBlockParser);
  }

  @Eat(JavaConstants.Keyword.WHILE)
  protected onWhile (): void {
    this.next();
  }

  @Eat('(')
  protected onWhileCondition (): void {
    this.next();

    this.parsed.condition = this.parseNextWith(JavaStatementParser);
  }

  @Eat(')')
  protected onEnd (): void {
    this.finish();
  }
}
