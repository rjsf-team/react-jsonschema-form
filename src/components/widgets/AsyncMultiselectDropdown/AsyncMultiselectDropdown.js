import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import {
  Paper,
  TextField,
  CircularProgress,
  Grid,
  Icon,
} from "@material-ui/core";
import OptionsList from "./OptionsList";
import SelectionBar from "./SelectionBar";

const styles = {
  container: {
    display: "block",
  },
  inputField: {
    verticalAlign: "bottom",
  },
};
class AsyncMultiselectDropdown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSearching: false,
      searchText: "",
      options: [],
      pageNumber: 0,
      ...props.schema,
    };
  }

  componentDidMount() {
    this.initStateFromProps();
    this.fetchData();
    document.addEventListener("click", this.handleClickOutside, true);
  }

  componentWillUnmount() {
    document.removeEventListener("click", this.handleClickOutside, true);
  }

  handleClickOutside = event => {
    const domNode = ReactDOM.findDOMNode(this);
    if (!domNode || !domNode.contains(event.target)) {
      this.closeOptionPanel();
    }
  };

  handleChange = event => {
    this.setState(
      { searchText: event.target.value, isSearching: true, pageNumber: 0 },
      () => this.fetchData()
    );
  };

  initStateFromProps = () => {
    const { cols, isMultiselect } = this.state;
    const value = this.props.value;
    let selectionColumn = "";
    let primaryColumn = "";

    for (let index = 0; index < cols.length; index++) {
      if (
        cols[index].displaySelected &&
        this.state.selectionColumn === undefined
      ) {
        selectionColumn = cols[index].key;
      }
      if (cols[index].primary && this.state.primaryColumn === undefined) {
        primaryColumn = cols[index].key;
      }
      if (
        this.state.primary !== undefined &&
        this.state.selectionColumn !== undefined
      ) {
        break;
      }
    }
    this.setState({ selectionColumn, primaryColumn });
    const selectedOptions = [];
    if (value) {
      if (!isMultiselect) {
        selectedOptions.push(this.state.getSelectedOptionDetails(value));
      } else {
        const selectedList = JSON.parse(value);
        selectedList.forEach(value => {
          const result = this.state.getSelectedOptionDetails(value);
          selectedOptions.push(result);
        });
      }
    }
    this.setState({ selectedOptions });
  };

  fetchData = () => {
    const {
      searchText,
      pageNumber,
      loadOptions,
      loadOptionsCount,
      pageSize,
    } = this.state;

    this.setState({ isLoading: true });
    Promise.all([
      loadOptions(searchText, pageNumber, pageSize),
      loadOptionsCount(searchText),
    ]).then(([resLoadOptions, resLoadOptionsCount]) =>
      this.setState({
        options: resLoadOptions,
        pageNumber: pageNumber,
        pageSize,
        totalOptionsCount: resLoadOptionsCount,
        isLoading: false,
      })
    );
  };

  handleChangePage = (event, page) => {
    this.setState({ pageNumber: page }, () => this.fetchData());
  };

  handleRowClick = (event, selectedRow) => {
    let { selectedOptions, isMultiselect, primaryColumn } = this.state;
    const indexOfSelectedOption = this.getIndexOfSelectedRowFromSelectedOptionsList(
      selectedRow
    );

    if (indexOfSelectedOption !== -1) {
      selectedOptions.splice(indexOfSelectedOption, 1);
      if (!isMultiselect) {
        this.closeOptionPanel();
      }
    } else {
      if (!isMultiselect) {
        selectedOptions = [selectedRow];
        this.closeOptionPanel();
      } else {
        selectedOptions.push(selectedRow);
      }
    }
    this.setState({ selectedOptions });

    if (selectedOptions.length > 0) {
      if (!isMultiselect) {
        this.state.onSelectChoice(selectedOptions[0][primaryColumn]);
        this.props.onChange(selectedOptions[0][primaryColumn]);
      } else {
        selectedOptions = selectedOptions.map(value => value[primaryColumn]);
        this.state.onSelectChoice(JSON.stringify(selectedOptions));
        this.props.onChange(JSON.stringify(selectedOptions));
      }
    } else {
      this.state.onSelectChoice(undefined);
      this.props.onChange(undefined);
    }
  };

  onDeleteChoice = deletedChoice => {
    let {
      selectionColumn,
      selectedOptions,
      isMultiselect,
      primaryColumn,
    } = this.state;
    for (let index = 0; index < selectedOptions.length; index++) {
      if (selectedOptions[index][selectionColumn] === deletedChoice) {
        selectedOptions.splice(index, 1);
        this.setState({ selectedOptions });
        if (selectedOptions.length > 0) {
          if (!isMultiselect) {
            this.state.onDeleteChoice(selectedOptions[0][primaryColumn]);
            this.props.onChange(selectedOptions[0][primaryColumn]);
          } else {
            selectedOptions = selectedOptions.map(
              value => value[primaryColumn]
            );
            this.state.onDeleteChoice(JSON.stringify(selectedOptions));
            this.props.onChange(JSON.stringify(selectedOptions));
          }
        } else {
          this.state.onDeleteChoice(undefined);
          this.props.onChange(undefined);
        }
      }
    }
  };

  getIndexOfSelectedRowFromSelectedOptionsList = selectedRow => {
    const { selectedOptions, primaryColumn } = this.state;
    let recordFounded = -1;
    for (let index = 0; index < selectedOptions.length; index++) {
      if (
        selectedOptions[index][primaryColumn] === selectedRow[primaryColumn]
      ) {
        recordFounded = index;
        break;
      }
    }
    return recordFounded;
  };

  closeOptionPanel = () => {
    if (this.state.pageNumber !== 0) {
      this.setState({ isSearching: false, pageNumber: 0 }, () =>
        this.fetchData()
      );
    } else if (this.state.isSearching) {
      this.setState({ isSearching: false });
    }
  };

  render() {
    const { label, classes, placeholder } = this.props;
    const {
      isSearching,
      searchText,
      options,
      pageNumber,
      pageSize,
      cols,
      customClass,
      totalOptionsCount,
      selectedOptions,
      selectionColumn,
      isMultiselect,
      isLoading,
      primaryColumn,
      getChipDisplayText,
    } = this.state;

    const loader = isLoading && (
      <CircularProgress size={25} style={{ marginLeft: 10 }} />
    );
    const selected = (
      <SelectionBar
        primaryColumn={primaryColumn}
        selectedOptions={selectedOptions}
        isMultiselect={isMultiselect}
        selectionColumn={selectionColumn}
        onDeleteChoice={this.onDeleteChoice}
        getChipDisplayText={getChipDisplayText}
      />
    );
    return (
      <div className={customClass}>
        <Grid
          container
          direction="row"
          align-items="center"
          className={classes.container}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={label}
              placeholder={placeholder}
              className={classes.inputField}
              margin="normal"
              value={searchText}
              onChange={this.handleChange}
              onFocus={() => this.setState({ isSearching: true })}
              InputProps={{
                startAdornment: selected,
                endAdornment: (
                  <Icon onClick={() => this.setState({ isSearching: true })}>
                    arrow_drop_down
                  </Icon>
                ),
              }}
            />
            {loader}
          </Grid>
        </Grid>
        <Paper className="AsyncMultiselectDropdown-paper">
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

export default withStyles(styles)(AsyncMultiselectDropdown);
