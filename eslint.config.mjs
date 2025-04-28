import eslint from "@eslint/js";
import importEslint from "eslint-plugin-import";
import tsEslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config} */
export default tsEslint.config(
  { ignores: [ "dist", "types", "node_modules" ] },
  eslint.configs.recommended,
  importEslint.flatConfigs.recommended,
  ...tsEslint.configs.strict,
  ...tsEslint.configs.stylistic,
  {
    rules: {
      "semi": ["error", "always"],
      "no-unused-vars": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-explicit-any": "off", // "any" can be really usefull
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/consistent-indexed-object-style": ["error", "record"],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-invalid-void-type": "off",
      "@typescript-eslint/no-extraneous-class": "off",
      "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "import/order": ["error", {
        groups: [
          "builtin",
          "external",
          "parent",
          "sibling",
          "index",
          "type"
        ],
        named: {
          enabled: true,
          import: true,
          export: false,
          require: true,
          cjsExports: false,
          types: "types-last"
        },
        alphabetize: {
          order: "asc",
          orderImportKind: "asc"
        }
      }],
      "import/no-unresolved": "off"
    }
  }
);
