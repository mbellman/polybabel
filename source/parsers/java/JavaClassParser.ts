import AbstractParser from '../common/AbstractParser';
import BlockParser from '../common/BlockParser';
import JavaBlockParser from './JavaBlockParser';
import Parser from '../common/Parser';
import { Composes, Matches } from '../common/parser-decorators';
import { isAccessModifierKeyword } from './java-utils';
import { IWords, TokenMatcher } from '../common/parser-types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

@Matches<IWords>()
@Composes(
  Parser,
  JavaBlockParser
)
export default abstract class JavaClassParser extends AbstractParser<JavaSyntax.IJavaClass> {
  public static readonly words: TokenMatcher<BlockParser & JavaClassParser>[] = [
    [
      [
        JavaConstants.Keyword.CLASS,
        JavaConstants.Keyword.PUBLIC,
        JavaConstants.Keyword.PROTECTED,
        JavaConstants.Keyword.PRIVATE
      ],
      parser => {
        if (parser.blockLevel === 1) {
          parser._onNestedClassDeclaration();
        } else {
          parser.halt();
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
