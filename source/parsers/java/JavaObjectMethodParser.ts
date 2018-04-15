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

  public onParameterBlockOpen (): void {
    this.assert(this.previousToken.type === TokenType.WORD);
    this.skip(1);
  }

  public onParameterBlockClose (): void {
    this.assert(this.previousToken.type === TokenType.WORD);
    this.skip(1);
  }

  public onParameterSeparator (): void {
    const { previousToken, nextToken } = this;

    const isValidParameterSeparator =
      previousToken.type === TokenType.WORD &&
      nextToken.type === TokenType.WORD ||
      nextToken.value === ')';

    this.assert(isValidParameterSeparator);
    this.skip(1);
  }

  public onFirstToken (): void {
    const { node, ...member } = this.parseNextWith(JavaObjectMemberParser);

    Object.assign(this.parsed, member);
  }

  public onParameterDeclaration (): void {
    const parameter = this.parseNextWith(JavaParameterParser);

    this.parsed.parameters.push(parameter);
  }
}
