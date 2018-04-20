package HelloWorld;

import goodbye.GoodbyeWorld;

protected interface ITest {
  String string;
  Bool boolean;
  Object object;

  Thing getThing (String thing, final Number id) throws Exception;
}

public final class HelloWorld extends What implements ITest {
  public static void main (String[] args) {
    console.log('Hello!');

    GoodbyeWorld goodbyeWorld = new GoodbyeWorld();

    goodbyeWorld.printGoodbyeWorld();
  }
}