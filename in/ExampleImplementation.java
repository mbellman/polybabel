package ExampleImplementation;

import interfaces.IExampleInterface;

public class ExampleImplementation implements IExampleInterface {
  String example = 'Hello!';
  Number number = 10;

  String getExample () {
    return example;
  }
}
