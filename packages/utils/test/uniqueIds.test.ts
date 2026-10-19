import uniqueIds from '../src/uniqueIds.ts';

describe('uniqueIds()', () => {
  it('returns no ids for none', () => {
    expect(uniqueIds([])).toEqual([]);
  });

  it('keeps distinct ids in order', () => {
    expect(uniqueIds(['root__error', 'root__description', 'root__help'])).toEqual([
      'root__error',
      'root__description',
      'root__help',
    ]);
  });

  it('keeps each repeated id once, where it first appears', () => {
    expect(uniqueIds(['root__description', 'root__help', 'root__description', 'root__help'])).toEqual([
      'root__description',
      'root__help',
    ]);
  });

  it('drops empty ids', () => {
    expect(uniqueIds(['', 'root__description', '', 'root__help'])).toEqual(['root__description', 'root__help']);
  });

  it("doesn't change the ids it is given", () => {
    const ids = Object.freeze(['root__help', '', 'root__help']);
    uniqueIds(ids);
    expect(ids).toEqual(['root__help', '', 'root__help']);
  });
});
