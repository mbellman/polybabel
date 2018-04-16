import AbstractParser from '../common/AbstractParser';
import { Implements, Override } from 'trampoline-framework';
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
export default class JavaClassParser extends AbstractParser<JavaSyntax.IJavaClass> {
  @Implements public getDefault (): JavaSyntax.IJavaClass {
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

  @Override public onFirstToken (): void {
    const { value, nextToken } = this.currentToken;

    if (isAccessModifierKeyword(value)) {
      this.parsed.access = JavaConstants.AccessModifierMap[value];

      this.next();
    }

    this.match([
      [JavaConstants.Keyword.FINAL, () => {
        this.parsed.isFinal = true;
        this.next();
      }]
    ]);

    this.parsed.name = this.currentToken.value;

    this.next();
  }

  public onNestedClassDeclaration (): void {
    const javaClass = this.parseNextWith(JavaClassParser);

    this.parsed.nestedClasses.push(javaClass);
  }
}
