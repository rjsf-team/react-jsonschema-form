import { Theme } from '@material-ui/core/styles';

export default (theme: Theme) => ({
  root: {
    '& $ctr': {
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: theme.palette.grey[500],
      borderRadius: '5px',
      flexDirection: 'column' as 'column',
      display: 'flex',
      '&$invalid': {
        '& $icon': {
          color: 'red',
        },
      },
      '& $icon': {
        color: 'green',
      },
      '& >div:first-child': {
        display: 'flex',
        alignItems: 'center',
        borderBottomStyle: 'solid' as 'solid',
        borderBottomWidth: 1,
        borderColor: theme.palette.grey[500],
        backgroundColor: theme.palette.grey[300],
      },
    },
  },

  icon: {
    fontSize: 'inherit',
    marginLeft: theme.spacing(2),
  },
  title: {
    marginLeft: theme.spacing(2),
  },
  invalid: {},
  ctr: {},
});
