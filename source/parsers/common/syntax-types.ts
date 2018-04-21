import { Language } from '../../system/constants';

/**
 * A base syntax tree node. The provided generic parameter N
 * should be an enum of language-specific syntax node constants.
 */
export interface ISyntaxNode<N = any> {
  node: N;
}

/**
 * A syntactic structure with an access modifier. The provided
 * generic parameter A should be an enum with language-specific
 * access modifier constants.
 */
export interface IAccessible<A> {
  access: A;
}

/**
 * A syntactic structure identifiable by name.
 */
export interface INamed {
  name: string;
}

/**
 * A syntatic structure with a particular type. Only applies
 * to explicitly-typed languages. The provided generic parameter
 * T should be an interface of a language-specific 'type' syntax
 * node.
 */
export interface ITyped<T> {
  type: T;
}

/**
 * A syntactic structure with an assigned value.
 */
export interface IValued<V> {
  value: V;
}

/**
 * A syntactic structure which has associated parameters, such
 * as a class method or function. The provided generic parameter
 * P should be a type signature for a language-specific parameter
 * syntax node.
 */
export interface IWithParameters<P extends ISyntaxNode> {
  parameters: P[];
}

/**
 * A syntactic structure representing a sequence of values, such
 * as a list of parameters, arguments, list entries, etc. The
 * provided generic parameter V should be an enum with language-
 * specific syntax node constants, or a single language-specific
 * syntax node constant.
 */
export interface ISequence<V extends ISyntaxNode> {
  values: V[];
}

/**
 * A syntactic structure which can contain an arbitrary number
 * of syntax nodes. The provided generic parameter N should be
 * an enum of language-specific syntax node constants.
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
export interface ISyntaxTree<N extends ISyntaxNode = ISyntaxNode> extends ISyntaxNode, IBlock<N> { }
