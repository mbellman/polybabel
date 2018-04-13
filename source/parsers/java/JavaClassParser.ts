import AbstractBlockParser from '../common/AbstractBlockParser';
import { isAccessModifierKeyword } from './java-utils';
import { ISymbolParser, IWordParser, Matcher } from '../common/parser-types';
import { IToken } from '../../tokenizer/types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

function onNestedClassDeclaration (stream): void {

}

export const parseJavaClass = createComposedParser(
  javaBlockParser
)({
  words: [
    [
      [
        JavaConstants.Keyword.CLASS,
        JavaConstants.Keyword.PUBLIC,
        JavaConstants.Keyword.PROTECTED,
        JavaConstants.Keyword.PRIVATE
      ],
      stream => {
        if (this.blockLevel === 1) {
          this.onNestedClassDeclaration(stream);
        } else {
          stream.halt();
        }
      }
    ]
  ],

  onFirstToken: stream => {
    const { value, nextToken } = stream.currentToken;

    if (isAccessModifierKeyword(value)) {
      stream.parsed.access = JavaConstants.AccessModifierMap[value];

      stream.skip(1);
    }

    stream.match([
      [JavaConstants.Keyword.FINAL, () => {
        stream.parsed.isFinal = true;
        stream.skip(1);
      }]
    ]);

    stream.parsed.name = stream.currentToken.value;

    stream.skip(1);
  },

  onNestedClassDeclaration: stream => {

  }
});

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
      ],
      () => {
        if (this.blockLevel === 1) {
          this._onNestedClassDeclaration();
        } else {
          this.halt();
        }
      }
    ]
  ];

  protected getDefault (): JavaSyntax.IJavaClass {
    return {
      node: JavaSyntax.JavaSyntaxNode.CLASS,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      nestedClasses: [],
      fields: [],
      methods: []
    };
  }

  protected onFirstToken (): void {
    const { value, nextToken } = this.currentToken;

    if (isAccessModifierKeyword(value)) {
      this.parsed.access = JavaConstants.AccessModifierMap[value];

      this.skip(1);
    }

    this.match([
      [JavaConstants.Keyword.FINAL, () => {
        this.parsed.isFinal = true;
        this.skip(1);
      }]
    ]);

    this.parsed.name = this.currentToken.value;

    this.skip(1);
  }

  private _onNestedClassDeclaration (): void {
    const javaClass = this.parseNextWith(JavaClassParser);

    this.parsed.nestedClasses.push(javaClass);
  }
}
