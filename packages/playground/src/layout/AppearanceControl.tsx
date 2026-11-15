import { useColorScheme } from '@mui/material/styles';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

const APPEARANCES = [
  { mode: 'system', label: 'System' },
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
] as const;

/** Picks the playground's own appearance. The form preview keeps the look of the theme selected for it. */
export default function AppearanceControl() {
  const { mode, setMode } = useColorScheme();
  return (
    <ToggleButtonGroup size='small' exclusive value={mode} aria-label='Appearance'>
      {APPEARANCES.map(({ mode: value, label }) => (
        <ToggleButton key={value} value={value} onClick={() => setMode(value)} sx={{ py: 0.25 }}>
          {label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
