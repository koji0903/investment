import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/scripts/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // any型の使用を警告（段階的に error へ移行）
      "@typescript-eslint/no-explicit-any": "warn",
      // console.log は警告、console.warn/error は許可
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // 未使用変数はエラー（_ プレフィックスは除外）
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default eslintConfig;
