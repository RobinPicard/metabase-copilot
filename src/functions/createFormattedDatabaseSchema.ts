import {DatabaseSchemaOptionsRoot} from "../types/chromeStorage";


export function createFormattedDatabaseSchema(
  databaseSchemaOptions: DatabaseSchemaOptionsRoot
): {[key: number]: {engine: string, tables: string}} {
  const formattedDatabaseSchema: {[key: number]: {engine: string, tables: string}} = {};
  for (const databaseId in databaseSchemaOptions) {
    const tables = databaseSchemaOptions[databaseId].tables;
    const selectedTables = tables.filter((table) => table.selected);
    const sortedTables = selectedTables.sort((a, b) => a.schema.localeCompare(b.schema));
    const formattedDescription = sortedTables.map((table) => table.formattedDescription).join("");
    formattedDatabaseSchema[Number(databaseId)] = {
      engine: databaseSchemaOptions[databaseId].engine,
      tables: formattedDescription,
    };
  }
  return formattedDatabaseSchema;
}
