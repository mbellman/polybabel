import AbstractTranslator from '../common/AbstractTranslator';
import TypeDictionary from '../TypeDictionary';
import { Autowired, Implements, Wired, Override } from 'trampoline-framework';
import { ISyntaxTree } from '../../parser/common/syntax-types';
import { JavaSyntax } from '../../parser/java/java-syntax';

@Wired
export default class JavaTranslator extends AbstractTranslator<JavaSyntax.IJavaSyntaxTree> {
  @Autowired()
  private typeDictionary: TypeDictionary<JavaSyntax.IJavaObject>;

  @Override protected onStart (): void {
    // ...
  }

  @Implements protected emitNode (): void {
    switch (this.currentNode.node) {
      case JavaSyntax.JavaSyntaxNode.IMPORT:
        this.emitImport();
        break;
    }
  }

  private emitImport (): void {
    const { name, path } = this.currentNode as JavaSyntax.IJavaImport;

    this.emit(`import ${name} from '${path}';`);
    this.newline();
  }
}
