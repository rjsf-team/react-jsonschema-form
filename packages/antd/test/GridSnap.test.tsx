import { gridTests, SELECT_CUSTOMIZE } from '@rjsf/snapshot-tests';

import '../__mocks__/matchMedia.mock';
import Form from '../src';
import { FORM_RENDER_OPTIONS } from './snapshotConstants';

gridTests(
  Form,
  {
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
                                  style: { margin: '44px 0 30px' },
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
    },
  },
  FORM_RENDER_OPTIONS[SELECT_CUSTOMIZE],
);
