import AbstractParser from './AbstractParser';
import { ISyntaxNode, ISyntaxTree } from './syntax';

export default abstract class AbstractBlockParser<P extends ISyntaxTree | ISyntaxNode> extends AbstractParser<P> {
  protected blockLevel: number = 0;

  protected onBlockEnter (): void {
    this.blockLevel++;
  }

  protected onBlockExit (): void {
    if (--this.blockLevel === 0) {
      this.finish();
    }
  }
}
