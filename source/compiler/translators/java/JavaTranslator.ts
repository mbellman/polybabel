import AbstractTranslator from '../common/AbstractTranslator';
import JavaClassTranslator from './JavaClassTranslator';
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
          this.emitNodeWith(JavaImportTranslator, syntaxNode as JavaSyntax.IJavaImport);
          break;
        case JavaSyntax.JavaSyntaxNode.CLASS:
          const classNode = syntaxNode as JavaSyntax.IJavaClass;

          this.emit(`var ${classNode.name} = `)
            .emitNodeWith(JavaClassTranslator, classNode);
          break;
        case JavaSyntax.JavaSyntaxNode.INTERFACE:
          const interfaceNode = syntaxNode as JavaSyntax.IJavaInterface;

          this.emit(`var ${interfaceNode.name} = `)
            .emitNodeWith(JavaInterfaceTranslator, interfaceNode);
          break;
      }

      this.newline();
    });
  }
}
