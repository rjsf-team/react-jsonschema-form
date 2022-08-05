import React from "react";

const TabNavItem = ({ id, title, activeTab, setActiveTab }) => {
  const handleClick = () => {
    setActiveTab(id);
  };

  const isActive = activeTab === id;

  return (
    <li
      onClick={handleClick}
      className={isActive ? "active" : ""}
      role="presentation">
      <a data-mdb-toggle="tab" role="tab">
        {title}
      </a>
    </li>
  );
};
export default TabNavItem;
