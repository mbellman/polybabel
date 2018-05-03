import AbstractTranslator from '../../common/AbstractTranslator';
import JavaImportTranslator from './JavaImportTranslator';
import JavaInterfaceTranslator from './JavaInterfaceTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaTranslator extends AbstractTranslator<JavaSyntax.IJavaSyntaxTree> {
  public constructor (syntaxTree: JavaSyntax.IJavaSyntaxTree) {
    super(syntaxTree);
  }

  @Implements protected translate (): void {
    const { nodes } = this.syntaxNode;

    nodes.forEach(syntaxNode => {
      switch (syntaxNode.node) {
        case JavaSyntax.JavaSyntaxNode.IMPORT:
          this.emitNodeWith(syntaxNode, JavaImportTranslator);
          break;
        case JavaSyntax.JavaSyntaxNode.INTERFACE:
          this.emitNodeWith(syntaxNode, JavaInterfaceTranslator);
          break;
      }
    });
  }
}
