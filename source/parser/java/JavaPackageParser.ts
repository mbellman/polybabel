import AbstractParser from '../common/AbstractParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';
import { TokenUtils } from '../../tokenizer/token-utils';

export default class JavaPackageParser extends AbstractParser<JavaSyntax.IJavaPackage> {
  @Implements protected getDefault (): JavaSyntax.IJavaPackage {
    return {
      node: JavaSyntax.JavaSyntaxNode.PACKAGE,
      paths: []
    };
  }

  @Override protected onFirstToken (): void {
    this.assertCurrentTokenMatch(JavaConstants.Keyword.PACKAGE);
    this.next();
  }

  @Match(TokenUtils.isWord)
  protected onPackagePath (): void {
    this.parsed.paths.push(this.currentToken.value);
  }

  @Match('.')
  protected onDot (): void {
    this.next();
  }

  @Match(';')
  protected onEnd (): void {
    this.finish();
  }
}
