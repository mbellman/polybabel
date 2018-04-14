import { IAccessible, INamed, ISyntaxNode, ISyntaxNodeContainer, ISyntaxTree, ITyped, IValued, IWithParameters } from '../common/syntax-types';

export namespace JavaSyntax {
  /**
   * @internal
   */
  interface IJavaSyntaxNode extends ISyntaxNode<JavaSyntaxNode> { }

  /**
   * @internal
   */
  interface IJavaSyntaxNodeContainer extends ISyntaxNodeContainer<IJavaSyntaxNode> { }

  /**
   * @internal
   */
  interface IJavaAccessible extends IAccessible<JavaAccessModifier> { }

  /**
   * @internal
   */
  interface IJavaModifiable {
    isAbstract?: true;
    isFinal?: true;
    isStatic?: true;
  }

  export const enum JavaSyntaxNode {
    PACKAGE,
    IMPORT,
    CLASS,
    INTERFACE,
    OBJECT_FIELD,
    OBJECT_METHOD,
    PARAMETER,
    VARIABLE,
    REFERENCE,
    EXPRESSION
  }

  export const enum JavaAccessModifier {
    PUBLIC,
    PROTECTED,
    PRIVATE,
    PACKAGE
  }

  export interface IJavaPackage extends IJavaSyntaxNode {
    node: JavaSyntaxNode.PACKAGE;
    path: string;
  }

  export interface IJavaImport extends IJavaSyntaxNode {
    node: JavaSyntaxNode.IMPORT;
    path: string;
    alias?: string;
  }

  export interface IJavaInterface extends IJavaSyntaxNode, INamed, IJavaAccessible {
    node: JavaSyntaxNode.INTERFACE;
    extends?: string[];
    fields: IJavaObjectField[];
    methods: IJavaObjectMethod[];
  }

  export interface IJavaClass extends IJavaSyntaxNode, INamed, IJavaAccessible, IJavaModifiable {
    node: JavaSyntaxNode.CLASS;
    extends?: string;
    implements?: string[];
    nestedClasses: IJavaClass[];
    fields: IJavaObjectField[];
    methods: IJavaObjectMethod[];
  }

  export interface IJavaObjectMember extends IJavaSyntaxNode, INamed, ITyped, IJavaAccessible, IJavaModifiable { }

  export interface IJavaObjectField extends IJavaObjectMember, Partial<IValued<JavaSyntaxNode>> {
    node: JavaSyntaxNode.OBJECT_FIELD;
  }

  export interface IJavaObjectMethod extends IJavaObjectMember, IWithParameters<IJavaParameter>, IJavaSyntaxNodeContainer {
    node: JavaSyntaxNode.OBJECT_METHOD;
  }

  export interface IJavaParameter extends IJavaSyntaxNode, INamed, ITyped, Pick<IJavaModifiable, 'isFinal'> {
    node: JavaSyntaxNode.PARAMETER;
  }

  export interface IJavaVariable extends IJavaSyntaxNode, INamed, ITyped, Pick<IJavaModifiable, 'isFinal'>, Partial<IValued<JavaSyntaxNode>> {
    node: JavaSyntaxNode.VARIABLE;
  }

  export interface IJavaReference extends IJavaSyntaxNode, INamed {
    node: JavaSyntaxNode.REFERENCE;
  }

  export interface IJavaExpression extends IJavaSyntaxNode, IJavaSyntaxNodeContainer {
    node: JavaSyntaxNode.EXPRESSION;
  }

  export interface IJavaSyntaxTree extends ISyntaxTree<IJavaSyntaxNode> { }

  export type JavaParsedSyntax = IJavaSyntaxNode | IJavaSyntaxTree;
}
