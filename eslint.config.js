// eslint.config.js

import js from "@eslint/js";
import globals from "globals";

import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import testingLibrary from "eslint-plugin-testing-library";
import tseslint from "typescript-eslint";

export default [
  //
  // 0️⃣ Prevent Testing Library crashes (disable all TL rules globally)
  //
  {
    plugins: {
      "testing-library": testingLibrary,
    },
    rules: {
      "testing-library/await-async-events": "off",
      "testing-library/no-await-sync-events": "off",
      "testing-library/no-render-in-lifecycle": "off",
      "testing-library/no-container": "off",
      "testing-library/no-node-access": "off",
    },
  },

  //
  // 1️⃣ Global ignores
  //
  {
    ignores: [
      "eslint.config.js",
      "vendor/**",
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "vite.config.ts",
      "**/*.config.ts",
      "**/*.config.js",
      "postcss.config.*",
      "tailwind.config.*",
    ],
  },

  //
  // 2️⃣ JS Recommended
  //
  js.configs.recommended,

  //
  // 3️⃣ React, Hooks, A11y — global for JS & TS
  //
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },

  //
  // 4️⃣ Typed TS linting ONLY for src/**/*
  //
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.browser,
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      // Strict async rules
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/require-await": "error",

      // Relax noisy unsafe rules
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",

      // Practical project exceptions
      "@typescript-eslint/no-array-delete": "off",
      "@typescript-eslint/no-base-to-string": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },

  //
  // 5️⃣ Test-only configs — enable Testing Library ONLY inside tests
  //
  {
    files: [
      "**/__tests__/**/*.{js,jsx,ts,tsx}",
      "**/*.test.{js,jsx,ts,tsx}",
      "**/*.spec.{js,jsx,ts,tsx}",
      "src/test/**/*.{js,jsx,ts,tsx}",
      "**/setupTests.{js,ts}",
      "**/setup.*.{js,ts}",
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest, // ← FIXES describe/it/expect no-undef
      },
    },
    plugins: {
      "testing-library": testingLibrary,
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      ...testingLibrary.configs.react.rules,

      // Relax TypeScript rules for test files
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },
];
