import AbstractParser from '../common/AbstractParser';
import { JavaSyntax } from './java-syntax';
import { Parser } from '../common/parser-decorators';

@Parser({
  type: JavaBlockParser,
  symbols: [
    ['{', 'next'],
    ['}', 'finish']
  ]
})
export default class JavaBlockParser extends AbstractParser<JavaSyntax.IJavaBlock> {
  public getDefault (): JavaSyntax.IJavaBlock {
    return {
      node: JavaSyntax.JavaSyntaxNode.BLOCK,
      nodes: []
    };
  }
}
