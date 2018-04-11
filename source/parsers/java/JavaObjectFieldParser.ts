import JavaExpressionParser from './JavaExpressionParser';
import { AbstractParser, ISymbolParser, Matcher } from '../common/parsers';
import { isAccessModifierKeyword, isModifierKeyword } from './java-utils';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

export default class JavaObjectFieldParser extends AbstractParser<JavaSyntax.IJavaObjectField> implements ISymbolParser {
  public readonly symbols: Matcher[] = [
    ['=', this._onAssignment],
    [';', this.finish]
  ];

  protected getDefault (): JavaSyntax.IJavaObjectField {
    return {
      node: JavaSyntax.JavaSyntaxNode.OBJECT_FIELD,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      type: null
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

  private _onAssignment (): void {
    const expression = this.parseNextWith(JavaExpressionParser);

    this.parsed.value = expression;
  }

  private _onModifierKeyword (): void {
    this.match(this.currentToken.value, [
      [JavaConstants.Keyword.STATIC, () => this.parsed.isStatic = true],
      [JavaConstants.Keyword.FINAL, () => this.parsed.isFinal = true],
      [JavaConstants.Keyword.ABSTRACT, () => this.parsed.isAbstract = true]
    ]);
  }
}
