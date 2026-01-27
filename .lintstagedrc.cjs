module.exports = {
  '*.{ts,js,cjs,mjs}': ['pnpm exec eslint --fix', 'pnpm exec prettier --write'],
  '*.{json,md,yml,yaml}': ['pnpm exec prettier --write'],
};
