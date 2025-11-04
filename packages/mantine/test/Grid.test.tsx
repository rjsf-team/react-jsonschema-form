import { gridTests } from '@rjsf/snapshot-tests';

import WrappedForm from './WrappedForm';

gridTests(WrappedForm, {
  ColumnWidthAll: { span: 12 },
  ColumnWidth4: { span: 4 },
  ColumnWidth6: { span: 6 },
  ColumnWidth8: { span: 8 },
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
                    span: 12,
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
                    span: 4,
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
                    span: 4,
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
                    span: 8,
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
                    span: 5,
                    children: ['person.address'],
                  },
                },
                {
                  'ui:col': {
                    span: 7,
                    children: [
                      {
                        'ui:row': {
                          children: [
                            {
                              'ui:col': {
                                span: 12,
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
                                      span: 12,
                                      children: ['employment.business', 'employment.title'],
                                    },
                                  },
                                  {
                                    'ui:col': {
                                      span: 8,
                                      children: ['employment.location.city'],
                                    },
                                  },
                                  {
                                    'ui:col': {
                                      span: 4,
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
                                      span: 12,
                                      children: ['employment.district', 'employment.school', 'employment.title'],
                                    },
                                  },
                                  {
                                    'ui:col': {
                                      span: 8,
                                      children: ['employment.location.city'],
                                    },
                                  },
                                  {
                                    'ui:col': {
                                      span: 4,
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
                                      span: 12,
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
                  span: 12,
                  children: ['line_1', 'line_2', 'city'],
                },
              },
              {
                'ui:row': {
                  gutter: 'xs',
                  children: [
                    {
                      'ui:columns': {
                        span: 6,
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
