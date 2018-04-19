import AbstractParser from '../common/AbstractParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';
import { Pattern } from '../common/parser-types';

export default class JavaImportParser extends AbstractParser<JavaSyntax.IJavaImport> {
  @Implements protected getDefault (): JavaSyntax.IJavaImport {
    return {
      node: JavaSyntax.JavaSyntaxNode.IMPORT,
      name: null,
      path: ''
    };
  }

  @Override protected onFirstToken (): void {
    this.assertCurrentTokenValue(JavaConstants.Keyword.IMPORT);
    this.next();
  }

  @Match(Pattern.WORD)
  private onWord (): void {
    this.parsed.path += this.currentToken.value;
  }

  @Match('.')
  private onDot (): void {
    this.parsed.path += '/';
  }

  @Match(';')
  private onEnd (): void {
    this.parsed.name = this.previousToken.value;

    this.finish();
  }
}
