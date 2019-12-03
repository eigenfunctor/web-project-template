import uuid from "uuid/v4";
export interface DBRefs {
  db?: PouchDB.Database;
}

export function createLocalDB(): DBRefs {
  const refs = { db: null };

  beforeAll(() => {
    refs.db = new PouchDB(`test-${uuid()}`);
  });

  afterAll(() => {
    refs.db && refs.db.destroy();
  });

  return refs;
}
