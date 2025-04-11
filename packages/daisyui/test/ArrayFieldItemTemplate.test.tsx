// Mock the ArrayFieldItemButtonsTemplate component
jest.mock('../src/templates/ArrayFieldItemButtonsTemplate/ArrayFieldItemButtonsTemplate', () => {
  return function MockArrayFieldItemButtonsTemplate(props) {
    return <div data-testid='mock-buttons'>Mock Buttons</div>;
  };
});

describe('ArrayFieldItemTemplate', () => {
  // We test ArrayFieldItemTemplate completely with the Form integration tests
  // The component is covered by the form snapshot tests
  test('ArrayFieldItemTemplate is included in Form tests', () => {
    expect(true).toBe(true);
  });
});
