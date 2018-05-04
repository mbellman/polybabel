import { JavaSyntax } from '../../../parser/java/java-syntax';

export namespace JavaTranslatorUtils {
  const TerminableStatementNodes: JavaSyntax.JavaSyntaxNode[] = [
    JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION,
    JavaSyntax.JavaSyntaxNode.FUNCTION_CALL,
    JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN,
    JavaSyntax.JavaSyntaxNode.REFERENCE,
    JavaSyntax.JavaSyntaxNode.LITERAL
  ];

  /**
   * Determines whether a Java statement syntax node should
   * be terminated with a semicolon when emitted in a block.
   */
  export function isTerminableStatement ({ leftSide, rightSide }: JavaSyntax.IJavaStatement): boolean {
    return (
      // Any statements with both left and right sides, i.e.
      // those with operations, should be terminated
      (!!leftSide && !!rightSide) ||
      // 'Terminable statements' should, naturally, be terminated
      TerminableStatementNodes.some(node => node === leftSide.node)
    );
  }
}
