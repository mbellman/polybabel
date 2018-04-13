import { AbstractTokenStream } from './AbstractTokenStream';
import { Callback, IHashMap } from '../../system/types';
import { IToken } from '../../tokenizer/types';
import { ParsedSyntax, Parser, TokenMatcher, TokenStreamHandler } from './types';

/**
 * A configuration object for createParser(...) or composeParsers()(...).
 *
 * @internal
 */
interface IParserConfiguration<P extends ParsedSyntax> {
  name: string;
  words?: TokenMatcher<P>[];
  symbols?: TokenMatcher<P>[];
  numbers?: TokenMatcher<P>[];
  getDefault?: () => P;
  onFirstToken?: TokenStreamHandler<P>;
  [key: string]: string | TokenMatcher<P>[] | TokenStreamHandler<P>;
}

/**
 * A collection of helper methods for a parser function.
 *
 * @internal
 */
interface IParserHelpers<P extends ParsedSyntax> {
  [key: string]: TokenStreamHandler<P>;
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
function composeConfigurations <P extends S, S extends ParsedSyntax = ParsedSyntax>(configurations: IParserConfiguration<S>[]): IParserConfiguration<P> {
  return configurations.slice(1).reduce((acc, config, index) => {
    const isLastConfiguration = index === configurations.length - 1;

    return {
      ...acc,

      /**
       * Incoming token matchers should take precedence over accumulated
       * token matchers.
       */
      words: [ ...config.words, ...acc.words ],
      symbols: [ ...config.symbols, ...acc.symbols ],
      numbers: [ ...config.numbers, ...acc.numbers ],

      /**
       * Wraps a previously accumulated first token handler with one
       * which resets the incoming TokenStream's current token back
       * to the first after it is run, accounting for potential skips
       * within each handler. This will enable accumulated handlers
       * to be run consecutively.
       */
      onFirstToken: stream => {
        const firstToken = stream.token();

        if (acc.onFirstToken) {
          acc.onFirstToken(stream);
        }

        stream.currentToken = firstToken;

        if (isLastConfiguration && config.onFirstToken) {
          config.onFirstToken(stream);
        }
      },

      /**
       * The incoming configuration getDefault() should override the
       * previous accumulated one.
       */
      getDefault: config.getDefault
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
    words = [],
    symbols = [],
    numbers = [],
    onFirstToken
  } = configuration;

  // Internally, createParser() relies on subclassing
  // AbstractTokenStream using the provided configuration
  // object for implementation and overrides. An instance
  // of TokenStream will be created each time the parser
  // is run, and passed to onFirstToken() and all token
  // matcher methods when fired.
  class TokenStream extends AbstractTokenStream<P> {
    public words = words;
    public symbols = symbols;
    public numbers = numbers;

    public getDefault (): P {
      return getDefault();
    }

    public onFirstToken (): void {
      if (onFirstToken) {
        onFirstToken(this);
      }
    }
  }

  // Override TokenStream's constructor name so its base
  // throw() method can report errors by their source
  (TokenStream.constructor as any).name = name;

  const parse = (token: IToken) => {
    const stream = new TokenStream();

    return {
      parsed: stream.parse(token),
      token: stream.token()
    };
  };

  // Save the parser configuration so it can be composed
  // with other parsers via composeParsers()
  (parse as IConfiguredParser<P>).__configuration__ = configuration;

  return parse;
}

/**
 * Composes multiple parser functions into one, providing the
 * token matching capabilities and first token handlers of each.
 */
export function composeParsers <P extends S, S extends ParsedSyntax = ParsedSyntax>(...parsers: Parser<S>[]): ParserFactory<P> {
  const configurations = (parsers as IConfiguredParser<S>[])
    .map(parser => parser.__configuration__);

  return (configuration: IParserConfiguration<P>) => {
    const composedConfiguration = composeConfigurations<P>([ ...configurations, configuration ]);

    return createParser(composedConfiguration);
  };
}

/**
 * An identity function for an object of helper methods used by
 * a parser function. Simply casts the type of each method as a
 * TokenStreamHandler<P>, where P is a language-specific parsed
 * syntax type signature.
 */
export function createHelpers <P extends ParsedSyntax>(helpers: IParserHelpers<P>): IParserHelpers<P> {
  return helpers;
}
