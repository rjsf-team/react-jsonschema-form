import { SHARED_COPY_ID, sharedCopyParts } from '../src/index.ts';

describe('sharedCopyParts()', () => {
  const id = `${SHARED_COPY_ID}h`;
  it('lists the entries of the definitions and $defs at the top whose $id starts with SHARED_COPY_ID', () => {
    const part = { $id: id, type: 'string' };
    const other = { $id: `${SHARED_COPY_ID}k`, type: 'number' };
    const definitions = {
      h: part,
      named: { $id: 'other.json' },
      plain: { type: 'number' },
      no: false,
      count: { $id: 1 },
    };
    const $defs = { k: other };
    expect(sharedCopyParts({ definitions, $defs, properties: { kept: { $id: id } } })).toEqual([
      { container: '$defs', held: $defs, name: 'k', id: `${SHARED_COPY_ID}k`, part: other },
      { container: 'definitions', held: definitions, name: 'h', id, part },
    ]);
  });
  it('finds none in a schema that is no object or holds no container object', () => {
    expect(sharedCopyParts(true)).toEqual([]);
    expect(sharedCopyParts({ definitions: [{ $id: id }] })).toEqual([]);
    expect(sharedCopyParts({ type: 'string' })).toEqual([]);
  });
});
