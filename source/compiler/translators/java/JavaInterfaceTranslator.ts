import AbstractTranslator from '../../common/AbstractTranslator';
import JavaObjectMethodTranslator from './JavaObjectMethodTranslator';
import JavaStatementTranslator from './JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { JavaTranslatorUtils } from './java-translator-utils';

export default class JavaInterfaceTranslator extends AbstractTranslator<JavaSyntax.IJavaInterface> {
  @Implements protected translate (): void {
    const { name, members } = this.syntaxNode;
    const nonEmptyMembers = JavaTranslatorUtils.getNonEmptyObjectMembers(members);

    this.emit(`var ${name} = {`)
      .enterBlock()
      .emitNodeSequence(
        nonEmptyMembers,
        member => this.emitMember(member),
        () => this.emit(',').newline()
      )
      .exitBlock()
      .emit('}')
      .newline();
  }

  private emitMember (member: JavaSyntax.JavaObjectMember): void {
    switch (member.node) {
      case JavaSyntax.JavaSyntaxNode.OBJECT_FIELD:
        this.emitField(member as JavaSyntax.IJavaObjectField);
        break;
      case JavaSyntax.JavaSyntaxNode.OBJECT_METHOD:
        this.emitMethod(member as JavaSyntax.IJavaObjectMethod);
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
