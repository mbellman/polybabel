import AbstractParser from '../common/AbstractParser';
import { Expect, Match, SingleLineParser } from '../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { TokenUtils } from '../../tokenizer/token-utils';

@SingleLineParser
export default class JavaPackageParser extends AbstractParser<JavaSyntax.IJavaPackage> {
  @Implements protected getDefault (): JavaSyntax.IJavaPackage {
    return {
      node: JavaSyntax.JavaSyntaxNode.PACKAGE,
      paths: []
    };
  }

  @Expect(JavaConstants.Keyword.PACKAGE)
  protected onPackage (): void {
    this.next();
  }

  @Expect(TokenUtils.isWord)
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
