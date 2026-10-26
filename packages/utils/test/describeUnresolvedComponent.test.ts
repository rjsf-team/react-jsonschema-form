import { createElement } from 'react';

import { describeUnresolvedComponent } from '../src/index.ts';

describe('describeUnresolvedComponent()', () => {
  it('describes a value that is not a component by its type', () => {
    expect(describeUnresolvedComponent(42, 42, 'registered field', 'MyField')).toBe('is not a component (got number)');
  });
  it('calls out null as null rather than object', () => {
    expect(describeUnresolvedComponent(null, null, 'registered field', 'MyField')).toBe(
      'is not a component (got null)',
    );
  });
  it('calls out a React element and names what to pass instead', () => {
    expect(describeUnresolvedComponent(createElement('div'), createElement('div'), 'registered field', 'MyField')).toBe(
      'is a React element rather than a component (pass MyField, not <MyField />)',
    );
  });
  it('reports a name that matches nothing', () => {
    expect(describeUnresolvedComponent('Typo', undefined, 'registered field', 'MyField')).toBe(
      "names no registered field ('Typo')",
    );
  });
  it('reports a name that matches something that is not a component', () => {
    expect(describeUnresolvedComponent('Bad', {}, 'registered field', 'MyField')).toBe(
      "names a registered field ('Bad') that is not a component (got object)",
    );
  });
});
