import expandNestedObjectExpression from "./eslint-rules/expand-nested-object-expression.js";
import expandNestedTypeLiteral from "./eslint-rules/expand-nested-type-literal.js";
import expandSvelteBlock from "./eslint-rules/expand-svelte-block.js";
import multilineArgParenNewline from "./eslint-rules/multiline-arg-paren-newline.js";
import multilineSpreadObject from "./eslint-rules/multiline-spread-object.js";
import noPaddedTag from "./eslint-rules/no-padded-tag.js";
import eslint from "@eslint/js";
import { makeTsBlock, tsPlugins, tsStyleRules } from "@taki/shared/eslint";
import svelteEslint from "eslint-plugin-svelte";
import { globalIgnores } from "eslint/config";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";
import tsEslint from "typescript-eslint";

const frontendGlobals = {
  ...globals.browser,
  ...globals.node,
  browser: "readonly",
  chrome: "readonly",
  __APP_VERSION__: "readonly"
};

const localPlugin = {
  rules: {
    "expand-nested-object-expression": expandNestedObjectExpression,
    "expand-nested-type-literal": expandNestedTypeLiteral,
    "expand-svelte-block": expandSvelteBlock,
    "multiline-arg-paren-newline": multilineArgParenNewline,
    "multiline-spread-object": multilineSpreadObject,
    "no-padded-tag": noPaddedTag
  }
};

const localRules = {
  "local/expand-nested-object-expression": "error",
  "local/expand-nested-type-literal": "error",
  "local/multiline-arg-paren-newline": "error",
  "local/multiline-spread-object": "error",
  "local/no-padded-tag": "error"
};

export default [
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  ...svelteEslint.configs["flat/recommended"],
  globalIgnores(["build/**", "node_modules/**", ".svelte-kit/**"]),
  makeTsBlock({
    dirname: import.meta.dirname,
    files: ["**/*.{ts,js}", "eslint.config.js", "../shared/src/**/*.ts"],
    allowDefaultProject: ["eslint-rules/*.js", "eslint.config.js", "svelte.config.js"],
    globals: frontendGlobals,
    extraPlugins: {
      local: localPlugin
    },
    extraRules: localRules
  }),
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsEslint.parser,
        tsconfigRootDir: import.meta.dirname,
        projectService: true,
        extraFileExtensions: [".svelte"]
      },
      globals: frontendGlobals
    },
    plugins: {
      ...tsPlugins,
      local: localPlugin
    },
    rules: {
      ...tsStyleRules,
      ...localRules,
      "svelte/no-at-html-tags": "off",
      "svelte/sort-attributes": "error",
      "svelte/shorthand-directive": "error",
      "arrow-body-style": ["error", "as-needed"],
      "svelte/first-attribute-linebreak": ["error"],
      "svelte/shorthand-attribute": ["error", { prefer: "always" }],
      "@typescript-eslint/no-explicit-any": "error",
      "prefer-const": ["error", { destructuring: "all" }],
      "@typescript-eslint/explicit-function-return-type": ["error", {
        allowExpressions: true,
        allowHigherOrderFunctions: true
      }],
      "svelte/indent": ["error", { indent: 2 }],
      "local/expand-svelte-block": "error"
    }
  }
];
