import { getChangedFields } from '../src';
import cloneDeep from 'lodash/cloneDeep';

const complexObject = {
  a: 1,
  b: '2',
  c: { c1: {}, c2: [] },
  d: ['item1', 'item2', 'item2'],
  e: function () {},
};
const complexObjectKeys = ['a', 'b', 'c', 'd', 'e'];

describe('getChangedFields()', () => {
  it('Empty parameter', () => {
    expect(getChangedFields(undefined, undefined)).toEqual([]);
    expect(getChangedFields(complexObject, undefined)).toEqual(complexObjectKeys);
    expect(getChangedFields(undefined, complexObject)).toEqual(complexObjectKeys);
  });
  it('Both not plainObject parameter', () => {
    expect(getChangedFields(1, 2)).toEqual([]);
    expect(getChangedFields(2, '1')).toEqual([]);
    expect(
      getChangedFields(
        function a() {},
        function b() {},
      ),
    ).toEqual([]);
    expect(getChangedFields(new Date(), new Date())).toEqual([]);
  });
  it('One is not plainObject parameter', () => {
    expect(getChangedFields(1, complexObject)).toEqual(complexObjectKeys);
    expect(getChangedFields('1', complexObject)).toEqual(complexObjectKeys);
    expect(getChangedFields(function noop() {}, complexObject)).toEqual(complexObjectKeys);
    expect(getChangedFields(new Date(), complexObject)).toEqual(complexObjectKeys);

    expect(getChangedFields(complexObject, 1)).toEqual(complexObjectKeys);
    expect(getChangedFields(complexObject, '1')).toEqual(complexObjectKeys);
    expect(getChangedFields(complexObject, function noop() {})).toEqual(complexObjectKeys);
    expect(getChangedFields(complexObject, new Date())).toEqual(complexObjectKeys);
  });
  it('Deep equal', () => {
    expect(getChangedFields(complexObject, complexObject)).toEqual([]);
    expect(getChangedFields(complexObject, cloneDeep(complexObject))).toEqual([]);
  });
  it('Change one field', () => {
    expect(getChangedFields(complexObject, { ...cloneDeep(complexObject), a: 2 })).toEqual(['a']);
    expect(getChangedFields({ ...cloneDeep(complexObject), a: 2 }, complexObject)).toEqual(['a']);
  });
  it('Change some fields', () => {
    expect(
      getChangedFields(complexObject, {
        a: 2,
        b: '3',
        c: { c1: {}, c2: [], c3: [] },
        d: ['item1', 'item2'],
        e: function () {},
      }),
    ).toEqual(['a', 'b', 'c', 'd']);
    expect(
      getChangedFields(
        {
          a: 2,
          b: '3',
          c: { c1: {}, c2: [], c3: [] },
          d: ['item1', 'item2'],
          e: function () {},
        },
        complexObject,
      ),
    ).toEqual(['a', 'b', 'c', 'd']);
  });
  it('Delete one field', () => {
    expect(
      getChangedFields(complexObject, {
        a: 1,
        b: '2',
        c: { c1: {}, c2: [] },
        d: ['item1', 'item2', 'item2'],
      }),
    ).toEqual(['e']);
    expect(
      getChangedFields(
        {
          a: 1,
          b: '2',
          c: { c1: {}, c2: [] },
          d: ['item1', 'item2', 'item2'],
        },
        complexObject,
      ),
    ).toEqual(['e']);
  });
  it('Delete some fields', () => {
    expect(
      getChangedFields(complexObject, {
        a: 1,
        b: '2',
        c: { c1: {}, c2: [] },
      }),
    ).toEqual(['d', 'e']);
    expect(
      getChangedFields(
        {
          a: 1,
          b: '2',
          c: { c1: {}, c2: [] },
        },
        complexObject,
      ),
    ).toEqual(['d', 'e']);
  });
  it('Add one field', () => {
    expect(
      getChangedFields(complexObject, {
        ...complexObject,
        f: {},
      }),
    ).toEqual(['f']);
    expect(
      getChangedFields(
        {
          ...complexObject,
          f: {},
        },
        complexObject,
      ),
    ).toEqual(['f']);
  });
  it('Add some fields', () => {
    expect(
      getChangedFields(complexObject, {
        ...complexObject,
        f: {},
        g: [],
      }),
    ).toEqual(['f', 'g']);
    expect(
      getChangedFields(
        {
          ...complexObject,
          f: {},
          g: [],
        },
        complexObject,
      ),
    ).toEqual(['f', 'g']);
  });
});
