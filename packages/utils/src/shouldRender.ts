import React from 'react';

import deepEquals from './deepEquals';

export default function shouldRender(comp: React.Component, nextProps: any, nextState: any) {
  const { props, state } = comp;
  return !deepEquals(props, nextProps) || !deepEquals(state, nextState);
}
