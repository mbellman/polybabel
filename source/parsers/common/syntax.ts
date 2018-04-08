/**
 * @internal
 */
interface IBinaryTree<T = any> {
  leftNode: T;
  rightNode: T;
}

export interface ISyntaxNode {
  type: any;
}

/**
 * A base syntax tree object.
 */
export interface ISyntaxTree extends IBinaryTree<ISyntaxNode> { }
