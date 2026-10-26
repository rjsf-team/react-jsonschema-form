import { getAdditionalKeyAttributes, resolveFieldPresentation } from '../src/index.ts';

const planShowing = (errors: string[]) =>
  resolveFieldPresentation({
    id: 'root_a',
    declaration: {
      label: 'template',
      description: 'template',
      errors: 'template',
      help: 'template',
      labelledBy: 'for',
    },
    label: 'a',
    errors,
  });

describe('getAdditionalKeyAttributes()', () => {
  it('marks a forbidden key invalid and describes it by the errors its row shows', () => {
    expect(
      getAdditionalKeyAttributes({
        id: 'root_a',
        keyNotAllowed: true,
        hasErrors: true,
        presentation: planShowing(['not allowed']),
      }),
    ).toEqual({ 'aria-describedby': 'root_a__error', 'aria-invalid': true });
  });

  it('names the errors by the field id without a plan', () => {
    expect(getAdditionalKeyAttributes({ id: 'root_a', keyNotAllowed: true, hasErrors: true })).toEqual({
      'aria-describedby': 'root_a__error',
      'aria-invalid': true,
    });
  });

  it('says nothing while the row shows no errors', () => {
    expect(
      getAdditionalKeyAttributes({
        id: 'root_a',
        keyNotAllowed: true,
        hasErrors: false,
        presentation: planShowing([]),
      }),
    ).toEqual({});
  });

  it('leaves an allowed key unmarked while its row shows errors about its value', () => {
    expect(
      getAdditionalKeyAttributes({ id: 'root_a', hasErrors: true, presentation: planShowing(['too short']) }),
    ).toEqual({});
  });
});
