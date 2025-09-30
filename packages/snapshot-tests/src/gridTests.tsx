import { ComponentType } from 'react';
import renderer, { TestRendererOptions } from 'react-test-renderer';
import { LOOKUP_MAP_NAME, RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { FormProps } from '@rjsf/core';

jest.mock('@rjsf/utils', () => ({
  ...jest.requireActual('@rjsf/utils'),
  // Disable the getTestIds within the snapshot tests by returning an empty object
  getTestIds: jest.fn(() => ({})),
}));

export type GridRenderCustomOptions = {
  ColumnWidthAll: object;
  ColumnWidth4: object;
  ColumnWidth6: object;
  ColumnWidth8: object;
  Row2Columns?: object;
  Row3Columns?: object;
  ComplexUiSchema?: UiSchema;
};

const schema = {
  type: 'object',
  properties: {
    person: { title: 'Person Info', $ref: '#/definitions/Person' },
    employment: {
      title: 'Employment',
      discriminator: {
        propertyName: 'job_type',
      },
      oneOf: [{ $ref: '#/definitions/Company' }, { $ref: '#/definitions/Education' }, { $ref: '#/definitions/Other' }],
    },
  },
  definitions: {
    PersonName: {
      type: 'object',
      properties: {
        first: {
          title: 'First Name',
          minLength: 1,
          maxLength: 200,
          type: 'string',
        },
        middle: {
          title: 'Middle',
          minLength: 1,
          maxLength: 200,
          type: 'string',
        },
        last: {
          title: 'Last Name',
          minLength: 1,
          maxLength: 1000,
          type: 'string',
        },
      },
      required: ['first', 'last'],
    },
    Race: {
      title: 'Race',
      type: 'array',
      items: {
        type: 'string',
        oneOf: [
          {
            const: 'native_american',
            title: 'American Indian / Alaska Native',
          },
          {
            const: 'asian',
            title: 'Asian',
          },
          {
            const: 'black',
            title: 'Black / African American',
          },
          {
            const: 'pacific_islander',
            title: 'Native Hawaiian / Other Pacific Islander',
          },
          {
            const: 'white',
            title: 'White',
          },
        ],
      },
      uniqueItems: true,
    },
    Person: {
      type: 'object',
      properties: {
        name: { $ref: '#/definitions/PersonName' },
        birth_date: {
          title: 'Date of Birth',
          type: 'string',
          format: 'date',
        },
        race: {
          title: 'Race',
          description: '(Check all that apply)',
          $ref: '#/definitions/Race',
        },
        address: {
          title: 'Address',
          $ref: '#/definitions/Address',
        },
      },
      required: ['name', 'birth_date', 'race', 'address'],
    },
    StateAbrv: {
      title: 'StateAbrv',
      enum: [
        'AL',
        'AK',
        'AS',
        'AZ',
        'AR',
        'CA',
        'CO',
        'CT',
        'DE',
        'DC',
        'FL',
        'GA',
        'GU',
        'HI',
        'ID',
        'IL',
        'IN',
        'IA',
        'KS',
        'KY',
        'LA',
        'ME',
        'MD',
        'MA',
        'MI',
        'MN',
        'MS',
        'MO',
        'MT',
        'NE',
        'NV',
        'NH',
        'NJ',
        'NM',
        'NY',
        'NC',
        'ND',
        'MP',
        'OH',
        'OK',
        'OR',
        'PA',
        'PR',
        'RI',
        'SC',
        'SD',
        'TN',
        'TX',
        'UT',
        'VT',
        'VA',
        'VI',
        'WA',
        'WV',
        'WI',
        'WY',
      ],
      type: 'string',
    },
    Address: {
      type: 'object',
      properties: {
        line_1: {
          title: 'Address',
          minLength: 1,
          maxLength: 200,
          type: 'string',
        },
        line_2: {
          title: 'Address 2',
          minLength: 1,
          maxLength: 200,
          type: 'string',
        },
        city: {
          title: 'City',
          minLength: 1,
          maxLength: 50,
          type: 'string',
        },
        state: { title: 'State', $ref: '#/definitions/StateAbrv' },
        postal_code: {
          title: 'ZIP Code',
          pattern: '^\\d{5}(?:[-\\s]\\d{4})?$',
          type: 'string',
        },
      },
      required: ['line_1', 'city', 'state', 'postal_code'],
    },
    Location: {
      type: 'object',
      properties: {
        city: {
          title: 'City',
          type: 'string',
        },
        state: {
          title: 'State',
          $ref: '#/definitions/StateAbrv',
        },
      },
      required: ['city', 'state'],
    },
    Company: {
      type: 'object',
      properties: {
        job_type: {
          title: 'Company',
          default: 'company',
          enum: ['company'],
          type: 'string',
        },
        business: {
          title: 'Company Name',
          type: 'string',
        },
        title: {
          title: 'Job Title',
          type: 'string',
        },
        location: {
          $ref: '#/definitions/Location',
        },
      },
      required: ['job_type', 'business', 'location'],
    },
    Education: {
      type: 'object',
      properties: {
        job_type: {
          title: 'Education',
          default: 'education',
          enum: ['education'],
          type: 'string',
        },
        district: {
          title: 'District Name',
          type: 'string',
        },
        school: {
          title: 'School Name',
          type: 'string',
        },
        title: {
          title: 'Job Title',
          type: 'string',
        },
        location: {
          $ref: '#/definitions/Location',
        },
      },
      required: ['job_type', 'school', 'location'],
    },
    Other: {
      type: 'object',
      properties: {
        job_type: {
          title: 'Other',
          default: 'other',
          enum: ['other'],
          type: 'string',
        },
        description: {
          title: 'Describe your job',
          type: 'string',
        },
      },
      required: ['job_type', 'description'],
    },
  },
} as RJSFSchema;

const baseUiSchema: UiSchema = {
  person: {
    'ui:field': 'LayoutHeaderField',
    race: {
      'ui:options': {
        widget: 'checkboxes',
      },
    },
    address: {
      state: {
        'ui:widget': 'select',
      },
    },
  },
  employment: {
    'ui:options': {
      inline: true,
    },
    description: {
      'ui:widget': 'textarea',
    },
  },
};

const FORM_CONTEXT = {
  [LOOKUP_MAP_NAME]: {
    FooClass: 'Foo',
    PlaceholderText: 'DOB',
  },
};

export function gridTests(
  Form: ComponentType<FormProps>,
  customOptions: GridRenderCustomOptions,
  formOptions?: TestRendererOptions,
) {
  describe('Two even column grid', () => {
    let uiSchema: UiSchema;
    beforeAll(() => {
      uiSchema = {
        ...baseUiSchema,
        'ui:field': 'LayoutGridField',
        'ui:layoutGrid': {
          'ui:row': {
            ...customOptions.Row2Columns,
            children: [
              {
                'ui:col': {
                  ...customOptions.ColumnWidthAll,
                  children: ['person'],
                },
              },
              {
                'ui:columns': {
                  ...customOptions.ColumnWidth6,
                  children: ['person.name.first', 'person.name.middle'],
                },
              },
              {
                'ui:columns': {
                  ...customOptions.ColumnWidth6,
                  children: [
                    'person.name.first',
                    {
                      name: 'person.birth_date',
                      placeholder: '$lookup=PlaceholderText',
                    },
                  ],
                },
              },
              {
                'ui:col': {
                  ...customOptions.ColumnWidthAll,
                  children: ['person.race'],
                },
              },
              {
                'ui:columns': {
                  ...customOptions.ColumnWidth6,
                  children: ['person.address.line_1', 'person.address.line_2'],
                },
              },
              {
                'ui:columns': {
                  ...customOptions.ColumnWidth6,
                  children: ['person.address.city', 'person.address.state'],
                },
              },
              {
                'ui:col': {
                  ...customOptions.ColumnWidthAll,
                  children: ['person.address.zip'],
                },
              },
            ],
          },
        },
      };
    });
    test('renders person and address in two columns, no employment', () => {
      const tree = renderer
        .create(
          <Form schema={schema} uiSchema={uiSchema} validator={validator} formContext={FORM_CONTEXT} />,
          formOptions,
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
  describe('Three even column grid', () => {
    let uiSchema: UiSchema;
    beforeAll(() => {
      uiSchema = {
        ...baseUiSchema,
        'ui:field': 'LayoutGridField',
        'ui:layoutGrid': {
          'ui:row': {
            ...customOptions.Row3Columns,
            children: [
              {
                'ui:col': {
                  ...customOptions.ColumnWidthAll,
                  children: ['person'],
                },
              },
              {
                'ui:columns': {
                  ...customOptions.ColumnWidth4,
                  children: ['person.name.first', 'person.name.middle', 'person.name.last'],
                },
              },
              {
                'ui:col': {
                  ...customOptions.ColumnWidth4,
                  children: [
                    {
                      name: 'person.birth_date',
                      placeholder: '$lookup=PlaceholderText',
                    },
                  ],
                },
              },
              {
                'ui:col': {
                  ...customOptions.ColumnWidth8,
                  children: ['person.race'],
                },
              },
              {
                'ui:columns': {
                  ...customOptions.ColumnWidth6,
                  children: ['person.address.line_1', 'person.address.line_2'],
                },
              },
              {
                'ui:columns': {
                  ...customOptions.ColumnWidth4,
                  children: ['person.address.city', 'person.address.state', 'person.address.zip'],
                },
              },
            ],
          },
        },
      };
    });
    test('renders person and address in three columns, no employment', () => {
      const tree = renderer
        .create(
          <Form schema={schema} uiSchema={uiSchema} validator={validator} formContext={FORM_CONTEXT} />,
          formOptions,
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
  describe('Complex grid', () => {
    test('renders person and address and employment in a complex grid, no form data', () => {
      const tree = renderer
        .create(
          <Form
            schema={schema}
            uiSchema={customOptions.ComplexUiSchema}
            validator={validator}
            formContext={FORM_CONTEXT}
          />,
          formOptions,
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('renders person and address and employment in a complex grid, job_type = company', () => {
      const tree = renderer
        .create(
          <Form
            schema={schema}
            uiSchema={customOptions.ComplexUiSchema}
            validator={validator}
            formData={{
              employment: {
                job_type: 'company',
              },
            }}
            formContext={FORM_CONTEXT}
          />,
          formOptions,
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('renders person and address and employment in a complex grid, job_type = education', () => {
      const tree = renderer
        .create(
          <Form
            schema={schema}
            uiSchema={customOptions.ComplexUiSchema}
            validator={validator}
            formData={{
              employment: {
                job_type: 'education',
              },
            }}
            formContext={FORM_CONTEXT}
          />,
          formOptions,
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('renders person and address and employment in a complex grid, job_type = other', () => {
      const tree = renderer
        .create(
          <Form
            schema={schema}
            uiSchema={customOptions.ComplexUiSchema}
            validator={validator}
            formData={{
              employment: {
                job_type: 'other',
              },
            }}
            formContext={FORM_CONTEXT}
          />,
          formOptions,
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
}
