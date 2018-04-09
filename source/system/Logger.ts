/**
 * @internal
 */
const enum ColorCode {
  RESET = '\x1b[0m',
  FG_YELLOW = '\x1b[33m',
  FG_RED = '\x1b[31m'
}

/**
 * A generic logging utility.
 */
export interface ILogger {
  error (message: string): void;
  log (message: string): void;
  warn (message: string): void;
}

/**
 * A logging utility with color output features.
 */
export default class Logger implements ILogger {
  public error (message: string): void {
    this._logWithColor(message, ColorCode.FG_RED);

    process.exit(0);
  }

  public log (message: string): void {
    console.log(message);
  }

  public warn (message: string): void {
    this._logWithColor(message, ColorCode.FG_YELLOW);
  }

  private _logWithColor (message: string, colorCode: ColorCode): void {
    console.log(colorCode, message, ColorCode.RESET);
  }
}
