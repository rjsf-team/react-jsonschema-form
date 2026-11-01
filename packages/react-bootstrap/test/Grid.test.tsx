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
                    xs: 12,
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
                    xs: 4,
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
                    xs: 4,
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
                    xs: 8,
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
                    xs: 5,
                    children: ['person.address'],
                  },
                },
                {
                  'ui:col': {
                    xs: 7,
                    children: [
                      {
                        'ui:row': {
                          children: [
                            {
                              'ui:col': {
                                xs: 12,
                                style: { margin: '38px 0 6px' },
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
                                      xs: 12,
                                      children: ['employment.business', 'employment.title'],
                                    },
                                  },
                                  {
                                    'ui:col': {
                                      xs: 8,
                                      children: ['employment.location.city'],
                                    },
                                  },
                                  {
                                    'ui:col': {
                                      xs: 4,
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
                                      xs: 12,
                                      children: ['employment.district', 'employment.school', 'employment.title'],
                                    },
                                  },
                                  {
                                    'ui:col': {
                                      xs: 8,
                                      children: ['employment.location.city'],
                                    },
                                  },
                                  {
                                    'ui:col': {
                                      xs: 4,
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
                                      xs: 12,
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
                  xs: 12,
                  children: ['line_1', 'line_2', 'city'],
                },
              },
              {
                'ui:row': {
                  spacing: 2,
                  children: [
                    {
                      'ui:columns': {
                        xs: 6,
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

  test("sets a column's span as its xs", () => {
    expect(renderGridColumn(Form, { span: 4 }).column).toHaveClass('col-4');
  });
  test("prefers a column's own xs", () => {
    const { column } = renderGridColumn(Form, { span: 4, xs: 6 });
    expect(column).toHaveClass('col-6');
    expect(column).not.toHaveClass('col-4');
    expect(warnings.consoleSpy).toHaveBeenCalledWith(
      'A layout grid column\'s `span` in "root" is ignored, since the column has an `xs` of its own',
    );
  });
  test('warns that a half step is not a whole number', () => {
    renderGridColumn(Form, { span: 4.5 });
    expect(warnings.consoleSpy).toHaveBeenCalledWith(
      'A layout grid column\'s `span` of 4.5 in "root" is not a whole number, which this theme\'s grid needs',
    );
  });
});
