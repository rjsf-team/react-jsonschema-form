import { createRef } from 'react';
import type { RJSFSchema, UiOptions, ValidatorType } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import Form, { withStrictUiSchema } from '../src/index.ts';
import { renderNode } from './testUtils.tsx';

describe('withStrictUiSchema', () => {
  it('renders the wrapped Form, forwarding uiSchema and every other prop unchanged', () => {
    const StrictForm = withStrictUiSchema(Form);
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    };
    const uiSchema: UiOptions<{ name: string }> = {
      name: { 'ui:placeholder': 'Enter your name' },
    };

    const { node } = renderNode(StrictForm, {
      schema,
      uiSchema,
      validator,
      formData: { name: '' },
    });

    expect(node?.querySelector('input[placeholder="Enter your name"]')).not.toBeNull();
  });

  it('forwards a ref through to the wrapped Form', () => {
    const ref = createRef<Form>();
    const StrictForm = withStrictUiSchema(Form);
    const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };

    renderNode(StrictForm, {
      schema,
      uiSchema: {},
      validator,
      ref,
    });

    expect(ref.current?.submit).not.toBeUndefined();
  });

  it('catches an inline uiSchema literal mistake at compile time, unlike plain Form', () => {
    // This is the entire reason withStrictUiSchema exists: FormProps['uiSchema'] is typed as the permissive
    // UiSchema<T,S,F>, so an inline uiSchema literal (as opposed to one assigned to an intermediate
    // `const x: UiOptions<T> = {...}` first) gets no narrowing at all when passed straight to `Form`/a themed Form.
    // withStrictUiSchema's wrapped component only exposes UiOptions on `uiSchema`, with no permissive fallback, so
    // the same mistake is a compile error there. No runtime assertion here - the value is what `tsc` does with it
    // (via `pnpm run typecheck` at the repo root, which covers this `test/` project).
    const StrictForm = withStrictUiSchema<{ name: string }>(Form);
    const PlainForm = Form;
    const fakeValidator = validator as unknown as ValidatorType<{ name: string }>;

    <PlainForm
      schema={{}}
      uiSchema={{ name: { 'ui:widget': 'ThisWidgetNameDoesNotExistAnywhere' } }}
      validator={fakeValidator}
    />;
    <StrictForm
      schema={{}}
      // @ts-expect-error `name` is a string field; ThisWidgetNameDoesNotExistAnywhere isn't a valid string widget
      uiSchema={{ name: { 'ui:widget': 'ThisWidgetNameDoesNotExistAnywhere' } }}
      validator={fakeValidator}
    />;
  });
});
