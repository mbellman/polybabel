import AbstractValidator from '../common/AbstractValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaImportValidator extends AbstractValidator<JavaSyntax.IJavaImport> {
  @Implements public validate (): void {
    const { token, defaultImport, nonDefaultImports, paths } = this.syntaxNode;
    const sourceFile = paths.join('/');

    this.focusToken(token);

    if (defaultImport) {
      this.handleImportName(defaultImport, sourceFile);
    } else if (nonDefaultImports.length > 1) {
      nonDefaultImports.forEach(nonDefaultImport => this.handleImportName(nonDefaultImport, sourceFile));
    }
  }

  private handleImportName (importName: string, sourceFile: string): void {
    this.check(
      !/[^\w]/.test(importName),
      `Invalid import name: '${importName}'`
    );

    const importConstraint = this.context.symbolDictionary.getSymbolConstraint(sourceFile + importName);

    this.context.scopeManager.addToScope(importName, {
      constraint: importConstraint,
      isConstant: true
    });
  }
}
