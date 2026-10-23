import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { bracketNameGenerator, dotNotationNameGenerator } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

const titleAndDesc = {
  title: 'Test field',
  description: 'a test description',
};

const uiTitleAndDesc: UiSchema = {
  'ui:options': {
    title: 'My Field',
    description: 'a fancier description',
  },
  a: {
    'ui:options': {
      title: 'My Item A',
      description: 'a fancier item A description',
    },
  },
  b: {
    'ui:options': {
      title: 'My Item B',
      description: 'a fancier item B description',
    },
  },
};

const labelsOff: UiSchema = {
  'ui:globalOptions': { label: false },
};

export function objectTests(Form: ComponentType<FormProps>) {
  describe('object fields', () => {
    test('object', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          a: { type: 'string', title: 'A' },
          b: { type: 'number', title: 'B' },
        },
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('additionalProperties', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: true,
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} initialFormData={{ foo: 'foo' }} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('additionalProperties, label off', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: true,
      };
      const uiSchema: UiSchema = {
        'ui:label': false,
      };
      const { asFragment } = render(
        <Form schema={schema} uiSchema={uiSchema} validator={validator} initialFormData={{ foo: 'foo' }} />,
      );
      expect(asFragment()).toMatchSnapshot();
    });
    test('additionalProperties, description', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: {
          type: 'string',
          description: 'item description',
        },
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} initialFormData={{ foo: 'foo' }} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('additionalProperties, object type', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
          },
        },
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} initialFormData={{ foo: 'foo' }} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('additionalProperties, array type', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} initialFormData={{ foo: 'foo' }} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('additionalProperties, propertyNames enum', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: { type: 'string' },
        propertyNames: { enum: ['foo', 'bar', 'baz'] },
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} initialFormData={{ foo: 'foo' }} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('additionalProperties with a description, propertyNames enum', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: { type: 'string', description: 'A description' },
        propertyNames: { enum: ['foo', 'bar', 'baz'] },
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} initialFormData={{ foo: 'foo' }} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('deprecated additionalProperties, propertyNames enum', async () => {
      // `deprecatedHandling` defaults to `label`, so every theme's key control has to take the key from `keyName`
      // rather than from the decorated `label` to keep reading, and renaming, the real key
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: { type: 'string', deprecated: true },
        propertyNames: { enum: ['foo', 'bar', 'baz'] },
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} initialFormData={{ foo: 'foo' }} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('show add button and fields if additionalProperties is true and not an object', async () => {
      const schema: RJSFSchema = {
        additionalProperties: true,
      };
      const formData = {
        additionalProperty: 'should appear',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} initialFormData={formData} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('pure anyOf union, with no frame of its own beside the option', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        title: 'Pet',
        anyOf: [
          { title: 'Dog', properties: { bark: { type: 'string' } } },
          { title: 'Cat', properties: { meow: { type: 'string' } } },
        ],
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    describe('with title and description', () => {
      test('object', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          properties: {
            a: { type: 'string', title: 'A', description: 'A description' },
            b: { type: 'number', title: 'B', description: 'B description' },
          },
        };
        const { asFragment } = render(<Form schema={schema} validator={validator} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('additionalProperties', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          additionalProperties: true,
        };
        const { asFragment } = render(<Form schema={schema} validator={validator} initialFormData={{ foo: 'foo' }} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('show add button and fields if additionalProperties is true and not an object', async () => {
        const schema: RJSFSchema = {
          ...titleAndDesc,
          additionalProperties: true,
        };
        const formData = {
          additionalProperty: 'should appear',
        };
        const { asFragment } = render(<Form schema={schema} validator={validator} initialFormData={formData} />);
        expect(asFragment()).toMatchSnapshot();
      });
    });
    describe('with title and description from uiSchema', () => {
      test('object', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            a: { type: 'string', title: 'A' },
            b: { type: 'number', title: 'B' },
          },
        };
        const { asFragment } = render(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('additionalProperties', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          additionalProperties: true,
        };
        const { asFragment } = render(
          <Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} initialFormData={{ foo: 'foo' }} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
      test('show add button and fields if additionalProperties is true and not an object', async () => {
        const schema: RJSFSchema = {
          additionalProperties: true,
        };
        const formData = {
          additionalProperty: 'should appear',
        };
        const { asFragment } = render(
          <Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} initialFormData={formData} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
    });
    describe('with title and description from both', () => {
      test('object', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          properties: {
            a: { type: 'string', title: 'A', description: 'A description' },
            b: { type: 'number', title: 'B', description: 'B description' },
          },
        };
        const { asFragment } = render(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('additionalProperties', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          additionalProperties: true,
        };
        const { asFragment } = render(
          <Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} initialFormData={{ foo: 'foo' }} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
    });
    describe('with title and description with global label off', () => {
      test('object', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          properties: {
            a: { type: 'string', title: 'A', description: 'A description' },
            b: { type: 'number', title: 'B', description: 'B description' },
          },
        };
        const { asFragment } = render(<Form schema={schema} uiSchema={labelsOff} validator={validator} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('additionalProperties', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          additionalProperties: true,
        };
        const { asFragment } = render(
          <Form schema={schema} uiSchema={labelsOff} validator={validator} initialFormData={{ foo: 'foo' }} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
      test('show add button and fields if additionalProperties is true and not an object', async () => {
        const schema: RJSFSchema = {
          ...titleAndDesc,
          additionalProperties: true,
        };
        const formData = {
          additionalProperty: 'should appear',
        };
        const { asFragment } = render(
          <Form schema={schema} uiSchema={labelsOff} validator={validator} initialFormData={formData} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
    });
  });

  describe('nameGenerator', () => {
    describe('bracketNameGenerator', () => {
      test('simple object', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            age: { type: 'number' },
          },
        };
        const { asFragment } = render(
          <Form schema={schema} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('nested object', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            person: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string' },
                    city: { type: 'string' },
                    country: { type: 'string' },
                  },
                },
              },
            },
          },
        };
        const { asFragment } = render(
          <Form schema={schema} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('object with additionalProperties', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          additionalProperties: true,
        };
        const formData = {
          name: 'John',
          customField: 'customValue',
        };
        const { asFragment } = render(
          <Form
            schema={schema}
            initialFormData={formData}
            validator={validator}
            nameGenerator={bracketNameGenerator}
          />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('object with mixed types', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            active: { type: 'boolean' },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        };
        const formData = {
          name: 'Alice',
          age: 30,
          active: true,
          tags: ['developer', 'designer'],
        };
        const { asFragment } = render(
          <Form
            schema={schema}
            initialFormData={formData}
            validator={validator}
            nameGenerator={bracketNameGenerator}
          />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
    });

    describe('dotNotationNameGenerator', () => {
      test('simple object', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            age: { type: 'number' },
          },
        };
        const { asFragment } = render(
          <Form schema={schema} validator={validator} nameGenerator={dotNotationNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('nested object', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            person: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string' },
                    city: { type: 'string' },
                  },
                },
              },
            },
          },
        };
        const { asFragment } = render(
          <Form schema={schema} validator={validator} nameGenerator={dotNotationNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('object with mixed types', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            count: { type: 'number' },
            items: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        };
        const formData = {
          name: 'Test',
          count: 5,
          items: ['a', 'b'],
        };
        const { asFragment } = render(
          <Form
            schema={schema}
            initialFormData={formData}
            validator={validator}
            nameGenerator={dotNotationNameGenerator}
          />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
    });
  });

  describe('an anyOf object option with a description of its own', () => {
    // Last in the suite, as each render advances the `useId` counter and would renumber the snapshots after it. The
    // field's template draws its description, so the selected object option's own one needs the id its plan gives it
    test('gives the field and the option each a description id of their own', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          tags: {
            description: 'Some tags',
            anyOf: [
              { type: 'object', description: 'Other desc', properties: { name: { type: 'string' } } },
              { type: 'null' },
            ],
          },
        },
      };
      const { container } = render(
        <Form schema={schema} initialFormData={{ tags: { name: 'a' } }} validator={validator} />,
      );

      // The ids RJSF gives, not those a library generates for its own parts. A theme's widget may list every part's id
      // whether or not it renders, so only the `tags` field's own description ids are required to exist
      const ids = Array.from(container.querySelectorAll('[id^="root"]'), (element) => element.id);
      expect(ids).toEqual([...new Set(ids)]);
      expect(container).toHaveTextContent('Some tags');
      expect(container).toHaveTextContent('Other desc');
      const describedBy = Array.from(container.querySelectorAll('[aria-describedby]'), (element) =>
        element.getAttribute('aria-describedby')!.split(' '),
      ).flat();
      const descriptionIds = describedBy.filter((id) => /^root_tags__\w*description\d*$/i.test(id));
      expect(descriptionIds).not.toHaveLength(0);
      for (const id of descriptionIds) {
        expect(document.getElementById(id), id).not.toBeNull();
      }
    });
  });
}
