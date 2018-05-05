import AbstractParser from '../../common/AbstractParser';
import { Eat } from '../../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../java-syntax';
import { TokenUtils } from '../../../tokenizer/token-utils';

export default class JavaReferenceParser extends AbstractParser<JavaSyntax.IJavaReference> {
  @Implements protected getDefault (): JavaSyntax.IJavaReference {
    return {
      node: JavaSyntax.JavaSyntaxNode.REFERENCE,
      value: null
    };
  }

  @Eat(TokenUtils.isWord)
  protected onReference (): void {
    this.parsed.value = this.currentToken.value;

    this.finish();
  }
}
