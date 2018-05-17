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
 * following an initial operator, and 2) the operator
 * denoted by a token sequence matching the pattern.
 */
type OperatorMatcher = [ TokenMatch[], JavaSyntax.JavaOperator ];

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
      [ [ EQUAL ], JavaSyntax.JavaOperator.EQUAL_TO ],
      [ [ /.*/ ], JavaSyntax.JavaOperator.ASSIGN ]
    ],
    [PLUS]: [
      [ [ PLUS ], JavaSyntax.JavaOperator.INCREMENT ],
      [ [ /.*/ ], JavaSyntax.JavaOperator.ADD ]
    ],
    [MINUS]: [
      [ [ MINUS ], JavaSyntax.JavaOperator.DECREMENT ],
      [ [ /.*/ ], JavaSyntax.JavaOperator.SUBTRACT ]
    ],
    [STAR]: [
      [ [ /.*/ ], JavaSyntax.JavaOperator.MULTIPLY ]
    ],
    [SLASH]: [
      [ [ /.*/ ], JavaSyntax.JavaOperator.DIVIDE ]
    ],
    [EXCLAMATION]: [
      [ [ EQUAL ], JavaSyntax.JavaOperator.NOT_EQUAL_TO ],
      [ [ EXCLAMATION ], JavaSyntax.JavaOperator.DOUBLE_NOT ],
      [ [ /.*/ ], JavaSyntax.JavaOperator.NEGATE ]
    ],
    [QUESTION]: [
      [ [ COLON ], JavaSyntax.JavaOperator.ELVIS ]
    ],
    [PERCENT]: [
      [ [ /.*/ ], JavaSyntax.JavaOperator.REMAINDER ]
    ],
    [LESS_THAN]: [
      [ [ LESS_THAN ], JavaSyntax.JavaOperator.SIGNED_LEFT_SHIFT ],
      [ [ EQUAL ], JavaSyntax.JavaOperator.LESS_THAN_OR_EQUAL_TO ],
      [ [ /.*/ ], JavaSyntax.JavaOperator.LESS_THAN ]
    ],
    [GREATER_THAN]: [
      [ [ EQUAL ], JavaSyntax.JavaOperator.GREATER_THAN_OR_EQUAL_TO ],
      [ [ GREATER_THAN, GREATER_THAN ], JavaSyntax.JavaOperator.UNSIGNED_RIGHT_SHIFT ],
      [ [ GREATER_THAN ], JavaSyntax.JavaOperator.SIGNED_RIGHT_SHIFT ],
      [ [ /.*/ ], JavaSyntax.JavaOperator.GREATER_THAN ]
    ],
    [PIPE]: [
      [ [ PIPE], JavaSyntax.JavaOperator.CONDITIONAL_OR ],
      [ [ /.*/ ], JavaSyntax.JavaOperator.BITWISE_INCLUSIVE_OR ]
    ],
    [AND]: [
      [ [ AND ], JavaSyntax.JavaOperator.CONDITIONAL_AND ],
      [ [ /.*/ ], JavaSyntax.JavaOperator.BITWISE_AND ]
    ],
    [CARET]: [
      [ [ /.*/ ], JavaSyntax.JavaOperator.BITWISE_EXCLUSIVE_OR ]
    ],
    [TILDE]: [
      [ [ /.*/ ], JavaSyntax.JavaOperator.BITWISE_COMPLEMENT ]
    ],
    [INSTANCEOF]: [
      [ [ /.*/ ], JavaSyntax.JavaOperator.INSTANCEOF ]
    ]
  };

  /**
   * A list of operators after which an additional = operator
   * can be provided to designated a shorthand assignment.
   */
  private static readonly ValidShorthandAssignmentOperators: JavaSyntax.JavaOperator[] = [
    JavaSyntax.JavaOperator.ADD,
    JavaSyntax.JavaOperator.SUBTRACT,
    JavaSyntax.JavaOperator.MULTIPLY,
    JavaSyntax.JavaOperator.DIVIDE,
    JavaSyntax.JavaOperator.REMAINDER,
    JavaSyntax.JavaOperator.BITWISE_INCLUSIVE_OR,
    JavaSyntax.JavaOperator.BITWISE_AND,
    JavaSyntax.JavaOperator.BITWISE_EXCLUSIVE_OR,
    JavaSyntax.JavaOperator.BITWISE_COMPLEMENT,
    JavaSyntax.JavaOperator.SIGNED_LEFT_SHIFT,
    JavaSyntax.JavaOperator.SIGNED_RIGHT_SHIFT,
    JavaSyntax.JavaOperator.UNSIGNED_RIGHT_SHIFT
  ];

  /**
   * Determines whether a parsed operator corresponds to an
   * operator matching only the initial operator of a given
   * matcher, e.g. the initial operator followed by any token
   * not explicitly matched. Set after parsing the operator
   * token stream in parseJavaOperator().
   */
  private isDefaultOperator: boolean = false;

  @Implements protected getDefault (): JavaSyntax.IJavaOperator {
    return {
      node: JavaSyntax.JavaSyntaxNode.OPERATOR,
      operation: null
    };
  }

  @Override protected onFirstToken (): void {
    const operator = this.parseJavaOperator();

    if (operator === null) {
      this.throw('Invalid operator');
    }

    const isShorthandAssignment = this.isShorthandAssignment(operator);

    this.parsed.operation = operator;
    this.parsed.isShorthandAssignment = isShorthandAssignment;

    if (isShorthandAssignment) {
      this.skipShorthandAssignmentToken();
    }

    if (!this.isDefaultOperator) {
      this.next();
    }

    this.stop();
  }

  private isShorthandAssignment (operator: JavaSyntax.JavaOperator): boolean {
    const possibleEqualToken = this.isDefaultOperator
      ? this.currentToken
      : this.nextToken;

    return (
      possibleEqualToken.value === JavaConstants.Operator.EQUAL &&
      JavaOperatorParser.ValidShorthandAssignmentOperators.indexOf(operator) > -1
    );
  }

  private parseJavaOperator (): JavaSyntax.JavaOperator {
    const possibleOperatorMatchers = JavaOperatorParser.OperatorMatcherMap[this.currentToken.value] || [];

    for (const [ tokenMatches, operator ] of possibleOperatorMatchers) {
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

            return operator;
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
