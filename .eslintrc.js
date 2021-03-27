//.eslintrc.js
module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ['plugin:vue/essential', 'eslint:recommended', '@vue/typescript/recommended', '@vue/prettier'],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/camelcase': 'off',
    'no-duplicate-imports': 'warn',
    'no-new-object': 'warn',
    'object-shorthand': 'warn',
    'quote-props': ['warn', 'as-needed'],
    'no-prototype-builtins': 'warn',
    'no-array-constructor': 'warn',
    'prefer-spread': 'warn',
    'prefer-arrow-callback': 'warn',
    'arrow-parens': ['warn', 'always'],
    'no-confusing-arrow': ['warn', { allowParens: true }],
    'prefer-template': 'warn',
    'prefer-object-spread': 'warn',
    'prefer-rest-params': 'warn',
    'dot-notation': 'warn',
    'no-multi-assign': 'warn',
    camelcase: 'off',
    'new-cap': [
      'warn',
      {
        newIsCap: true,
        capIsNewExceptions: [
          'Component',
          'Ref',
          'Prop',
          'Watch',
          'Model',
          'PropSync',
          'Emit',
          'Module',
          'Mutation',
          'Action',
          'JsonProperty',
          'JsonObject',
          'NumberFormat'
        ]
      }
    ]
  }
};
