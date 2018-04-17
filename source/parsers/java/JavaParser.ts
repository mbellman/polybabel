import AbstractParser from '../common/AbstractParser';
import JavaClassParser from './JavaClassParser';
import JavaInterfaceParser from './JavaInterfaceParser';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Lookahead, Match } from '../common/parser-decorators';

export default class JavaParser extends AbstractParser<JavaSyntax.IJavaSyntaxTree> {
  public constructor () {
    super();
  }

  @Implements protected getDefault (): JavaSyntax.IJavaSyntaxTree {
    return {
      node: JavaSyntax.JavaSyntaxNode.TREE,
      nodes: []
    };
  }

  @Lookahead(JavaConstants.Keyword.CLASS)
  private onClass (): void {
    const javaClass = this.parseNextWith(JavaClassParser);

    this.parsed.nodes.push(javaClass);
  }

  @Lookahead(JavaConstants.Keyword.INTERFACE)
  private onInterface (): void {
    const javaInterface = this.parseNextWith(JavaInterfaceParser);

    console.log(javaInterface);

    this.parsed.nodes.push(javaInterface);
  }

  @Match(JavaConstants.Keyword.IMPORT)
  private onImport (): void {

  }

  @Match(JavaConstants.Keyword.PACKAGE)
  private onPackage (): void {

  }
}
