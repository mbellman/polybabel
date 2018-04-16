import AbstractParser from '../common/AbstractParser';
import { Implements, Override } from 'trampoline-framework';
import { isClauseKeyword } from './java-utils';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Parser } from '../common/parser-decorators';

@Parser({
  type: JavaClauseParser,
  words: [
    [JavaConstants.ReservedWords, 'stop'],
    [/./, 'onNextClauseValue']
  ],
  symbols: [
    [',', 'next'],
    [/[{;]/, 'stop']
  ]
})
export default class JavaClauseParser extends AbstractParser<JavaSyntax.IJavaClause> {
  @Implements public getDefault (): JavaSyntax.IJavaClause {
    return {
      node: JavaSyntax.JavaSyntaxNode.CLAUSE,
      values: []
    };
  }

  @Override public onFirstToken (): void {
    this.assert(isClauseKeyword(this.currentToken.value));
    this.next();
  }

  public onNextClauseValue (): void {
    this.parsed.values.push(this.currentToken.value);
  }
}
