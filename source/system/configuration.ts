import { getFileContents } from './file';
import { IFlags } from './flags';

/**
 * @internal
 */
interface IPolybabelConfig extends IFlags { }

/**
 * A configuration object derived from a default configuration,
 * a .polybabelrc file if one exists, and provided CLI flags.
 */
export interface IConfiguration {
  inputFolderName: string;
  outputFolderName: string;
}

/**
 * Resolves a configuration object from defaults, a .polybabelrc file
 * if one exists, and an optionally provided {flags} object.
 */
export async function resolveConfiguration (flags: IFlags = {}): Promise<IConfiguration> {
  let polybabelConfig: IPolybabelConfig;

  try {
    const polybabelConfigJson =
      await getFileContents(`${process.cwd()}/.polybabelrc`) ||
      await getFileContents(`${process.cwd()}/polybabel.json`);

    polybabelConfig = JSON.parse(polybabelConfigJson);
  } catch (e) {
    polybabelConfig = {};
  }

  return {
    inputFolderName: flags.in || polybabelConfig.in || 'src',
    outputFolderName: flags.out || polybabelConfig.out || 'dist'
  };
}
