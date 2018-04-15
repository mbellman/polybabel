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
