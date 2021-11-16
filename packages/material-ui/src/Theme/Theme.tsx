import React, { PropsWithChildren, Ref } from 'react';
import { ThemeProps } from '@rjsf/core';

import MuiComponentContext from '../MuiComponentContext';
import ThemeCommon from '../ThemeCommon';
import { MaterialUIContext, DefaultChildren } from './MaterialUIContext';


const Mui4TagName = React.forwardRef(
  function Mui4TagName(props: Omit<PropsWithChildren<HTMLFormElement>, 'contentEditable'>,
                       ref: Ref<HTMLFormElement>) {
    const { children, ...rest } = props;
    return (
      <MuiComponentContext.Provider value={MaterialUIContext || {}}>
        <form ref={ref} {...rest}>
          {MaterialUIContext ? children : <div>@material-ui/core and/or @material-ui/icons is not available</div>}
        </form>
      </MuiComponentContext.Provider>
    );
  }
);

const Theme: ThemeProps = {
  tagName: Mui4TagName,
  children: <DefaultChildren />,
  ...ThemeCommon,
};

export default Theme;
