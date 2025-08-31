import {DatabaseSchemaOptionsRoot} from "../types/chromeStorage";


export function adaptDatabaseSchemaOptions(
  existingDatabaseSchemaOptions: DatabaseSchemaOptionsRoot,
  newDefaultDatabaseSchemaOptions: DatabaseSchemaOptionsRoot
): DatabaseSchemaOptionsRoot {
  // Iterate over the combined keys of both objects
  const allDatabaseIds = new Set([
    ...Object.keys(existingDatabaseSchemaOptions),
    ...Object.keys(newDefaultDatabaseSchemaOptions),
  ]);

  allDatabaseIds.forEach((databaseId) => {
    const existingDatabase = existingDatabaseSchemaOptions[databaseId];
    const newDefaultDatabase = newDefaultDatabaseSchemaOptions[databaseId];

    // If the database exists in newDefaultDatabaseSchemaOptions
    if (newDefaultDatabase) {
      if (!existingDatabase) {
        // If the database does not exist in existingDatabaseSchemaOptions, add it
        existingDatabaseSchemaOptions[databaseId] = newDefaultDatabase;
      } else {
        // Remove tables that are not in newDefaultDatabaseSchemaOptions
        const updatedTables = existingDatabase.tables.filter((table) => {
          return newDefaultDatabase.tables.some((newTable) => newTable.name === table.name);
        });
        // Add new tables
        newDefaultDatabase.tables.forEach((newTable) => {
          if (!existingDatabase.tables.some((table) => table.name === newTable.name)) {
            // Check if the new table is in a schema with most tables selected
            const schemaTables = newDefaultDatabase.tables.filter((table) => table.schema === newTable.schema);
            const selectedTables = schemaTables.filter((table) => table.selected);
            const mostTablesSelected = selectedTables.length >= schemaTables.length / 2;

            // Add the new table with the appropriate selection
            updatedTables.push({
              ...newTable,
              selected: mostTablesSelected && newTable.schema !== "newSchema",
            });
          }
        });
        // Update the tables in the existing database
        existingDatabase.tables = updatedTables;
      }
    } else {
      // remove the database if it does not exist in newDefaultDatabaseSchemaOptions
      delete existingDatabaseSchemaOptions[databaseId];
    }
  });

  return existingDatabaseSchemaOptions;
}
