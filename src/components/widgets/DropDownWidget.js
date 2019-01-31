/** @jsx jsx */
import React from 'react';
import styled from '@emotion/styled';
import { jsx } from '@emotion/core';

const Select = styled.select`
  background-color: #fff;
  width: 100%;
  height: 34px;
  display: table-cell;
`;

class DropDownWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropDownValues: []
    };

  }

  componentDidMount() {
    this.props.handleGetListItems(this.props.label)
      .then(response => {
        this.setState({
          dropDownValues: response
        });
      }).catch(error => {
      console.log(error);
    });
  }

  handleChange = (event) => {
    const selectedValue = event.target.value;
    console.log('selected value for field ' + event.target.id + ' is ' + selectedValue);
    this.props.onChange(selectedValue);
  };



  render() {
    const optionViews = [];

    optionViews.push(<option key='placeholder' value={null}>{this.props.placeholder}</option>);

    this.state.dropDownValues.forEach(dropDownValue => {
      optionViews.push(
        <option key={dropDownValue.label} value={dropDownValue.value}>{dropDownValue.label}</option>);
    });
    

    return (
      <div>
        <Select id={this.props.label} onChange={this.handleChange}>
          {optionViews}
        </Select>
      </div>
    );
  }
}

export default DropDownWidget;
