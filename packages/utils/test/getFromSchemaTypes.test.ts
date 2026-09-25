import type { StrictRJSFSchema, ValidatorType } from '../src/index.ts';
import { getFromSchema } from '../src/index.ts';

interface Data {
  name: string;
  age: number;
}

describe('getFromSchema type', () => {
  it('resolves explicit type arguments with a schema default to the overload that returns the schema', () => {
    const getSchema = (validator: ValidatorType<StrictRJSFSchema>) =>
      getFromSchema<Data, StrictRJSFSchema>(validator, {}, {}, 'name', {} as StrictRJSFSchema);

    expectTypeOf(getSchema).returns.toEqualTypeOf<StrictRJSFSchema>();
  });
});
