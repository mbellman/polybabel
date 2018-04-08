import * as fs from 'fs';
import { Callback } from './types';

/**
 * @internal
 */
function isDirectory (
  file: string
): boolean {
  return fs.statSync(file).isDirectory();
}

/**
 * Resolves the contents of a file.
 */
export function getFileContents (
  filePath: string
): Promise<string> {
  return new Promise((resolve: Callback<string>, reject: Callback<NodeJS.ErrnoException>) => {
    fs.readFile(filePath, (err: NodeJS.ErrnoException, buffer: Buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer.toString());
      }
    });
  });
}

/**
 * Resolves the contents of a file from the current working directory.
 */
export async function getFileContentsFromCwd (
  filePathFromCwd: string
): Promise<string> {
  const fileContents: string = await getFileContents(`${process.cwd()}/${filePathFromCwd}`);

  return fileContents;
}

/**
 * Recursively resolves all non-directory files in a target {directory}.
 */
export async function resolveFilesDeep (
  directory: string
): Promise<string[]> {
  return new Promise((resolve: Callback<string[]>, reject: Callback<NodeJS.ErrnoException>) => {
    fs.readdir(directory, async (err: NodeJS.ErrnoException, files: string[]) => {
      if (err) {
        reject(err);
      } else {
        let deepFiles: string[] = [];

        for (const file of files) {
          const filePathFromRoot = `${directory}/${file}`;

          if (isDirectory(filePathFromRoot)) {
            const directoryFiles = await resolveFilesDeep(filePathFromRoot);
            const pathedDirectoryFiles = directoryFiles.map(directoryFile => `${file}/${directoryFile}`);

            deepFiles = deepFiles.concat(pathedDirectoryFiles);
          } else {
            deepFiles.push(file);
          }
        }

        resolve(deepFiles);
      }
    });
  });
}
