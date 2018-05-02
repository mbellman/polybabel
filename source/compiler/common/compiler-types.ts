/**
 * Constants for primitive types common to all languages.
 */
export enum Primitive {
  STRING,
  NUMBER,
  BOOLEAN
}

/**
 * @todo @description
 */
export interface IReconciledType {
  [member: string]: Primitive | IReconciledType;
}
