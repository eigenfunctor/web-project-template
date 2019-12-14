import * as PouchDB from "pouchdb";

/**
 * This function is the entrypoint of document modelling using a user specific pouchdb database handle.
 * The database handle is assumed to have administrative access to all user databases.
 */
export function useDocumentModel(adminDB: PouchDB.Database) {
  // TODO: Add custom design documents to the user database here.
}
