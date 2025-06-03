// Mock style injection
const originalCreateElement = document.createElement.bind(document);

beforeAll(() => {
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
  document.createElement = originalCreateElement;
});

export {};
