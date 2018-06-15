import AbstractValidator from '../common/AbstractValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaImportValidator extends AbstractValidator<JavaSyntax.IJavaImport> {
  @Implements public validate (): void {
    const { token, defaultImport, nonDefaultImports, paths } = this.syntaxNode;
    const sourceFile = paths.join('/');

    this.focusToken(token);

    if (defaultImport) {
      this.handleImport(defaultImport, sourceFile);
    } else if (nonDefaultImports.length > 1) {
      nonDefaultImports.forEach(nonDefaultImport => this.handleImport(nonDefaultImport, sourceFile));
    }
  }

  private handleImport (importName: string, sourceFile: string): void {
    this.check(
      !/[^\w]/.test(importName),
      `Invalid import name: '${importName}'`
    );

    this.mapImportToSourceFile(importName, sourceFile);
    this.context.scopeManager.addToScope(importName);
  }
}
