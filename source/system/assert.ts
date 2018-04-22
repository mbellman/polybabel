/**
 * Validates a boolean {condition}, and if false throws an
 * Error with an optional {message} or a default error message.
 */
export default function assert (condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message || 'Unknown runtime error!');
  }
}
