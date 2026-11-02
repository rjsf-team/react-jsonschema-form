import { gridTests, renderGridColumn } from '@rjsf/snapshot-tests';

import { setupConsoleWarnSuppression } from '../../../testing/consoleSuppression.ts';
import Form from '../src/index.ts';

gridTests(Form, {
  ColumnWidthAll: { span: 12 },
  ColumnWidth4: { span: 4 },
  ColumnWidth6: { span: 6 },
  ColumnWidth8: { span: 8 },
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
});

describe('GridTemplate span', () => {
  const warnings = setupConsoleWarnSuppression();

  test("sets a column's span as its size, half steps included", () => {
    expect(renderGridColumn(Form, { span: 4.5 }).column).toHaveClass('MuiGrid-grid-xs-4.5');
  });
  test("prefers a column's own size", () => {
    const { column } = renderGridColumn(Form, { span: 4, size: 6 });
    expect(column).toHaveClass('MuiGrid-grid-xs-6');
    expect(column).not.toHaveClass('MuiGrid-grid-xs-4');
    expect(warnings.consoleSpy).toHaveBeenCalledWith(
      'A layout grid column\'s `span` in "root_name" is ignored, since the column has a `size` of its own',
    );
  });
  test('grows a row without a size to fill its line, so a row nested in a row takes a line of its own', () => {
    const { row, column } = renderGridColumn(Form, {}, { sx: { padding: '4px' } });
    expect(row).toHaveStyle({ flex: '1 1 100%', padding: '4px' });
    expect(column).not.toHaveStyle({ flex: '1 1 100%' });
  });
  test("leaves a row's own size to size it", () => {
    expect(renderGridColumn(Form, {}, { size: 6 }).row).not.toHaveStyle({ flex: '1 1 100%' });
  });
  test.each([
    [{ sx: { width: '50%' } }, { width: '50%' }],
    [{ sx: [{ padding: '4px' }, { width: '50%' }] }, { width: '50%' }],
    [{ style: { width: '50%' } }, { width: '50%' }],
    [{ sx: { flexBasis: '50%' } }, { flexBasis: '50%' }],
    [{ style: { flexGrow: 0 } }, { flexGrow: 0 }],
    [{ sx: () => ({ width: '50%' }) }, { width: '50%' }],
    [{ sx: [{ padding: '4px' }, () => ({ width: '50%' })] }, { width: '50%' }],
  ])("leaves a row's own %o flex or width to size it", (rowProps, ownStyle) => {
    const { row } = renderGridColumn(Form, {}, rowProps);
    expect(row).toHaveStyle(ownStyle);
    expect(row).not.toHaveStyle({ flexGrow: 1 });
    expect(row).not.toHaveStyle({ flexBasis: '100%' });
  });
});
