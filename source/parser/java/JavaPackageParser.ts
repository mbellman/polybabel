import AbstractParser from '../common/AbstractParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match, Eat } from '../common/parser-decorators';
import { TokenUtils } from '../../tokenizer/token-utils';

export default class JavaPackageParser extends AbstractParser<JavaSyntax.IJavaPackage> {
  @Implements protected getDefault (): JavaSyntax.IJavaPackage {
    return {
      node: JavaSyntax.JavaSyntaxNode.PACKAGE,
      paths: []
    };
  }

  @Eat(JavaConstants.Keyword.PACKAGE)
  protected onPackage (): void {
    this.next();
  }

  @Eat(TokenUtils.isWord)
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
