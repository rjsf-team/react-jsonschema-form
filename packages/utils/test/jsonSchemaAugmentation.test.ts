import type { RJSFSchema } from '../src/index.ts';

// The program type-checks every package's `src` with this declaration in scope, so the field carries a name no `src`
// could mistake for one a real schema has
declare module 'json-schema' {
  interface JSONSchema7Discriminator {
    'x-test-only-augmentation'?: string;
  }
}

interface Components {
  schemas?: Record<string, RJSFSchema>;
}

interface Messages {
  required?: string;
}

describe('the keywords @rjsf/utils declares on JSONSchema7', () => {
  it('takes `components` and `errorMessage` held in a value of an interface type', () => {
    const components: Components = { schemas: { name: { type: 'string' } } };
    const errorMessage: Messages = { required: 'Enter a name' };

    expectTypeOf({ components, errorMessage }).toExtend<RJSFSchema>();
    expectTypeOf({ components: 5 }).not.toExtend<RJSFSchema>();
    expectTypeOf({ errorMessage: 5 }).not.toExtend<RJSFSchema>();
  });

  it("takes Ajv's `nullable` as a boolean", () => {
    const schema: RJSFSchema = { type: 'string', nullable: true };

    expectTypeOf(schema.nullable).toEqualTypeOf<boolean | undefined>();
    expectTypeOf({ nullable: 'yes' }).not.toExtend<RJSFSchema>();
  });

  it('takes a field a schema declares on `discriminator` by augmenting it', () => {
    const schema: RJSFSchema = { discriminator: { propertyName: 'kind', 'x-test-only-augmentation': 'cat' } };

    expectTypeOf(schema.discriminator?.['x-test-only-augmentation']).toEqualTypeOf<string | undefined>();
    expectTypeOf({ discriminator: { propertyName: 'kind', 'x-test-only-augmentation': 5 } }).not.toExtend<RJSFSchema>();
  });
});
