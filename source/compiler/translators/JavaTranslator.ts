import AbstractTranslator from '../common/AbstractTranslator';
import TypeDictionary from '../TypeDictionary';
import { Autowired, Implements, Override, Wired } from 'trampoline-framework';
import { ISyntaxTree } from '../../parser/common/syntax-types';
import { JavaSyntax } from '../../parser/java/java-syntax';

export default class JavaTranslator extends AbstractTranslator<JavaSyntax.IJavaSyntaxTree> {
  @Implements protected emitNode (): void {
    switch (this.currentNode.node) {
      case JavaSyntax.JavaSyntaxNode.IMPORT:
        this.emitImport();
        break;
    }
  }

  private emitImport (): void {
    const { paths, defaultImport, nonDefaultImports, isStaticImport, alias } = this.currentNode as JavaSyntax.IJavaImport;
    let staticImport: string;

    if (isStaticImport) {
      staticImport = paths.pop();
    }

    const path = paths.join('/');
    let imports = '';

    if (alias) {
      imports += `* as ${alias}`;

      this.scopeManager.addToScope(alias);
    } else {
      if (defaultImport) {
        imports += defaultImport;

        this.scopeManager.addToScope(defaultImport);
      }

      if (nonDefaultImports.length > 0) {
        if (isStaticImport) {
          this.error('Non-default imports cannot be statically imported');

          return;
        }

        nonDefaultImports.forEach(nonDefaultImport => {
          this.scopeManager.addToScope(nonDefaultImport);
        });

        const destructuredImports = `{ ${nonDefaultImports.join(', ')} }`;

        imports += !!defaultImport ? ', ' : '' + destructuredImports;
      }
    }

    this.emit(`import ${imports} from '${path}';`);
    this.newline();

    if (staticImport) {
      this.emit(`const { ${staticImport} } = ${defaultImport};`);
      this.newline();
    }
  }
}
