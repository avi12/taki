import eslint from "@eslint/js";
import { makeTsBlock } from "@taki/shared/eslint";
import { globalIgnores } from "eslint/config";
import globals from "globals";
import tsEslint from "typescript-eslint";

export default [
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  globalIgnores(["dist/**", "node_modules/**"]),
  makeTsBlock({
    dirname: import.meta.dirname,
    files: ["**/*.{ts,js}", "eslint.config.js"],
    allowDefaultProject: ["eslint.config.js"],
    globals: globals.node
  })
];
