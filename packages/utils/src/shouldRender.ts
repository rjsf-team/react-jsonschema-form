import React from 'react';

import shallowEquals from './shallowEquals.ts';

/** Determines whether the given `component` should be rerendered by shallowly comparing its current set of props and
 * state against the next set. Field identity props are primitives, so shallow comparison is both correct and cheap.
 *
 * @param component - A React component being checked
 * @param nextProps - The next set of props against which to check
 * @param nextState - The next set of state against which to check
 * @returns - True if the component should be re-rendered, false otherwise
 */
export default function shouldRender(component: React.Component, nextProps: any, nextState: any) {
  const { props, state } = component;
  return !shallowEquals(props, nextProps) || !shallowEquals(state, nextState);
}
