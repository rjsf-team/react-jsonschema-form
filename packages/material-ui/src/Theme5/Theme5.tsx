import React, { PropsWithChildren, Ref } from 'react';
import { ThemeProps } from '@rjsf/core';

import MuiComponentContext from '../MuiComponentContext';
import ThemeCommon from '../ThemeCommon';
import { Mui5Context, DefaultChildren } from './Mui5Context';

const Mui5TagName = React.forwardRef(
  function Mui5TagName(props: Omit<PropsWithChildren<HTMLFormElement>, 'contentEditable'>,
                       ref: Ref<HTMLFormElement>) {
    const { children, ...rest } = props;
    return (
      <MuiComponentContext.Provider value={Mui5Context || {}}>
        <form ref={ref} {...rest}>
          {Mui5Context ? children : <div>@mui/material and/or @mui/icons-material is not available</div>}
        </form>
      </MuiComponentContext.Provider>
    );
  }
);

const Theme5: ThemeProps = {
  tagName: Mui5TagName,
  children: <DefaultChildren />,
  ...ThemeCommon,
};

export default Theme5;
