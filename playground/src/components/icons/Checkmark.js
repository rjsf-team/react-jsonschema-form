import React from 'react';

const Checkmark = props => (
  <svg
    viewBox="0 0 32 32"
    fill="currentColor"
    width="1em"
    height="1em"
    {...props}
  >
    <path d="M27 4L12 19l-7-7-5 5 12 12L32 9z" />
  </svg>
);

export default Checkmark;
