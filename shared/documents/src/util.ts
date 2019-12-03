export async function hasNamespaceFilter(
  db: PouchDB.Database,
  namespace: string
): Promise<boolean> {
  try {
    return !!db.get(`_design/filter_${namespace}`);
  } catch (_) {
    return false;
  }
}
