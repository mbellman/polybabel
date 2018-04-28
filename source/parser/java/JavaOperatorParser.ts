import AbstractParser from '../common/AbstractParser';
import { IHashMap, Implements, Override } from 'trampoline-framework';
import { IToken } from 'tokenizer/types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';
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
 * Parses operators. Stops after parsing if the process
 * advanced the token stream to a non-operator token,
 * and finishes otherwise.
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
 *  <, <<, <=
 *  >, >>, >>>, >=
 *  !, !=
 *  |, ||
 *  &, &&
 *  ?:
 *  ^
 *  ~
 *  instanceof
 */
export default class JavaOperatorParser extends AbstractParser<JavaSyntax.IJavaOperator> {
  /**
   * A map of initial operators to OperatorMatchers. Used
   * to help determine what operator a specific operator
   * token sequence corresponds to.
   */
  private static OperatorMatcherMap: IHashMap<OperatorMatcher[]> = {
    [EQUAL]: [
      [ [ EQUAL ], JavaSyntax.JavaOperator.EQUAL_TO ],
      [ [ /./ ], JavaSyntax.JavaOperator.ASSIGN ]
    ],
    [PLUS]: [
      [ [ PLUS ], JavaSyntax.JavaOperator.INCREMENT ],
      [ [ EQUAL ], JavaSyntax.JavaOperator.ADD_ASSIGN ],
      [ [ /./ ], JavaSyntax.JavaOperator.ADD ]
    ],
    [MINUS]: [
      [ [ MINUS ], JavaSyntax.JavaOperator.DECREMENT ],
      [ [ EQUAL ], JavaSyntax.JavaOperator.SUBTRACT_ASSIGN ],
      [ [ /./ ], JavaSyntax.JavaOperator.SUBTRACT ]
    ],
    [STAR]: [
      [ [ EQUAL ], JavaSyntax.JavaOperator.MULTIPLY_ASSIGN ],
      [ [ /./ ], JavaSyntax.JavaOperator.MULTIPLY ]
    ],
    [SLASH]: [
      [ [ EQUAL ], JavaSyntax.JavaOperator.DIVIDE_ASSIGN ],
      [ [ /./ ], JavaSyntax.JavaOperator.DIVIDE ]
    ],
    [EXCLAMATION]: [
      [ [ EQUAL ], JavaSyntax.JavaOperator.NOT_EQUAL_TO ],
      [ [ /./ ], JavaSyntax.JavaOperator.NEGATE ]
    ],
    [QUESTION]: [
      [ [ COLON ], JavaSyntax.JavaOperator.ELVIS ]
    ],
    [PERCENT]: [
      [ [ EQUAL ], JavaSyntax.JavaOperator.REMAINDER_ASSIGN ],
      [ [ /./ ], JavaSyntax.JavaOperator.REMAINDER ]
    ],
    [LESS_THAN]: [
      [ [ LESS_THAN ], JavaSyntax.JavaOperator.SIGNED_LEFT_SHIFT ],
      [ [ EQUAL ], JavaSyntax.JavaOperator.LESS_THAN_OR_EQUAL_TO ],
      [ [ /./ ], JavaSyntax.JavaOperator.LESS_THAN ]
    ],
    [GREATER_THAN]: [
      [ [ EQUAL ], JavaSyntax.JavaOperator.GREATER_THAN_OR_EQUAL_TO ],
      [ [ GREATER_THAN, GREATER_THAN ], JavaSyntax.JavaOperator.UNSIGNED_RIGHT_SHIFT ],
      [ [ GREATER_THAN ], JavaSyntax.JavaOperator.SIGNED_RIGHT_SHIFT ],
      [ [ /./ ], JavaSyntax.JavaOperator.GREATER_THAN ]
    ],
    [PIPE]: [
      [ [ PIPE], JavaSyntax.JavaOperator.CONDITIONAL_OR ],
      [ [ /./ ], JavaSyntax.JavaOperator.BITWISE_INCLUSIVE_OR ]
    ],
    [AND]: [
      [ [ AND ], JavaSyntax.JavaOperator.CONDITIONAL_AND ],
      [ [ /./ ], JavaSyntax.JavaOperator.BITWISE_AND ]
    ],
    [CARET]: [
      [ [ /./ ], JavaSyntax.JavaOperator.BITWISE_EXCLUSIVE_OR ]
    ],
    [TILDE]: [
      [ [ /./ ], JavaSyntax.JavaOperator.BITWISE_COMPLEMENT ]
    ],
    [INSTANCEOF]: [
      [ [ /./ ], JavaSyntax.JavaOperator.INSTANCEOF ]
    ]
  };

  @Implements protected getDefault (): JavaSyntax.IJavaOperator {
    return {
      node: JavaSyntax.JavaSyntaxNode.OPERATOR,
      operation: null
    };
  }

  @Override protected onFirstToken (): void {
    const operator = this.getJavaOperator();

    if (operator === null) {
      this.throw('Invalid operator');
    }

    this.parsed.operation = operator;

    if (this.currentTokenMatches(JavaConstants.Operators)) {
      this.finish();
    } else {
      this.stop();
    }
  }

  private getJavaOperator (): JavaSyntax.JavaOperator {
    const possibleOperatorMatchers = JavaOperatorParser.OperatorMatcherMap[this.currentToken.value] || [];

    for (const [ tokenMatches, operator ] of possibleOperatorMatchers) {
      for (let i = 0; i < tokenMatches.length; i++) {
        // Step through each token match of this operator matcher
        let localToken = this.currentToken.nextToken;

        if (ParserUtils.tokenMatches(localToken, tokenMatches[i])) {
          if (i === tokenMatches.length - 1) {
            // Matched each token to the end of the
            // operator matcher! This is our operator.
            this.currentToken = localToken;

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
}
