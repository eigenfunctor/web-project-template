import React from "react";
import { useDebounce } from "react-use";
import { useRouter } from "next/router";
import {
  Box,
  Grid,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField
} from "@material-ui/core";
import { useQuery, useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import { useAuthCheck, useAdminCheck } from "../../hooks";

const ALL_USERS_QUERY = gql`
  query AllUsersQuery($query: TableQueryInput!) {
    allUsers(query: $query) {
      header {
        key
        name
      }
      rows {
        id
        provider
        loggedName
        loggedEmail
        isAdmin
      }
      count
    }
  }
`;

const Users: React.FunctionComponent = () => {
  useAuthCheck({ failureRedirect: "/login" });
  useAdminCheck({ failureRedirect: "/" });

  const [limit, setLimit] = React.useState(25);

  const [page, setPage] = React.useState(0);

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  useDebounce(() => setSearch(searchInput), 500, [searchInput]);

  const [sortKey, setSortKey] = React.useState(null);

  const [sortDir, setSortDir] = React.useState("asc");

  const query = {
    sortKey,
    sortDir,
    filters: [
      {
        constraints: [
          {
            negate: false,
            predicate: {
              predicateType: "LIKE",
              column: "loggedName",
              value: `%${search}%`
            }
          }
        ]
      },
      {
        constraints: [
          {
            negate: false,
            predicate: {
              predicateType: "LIKE",
              column: "loggedEmail",
              value: `%${search}%`
            }
          }
        ]
      }
    ],
    skip: page * limit,
    limit
  };

  const { data, loading, refetch } = useQuery(ALL_USERS_QUERY, {
    variables: { query }
  });

  if (!data) {
    return null;
  }

  const { header, rows, count } = data.allUsers;

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
              value={searchInput}
              onChange={event => setSearchInput(event.target.value)}
            />
          </Box>
          <Table>
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
                      {CELL_COMPONENTS[col.key]
                        ? React.createElement(CELL_COMPONENTS[col.key], {
                            ...(col.cellProps || {}),
                            column: col,
                            row,
                            refetch
                          })
                        : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

export default Users;

const CELL_COMPONENTS: { [key: string]: React.FunctionComponent<any> } = {
  isAdmin({ column, row, options, refetch }) {
    const IS_ADMIN_QUERY = gql`
      query IsAdminQuery($profile: ProfileInput!) {
        isAdmin(profile: $profile)
      }
    `;

    const SET_ADMIN_MUTATION = gql`
      mutation SetAdminMutation(
        $profile: ProfileInput!
        $isAdmin: Boolean!
        $overrideCode: String
      ) {
        setAdmin(
          profile: $profile
          isAdmin: $isAdmin
          overrideCode: $overrideCode
        )
      }
    `;

    const profile = { provider: row.provider, id: row.id };

    const { query } = useRouter();
    const [mutate] = useMutation(SET_ADMIN_MUTATION);

    return (
      <Select
        native
        value={row.isAdmin ? 1 : 0}
        onChange={async event => {
          await mutate({
            variables: {
              profile,
              isAdmin:
                (parseInt(event.target.value as string) || 0) === 1
                  ? true
                  : false,
              overrideCode: query.override
            }
          });
          refetch();
        }}
        name="isAdmin"
      >
        <option value={1}>Yes</option>
        <option value={0}>No</option>
      </Select>
    );
  }
};
