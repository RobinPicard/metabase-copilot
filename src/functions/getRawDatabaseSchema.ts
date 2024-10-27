export interface RawDatabase {
  id: number;
  name: string;
  engine: string;
  tables: RawTable[];
}

export interface RawTable {
  id: number;
  description: string | undefined;
  name: string;
  schema: string;
  fields: RawColumn[];
}

export interface RawColumn {
  id: number;
  name: string;
  description?: string;
  base_type: string;
  database_type: string;
  effective_type: string;
  semantic_type: string;
  target_table_id?: number;
  target_column_id?: number;
}

interface DatabaseResponse {
  id: number;
  engine: string;
  is_saved_questions: boolean;
  name: string;
  tables: DatabaseTableReponse[];
}

interface DatabaseTableReponse {
  id: number;
  active: boolean;
}

interface TableResponse {
  id: number;
  description?: string;
  name: string;
  schema: string;
  fields: ColumnResponse[];
}

interface ColumnResponse {
  id: number;
  active: boolean;
  description?: string;
  name: string;
  target?: {
    table_id: number;
    id: number;
  };
  database_type: string;
  base_type: string;
  effective_type: string;
  semantic_type: string;
  visibility_type: string;
}

async function getRawDatabaseSchema(): Promise<RawDatabase[]> {
  const rawSchemas: RawDatabase[] = [];
  try {
    const databasesResponse = await apiGetRequest('/api/database?include=tables');

    for (const database of databasesResponse.data as DatabaseResponse[]) {
      if (database.is_saved_questions || database.name === "Saved Questions") {
        continue;
      }

      const rawDatabase: RawDatabase = {
        id: database.id,
        name: database.name,
        engine: database.engine,
        tables: await getTables(database.tables),
      };

      rawSchemas.push(rawDatabase);
    }
  } catch (error) {
    console.error('Error extracting raw database schemas:', error);
  }
  return rawSchemas;
}

async function getTables(databaseTables: DatabaseTableReponse[]): Promise<RawTable[]> {
  const tables: RawTable[] = [];
  for (const databaseTable of databaseTables) {
    if (!databaseTable.active) continue;
    
    try {
      const tableResponse: TableResponse = await apiGetRequest(`/api/table/${databaseTable.id}/query_metadata`);
      const rawTable: RawTable = {
        id: tableResponse.id,
        name: tableResponse.name,
        schema: tableResponse.schema,
        description: tableResponse.description,
        fields: tableResponse.fields
          .filter(field => field.active && !['hidden', 'retired', 'sensitive'].includes(field.visibility_type))
          .map(field => ({
            id: field.id,
            name: field.name,
            description: field.description,
            base_type: field.base_type,
            database_type: field.database_type,
            effective_type: field.effective_type,
            semantic_type: field.semantic_type,
            target_table_id: field.target?.table_id,
            target_column_id: field.target?.id,
          })),
      };
      tables.push(rawTable);
    } catch (error) {
      console.error(`Error fetching table metadata for table ${databaseTable.id}:`, error);
    }
  }

  return tables;
}

async function apiGetRequest(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw error;
  }
}

export default getRawDatabaseSchema;
