import React from 'react';

import deepEquals from './deepEquals';
import shallowEquals from './shallowEquals';

/** The supported component update strategies */
export type ComponentUpdateStrategy = 'customDeep' | 'shallow' | 'always';

/** Determines whether the given `component` should be rerendered by comparing its current set of props and state
 * against the next set. The comparison strategy can be controlled via the `updateStrategy` parameter.
 *
 * @param component - A React component being checked
 * @param nextProps - The next set of props against which to check
 * @param nextState - The next set of state against which to check
 * @param updateStrategy - The strategy to use for comparison:
 *   - 'customDeep': Uses RJSF's custom deep equality checks (default)
 *   - 'shallow': Uses shallow comparison of props and state
 *   - 'always': Always returns true (React's default behavior)
 * @returns - True if the component should be re-rendered, false otherwise
 */
export default function shouldRender(
  component: React.Component,
  nextProps: any,
  nextState: any,
  updateStrategy: ComponentUpdateStrategy = 'customDeep',
) {
  if (updateStrategy === 'always') {
    // Use React's default behavior: always update if state or props change (no shouldComponentUpdate optimization)
    return true;
  }

  if (updateStrategy === 'shallow') {
    // Use shallow comparison for props and state
    const { props, state } = component;
    return !shallowEquals(props, nextProps) || !shallowEquals(state, nextState);
  }

  // Use custom deep equality checks (default 'customDeep' strategy)
  const { props, state } = component;
  return !deepEquals(props, nextProps) || !deepEquals(state, nextState);
}
