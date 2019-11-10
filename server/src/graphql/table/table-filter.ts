import { Brackets, SelectQueryBuilder, WhereExpression } from "typeorm";

import uuid = require("uuid/v4");

const MAX_TABLE_FILTERS = parseInt(process.env.MAX_TABLE_FILTERS) || 100;

const MAX_TABLE_FILTER_CONSTRAINTS =
  parseInt(process.env.MAX_TABLE_FILTER_CONSTRAINTS) || 100;

export function buildTableQuery(
  qb: SelectQueryBuilder<any>,
  query: TableQuery,
  tableAlias: string,
  allowedColumns: string[]
): SelectQueryBuilder<any> {
  if (!query.filters) {
    return qb;
  }

  return processFilters(qb, query.filters, tableAlias, allowedColumns);
}
export interface TableQuery {
  sortKey?: string;
  sortDir?: SortDirection;
  filters?: Filter[];
  skip: number;
  limit: number;
}

export type SortDirection = "ASCEND" | "DESCEND";

interface Filter {
  constraints: Constraint[];
}

interface Constraint {
  negate?: boolean;
  predicate: Predicate;
}

interface Predicate {
  predicateType: string;
  column: string;
  value: string;
}

interface SQLPredicate {
  paramKey: string;
  query: string;
}

export interface TerminalTypeMap {
  LT(p: Predicate): SQLPredicate;
  LTE(p: Predicate): SQLPredicate;
  GT(p: Predicate): SQLPredicate;
  GTE(p: Predicate): SQLPredicate;
  EQ(p: Predicate): SQLPredicate;
  LIKE(p: Predicate): SQLPredicate;
}

export function createTablePredicateTypeMap(
  tableAlias: string,
  allowedColumns: string[]
): TerminalTypeMap {
  return {
    LT(p) {
      const id = uuid();
      return {
        paramKey: `value_${id}`,
        query: `"${tableAlias}"."${p.column}" < :value_${id}`
      };
    },
    LTE(p) {
      const id = uuid();
      return {
        paramKey: `value_${id}`,
        query: `"${tableAlias}"."${p.column}" <= :value_${id}`
      };
    },
    GT(p) {
      const id = uuid();
      return {
        paramKey: `value_${id}`,
        query: `"${tableAlias}"."${p.column}" > :value_${id}`
      };
    },
    GTE(p) {
      const id = uuid();
      return {
        paramKey: `value_${id}`,
        query: `"${tableAlias}"."${p.column}" >= :value_${id}`
      };
    },
    EQ(p) {
      const id = uuid();
      return {
        paramKey: `value_${id}`,
        query: `"${tableAlias}"."${p.column}" = :value_${id}`
      };
    },
    LIKE(p) {
      const id = uuid();
      return {
        paramKey: `value_${id}`,
        query: `"${tableAlias}"."${p.column}" LIKE :value_${id}`
      };
    }
  };
}

function processFilters(
  qb: SelectQueryBuilder<any>,
  filters: Filter[],
  tableAlias: string,
  allowedColumns: string[]
): SelectQueryBuilder<any> {
  if (filters.length < 1) {
    return qb;
  }

  if (filters.length > MAX_TABLE_FILTERS) {
    throw new Error(
      `Too many filters. ${MAX_TABLE_FILTERS} < ${filters.length}`
    );
  }

  const [firstFilter, ...restFilters] = filters;

  const firstQuery = processConstraints(
    qb,
    firstFilter.constraints,
    qb => qb.where.bind(qb),
    tableAlias,
    allowedColumns
  );

  function reducer(qb, filter) {
    return processConstraints(
      qb,
      filter.constraints,
      qb => qb.orWhere.bind(qb),
      tableAlias,
      allowedColumns
    );
  }

  return restFilters.reduce(reducer, firstQuery);
}

function processConstraints(
  qb: SelectQueryBuilder<any>,
  constraints: Constraint[],
  getParentClause: (
    qb: SelectQueryBuilder<any>
  ) => (...arg: any) => SelectQueryBuilder<any>,
  tableAlias: string,
  allowedColumns: string[]
): SelectQueryBuilder<any> {
  if (constraints.length < 1) {
    return qb;
  }

  if (constraints.length > MAX_TABLE_FILTER_CONSTRAINTS) {
    throw new Error(
      `Too many constraints in a single filter. ${MAX_TABLE_FILTER_CONSTRAINTS} < ${constraints.length}`
    );
  }

  const clause = getParentClause(qb);

  return clause(
    new Brackets(qb => {
      const [firstConstraint, ...restConstraints] = constraints;

      const firstQuery = processConstraint(
        qb,
        firstConstraint,
        qb => qb.where.bind(qb),
        tableAlias,
        allowedColumns
      );

      function reducer(qb, constraint) {
        return processConstraint(
          qb,
          constraint,
          qb => qb.andWhere.bind(qb),
          tableAlias,
          allowedColumns
        );
      }

      return restConstraints.reduce(reducer, firstQuery);
    })
  );
}

function processConstraint(
  qb: WhereExpression,
  constraint: Constraint,
  getParentClause: (qb: WhereExpression) => (...arg: any) => WhereExpression,
  tableAlias: string,
  allowedColumns: string[]
): WhereExpression {
  if (!allowedColumns.includes(constraint.predicate.column)) {
    throw new Error(`
Unexpected terminal column, ${constraint.predicate.column},
is not included in the valid list of columns: ${allowedColumns}
    `);
  }

  const typeMap = createTablePredicateTypeMap(tableAlias, allowedColumns);

  const translateToSQL =
    typeMap[constraint.predicate.predicateType.toUpperCase()];

  if (!translateToSQL) {
    throw new Error(
      `Unexpected terminal type: ${constraint.predicate.predicateType}`
    );
  }

  const predicate: SQLPredicate = translateToSQL(constraint.predicate);

  const clause = getParentClause(qb);

  return clause(`${constraint.negate ? "NOT " : ""}${predicate.query}`, {
    [predicate.paramKey]: constraint.predicate.value
  });
}
