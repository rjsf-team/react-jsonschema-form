import type { RJSFSchema } from '../src/index.ts';

declare module 'json-schema' {
  interface JSONSchema7Discriminator {
    defaultMapping?: string;
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

  it('takes a field a schema declares on `discriminator` by augmenting it', () => {
    const schema: RJSFSchema = { discriminator: { propertyName: 'kind', defaultMapping: 'cat' } };

    expectTypeOf(schema.discriminator?.defaultMapping).toEqualTypeOf<string | undefined>();
    expectTypeOf({ discriminator: { propertyName: 'kind', defaultMapping: 5 } }).not.toExtend<RJSFSchema>();
  });
});
