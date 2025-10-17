import globals from "globals";
import eslintConfigDeepcrawl from "eslint-config-deepcrawl";

export default [
  ...eslintConfigDeepcrawl,
  {
    ignores: ["**/eslint.config.mjs", "**/package.json", "**/*.js", "**/dist/**", "**/assets/**"],
  },
  {
    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.node,
      },
      ecmaVersion: 2019,
      sourceType: "module",
      parserOptions: {
        project: ["./*/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*test.ts"],
    rules: {
      "max-lines-per-function": "off",
    },
  },
];
