const LONG_KEY_NAME_LENGTH = 20;

function memberHasDirectTypeLiteral(member) {
  return member.typeAnnotation?.typeAnnotation?.type === "TSTypeLiteral";
}

function memberHasLongKey(member) {
  return member.type === "TSPropertySignature"
    && (member.key?.name?.length ?? 0) > LONG_KEY_NAME_LENGTH;
}

function requiresMultiline(node) {
  return node.members.length >= 2
    || node.members.some(memberHasDirectTypeLiteral)
    || node.members.some(memberHasLongKey);
}

function getLineIndentCount(sourceCode, token) {
  const lineText = sourceCode.lines[token.loc.start.line - 1];
  const match = lineText.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "layout",
    fixable: "code",
    schema: [],
    messages: {
      expectedNewlineAfterOpenBrace: "Expected a newline after '{' in this type literal.",
      expectedNewlineBeforeCloseBrace: "Expected a newline before '}' in this type literal.",
      expectedNewlineBetweenMembers: "Expected each member to be on its own line."
    }
  },
  create(context) {
    const { sourceCode } = context;

    return {
      TSTypeLiteral(node) {
        if (node.members.length === 0 || !requiresMultiline(node)) {
          return;
        }

        const openBrace = sourceCode.getFirstToken(node);
        const closeBrace = sourceCode.getLastToken(node);
        const lineIndentCount = getLineIndentCount(sourceCode, openBrace);
        const baseIndent = " ".repeat(lineIndentCount);
        const memberIndent = `${baseIndent}  `;

        const firstMember = node.members[0];
        if (openBrace.loc.end.line === firstMember.loc.start.line) {
          context.report({
            node,
            messageId: "expectedNewlineAfterOpenBrace",
            fix: fixer => fixer.replaceTextRange([openBrace.range[1], firstMember.range[0]], `\n${memberIndent}`)
          });
        }

        for (let memberIndex = 1; memberIndex < node.members.length; memberIndex++) {
          const previousMember = node.members[memberIndex - 1];
          const currentMember = node.members[memberIndex];
          if (previousMember.loc.end.line === currentMember.loc.start.line) {
            const tokenBeforeCurrent = sourceCode.getTokenBefore(currentMember);
            context.report({
              node: currentMember,
              messageId: "expectedNewlineBetweenMembers",
              fix: fixer => fixer.replaceTextRange([tokenBeforeCurrent.range[1], currentMember.range[0]], `\n${memberIndent}`)
            });
          }
        }

        const lastMember = node.members[node.members.length - 1];
        if (closeBrace.loc.start.line === lastMember.loc.end.line) {
          const tokenBeforeCloseBrace = sourceCode.getTokenBefore(closeBrace);
          context.report({
            node,
            messageId: "expectedNewlineBeforeCloseBrace",
            fix: fixer => fixer.replaceTextRange([tokenBeforeCloseBrace.range[1], closeBrace.range[0]], `\n${baseIndent}`)
          });
        }
      }
    };
  }
};
