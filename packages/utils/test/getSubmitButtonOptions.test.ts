import { getSubmitButtonOptions } from '../src';
import { DEFAULT_OPTIONS } from '../src/getSubmitButtonOptions';

describe('getSubmitButtonOptions', () => {
  it('default props', () => {
    expect(getSubmitButtonOptions()).toBe(DEFAULT_OPTIONS);
  });

  it('allowed option should be false', () => {
    expect(
      getSubmitButtonOptions({
        'ui:options': { submitButtonOptions: { norender: true } },
      })
    ).toEqual({
      ...DEFAULT_OPTIONS,
      norender: true,
    });
  });

  it('hidden option should be true', () => {
    expect(
      getSubmitButtonOptions({
        'ui:options': { submitButtonOptions: { props: { hidden: true } } },
      })
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
      })
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
      })
    ).toEqual({
      ...DEFAULT_OPTIONS,
      submitText: 'Confirm',
    });
  });
});
