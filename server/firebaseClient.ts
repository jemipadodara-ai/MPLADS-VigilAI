let currentDb: any = null;

export function setDb(database: any) {
  currentDb = database;
}

export function getDb(): any {
  return currentDb;
}

export const db = {
  get instance() {
    return currentDb;
  }
};
