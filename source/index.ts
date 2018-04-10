#!/usr/bin/env node

import assert from './system/assert';
import Logger from './system/Logger';
import parse from './parsers/parse';
import tokenize from './tokenizer/tokenize';
import { getFileContents, resolveFilesDeep } from './system/file';
import { getFlags, IFlags } from './system/flags';
import { IConfiguration, resolveConfiguration } from './system/configuration';
import { ISyntaxTree } from 'parsers/common/syntax';
import { Language } from './system/constants';

/**
 * @internal
 */
function getLanguageByExtension (extension: string): Language {
  switch (extension) {
    case 'java':
      return Language.JAVA;
    default:
      throw new Error(`Extension '.${extension}' not currently supported!`);
  }
}

/**
 * @internal
 */
async function processFiles (directory: string, files: string[]): Promise<void> {
  for (const file of files) {
    const extension = file.split('.').pop();
    const language = getLanguageByExtension(extension);
    const fileContents = await getFileContents(`${process.cwd()}/${directory}/${file}`);
    const tokens = tokenize(fileContents);

    try {
      const syntaxTree: ISyntaxTree = parse(tokens, language);
    } catch (e) {
      Logger.error(`[${file}] | ${e.message}`);
    }
  }
}

/**
 * Polybabel entry point.
 */
async function main (args: string[]) {
  const startTime = Date.now();
  const flags = getFlags(args);

  try {
    const { inputFolderName } = await resolveConfiguration(flags);
    const inputFiles = await resolveFilesDeep(inputFolderName);

    await processFiles(inputFolderName, inputFiles);
  } catch (e) {
    Logger.warn('Failed to compile:');
    Logger.error(e.toString());
  }

  Logger.log(`Compiled in ${Date.now() - startTime} ms!`);
}

main(process.argv);
