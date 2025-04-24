import { gridTests } from '@rjsf/snapshot-tests';

import WrappedForm from './WrappedForm';

gridTests(WrappedForm, {
  ColumnWidthAll: {},
  ColumnWidth4: {},
  ColumnWidth6: {},
  ColumnWidth8: {},
  Row2Columns: { templateColumns: 'repeat(2, 1fr)' },
  Row3Columns: { templateColumns: 'repeat(3, 1fr)' },
  ComplexUiSchema: {
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
                                style: { margin: '0 0 16px' },
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
  },
});
