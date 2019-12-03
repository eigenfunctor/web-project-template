import * as R from "ramda";
import * as PouchDB from "pouchdb";
import uuid from "uuid/v4";
import { Validation, createValidator } from "./validation";
import { hasNamespaceFilter } from "./util";

export interface Doc<T> {
  _id: string;
  namespace: string;
  content?: T;
}

export interface DocSpec<T> {
  namespace: string;
  schema: DocSchema<T>;
}

export type DocSchema<T> = {
  readonly [K in keyof T]?: {
    spec?: () => DocSpec<T[K]>;
    required?: boolean;
    validations?: Validation<T[K]>[];
  };
};

export async function defineDoc<T>(
  db: PouchDB.Database,
  spec: () => DocSpec<T>
): Promise<void> {
  const validationDDoc = {
    _id: `_design/validate_${spec().namespace}`,
    validate_doc_update: createValidator(spec)
  };

  const filterDDoc = {
    _id: `_design/filter_${spec().namespace}`,
    filters: {
      _: `
        function (doc, req) {
          return doc.namespace === '${spec().namespace}') {
        }
      `
    }
  };

  await db.put(validationDDoc);
  await db.put(filterDDoc);
}

type FindRequest = PouchDB.Find.FindRequest<{}>;
type FindResponse<T> = PouchDB.Find.FindResponse<T>;

export interface DBScope<T> {
  db: PouchDB.Database;
  spec: () => DocSpec<T>;
  keys: {
    readonly [K in keyof T]?: () => Promise<DBScope<T[K]>>;
  };
  resolve(doc: Doc<T>, options?: PouchDB.Core.GetOptions): Promise<Doc<T>>;
  put(doc: Doc<T>): Promise<PouchDB.Core.Response>;
  create(content?: T): Promise<Doc<T>>;
  find(findRequest: FindRequest): Promise<FindResponse<Doc<T>>>;
}

export async function useDocSpec<T>(
  db: PouchDB.Database,
  spec: () => DocSpec<T>
): Promise<DBScope<T>> {
  if (!(await hasNamespaceFilter(db, spec().namespace))) {
    throw new Error(`Cannot find namespace in database: '${spec().namespace}'`);
  }

  async function resolve(doc, options) {
    const { _id, namespace, content } = await db.get(doc.id, options);

    return { _id, namespace, content } as Doc<T>;
  }

  async function put(doc) {
    const { _id, namespace, content } = doc;

    if (!content) {
      return db.put({
        _id,
        namespace: spec().namespace
      });
    }

    const keysWithDocSpecs = R.toPairs(spec().schema)
      .filter(([k, v]) => "spec" in v)
      .map(([k, v]) => k);

    const pairs = R.toPairs(content);

    const literals = pairs.filter(([k, v]) => !keysWithDocSpecs.includes(k));

    const childDocs = pairs.filter(([key, val]) =>
      keysWithDocSpecs.includes(key)
    );

    const childDocRefs = childDocs.map(([k, v]) => [
      k,
      { _id: v._id, namespace: spec().schema[k].namespace }
    ]);

    return db.put({
      _id,
      namespace: spec().namespace,
      content: R.fromPairs(literals.concat(childDocRefs))
    });
  }

  async function create(content) {
    const doc = {
      _id: `${spec().namespace}:${uuid()}`,
      namespace: spec().namespace,
      content
    };

    await put(doc);

    return doc;
  }

  async function find(selector) {
    const baseSelector = { selector: { namespace: { $eq: spec().namespace } } };

    return db.find(R.mergeDeepLeft(baseSelector, selector)) as Promise<
      FindResponse<Doc<T>>
    >;
  }

  const keys = R.fromPairs(
    R.toPairs(spec().schema)
      .filter(([k, v]) => "spec" in v)
      .map(([k, v]) => [k, () => useDocSpec(db, v.spec)])
  );

  return {
    db,
    spec,
    keys,
    resolve,
    put,
    create,
    find
  };
}
