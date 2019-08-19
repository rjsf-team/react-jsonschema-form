import { Theme } from '@material-ui/core/styles';

export default (theme: Theme) => ({
  body: {
    padding: theme.spacing(2),
    [theme.breakpoints.up('lg')]: {
      width: 'calc(100% - 250px)',
      marginLeft: 250,
    },
  },
});
