import AbstractParser from '../common/AbstractParser';
import JavaVariableParser from './JavaVariableParser';
import { Constructor, Implements, Override } from 'trampoline-framework';
import { JavaSyntax } from './java-syntax';
import { JavaUtils } from './java-utils';
import { Match } from '../common/parser-decorators';
import { TokenType } from '../../tokenizer/types';

export default class JavaBlockParser extends AbstractParser<JavaSyntax.IJavaBlock> {
  @Implements protected getDefault (): JavaSyntax.IJavaBlock {
    return {
      node: JavaSyntax.JavaSyntaxNode.BLOCK,
      nodes: []
    };
  }

  @Match(JavaUtils.isVariable)
  protected onVariable (): void {
    this.parseNodeWith(JavaVariableParser);
  }

  @Match('}')
  protected onExitBlock (): void {
    this.finish();
  }

  private parseNodeWith (Parser: Constructor<AbstractParser<JavaSyntax.IJavaSyntaxNode>>): void {
    const node = this.parseNextWith(Parser);

    this.parsed.nodes.push(node);
  }
}
