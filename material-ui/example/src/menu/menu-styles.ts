import { Theme } from '@material-ui/core/styles';

export default (theme: Theme) => ({
  permanentLeftDrawer: {},
  drawerList: {
    width: 250,
  },
  toolbar: {
    [theme.breakpoints.up('lg')]: {
      width: 'calc(100% - 250px)',
      marginLeft: 250,
    },
    '& h2': {
      marginLeft: theme.spacing(3),
    },
  },
  subheader: {
    backgroundColor: '#fff',
  },
});
