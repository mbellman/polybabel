import AbstractParser from '../common/AbstractParser';
import JavaForLoopParser from './statement-parsers/JavaForLoopParser';
import JavaFunctionCallParser from './statement-parsers/JavaFunctionCallParser';
import JavaIfElseParser from './statement-parsers/JavaIfElseParser';
import JavaInstantiationParser from './statement-parsers/JavaInstantiationParser';
import JavaInstructionParser from './statement-parsers/JavaInstructionParser';
import JavaLiteralParser from './statement-parsers/JavaLiteralParser';
import JavaOperatorParser from './JavaOperatorParser';
import JavaPropertyChainParser from './statement-parsers/JavaPropertyChainParser';
import JavaReferenceParser from './statement-parsers/JavaReferenceParser';
import JavaSwitchParser from './statement-parsers/JavaSwitchParser';
import JavaVariableDeclarationParser from './statement-parsers/JavaVariableDeclarationParser';
import JavaWhileLoopParser from './statement-parsers/JavaWhileLoopParser';
import { Constructor, Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { JavaUtils } from './java-utils';
import { Match } from '../common/parser-decorators';
import { ParserUtils } from '../common/parser-utils';
import { TokenMatch } from '../common/parser-types';
import { TokenUtils } from '../../tokenizer/token-utils';

/**
 * A 3-tuple which contains a token match, a parser class
 * to be used to parse an incoming statement if the first
 * token of the statement satisfies the match, and a boolean
 * indicating whether the statement is left-side only and
 * should stop immediately after being parsed.
 *
 * @internal
 */
type StatementMatcher = [ TokenMatch, Constructor<AbstractParser>, boolean ];

/**
 * Parses block-level statements. Stops when the following
 * tokens are encountered:
 *
 * ; : , ] }
 *
 * Also stops when a ) token is encountered if the closing
 * parentheses counter decrements to 0.
 */
export default class JavaStatementParser extends AbstractParser<JavaSyntax.IJavaStatement> {
  /**
   * A list of statement matchers to use to test the token
   * at the beginning of each new statement. If an incoming
   * token satisfies the statement matcher's token match,
   * its corresponding parser class is used to parse the
   * statement's left side.
   *
   * The order of the list matters, since later matchers in
   * the list might incorrectly yield false positives over
   * earlier matchers if their placements were switched.
   * E.g., an instruction might be incorrectly parsed as
   * a reference if the reference matcher came first.
   *
   * See: onStatement()
   *
   * A getter is used to circumvent circular dependency
   * issues with CommonJS; returning the list in a method
   * allows the parser classes time to become defined.
   */
  private static get StatementMatchers (): StatementMatcher[] {
    return [
      [ JavaUtils.isInstruction, JavaInstructionParser, true ],
      [ JavaUtils.isLiteral, JavaLiteralParser, false ],
      [ JavaUtils.isReference, JavaReferenceParser, false ],
      [ JavaConstants.Keyword.NEW, JavaInstantiationParser, false ],
      [ JavaUtils.isType, JavaVariableDeclarationParser, false ],
      [ JavaConstants.Keyword.IF, JavaIfElseParser, true ],
      [ JavaConstants.Keyword.FOR, JavaForLoopParser, true ],
      [ JavaConstants.Keyword.WHILE, JavaWhileLoopParser, true ],
      [ JavaConstants.Keyword.SWITCH, JavaSwitchParser, true ]
    ];
  }

  @Implements protected getDefault (): JavaSyntax.IJavaStatement {
    return {
      node: JavaSyntax.JavaSyntaxNode.STATEMENT,
      leftSide: null
    };
  }

  @Override protected onFirstToken (): void {
    if (this.currentTokenMatches('(')) {
      this.parseParentheticalStatement();

      return;
    }

    for (const [ tokenMatch, Parser, isLeftSideOnly ] of JavaStatementParser.StatementMatchers) {
      if (this.currentTokenMatches(tokenMatch)) {
        this.parsed.leftSide = this.parseNextWith(Parser);

        if (isLeftSideOnly) {
          this.stop();
        }

        return;
      }
    }
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
      this.assertCurrentTokenMatch(TokenUtils.isWord);

      const type: JavaSyntax.IJavaType = {
        node: JavaSyntax.JavaSyntaxNode.TYPE,
        namespaceChain: [ ...stringProperties, typeName ],
        genericTypes,
        arrayDimensions
      };

      const variableDeclaration: JavaSyntax.IJavaVariableDeclaration = {
        node: JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION,
        type,
        name: this.currentToken.value
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

  /**
   * @todo Fix issues with double negation (!!)
   */
  @Match(JavaUtils.isOperator)
  protected onOperator (): void {
    if (!this.parsed.leftSide) {
      this.assertCurrentTokenMatch(/[!+-]/);
    }

    this.parsed.operator = this.parseNextWith(JavaOperatorParser);
    this.parsed.rightSide = this.parseNextWith(JavaStatementParser);
  }

  @Match(')')
  protected onCloseParenthesis (): void {
    if (this.parsed.isParenthetical) {
      this.next();
    } else {
      // Let the parent parser decide what to do
      // with the parenthesis
      this.stop();
    }
  }

  @Match(';')
  @Match(':')
  @Match(',')
  @Match(']')
  @Match('}')
  protected onEnd (): void {
    this.stop();
  }

  /**
   * Steps into a statement beginning with ( and parses
   * its left side as a parenthetical statement, stepping
   * out again without finishing in case the left side
   * is the first part of an operation.
   */
  private parseParentheticalStatement (): void {
    this.next(); // '('

    const statement = this.parseNextWith(JavaStatementParser);

    this.assertCurrentTokenMatch(')');
    this.next();

    statement.isParenthetical = true;

    this.parsed.leftSide = statement;
  }
}
