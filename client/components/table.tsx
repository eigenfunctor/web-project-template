import React from "react";
import {
  Box,
  Grid,
  Paper,
  Select,
  Table as MUITable,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField
} from "@material-ui/core";

export interface ColumnHeader {
  key: string;
  name: string;
}

export interface CellProps {
  column: ColumnHeader;
  row: any;
  refetchTable: () => void;
}

export interface TableData {
  header: ColumnHeader[];
  rows: { [key: string]: any }[];
  count?: number;
}

export interface TableProps {
  data?: TableData;
  refetchTable?: () => void;
  cellComponentMap: {
    [key: string]:
      | string
      | React.FunctionComponent<CellProps>
      | React.ComponentClass<CellProps>;
  };
  sortKey?: string;
  setSortKey: (k: string) => void;
  sortDir?: string;
  setSortDir: (d: string) => void;
  search?: string;
  setSearch?: (s: string) => void;
  page: number;
  setPage: (p: number) => void;
  limit: number;
  setLimit: (l: number) => void;
}

const Table: React.FunctionComponent<TableProps> = ({
  data,
  refetchTable,
  cellComponentMap,
  sortKey,
  setSortKey,
  sortDir,
  setSortDir,
  search,
  setSearch,
  page,
  setPage,
  limit,
  setLimit
}) => {
  if (!data) {
    return null;
  }

  const { header, rows, count } = data;

  return (
    <Grid container justify="center">
      <Box mx={[8]} my={[8]} width="100%">
        <Paper>
          <Box m={[3]}>
            <TextField
              label="Search"
              type="search"
              margin="normal"
              variant="outlined"
              value={search}
              onChange={event => setSearch && setSearch(event.target.value)}
            />
          </Box>
          <MUITable>
            <TableHead>
              <TableRow>
                {header.map(col => (
                  <TableCell key={col.key} align="left">
                    <TableSortLabel
                      active={sortKey === col.key}
                      direction={sortDir as "asc" | "desc"}
                      onClick={() => {
                        if (sortKey === col.key) {
                          if (sortDir === "asc") {
                            setSortDir("desc");
                          } else {
                            setSortDir("asc");
                          }
                        } else {
                          setSortKey(col.key);
                        }
                      }}
                    >
                      {col.name}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id}>
                  {header.map((col, i) => (
                    <TableCell key={col.key} align="left">
                      {cellComponentMap[col.key]
                        ? React.createElement<CellProps>(
                            cellComponentMap[col.key],
                            {
                              column: col,
                              row,
                              refetchTable:
                                refetchTable instanceof Function
                                  ? refetchTable
                                  : () => {}
                            }
                          )
                        : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </MUITable>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={count}
            rowsPerPage={limit}
            page={page}
            backIconButtonProps={{
              "aria-label": "previous page"
            }}
            nextIconButtonProps={{
              "aria-label": "next page"
            }}
            onChangePage={(_, newPage) => setPage(newPage)}
            onChangeRowsPerPage={event =>
              setLimit(parseInt(event.target.value) || 50)
            }
          />
        </Paper>
      </Box>
    </Grid>
  );
};

export default Table;
