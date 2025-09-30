import { gridTests, TEXTAREA_CUSTOMIZE } from '@rjsf/snapshot-tests';

import Form from '../src';
import { COMPUTED_STYLE_MOCK, FORM_RENDER_OPTIONS } from './snapshotConstants';

// The `TextareaAutosize` code reads the following data from the `getComputedStyle()` function in a useEffect hook
jest.spyOn(window, 'getComputedStyle').mockImplementation(() => COMPUTED_STYLE_MOCK);

gridTests(
  Form,
  {
    ColumnWidthAll: { size: 12 },
    ColumnWidth4: { size: 4 },
    ColumnWidth6: { size: 6 },
    ColumnWidth8: { size: 8 },
    Row2Columns: { spacing: 2 },
    Row3Columns: { spacing: 2 },
    ComplexUiSchema: {
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
    },
  },
  FORM_RENDER_OPTIONS[TEXTAREA_CUSTOMIZE],
);
