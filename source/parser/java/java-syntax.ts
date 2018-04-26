import { IAccessible, IBlock, INamed, ISyntaxNode, ISyntaxTree, ITyped, IValued, IWithArguments, IWithParameters } from '../common/syntax-types';

export namespace JavaSyntax {
  export const enum JavaSyntaxNode {
    TREE,
    PACKAGE,
    IMPORT,
    CLASS,
    INTERFACE,
    ENUM,
    OBJECT_FIELD,
    OBJECT_METHOD,
    TYPE,
    PARAMETER,
    BLOCK,
    STATEMENT,
    VARIABLE_DECLARATION,
    PROPERTY_CHAIN,
    FUNCTION_CALL,
    LITERAL,
    INSTANTIATION,
    IF_ELSE,
    WHILE_LOOP,
    FOR_LOOP
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

  /**
   * Any Java syntactic construct.
   */
  export interface IJavaSyntaxNode extends ISyntaxNode<JavaSyntaxNode> { }

  /**
   * A Java construct with an access level specified by
   * a constant in JavaAccessModifier.
   */
  export interface IJavaAccessible extends IAccessible<JavaAccessModifier> { }

  /**
   * A Java construct with modifier flags, including
   * an access modifier.
   */
  export interface IJavaModifiable extends IJavaSyntaxNode, IJavaAccessible {
    isAbstract?: true;
    isFinal?: true;
    isStatic?: true;
  }

  /**
   * A Java package declaration.
   */
  export interface IJavaPackage extends IJavaSyntaxNode {
    node: JavaSyntaxNode.PACKAGE;
    path: string;
  }

  /**
   * A Java import statement.
   */
  export interface IJavaImport extends IJavaSyntaxNode, INamed {
    node: JavaSyntaxNode.IMPORT;
    path: string;
  }

  /**
   * A Java type reference.
   */
  export interface IJavaType extends IJavaSyntaxNode {
    node: JavaSyntaxNode.TYPE;
    namespaceChain: string[];
    genericTypes: IJavaType[];
    arrayDimensions: number;
  }

  /**
   * The body of a Java object construct, containing
   * an array of its members.
   */
  export interface IJavaObjectBody extends IJavaSyntaxNode {
    members: Array<IJavaObjectField | IJavaObjectMethod | IJavaObject>;
  }

  /**
   * Any Java construct which represents an 'object'
   * in the classical OOP sense. Generalizes classes,
   * interfaces, and enums.
   */
  export interface IJavaObject extends IJavaModifiable, INamed, IJavaObjectBody {
    extended?: IJavaType[];
    implemented?: IJavaType[];
  }

  /**
   * A Java class.
   */
  export interface IJavaClass extends IJavaSyntaxNode, IJavaObject {
    node: JavaSyntaxNode.CLASS;
  }

  /**
   * A Java interface.
   */
  export interface IJavaInterface extends IJavaSyntaxNode, IJavaObject {
    node: JavaSyntaxNode.INTERFACE;
  }

  /**
   * A Java enum.
   */
  export interface IJavaEnum extends IJavaSyntaxNode, IJavaObject {
    node: JavaSyntaxNode.ENUM;
    values: IJavaSyntaxNode[];
  }

  /**
   * A field on a Java object definition, either uninitialized
   * or assigned to a statement value.
   */
  export interface IJavaObjectField extends IJavaSyntaxNode, IJavaModifiable, ITyped<IJavaType>, INamed, IValued<IJavaStatement> {
    node: JavaSyntaxNode.OBJECT_FIELD;
  }

  /**
   * A method on a Java object definition, either uninitialized
   * or with a block containing statements.
   */
  export interface IJavaObjectMethod extends IJavaSyntaxNode, IJavaModifiable, ITyped<IJavaType>, INamed, IWithParameters<IJavaVariableDeclaration> {
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

  export interface IJavaIfElse extends IJavaSyntaxNode {
    node: JavaSyntaxNode.IF_ELSE;
    conditions: IJavaStatement[];
    blocks: IJavaBlock[];
  }

  export interface IJavaSyntaxTree extends ISyntaxTree<IJavaSyntaxNode> {
    package: IJavaPackage;
  }
}
