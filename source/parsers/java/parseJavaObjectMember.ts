import { createParser } from '../common/parser-factory';
import { isAccessModifierKeyword, isModifierKeyword } from './java-utils';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

export const parseJavaObjectMember = createParser<JavaSyntax.IJavaObjectMember>({
  name: 'JavaObjectMemberParser',

  onFirstToken (stream) {
    const { value } = stream.currentToken;

    if (isAccessModifierKeyword(value)) {
      stream.parsed.access = JavaConstants.AccessModifierMap[value];

      stream.skip(1);
    }

    while (isModifierKeyword(stream.currentToken.value)) {
      stream.match([
        [JavaConstants.Keyword.STATIC, () => stream.parsed.isStatic = true],
        [JavaConstants.Keyword.FINAL, () => stream.parsed.isFinal = true],
        [JavaConstants.Keyword.ABSTRACT, () => stream.parsed.isAbstract = true]
      ]);

      stream.skip(1);
    }

    stream.parsed.type = stream.currentToken.value;
    stream.parsed.name = stream.nextToken.value;

    stream.skip(2);
  }
});
