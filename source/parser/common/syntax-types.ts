import { IToken } from '../../tokenizer/types';
import { Language } from '../../system/constants';

/**
 * A base syntax tree node. The provided generic parameter N
 * should be an enum of language-specific syntax node constants.
 */
export interface ISyntaxNode<N = any> {
  node: N;
  token?: IToken;
}

/**
 * A syntactic construct with an access modifier. The provided
 * generic parameter A should be an enum with language-specific
 * access modifier constants.
 */
export interface IAccessible<A> {
  access: A;
}

/**
 * A syntactic construct identifiable by name. The provided generic
 * parameter T defaults to <string>, but can be any type if the
 * construct it represents the name for can have a name identifier
 * of other types or constructs.
 */
export interface INamed<T = string> {
  name: T;
}

/**
 * A syntatic construct with a particular type. Only applies
 * to explicitly-typed languages. The provided generic parameter
 * T should be an interface of a language-specific 'type' syntax
 * node.
 */
export interface ITyped<T extends ISyntaxNode = ISyntaxNode> {
  type: T;
}

/**
 * A syntactic construct with an assigned value.
 */
export interface IValued<V> {
  value: V;
}

/**
 * A syntactic construct which has associated parameters, such
 * as a class method or function. The provided generic parameter
 * P should be a type constraint for a language-specific parameter
 * syntax node.
 */
export interface IWithParameters<P extends ISyntaxNode> {
  parameters: P[];
}

/**
 * A syntactic construct which has arguments, such as a function
 * call. The provided generic parameter A should be a type constraint
 * for a language-specific expression syntax node.
 */
export interface IWithArguments<A extends ISyntaxNode> {
  arguments: A[];
}

/**
 * A syntactic construct representing a sequence of values, such
 * as a list of parameters, arguments, list entries, etc. The
 * provided generic parameter V should be an enum with language-
 * specific syntax node constants, or a single language-specific
 * syntax node constant.
 */
export interface ISequence<V extends ISyntaxNode> {
  values: V[];
}

/**
 * A syntactic construct which can contain an arbitrary number
 * of syntax nodes. The provided generic parameter N should be
 * an enum of language-specific syntax node constants, or a
 * single language-specific syntax node constant.
 */
export interface IBlock<N extends ISyntaxNode> {
  nodes: N[];
}

/**
 * A base syntax tree object, representing all syntactic elements
 * in a file. The provided generic parameter N should be an enum
 * of language-specific syntax node constants. A syntax tree is
 * also itself considered a syntax node.
 */
export interface ISyntaxTree<N extends ISyntaxNode = ISyntaxNode> extends ISyntaxNode, IBlock<N> {
  language: Language;
}
