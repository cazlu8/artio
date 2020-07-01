module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'airbnb-typescript-prettier',
    'prettier/@typescript-eslint',
  ],
  ignorePatterns : ["src/migrations"],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'import/prefer-default-export': 'off',
    'no-useless-constructor': 'off',
    'class-methods-use-this': 'off',
    'no-return-await': 'off',
    'import/no-cycle': 'off',
    'no-console': 'off',
    'import/named': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'no-param-reassign': 'off'
  },
};
