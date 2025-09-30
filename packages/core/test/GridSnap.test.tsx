import { gridTests } from '@rjsf/snapshot-tests';

import Form from '../src';

gridTests(Form, {
  ColumnWidthAll: { className: 'col-xs-12' },
  ColumnWidth4: { className: 'col-xs-4' },
  ColumnWidth6: { className: 'col-xs-6' },
  ColumnWidth8: { className: 'col-xs-8' },
  Row2Columns: { className: 'row' },
  Row3Columns: { className: 'row' },
  ComplexUiSchema: {
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
                  style: { margin: '26px 0' },
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
  },
});
