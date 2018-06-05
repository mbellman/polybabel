import AbstractParser from '../common/AbstractParser';
import { IHashMap, Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { ParserUtils } from '../common/parser-utils';
import { TokenMatch } from '../common/parser-types';

const {
  EQUAL,
  PLUS,
  MINUS,
  STAR,
  SLASH,
  PERCENT,
  EXCLAMATION,
  QUESTION,
  COLON,
  LESS_THAN,
  GREATER_THAN,
  PIPE,
  AND,
  CARET,
  TILDE,
  INSTANCEOF
} = JavaConstants.Operator;

/**
 * A 2-tuple containing 1) an array of token matches
 * representing the sequence of additional operators
 * following an initial operator, and 2) the operation
 * denoted by a token sequence matching the pattern.
 */
type OperatorMatcher = [ TokenMatch[], JavaSyntax.JavaOperation ];

/**
 * Parses operators. Stops after parsing and stepping out
 * of an operator's token sequence.
 *
 * @example
 *
 *  =
 *  ==
 *  +, +=
 *  -, -=
 *  *, *=
 *  /, /=
 *  %, %=
 *  <, <<, <=, <<=
 *  >, >>, >>>, >=, >>=, >>>=
 *  !, !=
 *  |, ||, !=
 *  &, &&, &=
 *  ?:
 *  ^, ^=
 *  ~, ~=
 *  instanceof
 */
export default class JavaOperatorParser extends AbstractParser<JavaSyntax.IJavaOperator> {
  /**
   * A map of initial operators to OperatorMatchers. Used
   * to help determine what operator a specific operator
   * token sequence corresponds to.
   */
  private static readonly OperatorMatcherMap: IHashMap<OperatorMatcher[]> = {
    [EQUAL]: [
      [ [ EQUAL ], JavaSyntax.JavaOperation.EQUAL_TO ],
      [ [ /.*/ ], JavaSyntax.JavaOperation.ASSIGN ]
    ],
    [PLUS]: [
      [ [ PLUS ], JavaSyntax.JavaOperation.INCREMENT ],
      [ [ /.*/ ], JavaSyntax.JavaOperation.ADD ]
    ],
    [MINUS]: [
      [ [ MINUS ], JavaSyntax.JavaOperation.DECREMENT ],
      [ [ /.*/ ], JavaSyntax.JavaOperation.SUBTRACT ]
    ],
    [STAR]: [
      [ [ /.*/ ], JavaSyntax.JavaOperation.MULTIPLY ]
    ],
    [SLASH]: [
      [ [ /.*/ ], JavaSyntax.JavaOperation.DIVIDE ]
    ],
    [EXCLAMATION]: [
      [ [ EQUAL ], JavaSyntax.JavaOperation.NOT_EQUAL_TO ],
      [ [ EXCLAMATION ], JavaSyntax.JavaOperation.DOUBLE_NOT ],
      [ [ /.*/ ], JavaSyntax.JavaOperation.NEGATE ]
    ],
    [QUESTION]: [
      [ [ COLON ], JavaSyntax.JavaOperation.ELVIS ]
    ],
    [PERCENT]: [
      [ [ /.*/ ], JavaSyntax.JavaOperation.REMAINDER ]
    ],
    [LESS_THAN]: [
      [ [ LESS_THAN ], JavaSyntax.JavaOperation.SIGNED_LEFT_SHIFT ],
      [ [ EQUAL ], JavaSyntax.JavaOperation.LESS_THAN_OR_EQUAL_TO ],
      [ [ /.*/ ], JavaSyntax.JavaOperation.LESS_THAN ]
    ],
    [GREATER_THAN]: [
      [ [ EQUAL ], JavaSyntax.JavaOperation.GREATER_THAN_OR_EQUAL_TO ],
      [ [ GREATER_THAN, GREATER_THAN ], JavaSyntax.JavaOperation.UNSIGNED_RIGHT_SHIFT ],
      [ [ GREATER_THAN ], JavaSyntax.JavaOperation.SIGNED_RIGHT_SHIFT ],
      [ [ /.*/ ], JavaSyntax.JavaOperation.GREATER_THAN ]
    ],
    [PIPE]: [
      [ [ PIPE], JavaSyntax.JavaOperation.CONDITIONAL_OR ],
      [ [ /.*/ ], JavaSyntax.JavaOperation.BITWISE_INCLUSIVE_OR ]
    ],
    [AND]: [
      [ [ AND ], JavaSyntax.JavaOperation.CONDITIONAL_AND ],
      [ [ /.*/ ], JavaSyntax.JavaOperation.BITWISE_AND ]
    ],
    [CARET]: [
      [ [ /.*/ ], JavaSyntax.JavaOperation.BITWISE_EXCLUSIVE_OR ]
    ],
    [TILDE]: [
      [ [ /.*/ ], JavaSyntax.JavaOperation.BITWISE_COMPLEMENT ]
    ],
    [INSTANCEOF]: [
      [ [ /.*/ ], JavaSyntax.JavaOperation.INSTANCEOF ]
    ]
  };

  /**
   * A list of operators after which an additional = operator
   * can be provided to designate a shorthand assignment.
   */
  private static readonly ValidShorthandAssignmentOperations: JavaSyntax.JavaOperation[] = [
    JavaSyntax.JavaOperation.ADD,
    JavaSyntax.JavaOperation.SUBTRACT,
    JavaSyntax.JavaOperation.MULTIPLY,
    JavaSyntax.JavaOperation.DIVIDE,
    JavaSyntax.JavaOperation.REMAINDER,
    JavaSyntax.JavaOperation.BITWISE_INCLUSIVE_OR,
    JavaSyntax.JavaOperation.BITWISE_AND,
    JavaSyntax.JavaOperation.BITWISE_EXCLUSIVE_OR,
    JavaSyntax.JavaOperation.BITWISE_COMPLEMENT,
    JavaSyntax.JavaOperation.SIGNED_LEFT_SHIFT,
    JavaSyntax.JavaOperation.SIGNED_RIGHT_SHIFT,
    JavaSyntax.JavaOperation.UNSIGNED_RIGHT_SHIFT
  ];

  /**
   * Determines whether a parsed operator corresponds to an
   * operator matching only the initial operator of a given
   * matcher, e.g. the initial operator followed by any token
   * not explicitly matched. Set after parsing the operator
   * token stream in parseJavaOperation().
   */
  private isDefaultOperator: boolean = false;

  @Implements protected getDefault (): JavaSyntax.IJavaOperator {
    return {
      node: JavaSyntax.JavaSyntaxNode.OPERATOR,
      operation: null
    };
  }

  @Override protected onFirstToken (): void {
    const operator = this.parseJavaOperation();

    if (operator === null) {
      this.throw('Invalid operator');
    }

    const isShorthandAssignment = this.isShorthandAssignment(operator);

    this.parsed.operation = operator;
    this.parsed.isShorthandAssignment = isShorthandAssignment;

    if (isShorthandAssignment) {
      this.skipShorthandAssignmentToken();
    }

    if (!this.isDefaultOperator && !isShorthandAssignment) {
      this.next();
    }

    this.stop();
  }

  private isShorthandAssignment (operation: JavaSyntax.JavaOperation): boolean {
    const possibleEqualToken = this.isDefaultOperator
      // Default operators will have already skipped over
      // to the token after the operation
      ? this.currentToken
      // Non-default operators will have stopped at the
      // final token in the operator matcher prior to
      // continuing
      : this.nextToken;

    return (
      possibleEqualToken.value === JavaConstants.Operator.EQUAL &&
      JavaOperatorParser.ValidShorthandAssignmentOperations.indexOf(operation) > -1
    );
  }

  private parseJavaOperation (): JavaSyntax.JavaOperation {
    const possibleOperatorMatchers = JavaOperatorParser.OperatorMatcherMap[this.currentToken.value] || [];

    for (const [ tokenMatches, operation ] of possibleOperatorMatchers) {
      let localToken = this.nextToken;

      // Step through each token match of this operator matcher
      for (let i = 0; i < tokenMatches.length; i++) {
        const tokenMatch = tokenMatches[i];
        const isLastTokenMatch = i === tokenMatches.length - 1;

        if (ParserUtils.tokenMatches(localToken, tokenMatch)) {
          if (isLastTokenMatch) {
            // Matched each token to the end of the
            // operator matcher! This is our operator.
            this.currentToken = localToken;
            this.isDefaultOperator = tokenMatch.toString() === '/.*/';

            return operation;
          }

          // Matching so far, but not to the end
          // of the operator matcher yet
          localToken = localToken.nextToken;
        } else {
          // Token stream doesn't match one of the
          // tokens in this operator matcher, so we
          // break and try the next one
          break;
        }
      }
    }

    return null;
  }

  /**
   * Skips past the shorthand assignment = token after determining
   * that we've parsed a shorthand assignment. If this is a default
   * operator, the = token was reached after parsing through an
   * operation up to any unspecified token (in this case =), so we
   * skip to the next token. Otherwise, we parsed up to the final
   * specified token in a specific operator's token chain, and thus
   * the shorthand assignment = token is the next one.
   */
  private skipShorthandAssignmentToken (): void {
    if (this.isDefaultOperator) {
      this.next();
    } else {
      this.eatNext(JavaConstants.Operator.EQUAL);
    }
  }
}
