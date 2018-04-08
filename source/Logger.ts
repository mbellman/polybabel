/**
 * @internal
 */
const enum ColorCode {
  RESET = '\x1b[0m',
  FG_YELLOW = '\x1b[33m',
  FG_RED = '\x1b[31m'
}

/**
 * A logging utility.
 */
export default class Logger {
  public static error (message: string): void {
    Logger._logWithColor(message, ColorCode.FG_RED);

    process.exit(0);
  }

  public static log (message: string): void {
    console.log(message);
  }

  public static warn (message: string): void {
    Logger._logWithColor(message, ColorCode.FG_YELLOW);
  }

  private static _logWithColor (message: string, colorCode: ColorCode): void {
    console.log(colorCode, message, ColorCode.RESET);
  }

  private static _resetColor (): void {
    Logger._setColor(ColorCode.RESET);
  }

  private static _setColor (colorCode: ColorCode): void {
    console.log(colorCode);
  }
}
