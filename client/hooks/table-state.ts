import React from "react";
import { useDebounce } from "react-use";

interface UseTableStateInitial {
  sortKey?: string;
  sortDir?: string;
  search?: string;
  page: number;
  limit: number;
}

interface UseTableStateResult {
  sortKey?: string;
  setSortKey: (k: string) => void;
  sortDir?: string;
  setSortDir: (d: string) => void;
  search?: string;
  setSearch?: (s: string) => void;
  searchInput?: string;
  setSearchInput?: (s: string) => void;
  page: number;
  setPage: (p: number) => void;
  limit: number;
  setLimit: (l: number) => void;
}

export function useTableState(
  initialState?: UseTableStateInitial
): UseTableStateResult {
  let initial = (initialState || {}) as UseTableStateInitial;

  const [limit, setLimit] = React.useState(initial.limit || 25);

  const [page, setPage] = React.useState(initial.page || 0);

  const [searchInput, setSearchInput] = React.useState(initial.search || "");
  const [search, setSearch] = React.useState(initial.search || "");
  useDebounce(() => setSearch(searchInput), 500, [searchInput]);

  const [sortKey, setSortKey] = React.useState(initial.sortKey || null);

  const [sortDir, setSortDir] = React.useState(initial.sortDir || "asc");

  return {
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
  };
}
