import AbstractSymbolResolver from '../symbol-resolution/AbstractSymbolResolver';
import ArrayType from '../symbol-resolution/ArrayType';
import FunctionType from '../symbol-resolution/FunctionType';
import ObjectType from '../symbol-resolution/ObjectType';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../parser/java/java-syntax';
import { ObjectMemberVisibility, IObjectMember } from '../symbol-resolution/types';
import { Tuple2 } from '../../system/types';
import { Utils } from '../../system/utils';

export default class JavaTypeResolver extends AbstractSymbolResolver {
  @Implements public resolve (javaSyntaxTree: JavaSyntax.IJavaSyntaxTree): void {
    const { nodes: syntaxNodes } = javaSyntaxTree;

    syntaxNodes.forEach(syntaxNode => {
      switch (syntaxNode.node) {
        case JavaSyntax.JavaSyntaxNode.CLASS:
          this.resolveClassType(syntaxNode as JavaSyntax.IJavaClass);
          break;
        case JavaSyntax.JavaSyntaxNode.INTERFACE:
          this.resolveInterfaceType(syntaxNode as JavaSyntax.IJavaInterface);
          break;
      }
    });
  }

  private createObjectMemberSidePartition (members: JavaSyntax.JavaObjectMember[]): Tuple2<JavaSyntax.JavaObjectMember[]> {
    return Utils.partition(members, ({ isStatic }) => isStatic);
  }

  private getVisibilityByAccess (access: JavaSyntax.JavaAccessModifier): ObjectMemberVisibility {
    const { ALL, DERIVED, SELF } = ObjectMemberVisibility;

    return (
      access === JavaSyntax.JavaAccessModifier.PUBLIC
        ? ALL :
      access === JavaSyntax.JavaAccessModifier.PROTECTED
        ? DERIVED :
      access === JavaSyntax.JavaAccessModifier.PRIVATE
        ? SELF :
      null
    );
  }

  /**
   * @todo
   */
  private resolveClassType (classNode: JavaSyntax.IJavaClass): void {
    const { name, members, access, isFinal, isAbstract, constructors } = classNode;

    const [
      staticMembers,
      instanceMembers
    ] = this.createObjectMemberSidePartition(members);
  }

  /**
   * @todo
   */
  private resolveInterfaceType (interfaceNode: JavaSyntax.IJavaInterface): void {
    const { name } = interfaceNode;
  }

  /**
   * @todo
   */
  private resolveObjectMemberType (objectMemberNode: JavaSyntax.JavaObjectMember): IObjectMember {
    const objectMemberType: Partial<IObjectMember> = {};

    switch (objectMemberNode.node) {
      case JavaSyntax.JavaSyntaxNode.OBJECT_FIELD:
      case JavaSyntax.JavaSyntaxNode.OBJECT_METHOD:
      case JavaSyntax.JavaSyntaxNode.CLASS:
      case JavaSyntax.JavaSyntaxNode.INTERFACE:
    }

    return objectMemberType as IObjectMember;
  }
}
