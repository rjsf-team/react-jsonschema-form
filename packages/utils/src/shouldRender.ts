import React from 'react';

import deepEquals from './deepEquals';

/** Determines whether the given `component` should be rerendered by comparing its current set of props and state
 * against the next set. If either of those two sets are not the same, then the component should be rerendered.
 *
 * @param component - A React component being checked
 * @param nextProps - The next set of props against which to check
 * @param nextState - The next set of state against which to check
 * @returns - True if the component should be re-rendered, false otherwise
 */
export default function shouldRender(component: React.Component, nextProps: any, nextState: any) {
  const { props, state } = component;
  return !deepEquals(props, nextProps) || !deepEquals(state, nextState);
}
