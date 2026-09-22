import { useEffect, useState } from 'react';
import type { FieldProps, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { getTemplate, getUiOptions } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { act, render, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import { AcceptingParent, RejectingParent, TransformingParent, createParentLog, input } from './testUtils.tsx';

const user = userEvent.setup();

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    other: { type: 'string' },
  },
};

interface Data {
  name?: string;
  other?: string | null;
}
const validator = customizeValidator<RJSFSchema, Data>();

describe('controlled parent harnesses', () => {
  it('an accepting parent commits each proposal and the form renders the committed value', async () => {
    const log = createParentLog<Data>();
    const { container } = render(<AcceptingParent<Data> schema={schema} initialValue={{ name: 'a' }} log={log} />);

    await user.type(input(container, 'root_name'), 'bc');

    expect(input(container, 'root_name')).toHaveValue('abc');
    expect(log.value).toEqual({ name: 'abc' });
    expect(log.proposals.at(-1)).toEqual({ name: 'abc' });
  });

  it('a rejecting parent records proposals while its value stays put', async () => {
    const log = createParentLog<Data>();
    const { container } = render(<RejectingParent<Data> schema={schema} initialValue={{ name: 'a' }} log={log} />);

    await user.type(input(container, 'root_name'), 'b');

    expect(log.proposals).toEqual([{ name: 'ab' }]);
    // A controlled form renders the parent's value (RFC, section 3.2): the refused edit is never shown
    expect(input(container, 'root_name')).toHaveValue('a');
  });

  it('a transforming parent commits the transformed proposal and the form renders it', async () => {
    const log = createParentLog<Data>();
    const upper = (proposal: Data | undefined) => proposal && { ...proposal, name: proposal.name?.toUpperCase() };
    const { container } = render(
      <TransformingParent<Data> schema={schema} initialValue={{ name: '' }} log={log} transform={upper} />,
    );

    await user.type(input(container, 'root_name'), 'ab');

    expect(log.proposals).toEqual([{ name: 'a' }, { name: 'Ab' }]);
    expect(log.value).toEqual({ name: 'AB' });
    expect(input(container, 'root_name')).toHaveValue('AB');
  });

  it('two near-simultaneous changes both reach an accepting parent', async () => {
    // The Form.handlers variant merges into an external variable, which proves nothing about composition through a
    // parent. Here the parent is real and the second change composes onto the first committed value.
    function changeOnMount<V extends string | null | undefined>(from: string, to: string) {
      return function Widget(props: WidgetProps<V>) {
        const { value, id, onChange, uiSchema, registry } = props;
        const BaseInputTemplate = getTemplate('BaseInputTemplate', registry, getUiOptions(uiSchema));
        useEffect(() => {
          if (value === from) {
            onChange(to, undefined, id);
          }
        }, [value, onChange, id]);
        return <BaseInputTemplate {...props} />;
      };
    }
    const uiSchema: UiSchema<Data> = {
      name: { 'ui:widget': changeOnMount<Data['name']>('a', 'a2') },
      other: { 'ui:widget': changeOnMount<Data['other']>('b', 'b2') },
    };
    const log = createParentLog<Data>();

    await act(async () => {
      render(
        <AcceptingParent<Data>
          schema={schema}
          uiSchema={uiSchema}
          initialValue={{ name: 'a', other: 'b' }}
          log={log}
        />,
      );
    });

    await waitFor(() => expect(log.value).toEqual({ name: 'a2', other: 'b2' }));
  });

  it('a dependent field clearing itself from an effect when its sibling changes (#3367)', async () => {
    // The second field watches the first through formContext and clears itself from an effect, so its onChange(null)
    // fires in the very commit that shows the sibling's change, and both must survive the trip through the parent
    // (RFC, section 5).
    // The parent is written out rather than using the harness because formContext has to derive from its state.
    function ClearWhenSiblingChanges({
      formData,
      fieldPath,
      onChange,
      registry,
    }: FieldProps<string | null | undefined, RJSFSchema, Data>) {
      const sibling = registry.formContext.name;
      useEffect(() => {
        if (sibling) {
          onChange(null, fieldPath);
        }
      }, [sibling, fieldPath, onChange]);
      return <span id='root_other'>{formData ?? 'null'}</span>;
    }
    const uiSchema: UiSchema<Data, RJSFSchema, Data> = { other: { 'ui:field': ClearWhenSiblingChanges } };
    const committed: (Data | undefined)[] = [];
    function Parent() {
      const [data, setData] = useState<Data | undefined>({ name: '', other: 'keep' });
      committed.push(data);
      return (
        <Form<Data, RJSFSchema, Data>
          schema={schema}
          uiSchema={uiSchema}
          validator={validator}
          formData={data}
          formContext={{ name: data?.name }}
          onChange={(event) => setData(event.formData)}
        />
      );
    }
    const { container } = render(<Parent />);

    await user.type(input(container, 'root_name'), 'x');

    await waitFor(() => expect(committed.at(-1)).toEqual({ name: 'x', other: null }));
  });
});
