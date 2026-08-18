import type { TestIdShape } from '../src';
import { getTestIds } from '../src';

const TEST_ID_BASE = 'test-id-';

describe('getTestIds', () => {
  describe('process.env.NODE_ENV === "test"', () => {
    let oldNodeEnv: string | undefined;
    let testIds: TestIdShape;
    let fooTestId: string;
    beforeAll(() => {
      oldNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      testIds = getTestIds();
    });
    afterAll(() => {
      process.env.NODE_ENV = oldNodeEnv;
    });
    it('does not return an empty object', () => {
      // it returns a Proxy object but since there isn't an easy way to test for it
      // the following tests will check for the Proxy functionality
      expect(testIds).not.toEqual({});
    });
    it('returns a generated test id when getting a property value', () => {
      fooTestId = testIds.foo;
      expect(fooTestId).toEqual(expect.stringContaining(TEST_ID_BASE));
    });
    it('returns the same id when getting the same property value', () => {
      expect(testIds.foo).toEqual(fooTestId);
    });
    it('returns a different id when getting a different property value', () => {
      expect(testIds.bar).toEqual(expect.stringContaining(TEST_ID_BASE));
      expect(testIds.bar).not.toEqual(fooTestId);
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
  });
});
