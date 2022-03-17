import { useContext } from 'react';
import MaterialUIContextProps from '../Theme/MaterialUIContextProps';
import Mui5ContextProps from '../Theme5/Mui5ContextProps';
import MuiComponentContext from './MuiComponentContext';

export function useMuiComponent(): MaterialUIContextProps | Mui5ContextProps {
  const muiComponents = useContext(MuiComponentContext);

  if (!muiComponents) {
    throw new Error(
      'Either v4 or v5 of material-ui components and icons must be installed as dependencies'
    );
  }

  return muiComponents;
}
