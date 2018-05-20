import { ISyntaxTree } from '../../parser/common/syntax-types';
import { TypeResolution } from '../common/compiler-types';

/**
 * @todo @description
 */
export default abstract class AbstractTypeResolver {
  public abstract resolve (syntaxTree: ISyntaxTree): TypeResolution.ResolvedType[];
}
