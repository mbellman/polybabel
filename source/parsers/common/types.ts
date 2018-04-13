import AbstractTokenStream from './AbstractTokenStream';
import { Callback } from '../../system/types';
import { ISyntaxNode, ISyntaxTree } from './syntax';

/**
 * @internal
 */
type Match = string | RegExp | (RegExp | string)[];

export type ParsedSyntax = ISyntaxNode | ISyntaxTree;

export type TokenStreamHandler<P extends ParsedSyntax> = Callback<AbstractTokenStream<P>>;

export type TokenMatcher<P extends ParsedSyntax> = [Match, TokenStreamHandler<P>];
