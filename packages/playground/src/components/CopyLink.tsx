import { useRef } from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

interface CopyLinkProps {
  shareURL: string | null;
  onShare: () => void;
}

export default function CopyLink({ shareURL, onShare }: CopyLinkProps) {
  const input = useRef<HTMLInputElement>(null);

  function onCopyClick() {
    input.current?.select();
    navigator.clipboard.writeText(input.current?.value ?? '').catch((e) => {
      // oxlint-disable-next-line no-console
      console.error('clipboard write failed', e);
    });
  }

  const sx = { my: 1 };
  if (!shareURL) {
    return (
      <Button variant='outlined' size='small' onClick={onShare} sx={sx}>
        Share Playground
      </Button>
    );
  }

  return (
    <TextField
      size='small'
      inputRef={input}
      defaultValue={shareURL}
      sx={sx}
      slotProps={{
        // The button group above sets the column's width; a 1-character input adds no intrinsic width of its own
        htmlInput: { size: 1 },
        input: {
          readOnly: true,
          endAdornment: (
            <InputAdornment position='end'>
              <IconButton aria-label='Copy link' edge='end' onClick={onCopyClick}>
                <ContentCopyIcon />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
