/**
 * A callback function which takes arguments of type T
 * and returns a value of type U.
 */
export type Callback<T = any, U = any> = (...args: T[]) => U;
