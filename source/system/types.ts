/**
 * A callback function which takes argument(s) of type T
 * and returns a value of type U.
 */
export type Callback<T = any, U = any> = (arg?: T) => U;

/**
 * A callback function bound to the context of an object
 * of type C.
 */
export type BoundCallback<C, T = any, U = any> = (this: C, arg?: T) => U;

/**
 * A key/value map.
 */
export interface IHashMap<V> {
  [key: string]: V;
}

/**
 * An instantiable class constructor.
 */
export interface IConstructable<T = any> {
  new (...args: any[]): T;
}

/**
 * Any class constructor, including that of an abstract class.
 */
export type Constructor<T = any> = IConstructable<T> | Function & { prototype: T };

/**
 * A conditional type which enforces that the type B is a base
 * of T.
 */
export type BaseOf<T, B> = T extends B
  ? { [K in keyof B]?: B[K] }
  : never;

/**
 * Defines a type T without the properties defined in a string
 * union type P.
 */
export type Without<T, P extends keyof T> = { [K in Exclude<keyof T, P>]: T[K] };
