import { IAccessible, IBlock, INamed, ISyntaxNode, ISyntaxTree, ITyped, IValued, IWithArguments, IWithParameters } from '../common/syntax-types';
import { Language } from '../../system/constants';

export namespace JavaSyntax {
  export const enum JavaSyntaxNode {
    TREE = 'TREE',
    PACKAGE = 'PACKAGE',
    IMPORT = 'IMPORT',
    CLASS = 'CLASS',
    INTERFACE = 'INTERFACE',
    ENUM = 'ENUM',
    OBJECT_FIELD = 'OBJECT FIELD',
    OBJECT_METHOD = 'OBJECT METHOD',
    TYPE = 'TYPE',
    PARAMETER = 'PARAMETER',
    BLOCK = 'BLOCK',
    STATEMENT = 'STATEMENT',
    OPERATOR = 'OPERATOR',
    REFERENCE = 'REFERENCE',
    VARIABLE_DECLARATION = 'VARIABLE DECLARATION',
    PROPERTY_CHAIN = 'PROPERTY CHAIN',
    FUNCTION_CALL = 'FUNCTION CALL',
    LITERAL = 'LITERAL',
    INSTANTIATION = 'INSTANTIATION',
    IF_ELSE = 'IF ELSE',
    FOR_LOOP = 'FOR LOOP',
    WHILE_LOOP = 'WHILE LOOP',
    SWITCH = 'SWITCH',
    TRY_CATCH = 'TRY_CATCH',
    INSTRUCTION = 'INSTRUCTION',
    LAMBDA_EXPRESSION = 'LAMBDA_EXPRESSION',
    ANNOTATION = 'ANNOTATION'
  }

  export const enum JavaAccessModifier {
    PUBLIC = 'PUBLIC',
    PROTECTED = 'PROTECTED',
    PRIVATE = 'PRIVATE',
    PACKAGE = 'PACKAGE'
  }

  export const enum JavaLiteralType {
    KEYWORD = 'KEYWORD',
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    ARRAY = 'ARRAY'
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

  export enum JavaInstructionType {
    RETURN = 'RETURN',
    BREAK = 'BREAK',
    CONTINUE = 'CONTINUE',
    THROW = 'THROW'
  }

  /**
   * A property in a Java property chain.
   */
  export type JavaProperty = string | IJavaStatement | IJavaFunctionCall | IJavaInstantiation | IJavaType;

  /**
   * A Java object member.
   */
  export type JavaObjectMember = IJavaObjectField | IJavaObjectMethod | IJavaObject;

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
   * A Java import.
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
    members: JavaObjectMember[];
  }

  /**
   * Any Java construct which represents an 'object'
   * in the classical OOP sense. Generalizes classes,
   * interfaces, and enums.
   */
  export interface IJavaObject extends IJavaModifiable, INamed, IJavaObjectBody {
    extended?: IJavaType[];
    implemented?: IJavaType[];
    annotations?: IJavaAnnotation[];
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
    constants: IJavaSyntaxNode[];
  }

  /**
   * A field on a Java object definition, either uninitialized
   * or assigned to a statement value.
   */
  export interface IJavaObjectField extends IJavaSyntaxNode, IJavaModifiable, ITyped<IJavaType>, INamed, IValued<IJavaStatement> {
    node: JavaSyntaxNode.OBJECT_FIELD;
    annotations?: IJavaAnnotation[];
  }

  /**
   * A method on a Java object definition, either uninitialized
   * or with a block of statements.
   */
  export interface IJavaObjectMethod extends IJavaSyntaxNode, IJavaModifiable, ITyped<IJavaType>, INamed, IWithParameters<IJavaVariableDeclaration> {
    node: JavaSyntaxNode.OBJECT_METHOD;
    throws: IJavaType[];
    block: IJavaBlock;
    annotations?: IJavaAnnotation[];
  }

  /**
   * A block containing a sequence of Java statements.
   */
  export interface IJavaBlock extends IJavaSyntaxNode, IBlock<IJavaStatement> {
    node: JavaSyntaxNode.BLOCK;
  }

  /**
   * A Java statement, representing any one of many different
   * statement types. Rather than making a distinction between
   * statements and expressions, statements simply consist of
   * a left-side syntax node, with a possible operator and
   * right-side statement.
   */
  export interface IJavaStatement extends IJavaSyntaxNode {
    node: JavaSyntaxNode.STATEMENT;
    leftSide: IJavaSyntaxNode;
    operator?: IJavaOperator;
    rightSide?: IJavaStatement;
    isParenthetical?: boolean;
  }

  /**
   * A Java operator.
   */
  export interface IJavaOperator extends IJavaSyntaxNode {
    node: JavaSyntaxNode.OPERATOR;
    operation: JavaOperator;
  }

  /**
   * A reference to a Java variable, object member, or object.
   */
  export interface IJavaReference extends IJavaSyntaxNode, IValued<string> {
    node: JavaSyntaxNode.REFERENCE;
    // Determined during validation
    isInstanceFieldReference?: boolean;
  }

  /**
   * A Java variable declaration statement.
   */
  export interface IJavaVariableDeclaration extends IJavaSyntaxNode, Pick<IJavaModifiable, 'isFinal'>, ITyped<IJavaType>, INamed {
    node: JavaSyntaxNode.VARIABLE_DECLARATION;
    isVariadic?: boolean;
  }

  /**
   * A dot or bracket-delimited chain of properties, consisting
   * of strings, statements (for dynamically computed properties),
   * or method calls.
   */
  export interface IJavaPropertyChain extends IJavaSyntaxNode {
    node: JavaSyntaxNode.PROPERTY_CHAIN;
    properties: JavaProperty[];
  }

  /**
   * A Java function (method) call statement.
   */
  export interface IJavaFunctionCall extends IJavaSyntaxNode, INamed, IWithArguments<IJavaStatement> {
    node: JavaSyntaxNode.FUNCTION_CALL;
    genericArguments: IJavaType[];
    // Determined during validation
    isInstanceFunction?: boolean;
  }

  /**
   * A Java literal statement. Either a string, number, or
   * keyword literal, or an array literal with a sequence of
   * a statements.
   */
  export interface IJavaLiteral extends IJavaSyntaxNode {
    node: JavaSyntaxNode.LITERAL;
    type: JavaLiteralType;
    value: string | IJavaStatement[];
  }

  /**
   * A Java object instantiation statement.
   */
  export interface IJavaInstantiation extends IJavaSyntaxNode, IWithArguments<IJavaStatement> {
    node: JavaSyntaxNode.INSTANTIATION;
    constructor: IJavaType;
    arrayAllocationCount?: string;
    arrayLiteral?: IJavaLiteral;
    anonymousObjectBody?: IJavaObjectBody;
  }

  /**
   * A Java if/else statement, consisting of either a single if
   * block, an if and else block, or an if block, an indefinite
   * number of else if blocks, and/or an else block.
   */
  export interface IJavaIfElse extends IJavaSyntaxNode {
    node: JavaSyntaxNode.IF_ELSE;
    conditions: IJavaStatement[];
    blocks: IJavaBlock[];
  }

  /**
   * A Java for loop statement.
   */
  export interface IJavaForLoop extends IJavaSyntaxNode {
    node: JavaSyntaxNode.FOR_LOOP;
    statements: IJavaStatement[];
    isEnhanced?: boolean;
    block: IJavaBlock;
  }

  /**
   * A Java while loop statement.
   */
  export interface IJavaWhileLoop extends IJavaSyntaxNode {
    node: JavaSyntaxNode.WHILE_LOOP;
    condition: IJavaStatement;
    block: IJavaBlock;
  }

  /**
   * A Java switch statement.
   */
  export interface IJavaSwitch extends IJavaSyntaxNode, IValued<IJavaStatement> {
    node: JavaSyntaxNode.SWITCH;
    cases: IJavaStatement[];
    blocks: IJavaBlock[];
    defaultBlock: IJavaBlock;
  }

  /**
   * A Java try/catch statement, potentially with a 'finally'
   * block.
   */
  export interface IJavaTryCatch extends IJavaSyntaxNode {
    node: JavaSyntaxNode.TRY_CATCH;
    tryBlock: IJavaBlock;
    exceptionSets: IJavaType[][];
    exceptionReferences: IJavaReference[];
    catchBlocks: IJavaBlock[];
    finallyBlock?: IJavaBlock;
  }

  /**
   * A Java instruction statement, e.g. return, throw, break,
   * or continue;
   */
  export interface IJavaInstruction extends IJavaSyntaxNode, IValued<IJavaStatement> {
    node: JavaSyntaxNode.INSTRUCTION;
    type: JavaInstructionType;
  }

  /**
   * A Java lambda expression.
   */
  export interface IJavaLambdaExpression extends IJavaSyntaxNode, IWithParameters<IJavaVariableDeclaration | IJavaReference> {
    node: JavaSyntaxNode.LAMBDA_EXPRESSION;
    statement?: IJavaStatement;
    block?: IJavaBlock;
  }

  /**
   * A Java annotation, signified by a @ character.
   */
  export interface IJavaAnnotation extends IJavaSyntaxNode, INamed, IWithArguments<IJavaStatement> {
    node: JavaSyntaxNode.ANNOTATION;
  }

  /**
   * A syntax tree representing all of the Java code in a file.
   */
  export interface IJavaSyntaxTree extends ISyntaxTree<IJavaSyntaxNode> {
    language: Language.JAVA;
    node: JavaSyntaxNode.TREE;
    package: IJavaPackage;
  }
}
