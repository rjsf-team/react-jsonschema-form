// Mock style injection
// oxlint-disable-next-line typescript/no-deprecated
const originalCreateElement = document.createElement.bind(document);

beforeAll(() => {
  // oxlint-disable-next-line typescript/no-deprecated
  document.createElement = (tagName: string) => {
    const element = originalCreateElement(tagName);
    if (tagName === 'style') {
      Object.defineProperty(element, 'textContent', {
        set() {
          // Block style content
        },
      });
    }
    return element;
  };
});

afterAll(() => {
  // oxlint-disable-next-line typescript/no-deprecated
  document.createElement = originalCreateElement;
});

export {};
