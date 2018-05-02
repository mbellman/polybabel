import { IReconciledType } from '../common/compiler-types';
import { ISyntaxTree } from '../../parser/common/syntax-types';

/**
 * @todo @description
 */
export default abstract class AbstractTypeReconciler {
  public abstract reconcile (syntaxTree: ISyntaxTree): IReconciledType[];
}
