/**
 * @internal
 */
interface ISyntaxTreeRoot<T> {
  leftNode: T;
  rightNode: T;
}

/**
 * A base syntax tree node. The provided generic parameter T
 * should be a language-specific syntax node type constant.
 */
export interface ISyntaxNode<T> {
  type: T;
}

/**
 * A syntactic structure with an access modifier. The provided
 * generic parameter A should be an enum with access modifier
 * level constants.
 */
export interface IAccessible<A> {
  accessLevel: A;
}

/**
 * A syntactic structure identifiable by name.
 */
export interface INamed {
  name: string;
}

/**
 * A base syntax tree object.
 */
export interface ISyntaxTree extends ISyntaxTreeRoot<ISyntaxNode<any>> { }
