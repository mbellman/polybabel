import { IAccessible, IBlock, INamed, ISyntaxNode, ISyntaxTree, ITyped, IValued, IWithArguments, IWithParameters } from '../common/syntax-types';
import { Language } from '../../system/constants';
import { Without } from '../../system/types';

export namespace JavaSyntax {
  export const enum JavaSyntaxNode {
    TREE = 'TREE',
    PACKAGE = 'PACKAGE',
    IMPORT = 'IMPORT',
    CLASS = 'CLASS',
    INTERFACE = 'INTERFACE',
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
    DO_WHILE_LOOP = 'DO_WHILE_LOOP',
    SWITCH = 'SWITCH',
    TRY_CATCH = 'TRY_CATCH',
    INSTRUCTION = 'INSTRUCTION',
    TERNARY = 'TERNARY',
    LAMBDA_EXPRESSION = 'LAMBDA_EXPRESSION',
    ASSERTION = 'ASSERTION',
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

  export enum JavaOperation {
    ASSIGN,
    ADD,
    SUBTRACT,
    MULTIPLY,
    DIVIDE,
    REMAINDER,
    INCREMENT,
    DECREMENT,
    NEGATE,
    DOUBLE_NOT,
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

  export enum JavaWildcardBound {
    UPPER,
    LOWER
  }

  /**
   * A property in a Java property chain.
   */
  export type JavaProperty = IJavaReference | IJavaStatement | IJavaFunctionCall | IJavaInstantiation | IJavaLiteral | IJavaType;

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
    isWildcard?: boolean;
    wildcardBound?: JavaWildcardBound;
    wildcardBoundType?: IJavaType;
    parameterBoundName?: string;
    parameterBoundTypes?: IJavaType[];
  }

  /**
   * The body of a Java object construct, containing
   * an array of its members.
   */
  export interface IJavaObjectBody extends IJavaSyntaxNode {
    constructors?: IJavaObjectMethod[];
    members: JavaObjectMember[];
    instanceInitializers: IJavaBlock[];
    staticInitializers: IJavaBlock[];
  }

  /**
   * Any Java construct which represents an 'object'
   * in the classical OOP sense. Generalizes classes,
   * interfaces, and enums.
   */
  export interface IJavaObject extends IJavaModifiable, INamed, IJavaObjectBody {
    genericParameters?: IJavaType[];
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
    annotations?: IJavaAnnotation[];
    genericTypes?: IJavaType[];
    isConstructor?: boolean;
    throws: IJavaType[];
    block: IJavaBlock;
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
   * right-side statement node.
   */
  export interface IJavaStatement extends IJavaSyntaxNode {
    node: JavaSyntaxNode.STATEMENT;
    leftSide: IJavaSyntaxNode;
    operator?: IJavaOperator;
    rightSide?: IJavaStatement;
    isParenthetical?: boolean;
    cast?: IJavaType;
  }

  /**
   * A Java operator.
   */
  export interface IJavaOperator extends IJavaSyntaxNode {
    node: JavaSyntaxNode.OPERATOR;
    operation: JavaOperation;
    isShorthandAssignment?: boolean;
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
    arrayAllocationSize?: IJavaStatement;
    arrayLiteral?: IJavaLiteral;
    anonymousObjectBody?: IJavaObjectBody;
    // Determined during validation
    overloadIndex?: number;
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
   * A Java do-while loop statement.
   */
  export interface IJavaDoWhileLoop extends IJavaSyntaxNode {
    node: JavaSyntaxNode.DO_WHILE_LOOP;
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
    // Determined during validation
    isConstructorReturn?: boolean;
  }

  /**
   * A Java ternary expression statement.
   */
  export interface IJavaTernary extends IJavaSyntaxNode {
    node: JavaSyntaxNode.TERNARY;
    condition: IJavaStatement;
    left: IJavaStatement;
    right: IJavaStatement;
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
   * A Java assertion, which requires a condition to be
   * true before proceeding.
   */
  export interface IJavaAssertion extends IJavaSyntaxNode {
    node: JavaSyntaxNode.ASSERTION;
    condition: IJavaStatement;
    message?: IJavaStatement;
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
