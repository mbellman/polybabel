import AbstractParser from '../common/AbstractParser';
import JavaFunctionCallParser from './statement-parsers/JavaFunctionCallParser';
import JavaInstantiationParser from './statement-parsers/JavaInstantiationParser';
import JavaLiteralParser from './statement-parsers/JavaLiteralParser';
import JavaPropertyChainParser from './statement-parsers/JavaPropertyChainParser';
import JavaVariableDeclarationParser from './statement-parsers/JavaVariableDeclarationParser';
import { Callback, Implements } from 'trampoline-framework';
import { Constructor } from '../../system/types';
import { JavaSyntax } from './java-syntax';
import { JavaUtils } from './java-utils';
import { Match } from '../common/parser-decorators';
import { TokenPredicate } from '../common/parser-types';

/**
 * A 2-tuple which contains a token predicate and a parser
 * class to be used to parse an incoming statement if its
 * predicate returns true.
 *
 * @internal
 */
type StatementMatcher = [ TokenPredicate, Constructor<AbstractParser> ];

export default class JavaStatementParser extends AbstractParser<JavaSyntax.IJavaStatement> {
  /**
   * A list of statement matchers to use to test the token
   * at the beginning of each new statement. If a predicate
   * returns true, its corresponding parser class is used
   * to parse the statement's left side.
   *
   * See: onStatement()
   *
   * A getter is used to circumvent circular dependency
   * issues with CommonJS; returning the list in a method
   * allows the parser classes time to become defined.
   */
  private static get StatementMatchers (): StatementMatcher[] {
    return [
      [ JavaUtils.isLiteral, JavaLiteralParser ],
      [ JavaUtils.isInstantiation, JavaInstantiationParser ],
      [ JavaUtils.isFunctionCall, JavaFunctionCallParser ],
      [ JavaUtils.isPropertyChain, JavaPropertyChainParser ],
      [ JavaUtils.isTypeName, JavaVariableDeclarationParser ],
    ];
  }

  @Implements protected getDefault (): JavaSyntax.IJavaStatement {
    return {
      node: JavaSyntax.JavaSyntaxNode.STATEMENT,
      leftSide: null
    };
  }

  @Match(/./)
  protected onStatement (): void {
    for (const [ tokenPredicate, Parser ] of JavaStatementParser.StatementMatchers) {
      if (tokenPredicate(this.currentToken)) {
        this.assert(this.parsed.leftSide === null);

        this.parsed.leftSide = this.parseNextWith(Parser);

        return;
      }
    }

    this.stop();
  }

  @Match('=')
  protected onAssignment (): void {
    this.assert(this.parsed.leftSide !== null);
    this.next();

    this.parsed.operator = JavaSyntax.JavaOperator.ASSIGN;
    this.parsed.rightSide = this.parseNextWith(JavaStatementParser);
  }

  @Match(';')
  @Match(',')
  protected onEnd (): void {
    this.stop();
  }
}
