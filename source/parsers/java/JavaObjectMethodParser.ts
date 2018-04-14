import AbstractJavaObjectMemberParser from './AbstractJavaObjectMemberParser';
import JavaParameterParser from './JavaParameterParser';
import { parseJavaBlock } from './parseJavaBlock';
import { isAccessModifierKeyword, isModifierKeyword } from './java-utils';
import { ISymbolParser, IWordParser, Matcher } from '../common/parser-types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { TokenType } from 'tokenizer/types';

export default class JavaObjectMethodParser extends AbstractJavaObjectMemberParser<JavaSyntax.IJavaObjectMethod> implements ISymbolParser, IWordParser {
  public readonly symbols: Matcher[] = [
    [/[(,]/, () => this.skip(1)],
    [')', () => this.skip(1)],
    [';', this.finish]
  ];

  public readonly words: Matcher[] = [
    [/./, () => {
      this.matchValue(this.lastCharacterToken.value, [
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

  private _onParameterDeclaration (): void {
    const parameter = this.parseNextWith(JavaParameterParser);

    this.parsed.parameters.push(parameter);
  }
}
