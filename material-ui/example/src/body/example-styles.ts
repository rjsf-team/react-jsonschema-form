import { Theme } from '@material-ui/core/styles';

export default (theme: Theme) => ({
  root: {
    padding: theme.spacing(),
    '& $ctr': {
      display: 'flex',
      '& $sourceCtr': {
        flex: 21,
        display: 'flex',
        marginRight: theme.spacing(),
        flexDirection: 'column' as 'column',
        '& >div:first-child': {
          marginBottom: theme.spacing(),
        },
        '& >div:nth-child(2)': {
          display: 'flex',
          '& >div:first-child': {
            flex: 13,
            marginRight: theme.spacing(),
          },
          '& >div:nth-child(2)': {
            flex: 21,
          },
        },
      },
      '& $display': {
        flex: 13,
      },
    },
  },
  sourceCtr: {},
  display: {},
  ctr: {},
});
