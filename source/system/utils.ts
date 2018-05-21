import { Callback, Tuple2 } from './types';

export namespace Utils {
  export function objectToArray (object: any): any[] {
    return Object.keys(object).map(key => object[key]);
  }

  export function partition <T>(array: T[], predicate: Callback<T, boolean>): Tuple2<T[]> {
    const leftSide: T[] = [];
    const rightSide: T[] = [];

    array.forEach(item => {
      if (predicate(item)) {
        leftSide.push(item);
      } else {
        rightSide.push(item);
      }
    });

    return [ leftSide, rightSide ];
  }
}
