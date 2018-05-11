import AbstractTranslator from '../../common/AbstractTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaImportTranslator extends AbstractTranslator<JavaSyntax.IJavaImport> {
  private staticImport: string;

  @Implements protected translate (): void {
    const { isStaticImport, alias, paths, defaultImport } = this.syntaxNode;

    if (isStaticImport || alias) {
      const lastPath = paths.length > 1
        ? paths.pop()
        : paths[0];

      if (isStaticImport) {
        this.staticImport = lastPath;
      }
    }

    const imports = this.getImports();
    const path = paths.join('/');

    this.emit(`import ${imports} from '${path}';`);

    if (this.staticImport) {
      this.newline()
        .emit(`const { ${this.staticImport} } = ${defaultImport};`);
    }
  }

  private getImports (): string {
    const { defaultImport, nonDefaultImports, alias } = this.syntaxNode;
    let importsString = '';

    if (alias) {
      return `* as ${alias}`;
    } else {
      if (defaultImport) {
        importsString += defaultImport;
      }

      if (nonDefaultImports.length > 0) {
        importsString += defaultImport ? ', ' : '' + `{ ${nonDefaultImports.join(', ')} }`;
      }
    }

    return importsString;
  }
}
