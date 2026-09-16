import { getChangedFields } from '../src/index.ts';

const makeComplexObject = () => ({
  a: 1,
  b: '2',
  c: { c1: {}, c2: [] },
  d: ['item1', 'item2', 'item2'],
  e() {
    /* empty */
  },
});
const complexObject = makeComplexObject();
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
        () => {
          /* empty */
        },
        () => {
          /* empty */
        },
      ),
    ).toEqual([]);
    expect(getChangedFields(new Date(), new Date())).toEqual([]);
  });
  it('One is not plainObject parameter', () => {
    expect(getChangedFields(1, complexObject)).toEqual(complexObjectKeys);
    expect(getChangedFields('1', complexObject)).toEqual(complexObjectKeys);
    expect(
      getChangedFields(() => {
        /* empty */
      }, complexObject),
    ).toEqual(complexObjectKeys);
    expect(getChangedFields(new Date(), complexObject)).toEqual(complexObjectKeys);

    expect(getChangedFields(complexObject, 1)).toEqual(complexObjectKeys);
    expect(getChangedFields(complexObject, '1')).toEqual(complexObjectKeys);
    expect(
      getChangedFields(complexObject, () => {
        /* empty */
      }),
    ).toEqual(complexObjectKeys);
    expect(getChangedFields(complexObject, new Date())).toEqual(complexObjectKeys);
  });
  it('Deep equal', () => {
    expect(getChangedFields(complexObject, complexObject)).toEqual([]);
    expect(getChangedFields(complexObject, makeComplexObject())).toEqual([]);
  });
  it('Change one field', () => {
    expect(getChangedFields(complexObject, { ...makeComplexObject(), a: 2 })).toEqual(['a']);
    expect(getChangedFields({ ...makeComplexObject(), a: 2 }, complexObject)).toEqual(['a']);
  });
  it('Change some fields', () => {
    expect(
      getChangedFields(complexObject, {
        a: 2,
        b: '3',
        c: { c1: {}, c2: [], c3: [] },
        d: ['item1', 'item2'],
        e() {
          /* empty */
        },
      }),
    ).toEqual(['a', 'b', 'c', 'd']);
    expect(
      getChangedFields(
        {
          a: 2,
          b: '3',
          c: { c1: {}, c2: [], c3: [] },
          d: ['item1', 'item2'],
          e() {
            /* empty */
          },
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
  describe('deep', () => {
    it('returns the path of the field that changed inside an array item', () => {
      const a = { items: [{ qux: '', corge: '' }] };
      const b = { items: [{ qux: 'a', corge: '' }] };
      expect(getChangedFields(a, b)).toEqual(['items']);
      expect(getChangedFields(a, b, true)).toEqual(['items.0.qux']);
    });
    it('returns the path of the field that changed inside a nested object', () => {
      const a = { outer: { inner: { one: 1, two: 2 } } };
      const b = { outer: { inner: { one: 1, two: 3 } } };
      expect(getChangedFields(a, b, true)).toEqual(['outer.inner.two']);
    });
    it('reports every field that changed', () => {
      const a = { items: [{ qux: '', corge: '' }, { qux: '' }], top: 1 };
      const b = { items: [{ qux: 'a', corge: 'b' }, { qux: '' }], top: 2 };
      expect(getChangedFields(a, b, true)).toEqual(['items.0.qux', 'items.0.corge', 'top']);
    });
    it('reports the array itself when its length changed', () => {
      const a = { items: [{ qux: '' }] };
      const b = { items: [{ qux: '' }, { qux: '' }] };
      expect(getChangedFields(a, b, true)).toEqual(['items']);
    });
    it('reports the index when the item that changed is not an object', () => {
      const a = { items: ['one', 'two'] };
      const b = { items: ['one', 'three'] };
      expect(getChangedFields(a, b, true)).toEqual(['items.1']);
    });
    it('stops where one side is no longer an object', () => {
      const a = { outer: { inner: 1 } };
      const b = { outer: 'gone' };
      expect(getChangedFields(a, b, true)).toEqual(['outer']);
    });
    it('descends into a key holding a dot, spelling the name out as part of the path', () => {
      const a = { 'has.dot': { inner: 1, other: 2 } };
      const b = { 'has.dot': { inner: 3, other: 2 } };
      expect(getChangedFields(a, b)).toEqual(['has.dot']);
      expect(getChangedFields(a, b, true)).toEqual(['has.dot.inner']);
    });
    it('descends into a key holding a bracket', () => {
      const a = { 'has[0]': { inner: 1, other: 2 } };
      const b = { 'has[0]': { inner: 3, other: 2 } };
      expect(getChangedFields(a, b, true)).toEqual(['has[0].inner']);
    });
    it('reports a key holding a dot whole when the difference cannot be narrowed', () => {
      const a = { 'has.dot': 1 };
      const b = { 'has.dot': 2 };
      expect(getChangedFields(a, b, true)).toEqual(['has.dot']);
    });
    it('leaves the shallow result alone', () => {
      expect(getChangedFields(complexObject, { ...makeComplexObject(), a: 2 }, true)).toEqual(['a']);
      expect(getChangedFields(undefined, complexObject, true)).toEqual(complexObjectKeys);
    });
  });
});
