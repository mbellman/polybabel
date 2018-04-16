import AbstractParser from '../common/AbstractParser';
import JavaClauseParser from './JavaClauseParser';
import JavaObjectMemberParser from './JavaObjectMemberParser';
import JavaParameterParser from './JavaParameterParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaSyntax } from './java-syntax';
import { Parser } from '../common/parser-decorators';
import { TokenType } from 'tokenizer/types';
import { JavaConstants } from './java-constants';

@Parser({
  type: JavaObjectMethodParser,
  words: [
    [JavaConstants.Keyword.THROWS, 'onThrowsClause'],
    [/./, 'onParameterDeclaration']
  ],
  symbols: [
    ['(', 'onParametersStart'],
    [',', 'onParameterSeparator'],
    [')', 'onParametersEnd'],
    // TODO Handle method { } blocks
    [';', 'finish']
  ]
})
export default class JavaObjectMethodParser extends AbstractParser<JavaSyntax.IJavaObjectMethod> {
  @Implements public getDefault (): JavaSyntax.IJavaObjectMethod {
    return {
      node: JavaSyntax.JavaSyntaxNode.OBJECT_METHOD,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      type: null,
      name: null,
      parameters: [],
      block: null
    };
  }

  @Override public onFirstToken (): void {
    const { node, ...member } = this.parseNextWith(JavaObjectMemberParser);

    Object.assign(this.parsed, member);
  }

  public onParameterDeclaration (): void {
    const parameter = this.parseNextWith(JavaParameterParser);

    this.parsed.parameters.push(parameter);
  }

  public onParametersEnd (): void {
    this.assert(this.previousCharacterToken.type === TokenType.WORD);
    this.skip(1);
  }

  public onParameterSeparator (): void {
    const { previousCharacterToken, nextCharacterToken } = this;

    this.assert(
      previousCharacterToken.type === TokenType.WORD,
      `Invalid parameter name '${previousCharacterToken.value}'`
    );

    this.assert(
      nextCharacterToken.type === TokenType.WORD || nextCharacterToken.value === ')',
      `Invalid parameter type '${nextCharacterToken.value}'`
    );

    this.skip(1);
  }

  public onParametersStart (): void {
    this.assert(this.previousCharacterToken.type === TokenType.WORD);
    this.skip(1);
  }

  public onThrowsClause (): void {
    const throwsClause = this.parseNextWith(JavaClauseParser);

    this.parsed.throws = throwsClause.values;
  }
}
