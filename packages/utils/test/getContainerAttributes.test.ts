import type { FieldPresentation } from '../src/index.ts';
import { getContainerAttributes } from '../src/index.ts';

describe('getContainerAttributes()', () => {
  it('names a group by its title and describes it by the parts its plan lists, never marking it invalid', () => {
    const presentation = { describedBy: ['root__error', 'root__description'] } as unknown as FieldPresentation;
    expect(getContainerAttributes(presentation, 'root', 'Title')).toEqual({
      'aria-labelledby': 'root__title',
      'aria-describedby': 'root__error root__description',
    });
  });

  it('says nothing without a title, a plan or a part describing the group', () => {
    expect(getContainerAttributes(undefined, 'root')).toEqual({});
    expect(getContainerAttributes({ describedBy: [] } as unknown as FieldPresentation, 'root', '')).toEqual({});
  });
});
