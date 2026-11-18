import { getCheckboxRequired } from '../src/index.ts';
import { planField } from './testUtils/presentation.ts';

const presentation = planField({ required: true });
const TRUE_SCHEMA = { type: 'boolean', const: true } as const;
const BOOLEAN_SCHEMA = { type: 'boolean' } as const;

describe('getCheckboxRequired()', () => {
  it('requires the box natively only where the schema demands true', () => {
    expect(getCheckboxRequired({ schema: TRUE_SCHEMA, required: true })).toEqual({
      trueValueRequired: true,
      marksRequired: true,
    });
    expect(getCheckboxRequired({ schema: BOOLEAN_SCHEMA, required: true })).toEqual({
      trueValueRequired: false,
      marksRequired: false,
    });
    expect(getCheckboxRequired({ schema: TRUE_SCHEMA })).toEqual({ trueValueRequired: false, marksRequired: false });
  });
  it('marks the label as the required prop says where the widget has a plan', () => {
    expect(getCheckboxRequired({ schema: BOOLEAN_SCHEMA, required: true, presentation })).toEqual({
      trueValueRequired: false,
      marksRequired: true,
    });
    expect(getCheckboxRequired({ schema: BOOLEAN_SCHEMA, presentation })).toEqual({
      trueValueRequired: false,
      marksRequired: false,
    });
  });
});
