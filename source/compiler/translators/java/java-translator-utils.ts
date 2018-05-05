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
   * Filters only Java object members which have actual
   * content to emit.
   */
  export function getNonEmptyObjectMembers (members: JavaSyntax.JavaObjectMember[]): JavaSyntax.JavaObjectMember[] {
    return members.filter(member => {
      return (
        !!(member as JavaSyntax.IJavaObjectField).value ||
        !!(member as JavaSyntax.IJavaObjectMethod).block ||
        !!(member as JavaSyntax.IJavaObject).members
      );
    });
  }

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
