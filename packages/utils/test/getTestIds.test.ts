import { TestIdShape, getTestIds } from '../src';

const TEST_UUID_BASE = 'test-uuid-';
jest.mock('nanoid');
const nanoidMock = require('nanoid');

const nanoid = jest.requireActual('nanoid').nanoid;

nanoidMock.nanoid.mockImplementation(() => TEST_UUID_BASE + nanoid());

describe('getTestIds', () => {
  describe('process.env.NODE_ENV === "test"', () => {
    let testIds: TestIdShape;
    let fooTestId: string;
    beforeAll(() => {
      testIds = getTestIds();
    });
    afterAll(() => {
      nanoidMock.nanoid.mockClear();
    });
    it('does not return an empty object', () => {
      // it returns a Proxy object but since there isn't an easy way to test for it
      // the following tests will check for the Proxy functionality
      expect(testIds).not.toEqual({});
      nanoidMock.nanoid.mockClear(); // resetting the call count since the Proxy calls it during the initialization process
    });
    it('returns a generated test id when getting a property value', () => {
      fooTestId = testIds.foo;
      expect(fooTestId).toEqual(expect.stringContaining(TEST_UUID_BASE));
    });
    it('called uuid once', () => {
      expect(nanoidMock.nanoid).toHaveBeenCalledTimes(1);
    });
    it('returns the same id when getting the same property value', () => {
      expect(testIds.foo).toEqual(fooTestId);
    });
    it('did not call uuid again', () => {
      expect(nanoidMock.nanoid).toHaveBeenCalledTimes(1);
    });
    it('returns a different id when getting a different property value', () => {
      expect(testIds.bar).not.toEqual(fooTestId);
    });
    it('called uuid again', () => {
      expect(nanoidMock.nanoid).toHaveBeenCalledTimes(2);
    });
  });
  describe('process.env.NODE_ENV !== "test"', () => {
    let oldNodeEnv: string | undefined;
    let testIds: TestIdShape;
    beforeAll(() => {
      oldNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'other';
      testIds = getTestIds();
    });
    afterAll(() => {
      process.env.NODE_ENV = oldNodeEnv;
    });
    it('returns an empty object', () => {
      expect(testIds).toEqual({});
    });
    it('returns undefined when trying to access a property of the object', () => {
      expect(testIds.foo).toBeUndefined();
    });
    it('did not call uuid', () => {
      expect(nanoidMock.nanoid).not.toHaveBeenCalled();
    });
  });
});
