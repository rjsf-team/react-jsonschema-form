import { gridTests } from '@rjsf/snapshot-tests';

import Form from '../src';

// Mock PrimeReact components that use parentElement or real DOM
jest.mock('primereact/dropdown', () => ({
  Dropdown: (props: Record<string, any>) => <select {...props} />,
}));

jest.mock('primereact/multiselect', () => ({
  MultiSelect: (props: Record<string, any>) => <select multiple {...props} />,
}));

jest.mock('primereact/slider', () => ({
  Slider: (props: Record<string, any>) => <input type='range' {...props} />,
}));

gridTests(Form, {
  ColumnWidthAll: { xs: 12 },
  ColumnWidth4: { xs: 4 },
  ColumnWidth6: { xs: 6 },
  ColumnWidth8: { xs: 8 },
  Row2Columns: {},
  Row3Columns: {},
  ComplexUiSchema: {
    'ui:field': 'LayoutGridField',
    'ui:layoutGrid': {
      'ui:row': {
        children: [
          {
            'ui:col': {
              children: ['person'],
            },
          },
          {
            'ui:columns': {
              xs: 4,
              children: ['person.name.first', 'person.name.middle', 'person.name.last'],
            },
          },
          {
            'ui:col': {
              sm: 4,
              children: ['person.birth_date'],
            },
          },
          {
            'ui:col': {
              sm: 8,
              children: ['person.race'],
            },
          },
          {
            'ui:col': {
              sm: 6,
              children: [
                {
                  'ui:row': {
                    children: [
                      {
                        'ui:columns': {
                          children: ['person.address.line_1', 'person.address.line_2', 'person.address.city'],
                        },
                      },
                      {
                        'ui:columns': {
                          sm: 6,
                          children: ['person.address.state', 'person.address.postal_code'],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            'ui:col': {
              sm: 6,
              children: [
                {
                  'ui:row': {
                    children: [
                      {
                        'ui:columns': {
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
                                children: ['employment.business', 'employment.title'],
                              },
                            },
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
