import { gridTests, renderGridColumn } from '@rjsf/snapshot-tests';

import { setupConsoleWarnSuppression } from '../../../testing/consoleSuppression.ts';
import Form from '../src/index.ts';

// oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
gridTests(Form, {
  ColumnWidthAll: { span: 12 },
  ColumnWidth4: { span: 4 },
  ColumnWidth6: { span: 6 },
  ColumnWidth8: { span: 8 },
  Row2Columns: { className: 'row' },
  Row3Columns: { className: 'row' },
  ComplexUiSchema: {
    'ui:field': 'LayoutGridField',
    'ui:layoutGrid': {
      'ui:row': [
        {
          'ui:row': {
            className: 'row',
            children: [
              {
                'ui:col': {
                  className: 'col-xs-12',
                  children: ['person'],
                },
              },
            ],
          },
        },
        {
          'ui:row': {
            className: 'row',
            children: [
              {
                'ui:columns': {
                  className: 'col-xs-4',
                  children: ['person.name.first', 'person.name.middle', 'person.name.last'],
                },
              },
            ],
          },
        },
        {
          'ui:row': {
            className: 'row',
            children: [
              {
                'ui:col': {
                  className: 'col-xs-3',
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
                  className: 'col-xs-6',
                  children: ['person.race'],
                },
              },
            ],
          },
        },
        {
          'ui:row': {
            className: 'row',
            children: [
              {
                'ui:col': {
                  className: 'col-xs-6',
                  children: ['person.address'],
                },
              },
              {
                'ui:col': {
                  className: 'col-xs-6',
                  style: { margin: '26px 0' },
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
                        className: 'col-xs-6',
                        children: ['employment.business', 'employment.title'],
                      },
                    },
                    {
                      'ui:col': {
                        className: 'col-xs-4',
                        children: ['employment.location.city'],
                      },
                    },
                    {
                      'ui:col': {
                        className: 'col-xs-2',
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
                        className: 'col-xs-6',
                        children: ['employment.district', 'employment.school', 'employment.title'],
                      },
                    },
                    {
                      'ui:col': {
                        className: 'col-xs-4',
                        children: ['employment.location.city'],
                      },
                    },
                    {
                      'ui:col': {
                        className: 'col-xs-2',
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
                        className: 'col-xs-6',
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
            className: 'row',
            children: [
              {
                'ui:columns': {
                  className: 'col-xs-12',
                  children: ['line_1', 'line_2', 'city'],
                },
              },
              {
                'ui:row': {
                  children: [
                    {
                      'ui:columns': {
                        className: 'col-xs-6',
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

  test("sets a column's span as its col-xs class", () => {
    // oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
    const { row, column } = renderGridColumn(Form, { span: 4 }, { className: 'row' });
    expect(column).toHaveClass('rjsf-grid-column', 'col-xs-4');
    expect(row).toHaveClass('row');
  });
  test("prefers a column's own col-xs class", () => {
    // oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
    const { column } = renderGridColumn(Form, { span: 4, className: 'col-xs-6' });
    expect(column).toHaveClass('col-xs-6');
    expect(column).not.toHaveClass('col-xs-4');
    expect(warnings.consoleSpy).toHaveBeenCalledWith(
      'A layout grid column\'s `span` in "root_name" is ignored, since the column has a `col-xs-*` class of its own',
    );
  });
  test("keeps a column's span beside a col-xs-offset class of its own", () => {
    // oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
    const { column } = renderGridColumn(Form, { span: 4, className: 'col-xs-offset-2' });
    expect(column).toHaveClass('col-xs-4', 'col-xs-offset-2');
    expect(warnings.consoleSpy).not.toHaveBeenCalled();
  });
  test("keeps a column's span below a breakpoint class of its own", () => {
    // oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
    const { column } = renderGridColumn(Form, { span: 4, className: 'col-md-6' });
    expect(column).toHaveClass('col-xs-4', 'col-md-6');
    expect(warnings.consoleSpy).not.toHaveBeenCalled();
  });
  test('warns that a half step is not a whole number', () => {
    // oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
    renderGridColumn(Form, { span: 4.5 });
    expect(warnings.consoleSpy).toHaveBeenCalledWith(
      'A layout grid column\'s `span` of 4.5 in "root_name" is not a whole number, which this theme\'s grid needs',
    );
  });
});
