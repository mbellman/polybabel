import AbstractParser from '../../common/AbstractParser';
import JavaBlockParser from '../JavaBlockParser';
import JavaStatementParser from '../JavaStatementParser';
import { Eat, Allow } from '../../common/parser-decorators';
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

  @Eat(JavaConstants.Keyword.WHILE)
  protected onWhile (): void {
    this.next();
  }

  @Eat('(')
  protected onCondition (): void {
    this.next();

    this.parsed.condition = this.parseNextWith(JavaStatementParser);
  }

  @Eat(')')
  protected onConditionEnd (): void {
    this.next();
  }

  @Allow('{')
  protected onBlock (): void {
    this.parsed.block = this.parseNextWith(JavaBlockParser);

    this.stop();
  }

  @Allow(/./)
  protected onSingleLineWhileLoop (): void {
    const statement = this.parseNextWith(JavaStatementParser);

    this.parsed.block = {
      node: JavaSyntax.JavaSyntaxNode.BLOCK,
      nodes: [ statement ]
    };

    this.stop();
  }
}
