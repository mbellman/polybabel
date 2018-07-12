#!/usr/bin/env node

import chalk from 'chalk';
import Compiler from './compiler/Compiler';
import tokenize from './tokenizer/tokenize';
import { getFileContents, resolveFilesDeep } from './system/file';
import { getFlags } from './system/flags';
import { resolveConfiguration } from './system/configuration';
import { IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from 'parser/common/syntax-types';
import { Language } from './system/constants';
import { LanguageSpecification } from './language-specifications/index';

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
async function createCompiler (inputFolderName: string, filenames: string[]): Promise<Compiler> {
  const compiler = new Compiler();
  const cwd = process.cwd();

  for (const filename of filenames) {
    const extension = filename.split('.').pop();

    try {
      const language = getLanguageByExtension(extension);
      const { Parser } = LanguageSpecification[language];
      const fileContents = await getFileContents(`${cwd}/${inputFolderName}/${filename}`);
      const firstToken = tokenize(fileContents);
      const parser = new Parser();
      let syntaxTree: ISyntaxTree;

      try {
        syntaxTree = parser.parse(firstToken);
      } catch (e) { }

      if (parser.hasError()) {
        compiler.addError(filename, parser.getError());
      }

      compiler.add(filename, syntaxTree);
    } catch ({ message }) {
      compiler.addError(filename, { message });
    }
  }

  return compiler;
}

/**
 * Polybabel entry point.
 */
async function main (args: string[]) {
  console.log(chalk.white.bold(`\nStarting...`));

  const startTime = Date.now();
  const flags = getFlags(args);
  const { inputFolderName } = await resolveConfiguration(flags);
  const inputFiles = await resolveFilesDeep(inputFolderName);
  const compiler = await createCompiler(inputFolderName, inputFiles);

  compiler.run();

  if (compiler.hasErrors()) {
    console.log(`${chalk.yellow('\nErrors detected:')}`);

    compiler.forEachError((file, message, line, linePreview) => {
      console.log(`\n${chalk.bold.white(`${file}`)}: ${chalk.yellow(message)}`);

      if (line && linePreview) {
        console.log(` ${chalk.red(`${line}`)}. ... ${linePreview}`);
      }
    });

    console.log(chalk.redBright('\nFailed to compile.'));
  } else {
    console.log(chalk.white.bold(`\nDone. ${Date.now() - startTime}ms`));
  }
}

main(process.argv);
