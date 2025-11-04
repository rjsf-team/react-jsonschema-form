import { gridTests } from '@rjsf/snapshot-tests';

import Form from '../src';

/** Mock the `react-component-ref` component used by semantic-ui to simply render the children, otherwise tests fail */
jest.mock('@fluentui/react-component-ref', () => ({
  ...jest.requireActual('@fluentui/react-component-ref'),
  Ref: jest.fn().mockImplementation(({ children }) => children),
}));

gridTests(Form, {
  ColumnWidthAll: { width: 18, style: { paddingBottom: 0 } },
  ColumnWidth4: { width: 5, style: { paddingBottom: 0 } },
  ColumnWidth6: { width: 8, style: { paddingBottom: 0 } },
  ColumnWidth8: { width: 11, style: { paddingBottom: 0 } },
  Row2Columns: { container: true, style: { width: '100%' } },
  Row3Columns: { container: true, style: { width: '100%' } },
  ComplexUiSchema: {
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
  },
});
