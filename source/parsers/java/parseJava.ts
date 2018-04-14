import JavaClassParser from './JavaClassParser';
import { parseJavaInterface } from './parseJavaInterface';
import { createParser } from '../common/parser-factory';
import { IHashMap } from '../../system/types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { TokenMatcher } from '../common/types';

export const parseJava = createParser<JavaSyntax.IJavaSyntaxTree>({
  words () {
    return [
      [JavaConstants.Keyword.PACKAGE, this.onPackageDeclaration],
      [JavaConstants.Keyword.IMPORT, this.onImportDeclaration],
      [JavaConstants.Keyword.CLASS, this.onClassDeclaration],
      [JavaConstants.Keyword.INTERFACE, this.onInterfaceDeclaration],
      [
        [
          ...JavaConstants.AccessModifiers,
          ...JavaConstants.Modifiers
        ],
        this.onModifierKeyword
      ]
    ];
  },

  getDefault (): JavaSyntax.IJavaSyntaxTree {
    return {
      lines: 0,
      nodes: []
    };
  },

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

  onModifierKeyword (stream) {
    const isModifyingClass = stream.lineContains(JavaConstants.Keyword.CLASS);
    const isModifyingInterface = stream.lineContains(JavaConstants.Keyword.INTERFACE);

    stream.assert(
      isModifyingClass !== isModifyingInterface,
      'Invalid object declaration'
    );

    if (isModifyingClass) {
      this.onClassDeclaration(stream);
    } else {
      this.onInterfaceDeclaration(stream);
    }
  }
});
