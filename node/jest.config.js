const { config } = require("../jest.config.js");

module.exports = {
  ...config,
  testMatch: ["<rootDir>/src/**/*.test.ts"],
};
