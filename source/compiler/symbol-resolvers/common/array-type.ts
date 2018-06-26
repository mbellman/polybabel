import AbstractTypeDefinition from './AbstractTypeDefinition';
import { ITypeConstraint } from './types';

export namespace ArrayType {
  export type Constraint = ITypeConstraint<ArrayType.Definition>;

  /**
   * An array type definition, denoting a list of elements
   * of a given type.
   */
  export class Definition extends AbstractTypeDefinition {
    protected elementTypeConstraint: ITypeConstraint;

    public getElementTypeConstraint (): ITypeConstraint {
      this.ensureConstraintHasDefinition(this.elementTypeConstraint);

      return this.elementTypeConstraint;
    }
  }

  /**
   * An ArrayType.Definition's definer subclass.
   */
  export class Definer extends Definition {
    public defineElementTypeConstraint (constraint: ITypeConstraint): void {
      this.elementTypeConstraint = constraint;
    }
  }
}
