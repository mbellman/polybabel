import { JavaSyntax } from '../../../parser/java/java-syntax';

export namespace JavaTranslatorUtils {
  const TerminableStatementNodes: JavaSyntax.JavaSyntaxNode[] = [
    JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION,
    JavaSyntax.JavaSyntaxNode.FUNCTION_CALL,
    JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN,
    JavaSyntax.JavaSyntaxNode.REFERENCE,
    JavaSyntax.JavaSyntaxNode.LITERAL
  ];

  export function isTerminableStatement ({ leftSide, rightSide }: JavaSyntax.IJavaStatement): boolean {
    const lastSide = rightSide || leftSide;

    return TerminableStatementNodes.some(node => node === lastSide.node);
  }
}
