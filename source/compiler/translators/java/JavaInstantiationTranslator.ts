import AbstractTranslator from '../../common/AbstractTranslator';
import JavaBlockTranslator from './JavaBlockTranslator';
import JavaLiteralTranslator from './JavaLiteralTranslator';
import JavaStatementTranslator from './JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaInstantiationTranslator extends AbstractTranslator<JavaSyntax.IJavaInstantiation> {
  @Implements protected translate (): void {
    const { anonymousObjectBody, arrayAllocationSize, arrayLiteral } = this.syntaxNode;

    if (anonymousObjectBody) {
      this.emitAnonymousObject();
    } else if (arrayAllocationSize || arrayLiteral) {
      this.emitArrayInstantiation();
    } else {
      this.emitRegularInstantiation();
    }
  }

  private emitAnonymousObject (): void {
    const { constructor, anonymousObjectBody } = this.syntaxNode;
    const { members } = anonymousObjectBody;
    const constructorName = this.getConstructorName();

    this.emit('(function(Ctor){')
      .enterBlock()
      .emit(`var instance = typeof Ctor === \'function\'`)
      .enterBlock()
      // Anonymous class extension
      .emit('? new Ctor(')
      .emitConstructorArguments()
      .emit(')')
      .newline()
      // Anonymous interface implementation
      .emit(': Object.create(Ctor);')
      .exitBlock()
      .emitNodes(
        members,
        member => {
          this.emitAnonymousObjectMember(member)
            .newline();
        }
      )
      .emit('return instance;')
      .exitBlock()
      .emit(`})(${constructorName})`);
  }

  private emitAnonymousObjectField ({ name, value }: JavaSyntax.IJavaObjectField): this {
    if (value) {
      this.emit(`instance.${name} = `)
        .emitNodeWith(JavaStatementTranslator, value)
        .emit(';');
    }

    return this;
  }

  private emitAnonymousObjectMember (member: JavaSyntax.JavaObjectMember): this {
    switch (member.node) {
      case JavaSyntax.JavaSyntaxNode.OBJECT_FIELD:
        return this.emitAnonymousObjectField(member as JavaSyntax.IJavaObjectField);
      case JavaSyntax.JavaSyntaxNode.OBJECT_METHOD:
        return this.emitAnonymousObjectMethod(member as JavaSyntax.IJavaObjectMethod);
    }
  }

  private emitAnonymousObjectMethod ({ name, parameters, block }: JavaSyntax.IJavaObjectMethod): this {
    if (block) {
      this.emit(`instance.${name} = function (`)
        .emitNodes(
          parameters,
          parameter => this.emit(parameter.name),
          () => this.emit(', ')
        )
        .emit(') {')
        .enterBlock()
        .emitNodeWith(JavaBlockTranslator, block)
        .exitBlock()
        .emit('};');
    }

    return this;
  }

  private emitArrayInstantiation (): this {
    const { arrayAllocationSize, arrayLiteral } = this.syntaxNode;

    if (arrayAllocationSize && !arrayLiteral) {
      return this.emit('new Array(')
        .emitNodeWith(JavaStatementTranslator, arrayAllocationSize)
        .emit(')');
    } else {
      return this.emitNodeWith(JavaLiteralTranslator, arrayLiteral);
    }
  }

  private emitConstructorArguments (): this {
    const { arguments: args } = this.syntaxNode;

    return this.emitNodes(
      args,
      arg => {
        this.emitNodeWith(JavaStatementTranslator, arg);
      },
      () => this.emit(', ')
    );
  }

  private emitRegularInstantiation (): this {
    const { constructor, arguments: args } = this.syntaxNode;

    const constructorName = this.getConstructorName();

    return this.emit(`new ${constructorName}`)
      .emit('(')
      .emitConstructorArguments()
      .emit(')');
  }

  private getConstructorName (): string {
    return this.syntaxNode.constructor.namespaceChain.join('.');
  }
}
