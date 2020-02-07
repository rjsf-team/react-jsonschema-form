import React from 'react';
import { Header } from 'semantic-ui-react';

function TitleField({ title }) {
  if (title) {
    return (
      <Header inverted as="h5" dividing>
        {title}
      </Header>
    );
  }
}

export default TitleField;
