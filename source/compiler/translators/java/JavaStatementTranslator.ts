import AbstractTranslator from '../../common/AbstractTranslator';
import JavaOperatorTranslator from './JavaOperatorTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaStatementTranslator extends AbstractTranslator<JavaSyntax.IJavaStatement> {
  @Implements protected translate (): void {
    const { leftSide, operator, rightSide } = this.syntaxNode;

    if (leftSide) {
      this.emitLeftSide(leftSide);
    }

    if (operator) {
      const operatorGap = leftSide ? ' ' : '';

      this.emit(operatorGap)
        .emitNodeWith(JavaOperatorTranslator, operator)
        .emit(operatorGap)
        .emitNodeWith(JavaStatementTranslator, rightSide);
    }
  }

  private emitLeftSide (leftSide: JavaSyntax.IJavaSyntaxNode): void {
    switch (leftSide.node) {
      case JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION:
        this.emitVariableDeclaration(leftSide as JavaSyntax.IJavaVariableDeclaration);
        break;
      case JavaSyntax.JavaSyntaxNode.LITERAL:
        this.emitLiteral(leftSide as JavaSyntax.IJavaLiteral);
        break;
      case JavaSyntax.JavaSyntaxNode.INSTRUCTION:
        this.emitInstruction(leftSide as JavaSyntax.IJavaInstruction);
        break;
      case JavaSyntax.JavaSyntaxNode.REFERENCE:
        this.emitReference(leftSide as JavaSyntax.IJavaReference);
        break;
      case JavaSyntax.JavaSyntaxNode.INSTANTIATION:
        this.emitInstantiation(leftSide as JavaSyntax.IJavaInstantiation);
        break;
      case JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN:
        this.emitPropertyChain(leftSide as JavaSyntax.IJavaPropertyChain);
        break;
      case JavaSyntax.JavaSyntaxNode.FUNCTION_CALL:
        this.emitFunctionCall(leftSide as JavaSyntax.IJavaFunctionCall);
        break;
    }
  }

  private emitVariableDeclaration ({ name }: JavaSyntax.IJavaVariableDeclaration): void {
    this.emit(`var ${name}`);
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
        this.emit('[ ')
          .emitNodeSequence(
            value as JavaSyntax.IJavaStatement[],
            statement => this.emitNodeWith(JavaStatementTranslator, statement),
            () => this.emit(', ')
          )
          .emit(' ]');

        break;
    }
  }

  private emitInstruction (instruction: JavaSyntax.IJavaInstruction): void {
    switch (instruction.type) {
      case JavaSyntax.JavaInstructionType.RETURN:
      case JavaSyntax.JavaInstructionType.THROW:
        const isReturn = instruction.type === JavaSyntax.JavaInstructionType.RETURN;

        this.emit(isReturn ? 'return' : 'throw');

        if (instruction.value) {
          this.emit(' ')
            .emitNodeWith(JavaStatementTranslator, instruction.value);
        }

        break;
      case JavaSyntax.JavaInstructionType.CONTINUE:
        this.emit('continue');
        break;
      case JavaSyntax.JavaInstructionType.BREAK:
        this.emit('break');
        break;
    }
  }

  private emitReference ({ isInstanceFieldReference, value }: JavaSyntax.IJavaReference): void {
    if (isInstanceFieldReference) {
      this.emit('this.');
    }

    this.emit(value);
  }

  private emitInstantiation ({ constructor, arguments: args }: JavaSyntax.IJavaInstantiation): void {
    const constructorName = constructor.namespaceChain.join('.');

    this.emit(`new ${constructorName}`)
      .emit('(')
      .emitNodeSequence(
        args,
        statement => this.emitNodeWith(JavaStatementTranslator, statement),
        () => this.emit(', ')
      )
      .emit(')');
  }

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

  /**
   * Determines whether a property in a Java property chain
   * can be delimited by a single . in the emit, as opposed
   * to those which require [...] bracket delimiters.
   */
  private isDotDelimitedProperty (property: JavaSyntax.JavaProperty): boolean {
    return (
      typeof property === 'string' ||
      property.node === JavaSyntax.JavaSyntaxNode.FUNCTION_CALL
    );
  }
}
