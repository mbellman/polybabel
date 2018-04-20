import AbstractParser from '../common/AbstractParser';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';
import { Implements } from 'trampoline-framework';

export default class JavaBlockParser extends AbstractParser<JavaSyntax.IJavaBlock> {
  @Implements protected getDefault (): JavaSyntax.IJavaBlock {
    return {
      node: JavaSyntax.JavaSyntaxNode.BLOCK,
      nodes: []
    };
  }
}
