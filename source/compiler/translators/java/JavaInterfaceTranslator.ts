import AbstractTranslator from '../common/AbstractTranslator';
import JavaObjectMethodTranslator from './JavaObjectMethodTranslator';
import JavaStatementTranslator from './JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { JavaTranslatorUtils } from './java-translator-utils';
import JavaClassTranslator from './JavaClassTranslator';

export default class JavaInterfaceTranslator extends AbstractTranslator<JavaSyntax.IJavaInterface> {
  @Implements protected translate (): void {
    const { name, members } = this.syntaxNode;

    this.emit(`var ${name} = {`)
      .enterBlock()
      .emitNodes(
        members,
        member => {
          if (JavaTranslatorUtils.isEmptyObjectMember(member)) {
            return false;
          }

          this.emitMember(member);
        },
        () => this.emit(',').newline()
      )
      .exitBlock()
      .emit('}');
  }

  private emitMember (member: JavaSyntax.JavaObjectMember): void {
    switch (member.node) {
      case JavaSyntax.JavaSyntaxNode.OBJECT_FIELD:
        this.emitField(member as JavaSyntax.IJavaObjectField);
        break;
      case JavaSyntax.JavaSyntaxNode.OBJECT_METHOD:
        this.emitMethod(member as JavaSyntax.IJavaObjectMethod);
        break;
      case JavaSyntax.JavaSyntaxNode.CLASS:
        this.emitKey(member.name)
          .emitNodeWith(JavaClassTranslator, member as JavaSyntax.IJavaClass);
        break;
      case JavaSyntax.JavaSyntaxNode.INTERFACE:
        this.emitKey(member.name)
          .emitNodeWith(JavaInterfaceTranslator, member as JavaSyntax.IJavaInterface);
        break;
    }
  }

  private emitField (field: JavaSyntax.IJavaObjectField): void {
    const { name, value } = field;

    this.emitKey(name)
      .emitNodeWith(JavaStatementTranslator, value);
  }

  private emitMethod (method: JavaSyntax.IJavaObjectMethod): void {
    const { block, name } = method;

    this.emitKey(name)
      .emit('function ')
      .emitNodeWith(JavaObjectMethodTranslator, method);
  }

  private emitKey (key: string): this {
    return this.emit(`${key}: `);
  }
}
