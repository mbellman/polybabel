import { AbstractTokenStream } from './AbstractTokenStream';
import { BoundCallback, Callback, IHashMap } from '../../system/types';
import { IToken } from '../../tokenizer/types';
import { ParsedSyntax, Parser, TokenMatcher, TokenStreamHandler } from './types';

/**
 * @internal
 */
type ParserConfigurationMethod<P extends ParsedSyntax, R = any> = BoundCallback<IParserConfiguration<P>, AbstractTokenStream<P>, R>;

/**
 * A configuration object for createParser(...) or extendParsers()(...).
 *
 * @internal
 */
interface IParserConfiguration<P extends ParsedSyntax> {
  // Have {words}, {symbols}, and {numbers} be functions which
  // return their token matchers so that any references to
  // [this] in the function scopes refer to the configuration
  // object. This allows additional methods to be provided on
  // the object and used as token matcher handlers.
  words?: ParserConfigurationMethod<P, TokenMatcher<P>[]>;
  symbols?: ParserConfigurationMethod<P, TokenMatcher<P>[]>;
  numbers?: ParserConfigurationMethod<P, TokenMatcher<P>[]>;

  getDefault?: ParserConfigurationMethod<P, P>;
  onFirstToken?: ParserConfigurationMethod<P>;
  [key: string]: ParserConfigurationMethod<P>;
}

/**
 * A parser function factory.
 *
 * @internal
 */
type ParserFactory<P extends ParsedSyntax> = Callback<IParserConfiguration<P>, Parser<P>>;

/**
 * A parser function with a registered configuration. Configurations
 * are retrieved and used by composeParsers() to generate a parser
 * function with the combined behavior of multiple parser functions.
 *
 * @internal
 */
interface IConfiguredParser<P extends ParsedSyntax = ParsedSyntax> extends Parser<P> {
  __configuration__: IParserConfiguration<P>;
}

/**
 * Combines a list of parser configuration objects into one, effectively
 * enabling parser function composition.
 *
 * @internal
 */
function combineConfigurations <P extends S, S extends ParsedSyntax = ParsedSyntax>(configurations: IParserConfiguration<S>[]): IParserConfiguration<P> {
  // Distinguish all configurations after the head of the
  // list so the head can seed the accumulator and the rest
  // can be reduced on top of it
  const tailConfigurations = configurations.slice(1);
  const [ lastConfiguration ] = configurations.slice(-1);

  return tailConfigurations.reduce((acc, config) => {
    const isLastConfiguration = config === lastConfiguration;

    return {
      ...acc,

      /**
       * Incoming token matchers should take precedence over accumulated
       * token matchers.
       */
      words: () => [ ...config.words(), ...acc.words() ],
      symbols: () => [ ...config.symbols(), ...acc.symbols() ],
      numbers: () => [ ...config.numbers(), ...acc.numbers() ],

      /**
       * Wraps both the previously accumulated onFirstToken() handler
       * and the current configuration's, resetting the current token
       * on the received stream after each until the final handler.
       *
       * In practice, each configuration's onFirstToken() will fire
       * with a stream starting at the true first token, and only
       * the last will determine where the stream position ends up
       * before entering the matching loop.
       */
      onFirstToken: stream => {
        const firstToken = stream.token();

        if (acc.onFirstToken) {
          // Run the last onFirstToken() handler first
          acc.onFirstToken(stream);
        }

        if (config.onFirstToken) {
          // Prepare this configuration's onFirstToken() to
          // properly receive the first token again
          stream.currentToken = firstToken;

          config.onFirstToken(stream);

          if (!isLastConfiguration) {
            // Reset the first token once more for the next
            // onFirstToken() handler in the sequence (once
            // this function body exists in the next reducer
            // cycle as acc.onFirstToken())
            stream.currentToken = firstToken;
          }
        }
      },

      /**
       * The last configuration getDefault() should override any
       * previous ones.
       */
      getDefault: lastConfiguration.getDefault
    };
  }, configurations[0]) as IParserConfiguration<P>;
}

/**
 * A parser function factory which uses a provided {configuration}
 * to determine behavior for the parser function. The provided
 * generic parameter P determines the expected return type of the
 * parser, and should be a language-specific syntax node or syntax
 * tree type signature.
 */
export function createParser <P extends ParsedSyntax>(configuration: IParserConfiguration<P>): Parser<P> {
  const {
    name,
    getDefault = () => null,
    words = () => [],
    symbols = () => [],
    numbers = () => [],
    // We don't default onFirstToken() since, in the event
    // that this parser configuration extends an existing
    // one, and if onFirstToken() is deliberately omitted,
    // we want the existing onFirstToken() to be the final
    // one to run
    onFirstToken
  } = configuration;

  // Internally, createParser() relies on subclassing
  // AbstractTokenStream using the provided configuration
  // object for implementation and overrides. An instance
  // of TokenStream will be created each time the parser
  // is run, and passed to onFirstToken() and all token
  // matcher methods when they are fired.
  class TokenStream extends AbstractTokenStream<P> {
    public name = name;
    public numbers = numbers();
    public symbols = symbols();
    public words = words();

    public getDefault (): P {
      return getDefault();
    }

    public onFirstToken (): void {
      if (onFirstToken) {
        configuration.onFirstToken(this);
      }
    }
  }

  // Defines the actual parser function, taking in a single token
  // and streaming through following tokens either until a parsed
  // syntax object is resolved or the TokenStream instance halts
  const parse: Parser<P> = (token: IToken) => {
    const stream = new TokenStream();

    return stream.parse(token);
  };

  // Save the parser configuration on its function as an object
  // property so it can be read within extendParsers()
  (parse as IConfiguredParser<P>).__configuration__ = configuration;

  return parse;
}

/**
 * Takes an arbitrary number of parsers and returns a parser function
 * factory for generating a new parser extending them. Extended
 * parsers
 */
export function extendParsers <P extends S, S extends ParsedSyntax = ParsedSyntax>(...parsers: Parser<S>[]): ParserFactory<P> {
  const extensibleConfigurations = (parsers as IConfiguredParser<S>[])
    .map(parser => parser.__configuration__);

  return (configuration: IParserConfiguration<P>) => {
    const combineConfiguration = combineConfigurations<P>([ ...extensibleConfigurations, configuration ]);

    return createParser(combineConfiguration);
  };
}
