import { IAccessible, INamed, ISyntaxNode, ISyntaxNodeContainer, ISyntaxTree, ITyped, IWithParameters } from '../common/syntax';

export namespace JavaSyntax {
  /**
   * @internal
   */
  interface IJavaNodeContainer extends ISyntaxNodeContainer<IJavaSyntaxNode> { }

  /**
   * @internal
   */
  interface IJavaAccessible extends IAccessible<JavaAccessModifier> { }

  interface IJavaObjectMember extends IJavaSyntaxNode, INamed, ITyped, IJavaAccessible { }

  export const enum JavaSyntaxNodeType {
    IMPORT,
    INTERFACE,
    INTERFACE_FIELD,
    INTERFACE_METHOD,
    CLASS,
    CLASS_FIELD,
    CLASS_METHOD
  }

  export const enum JavaAccessModifier {
    PUBLIC,
    PROTECTED,
    PRIVATE,
    PACKAGE
  }

  export interface IJavaSyntaxNode extends ISyntaxNode<JavaSyntaxNodeType> { }

  export interface IJavaImport extends IJavaSyntaxNode {
    nodeType: JavaSyntaxNodeType.IMPORT;
    path: string;
    alias: string;
  }

  export interface IJavaInterface extends IJavaSyntaxNode, INamed, IJavaAccessible {
    nodeType: JavaSyntaxNodeType.INTERFACE;
    fields: IJavaInterfaceField[];
    methods: IJavaInterfaceMethod[];
  }

  export interface IJavaInterfaceField extends IJavaObjectMember {
    nodeType: JavaSyntaxNodeType.INTERFACE_FIELD;
  }

  export interface IJavaInterfaceMethod extends IJavaObjectMember, IWithParameters<INamed & ITyped> {
    nodeType: JavaSyntaxNodeType.INTERFACE_METHOD;
  }

  export interface IJavaClass extends IJavaSyntaxNode, INamed, IJavaAccessible {
    nodeType: JavaSyntaxNodeType.CLASS;
    extends?: string;
    implements?: string[];
    nestedClasses: IJavaClass[];
    fields: IJavaClassField[];
    methods: IJavaClassMethod[];
  }

  export interface IJavaClassField extends IJavaObjectMember {
    nodeType: JavaSyntaxNodeType.CLASS_FIELD;
  }

  export interface IJavaClassMethod extends IJavaObjectMember, IWithParameters<INamed & ITyped>, IJavaNodeContainer {
    nodeType: JavaSyntaxNodeType.CLASS_METHOD;
  }

  export interface IJavaParameter extends IJavaSyntaxNode, INamed, ITyped { }
  export interface IJavaSyntaxTree extends ISyntaxTree<IJavaSyntaxNode> { }
}
