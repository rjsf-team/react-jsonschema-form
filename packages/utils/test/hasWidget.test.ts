import { RJSFSchema, Widget, hasWidget } from '../src';

// Mock the getWidget() function for the purposes of this test
jest.mock('../src/getWidget', () =>
  jest
    .fn()
    .mockImplementationOnce(() => {
      throw new Error('No widget');
    })
    .mockImplementationOnce(() => {
      throw new Error('Unsupported widget');
    })
    .mockImplementationOnce(() => {
      throw new TypeError();
    })
    .mockImplementation(() => true)
);

const schema: RJSFSchema = {
  type: 'string',
};

describe('hasWidget()', () => {
  it('returns false when widget is unsupported', () => {
    expect(hasWidget(schema, {} as Widget)).toBe(false);
  });
  it('returns false when widget is not available', () => {
    expect(hasWidget(schema, 'foo')).toBe(false);
  });
  it('rethrows error', () => {
    expect(() => hasWidget({ type: 'null' }, 'foo', { TextWidget: {} as Widget })).toThrowError(TypeError);
  });
  it('returns true when widget is available', () => {
    expect(hasWidget(schema, 'text')).toBe(true);
  });
});
