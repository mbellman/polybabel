import { extendParsers } from '../common/parser-factory';
import { parseBlock } from '../common/parseBlock';

export const parseJavaBlock = extendParsers(parseBlock)({
  name: 'JavaBlockParser',

  words () {
    return [
      ['{', () => this.onBlockEnter],
      ['}', () => this.onBlockExit]
    ];
  }
});
