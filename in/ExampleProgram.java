package ExampleProgram;

import interfaces.IExampleInterface;
import ExampleImplementation;

public final class ExampleProgram {
  public static void main (String[] args) {
    console.log('This is an example.');

    IExampleInterface exampleInterface = ExampleProgram.getExample();

    String[] names;

    for (String name : names) {

    }
  }

  public static IExampleInterface getExample () {
    ExampleImplementation exampleImplementation = new ExampleImplementation();

    return exampleImplementation;
  }
}
