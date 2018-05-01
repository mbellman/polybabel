import AbstractTranslator from './AbstractTranslator';
import TypeDictionary from '../TypeDictionary';
import { Autowired, Implements, Wired } from 'trampoline-framework';
import { ISyntaxTree } from '../../parser/common/syntax-types';
import { JavaSyntax } from '../../parser/java/java-syntax';

@Wired
export default class JavaTranslator extends AbstractTranslator<JavaSyntax.IJavaSyntaxTree> {
  @Autowired()
  private typeDictionary: TypeDictionary<JavaSyntax.IJavaObject>;

  @Implements protected start (): void {

  }
}
