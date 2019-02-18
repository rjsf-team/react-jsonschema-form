import React, { Component } from "react";
import PropTypes from "prop-types";

import { Paper, TextField, CircularProgress } from "@material-ui/core";
import OptionsList from "./OptionsList";
import SelectionBar from "./SelectionBar";

class AsyncMultiselectDropdown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSearching: false,
      searchText: "",
      options: [],
      pageNumber: 0,
      pageSize: 10,
      selectedOptions: [],
      isLoading: false,
      totalOptionsCount: 0,
      selectionColumn: null,
      primaryColumn: null,
    };
  }

  componentDidMount = async () => {
    const {
      pageSize,
      selectedOptions,
      isMultiselect,
      selectionColumn,
      currentPageNumber,
    } = this.props.schema;
    this.setState({
      pageNumber: currentPageNumber - 1,
      pageSize,
      selectionColumn,
      selectedOptions,
      isMultiselect,
      isLoading: false,
    });
    this.fetchData();
  };

  handleChange = event =>
    this.setState(
      { searchText: event.target.value, isSearching: true },
      this.fetchData
    );

  fetchData = async () => {
    const { searchText, pageNumber } = this.state;
    const {
      schema: { loadOptions, pageSize, loadOptionsCount, cols },
    } = this.props;
    let selectionColumn = "";
    let primaryColumn = "";

    for (let index = 0; index < cols.length; index++) {
      if (cols[index].displaySelected) {
        selectionColumn = cols[index].key;
        break;
      }
    }

    for (let index = 0; index < cols.length; index++) {
      if (cols[index].primary) {
        primaryColumn = cols[index].key;
        break;
      }
    }

    this.setState({ isLoading: true });
    Promise.all([
      loadOptions(searchText, pageNumber + 1, pageSize),
      loadOptionsCount(searchText),
    ]).then(([resLoadOptions, resLoadOptionsCount]) =>
      this.setState({
        options: resLoadOptions,
        pageNumber: pageNumber,
        pageSize,
        totalOptionsCount: resLoadOptionsCount,
        selectionColumn,
        primaryColumn,
        isLoading: false,
      })
    );
  };

  handleChangePage = (event, page) =>
    this.setState({ pageNumber: page }, this.fetchData);

  handleRowClick = (event, selectedRow) => {
    let { selectedOptions, isMultiselect, primaryColumn } = this.state;
    const indexOfSelectedOption = this.getIndexOfSelectedRowFromSelectedOptionsList(
      selectedRow
    );

    if (indexOfSelectedOption !== -1) {
      selectedOptions.splice(indexOfSelectedOption, 1);
    } else {
      if (!isMultiselect) {
        selectedOptions = [selectedRow];
        this.closeOptionPanel();
      } else {
        selectedOptions.push(selectedRow);
      }
    }
    this.setState({ selectedOptions, searchText: " " });
    // TODO: Considering that for now just working on single value select
    if (selectedOptions && selectedOptions.length > 0) {
      this.props.onChange(selectedOptions[0][primaryColumn]);
    } else {
      this.props.onChange(null);
    }
  };

  onDeleteChoice = deletedChoice => {
    const { selectionColumn, selectedOptions } = this.state;
    for (let index = 0; index < selectedOptions.length; index++) {
      if (selectedOptions[index][selectionColumn] === deletedChoice) {
        selectedOptions.splice(index, 1);
        this.setState({ selectedOptions });
        this.props.schema.onSelect(selectedOptions);
      }
    }
  };

  getIndexOfSelectedRowFromSelectedOptionsList = selectedRow => {
    const { selectedOptions } = this.state;
    let recordFounded = -1;
    for (let index = 0; index < selectedOptions.length; index++) {
      if (
        JSON.stringify(selectedOptions[index]) === JSON.stringify(selectedRow)
      ) {
        recordFounded = index;
        break;
      }
    }
    return recordFounded;
  };

  closeOptionPanel = () => {
    this.setState({ isSearching: false });
  };

  render() {
    const {
      label,
      schema: { cols },
      placeholder,
    } = this.props;
    const {
      isSearching,
      searchText,
      options,
      pageNumber,
      pageSize,
      totalOptionsCount,
      selectedOptions,
      selectionColumn,
      isMultiselect,
      isLoading,
    } = this.state;

    const loader = isLoading && <CircularProgress size={24} />;
    const selected = (
      <SelectionBar
        selectedOptions={selectedOptions}
        isMultiselect={isMultiselect}
        selectionColumn={selectionColumn}
        onDeleteChoice={this.onDeleteChoice}
      />
    );

    return (
      <div>
        <TextField
          label={label}
          placeholder={placeholder}
          margin="normal"
          multiline
          value={searchText}
          onChange={this.handleChange}
          onFocus={() => this.setState({ isSearching: true })}
          InputProps={{
            startAdornment: selected,
            endAdornment: loader,
          }}
        />
        <Paper>
          {isSearching && (
            <OptionsList
              isMultiselect={isMultiselect}
              pageSize={pageSize}
              totalOptionsCount={totalOptionsCount}
              pageNumber={pageNumber}
              cols={cols}
              options={options}
              handleChangePage={this.handleChangePage}
              handleRowClick={this.handleRowClick}
              closeOptionPanel={this.closeOptionPanel}
              getIndexOfSelectedRowFromSelectedOptionsList={
                this.getIndexOfSelectedRowFromSelectedOptionsList
              }
            />
          )}
        </Paper>
      </div>
    );
  }
}

AsyncMultiselectDropdown.propTypes = {
  schema: PropTypes.object.isRequired,
  placeholder: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

export default AsyncMultiselectDropdown;
