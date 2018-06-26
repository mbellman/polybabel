import AbstractTypeDefinition from './AbstractTypeDefinition';
import { IConstrainable, TypeDefinition, ITypeConstraint } from './types';
import { Implements } from 'trampoline-framework';

export namespace FunctionType {
  export type Constraint = ITypeConstraint<FunctionType.Definition>;

  /**
   * @todo @description
   */
  export class Definition extends AbstractTypeDefinition implements IConstrainable {
    protected genericParameters: string[] = [];
    protected overloads: FunctionType.Constraint[] = [];
    protected parameterTypeConstraints: ITypeConstraint[] = [];
    protected returnTypeConstraint: ITypeConstraint;
    private didResolveArgumentTypes: boolean = false;

    /**
     * @todo
     */
    @Implements public constrain (genericParameterTypes: TypeDefinition[]): FunctionType.Definition {
      return null;
    }

    public getOverloads (): FunctionType.Constraint[] {
      return this.overloads;
    }

    public getParameterTypeConstraints (): ITypeConstraint[] {
      if (!this.didResolveArgumentTypes) {
        this.parameterTypeConstraints.forEach(constraint => this.ensureConstraintHasDefinition(constraint));

        this.didResolveArgumentTypes = true;
      }

      return this.parameterTypeConstraints;
    }

    public getReturnTypeConstraint (): ITypeConstraint {
      this.ensureConstraintHasDefinition(this.returnTypeConstraint);

      return this.returnTypeConstraint;
    }

    public hasOverloads (): boolean {
      return this.overloads.length > 0;
    }
  }

  /**
   * A FunctionType.Definition's definer subclass.
   */
  export class Definer extends Definition {
    public addGenericParameter (name: string): void {
      this.genericParameters.push(name);
    }

    public addParameterTypeConstraint (constraint: ITypeConstraint): void {
      this.parameterTypeConstraints.push(constraint);
    }

    public defineReturnTypeConstraint (constraint: ITypeConstraint): void {
      this.returnTypeConstraint = constraint;
    }

    public overload (constraint: FunctionType.Constraint): void {
      this.overloads.push(constraint);
    }
  }
}
