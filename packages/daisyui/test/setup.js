// Mock nanoid to avoid ESM import issues and generate unique IDs
jest.mock('nanoid', () => {
  let mockCounter = 0;
  return {
    nanoid: () => `test-id-${mockCounter++}`,
  };
});

// Set up any other global mocks or configuration needed for tests
