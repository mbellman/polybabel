import AbstractValidator from '../common/AbstractValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaImportValidator extends AbstractValidator<JavaSyntax.IJavaImport> {
  @Implements public validate (): void {
    const { isStaticImport, defaultImport, nonDefaultImports } = this.syntaxNode;

    if (defaultImport) {
      this.validateImportName(defaultImport);
      this.scopeManager.addToScope(defaultImport);
    } else if (nonDefaultImports) {
      nonDefaultImports.forEach(nonDefaultImport => {
        this.validateImportName(nonDefaultImport);
        this.scopeManager.addToScope(nonDefaultImport);
      });
    }
  }

  private validateImportName (importName: string): void {
    this.check(
      !/[^\w]/.test(importName),
      `Invalid import name: '${importName}'`
    );
  }
}
