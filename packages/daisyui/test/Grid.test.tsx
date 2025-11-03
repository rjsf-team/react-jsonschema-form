import { gridTests } from '@rjsf/snapshot-tests';

import Form from '../src';

gridTests(Form, {
  ColumnWidthAll: { xs: 24 },
  ColumnWidth4: { xs: 8 },
  ColumnWidth6: { xs: 12 },
  ColumnWidth8: { xs: 16 },
  ComplexUiSchema: {
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
  },
});
