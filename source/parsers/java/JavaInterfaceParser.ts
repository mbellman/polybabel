import JavaObjectFieldParser from './JavaObjectFieldParser';
import JavaObjectMethodParser from './JavaObjectMethodParser';
import { AbstractBlockParser, ISymbolParser, IWordParser, Matcher } from '../common/parsers';
import { isAccessModifierKeyword, isReservedWord } from './java-utils';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

export default class JavaInterfaceParser extends AbstractBlockParser<JavaSyntax.IJavaInterface> implements ISymbolParser, IWordParser {
  public readonly symbols: Matcher[] = [
    ['{', this.onBlockEnter],
    ['}', this.onBlockExit]
  ];

  public readonly words: Matcher[] = [
    [JavaConstants.Keyword.EXTENDS, this._onExtendsDeclaration],
    [JavaConstants.Keywords, () => this.halt('keyword')],
    [/./, () => {
      if (this.isStartOfLine) {
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

    // Skip 'interface'
    this.skip(1);

    this.parsed.name = this.currentToken.value;

    this.skip(1);
  }

  private _onExtendsDeclaration (): void {
    while (this.currentToken.value !== '{') {
      this.match(this.currentToken.value, [
        [JavaConstants.Keyword.EXTENDS, () => this.skip(1)],
        [',', () => this.skip(1)],
        [/\w/, () => {
          // TODO: Assert that base interface names are all comma-separated
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
