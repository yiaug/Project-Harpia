import js from '@eslint/js';
import globals from 'globals';
import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist', '.next', 'node_modules']
  },
  js.configs.recommended,
  firebaseRulesPlugin.configs['flat/recommended'],
  {
    rules: {
      "no-unused-vars": "off"
    }
  }
];
