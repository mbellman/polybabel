import AbstractParser from '../common/AbstractParser';
import JavaClassParser from './JavaClassParser';
import JavaImportParser from './JavaImportParser';
import JavaInterfaceParser from './JavaInterfaceParser';
import JavaPackageParser from './JavaPackageParser';
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
      package: null,
      nodes: []
    };
  }

  @Match(JavaConstants.Keyword.PACKAGE)
  private onPackage (): void {
    this.parsed.package = this.parseNextWith(JavaPackageParser);
  }

  @Match(JavaConstants.Keyword.IMPORT)
  private onImport (): void {
    const javaImport = this.parseNextWith(JavaImportParser);

    this.parsed.nodes.push(javaImport);
  }

  @Lookahead(JavaConstants.Keyword.INTERFACE)
  private onInterface (): void {
    const javaInterface = this.parseNextWith(JavaInterfaceParser);

    this.parsed.nodes.push(javaInterface);
  }

  @Lookahead(JavaConstants.Keyword.CLASS)
  private onClass (): void {
    const javaClass = this.parseNextWith(JavaClassParser);

    this.parsed.nodes.push(javaClass);
  }
}
