import { gridTests, renderGridColumn } from '@rjsf/snapshot-tests';

import { setupConsoleWarnSuppression } from '../../../testing/consoleSuppression.ts';
import WrappedForm from './WrappedForm.tsx';

gridTests(WrappedForm, {
  ColumnWidthAll: { span: 12 },
  ColumnWidth4: { span: 4 },
  ColumnWidth6: { span: 6 },
  ColumnWidth8: { span: 8 },
  Row2Columns: { gap: 2 },
  Row3Columns: { gap: 2 },
  ComplexUiSchema: {
    'ui:field': 'LayoutGridField',
    'ui:layoutGrid': {
      'ui:row': {
        gap: 2,
        children: [
          {
            'ui:row': {
              gap: 2,
              templateColumns: 'repeat(1, 1fr)',
              children: [
                {
                  'ui:col': ['person'],
                },
              ],
            },
          },
          {
            'ui:row': {
              gap: 2,
              templateColumns: 'repeat(3, 1fr)',
              children: [
                {
                  'ui:columns': ['person.name.first', 'person.name.middle', 'person.name.last'],
                },
              ],
            },
          },
          {
            'ui:row': {
              gap: 2,
              templateColumns: 'repeat(3, 1fr)',
              children: [
                {
                  'ui:col': {
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
                    colSpan: 2,
                    children: ['person.race'],
                  },
                },
              ],
            },
          },
          {
            'ui:row': {
              gap: 2,
              templateColumns: 'repeat(2, 1fr)',
              children: [
                {
                  'ui:col': {
                    children: ['person.address'],
                  },
                },
                {
                  'ui:col': {
                    children: [
                      {
                        'ui:row': {
                          gap: 2,
                          templateColumns: 'repeat(3, 1fr)',
                          children: [
                            {
                              'ui:col': {
                                colSpan: 3,
                                style: { margin: '0 0 16px' },
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
                                      colSpan: 3,
                                      children: ['employment.business', 'employment.title'],
                                    },
                                  },
                                  {
                                    'ui:col': {
                                      colSpan: 2,
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
                                      colSpan: 3,
                                      children: ['employment.district', 'employment.school', 'employment.title'],
                                    },
                                  },
                                  {
                                    'ui:col': {
                                      colSpan: 2,
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
                                      colSpan: 3,
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
            gap: 2,
            templateColumns: 'repeat(2, 1fr)',
            children: [
              {
                'ui:columns': {
                  colSpan: 2,
                  children: ['line_1', 'line_2', 'city'],
                },
              },
              {
                'ui:columns': {
                  size: 6,
                  children: ['state', 'postal_code'],
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

  test("sets a column's span as its colSpan", () => {
    expect(renderGridColumn(WrappedForm, { span: 4 }).column).toHaveStyle({ gridColumn: 'span 4/span 4' });
  });
  test("prefers a column's own colSpan", () => {
    expect(renderGridColumn(WrappedForm, { span: 4, colSpan: 6 }).column).toHaveStyle({ gridColumn: 'span 6/span 6' });
    expect(warnings.consoleSpy).toHaveBeenCalledWith(
      'A layout grid column\'s `span` in "root" is ignored, since the column has a `colSpan` of its own',
    );
  });
  test('lays a row without templateColumns out on 12 tracks, a column without a span across all of them', () => {
    const { row, column } = renderGridColumn(WrappedForm, {});
    expect(row).toHaveStyle({ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' });
    expect(column).toHaveStyle({ gridColumn: '1/-1' });
  });
  test('keeps a column without a span across the row when the row has a css of its own', () => {
    const { row, column } = renderGridColumn(WrappedForm, {}, { css: { padding: '4px' } });
    expect(row).toHaveStyle({ padding: '4px' });
    expect(column).toHaveStyle({ gridColumn: '1/-1' });
  });
  test('leaves a row with templateColumns of its own to it', () => {
    const { row, column } = renderGridColumn(WrappedForm, {}, { templateColumns: 'repeat(3, 1fr)' });
    expect(row).toHaveStyle({ gridTemplateColumns: 'repeat(3, 1fr)' });
    expect(column).not.toHaveStyle({ gridColumn: '1/-1' });
  });
  test('warns that a half step is not a whole number', () => {
    renderGridColumn(WrappedForm, { span: 4.5 });
    expect(warnings.consoleSpy).toHaveBeenCalledWith(
      'A layout grid column\'s `span` of 4.5 in "root" is not a whole number, which this theme\'s grid needs',
    );
  });
  test('leaves a row with templateAreas of its own to it', () => {
    const { row, column } = renderGridColumn(WrappedForm, {}, { templateAreas: '"a b"' });
    expect(row).not.toHaveStyle({ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' });
    expect(column).not.toHaveStyle({ gridColumn: '1/-1' });
  });
});
