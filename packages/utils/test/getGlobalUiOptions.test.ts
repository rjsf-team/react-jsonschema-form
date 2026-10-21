import type { GlobalUISchemaOptions, Registry } from '../src/index.ts';
import { getGlobalUiOptions } from '../src/index.ts';

describe('getGlobalUiOptions()', () => {
  it("returns the registry's globalUiOptions typed with the extensions it is given", () => {
    const globalUiOptions: GlobalUISchemaOptions<{ myKey: number }> = { label: false, myKey: 1 };
    const registry: Pick<Registry, 'globalUiOptions'> = { globalUiOptions };

    const options = getGlobalUiOptions<{ myKey: number }>(registry);

    expect(options).toBe(globalUiOptions);
    expectTypeOf(options).toEqualTypeOf<GlobalUISchemaOptions<{ myKey: number }> | undefined>();
  });
  it('returns undefined for a registry with none', () => {
    expect(getGlobalUiOptions({})).toBeUndefined();
  });
});
