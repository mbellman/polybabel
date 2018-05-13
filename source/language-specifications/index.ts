import { IHashMap } from 'trampoline-framework';
import { ILanguageSpecification } from './types';
import { JavaSpecification } from './java';
import { Language } from '../system/constants';

export const LanguageSpecification: IHashMap<ILanguageSpecification> = {
  [Language.JAVA]: JavaSpecification
};
