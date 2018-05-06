import { JavaSyntax } from '../../../parser/java/java-syntax';

export namespace JavaTranslatorUtils {
  const TerminableStatementNodes: JavaSyntax.JavaSyntaxNode[] = [
    JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION,
    JavaSyntax.JavaSyntaxNode.LITERAL,
    JavaSyntax.JavaSyntaxNode.INSTRUCTION,
    JavaSyntax.JavaSyntaxNode.REFERENCE,
    JavaSyntax.JavaSyntaxNode.FUNCTION_CALL,
    JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN,
  ];

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
   * Determines whether a Java statement syntax node should
   * be terminated with a semicolon when emitted in a block.
   */
  export function isTerminableStatement ({ leftSide, rightSide, isParenthetical }: JavaSyntax.IJavaStatement): boolean {
    const isOperation = !!leftSide && !!rightSide;

    // Statements wrapped in parentheses will have
    // been parsed as ones with a single left-side
    // parenthetical statement
    const isParentheticalStatement = (
      leftSide &&
      (leftSide as JavaSyntax.IJavaStatement).isParenthetical
    );

    const isTerminable = leftSide
      ? TerminableStatementNodes.some(node => node === leftSide.node)
      : isTerminableStatement(rightSide);

    return isOperation || isTerminable || isParentheticalStatement;
  }
}
