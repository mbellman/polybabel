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
    this.parsed.name = this.currentToken.value;

    this.assert(TokenUtils.isWord(this.currentToken));
    this.finish();
  }
}
