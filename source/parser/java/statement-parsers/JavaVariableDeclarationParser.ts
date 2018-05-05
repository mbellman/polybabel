import AbstractParser from '../../common/AbstractParser';
import JavaTypeParser from '../JavaTypeParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';
import { Match, Allow, Eat } from '../../common/parser-decorators';
import { TokenUtils } from '../../../tokenizer/token-utils';

export default class JavaVariableDeclarationParser extends AbstractParser<JavaSyntax.IJavaVariableDeclaration> {
  @Implements protected getDefault (): JavaSyntax.IJavaVariableDeclaration {
    return {
      node: JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION,
      type: null,
      name: null
    };
  }

  @Allow(JavaConstants.Keyword.FINAL)
  protected onFinalModifier (): void {
    this.parsed.isFinal = true;
  }

  @Eat(TokenUtils.isWord)
  protected onType (): void {
    this.parsed.type = this.parseNextWith(JavaTypeParser);
  }

  @Allow('.')
  protected onVarargs (): void {
    this.assert(!this.parsed.isVariadic);

    for (let i = 0; i < 3; i++) {
      this.assertCurrentTokenMatch('.');
      this.next();
    }

    this.parsed.isVariadic = true;
  }

  @Eat(TokenUtils.isWord)
  protected onVariableName (): void {
    this.parsed.name = this.currentToken.value;
  }

  @Match('[')
  private onStartTypeArrayDimension (): void {
    this.assert(this.nextToken.value === ']');
  }

  @Match(']')
  private onEndTypeArrayDimension (): void {
    this.assert(this.previousToken.value === '[');

    this.parsed.type.arrayDimensions++;
  }

  @Match(/./)
  protected onEnd (): void {
    this.stop();
  }
}
