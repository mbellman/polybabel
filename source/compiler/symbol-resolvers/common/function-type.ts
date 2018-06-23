import AbstractTypeDefinition from './AbstractTypeDefinition';
import { IConstrainable, TypeDefinition } from './types';
import { Implements } from 'trampoline-framework';

export namespace FunctionType {
  export class Definition extends AbstractTypeDefinition implements IConstrainable {
    protected genericParameters: string[] = [];
    protected overloads: FunctionType.Definition[] = [];
    protected parameterTypes: TypeDefinition[] = [];
    protected returnType: TypeDefinition;
    private didResolveArgumentTypes: boolean = false;

    /**
     * @todo
     */
    @Implements public constrain (genericParameterTypes: TypeDefinition[]): FunctionType.Definition {
      return null;
    }

    public getOverloads (): FunctionType.Definition[] {
      return this.overloads;
    }

    public getParameterTypes (): TypeDefinition[] {
      if (!this.didResolveArgumentTypes) {
        this.parameterTypes.forEach((argumentType, index) => {
          if (argumentType instanceof Array) {
            this.parameterTypes[index] = this.symbolDictionary.getFirstDefinedSymbol(argumentType).type;
          }
        });

        this.didResolveArgumentTypes = true;
      }

      return this.parameterTypes;
    }

    public getReturnType (): TypeDefinition {
      if (this.returnType instanceof Array) {
        this.returnType = this.symbolDictionary.getFirstDefinedSymbol(this.returnType).type;
      }

      return this.returnType;
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

    public addParameterType (argumentType: TypeDefinition): void {
      this.parameterTypes.push(argumentType);
    }

    public defineReturnType (returnType: TypeDefinition): void {
      this.returnType = returnType;
    }

    public overload (functionType: FunctionType.Definition): void {
      this.overloads.push(functionType);
    }
  }
}
