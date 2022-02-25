import React, { PropsWithChildren, Ref } from 'react';
import { ThemeProps } from '@rjsf/core';

import MuiComponentContext from '../MuiComponentContext';
import ThemeCommon from '../ThemeCommon';
import { Mui5Context, DefaultChildren } from './Mui5Context';

/** Create a component that will wrap a ref-able HTML "form" with a `MuiComponentContext.Provider` so that all of the
 * `@mui` fields, widgets and helpers will be rendered using the Material UI version 5 components. If the `Mui5Context`
 * does not exist, then the form will contain a simple warning that `@mui` is not available. If the `as` prop is passed
 * in then use that as the `FormTag` for the ref otherwise `form`.
 */
const Mui5FormWrapper = React.forwardRef(
  function Mui5TagName(props: Omit<PropsWithChildren<HTMLFormElement>, 'contentEditable'>,
                       ref: Ref<HTMLBaseElement>) {
    const { children, as: FormTag = 'form', ...rest } = props;
    return (
      <MuiComponentContext.Provider value={Mui5Context || {}}>
        <FormTag ref={ref} {...rest}>
          {Mui5Context ? children : <div>WARNING: @mui/material or @mui/icons-material is not available</div>}
        </FormTag>
      </MuiComponentContext.Provider>
    );
  }
);

/** The Material UI 5 theme, with the `Mui5FormWrapper` and `DefaultChildren`
 */
const Theme5: ThemeProps = {
  _internalFormWrapper: Mui5FormWrapper,
  children: <DefaultChildren />,
  ...ThemeCommon,
};

export default Theme5;
