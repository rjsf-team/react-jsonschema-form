/* eslint-disable react/prop-types */
import React from 'react';
import { Form } from 'semantic-ui-react';
import HelpField from '../HelpField';
import DescriptionField from '../DescriptionField';
import RawErrors from '../RawErrors';

function FieldTemplate({
  id,
  children,
  displayLabel,
  rawErrors = [],
  rawHelp,
  rawDescription,
}) {
  return (
    <Form.Group key={id} widths="equal" grouped>
      {displayLabel && <DescriptionField description={rawDescription} />}
      {children}
      <RawErrors errors={rawErrors} />
      <HelpField helpText={rawHelp} id={id} />
    </Form.Group>
  );
}

export default FieldTemplate;
