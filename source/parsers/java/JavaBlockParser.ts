import AbstractParser from '../common/AbstractParser';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';

export default class JavaBlockParser extends AbstractParser<JavaSyntax.IJavaBlock> {
  public getDefault (): JavaSyntax.IJavaBlock {
    return {
      node: JavaSyntax.JavaSyntaxNode.BLOCK,
      nodes: []
    };
  }
}
