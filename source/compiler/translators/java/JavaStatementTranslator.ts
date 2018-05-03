import AbstractTranslator from "../../common/AbstractTranslator";
import { JavaSyntax } from "parser/java/java-syntax";
import { Implements } from "trampoline-framework";

export default class JavaStatementTranslator extends AbstractTranslator<JavaSyntax.IJavaStatement> {
  @Implements protected translate (): void {
    const { leftSide } = this.syntaxNode;

    switch (leftSide.node) {
      case JavaSyntax.JavaSyntaxNode.LITERAL:
        this.emitLiteral(leftSide as JavaSyntax.IJavaLiteral);
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

    (value as JavaSyntax.IJavaStatement[])
      .forEach((statement, index) => {
        this.emitNodeWith(statement, JavaStatementTranslator);

        if (index < value.length - 1) {
          this.emit(', ');
        }
      });

    this.emit(' ]');
  }
}
