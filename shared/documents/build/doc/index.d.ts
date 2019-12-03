/// <reference types="pouchdb-find" />
/// <reference types="pouchdb-core" />
/// <reference types="pouchdb-mapreduce" />
/// <reference types="pouchdb-replication" />
import { DocSpec } from "../validation";
export interface Doc<T> {
    _id: string;
    namespace: string;
    content?: T;
}
export declare function defineDocSpec<T>(db: PouchDB.Database, spec: DocSpec<T>): Promise<void>;
declare type FindRequest = PouchDB.Find.FindRequest<{}>;
declare type FindResponse<T> = PouchDB.Find.FindResponse<T>;
export interface DBScope<T> {
    db: PouchDB.Database;
    spec: DocSpec<T>;
    keys: {
        readonly [K in keyof T]?: () => Promise<DBScope<T[K]>>;
    };
    resolve(doc: Doc<T>, options?: PouchDB.Core.GetOptions): Promise<Doc<T>>;
    put(doc: Doc<T>): Promise<PouchDB.Core.Response>;
    create(content?: T): Promise<Doc<T>>;
    find(findRequest: FindRequest): Promise<FindResponse<Doc<T>>>;
}
export declare function useRecordSpec<T>(db: PouchDB.Database, spec: DocSpec<T>): Promise<DBScope<T>>;
declare type ReplicationEventEmitter = PouchDB.Replication.ReplicationEventEmitter<any, any, any>;
declare type ReplcateOptions = PouchDB.Replication.ReplicateOptions;
export declare function replicate<T>(scope: DBScope<T>, target: PouchDB.Database, options?: ReplcateOptions): ReplicationEventEmitter;
export {};
