import { GlobalType, IObjectTypeTemplate } from './types';

export const StringTypeTemplate: IObjectTypeTemplate = {
  name: 'String',
  constructors: [
    {
      name: 'String',
      parameters: [ GlobalType.STRING ],
      returns: GlobalType.STRING
    }
  ],
  properties: {
    length: GlobalType.NUMBER
  },
  methods: [
    {
      name: 'charAt',
      parameters: [ GlobalType.NUMBER ],
      returns: GlobalType.STRING
    }
  ]
};
