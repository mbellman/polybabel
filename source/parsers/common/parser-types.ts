import { Callback } from '../../system/types';

export type Matcher = [string | RegExp | (RegExp | string)[], Callback];

export interface INumberParser {
  readonly numbers: Matcher[];
}

export interface ISymbolParser {
  readonly symbols: Matcher[];
}

export interface IWordParser {
  readonly words: Matcher[];
}
