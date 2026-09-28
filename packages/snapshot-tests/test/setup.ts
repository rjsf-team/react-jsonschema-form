// The suites in src/ mock getTestIds themselves, but a mock declared there only reaches modules imported after it,
// and these tests import @rjsf/core first. A setup file runs before every test file's imports.
vi.mock('@rjsf/utils', async (importOriginal) => ({
  ...(await importOriginal()),
  getTestIds: vi.fn(() => ({})),
}));
