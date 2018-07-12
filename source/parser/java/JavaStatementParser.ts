import AbstractParser from '../common/AbstractParser';
import JavaAnnotationParser from './JavaAnnotationParser';
import JavaAssertionParser from './statement-parsers/JavaAssertionParser';
import JavaClassParser from './JavaClassParser';
import JavaDoWhileLoopParser from './statement-parsers/JavaDoWhileLoopParser';
import JavaForLoopParser from './statement-parsers/JavaForLoopParser';
import JavaFunctionCallParser from './statement-parsers/JavaFunctionCallParser';
import JavaIfElseParser from './statement-parsers/JavaIfElseParser';
import JavaInstantiationParser from './statement-parsers/JavaInstantiationParser';
import JavaInstructionParser from './statement-parsers/JavaInstructionParser';
import JavaLambdaExpressionParser from './statement-parsers/JavaLambdaExpressionParser';
import JavaLiteralParser from './statement-parsers/JavaLiteralParser';
import JavaOperatorParser from './JavaOperatorParser';
import JavaPropertyChainParser from './statement-parsers/JavaPropertyChainParser';
import JavaReferenceParser from './statement-parsers/JavaReferenceParser';
import JavaSwitchParser from './statement-parsers/JavaSwitchParser';
import JavaTryCatchParser from './statement-parsers/JavaTryCatchParser';
import JavaTypeParser from './JavaTypeParser';
import JavaVariableDeclarationParser from './statement-parsers/JavaVariableDeclarationParser';
import JavaWhileLoopParser from './statement-parsers/JavaWhileLoopParser';
import { Constructor, Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { JavaUtils } from './java-utils';
import { Match } from '../common/parser-decorators';
import { TokenMatch } from '../common/parser-types';
import { TokenUtils } from '../../tokenizer/token-utils';

/**
 * A 3-tuple which contains a token match, a parser class
 * to be used to parse an incoming statement if the first
 * token of the statement satisfies the match, and a boolean
 * indicating whether the statement is self-terminating and
 * should stop immediately after being parsed.
 *
 * @internal
 */
type StatementMatcher = [ TokenMatch, Constructor<AbstractParser>, boolean ];

/**
 * Parses block-level statements. Stops when the following
 * tokens are encountered:
 *
 * ; : , ] } )
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
   * a reference if the reference matcher came first. Some
   * consideration is also given to the relative frequency
   * of statement types, and speeding up checks for more
   * common ones by including them earlier in the list
   * where priority does not cause conflicts.
   *
   * @see onStatement()
   *
   * A getter is used to circumvent circular dependency
   * issues with CommonJS; returning the list in a method
   * allows the parser classes time to become defined.
   */
  private static get StatementMatchers (): StatementMatcher[] {
    return [
      [ JavaUtils.isInstruction, JavaInstructionParser, false ],
      [ JavaConstants.Keyword.ASSERT, JavaAssertionParser, true ],
      [ JavaUtils.isLiteral, JavaLiteralParser, false ],
      [ JavaUtils.isLambdaExpression, JavaLambdaExpressionParser, false ],
      [ JavaUtils.isReference, JavaReferenceParser, false ],
      [ JavaUtils.isFunctionCall, JavaFunctionCallParser, false ],
      [ JavaConstants.Keyword.NEW, JavaInstantiationParser, false ],
      [ JavaConstants.Keyword.CLASS, JavaClassParser, true ],
      [ JavaUtils.isType, JavaVariableDeclarationParser, false ],
      [ JavaConstants.Keyword.IF, JavaIfElseParser, true ],
      [ JavaConstants.Keyword.FOR, JavaForLoopParser, true ],
      [ JavaConstants.Keyword.WHILE, JavaWhileLoopParser, true ],
      [ JavaConstants.Keyword.DO, JavaDoWhileLoopParser, false ],
      [ JavaConstants.Keyword.SWITCH, JavaSwitchParser, true ],
      [ JavaConstants.Keyword.TRY, JavaTryCatchParser, true ],
      [ '@', JavaAnnotationParser, true ]
    ];
  }

  @Implements protected getDefault (): JavaSyntax.IJavaStatement {
    return {
      node: JavaSyntax.JavaSyntaxNode.STATEMENT,
      leftSide: null
    };
  }

  @Override protected onFirstToken (): void {
    for (const [ tokenMatch, Parser, isSelfTerminating ] of JavaStatementParser.StatementMatchers) {
      if (this.currentTokenMatches(tokenMatch)) {
        this.parsed.leftSide = this.parseNextWith(Parser);

        if (isSelfTerminating) {
          this.stop();
        }

        return;
      }
    }
  }

  @Match('(')
  protected onOpenParenthesis (): void {
    this.assert(this.parsed.leftSide === null);

    const isCast = JavaUtils.isCast(this.currentToken);

    this.next();

    if (isCast) {
      this.parseCastedStatement();
    } else {
      this.parseParentheticalStatement();
    }
  }

  /**
   * Handles a . or [ token as an 'operator' defining a continuing
   * property chain on an already-parsed left-side statement. Only
   * certain statement types allow appending property chains.
   *
   * @see canAppendPropertyChain()
   */
  @Match('.')
  @Match('[')
  protected onContinuingPropertyChain (): void {
    this.assert(this.canAppendPropertyChain());

    const propertyChain = this.parseNextWith(JavaPropertyChainParser);

    propertyChain.properties.unshift(this.parsed.leftSide as JavaSyntax.JavaProperty);

    this.parsed.leftSide = propertyChain;
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
   *  Namespace.Utils.DataType dataType = ...;
   */
  @Match(JavaUtils.isPropertyChain)
  protected onPropertyChain (): void {
    this.assert(this.parsed.leftSide === null);

    const propertyChain = this.parseNextWith(JavaPropertyChainParser);
    const lastProperty = propertyChain.properties.slice(-1).pop();
    const isNamespacedType = lastProperty.node === JavaSyntax.JavaSyntaxNode.TYPE;

    if (isNamespacedType) {
      // If the last property in the chain is a type, we need
      // to handle this statement as a namespaced-type variable
      // declaration. JavaPropertyChainParser already asserts
      // that all previous properties are strings when the last
      // property is a type, so we can safely combine the string
      // properties and the type name to define the type's full
      // namespace chain.
      const { namespaceChain, genericTypes, arrayDimensions } = lastProperty as JavaSyntax.IJavaType;
      const referenceProperties = propertyChain.properties.slice(0, -1) as JavaSyntax.IJavaReference[];
      const namespaces = referenceProperties.map(({ name }) => name);
      const typeName = namespaceChain[0];

      // Variable name must be a word! Normally this would be
      // asserted by JavaVariableDeclarationParser, but we have
      // to assert it here due to the circumstances.
      this.assertCurrentTokenMatch(TokenUtils.isWord);

      const type: JavaSyntax.IJavaType = {
        node: JavaSyntax.JavaSyntaxNode.TYPE,
        namespaceChain: [ ...namespaces, typeName ],
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

  @Match(JavaUtils.isOperator)
  protected onOperator (): void {
    const { leftSide } = this.parsed;

    this.assert(
      !!leftSide
        // If we've already parsed a left side, ensure
        // that it isn't a lambda expression, since they
        // aren't operable
        ? leftSide.node !== JavaSyntax.JavaSyntaxNode.LAMBDA_EXPRESSION
        // If we haven't parsed a left side yet, ensure
        // that this operator is only !, +, -, or ~, which
        // represent the only valid operator tokens for
        // an absent left-side statement
        : /[!+~-]/.test(this.currentToken.value)
    );

    if (this.currentTokenMatches(JavaUtils.isTernary)) {
      // Ternary operations are distinct from normal operations
      // since they have three operands, and also represent one
      // of two valid cases for using a : operator in a statement
      // (the other being in assertions), so we handle them separately
      this.parseTernary();
    } else {
      // Handle as a normal left-side/right-side operation
      this.parsed.operator = this.parseNextWith(JavaOperatorParser);
      this.parsed.rightSide = this.parseNextWith(JavaStatementParser);

      this.assert(
        this.hasParsedSide(),
        'Invalid operator placement'
      );
    }
  }

  @Match(';')
  @Match(':')
  @Match(',')
  @Match(']')
  @Match('}')
  @Match(')')
  protected onEnd (): void {
    this.stop();
  }

  /**
   * Determines whether the current left-side statement can
   * be appended with a property chain. Used to assert that
   * a property chain is allowed when encountering a . or [
   * token after parsing the left side.
   *
   * @see onContinuingPropertyChain()
   */
  private canAppendPropertyChain (): boolean {
    const { leftSide } = this.parsed;

    if (!leftSide) {
      return false;
    }

    switch (leftSide.node) {
      case JavaSyntax.JavaSyntaxNode.STATEMENT:
        return (leftSide as JavaSyntax.IJavaStatement).isParenthetical;
      case JavaSyntax.JavaSyntaxNode.FUNCTION_CALL:
        return true;
      case JavaSyntax.JavaSyntaxNode.INSTANTIATION:
        const { anonymousObjectBody, arrayAllocationSize, arrayLiteral } = leftSide as JavaSyntax.IJavaInstantiation;

        return (
          !anonymousObjectBody &&
          !arrayAllocationSize &&
          !arrayLiteral
        );
      case JavaSyntax.JavaSyntaxNode.LITERAL:
        const { type } = leftSide as JavaSyntax.IJavaLiteral;

        return type === JavaSyntax.JavaLiteralType.STRING;
    }

    return false;
  }

  private hasParsedSide (): boolean {
    return (
      !!this.parsed.leftSide ||
      !!this.parsed.rightSide &&
      !!this.parsed.rightSide.leftSide
    );
  }

  /**
   * Parses statements beginning with a cast operation.
   * The portion to the right of the cast is parsed as
   * a child statement and assigned to this statement's
   * left-side.
   *
   * A separate 'JavaCastParser' is omitted because casted
   * statements are simply types wrapped in parentheses
   * followed by a normal statement.
   */
  private parseCastedStatement (): void {
    this.parsed.cast = this.parseNextWith(JavaTypeParser);

    this.eat(')');

    this.parsed.leftSide = this.parseNextWith(JavaStatementParser);
  }

  /**
   * Parses parenthetical statements, assigning the parsed
   * result to this statement's left-side.
   *
   * A separate 'JavaParentheticalParser' is omitted because
   * a parenthetical statement is still just a statement.
   */
  private parseParentheticalStatement (): void {
    const statement = this.parseNextWith(JavaStatementParser);

    this.eat(')');

    statement.isParenthetical = true;

    this.parsed.leftSide = statement;
  }

  /**
   * Parses a ternary statement after encountering a special ?
   * operator, using the existing left-side statement as the
   * condition operand, and reassigning the resulting ternary
   * back onto the statement's left side.
   *
   * A separate 'JavaTernaryParser' is omitted because, while a
   * ternary would more intuitively be parsed from the beginning
   * of the condition statement, we can't determine that we've
   * encountered a ternary operation until after the condition
   * statement is parsed and the token stream comes upon the
   * ternary's ? operator.
   */
  private parseTernary (): void {
    this.eat('?');

    // Make a shallow copy of the current parsed statement
    // to represent the ternary condition. If we didn't do
    // this, assigning the condition to 'this.parsed' and
    // assigning the whole ternary back to the left side of
    // the statement at the end would referentially update
    // the condition's left side to the ternary, resulting
    // in a circular reference and infinite recursion during
    // translation. A shallow copy suffices since we don't
    // change any deeper properties.
    const condition = Object.assign({}, this.parsed);
    const left = this.parseNextWith(JavaStatementParser);

    this.eat(':');

    const right = this.parseNextWith(JavaStatementParser);

    const ternaryStatement: JavaSyntax.IJavaTernary = {
      node: JavaSyntax.JavaSyntaxNode.TERNARY,
      condition,
      left,
      right
    };

    this.parsed.leftSide = ternaryStatement;
  }
}
