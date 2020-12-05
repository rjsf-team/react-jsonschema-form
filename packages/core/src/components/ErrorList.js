import React from "react";
export default function ErrorList(props) {
  const { errors } = props;
  return (
    <div className="panel panel-danger errors">
      <div className="panel-heading">
        <h3 className="panel-title">Errors</h3>
      </div>
      <ul className="flex flex-col pl-0 mb-0 border rounded border-grey-light">
        {errors.map((error, i) => {
          return (
            <li key={i} className="relative block py-3 px-6 -mb-px border border-r-0 border-l-0 border-grey-light no-underline text-red">
              {error.stack}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
