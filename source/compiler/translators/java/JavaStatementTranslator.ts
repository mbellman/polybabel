import AbstractTranslator from '../../common/AbstractTranslator';
import JavaAssertionTranslator from './statement-translators/JavaAssertionTranslator';
import JavaBlockTranslator from './JavaBlockTranslator';
import JavaClassTranslator from './JavaClassTranslator';
import JavaDoWhileLoopTranslator from './statement-translators/JavaDoWhileLoopTranslator';
import JavaForLoopTranslator from './statement-translators/JavaForLoopTranslator';
import JavaFunctionCallTranslator from './statement-translators/JavaFunctionCallTranslator';
import JavaIfElseTranslator from './statement-translators/JavaIfElseTranslator';
import JavaInstantiationTranslator from './statement-translators/JavaInstantiationTranslator';
import JavaInstructionTranslator from './statement-translators/JavaInstructionTranslator';
import JavaLambdaExpressionTranslator from './statement-translators/JavaLambdaExpressionTranslator';
import JavaLiteralTranslator from './statement-translators/JavaLiteralTranslator';
import JavaOperatorTranslator from './JavaOperatorTranslator';
import JavaPropertyChainTranslator from './statement-translators/JavaPropertyChainTranslator';
import JavaSwitchTranslator from './statement-translators/JavaSwitchTranslator';
import JavaTryCatchTranslator from './statement-translators/JavaTryCatchTranslator';
import JavaWhileLoopTranslator from './statement-translators/JavaWhileLoopTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { JavaTranslatorUtils } from './java-translator-utils';

export default class JavaStatementTranslator extends AbstractTranslator<JavaSyntax.IJavaStatement> {
  @Implements protected translate (): void {
    const { isParenthetical, leftSide, operator, rightSide } = this.syntaxNode;

    if (isParenthetical) {
      this.emit('(');
    }

    if (leftSide) {
      this.emitLeftSide(leftSide);
    }

    if (operator) {
      const operatorGap = JavaTranslatorUtils.isTwoSidedStatement(this.syntaxNode)
        ? ' '
        : '';

      this.emit(operatorGap)
        .emitNodeWith(JavaOperatorTranslator, operator)
        .emit(operatorGap)
        .emitNodeWith(JavaStatementTranslator, rightSide);
    }

    if (isParenthetical) {
      this.emit(')');
    }
  }

  private emitLeftSide (leftSide: JavaSyntax.IJavaSyntaxNode): void {
    switch (leftSide.node) {
      case JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION:
        const { name } = leftSide as JavaSyntax.IJavaVariableDeclaration;

        this.emit(`var ${name}`);
        break;
      case JavaSyntax.JavaSyntaxNode.LITERAL:
        this.emitNodeWith(JavaLiteralTranslator, leftSide as JavaSyntax.IJavaLiteral);
        break;
      case JavaSyntax.JavaSyntaxNode.INSTRUCTION:
        this.emitNodeWith(JavaInstructionTranslator, leftSide as JavaSyntax.IJavaInstruction);
        break;
      case JavaSyntax.JavaSyntaxNode.REFERENCE:
        this.emitReference(leftSide as JavaSyntax.IJavaReference);
        break;
      case JavaSyntax.JavaSyntaxNode.INSTANTIATION:
        this.emitNodeWith(JavaInstantiationTranslator, leftSide as JavaSyntax.IJavaInstantiation);
        break;
      case JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN:
        this.emitNodeWith(JavaPropertyChainTranslator, leftSide as JavaSyntax.IJavaPropertyChain);
        break;
      case JavaSyntax.JavaSyntaxNode.FUNCTION_CALL:
        this.emitNodeWith(JavaFunctionCallTranslator, leftSide as JavaSyntax.IJavaFunctionCall);
        break;
      case JavaSyntax.JavaSyntaxNode.IF_ELSE:
        this.emitNodeWith(JavaIfElseTranslator, leftSide as JavaSyntax.IJavaIfElse);
        break;
      case JavaSyntax.JavaSyntaxNode.FOR_LOOP:
        this.emitNodeWith(JavaForLoopTranslator, leftSide as JavaSyntax.IJavaForLoop);
        break;
      case JavaSyntax.JavaSyntaxNode.WHILE_LOOP:
        this.emitNodeWith(JavaWhileLoopTranslator, leftSide as JavaSyntax.IJavaWhileLoop);
        break;
      case JavaSyntax.JavaSyntaxNode.DO_WHILE_LOOP:
        this.emitNodeWith(JavaDoWhileLoopTranslator, leftSide as JavaSyntax.IJavaDoWhileLoop);
        break;
      case JavaSyntax.JavaSyntaxNode.SWITCH:
        this.emitNodeWith(JavaSwitchTranslator, leftSide as JavaSyntax.IJavaSwitch);
        break;
      case JavaSyntax.JavaSyntaxNode.TRY_CATCH:
        this.emitNodeWith(JavaTryCatchTranslator, leftSide as JavaSyntax.IJavaTryCatch);
        break;
      case JavaSyntax.JavaSyntaxNode.CLASS:
        this.emitNodeWith(JavaClassTranslator, leftSide as JavaSyntax.IJavaClass);
        break;
      case JavaSyntax.JavaSyntaxNode.TERNARY:
        this.emitTernary(leftSide as JavaSyntax.IJavaTernary);
        break;
      case JavaSyntax.JavaSyntaxNode.LAMBDA_EXPRESSION:
        this.emitNodeWith(JavaLambdaExpressionTranslator, leftSide as JavaSyntax.IJavaLambdaExpression);
        break;
      case JavaSyntax.JavaSyntaxNode.ASSERTION:
        this.emitNodeWith(JavaAssertionTranslator, leftSide as JavaSyntax.IJavaAssertion);
        break;
      case JavaSyntax.JavaSyntaxNode.STATEMENT:
        // The left side may itself be a statement, e.g.
        // in the case of parenthetical statements, which
        // parse as the left side of a top-level statement
        this.emitNodeWith(JavaStatementTranslator, leftSide as JavaSyntax.IJavaStatement);
        break;
    }
  }

  private emitVariableDeclaration ({ name }: JavaSyntax.IJavaVariableDeclaration): void {
    this.emit(`var ${name}`);
  }

  private emitReference ({ isInstanceFieldReference, value }: JavaSyntax.IJavaReference): void {
    if (isInstanceFieldReference) {
      this.emit('this.');
    }

    this.emit(value);
  }

  private emitTernary ({ condition, left, right }: JavaSyntax.IJavaTernary): void {
    this.emitNodeWith(JavaStatementTranslator, condition)
      .emit(' ? ')
      .emitNodeWith(JavaStatementTranslator, left)
      .emit(' : ')
      .emitNodeWith(JavaStatementTranslator, right);
  }
}
