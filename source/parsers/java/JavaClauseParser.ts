import AbstractParser from '../common/AbstractParser';
import { Implements, Override } from 'trampoline-framework';
import { isClauseKeyword } from './java-utils';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';

export default class JavaClauseParser extends AbstractParser<JavaSyntax.IJavaClause> {
  @Implements protected getDefault (): JavaSyntax.IJavaClause {
    return {
      node: JavaSyntax.JavaSyntaxNode.CLAUSE,
      values: []
    };
  }

  @Override protected onFirstToken (): void {
    this.assert(isClauseKeyword(this.currentToken.value));
    this.next();
  }

  @Match(',')
  private onSeparator (): void {
    this.next();
  }

  @Match(/^[A-Za-z]/)
  private onClauseValue (): void {
    const { value: previousValue } = this.previousCharacterToken;

    this.assert(
      isClauseKeyword(previousValue) || previousValue === ',',
      `Invalid clause value '${previousValue}'`
    );

    this.parsed.values.push(this.currentToken.value);
  }

  @Match(JavaConstants.ReservedWords)
  private onReservedWord (): void {
    this.stop();
  }

  @Match(/[{;]/)
  private onEnd (): void {
    this.stop();
  }
}
