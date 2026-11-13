import { LOOKUP_MAP_NAME } from '@rjsf/utils';

import type { Sample } from './Sample.ts';

// Each theme's row props that a column's `span` leaves to it: its gaps and the `row` class Bootstrap 3's columns need
const ROW_PROPS: Record<string, object | undefined> = {
  antd: { gutter: [6, 0] },
  bootstrap3: { className: 'row' },
  'chakra-ui': { gap: 2 },
  'fluentui-rc': { style: { columnGap: '5px', rowGap: '5px' } },
  mui: { spacing: 2 },
  shadcn: { className: 'gap-4' },
};

const HALF_STEP_THEMES = ['antd', 'daisy-ui', 'mantine', 'mui'];

const layoutGrid: Sample = {
  formContext: {
    [LOOKUP_MAP_NAME]: {
      FooClass: 'Foo',
      PlaceholderText: 'DOB',
    },
  },
  schema: {
    type: 'object',
    properties: {
      person: { title: 'Person Info', $ref: '#/definitions/Person' },
      employment: {
        title: 'Employment',
        discriminator: {
          propertyName: 'job_type',
        },
        oneOf: [
          { $ref: '#/definitions/Company' },
          { $ref: '#/definitions/Education' },
          { $ref: '#/definitions/Other' },
        ],
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
            title: 'Middle Name',
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
  },
  uiSchema(theme: string) {
    const rowProps = ROW_PROPS[theme];
    // The themes whose grids take half steps show one in the address and employment row
    const halfSteps = HALF_STEP_THEMES.includes(theme);
    const employmentLocation = [
      { 'ui:col': { span: 8, children: ['employment.location.city'] } },
      { 'ui:col': { span: 4, children: ['employment.location.state'] } },
    ];
    return {
      'ui:field': 'LayoutGridField',
      'ui:layoutGrid': {
        // antd's and Bootstrap 3's rows pull out by a negative margin that only their columns pad back, so this row, whose
        // children are rows, leaves their row props off rather than add the margins up
        'ui:row': {
          ...(theme === 'antd' || theme === 'bootstrap3' ? undefined : rowProps),
          children: [
            { 'ui:row': { ...rowProps, children: [{ 'ui:col': { span: 12, children: ['person'] } }] } },
            {
              'ui:row': {
                ...rowProps,
                children: [
                  {
                    'ui:columns': {
                      span: 4,
                      children: ['person.name.first', 'person.name.middle', 'person.name.last'],
                    },
                  },
                ],
              },
            },
            {
              'ui:row': {
                ...rowProps,
                children: [
                  {
                    'ui:col': {
                      span: 4,
                      children: [
                        { name: 'person.birth_date', placeholder: '$lookup=PlaceholderText', 'ui:widget': 'date' },
                      ],
                    },
                  },
                  { 'ui:col': { span: 8, children: ['person.race'] } },
                ],
              },
            },
            {
              'ui:row': {
                ...rowProps,
                children: [
                  { 'ui:col': { span: halfSteps ? 4.5 : 5, children: ['person.address'] } },
                  {
                    'ui:col': {
                      span: halfSteps ? 7.5 : 7,
                      children: [
                        {
                          'ui:row': {
                            ...rowProps,
                            children: [
                              { 'ui:col': { span: 12, children: ['employment'] } },
                              {
                                'ui:condition': {
                                  field: 'employment.job_type',
                                  value: 'company',
                                  operator: 'all',
                                  children: [
                                    {
                                      'ui:columns': { span: 12, children: ['employment.business', 'employment.title'] },
                                    },
                                    ...employmentLocation,
                                  ],
                                },
                              },
                              {
                                'ui:condition': {
                                  field: 'employment.job_type',
                                  value: 'education',
                                  operator: 'all',
                                  children: [
                                    {
                                      'ui:columns': {
                                        span: 12,
                                        children: ['employment.district', 'employment.school', 'employment.title'],
                                      },
                                    },
                                    ...employmentLocation,
                                  ],
                                },
                              },
                              {
                                'ui:condition': {
                                  field: 'employment.job_type',
                                  value: 'other',
                                  operator: 'all',
                                  children: [
                                    {
                                      'ui:columns': {
                                        span: 12,
                                        children: [{ name: 'employment.description', rows: 6 }],
                                      },
                                    },
                                  ],
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      person: {
        'ui:field': 'LayoutHeaderField',
        race: {
          'ui:options': {
            widget: 'checkboxes',
          },
        },
        address: {
          'ui:field': 'LayoutGridField',
          'ui:layoutGrid': {
            'ui:row': {
              ...rowProps,
              children: [
                { 'ui:columns': { span: 12, children: ['line_1', 'line_2', 'city'] } },
                { 'ui:columns': { span: 6, children: ['state', 'postal_code'] } },
              ],
            },
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
  },
};

export default layoutGrid;
