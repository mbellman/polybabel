#!/usr/bin/env node

import assert from './assert';
import Logger from './Logger';
import parse from './parsers/parse';
import tokenize from './tokenizer/tokenize';
import { getFlags, IFlags } from './flags';
import { IConfiguration, resolveConfiguration } from './configuration';
import { Language } from './constants';
import { resolveFilesDeep, getFileContents } from './file';
import { ISyntaxTree } from 'parsers/common/syntax';

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
    const syntaxTree: ISyntaxTree = parse(tokens, language);

    console.log('Syntax tree for: ', file);
    console.log(syntaxTree);
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

  console.log(`Compiled in ${Date.now() - startTime} ms!`);
}

main(process.argv);
