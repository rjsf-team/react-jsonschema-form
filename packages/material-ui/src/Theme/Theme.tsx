import React, { PropsWithChildren, Ref } from 'react';
import { ThemeProps } from '@rjsf/core';

import MuiComponentContext from '../MuiComponentContext';
import ThemeCommon from '../ThemeCommon';
import { MaterialUIContext, DefaultChildren } from './MaterialUIContext';

/** Create a component that will wrap a ref-able HTML `form` with a `MuiComponentContext.Provider` so that all of the
 * `@material-ui` fields, widgets and helpers will be rendered using the Material UI version 4 components. If the
 * `MaterialUIContext` does not exist, then the form will contain a simple warning that `@material-ui` is not available.
 */
const Mui4TagName = React.forwardRef(
  function Mui4TagName(props: Omit<PropsWithChildren<HTMLFormElement>, 'contentEditable'>,
                       ref: Ref<HTMLFormElement>) {
    const { children, ...rest } = props;
    return (
      <MuiComponentContext.Provider value={MaterialUIContext || {}}>
        <form ref={ref} {...rest}>
          {MaterialUIContext ? children : <div>WARNING: @material-ui/core or @material-ui/icons is not available</div>}
        </form>
      </MuiComponentContext.Provider>
    );
  }
);

/** The Material UI 4 theme, with the `Mui4TagName` and `DefaultChildren`
 */
const Theme: ThemeProps = {
  tagName: Mui4TagName,
  children: <DefaultChildren />,
  ...ThemeCommon,
};

export default Theme;
