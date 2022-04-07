import React from 'react';
import MaterialUIContextProps from '../Theme/MaterialUIContextProps';
import Mui5ContextProps from '../Theme5/Mui5ContextProps';

/** This context is used to encapsulate the usage of `@material-ui` or `@mui` away from the field, widgets and helpers.
 * It can be created using either an instance of `MaterialUIContextProps` or `Mui5ContextProps`.
 */
export default React.createContext<MaterialUIContextProps | Mui5ContextProps | null>(null);
