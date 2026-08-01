// @ts-check

import { includeIgnoreFile } from '@eslint/compat';
import eslint from '@eslint/js';
import markdown from '@eslint/markdown';
import tslintPlugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import imports from 'eslint-plugin-import';
import json from 'eslint-plugin-json';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config} */
const globalIgnores = {
  name: 'ignores config',
  ignores: includeIgnoreFile(
    resolve(dirname(fileURLToPath(import.meta.url)), '.gitignore'),
  ).ignores,
};

/** @type {import('eslint').Linter.Config} */
const globalConfig = {
  name: 'global config',
  plugins: { prettier },
  rules: {
    ...prettierConfig.rules,
    ...prettier.configs.recommended.rules,
    'max-len': [
      'error',
      {
        code: 80,
        ignorePattern: '^((import|export)\\s.+\\sfrom\\s.+|\\} from)',
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
        ignoreTrailingComments: true,
        ignoreUrls: true,
        tabWidth: 2,
      },
    ],
  },
};
//
/** @type {import('eslint').Linter.Config} */
const javascriptDefaultConfig = {
  name: 'javascript config',
  files: ['**/*.js'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    globals: {
      ...globals.browser,
      ...globals.commonjs,
      ...globals.node,
      ...globals.jest,
      ...globals.es2021,
    },
  },
  plugins: { import: imports },
  rules: {
    ...eslint.configs.recommended.rules,
    ...imports.flatConfigs.recommended.rules,
    'consistent-return': 'error',
    'no-else-return': 'error',
    'prefer-const': 'error',
    'no-restricted-syntax': ['error', 'WithStatement'],
    'no-console': 'error',
    'no-control-regex': 'warn',
    'no-extra-semi': 'warn',
    'no-redeclare': 'off',
    'no-case-declarations': 'warn',
    'no-useless-escape': 'warn',
    'no-prototype-builtins': 'warn',
    'no-throw-literal': 'warn',
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-undef': 'error',
    'comma-dangle': ['warn', 'always-multiline'],
    strict: ['error', 'global'],
    quotes: [
      'warn',
      'single',
      {
        avoidEscape: true,
      },
    ],
    semi: ['error', 'always'],
    curly: ['error', 'multi-line'],
    eqeqeq: 'error',
    complexity: ['error', 10],
    'array-element-newline': ['error', 'consistent'],
    'import/no-unresolved': 'off',
    'import/named': 'off',
  },
};

/** @type {import('eslint').Linter.Config} */
const typescriptDefaultConfig = {
  name: 'typescript default config',
  files: ['**/*.ts'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: tslint.parser,
    globals: javascriptDefaultConfig.languageOptions.globals,
    parserOptions: {
      project: [
        'tsconfig.json',
        'packages/*/tsconfig.json',
        'apps/server/**/tsconfig.json',
        'apps/server/**/tsconfig.*.json',
      ],
      warnOnUnsupportedTypeScriptVersion: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  plugins: {
    ...javascriptDefaultConfig.plugins,
    '@typescript-eslint': tslintPlugin,
  },
  rules: {
    ...javascriptDefaultConfig.rules,
    ...tslint.configs.recommendedTypeChecked.find(
      ({ name }) => name === 'typescript-eslint/recommended-type-checked',
    )?.rules,
    'no-undef': 'off',
    '@typescript-eslint/no-var-requires': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/unbound-method': ['error', { ignoreStatic: true }],
  },
};

/** @type {import('eslint').Linter.Config} */
const jsonConfig = {
  name: 'json config',
  files: ['**/*.json'],
  processor: {
    meta: {
      name: 'eslint-plugin-json/json',
    },
    ...json.processors['.json'],
  },
  plugins: { json },
  rules: json.configs.recommended.rules,
};

export default tslint.config(
  globalIgnores,
  globalConfig,
  javascriptDefaultConfig,
  typescriptDefaultConfig,
  jsonConfig,
  ...markdown.configs.recommended,
);
