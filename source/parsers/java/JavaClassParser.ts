import { AbstractBlockParser, ISymbolParser, IWordParser, Matcher } from '../common/parsers';
import { isAccessModifierKeyword } from './java-utils';
import { IToken } from '../../tokenizer/types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

export default class JavaClassParser extends AbstractBlockParser<JavaSyntax.IJavaClass> implements ISymbolParser, IWordParser {
  public readonly symbols: Matcher[] = [
    ['{', this.onBlockEnter],
    ['}', this.onBlockExit]
  ];

  public readonly words: Matcher[] = [
    [
      [
        JavaConstants.Keyword.CLASS,
        JavaConstants.Keyword.PUBLIC,
        JavaConstants.Keyword.PROTECTED,
        JavaConstants.Keyword.PRIVATE
      ], () => {
        if (this.isFirstToken) {
          this._onFirstToken();
        } else {
          this._onNestedClassDeclaration();
        }
      }
    ]
  ];

  protected getDefault (): JavaSyntax.IJavaClass {
    return {
      nodeType: JavaSyntax.JavaSyntaxNodeType.CLASS,
      accessModifier: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      nestedClasses: [],
      fields: [],
      methods: []
    };
  }

  private _onFirstToken (): void {
    const { value, nextToken } = this.currentToken;
    const isAccessModifier = isAccessModifierKeyword(value);

    const className = isAccessModifier
      ? nextToken.nextToken.value
      : nextToken.value;

    this.parsed.name = className;

    this.skip(isAccessModifier ? 2 : 1);
  }

  private _onNestedClassDeclaration (): void {
    const javaClass = this.parseNextWith(JavaClassParser);

    this.parsed.nestedClasses.push(javaClass);
  }
}
