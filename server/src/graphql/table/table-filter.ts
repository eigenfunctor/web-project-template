import {
  Connection,
  Brackets,
  SelectQueryBuilder,
  WhereExpression
} from "typeorm";

import uuid = require("uuid/v4");

const MAX_TABLE_FILTERS = parseInt(process.env.MAX_TABLE_FILTERS) || 100;

const MAX_TABLE_FILTER_CONSTRAINTS =
  parseInt(process.env.MAX_TABLE_FILTER_CONSTRAINTS) || 100;

export async function runTableQuery(
  db: Connection,
  qb: SelectQueryBuilder<any>,
  query: TableQuery,
  getFilterConditionClause: (
    qb: SelectQueryBuilder<any>
  ) => (...arg: any) => SelectQueryBuilder<any>,
  getConstraintConditionClause: (
    qb: SelectQueryBuilder<any>
  ) => (...arg: any) => SelectQueryBuilder<any>,
  allowedColumns: string[]
): Promise<{ rows: any[]; count?: number }> {
  let filteringQB = db.manager
    .createQueryBuilder()
    .select()
    .from(`(${qb.getQuery()})`, "filter_row_alias");

  if (query.filters) {
    filteringQB = processFilters(
      filteringQB,
      query.filters,
      getFilterConditionClause,
      getConstraintConditionClause,
      allowedColumns
    );
  }

  if (query.sortKey && allowedColumns.includes(query.sortKey)) {
    let sortDir = "ASC";
    if (
      query.sortDir &&
      ["ASC", "DESC"].includes(query.sortDir.toUpperCase())
    ) {
      sortDir = query.sortDir.toUpperCase();
    }

    filteringQB = filteringQB.orderBy(
      `"filter_row_alias"."${query.sortKey}"`,
      <SortDirection>sortDir
    );
  }

  const countQuery = filteringQB
    .clone()
    .orderBy()
    .select(["COUNT(*) AS count"]);

  const counts = await db.manager.query(...countQuery.getQueryAndParameters());

  const rows = await db.manager.query(
    ...filteringQB
      .skip(query.skip)
      .take(query.limit)
      .getQueryAndParameters()
  );

  return { rows, count: counts[0] && counts[0].count };
}

type SortDirection = "ASC" | "DESC";

export interface TableQuery {
  sortKey?: string;
  sortDir?: string;
  filters?: Filter[];
  skip: number;
  limit: number;
}

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
  allowedColumns: string[]
): TerminalTypeMap {
  return {
    LT(p) {
      const id = uuid();
      return {
        paramKey: `value_${id}`,
        query: `"filter_row_alias"."${p.column}" < :value_${id}`
      };
    },
    LTE(p) {
      const id = uuid();
      return {
        paramKey: `value_${id}`,
        query: `"filter_row_alias"."${p.column}" <= :value_${id}`
      };
    },
    GT(p) {
      const id = uuid();
      return {
        paramKey: `value_${id}`,
        query: `"filter_row_alias"."${p.column}" > :value_${id}`
      };
    },
    GTE(p) {
      const id = uuid();
      return {
        paramKey: `value_${id}`,
        query: `"filter_row_alias"."${p.column}" >= :value_${id}`
      };
    },
    EQ(p) {
      const id = uuid();
      return {
        paramKey: `value_${id}`,
        query: `"filter_row_alias"."${p.column}" = :value_${id}`
      };
    },
    LIKE(p) {
      const id = uuid();
      return {
        paramKey: `value_${id}`,
        query: `"filter_row_alias"."${p.column}" LIKE :value_${id}`
      };
    }
  };
}

function processFilters(
  qb: SelectQueryBuilder<any>,
  filters: Filter[],
  getFilterConditionClause: (
    qb: SelectQueryBuilder<any>
  ) => (...arg: any) => SelectQueryBuilder<any>,
  getConstraintConditionClause: (
    qb: SelectQueryBuilder<any>
  ) => (...arg: any) => SelectQueryBuilder<any>,
  allowedColumns: string[]
): SelectQueryBuilder<any> {
  if (filters.length < 1) {
    return qb;
  }

  if (filters.length > MAX_TABLE_FILTERS) {
    throw new Error(
      `Too many filters. MAX_TABLE_FILTERS = ${MAX_TABLE_FILTERS} < ${filters.length}`
    );
  }

  function filtersReducer(qb, filter) {
    return processConstraints(
      qb,
      filter.constraints,
      getFilterConditionClause,
      getConstraintConditionClause,
      allowedColumns
    );
  }

  return filters.reduce(filtersReducer, qb);
}

function processConstraints(
  qb: SelectQueryBuilder<any>,
  constraints: Constraint[],
  getFilterConditionClause: (
    qb: SelectQueryBuilder<any>
  ) => (...arg: any) => SelectQueryBuilder<any>,
  getConstraintConditionClause: (
    qb: SelectQueryBuilder<any>
  ) => (...arg: any) => SelectQueryBuilder<any>,
  allowedColumns: string[]
): SelectQueryBuilder<any> {
  if (constraints.length < 1) {
    return qb;
  }

  if (constraints.length > MAX_TABLE_FILTER_CONSTRAINTS) {
    throw new Error(
      `Too many constraints in a single filter. MAX_TABLE_FILTER_CONSTRAINTS = ${MAX_TABLE_FILTER_CONSTRAINTS} < ${constraints.length}`
    );
  }

  const clause = getFilterConditionClause(qb);

  return clause(
    new Brackets(qb => {
      function constraintsReducer(qb, constraint) {
        return processConstraint(
          qb,
          constraint,
          getConstraintConditionClause,
          allowedColumns
        );
      }

      return constraints.reduce(constraintsReducer, qb);
    })
  );
}

function processConstraint(
  qb: WhereExpression,
  constraint: Constraint,
  getConditionClause: (qb: WhereExpression) => (...arg: any) => WhereExpression,
  allowedColumns: string[]
): WhereExpression {
  if (!allowedColumns.includes(constraint.predicate.column)) {
    throw new Error(`
Unexpected terminal column, ${constraint.predicate.column},
is not included in the valid list of columns: ${allowedColumns}
    `);
  }

  const typeMap = createTablePredicateTypeMap(allowedColumns);

  const translateToSQL =
    typeMap[constraint.predicate.predicateType.toUpperCase()];

  if (!translateToSQL) {
    throw new Error(
      `Unexpected terminal type: ${constraint.predicate.predicateType}`
    );
  }

  const predicate: SQLPredicate = translateToSQL(constraint.predicate);

  const clause = getConditionClause(qb);

  return clause(`${constraint.negate ? "NOT " : ""}${predicate.query}`, {
    [predicate.paramKey]: constraint.predicate.value
  });
}
