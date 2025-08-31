import {dump} from "js-yaml";
import {encodingForModel} from "js-tiktoken";

import {
  RawDatabaseSchemaRoot,
  RawDatabase,
  RawTable,
  RawColumn,
  DatabaseSchemaOptionsRoot,
  DatabaseSchemaOptionsDatabase,
  DatabaseSchemaOptionsTable,
  DatabaseSchemaOptionsColumn
} from '../types/chromeStorage';


export function createDefaultDatabaseSchemaOptions(rawData: RawDatabaseSchemaRoot): DatabaseSchemaOptionsRoot {
  return rawData.reduce((transformedData, database) => {
    transformedData[database.id] = transformDatabase(database);
    return transformedData;
  }, {} as DatabaseSchemaOptionsRoot);
}

function transformDatabase(database: RawDatabase): DatabaseSchemaOptionsDatabase {
  return {
    engine: database.engine,
    name: database.name,
    tables: database.tables.map((table) => transformTable(table, database)),
  };
}

function transformTable(
  table: RawTable,
  database: RawDatabase
): DatabaseSchemaOptionsTable {
  const transformedTable: DatabaseSchemaOptionsTable = {
    id: table.id,
    description: table.description,
    name: table.name,
    schema: table.schema,
    fields: table.fields.map((column) => transformColumn(column, database)),
    selected: true,
  };

  const tableForFormattedDescription = createObjectForYamlDescription(transformedTable);
  transformedTable.formattedDescription = dump(tableForFormattedDescription, {lineWidth: 1000});
  const encoding = encodingForModel("gpt-3.5-turbo");
  transformedTable.numberTokens = encoding.encode(transformedTable.formattedDescription).length;

  return transformedTable;
}

function transformColumn(
  column: RawColumn,
  database: RawDatabase
): DatabaseSchemaOptionsColumn {
  const transformedColumn: DatabaseSchemaOptionsColumn = {
    id: column.id,
    description: column.description,
    name: column.name,
    target_table_id: column.target_table_id,
    target_column_id: column.target_column_id,
    database_type: column.database_type,
  };

  if (transformedColumn.target_table_id) {
    transformedColumn.target_formatted_name = getFormattedTargetName(
      column.target_table_id,
      column.target_column_id,
      database
    );
  }

  return transformedColumn;
}

function getFormattedTargetName(
  target_table_id: number | undefined,
  target_column_id: number | undefined,
  database: RawDatabase
): string | undefined {
  const targetTable = database.tables.find((table) => table.id === target_table_id);
  if (targetTable) {
    const targetColumn = targetTable.fields.find((field) => field.id === target_column_id);
    if (targetColumn) {
      return `${targetTable.schema}.${targetTable.name}.${targetColumn.name}`;
    }
  }
  return undefined;
}

function createObjectForYamlDescription(table: DatabaseSchemaOptionsTable): object {
  const tableName = `${table.schema}.${table.name}`;
  const fields = table.fields.reduce((acc, field) => {
    acc[field.name] = {
      ...(field.description && {description: field.description}),
      database_type: field.database_type,
      ...(field.target_formatted_name && {foreign_key_target: field.target_formatted_name}),
    };
    return acc;
  }, {} as { [key: string]: { description?: string; database_type: string; foreign_key_target?: string } });

  return {
    [tableName]: {
      ...(table.description && {description: table.description}),
      columns: fields,
    },
  };
}
