import AbstractJavaObjectMemberParser from './AbstractJavaObjectMemberParser';
import JavaExpressionParser from './JavaExpressionParser';
import { isAccessModifierKeyword, isModifierKeyword } from './java-utils';
import { ISymbolParser, Matcher } from '../common/parser-types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

export default class JavaObjectFieldParser extends AbstractJavaObjectMemberParser<JavaSyntax.IJavaObjectField> implements ISymbolParser {
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

  private _onAssignment (): void {
    const expression = this.parseNextWith(JavaExpressionParser);

    this.parsed.value = expression;
  }
}
