#!/usr/bin/env node

import assert from './system/assert';
import chalk from 'chalk';
import Compiler from './compiler/Compiler';
import parse from './parser/parse';
import tokenize from './tokenizer/tokenize';
import { getFileContents, resolveFilesDeep } from './system/file';
import { getFlags, IFlags } from './system/flags';
import { IConfiguration, resolveConfiguration } from './system/configuration';
import { IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from 'parser/common/syntax-types';
import { Language } from './system/constants';

/**
 * @internal
 */
type FileErrorMessage = [ string, string ];

/**
 * Maps file extensions to language constants.
 *
 * @internal
 */
const LanguageMap: IHashMap<Language> = {
  java: Language.JAVA
};

/**
 * @internal
 */
function getLanguageByExtension (extension: string): Language {
  const language = LanguageMap[extension];

  if (typeof language !== 'undefined') {
    return language;
  }

  throw new Error(`Extension '.${extension}' not currently supported!`);
}

/**
 * @internal
 */
function handleFileErrorMessages (fileErrorMessages: FileErrorMessage[]): void {
  for (const [ file, message ] of fileErrorMessages) {
    console.log(chalk.bgBlue(' Compilation Error: '), chalk.bgRed(` ${file} `));
    console.log(` ${message}`);
  }

  console.log(chalk.red('\nFailed to compile.\n'));
}

/**
 * @internal
 */
async function processFiles (directory: string, files: string[]): Promise<void> {
  const fileErrorMessages: FileErrorMessage[] = [];

  for (const file of files) {
    const extension = file.split('.').pop();

    try {
      const language = getLanguageByExtension(extension);
      const fileContents = await getFileContents(`${process.cwd()}/${directory}/${file}`);
      const firstToken = tokenize(fileContents);
      const syntaxTree: ISyntaxTree<any> = parse(firstToken, language);
    } catch (e) {
      fileErrorMessages.push([ file, e.message ]);
    }
  }

  if (fileErrorMessages.length > 0) {
    handleFileErrorMessages(fileErrorMessages);
  } else {
    console.log(chalk.green(`Compiled ${files.length} files.\n`));
  }
}

/**
 * Polybabel entry point.
 */
async function main (args: string[]) {
  console.log(chalk.white.bold(`\nStarting...\n`));

  const startTime = Date.now();
  const flags = getFlags(args);
  const { inputFolderName } = await resolveConfiguration(flags);
  const inputFiles = await resolveFilesDeep(inputFolderName);

  await processFiles(inputFolderName, inputFiles);

  console.log(chalk.white.bold(`Done. ${Date.now() - startTime}ms`));
}

main(process.argv);
