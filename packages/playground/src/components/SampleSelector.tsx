import { SyntheticEvent, useState } from 'react';
import { styled, Theme, CSSObject } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import MuiDrawer from '@mui/material/Drawer';
import MuiTab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { samples } from '../samples';

const drawerWidth = 200;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(5)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(4)} + 1px)`,
  },
});

const DrawerHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
});

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        '& .MuiDrawer-paper': openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        '& .MuiDrawer-paper': closedMixin(theme),
      },
    },
  ],
  '& .MuiTab-root.Mui-selected': {
    backgroundColor: 'lightgray',
  },
}));

const Tab = styled(MuiTab)({
  padding: '4px',
  fontSize: '1.25rem',
  minWidth: '1rem',
  minHeight: '1rem',
  '&:hover': {
    border: `1px solid gray`,
  },
  selected: {
    backgroundColor: 'lightgray',
  },
});

export interface SampleSelectorProps {
  onSelected: (sampleName: string) => void;
  selectedSample: string;
}

export default function SampleSelector({ onSelected, selectedSample }: SampleSelectorProps) {
  const [open, setOpen] = useState(true);

  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleDrawerClose = () => {
    setOpen(false);
  };
  function onLabelClick(event: SyntheticEvent, label: string) {
    event.preventDefault();
    setTimeout(() => onSelected(label), 0);
  }

  return (
    <Drawer variant='permanent' open={open}>
      <DrawerHeader>
        {open && (
          <Typography component='div' variant='h4' sx={{ mr: 3 }}>
            Samples
          </Typography>
        )}
        <IconButton
          onClick={open ? handleDrawerClose : handleDrawerOpen}
          title={open ? 'Close Samples Drawer' : 'Open Samples Drawer'}
        >
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </DrawerHeader>
      {open ? (
        <Tabs
          orientation='vertical'
          variant='scrollable'
          value={selectedSample}
          scrollButtons={false}
          onChange={onLabelClick}
        >
          {Object.keys(samples).map((label) => (
            <Tab key={label} label={label} title={label} value={label} wrapped />
          ))}
        </Tabs>
      ) : (
        <Typography component='div' style={{ transform: 'rotate(90deg)', textTransform: 'uppercase' }}>
          {selectedSample}
        </Typography>
      )}
    </Drawer>
  );
}
