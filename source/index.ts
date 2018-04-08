#!/usr/bin/env node

import assert from './assert';
import tokenizer from './tokenizer/tokenize';
import { getFlags, IFlags } from './flags';
import { IConfiguration, resolveConfiguration } from './configuration';
import { resolveFilesDeep } from './file';

async function main (args: string[]) {
  const flags = getFlags(args);

  try {
    const { inputFolderName } = await resolveConfiguration(flags);
    const inputFiles = await resolveFilesDeep(inputFolderName);

    for (const inputFile of inputFiles) {
      const extension = inputFile.split('.').pop();
    }

    console.log(inputFiles);
  } catch (e) {
    console.error(e);
  }
}

main(process.argv);
