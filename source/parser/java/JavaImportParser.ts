import AbstractParser from '../common/AbstractParser';
import { Allow, Eat, Match } from '../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { ParserUtils } from '../common/parser-utils';
import { TokenUtils } from '../../tokenizer/token-utils';
import SequenceParser from '../common/SequenceParser';
import JavaReferenceParser from './statement-parsers/JavaReferenceParser';

export default class JavaImportParser extends AbstractParser<JavaSyntax.IJavaImport> {
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
    this.parsed.isStaticImport = true;
  }

  @Eat(TokenUtils.isWord)
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

    const nonDefaultImportsParser = new SequenceParser({
      ValueParser: JavaReferenceParser,
      delimiter: ',',
      terminator: '}'
    });

    const { values } = this.parseNextWith(nonDefaultImportsParser);

    this.parsed.nonDefaultImports = values.map(({ value }) => value);
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
    this.assert(
      !this.parsed.isStaticImport &&
      this.parsed.nonDefaultImports.length === 0 &&
      ParserUtils.tokenMatches(this.nextToken, ';')
    );

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
