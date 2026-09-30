import { useContext } from 'react';
import { FormControl, MenuItem, Select } from '@mui/material';

import type { Appearance } from '../layout/AppearanceContext.ts';
import { APPEARANCE_STORAGE_KEY, AppearanceContext } from '../layout/AppearanceContext.ts';

export default function AppearanceControl() {
  const appearanceContext = useContext(AppearanceContext);
  if (!appearanceContext) {
    return null;
  }

  return (
    <div className='playground-appearance'>
      <label htmlFor='playground-appearance'>Appearance</label>
      <FormControl size='small' fullWidth>
        <Select
          id='playground-appearance'
          value={appearanceContext.appearance}
          onChange={(event) => {
            const next = event.target.value as Appearance;
            appearanceContext.setAppearance(next);
            window.localStorage.setItem(APPEARANCE_STORAGE_KEY, next);
          }}
          inputProps={{ 'aria-label': 'Appearance' }}
          MenuProps={{ disableScrollLock: true }}
        >
          <MenuItem value='system'>System</MenuItem>
          <MenuItem value='light'>Light</MenuItem>
          <MenuItem value='dark'>Dark</MenuItem>
        </Select>
      </FormControl>
    </div>
  );
}
