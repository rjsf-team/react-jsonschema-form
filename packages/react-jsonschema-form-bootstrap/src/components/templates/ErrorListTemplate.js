import React from 'react';

function ErrorListTemplate(props) {
  const { errors } = props;
  return (
    <div className="card text-white bg-danger errors">
      <div className="card-header">Errors</div>
      <ul className="list-group list-group-flush">
        {errors.map((error, i) => {
          return (
            <li key={i} className="list-group-item text-danger">
              {error.stack}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * TODO: PropTypes
 */

export default ErrorListTemplate;
