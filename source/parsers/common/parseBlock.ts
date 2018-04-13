import { createParser } from './parser-factory';
import { ParsedSyntax } from './types';

export const parseBlock = createParser({
  name: 'BlockParser',

  onFirstToken: stream =>
    (stream as any).blockLevel = 0,

  onBlockEnter: stream =>
    (stream as any).blockLevel++,

  onBlockExit: stream => {
    if (--(stream as any).blockLevel === 0) {
      stream.finish();
    }
  }
});
