export default {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],
  transform: {},
  verbose: true,
  testTimeout: 30000, // Increase default timeout for all tests
};
