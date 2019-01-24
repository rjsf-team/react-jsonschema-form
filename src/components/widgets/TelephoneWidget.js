/** @jsx jsx */
import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { jsx } from '@emotion/core';

const Span = styled.span`
  background: #697b8c;
  color: #fff;
  padding: 10px 8px;
  text-align: center;
  width: 46px;
  height: 40px;
  display: table-cell;
`;

function TelephoneWidget(props) {
  const { BaseInput } = props.registry.widgets;
  const countryCode = props.options.countryCode;

  return (
    <div
      css={{
        display: 'table',
        width: '100%'
      }}
    >
      <Span>{countryCode}</Span>
      <BaseInput type="tel" css={{ display: 'table-cell' }} {...props} />
    </div>
  );
}

export default TelephoneWidget;
