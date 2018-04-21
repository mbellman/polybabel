import AbstractParser from '../common/AbstractParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';
import { TokenUtils } from '../../tokenizer/token-utils';

export default class JavaImportParser extends AbstractParser<JavaSyntax.IJavaImport> {
  @Implements protected getDefault (): JavaSyntax.IJavaImport {
    return {
      node: JavaSyntax.JavaSyntaxNode.IMPORT,
      name: null,
      path: ''
    };
  }

  @Override protected onFirstToken (): void {
    this.assertCurrentTokenMatch(JavaConstants.Keyword.IMPORT);
    this.next();
  }

  @Match(TokenUtils.isAny)
  protected onFolderPath (): void {
    this.parsed.path += this.currentToken.value;
  }

  @Match('.')
  protected onDot (): void {
    this.parsed.path += '/';
  }

  @Match(';')
  protected onEnd (): void {
    this.parsed.name = this.previousToken.value;

    this.finish();
  }
}
