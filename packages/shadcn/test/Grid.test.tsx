import { gridTests, renderGridColumn } from '@rjsf/snapshot-tests';

import { setupConsoleWarnSuppression } from '../../../testing/consoleSuppression.ts';
import Form from '../src/index.ts';

gridTests(Form, {
  ColumnWidthAll: { span: 12 },
  ColumnWidth4: { span: 4 },
  ColumnWidth6: { span: 6 },
  ColumnWidth8: { span: 8 },
  Row2Columns: { className: 'grid grid-cols-12 gap-4 col-span-12' },
  Row3Columns: { className: 'grid grid-cols-12 gap-4 col-span-12' },
  ComplexUiSchema: {
    'ui:field': 'LayoutGridField',
    'ui:layoutGrid': {
      'ui:row': [
        {
          'ui:row': {
            className: 'grid grid-cols-1 gap-4 col-span-12',
            children: [
              {
                'ui:col': {
                  children: ['person'],
                },
              },
            ],
          },
        },
        {
          'ui:row': {
            className: 'grid grid-cols-12 gap-4 col-span-12',
            children: [
              {
                'ui:columns': {
                  className: 'col-span-4',
                  children: ['person.name.first', 'person.name.middle', 'person.name.last'],
                },
              },
            ],
          },
        },
        {
          'ui:row': {
            className: 'grid grid-cols-12 gap-4 col-span-12',
            children: [
              {
                'ui:col': {
                  className: 'col-span-3',
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
                  className: 'col-span-6',
                  children: ['person.race'],
                },
              },
            ],
          },
        },
        {
          'ui:row': {
            className: 'grid grid-cols-12 gap-4 col-span-12 grid-rows-4',
            children: [
              {
                'ui:col': {
                  className: 'col-span-6 row-span-4',
                  children: ['person.address'],
                },
              },
              {
                'ui:col': {
                  className: 'col-span-6 row-span-1 flex items-center',
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
                        className: 'col-span-6 row-span-1',
                        children: ['employment.business', 'employment.title'],
                      },
                    },
                    {
                      'ui:col': {
                        className: 'col-span-4 row-span-1',
                        children: ['employment.location.city'],
                      },
                    },
                    {
                      'ui:col': {
                        className: 'col-span-2 row-span-1',
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
                        className: 'col-span-6 row-span-1',
                        children: ['employment.district', 'employment.school', 'employment.title'],
                      },
                    },
                    {
                      'ui:col': {
                        className: 'col-span-4 row-span-1',
                        children: ['employment.location.city'],
                      },
                    },
                    {
                      'ui:col': {
                        className: 'col-span-2 row-span-1',
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
                        className: 'col-span-6 row-span-3',
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
            className: 'grid grid-cols-12 gap-4',
            children: [
              {
                'ui:columns': {
                  className: 'col-span-12',
                  children: ['line_1', 'line_2', 'city'],
                },
              },
              {
                'ui:row': {
                  className: 'grid-cols-12 col-span-12',
                  children: [
                    {
                      'ui:columns': {
                        className: 'col-span-6',
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

  test("sets a column's span as its gridColumn", () => {
    expect(renderGridColumn(Form, { span: 4 }).column).toHaveStyle({ gridColumn: 'span 4 / span 4' });
  });
  test("prefers a column's own col-span class", () => {
    const { column } = renderGridColumn(Form, { span: 4, className: 'md:col-span-6' });
    expect(column).toHaveClass('md:col-span-6');
    expect(column.style.gridColumn).toBe('');
    expect(warnings.consoleSpy).toHaveBeenCalledWith(
      'A layout grid column\'s `span` in "root_name" is ignored, since the column has a `col-span-*` class of its own',
    );
  });
  test('lays a row without grid-cols out on 12 tracks, a column without a span across all of them', () => {
    expect(renderGridColumn(Form, {}).row).toHaveClass('grid-cols-12', '[:where(&)>*]:col-span-full');
  });
  test('leaves a row with grid-cols of its own to it', () => {
    const { row } = renderGridColumn(Form, {}, { className: 'grid-cols-3' });
    expect(row).toHaveClass('grid-cols-3');
    expect(row).not.toHaveClass('grid-cols-12');
    expect(row).not.toHaveClass('[:where(&)>*]:col-span-full');
  });
  test.each([{ gridTemplateColumns: 'repeat(3, 1fr)' }, { gridTemplateAreas: '"a b"' }])(
    'leaves a row with a %o style of its own to it',
    (style) => {
      const { row } = renderGridColumn(Form, {}, { style });
      expect(row).toHaveStyle(style);
      expect(row).not.toHaveClass('grid-cols-12');
      expect(row).not.toHaveClass('[:where(&)>*]:col-span-full');
    },
  );
  test.each([{ gridTemplate: 'auto / 1fr 1fr' }, { grid: 'auto / 1fr 1fr' }])(
    'leaves a row with a %o shorthand style of its own to it',
    (style) => {
      const { row } = renderGridColumn(Form, {}, { style });
      expect(row).not.toHaveClass('grid-cols-12');
      expect(row).not.toHaveClass('[:where(&)>*]:col-span-full');
    },
  );
  test('warns that a half step is not a whole number', () => {
    renderGridColumn(Form, { span: 4.5 });
    expect(warnings.consoleSpy).toHaveBeenCalledWith(
      'A layout grid column\'s `span` of 4.5 in "root_name" is not a whole number, which this theme\'s grid needs',
    );
  });
});
