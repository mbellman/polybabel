import goodbye.GoodbyeWorld;

interface HTMLElement {
  innerHTML: String;
}

public class HelloWorld {
  public static void main (String[] args) {
    console.log('Hello!');

    GoodbyeWorld goodbyeWorld = new GoodbyeWorld();

    goodbyeWorld.printGoodbyeWorld();
  }
}