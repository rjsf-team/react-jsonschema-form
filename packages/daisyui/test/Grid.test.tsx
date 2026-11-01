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
                        'ui:widget': 'date',
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
                    xs: 12,
                    children: ['person.address'],
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
                    xs: 12,
                    style: { marginTop: '20px' },
                    children: ['employment'],
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

  test("sets a column's span as its flex basis, half steps included", () => {
    expect(renderGridColumn(Form, { span: 4.5 }).column).toHaveStyle({
      flex: '0 0 calc((100% + 1rem) * 4.5 / 12 - 1rem)',
    });
  });
  test("prefers a column's own flex style", () => {
    expect(renderGridColumn(Form, { span: 4, style: { flex: '1 1 auto' } }).column).toHaveStyle({ flex: '1 1 auto' });
    expect(warnings.consoleSpy).toHaveBeenCalledWith(
      'A layout grid column\'s `span` in "root" is ignored, since the column has a width of its own',
    );
  });
  test("leaves a column's span off beside a flexBasis style of its own", () => {
    const { column } = renderGridColumn(Form, { span: 4, style: { flexBasis: '200px' } });
    expect(column).toHaveAttribute('style', 'flex-basis: 200px;');
  });
  test("leaves a column's span off beside a basis or width class of its own", () => {
    const { column } = renderGridColumn(Form, { span: 4, className: 'md:basis-1/2' });
    expect(column).toHaveClass('md:basis-1/2');
    expect(column).not.toHaveAttribute('style');
    expect(warnings.consoleSpy).toHaveBeenCalledWith(
      'A layout grid column\'s `span` in "root" is ignored, since the column has a width of its own',
    );
  });
  test("keeps a column's span beside a max-w class, which caps its width without setting it", () => {
    const { column } = renderGridColumn(Form, { span: 4, className: 'max-w-sm' });
    expect(column).toHaveStyle({ flex: '0 0 calc((100% + 1rem) * 4 / 12 - 1rem)' });
    expect(warnings.consoleSpy).not.toHaveBeenCalled();
  });
});
