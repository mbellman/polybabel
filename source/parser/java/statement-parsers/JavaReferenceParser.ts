import AbstractParser from '../../common/AbstractParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaSyntax } from '../java-syntax';
import { TokenUtils } from '../../../tokenizer/token-utils';

export default class JavaReferenceParser extends AbstractParser<JavaSyntax.IJavaReference> {
  @Implements protected getDefault (): JavaSyntax.IJavaReference {
    return {
      node: JavaSyntax.JavaSyntaxNode.REFERENCE,
      value: null
    };
  }

  @Override protected onFirstToken (): void {
    this.assertCurrentTokenMatch(TokenUtils.isWord);

    this.parsed.value = this.currentToken.value;

    this.finish();
  }
}
