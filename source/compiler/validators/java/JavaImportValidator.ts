import AbstractValidator from '../../common/AbstractValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaImportValidator extends AbstractValidator<JavaSyntax.IJavaImport> {
  @Implements public validate (javaImport: JavaSyntax.IJavaImport): void {
    const { isStaticImport, defaultImport, nonDefaultImports } = javaImport;

    if (defaultImport) {
      this.validateImportName(defaultImport);
      this.addSymbolToScope(defaultImport);
    } else if (nonDefaultImports) {
      nonDefaultImports.forEach(nonDefaultImport => {
        this.validateImportName(nonDefaultImport);
        this.addSymbolToScope(nonDefaultImport);
      });
    }
  }

  private validateImportName (importName: string): void {
    this.assert(
      !/[^\w]/.test(importName),
      `Invalid import name: '${importName}'`
    );
  }
}
