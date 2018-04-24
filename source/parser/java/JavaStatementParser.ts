import AbstractParser from '../common/AbstractParser';
import JavaFunctionCallParser from './statement-parsers/JavaFunctionCallParser';
import JavaInstantiationParser from './statement-parsers/JavaInstantiationParser';
import JavaLiteralParser from './statement-parsers/JavaLiteralParser';
import JavaPropertyChainParser from './statement-parsers/JavaPropertyChainParser';
import JavaVariableDeclarationParser from './statement-parsers/JavaVariableDeclarationParser';
import { Callback, Implements, Override } from 'trampoline-framework';
import { Constructor } from '../../system/types';
import { JavaSyntax } from './java-syntax';
import { JavaUtils } from './java-utils';
import { Match } from '../common/parser-decorators';
import { TokenPredicate } from '../common/parser-types';
import { TokenUtils } from '../../tokenizer/token-utils';

/**
 * A 2-tuple which contains a token predicate and a parser
 * class to be used to parse an incoming statement if its
 * predicate returns true.
 *
 * @internal
 */
type StatementMatcher = [ TokenPredicate, Constructor<AbstractParser> ];

/**
 * @todo @description
 */
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
      [ JavaUtils.isType, JavaVariableDeclarationParser ]
    ];
  }

  /**
   * Tracks the number of parentheses wrappers around the
   * statement. Increments when an opening parenthesis is
   * encountered, and decrements when a closing parenthesis
   * is encountered.
   */
  private parentheses: number = 0;

  @Implements protected getDefault (): JavaSyntax.IJavaStatement {
    return {
      node: JavaSyntax.JavaSyntaxNode.STATEMENT,
      leftSide: null
    };
  }

  @Match('(')
  protected onOpenParenthesis (): void {
    this.parentheses++;
  }

  @Match(/./)
  protected onLeftSideStatement (): void {
    this.assert(this.parsed.leftSide === null);

    for (const [ tokenPredicate, Parser ] of JavaStatementParser.StatementMatchers) {
      if (tokenPredicate(this.currentToken)) {
        this.parsed.leftSide = this.parseNextWith(Parser);

        return;
      }
    }

    this.halt();
  }

  /**
   * Function call statements must be handled with a fallback
   * for property chaining, since predetermining the statement
   * to be a property chain would be impossible without expensive
   * token lookaheads.
   */
  @Match(JavaUtils.isFunctionCall)
  protected onFunctionCall (): void {
    this.assert(this.parsed.leftSide === null);

    const functionCall = this.parseNextWith(JavaFunctionCallParser);
    const isPropertyChain = this.currentTokenMatches('.');

    if (isPropertyChain) {
      const propertyChain = this.parseNextWith(JavaPropertyChainParser);

      // Retroactively set the function call statement
      // as the first of the property chain
      propertyChain.properties.unshift(functionCall);

      this.parsed.leftSide = propertyChain;
    } else {
      this.parsed.leftSide = functionCall;
    }
  }

  /**
   * Property chain statements must be handled with a fallback
   * for namespaced-type variable declarations, since the two are
   * indistinguishable without expensive token stream lookaheads.
   *
   * Despite the awkward implementation, this solution avoids
   * any unnecessary backtracking.
   *
   * @example
   *
   *  this.factories.itemFactory.createItem();
   *
   *  Namespace.Utils.DataType dataType = ...;
   */
  @Match(JavaUtils.isPropertyChain)
  protected onPropertyChain (): void {
    this.assert(this.parsed.leftSide === null);

    const propertyChain = this.parseNextWith(JavaPropertyChainParser);
    const lastProperty = propertyChain.properties.slice(-1).pop();

    const isNamespacedType = (
      typeof lastProperty !== 'string' &&
      lastProperty.node === JavaSyntax.JavaSyntaxNode.TYPE
    );

    if (isNamespacedType) {
      // If the last property in the chain is a type, we need
      // to handle this statement as a namespaced-type variable
      // declaration. JavaPropertyChainParser already asserts
      // that all previous properties are strings when the last
      // property is a type, so we can safely combine the string
      // properties and the type name to define the type's full
      // namespace chain.
      const { properties } = propertyChain;
      const { namespaceChain, genericTypes, arrayDimensions } = lastProperty as JavaSyntax.IJavaType;
      const stringProperties = properties.slice(0, -1) as string[];
      const typeName = namespaceChain[0];

      // Variable name must be a word! Normally this would be
      // asserted by JavaVariableDeclarationParser, but we have
      // to assert it here due to the circumstances.
      this.assert(TokenUtils.isWord(this.currentToken));

      const type: JavaSyntax.IJavaType = {
        node: JavaSyntax.JavaSyntaxNode.TYPE,
        namespaceChain: [ ...stringProperties, typeName ],
        genericTypes,
        arrayDimensions
      };

      const variableDeclaration: JavaSyntax.IJavaVariableDeclaration = {
        node: JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION,
        type,
        name: this.nextToken.value
      };

      this.parsed.leftSide = variableDeclaration;

      // Skip over the variable name so we don't encounter it
      // again on the next token cycle
      this.next();
    } else {
      // Just a normal property chain!
      this.parsed.leftSide = propertyChain;
    }
  }

  @Match('=')
  protected onAssignment (): void {
    this.assert(this.parsed.leftSide !== null);
    this.next();

    this.parsed.operator = JavaSyntax.JavaOperator.ASSIGN;
    this.parsed.rightSide = this.parseNextWith(JavaStatementParser);
  }

  @Match(')')
  protected onCloseParenthesis (): void {
    if (this.parentheses > 0 && --this.parentheses === 0) {
      // If the statement was wrapped in parentheses, we
      // finish as soon as the final parentheses is closed
      this.finish();
    } else {
      // If the statement was not wrapped in parentheses,
      // stop here and let the parent parser determine
      // what to do with the ) token
      this.stop();
    }
  }

  @Match(';')
  @Match(',')
  @Match(']')
  @Match('}')
  protected onEnd (): void {
    this.assert(this.parentheses === 0);
    this.stop();
  }
}
