import { IAccessible, IBlock, INamed, ISyntaxNode, ISyntaxTree, ITyped, IValued, IWithArguments, IWithParameters } from '../common/syntax-types';

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
    STATEMENT,
    VARIABLE_DECLARATION,
    PROPERTY_CHAIN,
    FUNCTION_CALL,
    LITERAL,
    INSTANTIATION
  }

  export const enum JavaAccessModifier {
    PUBLIC,
    PROTECTED,
    PRIVATE,
    PACKAGE
  }

  export const enum JavaOperator {
    ADD,
    SUBTRACT,
    MULTIPLY,
    DIVIDE,
    ASSIGN
  }

  export const enum JavaLiteralType {
    KEYWORD,
    STRING,
    NUMBER,
    ARRAY
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
    nestedInterfaces: IJavaInterface[];
  }

  export interface IJavaType extends IJavaSyntaxNode {
    node: JavaSyntaxNode.TYPE;
    namespaceChain: string[];
    genericTypes: IJavaType[];
    arrayDimensions: number;
  }

  export interface IJavaObjectMember extends IJavaModifiable, ITyped<IJavaType>, INamed {
    node: JavaSyntaxNode;
  }

  export interface IJavaObjectField extends IJavaObjectMember, IValued<IJavaStatement> {
    node: JavaSyntaxNode.OBJECT_FIELD;
  }

  export interface IJavaObjectMethod extends IJavaObjectMember, IWithParameters<IJavaVariableDeclaration> {
    node: JavaSyntaxNode.OBJECT_METHOD;
    throws: IJavaType[];
    block: IJavaBlock;
  }

  export interface IJavaBlock extends IJavaSyntaxNode, IBlock<IJavaStatement> {
    node: JavaSyntaxNode.BLOCK;
  }

  export interface IJavaStatement extends IJavaSyntaxNode {
    node: JavaSyntaxNode.STATEMENT;
    leftSide: IJavaSyntaxNode;
    operator?: JavaOperator;
    rightSide?: IJavaSyntaxNode;
  }

  export interface IJavaVariableDeclaration extends IJavaSyntaxNode, Pick<IJavaModifiable, 'isFinal'>, ITyped<IJavaType>, INamed {
    node: JavaSyntaxNode.VARIABLE_DECLARATION;
  }

  export interface IJavaPropertyChain extends IJavaSyntaxNode {
    node: JavaSyntaxNode.PROPERTY_CHAIN;
    properties: Array<string | IJavaStatement | IJavaFunctionCall | IJavaType>;
  }

  export interface IJavaFunctionCall extends IJavaSyntaxNode, INamed, IWithArguments<IJavaStatement> {
    node: JavaSyntaxNode.FUNCTION_CALL;
    genericArguments: IJavaType[];
  }

  export interface IJavaLiteral extends IJavaSyntaxNode {
    node: JavaSyntaxNode.LITERAL;
    type: JavaLiteralType;
    value: string | IJavaStatement[];
  }

  export interface IJavaInstantiation extends IJavaSyntaxNode, IWithArguments<IJavaStatement> {
    node: JavaSyntaxNode.INSTANTIATION;
    constructor: IJavaType;
  }

  export interface IJavaSyntaxTree extends ISyntaxTree<IJavaSyntaxNode> {
    package: IJavaPackage;
  }
}
