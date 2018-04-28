import AbstractParser from '../../common/AbstractParser';
import JavaTypeParser from '../JavaTypeParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';
import { Match } from '../../common/parser-decorators';
import { TokenUtils } from '../../../tokenizer/token-utils';

export default class JavaVariableDeclarationParser extends AbstractParser<JavaSyntax.IJavaVariableDeclaration> {
  @Implements protected getDefault (): JavaSyntax.IJavaVariableDeclaration {
    return {
      node: JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION,
      type: null,
      name: null
    };
  }

  @Override protected onFirstToken (): void {
    if (this.currentTokenMatches(JavaConstants.Keyword.FINAL)) {
      this.parsed.isFinal = true;

      this.next();
    }

    this.parsed.type = this.parseNextWith(JavaTypeParser);
  }

  @Match('.')
  protected onVarargs (): void {
    this.assert(!this.parsed.isVariadic);

    for (let i = 0; i < 3; i++) {
      if (!this.currentTokenMatches('.')) {
        this.halt();
      }

      this.next();
    }

    this.parsed.isVariadic = true;
  }

  @Match(TokenUtils.isWord)
  protected onVariableName (): void {
    this.parsed.name = this.currentToken.value;

    this.finish();
  }
}
