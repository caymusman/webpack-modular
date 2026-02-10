module.exports = {
    testEnvironment: 'jest-environment-jsdom',
    setupFiles: ['<rootDir>/src/__tests__/setup.js'],
    moduleNameMapper: {
        '\\.(css|scss)$': '<rootDir>/src/__tests__/__mocks__/styleMock.js',
        '\\.(wav|mp3|ogg|png|jpg|gif)$': '<rootDir>/src/__tests__/__mocks__/fileMock.js',
    },
    testMatch: ['<rootDir>/src/__tests__/**/*.test.js'],
    transform: {
        '^.+\\.jsx?$': 'babel-jest',
    },
};
