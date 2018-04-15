import AbstractParser from '../common/AbstractParser';
import { isAccessModifierKeyword } from './java-utils';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Parser } from '../common/parser-decorators';

@Parser({
  type: JavaClassParser,
  words: [
    [/./, parser => {
      if (parser.isStartOfLine()) {
        parser.onClassMemberDeclaration();
      } else {
        parser.halt();
      }
    }]
  ]
})
export default abstract class JavaClassParser extends AbstractParser<JavaSyntax.IJavaClass> {
  public getDefault (): JavaSyntax.IJavaClass {
    return {
      node: JavaSyntax.JavaSyntaxNode.CLASS,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      nestedClasses: [],
      fields: [],
      methods: []
    };
  }

  public onClassMemberDeclaration (): void {
    this.halt();
  }

  public onFirstToken (): void {
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

  public onNestedClassDeclaration (): void {
    const javaClass = this.parseNextWith(JavaClassParser);

    this.parsed.nestedClasses.push(javaClass);
  }
}
