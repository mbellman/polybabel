import AbstractParser from '../common/AbstractParser';
import JavaParameterParser from './JavaParameterParser';
import { isAccessModifierKeyword, isModifierKeyword } from './java-utils';
import { ISymbolParser, IWordParser, Matcher } from '../common/parser-types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

export default class JavaObjectMethodParser extends AbstractParser<JavaSyntax.IJavaObjectMethod> implements ISymbolParser, IWordParser {
  public readonly symbols: Matcher[] = [
    [/[(,]/, () => {
      this.skip(1);
      this._onParameterDeclaration();
    }],
    [')', () => this.skip(1)],
    [';', this.finish]
  ];

  public readonly words: Matcher[] = [
    [/./, () => {
      this.match(this.currentToken.lastToken.value, [
        [/[(,]/, this._onParameterDeclaration]
      ]);
    }]
  ];

  protected getDefault (): JavaSyntax.IJavaObjectMethod {
    return {
      node: JavaSyntax.JavaSyntaxNode.OBJECT_METHOD,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      type: null,
      name: null,
      parameters: [],
      nodes: []
    };
  }

  protected onFirstToken (): void {
    const { value } = this.currentToken;

    if (isAccessModifierKeyword(value)) {
      this.parsed.access = JavaConstants.AccessModifierMap[value];

      this.skip(1);
    }

    while (isModifierKeyword(this.currentToken.value)) {
      this._onModifierKeyword();
      this.skip(1);
    }

    this.parsed.type = this.currentToken.value;
    this.parsed.name = this.currentToken.nextToken.value;

    this.skip(2);
  }

  private _onModifierKeyword (): void {
    this.match(this.currentToken.value, [
      [JavaConstants.Keyword.STATIC, () => this.parsed.isStatic = true],
      [JavaConstants.Keyword.FINAL, () => this.parsed.isFinal = true],
      [JavaConstants.Keyword.ABSTRACT, () => this.parsed.isAbstract = true]
    ]);
  }

  private _onParameterDeclaration (): void {
    const parameter = this.parseNextWith(JavaParameterParser);

    this.parsed.parameters.push(parameter);
  }
}
