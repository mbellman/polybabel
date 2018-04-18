import AbstractParser from '../common/AbstractParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';

export default class JavaPackageParser extends AbstractParser<JavaSyntax.IJavaPackage> {
  @Implements protected getDefault (): JavaSyntax.IJavaPackage {
    return {
      node: JavaSyntax.JavaSyntaxNode.PACKAGE,
      path: ''
    };
  }

  @Override protected onFirstToken (): void {
    this.assertCurrentTokenValue(JavaConstants.Keyword.PACKAGE);
    this.next();
  }

  @Match(/\w/)
  private onWord (): void {
    this.parsed.path += this.currentToken.value;
  }

  @Match('.')
  private onDot (): void {
    this.parsed.path += '.';
  }

  @Match(';')
  private onEnd (): void {
    this.finish();
  }
}
