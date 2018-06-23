import AbstractValidator from '../common/AbstractValidator';
import JavaClassValidator from './JavaClassValidator';
import JavaInterfaceValidator from './JavaInterfaceValidator';
import JavaObjectFieldValidator from './JavaObjectFieldValidator';
import JavaObjectMethodValidator from './JavaObjectMethodValidator';
import { Implements, IHashMap } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaObjectValidator extends AbstractValidator<JavaSyntax.IJavaObject> {
  private methodOverloadTrackerMap: IHashMap<number> = {};

  @Implements public validate (): void {
    const { name, members } = this.syntaxNode;

    this.enterNamespace(name);

    members.forEach(member => {
      switch (member.node) {
        case JavaSyntax.JavaSyntaxNode.OBJECT_FIELD:
          this.validateNodeWith(JavaObjectFieldValidator, member as JavaSyntax.IJavaObjectField);
          break;
        case JavaSyntax.JavaSyntaxNode.OBJECT_METHOD:
          const method = member as JavaSyntax.IJavaObjectMethod;

          this.validateNodeWith(JavaObjectMethodValidator, member as JavaSyntax.IJavaObjectMethod);
          this.trackMethodOverloads(method);
          break;
        case JavaSyntax.JavaSyntaxNode.CLASS:
          this.validateNodeWith(JavaClassValidator, member as JavaSyntax.IJavaClass);
          break;
        case JavaSyntax.JavaSyntaxNode.INTERFACE:
          this.validateNodeWith(JavaInterfaceValidator, member as JavaSyntax.IJavaInterface);
          break;
      }
    });

    this.exitNamespace();
  }

  private trackMethodOverloads (method: JavaSyntax.IJavaObjectMethod): void {
    let totalOverloads = this.methodOverloadTrackerMap[method.name] || 0;

    this.methodOverloadTrackerMap[method.name] = ++totalOverloads;

    if (totalOverloads > 1) {
      method.name += `_${totalOverloads - 1}`;
    }
  }
}
