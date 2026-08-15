import { defineConfig, globalIgnores } from "eslint/config";
import typescriptParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  {
    files: ["**/*.ts", "**/*.mts"],
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-duplicate-imports": "warn",
      "no-console": "off",
    },
  },
  eslintConfigPrettier,
  globalIgnores([
    "node_modules/**",
    "dist/**",
    "coverage/**",
    ".husky/_/**",
    "**/*.config.mjs",
    ".lintstagedrc.mjs",
  ]),
]);

export default eslintConfig;
