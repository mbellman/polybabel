import AbstractParser from '../common/AbstractParser';
import JavaFunctionCallParser from './JavaFunctionCallParser';
import JavaInstantiationParser from './JavaInstantiationParser';
import JavaLiteralParser from './JavaLiteralParser';
import JavaPropertyChainParser from './JavaPropertyChainParser';
import JavaVariableDeclarationParser from './JavaVariableDeclarationParser';
import { Constructor } from 'system/types';
import { Implements, Callback } from 'trampoline-framework';
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
   * allows the dependencies time to become defined.
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
