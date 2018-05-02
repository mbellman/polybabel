import AbstractTypeReconciler from '../common/AbstractTypeReconciler';
import { Implements } from 'trampoline-framework';
import { IReconciledType } from '../common/compiler-types';
import { JavaSyntax } from '../../parser/java/java-syntax';

export default class JavaTypeReconciler extends AbstractTypeReconciler {
  @Implements public reconcile (javaSyntaxTree: JavaSyntax.IJavaSyntaxTree): IReconciledType[] {
    return [];
  }
}
