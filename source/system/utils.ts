export namespace Utils {
  export function objectToArray (object: any): any[] {
    return Object.keys(object).map(key => object[key]);
  }
}
