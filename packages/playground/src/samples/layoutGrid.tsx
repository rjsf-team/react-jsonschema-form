import { LOOKUP_MAP_NAME, RJSFSchema } from '@rjsf/utils';

import { Sample } from './Sample';

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
  } as RJSFSchema,
  uiSchema(theme: string) {
    switch (theme) {
      case 'antd':
        return {
          'ui:field': 'LayoutGridField',
          'ui:layoutGrid': {
            'ui:row': {
              children: [
                {
                  'ui:row': {
                    children: [
                      {
                        'ui:col': {
                          xs: 24,
                          children: ['person'],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    gutter: [6, 0],
                    children: [
                      {
                        'ui:columns': {
                          xs: 8,
                          children: ['person.name.first', 'person.name.middle', 'person.name.last'],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    gutter: [6, 0],
                    children: [
                      {
                        'ui:col': {
                          xs: 8,
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
                          xs: 16,
                          children: ['person.race'],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    gutter: [6, 0],
                    children: [
                      {
                        'ui:col': {
                          xs: 12,
                          children: ['person.address'],
                        },
                      },
                      {
                        'ui:col': {
                          xs: 12,
                          children: [
                            {
                              'ui:row': {
                                children: [
                                  {
                                    'ui:col': {
                                      xs: 24,
                                      children: ['employment'],
                                    },
                                  },
                                  {
                                    'ui:condition': {
                                      field: 'employment.job_type',
                                      value: 'company',
                                      operator: 'all',
                                      children: [
                                        {
                                          'ui:columns': {
                                            xs: 24,
                                            children: ['employment.business', 'employment.title'],
                                          },
                                        },
                                        {
                                          'ui:row': {
                                            gutter: [6, 0],
                                            children: [
                                              {
                                                'ui:col': {
                                                  xs: 16,
                                                  children: ['employment.location.city'],
                                                },
                                              },
                                              {
                                                'ui:col': {
                                                  xs: 8,
                                                  children: ['employment.location.state'],
                                                },
                                              },
                                            ],
                                          },
                                        },
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
                                            xs: 24,
                                            children: ['employment.district', 'employment.school', 'employment.title'],
                                          },
                                        },
                                        {
                                          'ui:row': {
                                            gutter: [6, 0],
                                            children: [
                                              {
                                                'ui:col': {
                                                  xs: 16,
                                                  children: ['employment.location.city'],
                                                },
                                              },
                                              {
                                                'ui:col': {
                                                  xs: 8,
                                                  children: ['employment.location.state'],
                                                },
                                              },
                                            ],
                                          },
                                        },
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
                                            xs: 24,
                                            children: [
                                              {
                                                name: 'employment.description',
                                                rows: 6,
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
                  children: [
                    {
                      'ui:columns': {
                        xs: 24,
                        children: ['line_1', 'line_2', 'city'],
                      },
                    },
                    {
                      'ui:row': {
                        gutter: [6, 0],
                        children: [
                          {
                            'ui:columns': {
                              xs: 12,
                              children: ['state', 'postal_code'],
                            },
                          },
                        ],
                      },
                    },
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
      case 'chakra-ui':
        return {
          'ui:field': 'LayoutGridField',
          'ui:layoutGrid': {
            'ui:row': {
              gap: 2,
              children: [
                {
                  'ui:row': {
                    gap: 2,
                    templateColumns: 'repeat(1, 1fr)',
                    children: [
                      {
                        'ui:col': ['person'],
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    gap: 2,
                    templateColumns: 'repeat(3, 1fr)',
                    children: [
                      {
                        'ui:columns': ['person.name.first', 'person.name.middle', 'person.name.last'],
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    gap: 2,
                    templateColumns: 'repeat(3, 1fr)',
                    children: [
                      {
                        'ui:col': {
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
                          colSpan: 2,
                          children: ['person.race'],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    gap: 2,
                    templateColumns: 'repeat(2, 1fr)',
                    children: [
                      {
                        'ui:col': {
                          children: ['person.address'],
                        },
                      },
                      {
                        'ui:col': {
                          children: [
                            {
                              'ui:row': {
                                gap: 2,
                                templateColumns: 'repeat(3, 1fr)',
                                children: [
                                  {
                                    'ui:col': {
                                      colSpan: 3,
                                      style: { margin: '4px 0 16px' },
                                      children: ['employment'],
                                    },
                                  },
                                  {
                                    'ui:condition': {
                                      field: 'employment.job_type',
                                      value: 'company',
                                      operator: 'all',
                                      children: [
                                        {
                                          'ui:columns': {
                                            colSpan: 3,
                                            children: ['employment.business', 'employment.title'],
                                          },
                                        },
                                        {
                                          'ui:col': {
                                            colSpan: 2,
                                            children: ['employment.location.city'],
                                          },
                                        },
                                        {
                                          'ui:col': {
                                            children: ['employment.location.state'],
                                          },
                                        },
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
                                            colSpan: 3,
                                            children: ['employment.district', 'employment.school', 'employment.title'],
                                          },
                                        },
                                        {
                                          'ui:col': {
                                            colSpan: 2,
                                            children: ['employment.location.city'],
                                          },
                                        },
                                        {
                                          'ui:col': {
                                            children: ['employment.location.state'],
                                          },
                                        },
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
                                            colSpan: 3,
                                            children: [
                                              {
                                                name: 'employment.description',
                                                rows: 6,
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
                  gap: 2,
                  templateColumns: 'repeat(2, 1fr)',
                  children: [
                    {
                      'ui:columns': {
                        colSpan: 2,
                        children: ['line_1', 'line_2', 'city'],
                      },
                    },
                    {
                      'ui:columns': {
                        size: 6,
                        children: ['state', 'postal_code'],
                      },
                    },
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
      case 'fluentui-rc':
        return {
          'ui:field': 'LayoutGridField',
          'ui:layoutGrid': {
            'ui:row': {
              rows: 'repeat(1, 1fr)',
              columns: 'repeat(12, 1fr)',
              style: { columnGap: '5px', rowGap: '5px' },
              children: [
                {
                  'ui:col': {
                    style: { gridRow: '1 / auto', gridColumn: '1 / span 12' },
                    children: ['person'],
                  },
                },
                {
                  'ui:col': {
                    style: { gridRow: '2 / auto', gridColumn: '1 / span 4' },
                    children: ['person.name.first'],
                  },
                },
                {
                  'ui:col': {
                    style: { gridRow: '2 / auto', gridColumn: '5 / span 4' },
                    children: ['person.name.middle'],
                  },
                },
                {
                  'ui:col': {
                    style: { gridRow: '2 / auto', gridColumn: '9 / span 4' },
                    children: ['person.name.last'],
                  },
                },
                {
                  'ui:col': {
                    style: { gridRow: '3 / auto', gridColumn: '1 / span 4' },
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
                    style: { gridRow: '3 / auto', gridColumn: '5 / span 8', marginTop: '3px' },
                    children: ['person.race'],
                  },
                },
                {
                  'ui:col': {
                    style: { gridRow: '4 / auto', gridColumn: '1 / span 4' },
                    children: ['line_1'],
                  },
                },
                {
                  'ui:col': {
                    style: { gridRow: '5 / auto', gridColumn: '1 / span 4' },
                    children: ['line_2'],
                  },
                },
                {
                  'ui:col': {
                    style: { gridRow: '6 / auto', gridColumn: '1 / span 4' },
                    children: ['city'],
                  },
                },
                {
                  'ui:col': {
                    style: { gridRow: '4 / auto', gridColumn: '1 / span 4' },
                    children: ['person.address'],
                  },
                },
                {
                  'ui:row': {
                    style: { gridRow: '4 / auto', gridColumn: '6 / span 7' },
                    children: [
                      {
                        'ui:col': {
                          style: { padding: '3px 0' },
                          children: [
                            {
                              name: 'employment',
                            },
                          ],
                        },
                      },
                      {
                        'ui:condition': {
                          field: 'employment.job_type',
                          value: 'company',
                          operator: 'all',
                          children: [
                            {
                              'ui:columns': {
                                children: ['employment.business', 'employment.title'],
                              },
                            },
                            {
                              'ui:row': {
                                children: [
                                  {
                                    'ui:col': {
                                      children: ['employment.location.city'],
                                    },
                                  },
                                  {
                                    'ui:col': {
                                      children: ['employment.location.state'],
                                    },
                                  },
                                ],
                              },
                            },
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
                                children: ['employment.district', 'employment.school', 'employment.title'],
                              },
                            },
                            {
                              'ui:row': {
                                children: [
                                  {
                                    'ui:col': {
                                      children: ['employment.location.city'],
                                    },
                                  },
                                  {
                                    'ui:col': {
                                      children: ['employment.location.state'],
                                    },
                                  },
                                ],
                              },
                            },
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
                                children: [
                                  {
                                    name: 'employment.description',
                                    rows: 6,
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
                  className: 'row',
                  children: [
                    {
                      'ui:columns': {
                        children: ['line_1', 'line_2', 'city'],
                      },
                    },
                    {
                      'ui:row': {
                        children: [
                          {
                            'ui:columns': {
                              children: ['state', 'postal_code'],
                            },
                          },
                        ],
                      },
                    },
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
      case 'mui':
        return {
          'ui:field': 'LayoutGridField',
          'ui:layoutGrid': {
            'ui:row': {
              spacing: 2,
              children: [
                {
                  'ui:row': {
                    spacing: 2,
                    size: 12,
                    children: [
                      {
                        'ui:col': {
                          size: 12,
                          children: ['person'],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    spacing: 2,
                    children: [
                      {
                        'ui:columns': {
                          size: 4,
                          children: [
                            {
                              name: 'person.name.first',
                              fullWidth: true,
                            },
                            {
                              name: 'person.name.middle',
                              fullWidth: true,
                            },
                            {
                              name: 'person.name.last',
                              fullWidth: true,
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    spacing: 2,
                    children: [
                      {
                        'ui:col': {
                          size: 4,
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
                          size: 8,
                          children: ['person.race'],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    spacing: 2,
                    children: [
                      {
                        'ui:col': {
                          size: 5,
                          children: ['person.address'],
                        },
                      },
                      {
                        'ui:col': {
                          size: 7,
                          children: [
                            {
                              'ui:row': {
                                spacing: 2,
                                mt: 1.75,
                                children: [
                                  {
                                    'ui:col': {
                                      size: 12,
                                      children: ['employment'],
                                    },
                                  },
                                  {
                                    'ui:condition': {
                                      field: 'employment.job_type',
                                      value: 'company',
                                      operator: 'all',
                                      children: [
                                        {
                                          'ui:columns': {
                                            size: 12,
                                            children: ['employment.business', 'employment.title'],
                                          },
                                        },
                                        {
                                          'ui:col': {
                                            size: 8,
                                            children: ['employment.location.city'],
                                          },
                                        },
                                        {
                                          'ui:col': {
                                            size: 4,
                                            children: ['employment.location.state'],
                                          },
                                        },
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
                                            size: 12,
                                            children: ['employment.district', 'employment.school', 'employment.title'],
                                          },
                                        },
                                        {
                                          'ui:col': {
                                            size: 8,
                                            children: ['employment.location.city'],
                                          },
                                        },
                                        {
                                          'ui:col': {
                                            size: 4,
                                            children: ['employment.location.state'],
                                          },
                                        },
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
                                            size: 12,
                                            children: [
                                              {
                                                name: 'employment.description',
                                                rows: 6,
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
                  spacing: 2,
                  children: [
                    {
                      'ui:columns': {
                        size: 12,
                        children: ['line_1', 'line_2', 'city'],
                      },
                    },
                    {
                      'ui:row': {
                        spacing: 2,
                        children: [
                          {
                            'ui:columns': {
                              size: 6,
                              children: ['state', 'postal_code'],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
          employment: {
            'ui:options': {
              inline: true,
              label: false,
            },
            description: {
              'ui:widget': 'textarea',
            },
          },
        };
      case 'react-bootstrap':
        return {
          'ui:field': 'LayoutGridField',
          'ui:layoutGrid': {
            'ui:row': {
              children: [
                {
                  'ui:row': {
                    children: [
                      {
                        'ui:col': {
                          xs: 12,
                          children: ['person'],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    children: [
                      {
                        'ui:columns': {
                          xs: 4,
                          children: ['person.name.first', 'person.name.middle', 'person.name.last'],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    children: [
                      {
                        'ui:col': {
                          xs: 4,
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
                          xs: 8,
                          children: ['person.race'],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    children: [
                      {
                        'ui:col': {
                          xs: 5,
                          children: ['person.address'],
                        },
                      },
                      {
                        'ui:col': {
                          xs: 7,
                          children: [
                            {
                              'ui:row': {
                                children: [
                                  {
                                    'ui:col': {
                                      xs: 12,
                                      style: { margin: '6px 0 6px' },
                                      children: ['employment'],
                                    },
                                  },
                                  {
                                    'ui:condition': {
                                      field: 'employment.job_type',
                                      value: 'company',
                                      operator: 'all',
                                      children: [
                                        {
                                          'ui:columns': {
                                            xs: 12,
                                            children: ['employment.business', 'employment.title'],
                                          },
                                        },
                                        {
                                          'ui:col': {
                                            xs: 8,
                                            children: ['employment.location.city'],
                                          },
                                        },
                                        {
                                          'ui:col': {
                                            xs: 4,
                                            children: ['employment.location.state'],
                                          },
                                        },
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
                                            xs: 12,
                                            children: ['employment.district', 'employment.school', 'employment.title'],
                                          },
                                        },
                                        {
                                          'ui:col': {
                                            xs: 8,
                                            children: ['employment.location.city'],
                                          },
                                        },
                                        {
                                          'ui:col': {
                                            xs: 4,
                                            children: ['employment.location.state'],
                                          },
                                        },
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
                                            xs: 12,
                                            children: [
                                              {
                                                name: 'employment.description',
                                                rows: 6,
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
                  children: [
                    {
                      'ui:columns': {
                        xs: 12,
                        children: ['line_1', 'line_2', 'city'],
                      },
                    },
                    {
                      'ui:row': {
                        spacing: 2,
                        children: [
                          {
                            'ui:columns': {
                              xs: 6,
                              children: ['state', 'postal_code'],
                            },
                          },
                        ],
                      },
                    },
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
      case 'semantic-ui':
        return {
          'ui:field': 'LayoutGridField',
          'ui:layoutGrid': {
            'ui:row': {
              container: true,
              children: [
                {
                  'ui:row': {
                    style: { width: '100%' },
                    children: [
                      {
                        'ui:columns': {
                          width: 18,
                          style: { paddingBottom: 0 },
                          children: ['person'],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    style: { width: '100%' },
                    children: [
                      {
                        'ui:columns': {
                          width: 5,
                          style: { paddingBottom: 0 },
                          children: ['person.name.first', 'person.name.middle', 'person.name.last'],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    style: { paddingBottom: 0, marginTop: 0, width: '100%' },
                    children: [
                      {
                        'ui:col': {
                          width: 6,
                          style: { paddingBottom: 0 },
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
                          width: 10,
                          style: { paddingBottom: 0 },
                          children: ['person.race'],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    style: { paddingBottom: 0, marginTop: 0 },
                    children: [
                      {
                        'ui:col': {
                          width: 7,
                          children: ['person.address'],
                        },
                      },
                      {
                        'ui:col': {
                          width: 9,
                          children: [
                            {
                              'ui:row': {
                                children: [
                                  {
                                    'ui:col': {
                                      width: 16,
                                      style: { paddingTop: '56px' },
                                      children: ['employment'],
                                    },
                                  },
                                  {
                                    'ui:condition': {
                                      field: 'employment.job_type',
                                      value: 'company',
                                      operator: 'all',
                                      children: [
                                        {
                                          'ui:columns': {
                                            width: 16,
                                            style: {
                                              paddingBottom: 0,
                                              paddingTop: 0,
                                            },
                                            children: ['employment.business', 'employment.title'],
                                          },
                                        },
                                        {
                                          'ui:col': {
                                            width: 10,
                                            style: {
                                              paddingBottom: 0,
                                              paddingTop: 0,
                                            },
                                            children: ['employment.location.city'],
                                          },
                                        },
                                        {
                                          'ui:col': {
                                            width: 6,
                                            style: {
                                              paddingBottom: 0,
                                              paddingTop: 0,
                                            },
                                            children: ['employment.location.state'],
                                          },
                                        },
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
                                            width: 16,
                                            style: {
                                              paddingBottom: 0,
                                              paddingTop: 0,
                                            },
                                            children: ['employment.district', 'employment.school', 'employment.title'],
                                          },
                                        },
                                        {
                                          'ui:col': {
                                            width: 10,
                                            style: {
                                              paddingBottom: 0,
                                              paddingTop: 0,
                                            },
                                            children: ['employment.location.city'],
                                          },
                                        },
                                        {
                                          'ui:col': {
                                            width: 6,
                                            style: {
                                              paddingBottom: 0,
                                              paddingTop: 0,
                                            },
                                            children: ['employment.location.state'],
                                          },
                                        },
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
                                            width: 16,
                                            style: {
                                              paddingBottom: 0,
                                              paddingTop: 0,
                                            },
                                            children: [
                                              {
                                                name: 'employment.description',
                                                rows: 6,
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
                  style: { paddingBottom: 0, marginTop: 0 },
                  children: [
                    {
                      'ui:columns': {
                        width: 16,
                        style: { paddingBottom: 0, paddingTop: 0 },
                        children: ['line_1', 'line_2', 'city'],
                      },
                    },
                    {
                      'ui:row': {
                        style: { width: '100%' },
                        children: [
                          {
                            'ui:columns': {
                              width: 8,
                              style: { paddingBottom: 0 },
                              children: ['state', 'postal_code'],
                            },
                          },
                        ],
                      },
                    },
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
      case 'shadcn':
        return {
          'ui:field': 'LayoutGridField',
          'ui:layoutGrid': {
            'ui:row': [
              {
                'ui:row': {
                  className: 'grid grid-cols-1 gap-4 col-span-12',
                  children: [
                    {
                      'ui:col': {
                        children: ['person'],
                      },
                    },
                  ],
                },
              },
              {
                'ui:row': {
                  className: 'grid grid-cols-12 gap-4 col-span-12',
                  children: [
                    {
                      'ui:columns': {
                        className: 'col-span-4',
                        children: ['person.name.first', 'person.name.middle', 'person.name.last'],
                      },
                    },
                  ],
                },
              },
              {
                'ui:row': {
                  className: 'grid grid-cols-12 gap-4 col-span-12',
                  children: [
                    {
                      'ui:col': {
                        className: 'col-span-3',
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
                        className: 'col-span-6',
                        children: ['person.race'],
                      },
                    },
                  ],
                },
              },
              {
                'ui:row': {
                  className: 'grid grid-cols-12 gap-4 col-span-12 grid-rows-4',
                  children: [
                    {
                      'ui:col': {
                        className: 'col-span-6 row-span-4',
                        children: ['person.address'],
                      },
                    },
                    {
                      'ui:col': {
                        className: 'col-span-6 row-span-1 flex items-center',
                        children: ['employment'],
                      },
                    },
                    {
                      'ui:condition': {
                        field: 'employment.job_type',
                        value: 'company',
                        operator: 'all',
                        children: [
                          {
                            'ui:columns': {
                              className: 'col-span-6 row-span-1',
                              children: ['employment.business', 'employment.title'],
                            },
                          },
                          {
                            'ui:col': {
                              className: 'col-span-4 row-span-1',
                              children: ['employment.location.city'],
                            },
                          },
                          {
                            'ui:col': {
                              className: 'col-span-2 row-span-1',
                              children: ['employment.location.state'],
                            },
                          },
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
                              className: 'col-span-6 row-span-1',
                              children: ['employment.district', 'employment.school', 'employment.title'],
                            },
                          },
                          {
                            'ui:col': {
                              className: 'col-span-4 row-span-1',
                              children: ['employment.location.city'],
                            },
                          },
                          {
                            'ui:col': {
                              className: 'col-span-2 row-span-1',
                              children: ['employment.location.state'],
                            },
                          },
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
                              className: 'col-span-6 row-span-3',
                              children: [
                                {
                                  name: 'employment.description',
                                  rows: 6,
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
                  className: 'grid grid-cols-12 gap-4',
                  children: [
                    {
                      'ui:columns': {
                        className: 'col-span-12',
                        children: ['line_1', 'line_2', 'city'],
                      },
                    },
                    {
                      'ui:row': {
                        className: 'grid-cols-12 col-span-12',
                        children: [
                          {
                            'ui:columns': {
                              className: 'col-span-6',
                              children: ['state', 'postal_code'],
                            },
                          },
                        ],
                      },
                    },
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
      case 'daisy-ui':
        return {
          'ui:field': 'LayoutGridField',
          'ui:layoutGrid': {
            'ui:row': {
              children: [
                {
                  'ui:row': {
                    children: [
                      {
                        'ui:col': {
                          xs: 12,
                          children: ['person'],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    children: [
                      {
                        'ui:columns': {
                          xs: 4,
                          children: ['person.name.first', 'person.name.middle', 'person.name.last'],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    children: [
                      {
                        'ui:col': {
                          xs: 4,
                          children: [
                            {
                              name: 'person.birth_date',
                              placeholder: '$lookup=PlaceholderText',
                              'ui:widget': 'date',
                            },
                          ],
                        },
                      },
                      {
                        'ui:col': {
                          xs: 8,
                          children: ['person.race'],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    children: [
                      {
                        'ui:col': {
                          xs: 12,
                          children: ['person.address'],
                        },
                      },
                    ],
                  },
                },
                {
                  'ui:row': {
                    children: [
                      {
                        'ui:col': {
                          xs: 12,
                          style: { marginTop: '20px' },
                          children: ['employment'],
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
                  children: [
                    {
                      'ui:columns': {
                        xs: 12,
                        children: ['line_1', 'line_2', 'city'],
                      },
                    },
                    {
                      'ui:row': {
                        children: [
                          {
                            'ui:columns': {
                              xs: 6,
                              children: ['state', 'postal_code'],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
          employment: {
            'ui:options': {
              inline: true,
              label: false,
            },
            description: {
              'ui:widget': 'textarea',
            },
          },
        };
      default:
        return {
          'ui:field': 'LayoutGridField',
          'ui:layoutGrid': {
            'ui:row': [
              {
                'ui:row': {
                  className: 'row',
                  children: [
                    {
                      'ui:col': {
                        className: 'col-xs-12',
                        children: ['person'],
                      },
                    },
                  ],
                },
              },
              {
                'ui:row': {
                  className: 'row',
                  children: [
                    {
                      'ui:columns': {
                        className: 'col-xs-4',
                        children: ['person.name.first', 'person.name.middle', 'person.name.last'],
                      },
                    },
                  ],
                },
              },
              {
                'ui:row': {
                  className: 'row',
                  children: [
                    {
                      'ui:col': {
                        className: 'col-xs-3',
                        children: [
                          {
                            name: 'person.birth_date',
                            placeholder: '$lookup=PlaceholderText',
                            'ui:widget': 'date',
                          },
                        ],
                      },
                    },
                    {
                      'ui:col': {
                        className: 'col-xs-6',
                        children: ['person.race'],
                      },
                    },
                  ],
                },
              },
              {
                'ui:row': {
                  className: 'row',
                  children: [
                    {
                      'ui:col': {
                        className: 'col-xs-6',
                        children: ['person.address'],
                      },
                    },
                    {
                      'ui:col': {
                        className: 'col-xs-6',
                        style: { margin: '0 0 26px 0' },
                        children: ['employment'],
                      },
                    },
                    {
                      'ui:condition': {
                        field: 'employment.job_type',
                        value: 'company',
                        operator: 'all',
                        children: [
                          {
                            'ui:columns': {
                              className: 'col-xs-6',
                              children: ['employment.business', 'employment.title'],
                            },
                          },
                          {
                            'ui:col': {
                              className: 'col-xs-4',
                              children: ['employment.location.city'],
                            },
                          },
                          {
                            'ui:col': {
                              className: 'col-xs-2',
                              children: ['employment.location.state'],
                            },
                          },
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
                              className: 'col-xs-6',
                              children: ['employment.district', 'employment.school', 'employment.title'],
                            },
                          },
                          {
                            'ui:col': {
                              className: 'col-xs-4',
                              children: ['employment.location.city'],
                            },
                          },
                          {
                            'ui:col': {
                              className: 'col-xs-2',
                              children: ['employment.location.state'],
                            },
                          },
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
                              className: 'col-xs-6',
                              children: [
                                {
                                  name: 'employment.description',
                                  rows: 6,
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
                  className: 'row',
                  children: [
                    {
                      'ui:columns': {
                        className: 'col-xs-12',
                        children: ['line_1', 'line_2', 'city'],
                      },
                    },
                    {
                      'ui:row': {
                        children: [
                          {
                            'ui:columns': {
                              className: 'col-xs-6',
                              children: ['state', 'postal_code'],
                            },
                          },
                        ],
                      },
                    },
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
    }
  },
};

export default layoutGrid;
