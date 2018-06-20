import AbstractTranslator from '../../common/AbstractTranslator';
import JavaFunctionCallTranslator from './JavaFunctionCallTranslator';
import JavaInstantiationTranslator from './JavaInstantiationTranslator';
import JavaLiteralTranslator from './JavaLiteralTranslator';
import JavaStatementTranslator from '../JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../../parser/java/java-syntax';

export default class JavaPropertyChainTranslator extends AbstractTranslator<JavaSyntax.IJavaPropertyChain> {
  @Implements protected translate (): void {
    const { properties } = this.syntaxNode;

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      const nextProperty = properties[i + 1];

      switch (property.node) {
        case JavaSyntax.JavaSyntaxNode.REFERENCE:
          this.emit(property.value);
          break;
        case JavaSyntax.JavaSyntaxNode.FUNCTION_CALL:
          this.emitNodeWith(JavaFunctionCallTranslator, property);
          break;
        case JavaSyntax.JavaSyntaxNode.INSTANTIATION:
          this.emitNodeWith(JavaInstantiationTranslator, property);
          break;
        case JavaSyntax.JavaSyntaxNode.LITERAL:
          this.emitNodeWith(JavaLiteralTranslator, property);
          break;
        case JavaSyntax.JavaSyntaxNode.STATEMENT:
          this.emitNodeWith(JavaStatementTranslator, property);
          break;
      }

      if (!this.isDotDelimitedProperty(property)) {
        // Non-dot-delimited properties, e.g. bracket [...]
        // properties, need a closing ] before the next
        // potential property, which will be delimited
        // separately by emitIncomingPropertyDelimiter()
        this.emit(']');
      }

      if (nextProperty) {
        this.emitIncomingPropertyDelimiter(nextProperty);
      }
    }
  }

  private emitIncomingPropertyDelimiter (incomingProperty: JavaSyntax.JavaProperty): void {
    // Function chains are additional calls directly on
    // a function statement, e.g. call()(). Obviously
    // these only work if the initial function returns
    // an additional one, but the syntax remains valid.
    const isFunctionChain = (
      typeof incomingProperty !== 'string' &&
      incomingProperty.node === JavaSyntax.JavaSyntaxNode.FUNCTION_CALL &&
      incomingProperty.name === null
    );

    const propertyDelimiter =
      isFunctionChain ? '' :
      this.isDotDelimitedProperty(incomingProperty) ? '.' :
      '[';

    this.emit(propertyDelimiter);
  }

  /**
   * Determines whether a property can be delimited by
   * a single . in the emit, as opposed to those which
   * require [...] bracket delimiters.
   */
  private isDotDelimitedProperty (property: JavaSyntax.JavaProperty): boolean {
    const isParentheticalStatement = (
      property.node === JavaSyntax.JavaSyntaxNode.STATEMENT &&
      property.isParenthetical
    );

    return (
      isParentheticalStatement ||
      property.node === JavaSyntax.JavaSyntaxNode.REFERENCE ||
      property.node === JavaSyntax.JavaSyntaxNode.FUNCTION_CALL ||
      property.node === JavaSyntax.JavaSyntaxNode.INSTANTIATION ||
      property.node === JavaSyntax.JavaSyntaxNode.LITERAL
    );
  }
}
