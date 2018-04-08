import { IAccessible, INamed, ISyntaxNode, ISyntaxTree } from '../common/syntax';

export const enum JavaSyntaxNodeType {
  IMPORT_STATEMENT,
  CLASS_DECLARATION,
  CLASS_FIELD,
  CLASS_METHOD
}

export const enum JavaAccessModifier {
  PUBLIC,
  PROTECTED,
  PRIVATE,
  PACKAGE
}

export interface IJavaImportStatement extends ISyntaxNode<JavaSyntaxNodeType> {
  type: JavaSyntaxNodeType.IMPORT_STATEMENT;
  path: string;
  alias: string;
}

export interface IJavaClassDeclaration extends ISyntaxNode<JavaSyntaxNodeType>, INamed, IAccessible<JavaAccessModifier> {
  type: JavaSyntaxNodeType.CLASS_DECLARATION;
  extends: string;
  implements: string[];
  fields: IJavaClassField[];
  methods: IJavaClassMethods[];
}

export interface IJavaClassField extends ISyntaxNode<JavaSyntaxNodeType>, INamed, IAccessible<JavaAccessModifier> {
  type: JavaSyntaxNodeType.CLASS_FIELD;
}

export interface IJavaClassMethods extends ISyntaxNode<JavaSyntaxNodeType>, INamed, IAccessible<JavaAccessModifier> {
  type: JavaSyntaxNodeType.CLASS_METHOD;
}

export interface IJavaSyntaxTree extends ISyntaxTree { }
