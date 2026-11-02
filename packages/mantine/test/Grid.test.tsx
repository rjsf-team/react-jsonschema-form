import { gridTests, renderGridColumn } from '@rjsf/snapshot-tests';

import { setupConsoleWarnSuppression } from '../../../testing/consoleSuppression.ts';
import WrappedForm from './WrappedForm.tsx';

gridTests(WrappedForm, {
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
                    span: 12,
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
                    span: 4,
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
                    span: 4,
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
                    span: 8,
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
                    span: 5,
                    children: ['person.address'],
                  },
                },
                {
                  'ui:col': {
                    span: 7,
                    children: [
                      {
                        'ui:row': {
                          children: [
                            {
                              'ui:col': {
                                span: 12,
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
                                      span: 12,
                                      children: ['employment.business', 'employment.title'],
                                    },
                                  },
                                  {
                                    'ui:col': {
                                      span: 8,
                                      children: ['employment.location.city'],
                                    },
                                  },
                                  {
                                    'ui:col': {
                                      span: 4,
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
                                      span: 12,
                                      children: ['employment.district', 'employment.school', 'employment.title'],
                                    },
                                  },
                                  {
                                    'ui:col': {
                                      span: 8,
                                      children: ['employment.location.city'],
                                    },
                                  },
                                  {
                                    'ui:col': {
                                      span: 4,
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
                                      span: 12,
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
                  span: 12,
                  children: ['line_1', 'line_2', 'city'],
                },
              },
              {
                'ui:row': {
                  gutter: 'xs',
                  children: [
                    {
                      'ui:columns': {
                        span: 6,
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
  // `LayoutGridField` warns about the row's span, which would otherwise land on the DOM unexplained
  setupConsoleWarnSuppression();

  test("keeps a row's span off the element", () => {
    expect(renderGridColumn(WrappedForm, {}, { span: 6 }).row).not.toHaveAttribute('span');
  });
  test("takes a column's half-step span natively", () => {
    renderGridColumn(WrappedForm, { span: 4.5 });
    // 4.5 of mantine's 12 columns, in the flex basis `Grid.Col` writes into its own `<style>`
    const styles = Array.from(document.querySelectorAll('style'), (style) => style.textContent).join('');
    expect(styles).toContain('calc(37.5%');
  });
  test('grows a row without a fluid container to fill its line, so a row nested in a row takes a line of its own', () => {
    expect(renderGridColumn(WrappedForm, {}, { fluid: false }).row).toHaveStyle({ flex: '1 1 100%' });
  });
  test("leaves a row's own w to size it", () => {
    const { row } = renderGridColumn(WrappedForm, {}, { fluid: false, w: '50%' });
    expect(row).toHaveStyle({ width: '50%' });
    expect(row).not.toHaveStyle({ flex: '1 1 100%' });
  });
  // A responsive style prop is written to a class, which the fill's inline `flex` would beat
  test("leaves a row's own responsive flex to size it", () => {
    const { row } = renderGridColumn(WrappedForm, {}, { fluid: false, flex: { base: '0 0 50%', sm: '0 0 40%' } });
    expect(row).not.toHaveStyle({ flexGrow: 1 });
    expect(row).not.toHaveStyle({ flexBasis: '100%' });
  });
  test.each([
    [{ width: '50%' }, { width: '50%' }],
    [[{ padding: '4px' }, { width: '50%' }], { width: '50%' }],
    [[{ padding: '4px' }, [{ width: '50%' }]], { width: '50%' }],
    [{ flexBasis: '50%' }, { flexBasis: '50%' }],
    [{ flexGrow: 0 }, { flexGrow: 0 }],
    [() => ({ width: '50%' }), { width: '50%' }],
  ])("leaves a row's own flex or width style, %o, to size it", (style, ownStyle) => {
    const { row } = renderGridColumn(WrappedForm, {}, { fluid: false, style });
    expect(row).toHaveStyle(ownStyle);
    expect(row).not.toHaveStyle({ flexGrow: 1 });
    expect(row).not.toHaveStyle({ flexBasis: '100%' });
  });
});
