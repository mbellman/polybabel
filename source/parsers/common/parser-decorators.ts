import AbstractParser from './AbstractParser';
import { Callback, Constructor, IConstructable } from '../../system/types';
import { IMatcher, ParsedSyntax } from './parser-types';

/**
 * A void class decorator which only validates that the target
 * AbstractParser implementation satisfies, on its static side,
 * the constraint M & Constructor<AbstractParser>. When applied
 * on an AbstractParser class implementation, the class will
 * trivially satisfy the constraint Constructor<AbstractParser>,
 * but the addition of the IMatcher requirement enforces the
 * presence of a static field with the correct name and with
 * an array of TokenMatchers.
 *
 * @example
 *
 *  @Matches<IWords>()
 *  class WordParser extends AbstractParser {
 *    public static readonly words: TokenMatcher<WordParser>[] = [
 *      ...
 *    ]
 *  }
 *
 * In this example, the decoration is synonymous with saying
 * "Class 'WordParser' has a static field 'words' which contains
 * an array of TokenMatchers aiding WordParser instances." When
 * the static field 'words' is removed or renamed, the type
 * constraint is violated and the compiler will complain.
 */
export function Matches <M extends IMatcher>() {
  return (target: M & Constructor<AbstractParser>) => { };
}

/**
 * @todo @description
 */
export function Composes <P extends S, S extends ParsedSyntax = ParsedSyntax>(...parserClasses: Constructor<AbstractParser<S>>[]): Callback<Constructor<AbstractParser<P>>> {
  return (parserClass: Constructor<AbstractParser<P>>): Constructor<AbstractParser<P>> => {
    return parserClass;
  };
}
