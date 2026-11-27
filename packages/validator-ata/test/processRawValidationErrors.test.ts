import type {
  ErrorSchema,
  FormValidation,
  RJSFSchema,
  RJSFValidationError,
  UiSchema,
  ValidatorType,
} from '@rjsf/utils';
import type { ValidationError } from 'ata-validator';

import { setupConsoleWarnSuppression } from '../../../testing/consoleSuppression.ts';
import customizeValidator from '../src/customizeValidator.ts';
import processRawValidationErrors, {
  filterDuplicateErrors,
  transformRJSFValidationErrors,
} from '../src/processRawValidationErrors.ts';

/** A minimal validator stub satisfies the `ValidatorType` slots that
 * `processRawValidationErrors` reaches through during default-form-state
 * resolution. Real ATAValidator behavior is exercised in `validator.test.ts`;
 * the cases here target the post-validation transformation surface only.
 */
const stubValidator = customizeValidator() as unknown as ValidatorType;

const ataError = (over: Partial<ValidationError> = {}): ValidationError => ({
  keyword: 'required',
  instancePath: '',
  schemaPath: '#/required',
  params: { missingProperty: 'name' },
  message: "must have required property 'name'",
  ...over,
});

describe('filterDuplicateErrors()', () => {
  it("returns the input unchanged when suppressDuplicateFiltering is 'all'", () => {
    const errs = [
      { name: 'type', message: 'a', schemaPath: '#/anyOf/0/type', stack: '', property: '' },
      { name: 'type', message: 'a', schemaPath: '#/anyOf/1/type', stack: '', property: '' },
    ];
    expect(filterDuplicateErrors(errs, 'all')).toEqual(errs);
  });

  it('collapses duplicate anyOf errors that share the same prefix', () => {
    const errs = [
      { name: 'type', message: 'must be string', schemaPath: '#/properties/x/anyOf/0/type', stack: '', property: '.x' },
      { name: 'type', message: 'must be string', schemaPath: '#/properties/x/anyOf/1/type', stack: '', property: '.x' },
    ];
    expect(filterDuplicateErrors(errs)).toHaveLength(1);
  });

  it('collapses duplicate oneOf errors that share the same prefix', () => {
    const errs = [
      { name: 'type', message: 'must be string', schemaPath: '#/properties/y/oneOf/0/type', stack: '', property: '.y' },
      { name: 'type', message: 'must be string', schemaPath: '#/properties/y/oneOf/1/type', stack: '', property: '.y' },
    ];
    expect(filterDuplicateErrors(errs)).toHaveLength(1);
  });

  it("keeps anyOf duplicates when suppressDuplicateFiltering is 'anyOf'", () => {
    const errs = [
      { name: 'type', message: 'a', schemaPath: '#/anyOf/0/type', stack: '', property: '' },
      { name: 'type', message: 'a', schemaPath: '#/anyOf/1/type', stack: '', property: '' },
    ];
    expect(filterDuplicateErrors(errs, 'anyOf')).toHaveLength(2);
  });

  it("keeps oneOf duplicates when suppressDuplicateFiltering is 'oneOf'", () => {
    const errs = [
      { name: 'type', message: 'a', schemaPath: '#/oneOf/0/type', stack: '', property: '' },
      { name: 'type', message: 'a', schemaPath: '#/oneOf/1/type', stack: '', property: '' },
    ];
    expect(filterDuplicateErrors(errs, 'oneOf')).toHaveLength(2);
  });

  it('keeps non-anyOf, non-oneOf errors as-is', () => {
    const errs = [
      { name: 'required', message: 'a', schemaPath: '#/required', stack: '', property: '' },
      { name: 'required', message: 'b', schemaPath: '#/required', stack: '', property: '' },
    ];
    expect(filterDuplicateErrors(errs)).toHaveLength(2);
  });
});

describe('transformRJSFValidationErrors()', () => {
  it('handles an empty error list', () => {
    expect(transformRJSFValidationErrors()).toEqual([]);
  });

  it('produces RJSF error shape from ata error shape', () => {
    const out = transformRJSFValidationErrors([ataError()]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      name: 'required',
      property: 'name',
      schemaPath: '#/required',
    });
  });

  it('handles error without a message field by defaulting to empty string', () => {
    // ata always populates `message`, but the destructure default exists for
    // resilience against transformErrors hooks that might strip it upstream.
    const errs = [
      { keyword: 'type', instancePath: '', schemaPath: '#/type', params: {} },
    ] as unknown as ValidationError[];
    const out = transformRJSFValidationErrors(errs);
    expect(out[0].message).toBe('');
  });

  it('replaces missingProperty with uiSchema title when available', () => {
    const errors: ValidationError[] = [
      ataError({
        instancePath: '',
        schemaPath: '#/required',
        params: { missingProperty: 'name' },
        message: "must have required property 'name'",
      }),
    ];
    const uiSchema: UiSchema = { name: { 'ui:title': 'Full Name' } };
    const out = transformRJSFValidationErrors(errors, uiSchema);
    expect(out[0].message).toContain('Full Name');
    expect(out[0].title).toBe('Full Name');
  });

  it('falls back to schemaPath-derived uiSchema title', () => {
    const errors: ValidationError[] = [
      ataError({
        instancePath: '',
        schemaPath: '#/properties/user/required',
        params: { missingProperty: 'name' },
      }),
    ];
    const uiSchema: UiSchema = { user: { name: { 'ui:title': 'User Name' } } };
    const out = transformRJSFValidationErrors(errors, uiSchema);
    expect(out[0].title).toBe('User Name');
  });

  it('falls back to parentSchema property title when uiSchema is empty', () => {
    const errors: ValidationError[] = [
      ataError({
        params: { missingProperty: 'name' },
        parentSchema: { properties: { name: { title: 'Schema Title' } } },
      }),
    ];
    const out = transformRJSFValidationErrors(errors);
    expect(out[0].title).toBe('Schema Title');
    expect(out[0].message).toContain('Schema Title');
  });

  it('falls back to uiSchema title via instance path when schemaPath contains non-property segments (e.g. allOf)', () => {
    const errors: ValidationError[] = [
      ataError({
        instancePath: '',
        schemaPath: '#/allOf/0/required',
        params: { missingProperty: 'animal' },
        message: "must have required property 'animal'",
        parentSchema: { required: ['animal'] },
      }),
    ];
    const uiSchema: UiSchema = { animal: { title: 'My animal uiSchema' } };
    const out = transformRJSFValidationErrors(errors, uiSchema);
    expect(out[0].title).toBe('My animal uiSchema');
    expect(out[0].message).toContain('My animal uiSchema');
  });

  it('falls back to root schema title when parentSchema lacks properties (e.g. allOf)', () => {
    const errors: ValidationError[] = [
      ataError({
        instancePath: '',
        schemaPath: '#/allOf/0/required',
        params: { missingProperty: 'animal' },
        message: "must have required property 'animal'",
        parentSchema: { required: ['animal'] },
      }),
    ];
    const schema: RJSFSchema = {
      type: 'object',
      properties: { animal: { title: 'My animal', enum: ['Cat', 'Fish'] } },
      allOf: [{ required: ['animal'] }],
    };
    const out = transformRJSFValidationErrors(errors, undefined, undefined, schema);
    expect(out[0].title).toBe('My animal');
    expect(out[0].message).toContain('My animal');
  });

  it('uses uiSchema title at the property level when params has no property names', () => {
    const errors: ValidationError[] = [
      {
        keyword: 'minLength',
        instancePath: '/email',
        schemaPath: '#/properties/email/minLength',
        params: { limit: 5 },
        message: 'must NOT have fewer than 5 characters',
      },
    ];
    const uiSchema: UiSchema = { email: { 'ui:title': 'Email Address' } };
    const out = transformRJSFValidationErrors(errors, uiSchema);
    expect(out[0].title).toBe('Email Address');
    expect(out[0].stack).toContain('Email Address');
  });

  it('uses parentSchema title at the property level when uiSchema is empty', () => {
    const errors: ValidationError[] = [
      {
        keyword: 'minLength',
        instancePath: '/email',
        schemaPath: '#/properties/email/minLength',
        params: { limit: 5 },
        message: 'must NOT have fewer than 5 characters',
        parentSchema: { title: 'Parent Email' },
      },
    ];
    const out = transformRJSFValidationErrors(errors);
    expect(out[0].title).toBe('Parent Email');
  });

  it('appends params.missingProperty into the property path when instancePath is non-empty', () => {
    const errors: ValidationError[] = [
      ataError({
        instancePath: '/user',
        schemaPath: '#/properties/user/required',
        params: { missingProperty: 'name' },
      }),
    ];
    const out = transformRJSFValidationErrors(errors);
    expect(out[0].property).toBe('.user.name');
  });

  it('uses just the missingProperty name when instancePath is empty', () => {
    const errors: ValidationError[] = [
      ataError({
        instancePath: '',
        schemaPath: '#/required',
        params: { missingProperty: 'top' },
      }),
    ];
    const out = transformRJSFValidationErrors(errors);
    expect(out[0].property).toBe('top');
  });

  it('names missing properties by titles holding `$` replacement patterns as written', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        fromUiSchema: { type: 'string' },
        fromParent: { type: 'string', title: "Parent ($')" },
        fromRoot: { type: 'string', title: 'Root ($`)' },
      },
      required: ['fromUiSchema', 'fromParent'],
      allOf: [{ required: ['fromRoot'] }],
    };
    const uiSchema: UiSchema = { fromUiSchema: { 'ui:title': 'UI ($&)' } };
    const { errors } = customizeValidator().validateFormData({}, schema, undefined, undefined, uiSchema);
    expect(errors.map(({ message }) => message)).toEqual([
      "must have required property 'UI ($&)'",
      "must have required property 'Parent ($')'",
      "must have required property 'Root ($`)'",
    ]);
  });

  it('handles params.deps as a comma-separated dependency list', () => {
    const errors: ValidationError[] = [
      {
        keyword: 'dependencies',
        instancePath: '',
        schemaPath: '#/dependencies',
        params: { deps: 'a, b' },
        message: "must have properties 'a', 'b' when 'x' is present",
      },
    ];
    const out = transformRJSFValidationErrors(errors);
    expect(out[0].name).toBe('dependencies');
  });

  describe('names a property under a $ref by its title', () => {
    const name = { type: 'string', title: 'Full name' } as const;
    const item: RJSFSchema = { type: 'object', properties: { name }, required: ['name'] };

    it.each<[string, RJSFSchema, unknown, string]>([
      [
        'a missing property',
        { $defs: { I: item }, type: 'object', properties: { a: { $ref: '#/$defs/I' } } },
        { a: {} },
        '.a.name',
      ],
      [
        'a missing property inside an array item',
        { $defs: { I: item }, type: 'object', properties: { arr: { type: 'array', items: { $ref: '#/$defs/I' } } } },
        { arr: [{}] },
        '.arr.0.name',
      ],
    ])('for %s', (_, schema, formData, property) => {
      const { errors } = customizeValidator().validateFormData(formData, schema);
      expect(errors.find((error) => error.property === property)).toEqual(
        expect.objectContaining({ title: 'Full name', message: "must have required property 'Full name'" }),
      );
    });

    it.each<[string, RJSFSchema, unknown, string]>([
      [
        'an error other than required',
        { $defs: { N: name }, type: 'object', properties: { a: { $ref: '#/$defs/N' } } },
        { a: 1 },
        '.a',
      ],
      [
        'an error under a chain of $refs',
        {
          $defs: { N: name, P: { type: 'object', properties: { n: { $ref: '#/$defs/N' } } } },
          type: 'object',
          properties: { a: { $ref: '#/$defs/P' } },
        },
        { a: { n: 1 } },
        '.a.n',
      ],
      [
        'an error under a $ref beside properties of its own',
        {
          $defs: { P: { type: 'object', properties: { n: name } } },
          type: 'object',
          properties: { a: { $ref: '#/$defs/P', properties: { extra: {} } } },
        },
        { a: { n: 1 } },
        '.a.n',
      ],
    ])('for %s', (_, schema, formData, property) => {
      const { errors } = customizeValidator().validateFormData(formData, schema);
      expect(errors.find((error) => error.property === property)).toEqual(
        expect.objectContaining({ title: 'Full name', stack: "'Full name' must be string" }),
      );
    });

    it('keeps the title the $ref schema gives itself', () => {
      const schema: RJSFSchema = {
        $defs: { N: name },
        type: 'object',
        properties: { a: { title: 'Wrapper', $ref: '#/$defs/N' } },
      };
      const { errors } = customizeValidator().validateFormData({ a: 1 }, schema);
      expect(errors[0]).toEqual(expect.objectContaining({ title: 'Wrapper', stack: "'Wrapper' must be string" }));
    });

    it('keeps the raw name of a missing property under a $ref to an $anchor', () => {
      const schema: RJSFSchema = {
        $defs: { I: { ...item, $anchor: 'i' } },
        type: 'object',
        properties: { a: { $ref: '#i' } },
      };
      const { errors } = customizeValidator().validateFormData({ a: {} }, schema);
      expect(errors[0]).toEqual(
        expect.objectContaining({ property: '.a.name', title: '', message: "must have required property 'name'" }),
      );
    });

    // ata leaves the `$ref` out of the path, so `/allOf/0` can name either list's first branch
    it('gives no title to an error under a $ref whose schema and target both hold an allOf', () => {
      const target: RJSFSchema = {
        type: 'object',
        allOf: [{ properties: { n: { type: 'string', title: 'Target' } } }],
      };
      const schema: RJSFSchema = {
        $defs: { T: target },
        type: 'object',
        properties: { a: { $ref: '#/$defs/T', allOf: [{ properties: { n: { title: 'Own' } } }] } },
      };
      const { errors } = customizeValidator().validateFormData({ a: { n: 5 } }, schema);
      expect(errors).toEqual([expect.objectContaining({ property: '.a.n', title: '', stack: '.a.n must be string' })]);
    });

    it.each<[string, RJSFSchema, unknown, string[]]>([
      [
        'an allOf',
        {
          $defs: { T: { type: 'object', allOf: [{ properties: { z: {} } }] } },
          type: 'object',
          properties: {
            a: {
              $ref: '#/$defs/T',
              allOf: [{ properties: { n: { type: 'string', title: 'Own' } }, required: ['n'] }],
            },
          },
        },
        { a: { n: 5 } },
        ['.a.n'],
      ],
      [
        'items',
        {
          $defs: { T: { type: 'array', items: { type: 'object' } } },
          type: 'object',
          properties: {
            a: { $ref: '#/$defs/T', items: { properties: { n: { type: 'string', title: 'Own' } }, required: ['n'] } },
          },
        },
        { a: [{ n: 5 }, {}] },
        ['.a.0.n', '.a.1.n'],
      ],
    ])(
      'names an error from the $ref schema’s own branch where its target also holds %s',
      (_, schema, formData, properties) => {
        const { errors } = customizeValidator().validateFormData(formData, schema);
        expect(errors.map((error) => [error.property, error.title])).toEqual(properties.map((p) => [p, 'Own']));
      },
    );

    it('names a property of an array item by the $ref schema’s title where it and its target both hold one items schema', () => {
      const schema: RJSFSchema = {
        $defs: {
          I: { type: 'object', properties: { n: { title: 'Target N', type: 'string' } } },
          T: { type: 'array', items: { type: 'object', properties: { n: { title: 'Target N', type: 'string' } } } },
          R: { type: 'array', items: { $ref: '#/$defs/I' } },
        },
        type: 'object',
        properties: {
          a: { $ref: '#/$defs/T', items: { properties: { n: { title: 'Own N' } } } },
          b: { $ref: '#/$defs/R', items: { properties: { n: { title: 'Own N' } } } },
        },
      };
      const { errors } = customizeValidator().validateFormData({ a: [{ n: 5 }], b: [{ n: 5 }] }, schema);
      expect(errors.map(({ property, title }) => ({ property, title }))).toEqual([
        { property: '.a.0.n', title: 'Own N' },
        { property: '.b.0.n', title: 'Own N' },
      ]);
    });

    it('names a property by the definition its $ref names in the resource that writes it, under a $ref schema redeclaring it', () => {
      const schema: RJSFSchema = {
        $id: 'https://example.com/root',
        $defs: {
          N: { type: 'string', title: 'Root N' },
          R: {
            $id: 'https://example.com/r',
            $defs: { N: { type: 'number', title: 'Res N' } },
            type: 'object',
            properties: { n: { $ref: '#/$defs/N' } },
          },
        },
        type: 'object',
        properties: { a: { $ref: 'https://example.com/r', properties: { n: { description: 'd' } } } },
      };
      const { errors } = customizeValidator().validateFormData({ a: { n: 'x' } }, schema);
      expect(errors.map(({ property, title }) => ({ property, title }))).toEqual([
        { property: '.a.n', title: 'Res N' },
      ]);
    });

    it('names a tuple position by the $ref schema’s title where it and its target both hold prefixItems', () => {
      const schema: RJSFSchema = {
        $defs: { T: { type: 'array', prefixItems: [{ type: 'string', title: 'T0' }] } },
        type: 'object',
        properties: { a: { $ref: '#/$defs/T', prefixItems: [{ title: 'Own 0' }] } },
      };
      const { errors } = customizeValidator().validateFormData({ a: [5] }, schema);
      expect(errors.map(({ property, title }) => ({ property, title }))).toEqual([
        { property: '.a.0', title: 'Own 0' },
      ]);
    });

    it('keeps the $ref schema’s own title where merging it with its target fails', () => {
      const schema: RJSFSchema = {
        $defs: { N: { type: 'number', title: 'N' }, J: { $ref: '#/$defs/N' } },
        type: 'object',
        properties: { a: { $ref: '#/$defs/J', type: 'string', title: 'Wrapper' } },
      };
      const { errors } = customizeValidator().validateFormData({ a: true }, schema);
      expect(errors.map(({ title }) => title)).toEqual(['Wrapper', 'Wrapper']);
    });

    it('names an error from the target’s allOf branch, or of a keyword only the target holds, where merging fails', () => {
      const schema: RJSFSchema = {
        $defs: {
          T: { type: 'number', title: 'T', allOf: [{ title: 'T0', minimum: 5 }] },
          O: { type: 'object', title: 'O', additionalProperties: false },
        },
        type: 'object',
        properties: {
          a: { $ref: '#/$defs/T', type: 'string', title: 'W' },
          b: { $ref: '#/$defs/O', type: 'array', title: 'W' },
        },
      };
      const { errors } = customizeValidator().validateFormData({ a: 3, b: { z: 1 } }, schema);
      expect(errors.map(({ name, title }) => [name, title])).toEqual(
        expect.arrayContaining([
          ['minimum', 'T0'],
          ['additionalProperties', 'W'],
        ]),
      );
    });

    it('names errors by the target’s titles where merging drops a key the $ref schema holds', () => {
      const schema: RJSFSchema = {
        $defs: {
          T: {
            type: 'object',
            title: 'T',
            properties: { n: { type: 'string', title: 'N title' } },
            required: ['n'],
            minProperties: 2,
          },
          P: { type: 'array', title: 'Pair', prefixItems: [{ type: 'string' }], minItems: 2 },
        },
        type: 'object',
        properties: {
          a: { $ref: '#/$defs/T', patternProperties: {} },
          b: { $ref: '#/$defs/P', additionalItems: false },
        },
      };
      const { errors } = customizeValidator().validateFormData({ a: {}, b: ['x'] }, schema);
      expect(errors.map(({ property, title }) => ({ property, title }))).toEqual(
        expect.arrayContaining([
          { property: '.a.n', title: 'N title' },
          { property: '.a', title: 'T' },
          { property: '.b', title: 'Pair' },
        ]),
      );
    });

    it('names an error from an allOf branch further along a $ref chain whose merge fails there', () => {
      const schema: RJSFSchema = {
        $defs: {
          T: { $ref: '#/$defs/U', type: 'string', title: 'T' },
          U: { type: 'number', title: 'U', allOf: [{ title: 'U0', minimum: 5 }] },
        },
        type: 'object',
        properties: { a: { $ref: '#/$defs/T', title: 'W' } },
      };
      const { errors } = customizeValidator().validateFormData({ a: 3 }, schema);
      expect(errors.find(({ name }) => name === 'minimum')?.title).toBe('U0');
    });

    it('names a missing property from the $ref schema’s own allOf branch where its target also holds one', () => {
      const schema: RJSFSchema = {
        $defs: { T: { type: 'object', allOf: [{ properties: { z: {} } }] } },
        type: 'object',
        properties: {
          a: { $ref: '#/$defs/T', allOf: [{ properties: { n: { type: 'string', title: 'Own' } }, required: ['n'] }] },
        },
      };
      const { errors } = customizeValidator().validateFormData({ a: {} }, schema);
      expect(errors).toEqual([expect.objectContaining({ property: '.a.n', title: 'Own' })]);
    });

    it('names an error from the $ref schema’s own allOf branch whose keyword differs from the one its path ends at', () => {
      const schema: RJSFSchema = {
        $defs: { T: { type: 'object', allOf: [{ properties: { z: {} } }] }, U: { allOf: [{}] } },
        type: 'object',
        properties: {
          a: {
            $ref: '#/$defs/T',
            allOf: [{ properties: { p: {}, q: { title: 'Q' } }, dependentRequired: { p: ['q'] } }],
          },
          b: { $ref: '#/$defs/U', allOf: [{ title: 'Own0', enum: [1], if: { const: 3 }, then: false }] },
        },
      };
      const { errors } = customizeValidator().validateFormData({ a: { p: 1 }, b: 3 }, schema);
      expect(errors.find(({ schemaPath }) => schemaPath?.endsWith('/dependentRequired'))).toEqual(
        expect.objectContaining({ property: '.a.q', title: 'Q' }),
      );
      expect(errors.find(({ schemaPath }) => schemaPath?.endsWith('/then'))?.title).toBe('Own0');
    });

    describe('where the $ref schema cannot be merged with its target', () => {
      // Merging warns that the two `n` schemas conflict, then falls back to an `allOf` of both
      setupConsoleWarnSuppression();

      it('names a missing property from the $ref schema’s own allOf branch', () => {
        const schema: RJSFSchema = {
          $defs: { T: { type: 'object', minProperties: 1, properties: { n: { type: 'number' } } } },
          type: 'object',
          properties: {
            a: {
              $ref: '#/$defs/T',
              properties: { n: { type: 'string', title: 'WrapperN' } },
              allOf: [{ properties: { n: { title: 'BranchN' } }, required: ['n'] }],
            },
          },
        };
        const { errors } = customizeValidator().validateFormData({ a: {} }, schema);
        expect(errors.find((error) => error.property === '.a.n')).toEqual(
          expect.objectContaining({ title: 'BranchN' }),
        );
      });
    });
  });

  it('gives no title to an error under a false property beside a property named title', () => {
    const schema: RJSFSchema = { title: 'Root', type: 'object', properties: { x: false, title: { type: 'string' } } };
    const { errors } = customizeValidator().validateFormData({ x: 1 }, schema);
    expect(errors).toEqual([
      expect.objectContaining({ property: '.x', title: '', stack: expect.stringMatching(/^\.x /) }),
    ]);
  });
});

describe('processRawValidationErrors()', () => {
  const schema: RJSFSchema = { type: 'object', properties: { x: { type: 'string' } } };

  it('returns errors and an errorSchema for normal validation failures', () => {
    const out = processRawValidationErrors({ validator: stubValidator }, { errors: [ataError()] }, undefined, schema);
    expect(out.errors.length).toBeGreaterThan(0);
    expect(out.errorSchema).toBeDefined();
  });

  it('appends the validationError message to the error list', () => {
    const compileErr = new Error('schema invalid');
    const out = processRawValidationErrors(
      { validator: stubValidator },
      { errors: [], validationError: compileErr },
      undefined,
      schema,
    );
    expect(out.errors[out.errors.length - 1].stack).toBe('schema invalid');
    expect((out.errorSchema as ErrorSchema & { $schema?: { __errors?: string[] } }).$schema?.__errors).toEqual([
      'schema invalid',
    ]);
  });

  it('runs the transformErrors hook and returns transformed output', () => {
    const transform = vi.fn((errs: RJSFValidationError[]) => errs.map((e) => ({ ...e, message: 'transformed' })));
    const out = processRawValidationErrors(
      { validator: stubValidator },
      { errors: [ataError()] },
      undefined,
      schema,
      undefined,
      transform,
    );
    expect(transform).toHaveBeenCalled();
    expect(out.errors[0].message).toBe('transformed');
  });

  it('runs the customValidate hook and merges the user errorSchema', () => {
    const customValidate = vi.fn((_data: unknown, errorHandler: FormValidation<{ x?: string }>) => {
      errorHandler.x?.addError('user error');
      return errorHandler;
    });
    const out = processRawValidationErrors(
      { validator: stubValidator },
      { errors: [] },
      { x: 'a' },
      schema,
      customValidate,
    );
    expect(customValidate).toHaveBeenCalled();
    expect((out.errorSchema.x as ErrorSchema & { __errors?: string[] }).__errors).toContain('user error');
  });
});
