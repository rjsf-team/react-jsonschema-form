import { getSubmitButtonOptions } from '../src';

describe('getSubmitButtonOptions', () => {
  it('default props', () => {
    expect(getSubmitButtonOptions({})).toEqual({
      props: { disabled: false },
      submitText: 'Submit',
      norender: false,
    });
  });

  it('allowed option should be false', () => {
    expect(
      getSubmitButtonOptions({
        'ui:options': { submitButtonOptions: { norender: false } },
      })
    ).toEqual({
      props: {
        disabled: false,
      },
      submitText: 'Submit',
      norender: false,
    });
  });

  it('hidden option should be true', () => {
    expect(
      getSubmitButtonOptions({
        'ui:options': { submitButtonOptions: { props: { hidden: true } } },
      })
    ).toEqual({
      props: {
        hidden: true,
      },
      submitText: 'Submit',
      norender: false,
    });
  });

  it('disabled option should be true', () => {
    expect(
      getSubmitButtonOptions({
        'ui:options': { submitButtonOptions: { props: { disabled: true } } },
      })
    ).toEqual({
      props: {
        disabled: true,
      },
      submitText: 'Submit',
      norender: false,
    });
  });

  it('submitText option should be confirm', () => {
    expect(
      getSubmitButtonOptions({
        'ui:options': { submitButtonOptions: { submitText: 'Confirm' } },
      })
    ).toEqual({
      props: {
        disabled: false,
      },
      submitText: 'Confirm',
      norender: false,
    });
  });
});
