module.exports = {
  root: true, // Add this to indicate this is the root ESLint configuration
  env: {
    browser: true,
    node: true,
    'jest/globals': true,
  },
  globals: {
    $: true,
    grapesjs: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['@typescript-eslint', 'jest'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    'no-var': 'off',
    'prefer-const': 'off',
    'no-prototype-builtins': 'off',
    'no-useless-escape': 'off',
    'prefer-rest-params': 'off',
    'no-empty': 'off',
    'prefer-spread': 'off',
    'no-extra-boolean-cast': 'off',
    'no-unsafe-optional-chaining': 'off',
    'no-shadow-restricted-names': 'off',
    'no-cond-assign': 'off',
    'no-fallthrough': 'off',
    'no-sparse-arrays': 'off',
    'no-redeclare': 'off',
    'no-control-regex': 'off',
    'no-constant-condition': 'off',
    'no-misleading-character-class': 'off',
    'no-undef': 'off',
    'no-func-assign': 'off',
    'no-regex-spaces': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/no-unnecessary-type-const': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-unnecessary-type-constraint': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/no-unsafe-function-type': 'off',
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
    '@typescript-eslint/no-wrapper-object-types': 'off',
    'linebreak-style': ['error', 'unix'],
    'max-len': ['error', { code: 300 }],
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
  },
  ignorePatterns: ['*/docs/api/*', 'dist', 'packages/cli/src/template/**/*.*', '*/locale/*'],
};
