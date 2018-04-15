import AbstractParser from '../common/AbstractParser';
import JavaObjectFieldParser from './JavaObjectFieldParser';
import JavaObjectMethodParser from './JavaObjectMethodParser';
import { isAccessModifierKeyword } from './java-utils';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Parser } from '../common/parser-decorators';

@Parser({
  type: JavaInterfaceParser,
  words: [
    [JavaConstants.Keyword.EXTENDS, 'onExtendsDeclaration'],
    [/./, parser => {
      if (parser.isStartOfLine()) {
        parser.onMemberDeclaration();
      } else {
        parser.halt();
      }
    }]
  ],
  symbols: [
    ['{', parser => parser.skip(1)],
    ['}', parser => parser.finish()]
  ]
})
export default class JavaInterfaceParser extends AbstractParser<JavaSyntax.IJavaInterface> {
  public getDefault (): JavaSyntax.IJavaInterface {
    return {
      node: JavaSyntax.JavaSyntaxNode.INTERFACE,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      extends: [],
      fields: [],
      methods: []
    };
  }

  public onFirstToken (): void {
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

  public onExtendsDeclaration (): void {
    while (this.currentToken.value !== '{') {
      this.match([
        [JavaConstants.Keyword.EXTENDS, () => this.skip(1)],
        [',', () => this.skip(1)],
        [/\w/, () => {
          this.assert(
            /(extends|,)/.test(this.previousCharacterToken.value),
            `Invalid character '${this.currentToken.value}'`
          );

          this.parsed.extends.push(this.currentToken.value);
          this.skip(1);
        }]
      ]);
    }
  }

  public onMemberDeclaration (): void {
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
