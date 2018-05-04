import AbstractTranslator from '../../common/AbstractTranslator';
import JavaOperatorTranslator from './JavaOperatorTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaStatementTranslator extends AbstractTranslator<JavaSyntax.IJavaStatement> {
  @Implements protected translate (): void {
    const { leftSide, operator, rightSide } = this.syntaxNode;

    if (leftSide) {
      this.emitSide(leftSide);
    }

    if (operator) {
      const operatorGap = leftSide ? ' ' : '';

      this.emit(operatorGap)
        .emitNodeWith(JavaOperatorTranslator, operator)
        .emit(operatorGap)
        .emitSide(rightSide); // TODO: Fix an issue with the right side not being emitted
    }
  }

  private emitSide (side: JavaSyntax.IJavaSyntaxNode): void {
    switch (side.node) {
      case JavaSyntax.JavaSyntaxNode.LITERAL:
        this.emitLiteral(side as JavaSyntax.IJavaLiteral);
        break;
      case JavaSyntax.JavaSyntaxNode.REFERENCE:
        this.emitReference(side as JavaSyntax.IJavaReference);
        break;
      case JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN:
        this.emitPropertyChain(side as JavaSyntax.IJavaPropertyChain);
        break;
      case JavaSyntax.JavaSyntaxNode.FUNCTION_CALL:
        this.emitFunctionCall(side as JavaSyntax.IJavaFunctionCall);
        break;
    }
  }

  private emitLiteral (literal: JavaSyntax.IJavaLiteral): void {
    const { type, value } = literal;

    switch (type) {
      case JavaSyntax.JavaLiteralType.STRING:
      case JavaSyntax.JavaLiteralType.NUMBER:
      case JavaSyntax.JavaLiteralType.KEYWORD:
        this.emit(value as string);
        break;
      case JavaSyntax.JavaLiteralType.ARRAY:
        this.emitArrayLiteral(literal);
        break;
    }
  }

  private emitArrayLiteral ({ value }: JavaSyntax.IJavaLiteral): void {
    this.emit('[ ');

    this.emitNodeSequence(
      value as JavaSyntax.IJavaStatement[],
      statement => this.emitNodeWith(JavaStatementTranslator, statement),
      () => this.emit(', ')
    );

    this.emit(' ]');
  }

  private emitReference ({ isInstanceField, value }: JavaSyntax.IJavaReference): void {
    if (isInstanceField) {
      this.emit('this.');
    }

    this.emit(value);
  }

  /**
   * While the type signature of a Java property chain syntax node
   * can contain a Java type in its properties, this won't persist
   * to the translation stage; namespaced types are retroactively
   * parsed as variable declarations.
   */
  private emitPropertyChain ({ properties }: JavaSyntax.IJavaPropertyChain): void {
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      const nextProperty = properties[i + 1];

      if (typeof property === 'string') {
        this.emit(property);
      } else {
        switch (property.node) {
          case JavaSyntax.JavaSyntaxNode.FUNCTION_CALL:
            this.emitFunctionCall(property);
            break;
          case JavaSyntax.JavaSyntaxNode.STATEMENT:
            this.emitNodeWith(JavaStatementTranslator, property);
            break;
        }
      }

      if (!this.isDotDelimitedProperty(property)) {
        this.emit(']');
      }

      if (nextProperty) {
        const propertyDelimiter = this.isDotDelimitedProperty(nextProperty)
          ? '.'
          : '[';

        this.emit(propertyDelimiter);
      }
    }
  }

  private emitFunctionCall ({ isInstanceFunction, name, arguments: args }: JavaSyntax.IJavaFunctionCall): void {
    if (isInstanceFunction) {
      this.emit('this.');
    }

    this.emit(`${name}(`)
      .emitNodeSequence(
        args,
        argument => this.emitNodeWith(JavaStatementTranslator, argument),
        () => this.emit(', ')
      )
      .emit(')');
  }

  private isDotDelimitedProperty (property: JavaSyntax.JavaProperty): boolean {
    return (
      typeof property === 'string' ||
      property.node === JavaSyntax.JavaSyntaxNode.FUNCTION_CALL
    );
  }
}
