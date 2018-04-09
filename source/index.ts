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
    const syntaxTree: ISyntaxTree = parse(file, tokens, language);

    console.log(`\nSyntax tree for ${file}:`);
    console.log(syntaxTree);
  }
}

/**
 * Polybabel entry point.
 */
async function main (args: string[]) {
  const logger = new Logger();
  const startTime = Date.now();
  const flags = getFlags(args);

  try {
    const { inputFolderName } = await resolveConfiguration(flags);
    const inputFiles = await resolveFilesDeep(inputFolderName);

    await processFiles(inputFolderName, inputFiles);
  } catch (e) {
    logger.warn('Failed to compile:');
    logger.error(e.toString());
  }

  console.log(`Compiled in ${Date.now() - startTime} ms!`);
}

main(process.argv);
