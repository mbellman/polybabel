import AbstractParser from '../../common/AbstractParser';
import JavaBlockParser from '../JavaBlockParser';
import JavaReferenceParser from './JavaReferenceParser';
import JavaStatementParser from '../JavaStatementParser';
import JavaVariableDeclarationParser from './JavaVariableDeclarationParser';
import { Allow, Eat } from '../../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../java-syntax';
import { JavaUtils } from '../java-utils';
import { TokenUtils } from '../../../tokenizer/token-utils';

export default class JavaLambdaExpressionParser extends AbstractParser<JavaSyntax.IJavaLambdaExpression> {
  @Implements protected getDefault (): JavaSyntax.IJavaLambdaExpression {
    return {
      node: JavaSyntax.JavaSyntaxNode.LAMBDA_EXPRESSION,
      parameters: []
    };
  }

  @Allow(TokenUtils.isWord)
  protected onSingleParameterLambdaExpression (): void {
    const argument = this.parseNextWith(JavaReferenceParser);

    this.parsed.parameters.push(argument);
  }

  @Allow('(')
  protected onMultiParameterLambdaExpression (): void {
    this.assert(this.parsed.parameters.length === 0);
    this.next();

    if (this.currentTokenMatches(')')) {
      this.next();

      return;
    }

    while (!this.isEOF()) {
      const isTypedParameter = this.currentTokenMatches(JavaUtils.isType);

      const parameter = isTypedParameter
        ? this.parseNextWith(JavaVariableDeclarationParser)
        : this.parseNextWith(JavaReferenceParser);

      this.parsed.parameters.push(parameter);

      if (this.currentTokenMatches(')')) {
        this.next();

        break;
      } else {
        this.eat(',');
      }
    }
  }

  @Eat('-')
  protected onArrow (): void {
    this.next();
  }

  @Eat('>')
  protected onArrowHead (): void {
    this.next();
  }

  @Allow('{')
  protected onLambdaExpressionBlock (): void {
    this.parsed.block = this.parseNextWith(JavaBlockParser);

    this.stop();
  }

  @Allow(/./)
  protected onLambdaExpressionStatement (): void {
    this.parsed.statement = this.parseNextWith(JavaStatementParser);

    this.stop();
  }
}
