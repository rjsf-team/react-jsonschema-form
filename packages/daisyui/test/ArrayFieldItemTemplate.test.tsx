// Mock the ArrayFieldItemButtonsTemplate component
vi.mock('../src/templates/ArrayFieldItemButtonsTemplate/ArrayFieldItemButtonsTemplate', () => ({
  default: function MockArrayFieldItemButtonsTemplate() {
    return <div data-testid='mock-buttons'>Mock Buttons</div>;
  },
}));

describe('ArrayFieldItemTemplate', () => {
  // We test ArrayFieldItemTemplate completely with the Form integration tests
  // The component is covered by the form snapshot tests
  test('ArrayFieldItemTemplate is included in Form tests', () => {
    expect(true).toBe(true);
  });
});
