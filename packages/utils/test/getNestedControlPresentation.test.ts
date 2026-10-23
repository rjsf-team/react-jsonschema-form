import getNestedControlPresentation from '../src/getNestedControlPresentation.ts';
import type { FieldPresentation } from '../src/index.ts';

const field: FieldPresentation = {
  label: { by: 'template', id: 'root_when__label', text: 'When', requiredMarker: false },
  description: { by: 'template', id: 'root_when__description', text: 'The day' },
  help: { by: 'none', id: 'root_when__help' },
  errors: { by: 'template', id: 'root_when__error', messages: ['is required'] },
  describedBy: ['root_when__error', 'root_when__description'],
  showLabel: true,
  control: {
    id: 'root_when',
    attributes: {
      'aria-labelledby': 'root_when__label',
      'aria-describedby': 'root_when__error root_when__description',
      'aria-invalid': true,
    },
  },
};

describe('getNestedControlPresentation()', () => {
  it('names a control that draws no label by its text, with no parts of its own', () => {
    const plan = getNestedControlPresentation({ id: 'root_a__key', label: 'a Key' });

    expect(plan.label).toMatchObject({ by: 'none', text: 'a Key' });
    expect([plan.description.by, plan.help.by, plan.errors.by]).toEqual(['none', 'none', 'none']);
    expect(plan.describedBy).toEqual([]);
    expect(plan.control).toEqual({ id: 'root_a__key', attributes: { 'aria-label': 'a Key' } });
  });

  it('has a control that draws its label name itself by it, required where it is', () => {
    const plan = getNestedControlPresentation({ id: 'root_a__key', label: 'a Key', showLabel: true, required: true });

    expect(plan.label).toMatchObject({ by: 'self', text: 'a Key', requiredMarker: true });
    expect(plan.control).toEqual({ id: 'root_a__key', attributes: { required: true } });
  });

  it('leaves a control its template labels beside it named by that label alone, over showLabel', () => {
    const plan = getNestedControlPresentation({ id: 'root_a__key', label: 'a Key', labelledByTemplate: true });

    expect(plan.label).toMatchObject({ by: 'template', text: 'a Key' });
    expect(plan.control).toEqual({ id: 'root_a__key', attributes: {} });
    expect(
      getNestedControlPresentation({ id: 'root_a__key', label: 'a Key', showLabel: true, labelledByTemplate: true })
        .label.by,
    ).toBe('template');
  });

  it("describes a control by its field's parts and marks it invalid with it, keeping its own name", () => {
    const plan = getNestedControlPresentation({ id: 'root_when_year', label: 'When, year', field });

    expect(plan.describedBy).toBe(field.describedBy);
    expect(plan.control).toEqual({
      id: 'root_when_year',
      attributes: {
        'aria-label': 'When, year',
        'aria-describedby': 'root_when__error root_when__description',
        'aria-invalid': true,
      },
    });
  });

  it('takes nothing from a field that describes nothing and has no errors, or has no control', () => {
    const quiet = { ...field, control: { id: 'root_when', attributes: {} } };
    const expected = { id: 'root_when_year', attributes: { 'aria-label': 'When, year' } };

    expect(getNestedControlPresentation({ id: 'root_when_year', label: 'When, year', field: quiet }).control).toEqual(
      expected,
    );
    expect(
      getNestedControlPresentation({
        id: 'root_when_year',
        label: 'When, year',
        field: { ...field, control: undefined },
      }).control,
    ).toEqual(expected);
  });
});
