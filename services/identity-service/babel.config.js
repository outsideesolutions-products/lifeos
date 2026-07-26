// Only used by the e2e Jest config, to transform better-auth's ESM-only
// distribution (no CJS build is published) so it can be `require()`d from
// ts-jest-compiled test code. See test/jest-e2e.json's transformIgnorePatterns.
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
};
