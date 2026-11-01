import { gridTests, renderGridColumn } from '@rjsf/snapshot-tests';

import { setupConsoleWarnSuppression } from '../../../testing/consoleSuppression.ts';
import Form from '../src/index.ts';

gridTests(Form, {
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
});

describe('GridTemplate span', () => {
  const warnings = setupConsoleWarnSuppression();

  test("doubles a column's span into antd's 24ths", () => {
    expect(renderGridColumn(Form, { span: 4 }).column).toHaveClass('ant-col-8');
  });
  test('takes a half step as an odd 24th', () => {
    expect(renderGridColumn(Form, { span: 4.5 }).column).toHaveClass('ant-col-9');
  });
  test('rounds a span to the nearest 24th', () => {
    expect(renderGridColumn(Form, { span: 4.3 }).column).toHaveClass('ant-col-9');
  });
  test('warns about a span over 12, which only a pre-v7 24ths span can be', () => {
    renderGridColumn(Form, { span: 16 });
    expect(warnings.consoleSpy).toHaveBeenCalledWith(
      'A layout grid column\'s `span` of 16 in "root" is more than 12: `span` counts twelfths of a row, ' +
        "where antd's counted 24ths before v7, so halve it",
    );
  });
  test('does not warn about a span of 12 or under', () => {
    renderGridColumn(Form, { span: 12 });
    expect(warnings.consoleSpy).not.toHaveBeenCalled();
  });
});
