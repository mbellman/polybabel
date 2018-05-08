import AbstractTranslator from '../../common/AbstractTranslator';
import JavaBlockTranslator from './JavaBlockTranslator';
import JavaOperatorTranslator from './JavaOperatorTranslator';
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
      case JavaSyntax.JavaSyntaxNode.IF_ELSE:
        this.emitIfElse(leftSide as JavaSyntax.IJavaIfElse);
        break;
      case JavaSyntax.JavaSyntaxNode.FOR_LOOP:
        this.emitForLoop(leftSide as JavaSyntax.IJavaForLoop);
        break;
      case JavaSyntax.JavaSyntaxNode.WHILE_LOOP:
        this.emitWhileLoop(leftSide as JavaSyntax.IJavaWhileLoop);
        break;
      case JavaSyntax.JavaSyntaxNode.SWITCH:
        this.emitSwitch(leftSide as JavaSyntax.IJavaSwitch);
        break;
      case JavaSyntax.JavaSyntaxNode.TRY_CATCH:
        this.emitTryCatch(leftSide as JavaSyntax.IJavaTryCatch);
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
          .emitNodes(
            value as JavaSyntax.IJavaStatement[],
            statement => this.emitNodeWith(JavaStatementTranslator, statement),
            () => this.emit(', ')
          )
          .emit(' ]');

        break;
    }
  }

  private emitInstruction ({ type, value }: JavaSyntax.IJavaInstruction): void {
    switch (type) {
      case JavaSyntax.JavaInstructionType.RETURN:
      case JavaSyntax.JavaInstructionType.THROW:
        const isReturn = type === JavaSyntax.JavaInstructionType.RETURN;

        this.emit(isReturn ? 'return' : 'throw');

        if (value) {
          this.emit(' ')
            .emitNodeWith(JavaStatementTranslator, value);
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
      .emitNodes(
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
      .emitNodes(
        args,
        argument => this.emitNodeWith(JavaStatementTranslator, argument),
        () => this.emit(', ')
      )
      .emit(')');
  }

  private emitIfElse ({ conditions, blocks }: JavaSyntax.IJavaIfElse): void {
    this.emitNodes(
      blocks,
      (block, index) => {
        const isLastBlock = index === blocks.length - 1;

        if (isLastBlock && blocks.length > 1) {
          this.emit(' else {');
        } else {
          this.emit(index === 0 ? 'if (' : ' else if (')
            .emitNodeWith(JavaStatementTranslator, conditions[index])
            .emit(') {');
        }

        this.enterBlock()
          .emitNodeWith(JavaBlockTranslator, block)
          .exitBlock()
          .emit('}');
      }
    );
  }

  private emitForLoop ({ statements, isEnhanced, block }: JavaSyntax.IJavaForLoop): void {
    if (isEnhanced) {
      const collection = statements[1];
      const { name: iteratorValueName } = statements[0].leftSide as JavaSyntax.IJavaVariableDeclaration;

      this.emitNodeWith(JavaStatementTranslator, collection)
        .emit(`.forEach(${iteratorValueName} => {`)
        .enterBlock()
        .emitNodeWith(JavaBlockTranslator, block)
        .exitBlock()
        .emit('});');
    } else {
      this.emit('for (')
        .emitNodes(
          statements,
          statement => {
            // Regular for loops may have null statements
            // where ones were omitted
            if (statement) {
              this.emitNodeWith(JavaStatementTranslator, statement);
            }
          },
          () => this.emit('; ')
        )
        .emit(') {')
        .enterBlock()
        .emitNodeWith(JavaBlockTranslator, block)
        .exitBlock()
        .emit('}');
    }
  }

  private emitWhileLoop ({ condition, block }: JavaSyntax.IJavaWhileLoop): void {
    this.emit('while (')
      .emitNodeWith(JavaStatementTranslator, condition)
      .emit(') {')
      .enterBlock()
      .emitNodeWith(JavaBlockTranslator, block)
      .exitBlock()
      .emit('}');
  }

  private emitSwitch ({ value, cases, blocks, defaultBlock }: JavaSyntax.IJavaSwitch): void {
    this.emit('switch (')
      .emitNodeWith(JavaStatementTranslator, value)
      .emit(') {')
      .enterBlock()
      .emitNodes(
        cases,
        (caseStatement, index) => {
          this.emit('case ')
            .emitNodeWith(JavaStatementTranslator, caseStatement)
            .emit(':')
            .enterBlock()
            .emitNodeWith(JavaBlockTranslator, blocks[index])
            .exitBlock();
        }
      );

    if (defaultBlock) {
      this.emit('default:')
        .enterBlock()
        .emitNodeWith(JavaBlockTranslator, defaultBlock)
        .exitBlock();
    }

    this.exitBlock()
      .emit('}');
  }

  private emitTryCatch ({ tryBlock, exceptionSets, exceptionReferences, catchBlocks, finallyBlock }: JavaSyntax.IJavaTryCatch): void {
    // Use this as the default variable name provided to the
    // catch (...) statement in case subsequent case blocks,
    // translated as conditionals within the main case block,
    // use different variable names
    const firstExceptionName = exceptionReferences[0].value;

    this.emit('try {')
      .enterBlock()
      .emitNodeWith(JavaBlockTranslator, tryBlock)
      .exitBlock()
      .emit(`} catch (${firstExceptionName}) {`)
      .enterBlock()
      // If any exception references are named differently than
      // the first and main one, we need to reassign them as
      // alias variables
      .emitNodes(
        exceptionReferences,
        exceptionReference => {
          const exceptionName = exceptionReference.value;
          const hasUniqueExceptionName = exceptionName !== firstExceptionName;

          if (hasUniqueExceptionName) {
            this.emit(`var ${exceptionName} = ${firstExceptionName};`)
              .newline();
          }
        }
      )
      // Emit each separate catch block as a series of if-else
      // blocks, using 'instanceof' checks on the error instance
      // to map exception types to conditional blocks. JavaScript
      // lacks a spec-standard way of handling multiple catch
      // blocks with different error/exception types in each.
      .emitNodes(
        catchBlocks,
        (catchBlock, index) => {
          const exceptions = exceptionSets[index];
          const exceptionName = exceptionReferences[index].value;

          this.emit(index === 0 ? 'if (' : ' else if (')
            .emitNodes(
              exceptions,
              exception => {
                const exceptionTypeName = exception.namespaceChain.join('.');

                this.emit(`${exceptionName} instanceof ${exceptionTypeName}`);
              },
              () => this.emit(' || ')
            )
            .emit(') {')
            .enterBlock()
            .emitNodeWith(JavaBlockTranslator, catchBlock)
            .exitBlock()
            .emit('}');
        }
      )
      .exitBlock()
      .emit('}');

    if (finallyBlock) {
      this.emit(' finally {')
        .enterBlock()
        .emitNodeWith(JavaBlockTranslator, finallyBlock)
        .exitBlock()
        .emit('}');
    }
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
