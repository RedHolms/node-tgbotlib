import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config} */
export default tseslint.config(
  { ignores: [ "dist", "node_modules" ] },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    rules: {
      "semi": ["error", "always"],
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-explicit-any": "off", // "any" can be really usefull
      "@typescript-eslint/consistent-indexed-object-style": ["error", "index-signature"]
    }
  }
);
