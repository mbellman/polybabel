import AbstractParser from '../common/AbstractParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';
import { Pattern } from '../common/parser-types';

export default class JavaPackageParser extends AbstractParser<JavaSyntax.IJavaPackage> {
  @Implements protected getDefault (): JavaSyntax.IJavaPackage {
    return {
      node: JavaSyntax.JavaSyntaxNode.PACKAGE,
      path: ''
    };
  }

  @Override protected onFirstToken (): void {
    this.assertCurrentTokenMatch(JavaConstants.Keyword.PACKAGE);
    this.next();
  }

  @Match(Pattern.WORD)
  protected onWord (): void {
    this.parsed.path += this.currentToken.value;
  }

  @Match('.')
  protected onDot (): void {
    this.parsed.path += '.';
  }

  @Match(';')
  protected onEnd (): void {
    this.finish();
  }
}
