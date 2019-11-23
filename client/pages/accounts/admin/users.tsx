import React from "react";
import { useDebounce } from "react-use";
import { useQuery, useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import { Select } from "@material-ui/core";
import { useAuthCheck, useAdminCheck, useTableState } from "../../../hooks";
import Table, { CellProps } from "../../../components/table";

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
  useAuthCheck({ failureRedirect: "/accounts/login" });

  const isAdmin = useAdminCheck({ failureRedirect: "/" });

  const tableState = useTableState();

  const tableQuery = {
    sortKey: tableState.sortKey,
    sortDir: tableState.sortDir,
    filters: [
      {
        constraints: [
          {
            predicate: {
              predicateType: "LIKE",
              column: "loggedName",
              value: `%${tableState.search}%`
            }
          }
        ]
      },
      {
        constraints: [
          {
            predicate: {
              predicateType: "LIKE",
              column: "loggedEmail",
              value: `%${tableState.search}%`
            }
          }
        ]
      }
    ],
    skip: tableState.page * tableState.limit,
    limit: tableState.limit
  };

  const { data, loading, refetch } = useQuery(ALL_USERS_QUERY, {
    variables: { query: tableQuery },
    skip: !isAdmin
  });

  if (!data) {
    return null;
  }

  return (
    <Table
      data={data && data.allUsers}
      refetchTable={refetch}
      cellComponentMap={CELL_COMPONENT_MAP}
      {...tableState}
    />
  );
};

export default Users;

const CELL_COMPONENT_MAP: {
  [key: string]: React.FunctionComponent<CellProps>;
} = {
  isAdmin({ column, row, refetchTable }) {
    const SET_ADMIN_MUTATION = gql`
      mutation SetAdminMutation($profile: ProfileInput!, $isAdmin: Boolean!) {
        setAdmin(profile: $profile, isAdmin: $isAdmin)
      }
    `;

    const profile = { provider: row.provider, id: row.id };

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
                  : false
            }
          });
          refetchTable();
        }}
        name="isAdmin"
      >
        <option value={1}>Yes</option>
        <option value={0}>No</option>
      </Select>
    );
  }
};
