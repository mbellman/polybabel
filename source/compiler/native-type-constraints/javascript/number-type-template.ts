import { GlobalType, IObjectTypeTemplate } from './types';

export const NumberTypeTemplate: IObjectTypeTemplate = {
  name: 'Number',
  constructors: [
    {
      name: 'Number',
      parameters: [ GlobalType.NUMBER ],
      returns: GlobalType.NUMBER
    }
  ],
  properties: {},
  methods: [
    {
      name: 'toString',
      parameters: [],
      returns: GlobalType.STRING
    }
  ]
};
