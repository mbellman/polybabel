import { IAccessible, IBlock, INamed, ISyntaxNode, ISyntaxTree, ITyped, IValued, IWithArguments, IWithParameters } from '../common/syntax-types';
import { Language } from '../../system/constants';

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
    OPERATOR,
    REFERENCE,
    VARIABLE_DECLARATION,
    PROPERTY_CHAIN,
    FUNCTION_CALL,
    LITERAL,
    INSTANTIATION,
    IF_ELSE,
    FOR_LOOP,
    WHILE_LOOP,
    SWITCH,
    INSTRUCTION
  }

  export const enum JavaAccessModifier {
    PUBLIC,
    PROTECTED,
    PRIVATE,
    PACKAGE
  }

  export const enum JavaLiteralType {
    KEYWORD,
    STRING,
    NUMBER,
    ARRAY
  }

  export enum JavaOperator {
    ASSIGN,
    ADD,
    ADD_ASSIGN,
    SUBTRACT,
    SUBTRACT_ASSIGN,
    MULTIPLY,
    MULTIPLY_ASSIGN,
    DIVIDE,
    DIVIDE_ASSIGN,
    REMAINDER,
    REMAINDER_ASSIGN,
    INCREMENT,
    DECREMENT,
    NEGATE,
    EQUAL_TO,
    NOT_EQUAL_TO,
    CONDITIONAL_AND,
    CONDITIONAL_OR,
    ELVIS,
    GREATER_THAN,
    GREATER_THAN_OR_EQUAL_TO,
    LESS_THAN,
    LESS_THAN_OR_EQUAL_TO,
    BITWISE_COMPLEMENT,
    SIGNED_LEFT_SHIFT,
    SIGNED_RIGHT_SHIFT,
    UNSIGNED_RIGHT_SHIFT,
    BITWISE_AND,
    BITWISE_EXCLUSIVE_OR,
    BITWISE_INCLUSIVE_OR,
    INSTANCEOF
  }

  export enum JavaInstruction {
    RETURN,
    BREAK,
    CONTINUE,
    THROW
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
    isAbstract?: boolean;
    isFinal?: boolean;
    isStatic?: boolean;
  }

  /**
   * A Java package declaration.
   */
  export interface IJavaPackage extends IJavaSyntaxNode {
    node: JavaSyntaxNode.PACKAGE;
    paths: string[];
  }

  /**
   * A Java import statement.
   */
  export interface IJavaImport extends IJavaSyntaxNode {
    node: JavaSyntaxNode.IMPORT;
    paths: string[];
    defaultImport: string;
    nonDefaultImports: string[];
    alias?: string;
    isStaticImport?: boolean;
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
    operator?: IJavaOperator;
    rightSide?: IJavaSyntaxNode;
  }

  export interface IJavaOperator extends IJavaSyntaxNode {
    node: JavaSyntaxNode.OPERATOR;
    operation: JavaOperator;
  }

  export interface IJavaReference extends IJavaSyntaxNode, IValued<string> {
    node: JavaSyntaxNode.REFERENCE;
  }

  export interface IJavaVariableDeclaration extends IJavaSyntaxNode, Pick<IJavaModifiable, 'isFinal'>, ITyped<IJavaType>, INamed {
    node: JavaSyntaxNode.VARIABLE_DECLARATION;
    isVariadic?: boolean;
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

  export interface IJavaForLoop extends IJavaSyntaxNode {
    node: JavaSyntaxNode.FOR_LOOP;
    statements: IJavaStatement[];
    isEnhanced?: boolean;
    block: IJavaBlock;
  }

  export interface IJavaWhileLoop extends IJavaSyntaxNode {
    node: JavaSyntaxNode.WHILE_LOOP;
    condition: IJavaStatement;
    block: IJavaBlock;
  }

  export interface IJavaSwitch extends IJavaSyntaxNode, IValued<IJavaStatement> {
    node: JavaSyntaxNode.SWITCH;
    cases: IJavaStatement[];
    blocks: IJavaBlock[];
    defaultBlock: IJavaBlock;
  }

  export interface IJavaInstruction extends IJavaSyntaxNode, IValued<IJavaStatement> {
    node: JavaSyntaxNode.INSTRUCTION;
    instruction: JavaInstruction;
  }

  export interface IJavaSyntaxTree extends ISyntaxTree<IJavaSyntaxNode> {
    language: Language.JAVA;
    node: JavaSyntaxNode.TREE;
    package: IJavaPackage;
  }
}
