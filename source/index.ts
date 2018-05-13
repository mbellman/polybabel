#!/usr/bin/env node

import assert from './system/assert';
import chalk from 'chalk';
import Compiler from './compiler/Compiler';
import parse from './parser/parse';
import sanitize from './sanitizer/sanitize';
import tokenize from './tokenizer/tokenize';
import { getFileContents, resolveFilesDeep } from './system/file';
import { getFlags, IFlags } from './system/flags';
import { IConfiguration, resolveConfiguration } from './system/configuration';
import { IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from 'parser/common/syntax-types';
import { Language } from './system/constants';
import { LanguageSpecificationMap } from './system/language-spec';

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

  if (language) {
    return language;
  }

  throw new Error(`Extension '.${extension}' not currently supported!`);
}

/**
 * @internal
 */
async function createCompiler (directory: string, files: string[]): Promise<Compiler> {
  const compiler = new Compiler();

  for (const file of files) {
    const extension = file.split('.').pop();

    try {
      const language = getLanguageByExtension(extension);
      const fileContents = await getFileContents(`${process.cwd()}/${directory}/${file}`);
      const sanitizedFileContents = sanitize(fileContents, language);
      const firstToken = tokenize(sanitizedFileContents);
      const syntaxTree = parse(firstToken, language);

      compiler.add(file, syntaxTree);
    } catch (e) {
      compiler.addError(file, e.message);
    }
  }

  return compiler;
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
  const compiler = await createCompiler(inputFolderName, inputFiles);

  compiler.compileAll();

  if (compiler.hasErrors()) {
    console.log(chalk.red('Failed to compile.'));
  } else {
    console.log(chalk.white.bold(`Done. ${Date.now() - startTime}ms`));
  }
}

main(process.argv);
