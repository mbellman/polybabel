import AbstractParser from '../common/AbstractParser';
import JavaExpressionParser from './JavaExpressionParser';
import JavaObjectMemberParser from './JavaObjectMemberParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaSyntax } from './java-syntax';
import { Parser } from '../common/parser-decorators';

@Parser({
  type: JavaObjectFieldParser,
  symbols: [
    ['=', 'onAssignment'],
    [';', 'finish']
  ]
})
export default abstract class JavaObjectFieldParser extends AbstractParser<JavaSyntax.IJavaObjectField> {
  @Implements public getDefault (): JavaSyntax.IJavaObjectField {
    return {
      node: JavaSyntax.JavaSyntaxNode.OBJECT_FIELD,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      type: null
    };
  }

  public onAssignment (): void {
    const expression = this.parseNextWith(JavaExpressionParser);

    this.parsed.value = expression;
  }

  @Override public onFirstToken (): void {
    const { node, ...member } = this.parseNextWith(JavaObjectMemberParser);

    Object.assign(this.parsed, member);
  }
}
