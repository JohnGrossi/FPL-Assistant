module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  "parserOptions": {
    "ecmaVersion": 2017
  },
  rules: {
    quotes: ["error", "double"],
  },
};
