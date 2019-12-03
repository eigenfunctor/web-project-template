import * as PouchDB from "pouchdb";
import { DBRefs, createLocalDB, PostSpec, PostFeedSpec } from "./util";
import { defineDocSpec } from "../src";

describe("test doc spec and scope", async () => {
  const refs = createLocalDB();
  it("should populate the database with filters and validations", async () => {
    defineDocSpec(refs.db, PostSpec);
    defineDocSpec(refs.db, PostFeedSpec);

    await expect(
      refs.db.get(`filter_${PostSpec().namespace}`)
    ).resolves.toBeDefined();
    await expect(
      refs.db.get(`validate_${PostSpec().namespace}`)
    ).resolves.toBeDefined();
  });

  it("should fail to insert an invalid document ", async () => {});
  it("should succeed to insert a nvalid document ", async () => {});
  it("should fail to update with an invalid document ", async () => {});
  it("should succeed to update a valid document ", async () => {});
  it("should list all documents for a specific model", async () => {});
  it("should resolve the contents of a document", async () => {});
});
