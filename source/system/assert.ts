/**
 * Validates a boolean {condition}, and if false optionally warns
 * with a {message} and exits the process.
 */
export default function assert (
  condition: boolean,
  message?: string
): void {
  if (!condition) {
    if (message) {
      console.warn(message);
    }

    process.exit(0);
  }
}
