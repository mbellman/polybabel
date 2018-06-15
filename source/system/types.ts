/**
 * A callback function which accepts an argument of type T
 * and returns a value of type U.
 */
export type Callback<T = any, U = any> = (arg?: T) => U;

/**
 * A callback function bound to the context of an object
 * of type C.
 */
export type BoundCallback<C, T = any, U = any> = (this: C, arg?: T) => U;

/**
 * Defines a type T without the properties defined in a string
 * union type P.
 */
export type Without<T, P extends keyof T> = { [K in Exclude<keyof T, P>]: T[K] };

/**
 * A 2-tuple of a type T;
 */
export type Tuple2<T> = [ T, T ];
