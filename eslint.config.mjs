// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import * as nestjs from 'eslint-plugin-nestjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const tsFiles = ['**/*.ts'];
const tsRecommended = tseslint.configs.recommended.map((config) => ({
  ...config,
  files: tsFiles,
}));
const tsRecommendedTypeChecked = tseslint.configs.recommendedTypeChecked.map((config) => ({
  ...config,
  files: tsFiles,
}));

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist', 'coverage', 'node_modules'],
  },
  eslint.configs.recommended,
  ...tsRecommended,
  ...tsRecommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    files: tsFiles,
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: tsFiles,
    plugins: {
      nestjs,
    },
    rules: {
      ...nestjs.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'lf' }],
    },
  },
);
