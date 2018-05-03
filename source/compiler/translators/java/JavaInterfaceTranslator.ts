import AbstractTranslator from '../../common/AbstractTranslator';
import JavaStatementTranslator from './JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

type JavaInterfaceMember = JavaSyntax.IJavaObjectField | JavaSyntax.IJavaObjectMethod | JavaSyntax.IJavaObject;

export default class JavaInterfaceTranslator extends AbstractTranslator<JavaSyntax.IJavaInterface> {
  @Implements protected translate (): void {
    const { name, members } = this.syntaxNode;

    this.emit(`var ${name} = {`)
      .enterBlock();

    members.forEach((member, index) => {
      this.emitMember(member);

      if (index < members.length - 1) {
        this.emit(',').newline();
      }
    });

    this.exitBlock()
      .emit('}')
      .newline();
  }

  private emitMember (member: JavaInterfaceMember): void {
    switch (member.node) {
      case JavaSyntax.JavaSyntaxNode.OBJECT_FIELD:
        this.emitField(member as JavaSyntax.IJavaObjectField);
        break;
    }
  }

  private emitField (field: JavaSyntax.IJavaObjectField): void {
    const { name, value } = field;

    if (value) {
      this.emit(`${name}: `).emitNodeWith(value, JavaStatementTranslator);
    }
  }
}
