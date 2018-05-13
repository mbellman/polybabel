/**
 * @internal
 */
function replaceComment (comment: string): string {
  const totalLineBreaks = comment.split('\n').length;
  let replacement = '';
  let i = 0;

  while (++i < totalLineBreaks) {
    replacement += '\n';
  }

  return replacement;
}

/**
 * @internal
 */
function sanitizeComments (code: string): string {
  return code.replace(/(\/\*(.|\n)*?\*\/|\/\/.*\n)/g, replaceComment);
}

/**
 * @internal
 */
function sanitizeEmptyLines (code: string): string {
  return code.replace(/[ \t]+?\n/g, '\n');
}

export default function sanitizeJava (code: string): string {
  return sanitizeEmptyLines(sanitizeComments(code));
}
