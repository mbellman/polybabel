import { IHashMap } from 'trampoline-framework';

/**
 * @todo @description
 */
export interface IObjectTypeTemplate {
  name: string;
  constructors: IFunctionTypeTemplate[];
  properties: IHashMap<GlobalType>;
  methods: IFunctionTypeTemplate[];
}

/**
 * @todo @description
 */
export interface IFunctionTypeTemplate {
  name: string;
  parameters: GlobalType[];
  returns: GlobalType;
}

/**
 * @todo @description
 */
export const enum GlobalType {
  STRING,
  NUMBER,
  BOOLEAN,
  ARRAY,
  FUNCTION,
  OBJECT
}
