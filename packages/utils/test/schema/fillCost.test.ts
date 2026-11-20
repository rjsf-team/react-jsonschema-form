import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../../src/index.ts';
import { getDefaultFormState, sanitizeDataForNewSchema } from '../../src/index.ts';
import type { FieldFill } from '../../src/types.ts';
import { miniValidator } from './graph/miniValidator.ts';

// Counted, so a test can count the fills the sanitize makes
const fieldFills = vi.hoisted(() => ({ count: 0 }));
vi.mock(import('../../src/schema/getDefaultFormState.ts'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fieldFillOf: <S extends StrictRJSFSchema, F extends FormContextType>(
      context: SchemaContext<S, F>,
      schema: S,
      rootSchema: S,
      fill: FieldFill,
    ) => {
      fieldFills.count += 1;
      return actual.fieldFillOf(context, schema, rootSchema, fill);
    },
  };
});

/** An object `depth` levels deep, `width` properties at each, its string leaves declaring `leaf`'s `default` */
function nested(depth: number, width: number, leaf: RJSFSchema = { type: 'string', default: 'x' }): RJSFSchema {
  if (depth === 0) {
    return leaf;
  }
  const properties: Record<string, RJSFSchema> = {};
  for (let index = 0; index < width; index += 1) {
    properties[`p${index}`] = nested(depth - 1, width, leaf);
  }
  return { type: 'object', properties, default: {} };
}

describe("the fills the sanitize reads a field's default by", () => {
  it('fills a form whose fields decide nothing from data once per side, however deep', () => {
    const context: SchemaContext = { validator: miniValidator() };
    const schema = nested(6, 3);
    const data = getDefaultFormState(context, { schema, rootSchema: schema });
    fieldFills.count = 0;

    expect(sanitizeDataForNewSchema(context, schema, structuredClone(schema), schema, data)).toEqual(data);
    expect(fieldFills.count).toBeLessThanOrEqual(2);
  });

  it.each<{ name: string; context: SchemaContext; schema: RJSFSchema }>([
    {
      name: 'its leaves declaring no default',
      context: { validator: miniValidator() },
      schema: nested(6, 3, { type: 'string' }),
    },
    {
      name: "emptyObjectFields: 'skipDefaults' leaving every property unwritten",
      context: { validator: miniValidator(), defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' } },
      schema: nested(6, 3),
    },
  ])('fills a deep form once per side with $name', ({ context, schema }) => {
    const data = getDefaultFormState(context, { schema, rootSchema: schema });
    fieldFills.count = 0;

    sanitizeDataForNewSchema(context, schema, structuredClone(schema), schema, data);
    expect(fieldFills.count).toBeLessThanOrEqual(2);
  });

  it('fills a field deciding from data by itself, beside the fill of each side', () => {
    const context: SchemaContext = { validator: miniValidator() };
    const branchy: RJSFSchema = {
      type: 'object',
      properties: {
        c: {
          type: 'string',
          if: { minLength: 1 },
          then: { default: 'then' },
          else: { default: 'else' },
        },
        plain: nested(3, 2),
      },
    };
    const data = { c: 'typed', plain: getDefaultFormState(context, { schema: nested(3, 2) }) };
    fieldFills.count = 0;

    sanitizeDataForNewSchema(context, branchy, structuredClone(branchy), branchy, data);
    expect(fieldFills.count).toBeLessThanOrEqual(4);
  });
});
