import { DEFAULT_OPTIONS } from '../src/getSubmitButtonOptions.ts';
import type { UiSchema } from '../src/index.ts';
import { getSubmitButtonOptions } from '../src/index.ts';

describe('getSubmitButtonOptions', () => {
  it('default props', () => {
    expect(getSubmitButtonOptions()).toBe(DEFAULT_OPTIONS);
  });

  it('allowed option should be false', () => {
    expect(
      getSubmitButtonOptions({
        'ui:options': { submitButtonOptions: { norender: true } },
      }),
    ).toEqual({
      ...DEFAULT_OPTIONS,
      norender: true,
    });
  });

  it('hidden option should be true', () => {
    expect(
      getSubmitButtonOptions({
        'ui:options': { submitButtonOptions: { props: { hidden: true } } },
      }),
    ).toEqual({
      ...DEFAULT_OPTIONS,
      props: {
        hidden: true,
      },
    });
  });

  it('disabled option should be true', () => {
    expect(
      getSubmitButtonOptions({
        'ui:options': { submitButtonOptions: { props: { disabled: true } } },
      }),
    ).toEqual({
      ...DEFAULT_OPTIONS,
      props: {
        disabled: true,
      },
    });
  });

  it('submitText option should be confirm', () => {
    expect(
      getSubmitButtonOptions({
        'ui:options': { submitButtonOptions: { submitText: 'Confirm' } },
      }),
    ).toEqual({
      ...DEFAULT_OPTIONS,
      submitText: 'Confirm',
    });
  });

  it('takes the default props for props a JSON uiSchema sets to null', () => {
    const uiSchema: UiSchema = JSON.parse('{"ui:submitButtonOptions": {"props": null, "submitText": "Send"}}');

    expect(getSubmitButtonOptions(uiSchema)).toEqual({ ...DEFAULT_OPTIONS, submitText: 'Send' });
  });

  it.each(['false', '"wide"', '2', '[]'])('takes the default props for props a JSON uiSchema sets to %s', (props) => {
    const uiSchema: UiSchema = JSON.parse(`{"ui:submitButtonOptions": {"props": ${props}, "submitText": "Send"}}`);

    expect(getSubmitButtonOptions(uiSchema)).toEqual({ ...DEFAULT_OPTIONS, submitText: 'Send' });
  });
});
