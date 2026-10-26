import { getTestRegistry } from '@rjsf/core/testing';
import { toFieldPath } from '@rjsf/utils';
import { render } from '@testing-library/react';

import FieldTemplate from '../src/FieldTemplate/FieldTemplate.tsx';
import { generateTemplates } from '../src/index.ts';

describe('FieldTemplate rendered without a plan, as outside SchemaField', () => {
  function renderTemplate(displayLabel: boolean) {
    const registry = getTestRegistry({}, {}, generateTemplates());
    return render(
      <FieldTemplate
        id='root_foo'
        fieldPath={toFieldPath('foo')}
        label='Foo'
        keyName='foo'
        description={<span id='root_foo__description'>About foo</span>}
        rawDescription='About foo'
        // oxlint-disable-next-line typescript/no-deprecated -- a template rendered without a plan reads the deprecated prop
        displayLabel={displayLabel}
        schema={{ type: 'string' }}
        registry={registry}
        readonly={false}
        disabled={false}
        hasErrors={false}
        required={false}
        onChange={vi.fn()}
        onKeyRename={vi.fn()}
        onKeyRenameBlur={vi.fn()}
        onRemoveProperty={vi.fn()}
      >
        <input id='root_foo' />
      </FieldTemplate>,
    );
  }

  it('draws the description where displayLabel lets it draw the label', () => {
    const { container } = renderTemplate(true);
    expect(container.querySelector('#root_foo__description')).toHaveTextContent('About foo');
  });

  it('draws no description where displayLabel turns the label off', () => {
    const { container } = renderTemplate(false);
    expect(container.querySelector('#root_foo__description')).toBeNull();
  });
});
