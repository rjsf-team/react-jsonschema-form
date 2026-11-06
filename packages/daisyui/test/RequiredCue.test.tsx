import { requiredCueTests } from '@rjsf/snapshot-tests';
import type { WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form, { getGroupAndOptionProps } from '../src/index.ts';

requiredCueTests(Form);

describe('getGroupAndOptionProps()', () => {
  function CustomCheckboxes({ id, presentation, registry }: WidgetProps) {
    const { group, requiredCue } = getGroupAndOptionProps({ id, presentation, role: 'group', registry });
    return (
      <div {...group}>
        <input type='checkbox' aria-label='a' />
        {requiredCue && <span {...requiredCue} />}
      </div>
    );
  }

  it('names a required group of checkboxes as required where it is handed the registry', () => {
    render(
      <Form
        schema={{
          type: 'object',
          required: ['c'],
          properties: {
            c: {
              type: 'array',
              title: 'Colors',
              items: { type: 'string', enum: ['a'] },
              uniqueItems: true,
              minItems: 1,
            },
          },
        }}
        uiSchema={{ c: { 'ui:widget': 'checkboxes' } }}
        widgets={{ CheckboxesWidget: CustomCheckboxes }}
        validator={validator}
      />,
    );
    expect(screen.getByRole('group', { name: 'Colors required' })).toBeInTheDocument();
  });
});
