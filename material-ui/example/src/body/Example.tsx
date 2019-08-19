import React from 'react';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

import { JSONSchema6 } from 'json-schema';

import styles from './example-styles';
import Source from './Source';

import Form from '../../../src';

const liveSettingsSchema: JSONSchema6 = {
  type: 'object',
  properties: {
    validate: { type: 'boolean', title: 'Live validation' },
    disabled: { type: 'boolean', title: 'Disable whole form' },
  },
};

class Example extends React.Component<any, any> {
  state = {
    ...this.props.data,
    liveSettings: {
      validate: true,
      disabled: false,
    },
  };

  componentDidCatch() {
    this.setState({
      [this.state.backType]: this.state.backSource,
    });
  }

  componentWillReceiveProps = ({ data }) => {
    this.setState({
      ...data,
    });
  };

  onChange = type => value => {
    this.setState({
      [type]: value,
      backSource: this.state[type],
      backType: type,
    });
  };

  onFormChanged = ({ formData }) => {
    this.setState({ formData });
  };

  onSubmit = value => {
    console.log('onSubmit:', value);
  };

  onCancel = () => {
    const { data } = this.props;

    this.setState({
      ...data,
    });
  };

  setLiveSettings = ({ formData }: any) =>
    this.setState({ liveSettings: formData });

  render() {
    const { data, classes } = this.props;
    const { title } = data;
    const { schema, uiSchema, formData, liveSettings, validate } = this.state;

    return (
      <Paper className={classes.root}>
        <>
          <Typography component="h4" variant="h4">
            {title}
          </Typography>
          <Form
            schema={liveSettingsSchema}
            formData={liveSettings}
            onChange={this.setLiveSettings}
          >
            <div />
          </Form>
        </>
        <br />
        <div className={classes.ctr}>
          <div className={classes.sourceCtr}>
            <div>
              <Source
                title={'JSONSchema'}
                source={schema}
                onChange={this.onChange('schema')}
              />
            </div>
            <div>
              <Source
                title={'uiSchema'}
                source={uiSchema}
                onChange={this.onChange('uiSchema')}
              />
              <Source
                title={'formData'}
                source={formData}
                onChange={this.onChange('formData')}
              />
            </div>
          </div>
          <div className={classes.display}>
            <Paper elevation={2}>
              <Box p={2}>
                <Form
                  schema={schema}
                  uiSchema={uiSchema}
                  formData={formData}
                  onSubmit={this.onSubmit}
                  onChange={this.onFormChanged}
                  liveValidate={liveSettings.validate}
                  disabled={liveSettings.disabled}
                  validate={validate}
                >
                  <Box mt={2}>
                    <Button
                      variant="contained"
                      color="default"
                      onClick={this.onCancel}
                    >
                      Cancel
                    </Button>
                    <Button variant="contained" color="primary" type="submit">
                      Submit
                    </Button>
                  </Box>
                </Form>
              </Box>
            </Paper>
          </div>
        </div>
      </Paper>
    );
  }
}

export default withStyles(styles)(Example);
