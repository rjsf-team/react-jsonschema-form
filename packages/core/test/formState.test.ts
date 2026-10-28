import { toFieldPath } from '@rjsf/utils';

import { copyAlongPath } from '../src/components/dataPaths.ts';
import { shareData, toFormStatus } from '../src/components/formState.ts';

describe('copyAlongPath()', () => {
  it('copies the containers along the path and shares everything off it', () => {
    const data = { a: { b: { c: 1 } }, d: { e: 2 } };

    const copy = copyAlongPath(data, ['a', 'b', 'c']);

    expect(copy).toEqual(data);
    expect(copy).not.toBe(data);
    expect(copy.a).not.toBe(data.a);
    expect(copy.a.b).not.toBe(data.a.b);
    expect(copy.d).toBe(data.d);
  });

  it('leaves the prototype alone for a __proto__ segment the data does not hold as its own key', () => {
    const copy = copyAlongPath<Record<string, unknown>>({ s: 'a' }, ['__proto__', 'x']);

    expect(Object.getPrototypeOf(copy)).toBe(Object.prototype);
    expect(copy).toEqual({ s: 'a' });
  });

  it('copies a __proto__ property the data holds as its own key', () => {
    const data: Record<string, unknown> = JSON.parse('{"__proto__": {"x": "a"}}');

    const copy = copyAlongPath(data, ['__proto__', 'x']);

    expect(Object.getPrototypeOf(copy)).toBe(Object.prototype);
    expect(Object.hasOwn(copy, '__proto__')).toBe(true);
    expect(Object.getOwnPropertyDescriptor(copy, '__proto__')?.value).not.toBe(
      Object.getOwnPropertyDescriptor(data, '__proto__')?.value,
    );
  });
});

describe('shareData()', () => {
  it('compares only the members a change reached against the baseline', () => {
    let reads = 0;
    const counted = (row: { name: string }) =>
      new Proxy(row, {
        get(target, key) {
          reads += 1;
          const value: unknown = Reflect.get(target, key);
          return value;
        },
        ownKeys(target) {
          reads += 1;
          return Reflect.ownKeys(target);
        },
      });
    const baseline = { rows: Array.from({ length: 100 }, (_, index) => counted({ name: `row ${index}` })), note: 'a' };
    const start = { rows: baseline.rows.slice(1), note: 'a' };
    reads = 0;

    const shared = shareData({ formData: start, baseline }, { formData: { ...start, note: 'b' }, baseline });

    expect(reads).toBe(0);
    expect(shared.formData).toEqual({ rows: start.rows, note: 'b' });
    expect(shared.formData?.rows).toBe(start.rows);
    expect(shared.baseline).toBe(baseline);
  });

  it('hands back the baseline itself once a change makes the data equal to it', () => {
    const baseline = { name: 'Ada', address: { city: 'Oslo' } };
    const start = { name: 'Ada', address: { city: 'Rome' } };

    const shared = shareData(
      { formData: start, baseline },
      { formData: { ...start, address: { city: 'Oslo' } }, baseline },
    );

    expect(shared.formData).toBe(baseline);
  });

  it('keeps a null prototype and symbol-keyed members of the data where a change reached', () => {
    const marker = Symbol('marker');
    const baseline = { name: 'Ada', address: { city: 'Oslo' } };
    const start = { name: 'Ada', address: { city: 'Rome' } };
    const next = { name: 'Al', address: { city: 'Oslo' } };
    Object.setPrototypeOf(next, null);

    const shared = shareData({ formData: start, baseline }, { formData: next, baseline });

    expect(Object.getPrototypeOf(shared.formData)).toBeNull();
    expect(shared.formData).toEqual({ name: 'Al', address: baseline.address });
    expect(shared.formData?.address).toBe(baseline.address);

    const unmarked = { name: 'Ada' };
    const marked = shareData(
      { formData: { name: 'Al' }, baseline: unmarked },
      { formData: { name: 'Ada', [marker]: true }, baseline: unmarked },
    );

    expect(Reflect.get(Object(marked.formData), marker)).toBe(true);
  });
});

describe('toFormStatus()', () => {
  it('keeps a field touched whole marked true whatever is touched inside it, in either order', () => {
    const formData = { tags: { a: 1 } };
    const tags = toFieldPath('tags');
    const touchedFieldsOf = (...paths: ReturnType<typeof toFieldPath>[]) =>
      toFormStatus({ formData, baseline: formData, touchedPaths: new Set(paths) }, 0).touchedFields;

    expect(touchedFieldsOf(tags, toFieldPath('a', tags))).toEqual({ tags: true });
    expect(touchedFieldsOf(toFieldPath('a', tags), tags)).toEqual({ tags: true });
  });
});
