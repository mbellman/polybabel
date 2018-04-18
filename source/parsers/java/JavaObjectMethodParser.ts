import AbstractParser from '../common/AbstractParser';
import JavaClauseParser from './JavaClauseParser';
import JavaObjectMemberParser from './JavaObjectMemberParser';
import JavaParameterParser from './JavaParameterParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';
import { TokenType } from 'tokenizer/types';

export default class JavaObjectMethodParser extends AbstractParser<JavaSyntax.IJavaObjectMethod> {
  @Implements protected getDefault (): JavaSyntax.IJavaObjectMethod {
    return {
      node: JavaSyntax.JavaSyntaxNode.OBJECT_METHOD,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      type: null,
      name: null,
      parameters: [],
      block: null
    };
  }

  @Override protected onFirstToken (): void {
    this.emulate(JavaObjectMemberParser);
  }

  @Match('(')
  private onParametersStart (): void {
    this.assert(this.previousCharacterToken.type === TokenType.WORD);
    this.next();
  }

  @Match(/./)
  private onParameterDeclaration (): void {
    const parameter = this.parseNextWith(JavaParameterParser);

    this.parsed.parameters.push(parameter);
  }

  @Match(',')
  private onParameterSeparator (): void {
    const { previousCharacterToken, nextCharacterToken } = this;

    this.assert(
      previousCharacterToken.type === TokenType.WORD,
      `Invalid parameter name '${previousCharacterToken.value}'`
    );

    this.assert(
      nextCharacterToken.type === TokenType.WORD || nextCharacterToken.value === ')',
      `Invalid parameter type '${nextCharacterToken.value}'`
    );

    this.next();
  }

  @Match(')')
  private onParametersEnd (): void {
    this.assert(this.previousCharacterToken.type === TokenType.WORD);
    this.next();
  }

  @Match(JavaConstants.Keyword.THROWS)
  private onThrowsClause (): void {
    const throwsClause = this.parseNextWith(JavaClauseParser);

    this.parsed.throws = throwsClause.values;
  }

  @Match(';')
  private onFinish (): void {
    this.finish();
  }
}
