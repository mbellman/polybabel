import { JavaSyntax } from '../../../parser/java/java-syntax';

export namespace JavaTranslatorUtils {
  /**
   * @internal
   */
  const TerminableStatementNodes: JavaSyntax.JavaSyntaxNode[] = [
    JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION,
    JavaSyntax.JavaSyntaxNode.LITERAL,
    JavaSyntax.JavaSyntaxNode.INSTRUCTION,
    JavaSyntax.JavaSyntaxNode.INSTANTIATION,
    JavaSyntax.JavaSyntaxNode.REFERENCE,
    JavaSyntax.JavaSyntaxNode.FUNCTION_CALL,
    JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN,
    JavaSyntax.JavaSyntaxNode.DO_WHILE_LOOP,
    JavaSyntax.JavaSyntaxNode.TERNARY
  ];

  /**
   * Determines whether a Java syntax node corresponds to
   * a class, interface, or enum.
   */
  export function isObject ({ node }: JavaSyntax.IJavaSyntaxNode): boolean {
    return (
      node === JavaSyntax.JavaSyntaxNode.CLASS ||
      node === JavaSyntax.JavaSyntaxNode.INTERFACE ||
      node === JavaSyntax.JavaSyntaxNode.ENUM
    );
  }

  /**
   * Determines whether a Java object member has actual
   * content to emit.
   */
  export function isEmptyObjectMember (member: JavaSyntax.JavaObjectMember): boolean {
    return (
      !(member as JavaSyntax.IJavaObjectField).value &&
      !(member as JavaSyntax.IJavaObjectMethod).block &&
      !(member as JavaSyntax.IJavaObject).members
    );
  }

  /**
   * Determines whether a Java statement is two-sided,
   * e.g. that of an operation. A one-sided statement
   * might have a null right side, or it might have a
   * right side which was parsed and then terminated
   * immediately, e.g. 'i++;'.
   */
  export function isTwoSidedStatement ({ leftSide, rightSide }: JavaSyntax.IJavaStatement): boolean {
    return (
      !!leftSide &&
      !!rightSide && (
        !!rightSide.leftSide ||
        !!rightSide.rightSide
      )
    );
  }

  /**
   * Determines whether a Java statement syntax node should
   * be terminated with a semicolon when emitted in a block.
   */
  export function isTerminableStatement (statement: JavaSyntax.IJavaStatement): boolean {
    const { leftSide, rightSide } = statement;

    if (isTwoSidedStatement(statement)) {
      // Optimize for two-sided statements
      return true;
    }

    // A top-level statement will actually never be
    // parenthetical itself, but its left side may
    // be, and in the event that it doesn't have a
    // right side we can check its left side instead
    const isParenthetical = (
      leftSide &&
      (leftSide as JavaSyntax.IJavaStatement).isParenthetical
    );

    if (isParenthetical) {
      // Optimize for parenthetical statements
      return true;
    }

    return (
      leftSide
        ? TerminableStatementNodes.some(node => node === leftSide.node) :
      rightSide
        ? isTerminableStatement(rightSide) :
      false
    );
  }
}
