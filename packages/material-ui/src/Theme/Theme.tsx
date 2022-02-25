import React, { PropsWithChildren, Ref } from 'react';
import { ThemeProps } from '@rjsf/core';

import MuiComponentContext from '../MuiComponentContext';
import ThemeCommon from '../ThemeCommon';
import { MaterialUIContext, DefaultChildren } from './MaterialUIContext';

/** Create a component that will wrap a ref-able HTML "form" with a `MuiComponentContext.Provider` so that all of the
 * `@material-ui` fields, widgets and helpers will be rendered using the Material UI version 4 components. If the
 * `MaterialUIContext` does not exist, then the form will contain a simple warning that `@material-ui` is not available.
 * If the `as` prop is passed in then use that as the `FormTag` for the ref otherwise `form`.
 */
const Mui4FormWrapper = React.forwardRef(
  function Mui4TagName(props: Omit<PropsWithChildren<HTMLFormElement>, 'contentEditable'>,
                       ref: Ref<HTMLBaseElement>) {
    const { children, as: FormTag = 'form', ...rest } = props;
    return (
      <MuiComponentContext.Provider value={MaterialUIContext || {}}>
        <FormTag ref={ref} {...rest}>
          {MaterialUIContext ? children : <div>WARNING: @material-ui/core or @material-ui/icons is not available</div>}
        </FormTag>
      </MuiComponentContext.Provider>
    );
  }
);

/** The Material UI 4 theme, with the `Mui4FormWrapper` and `DefaultChildren`
 */
const Theme: ThemeProps = {
  _internalFormWrapper: Mui4FormWrapper,
  children: <DefaultChildren />,
  ...ThemeCommon,
};

export default Theme;
