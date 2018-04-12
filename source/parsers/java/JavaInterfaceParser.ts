import AbstractBlockParser from '../common/AbstractBlockParser';
import JavaObjectFieldParser from './JavaObjectFieldParser';
import JavaObjectMethodParser from './JavaObjectMethodParser';
import { isAccessModifierKeyword, isReservedWord } from './java-utils';
import { ISymbolParser, IWordParser, Matcher } from '../common/parser-types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

export default class JavaInterfaceParser extends AbstractBlockParser<JavaSyntax.IJavaInterface> implements ISymbolParser, IWordParser {
  public readonly symbols: Matcher[] = [
    ['{', this.onBlockEnter],
    ['}', this.onBlockExit]
  ];

  public readonly words: Matcher[] = [
    [JavaConstants.Keyword.EXTENDS, this._onExtendsDeclaration],
    [/./, () => {
      if (this.isStartOfLine()) {
        this._onMemberDeclaration();
      } else {
        this.halt();
      }
    }]
  ];

  protected getDefault (): JavaSyntax.IJavaInterface {
    return {
      node: JavaSyntax.JavaSyntaxNode.INTERFACE,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      extends: [],
      fields: [],
      methods: []
    };
  }

  protected onFirstToken (): void {
    const { value } = this.currentToken;

    if (isAccessModifierKeyword(value)) {
      this.parsed.access = JavaConstants.AccessModifierMap[value];

      this.skip(1);
    }

    this.assertCurrentTokenValue(
      JavaConstants.Keyword.INTERFACE,
      `Invalid interface modifier '${this.currentToken.value}'`
    );

    this.parsed.name = this.nextToken.value;

    // Skip over 'interface {name}'
    this.skip(2);
  }

  private _onExtendsDeclaration (): void {
    while (this.currentToken.value !== '{') {
      this.match([
        [JavaConstants.Keyword.EXTENDS, () => this.skip(1)],
        [',', () => this.skip(1)],
        [/\w/, () => {
          this.assert(
            /(extends|,)/.test(this.lastCharacterToken.value),
            `Invalid character '${this.currentToken.value}'`
          );

          this.parsed.extends.push(this.currentToken.value);
          this.skip(1);
        }]
      ]);
    }
  }

  private _onMemberDeclaration (): void {
    const isMethodDeclaration = this.lineContains('(');

    const parsed = isMethodDeclaration
      ? this.parseNextWith(JavaObjectMethodParser)
      : this.parseNextWith(JavaObjectFieldParser);

    if (isMethodDeclaration) {
      this.parsed.methods.push(parsed as JavaSyntax.IJavaObjectMethod);
    } else {
      this.parsed.fields.push(parsed as JavaSyntax.IJavaObjectField);
    }
  }
}
