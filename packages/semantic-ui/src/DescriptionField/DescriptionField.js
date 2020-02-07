/* eslint-disable react/prop-types */
import React from 'react';
import { Header } from 'semantic-ui-react';

function DescriptionField({ description }) {
  if (description) {
    return (
      <Header inverted as="h5">
        <Header.Subheader>
          {description}
        </Header.Subheader>
      </Header>
    );
  }
  return null;
}

export default DescriptionField;
