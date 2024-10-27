import { dump } from 'js-yaml';

import { RawDatabase, RawTable, RawColumn } from './getRawDatabaseSchema';


interface Schema {
  [key: number]: {
    engine: string;
    tables: string;
  };
}

interface FormattedTable {
  description?: string;
  name: string;
  schema: string;
  columns: { [key: number]: FormattedColumn };
}

interface FormattedColumn {
  description?: string;
  name: string;
  fk_table_id?: number;
  fk_column_id?: number;
  type: string;
  foreign_key_target?: string | null;
}


async function getFormattedDatabaseSchema(rawDatabaseSchema: RawDatabase[]): Promise<Schema> {
  const schema: Schema = {};
  try {
    for (const database of rawDatabaseSchema) {
      const filteredTables = removeDbtDevTables(database.tables);
      const formattedTables = formatTables(filteredTables);
      const tablesWithReplacedIds = replaceIdsWithNames(formattedTables);
      const yamlStrTables = dump(tablesWithReplacedIds, {indent: 2, lineWidth: -1, noRefs: true});
      schema[database.id] = {
        engine: database.engine,
        tables: yamlStrTables
      };
    }
  } catch (error) {
    console.error('Error extracting database schema:', error);
  }
  return schema;
}

function removeDbtDevTables(tables: RawTable[]): RawTable[] {
  const hasDbtProduction = tables.some(table => table.schema === 'dbt_production');
  if (hasDbtProduction) {
    return tables.filter(table => !(table.schema.startsWith('dbt_') && table.schema !== 'dbt_production'));
  }
  return tables;
}

function formatTables(rawTables: RawTable[]): { [key: number]: FormattedTable } {
  return rawTables.reduce((acc: { [key: number]: FormattedTable }, table) => {
    acc[table.id] = {
      description: table.description,
      name: table.name,
      schema: table.schema,
      columns: formatColumns(table.fields),
    };
    return acc;
  }, {});
}

function formatColumns(rawColumns: RawColumn[]): { [key: number]: FormattedColumn } {
  const columns = rawColumns.reduce((acc: { [key: number]: FormattedColumn }, column) => {
    acc[column.id] = formatColumn(column);
    return acc;
  }, {});

  // Add foreign key information
  Object.values(columns).forEach(column => {
    if (column.fk_column_id) {
      column.foreign_key_target = findFkTargetName(columns, column.fk_table_id, column.fk_column_id);
    }
  });

  return columns;
}

function replaceIdsWithNames(tables: { [key: number]: FormattedTable }): { [key: string]: any } {
  return Object.values(tables).reduce((acc: { [key: string]: any }, table) => {
    const tableKey = `${table.schema}.${table.name}`;
    acc[tableKey] = {
      ...(table.description && { description: table.description }),
      columns: Object.values(table.columns).reduce((columnAcc: { [key: string]: any }, column) => {
        if (column.name) {
          columnAcc[column.name] = {
            ...(column.description && { description: column.description }),
            ...(column.type && { type: column.type }),
            ...(column.foreign_key_target && { foreign_key_target: column.foreign_key_target }),
          };
        }
        return columnAcc;
      }, {})
    };
    return acc;
  }, {});
}

function formatColumn(column: RawColumn): FormattedColumn {
  return {
    description: column.description,
    name: column.name,
    fk_table_id: column.target_table_id,
    fk_column_id: column.target_column_id,
    type: column.target_column_id ? 'FOREIGN_KEY' : column.database_type,
  };
}

function findFkTargetName(columns: { [key: number]: FormattedColumn }, fk_table_id?: number, fk_column_id?: number): string | null {
  if (!fk_table_id || !fk_column_id) return null;
  const fkColumn = columns[fk_column_id];
  return fkColumn ? `${fkColumn.name}` : null;
}

export default getFormattedDatabaseSchema;
