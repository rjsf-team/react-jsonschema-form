import { FormControl, MenuItem, Select } from '@mui/material';

import { useAppearanceContext } from '../layout/AppearanceContext.ts';

export default function AppearanceControl() {
  const { appearance, setAppearance } = useAppearanceContext();

  return (
    <div className='playground-appearance'>
      <label id='playground-appearance-label' htmlFor='playground-appearance'>
        Appearance
      </label>
      <FormControl size='small' fullWidth>
        <Select
          id='playground-appearance'
          labelId='playground-appearance-label'
          value={appearance}
          onChange={(event) => {
            const next = event.target.value;
            if (next === 'system' || next === 'light' || next === 'dark') {
              setAppearance(next);
            }
          }}
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
