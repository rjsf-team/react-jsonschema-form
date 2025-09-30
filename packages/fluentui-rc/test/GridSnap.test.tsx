import { gridTests } from '@rjsf/snapshot-tests';

import Form from '../src';

gridTests(Form, {
  ColumnWidthAll: { style: { gridRow: 'auto / auto', gridColumn: 'auto / auto' } },
  ColumnWidth4: { style: { gridRow: 'auto / auto', gridColumn: 'auto / auto' } },
  ColumnWidth6: { style: { gridRow: 'auto / auto', gridColumn: 'auto / auto' } },
  ColumnWidth8: { style: { gridRow: 'auto / auto', gridColumn: 'auto / auto' } },
  Row2Columns: { rows: 'repeat(1, 1fr)', columns: 'repeat(2, 1fr)', style: { columnGap: '5px', rowGap: '5px' } },
  Row3Columns: { rows: 'repeat(3, 1fr)', columns: 'repeat(3, 1fr)', style: { columnGap: '5px', rowGap: '5px' } },
  ComplexUiSchema: {
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
  },
});
