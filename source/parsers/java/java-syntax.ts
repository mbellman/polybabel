import { IAccessible, IBlock, INamed, ISyntaxNode, ISyntaxTree, ITyped, IValued, IWithParameters } from '../common/syntax-types';

export namespace JavaSyntax {
  export const enum JavaSyntaxNode {
    TREE,
    PACKAGE,
    IMPORT,
    CLASS,
    INTERFACE,
    SEQUENCE,
    TYPE,
    OBJECT_FIELD,
    OBJECT_METHOD,
    PARAMETER,
    BLOCK,
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

  export interface IJavaSyntaxNode extends ISyntaxNode<JavaSyntaxNode> { }

  export interface IJavaAccessible extends IAccessible<JavaAccessModifier> { }

  export interface IJavaPackage extends IJavaSyntaxNode {
    node: JavaSyntaxNode.PACKAGE;
    path: string;
  }

  export interface IJavaImport extends IJavaSyntaxNode, INamed {
    node: JavaSyntaxNode.IMPORT;
    path: string;
  }

  export interface IJavaModifiable extends IJavaSyntaxNode, IJavaAccessible {
    isAbstract?: true;
    isFinal?: true;
    isStatic?: true;
  }

  export interface IJavaInterface extends IJavaSyntaxNode, INamed, IJavaAccessible {
    node: JavaSyntaxNode.INTERFACE;
    extends?: IJavaType[];
    fields: IJavaObjectField[];
    methods: IJavaObjectMethod[];
  }

  export interface IJavaClass extends IJavaSyntaxNode, INamed, IJavaModifiable {
    node: JavaSyntaxNode.CLASS;
    extends: IJavaType[];
    implements: IJavaType[];
    fields: IJavaObjectField[];
    methods: IJavaObjectMethod[];
    nestedClasses: IJavaClass[];
  }

  export interface IJavaSequence<T extends IJavaSyntaxNode> extends IJavaSyntaxNode {
    node: JavaSyntaxNode.SEQUENCE;
    values: T[];
  }

  export interface IJavaType extends IJavaSyntaxNode, INamed {
    node: JavaSyntaxNode.TYPE;
    genericTypes: IJavaType[];
    isArray?: true;
  }

  export interface IJavaObjectMember extends IJavaModifiable, ITyped<IJavaType>, INamed {
    node: JavaSyntaxNode;
  }

  export interface IJavaObjectField extends IJavaObjectMember, IValued<JavaSyntaxNode> {
    node: JavaSyntaxNode.OBJECT_FIELD;
  }

  export interface IJavaObjectMethod extends IJavaObjectMember, IWithParameters<IJavaParameter> {
    node: JavaSyntaxNode.OBJECT_METHOD;
    throws?: IJavaType[];
    block: IJavaBlock;
  }

  export interface IJavaParameter extends IJavaSyntaxNode, INamed, ITyped<IJavaType>, Pick<IJavaModifiable, 'isFinal'> {
    node: JavaSyntaxNode.PARAMETER;
  }

  export interface IJavaBlock extends IJavaSyntaxNode, IBlock<IJavaSyntaxNode> {
    node: JavaSyntaxNode.BLOCK;
  }

  export interface IJavaVariable extends IJavaSyntaxNode, INamed, ITyped<IJavaType>, Pick<IJavaModifiable, 'isFinal'>, IValued<JavaSyntaxNode> {
    node: JavaSyntaxNode.VARIABLE;
  }

  export interface IJavaReference extends IJavaSyntaxNode, INamed {
    node: JavaSyntaxNode.REFERENCE;
  }

  export interface IJavaExpression extends IJavaSyntaxNode {
    node: JavaSyntaxNode.EXPRESSION;
  }

  export interface IJavaSyntaxTree extends ISyntaxTree<IJavaSyntaxNode> {
    package: IJavaPackage;
  }

  export type JavaParsedSyntax = IJavaSyntaxNode | IJavaSyntaxTree;
}
