/**
 * A callback function which takes argument(s) of type T
 * and returns a value of type U.
 */
export type Callback<T = any, U = any> = (arg: T) => U;

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
