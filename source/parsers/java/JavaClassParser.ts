import AbstractParser from '../common/AbstractParser';
import SyntaxNodeBuilder from '../common/SyntaxNodeBuilder';
import { IToken } from '../../tokenizer/types';
import { JavaSyntax } from './java-syntax';
import { JavaConstants } from './java-constants';

export default class JavaClassParser extends AbstractParser<JavaSyntax.IJavaClass> {
  private _blockLevel: number = 0;
  private _syntaxNodeBuilder: SyntaxNodeBuilder<JavaSyntax.IJavaClass> = new SyntaxNodeBuilder(JavaSyntax.JavaSyntaxNodeType.CLASS);

  public getParsed (): JavaSyntax.IJavaClass {
    return this._syntaxNodeBuilder.getSyntaxNode();
  }

  protected handleNumber (token: IToken): void {

  }

  protected handleSymbol ({ value }: IToken): void {
    switch (value) {
      case '{':
        this._blockLevel++;
        break;
      case '}':
        if (--this._blockLevel === 0) {
          this.finish();
        }
    }
  }

  protected handleWord ({ value, lastToken, nextToken }: IToken): void {
    if (this.isStartOfLine) {
      const isAccessModifier = JavaConstants.AccessModifierKeywords.indexOf(value) > -1;

      if (this.isFirstLine) {
        const className = isAccessModifier
          ? nextToken.nextToken.value
          : nextToken.value;

        this._syntaxNodeBuilder.update('name', className);
      }
    }
  }
}
