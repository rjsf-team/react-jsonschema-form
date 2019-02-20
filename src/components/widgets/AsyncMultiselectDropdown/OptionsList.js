import React from "react";

import {
  Grid,
  TableHead,
  TablePagination,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Checkbox,
  Radio,
} from "@material-ui/core";

const OptionsList = props => {
  const {
    isMultiselect,
    cols,
    options,
    handleRowClick,
    getIndexOfSelectedRowFromSelectedOptionsList,
    pageSize,
    totalOptionsCount,
    pageNumber,
    handleChangePage,
    closeOptionPanel,
  } = props;

  const hideColumns = [];
  if (options.length == 0) {
    return <p>No Records Found...</p>;
  }

  return (
    <React.Fragment>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell />
            {cols.map((column, key) => {
              if (!column.hasOwnProperty("hide")) {
                return <TableCell key={key}>{column.name}</TableCell>;
              } else {
                hideColumns.push(column.key);
              }
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {options.map((row, rowkey) => (
            <TableRow
              key={rowkey}
              hover
              selected={
                getIndexOfSelectedRowFromSelectedOptionsList(row) !== -1
              }
              onClick={event => handleRowClick(event, row)}>
              {isMultiselect ? (
                <TableCell key={rowkey}>
                  <Checkbox
                    checked={
                      getIndexOfSelectedRowFromSelectedOptionsList(row) !== -1
                    }
                  />
                </TableCell>
              ) : (
                <TableCell key={rowkey}>
                  <Radio
                    checked={
                      getIndexOfSelectedRowFromSelectedOptionsList(row) !== -1
                    }
                  />
                </TableCell>
              )}
              {Object.keys(row).map((cell, cellkey) => {
                if (hideColumns.indexOf(cell) === -1) {
                  return <TableCell key={cellkey}>{row[cell]}</TableCell>;
                }
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Grid container direction="row" justify="flex-end">
        <TablePagination
          rowsPerPageOptions={[pageSize]}
          component="div"
          count={totalOptionsCount}
          rowsPerPage={pageSize}
          page={pageNumber}
          backIconButtonProps={{
            "aria-label": "Previous Page",
          }}
          nextIconButtonProps={{
            "aria-label": "Next Page",
          }}
          onChangePage={handleChangePage}
        />
        <Button onClick={closeOptionPanel}>Done</Button>
      </Grid>
    </React.Fragment>
  );
};
export default OptionsList;
