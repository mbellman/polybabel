import AbstractTypeDefinition from './AbstractTypeDefinition';
import { IConstrainable, TypeDefinition } from './types';
import { Implements } from 'trampoline-framework';

export namespace FunctionType {
  export class Definition extends AbstractTypeDefinition implements IConstrainable {
    protected argumentTypes: TypeDefinition[];
    protected genericParameters: string[] = [];
    protected returnType: TypeDefinition;
    private didResolveArgumentTypes: boolean = false;

    /**
     * @todo
     */
    @Implements public constrain (genericParameterTypes: TypeDefinition[]): FunctionType.Definition {
      return null;
    }

    public getArgumentTypes (): TypeDefinition[] {
      if (!this.didResolveArgumentTypes) {
        this.argumentTypes.forEach((argumentType, index) => {
          if (typeof argumentType === 'string') {
            const { type } = this.symbolDictionary.getSymbol(argumentType);

            this.argumentTypes[index] = type;
          }
        });

        this.didResolveArgumentTypes = true;
      }

      return this.argumentTypes;
    }

    public getReturnType (): TypeDefinition {
      if (typeof this.returnType === 'string') {
        const { type } = this.symbolDictionary.getSymbol(this.returnType);

        this.returnType = type;
      }

      return this.returnType;
    }
  }

  /**
   * A FunctionType.Definition's definer subclass.
   */
  export class Definer extends Definition {
    public addArgument (argumentType: TypeDefinition): void {
      this.argumentTypes.push(argumentType);
    }

    public addGenericParameter (name: string): void {
      this.genericParameters.push(name);
    }

    public defineReturnType (returnType: TypeDefinition): void {
      this.returnType = returnType;
    }
  }
}
