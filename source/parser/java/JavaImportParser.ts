import AbstractParser from '../common/AbstractParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';
import { TokenUtils } from '../../tokenizer/token-utils';
import { ParserUtils } from '../common/parser-utils';

export default class JavaImportParser extends AbstractParser<JavaSyntax.IJavaImport> {
  @Implements protected getDefault (): JavaSyntax.IJavaImport {
    return {
      node: JavaSyntax.JavaSyntaxNode.IMPORT,
      paths: [],
      defaultImport: null,
      nonDefaultImports: []
    };
  }

  @Override protected onFirstToken (): void {
    this.assertCurrentTokenMatch(JavaConstants.Keyword.IMPORT);
    this.next();
  }

  @Match(JavaConstants.Keyword.STATIC)
  protected onStaticImportDeclaration (): void {
    this.assert(this.parsed.paths.length === 0);

    this.parsed.isStaticImport = true;
  }

  @Match(TokenUtils.isWord)
  protected onDirectory (): void {
    this.parsed.paths.push(this.currentToken.value);
  }

  @Match('.')
  protected onDot (): void {
    this.assert(
      !ParserUtils.tokenMatches(this.previousToken, '.') &&
      !ParserUtils.tokenMatches(this.nextToken, '.')
    );
  }

  @Match('{')
  protected onStartNonDefaultImports (): void {
    this.next();

    while (this.currentTokenMatches(TokenUtils.isWord)) {
      this.parsed.nonDefaultImports.push(this.currentToken.value);
      this.next();

      if (this.currentTokenMatches('}')) {
        this.assert(ParserUtils.tokenMatches(this.nextToken, ';'));
        this.next();

        break;
      } else if (this.currentTokenMatches(',')) {
        this.assert(TokenUtils.isWord(this.nextTextToken));
        this.next();
      } else {
        this.halt();
      }
    }
  }

  @Match('}')
  protected onEndNonDefaultImports (): void {
    this.assert(
      this.parsed.nonDefaultImports.length > 0 &&
      ParserUtils.tokenMatches(this.nextToken, ';')
    );
  }

  @Match('*')
  protected onAliasedImport (): void {
    this.assert(ParserUtils.tokenMatches(this.nextToken, ';'));

    this.parsed.alias = this.getLastOfPath();
  }

  @Match(';')
  protected onEnd (): void {
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
}
