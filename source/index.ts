#!/usr/bin/env node

import assert from './system/assert';
import chalk from 'chalk';
import parse from './parsers/parse';
import tokenize from './tokenizer/tokenize';
import { getFileContents, resolveFilesDeep } from './system/file';
import { getFlags, IFlags } from './system/flags';
import { IConfiguration, resolveConfiguration } from './system/configuration';
import { ISyntaxTree } from 'parsers/common/syntax-types';
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
  let totalFailedFiles = 0;

  for (const file of files) {
    const extension = file.split('.').pop();

    try {
      const language = getLanguageByExtension(extension);
      const fileContents = await getFileContents(`${process.cwd()}/${directory}/${file}`);
      const tokens = tokenize(fileContents);
      const syntaxTree: ISyntaxTree<any> = parse(tokens, language);
    } catch (e) {
      const [ message, lineContent ] = e.message.split(' | ');

      console.log(chalk.bgRed.bold(` ${file} `));
      console.log(' ', chalk.red(message), chalk.blue(lineContent), '\n');

      ++totalFailedFiles;
    }
  }

  assert(
    totalFailedFiles === 0,
    chalk.yellow('Failed to compile!')
  );
}

/**
 * Polybabel entry point.
 */
async function main (args: string[]) {
  console.log(chalk.green(`\nStarting...\n`));

  const startTime = Date.now();
  const flags = getFlags(args);
  const { inputFolderName } = await resolveConfiguration(flags);
  const inputFiles = await resolveFilesDeep(inputFolderName);

  await processFiles(inputFolderName, inputFiles);

  console.log(`Compiled in ${Date.now() - startTime} ms!`);
}

main(process.argv);
