
const config = {
  clearMocks: true,
  testEnvironment: 'node',
  preset: "ts-jest",
  testMatch: [
    "**/?(*.)+(spec|test).[tj]s?(x)"
  ],
};

module.exports = config;
