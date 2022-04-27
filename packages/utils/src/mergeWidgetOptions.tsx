import React from 'react';
import get from 'lodash/get';
import set from 'lodash/set';

import { Widget } from 'types';

export default function mergeWidgetOptions<T = any>(AWidget: Widget<T>) {
  let MergedWidget: Widget<T> = get(AWidget, 'MergedWidget');
  // cache return value as property of widget for proper react reconciliation
  if (!MergedWidget) {
    const defaultOptions = (AWidget.defaultProps && AWidget.defaultProps.options) || {};
    MergedWidget = ({ options = {}, ...props }) => {
      return <AWidget options={{ ...defaultOptions, ...options }} {...props} />;
    };
    set(AWidget, 'MergedWidget', MergedWidget);
  }
  return MergedWidget;
}
