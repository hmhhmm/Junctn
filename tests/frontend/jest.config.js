/**
 * Jest config for running frontend tests from the project root.
 * Points into the frontend package for module resolution and transform.
 */
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./frontend" });

module.exports = createJestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterFramework: ["@testing-library/jest-dom"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/frontend/src/$1",
  },
  testMatch: ["<rootDir>/tests/frontend/**/*.test.{ts,tsx}"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "./frontend/tsconfig.json" }],
  },
});
