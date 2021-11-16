import React from 'react';
import MaterialUIContextProps from '../Theme/MaterialUIContextProps';
import Mui5ContextProps from '../Theme5/Mui5ContextProps';

export default React.createContext<MaterialUIContextProps|Mui5ContextProps>({});
