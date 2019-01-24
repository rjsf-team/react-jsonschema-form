/** @jsx jsx */
import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { jsx } from '@emotion/core';

const UploadLabel = styled.label`
  display: inline-block;
  max-width: 100%;
  margin-bottom: 5px;
  font-weight: 700;
  letter-spacing: 1.8px;
  padding: 16px 30px;
  border-radius: 3px;
  font-size: 14px;
  letter-spacing: 1.8px;
  line-height: 1.42857143;
  max-width: initial;
  min-width: 170px;
  padding: 16px 30px;
  width: auto;
  color: #fff;
  cursor: pointer;
  opacity: 1;
  font-family: 'system-ui';
  font-weight: 700;
  background-color: #1c9440;
  position: relative;
`;

function DocWidget(props) {
  const { BaseInput } = props.registry.widgets;
  return (
    <div
      css={{
        width: '100%',
        background: '#e1f7e8',
        align: 'center',
        border: '1px solid #c3c9d7',
        display: 'block',
        margin: '0 auto',
        padding: '25px',
        position: 'realtive'
      }}
    >
      <div>
        <UploadLabel>UPLOAD</UploadLabel>
        <BaseInput
          type="file"
          css={{ position: 'relative', display: 'inline-block' }}
          {...props}
        />
      </div>

      <div>
        <BaseInput
          onClick={handleSave}
          type="submit"
          {...props}
          value="save"
        />
      </div>
    </div>
  );
}

function handleSave() {
    fetch('https://647d3ad1-dfd1-4178-9e0c-0993366e2dcc.mock.pstmn.io/upload', {
    method: 'POST',
    headers: {
    'Accept': 'application/json',
    'Content-Type': 'multipart/form-data',
  },
    body: data
  })
    .then(function(response) {
        return response.json()
      }).then(function(body) {
        console.log(response);
      });
  }


class DocumentWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      imagePreview: ''
    };
  }
}
export default DocumentWidget;
