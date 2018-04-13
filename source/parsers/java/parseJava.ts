import JavaClassParser from './JavaClassParser';
import JavaInterfaceParser from './JavaInterfaceParser';
import { createHelpers, createParser } from '../common/parser-factory';
import { IHashMap } from '../../system/types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

/**
 * @internal
 */
const helpers = createHelpers<JavaSyntax.IJavaSyntaxTree>({
  onPackageDeclaration: stream =>
    null,

  onImportDeclaration: stream =>
    null,

  onClassDeclaration: stream => {
    const { parsed } = stream.parseNextWith(JavaClassParser);

    stream.parsed.nodes.push(parsed);
  },

  onInterfaceDeclaration: stream => {
    const { parsed } = stream.parseNextWith(JavaInterfaceParser);

    stream.parsed.nodes.push(parsed);
  },

  onModifierKeyword: stream => {
    const isModifyingClass = stream.lineContains(JavaConstants.Keyword.CLASS);
    const isModifyingInterface = stream.lineContains(JavaConstants.Keyword.INTERFACE);

    stream.assert(
      isModifyingClass !== isModifyingInterface,
      'Invalid object declaration'
    );

    if (isModifyingClass) {
      helpers.onClassDeclaration(stream);
    } else {
      helpers.onInterfaceDeclaration(stream);
    }
  }
});

export const parseJava = createParser<JavaSyntax.IJavaSyntaxTree>({
  name: 'JavaParser',

  words: [
    [JavaConstants.Keyword.PACKAGE, helpers.onPackageDeclaration],
    [JavaConstants.Keyword.IMPORT, helpers.onImportDeclaration],
    [JavaConstants.Keyword.CLASS, helpers.onClassDeclaration],
    [JavaConstants.Keyword.INTERFACE, helpers.onInterfaceDeclaration],
    [
      [
        ...JavaConstants.AccessModifiers,
        ...JavaConstants.Modifiers
      ],
      helpers.onModifierKeyword
    ]
  ],

  getDefault (): JavaSyntax.IJavaSyntaxTree {
    return {
      lines: 0,
      nodes: []
    };
  }
});
