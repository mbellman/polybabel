package ExampleProgram;

import interfaces.IExampleInterface;
import ExampleImplementation;

public final class ExampleProgram {
  public static void main (String[] args) {
    console.log('This is an example.');

    IExampleInterface exampleInterface = ExampleProgram.getExample();
  }

  public static IExampleInterface getExample () {
    ExampleImplementation exampleImplementation = new ExampleImplementation();

    return exampleImplementation;
  }
}
