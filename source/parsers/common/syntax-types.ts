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
 * to explicitly-typed languages.
 */
export interface ITyped {
  type: string;
}

/**
 * A syntactic structure with an assigned value. The provided
 * generic parameter N should be an enum with language-specific
 * syntax node constants.
 */
export interface IValued<N> {
  value?: ISyntaxNode<N>;
}

/**
 * A syntactic structure which has associated parameters, such
 * as a class method or function. The provided generic parameter
 * P should be a type signature for a language-specific parameter
 * syntax node.
 */
export interface IWithParameters<P> {
  parameters: P[];
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
