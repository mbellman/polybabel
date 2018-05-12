import AbstractParser from '../common/AbstractParser';
import JavaReferenceParser from './statement-parsers/JavaReferenceParser';
import { Allow, Eat, Match, SingleLineParser } from '../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { ParserUtils } from '../common/parser-utils';
import { TokenUtils } from '../../tokenizer/token-utils';

/**
 * Parses Java import statements, finishing upon encountering
 * a ; token. This parser also supports a special syntactical
 * import variant, not normally valid in Java, which enables
 * non-default imports after translation to JavaScript.
 *
 * @example
 *
 *  import java.util.System;
 *  import java.util.*;
 *  import react.{ Component, render };
 */
@SingleLineParser
export default class JavaImportParser extends AbstractParser<JavaSyntax.IJavaImport> {
  private currentPathPart: string = '';

  @Implements protected getDefault (): JavaSyntax.IJavaImport {
    return {
      node: JavaSyntax.JavaSyntaxNode.IMPORT,
      paths: [],
      defaultImport: null,
      nonDefaultImports: []
    };
  }

  @Eat(JavaConstants.Keyword.IMPORT)
  protected onImport (): void {
    this.next();
  }

  @Allow(JavaConstants.Keyword.STATIC)
  protected onStaticImportDeclaration (): void {
    if (TokenUtils.isWhitespace(this.nextToken)) {
      this.parsed.isStaticImport = true;
    } else {
      // Disallow starting folders named 'static'
      // to avoid any confusion
      this.halt();
    }
  }

  @Eat(TokenUtils.isWord)
  @Match(/./)
  protected onPathPart (): void {
    this.assert(this.parsed.nonDefaultImports.length === 0);

    this.currentPathPart += this.currentToken.value;
  }

  @Match('.')
  protected onDot (): void {
    this.assert(
      !ParserUtils.tokenMatches(this.previousToken, '.') &&
      !ParserUtils.tokenMatches(this.nextToken, '.')
    );

    this.saveCurrentPathPart();
  }

  @Match('{')
  protected onStartNonDefaultImports (): void {
    this.assert(
      !this.parsed.isStaticImport,
      'Non-default imports cannot be static'
    );

    this.next();

    const nonDefaultImportReferences = this.parseSequence({
      ValueParser: JavaReferenceParser,
      delimiter: ',',
      terminator: '}'
    });

    this.parsed.nonDefaultImports = nonDefaultImportReferences.map(({ value }) => value);
  }

  @Match('}')
  protected onEndNonDefaultImports (): void {
    this.assert(this.parsed.nonDefaultImports.length > 0);
  }

  @Match('*')
  protected onAliasedImport (): void {
    this.assert(
      !this.parsed.isStaticImport &&
      this.parsed.nonDefaultImports.length === 0 &&
      ParserUtils.tokenMatches(this.nextToken, ';')
    );

    this.parsed.alias = this.getLastOfPath();
  }

  @Match(';')
  protected onEnd (): void {
    this.saveCurrentPathPart();

    if (this.parsed.nonDefaultImports.length === 0) {
      const { paths } = this.parsed;

      this.parsed.defaultImport = this.parsed.isStaticImport
        ? paths[paths.length - 2]
        : this.getLastOfPath();
    }

    this.finish();
  }

  private getLastOfPath (): string {
    return this.parsed.paths[this.parsed.paths.length - 1];
  }

  private saveCurrentPathPart (): void {
    if (this.currentPathPart.length > 0) {
      this.parsed.paths.push(this.currentPathPart);
    }

    this.currentPathPart = '';
  }
}
