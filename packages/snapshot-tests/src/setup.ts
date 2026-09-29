// Components read getTestIds() when their module is first evaluated, so this mock only reaches them if it is
// registered before any test file imports them. That is why it lives in a vitest setup file rather than in the suites.
vi.mock('@rjsf/utils', async (importOriginal) => ({
  ...(await importOriginal()),
  getTestIds: vi.fn(() => ({})),
}));
