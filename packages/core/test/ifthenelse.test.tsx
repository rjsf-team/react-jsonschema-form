import type { RJSFSchema } from '@rjsf/utils';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { createFormComponent, expectToHaveBeenCalledWithFormData, submitForm } from './testUtils.tsx';

const user = userEvent.setup();

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    street_address: {
      type: 'string',
    },
    country: {
      enum: ['United States of America', 'Canada'],
    },
  },
  if: {
    properties: { country: { const: 'United States of America' } },
  },
  then: {
    properties: { zipcode: { type: 'string' } },
  },
  else: {
    properties: { postal_code: { type: 'string' } },
  },
};

const schemaWithRef: RJSFSchema = {
  type: 'object',
  properties: {
    country: {
      enum: ['United States of America', 'Canada'],
    },
  },
  if: {
    properties: {
      country: {
        const: 'United States of America',
      },
    },
  },
  then: {
    $ref: '#/definitions/us',
  },
  else: {
    $ref: '#/definitions/other',
  },
  definitions: {
    us: {
      properties: {
        zip_code: {
          type: 'string',
        },
      },
    },
    other: {
      properties: {
        postal_code: {
          type: 'string',
        },
      },
    },
  },
};

describe('conditional items', () => {
  it('should render then when condition is true', () => {
    const formData = {
      country: 'United States of America',
    };

    const { node } = createFormComponent({
      schema,
      initialFormData: formData,
    });

    expect(node.querySelector('input#root_zipcode')).not.toBeNull();
    expect(node.querySelector('input#root_postal_code')).toBeNull();
  });

  it('should render else when condition is false', () => {
    const formData = {
      country: 'France',
    };

    const { node } = createFormComponent({
      schema,
      initialFormData: formData,
    });

    expect(node.querySelector('input#root_zipcode')).toBeNull();
    expect(node.querySelector('input#root_postal_code')).not.toBeNull();
  });

  it('should render control when data has not been filled in', () => {
    const formData = {};

    const { node } = createFormComponent({
      schema,
      initialFormData: formData,
    });

    // An empty formData will make the conditional evaluate to true because no properties are required in the if statement
    // Please see https://github.com/epoberezkin/ajv/issues/913
    expect(node.querySelector('input#root_zipcode')).not.toBeNull();
    expect(node.querySelector('input#root_postal_code')).toBeNull();
  });

  it('should render then when condition is true with reference', () => {
    const formData = {
      country: 'United States of America',
    };

    const { node } = createFormComponent({
      schema: schemaWithRef,
      initialFormData: formData,
    });

    expect(node.querySelector('input#root_zip_code')).not.toBeNull();
    expect(node.querySelector('input#root_postal_code')).toBeNull();
  });

  it('should render else when condition is false with reference', () => {
    const formData = {
      country: 'France',
    };

    const { node } = createFormComponent({
      schema: schemaWithRef,
      initialFormData: formData,
    });

    expect(node.querySelector('input#root_zip_code')).toBeNull();
    expect(node.querySelector('input#root_postal_code')).not.toBeNull();
  });

  describe('allOf if then else', () => {
    const schemaWithAllOf: RJSFSchema = {
      type: 'object',
      properties: {
        street_address: {
          type: 'string',
        },
        country: {
          enum: ['United States of America', 'Canada', 'United Kingdom', 'France'],
        },
      },
      allOf: [
        {
          if: {
            properties: { country: { const: 'United States of America' } },
          },
          then: {
            properties: { zipcode: { type: 'string' } },
          },
        },
        {
          if: {
            properties: { country: { const: 'United Kingdom' } },
          },
          then: {
            properties: { postcode: { type: 'string' } },
          },
        },
        {
          if: {
            properties: { country: { const: 'France' } },
          },
          then: {
            properties: { telephone: { type: 'string' } },
          },
        },
      ],
    };

    it('should render correctly when condition is true in allOf (1)', () => {
      const formData = {
        country: 'United States of America',
      };

      const { node } = createFormComponent({
        schema: schemaWithAllOf,
        initialFormData: formData,
      });

      expect(node.querySelector('input#root_zipcode')).not.toBeNull();
    });

    it('should render correctly when condition is false in allOf (1)', () => {
      const formData = {
        country: '',
      };

      const { node } = createFormComponent({
        schema: schemaWithAllOf,
        initialFormData: formData,
      });

      expect(node.querySelector('input#root_zipcode')).toBeNull();
    });

    it('should render correctly when condition is true in allof (2)', () => {
      const formData = {
        country: 'United Kingdom',
      };

      const { node } = createFormComponent({
        schema: schemaWithAllOf,
        initialFormData: formData,
      });

      expect(node.querySelector('input#root_postcode')).not.toBeNull();
      expect(node.querySelector('input#root_zipcode')).toBeNull();
      expect(node.querySelector('input#root_telephone')).toBeNull();
    });

    it('should render correctly when condition is true in allof (3)', () => {
      const formData = {
        country: 'France',
      };

      const { node } = createFormComponent({
        schema: schemaWithAllOf,
        initialFormData: formData,
      });

      expect(node.querySelector('input#root_postcode')).toBeNull();
      expect(node.querySelector('input#root_zipcode')).toBeNull();
      expect(node.querySelector('input#root_telephone')).not.toBeNull();
    });

    const schemaWithAllOfRef: RJSFSchema = {
      type: 'object',
      properties: {
        street_address: {
          type: 'string',
        },
        country: {
          enum: ['United States of America', 'Canada', 'United Kingdom', 'France'],
        },
      },
      definitions: {
        unitedkingdom: {
          properties: { postcode: { type: 'string' } },
        },
      },
      allOf: [
        {
          if: {
            properties: { country: { const: 'United Kingdom' } },
          },
          then: {
            $ref: '#/definitions/unitedkingdom',
          },
        },
      ],
    };

    it('should render correctly when condition is true when then contains a reference', () => {
      const formData = {
        country: 'United Kingdom',
      };

      const { node } = createFormComponent({
        schema: schemaWithAllOfRef,
        initialFormData: formData,
      });

      expect(node.querySelector('input#root_postcode')).not.toBeNull();
    });
  });

  it('handles additionalProperties with if then else', () => {
    /**
     * Ensures that fields defined in "then" or "else" (e.g. zipcode) are handled
     * with regular form fields, not as additional properties
     */

    const formData = {
      country: 'United States of America',
      zipcode: '12345',
      otherKey: 'otherValue',
    };
    const { node } = createFormComponent({
      schema: {
        ...schema,
        additionalProperties: true,
      },
      initialFormData: formData,
    });

    // The zipcode field exists, but not as an additional property
    expect(node.querySelector('input#root_zipcode')).not.toBeNull();
    expect(node.querySelector('.rjsf-additional-property input#root_zipcode')).toBeNull();

    // The "otherKey" field exists as an additional property
    expect(node.querySelector('.rjsf-additional-property input#root_otherKey')).not.toBeNull();
  });

  it('re-resolves the conditional branch when a field with a default is cleared', async () => {
    const conditionalOnPresence: RJSFSchema = {
      type: 'object',
      properties: {
        a: { type: 'string', default: 'x' },
      },
      if: { required: ['a'] },
      then: { properties: { b: { type: 'string' } } },
    };
    const { node } = createFormComponent({ schema: conditionalOnPresence });

    expect(node.querySelector('#root_b')).not.toBeNull();

    await user.clear(node.querySelector<HTMLInputElement>('#root_a')!);

    expect(node.querySelector('#root_b')).toBeNull();
  });
});

describe("an empty field's then/else const (#5895)", () => {
  it.each<[string, RJSFSchema, unknown]>([
    [
      "fills an object field from the then of its allOf member under allOf: 'skipDefaults', and submits it",
      { type: 'object', allOf: [{ if: { type: 'object' }, then: { const: { a: 1, b: 2 } } }] },
      { a: 1, b: 2 },
    ],
    [
      'fills a number field from the then of its allOf member whose if is {}, and submits it',
      { type: 'number', allOf: [{ if: {}, then: { const: 3 } }] },
      3,
    ],
  ])('%s', async (_name, x, filled) => {
    const { node, onSubmit, onError } = createFormComponent({
      schema: { type: 'object', required: ['x'], properties: { x } },
    });
    await submitForm(node, user);
    expect(onError).not.toHaveBeenCalled();
    expectToHaveBeenCalledWithFormData(onSubmit, { x: filled }, true);
  });
});

describe('null data checked as null for an if (#5916)', () => {
  const x: RJSFSchema = {
    type: ['number', 'null'],
    default: null,
    if: { type: 'null' },
    then: { const: null, title: 'Then' },
    else: { const: 3, title: 'Else' },
  };
  const label = (node: Element) => node.querySelector('label')?.textContent;

  it.each<[string, RJSFSchema, unknown, unknown]>([
    ['as a property starting from its null default', { type: 'object', properties: { x } }, undefined, { x: null }],
    ['as a property holding null form data', { type: 'object', properties: { x } }, { x: null }, { x: null }],
    ['at the root starting from its null default', x, undefined, null],
    ['at the root holding null form data', x, null, null],
  ])('renders and submits the then %s', async (_name, schema, formData, submitted) => {
    const { node, onSubmit, onError } = createFormComponent({ schema, formData });
    expect(label(node)).toMatch(/^Then/);
    await submitForm(node, user);
    expect(onError).not.toHaveBeenCalled();
    expectToHaveBeenCalledWithFormData(onSubmit, submitted, true);
  });

  it('renders the then once the user clears a field to null', async () => {
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          x: { type: ['number', 'null'], if: { type: 'null' }, then: { title: 'Then' }, else: { title: 'Else' } },
        },
      },
      uiSchema: { x: { 'ui:emptyValue': null } },
      formData: { x: 5 },
    });
    expect(label(node)).toMatch(/^Else/);
    await user.clear(screen.getByRole('textbox'));
    expectToHaveBeenCalledWithFormData(onChange, { x: null }, 'root_x');
    expect(label(node)).toMatch(/^Then/);
  });

  it('renders and submits the then an if of only object keywords picks for a root holding null form data', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      if: { required: ['a'] },
      then: { properties: { a: { type: 'number', title: 'A', default: 1 } } },
    };
    const { node, onSubmit, onError } = createFormComponent({ schema, formData: null });
    expect(screen.getByRole('textbox', { name: 'A' })).toHaveValue('1');
    await submitForm(node, user);
    expect(onError).not.toHaveBeenCalled();
    expectToHaveBeenCalledWithFormData(onSubmit, { a: 1 }, true);
  });

  it('renders the else default on the first render once the fill puts {} over a root holding null form data', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      if: { required: ['a'] },
      then: { properties: { a: { type: 'number', title: 'A' } } },
      else: { properties: { c: { type: 'number', title: 'C', default: 2 } } },
    };
    const { node, onSubmit, onError } = createFormComponent({ schema, formData: null });
    expect(screen.getByRole('textbox', { name: 'C' })).toHaveValue('2');
    await submitForm(node, user);
    expect(onError).not.toHaveBeenCalled();
    expectToHaveBeenCalledWithFormData(onSubmit, { c: 2 }, true);
  });

  it('titles a nullable string by the if its null default meets', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          s: {
            type: ['string', 'null'],
            default: null,
            if: { const: null },
            then: { title: 'Null' },
            else: { title: 'Text' },
          },
        },
      },
    });
    expect(label(node)).toMatch(/^Null/);
  });
});
