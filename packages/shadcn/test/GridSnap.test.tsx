import { gridTests } from '@rjsf/snapshot-tests';

import Form from '../src';

gridTests(Form, {
  ColumnWidthAll: { className: 'col-span-12' },
  ColumnWidth4: { className: 'col-span-4' },
  ColumnWidth6: { className: 'col-span-6' },
  ColumnWidth8: { className: 'col-span-8' },
  Row2Columns: { className: 'grid grid-cols-12 gap-4 col-span-12' },
  Row3Columns: { className: 'grid grid-cols-12 gap-4 col-span-12' },
  ComplexUiSchema: {
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
  },
});
