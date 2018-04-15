interface ITest extends Div, Something, Else {
  String string;
  private final abstract static Bool boolean;
  Object object;

  Thing getThing (String key, final Number id) throws Exception;
}

class HelloWorld {
  public static void main (String[] args) {
    console.log('Hello!');

    GoodbyeWorld goodbyeWorld = new GoodbyeWorld();

    goodbyeWorld.printGoodbyeWorld();
  }
}