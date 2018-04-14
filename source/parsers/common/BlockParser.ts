import AbstractParser from './AbstractParser';

export default abstract class BlockParser extends AbstractParser {
  private _blockLevel: number = 0;

  public get blockLevel (): number {
    return this._blockLevel;
  }

  public onBlockEnter (): void {
    this._blockLevel++;
  }

  public onBlockExit (): void {
    if (--this._blockLevel === 0) {
      this.finish();
    }
  }
}
