import AbstractParser from '../common/AbstractParser';
import JavaObjectMemberParser from './JavaObjectMemberParser';
import JavaParameterParser from './JavaParameterParser';
import { JavaSyntax } from './java-syntax';
import { Parser } from '../common/parser-decorators';
import { TokenType } from 'tokenizer/types';

@Parser({
  type: JavaObjectMethodParser,
  words: [
    [/./, parser => {
      parser.matchValue(parser.previousCharacterToken.value, [
        [/[(,]/, 'onParameterDeclaration']
      ]);
    }]
  ],
  symbols: [
    ['(', 'onParameterBlockOpen'],
    [',', 'onParameterSeparator'],
    [')', 'onParameterBlockClose'],
    [';', 'finish']
  ]
})
export default class JavaObjectMethodParser extends AbstractParser<JavaSyntax.IJavaObjectMethod> {
  public getDefault (): JavaSyntax.IJavaObjectMethod {
    return {
      node: JavaSyntax.JavaSyntaxNode.OBJECT_METHOD,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      type: null,
      name: null,
      parameters: [],
      block: null
    };
  }

  public onFirstToken (): void {
    const { node, ...member } = this.parseNextWith(JavaObjectMemberParser);

    Object.assign(this.parsed, member);
  }

  public onParameterBlockOpen (): void {
    this.assert(this.previousCharacterToken.type === TokenType.WORD);
    this.skip(1);
  }

  public onParameterBlockClose (): void {
    this.assert(this.previousCharacterToken.type === TokenType.WORD);
    this.skip(1);
  }

  public onParameterDeclaration (): void {
    const parameter = this.parseNextWith(JavaParameterParser);

    this.parsed.parameters.push(parameter);
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
}
