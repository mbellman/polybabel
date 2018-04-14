import AbstractParser from '../common/AbstractParser';
import BlockParser from '../common/BlockParser';
import { Composes, Matches } from '../common/parser-decorators';
import { ISymbols, TokenMatcher, ParsedSyntax } from '../common/parser-types';
import { JavaSyntax } from './java-syntax';
import { ISyntaxNode } from '../common/syntax-types';

@Matches<ISymbols>()
@Composes(BlockParser)
export default abstract class JavaBlockParser extends AbstractParser<JavaSyntax.JavaParsedSyntax> {
  public static readonly symbols: TokenMatcher<BlockParser>[] = [
    ['{', parser => parser.onBlockEnter],
    ['}', parser => parser.onBlockExit]
  ];
}
