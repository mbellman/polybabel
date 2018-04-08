/**
 * A list of CLI flag names which can be passed to polybabel.
 */
export const enum Flag {
  INPUT_FOLDER_NAME = 'in',
  OUTPUT_FOLDER_NAME = 'out'
}

/**
 * An object mapping flag names to values.
 */
export interface IFlags {
  [Flag.INPUT_FOLDER_NAME]?: string;
  [Flag.OUTPUT_FOLDER_NAME]?: string;
}

/**
 * Resolves an IFlags object from node process arguments.
 */
export function getFlags (
  args: string[]
): IFlags {
  const flags: IFlags = {};
  let i: number = 0;

  while (i < args.length) {
    const arg: string = args[i];
    const isFlagNameArg: boolean = arg.charAt(0) === '-';

    if (isFlagNameArg) {
      flags[arg.slice(1) as keyof IFlags] = args[i + 1];
    }

    i += isFlagNameArg ? 2 : 1;
  }

  return flags;
}
