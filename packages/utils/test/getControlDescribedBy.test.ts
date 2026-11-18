import { ariaDescribedByIds } from '../src/idGenerators.ts';
import { examplesId, getControlDescribedBy } from '../src/index.ts';
import { ID, planField } from './testUtils/presentation.ts';

describe('getControlDescribedBy()', () => {
  it('describes a widget rendered without a plan by every part id, then its own', () => {
    expect(getControlDescribedBy({ id: ID })).toBe(ariaDescribedByIds(ID));
    expect(getControlDescribedBy({ id: ID }, [examplesId(ID)])).toBe(`${ariaDescribedByIds(ID)} ${examplesId(ID)}`);
  });

  it("follows the plan's describers with the widget's own, once each", () => {
    const presentation = planField({ description: 'Describes foo' });
    expect(getControlDescribedBy({ id: ID, presentation }, [examplesId(ID), `${ID}__description`])).toBe(
      `${ID}__description ${examplesId(ID)}`,
    );
  });

  it("keeps a widget's own id once when the plan already lists it among several", () => {
    const presentation = planField({ description: 'Describes foo', errors: ['is required'] });
    expect(getControlDescribedBy({ id: ID, presentation }, [`${ID}__description`])).toBe(
      `${ID}__error ${ID}__description`,
    );
  });

  it('is undefined for a control nothing describes, or a plan with no control', () => {
    const presentation = planField();
    expect(getControlDescribedBy({ id: ID, presentation })).toBeUndefined();
    const noControl = planField({ hasControl: false });
    expect(getControlDescribedBy({ id: ID, presentation: noControl })).toBeUndefined();
  });
});
