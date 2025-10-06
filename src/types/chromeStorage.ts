type apiStatus = 'error' | 'invalid' | 'valid';

export interface OldConfigDict {
  schema?: object;
  schemaExtractedAt?: string;
  status?: apiStatus;
  key?: string;
  modelName?: string;
  popupPosition?: {
    left: number;
    top: number;
  };
}

export interface ConfigDict {
  rawDatabaseSchema?: RawDatabaseSchemaRoot;
  rawDatabaseSchemaExtractedAt?: string;
  databaseSchemaOptions?: DatabaseSchemaOptionsRoot;
  databaseSchemaOptionsUpdatedAt?: string;
  formattedDatabaseSchema?: {
    [key: number]: {
      engine: string;
      tables: string;
    };
  };
  providerSelected?: string;
  modelSelected?: string;
  providers: {
    openai: {
      apiKey?: string;
      status?: apiStatus;
    };
    anthropic: {
      apiKey?: string;
      status?: apiStatus;
    };
    gemini: {
      apiKey?: string;
      status?: apiStatus;
    };
  };
  popupPosition?: {
    left: number;
    top: number;
  };
}

// Raw database schema

export type RawDatabaseSchemaRoot = RawDatabase[];

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

// Database schema options

export interface DatabaseSchemaOptionsRoot {
  [id: string]: DatabaseSchemaOptionsDatabase;
}

export interface DatabaseSchemaOptionsDatabase {
  engine: string;
  name: string;
  tables: DatabaseSchemaOptionsTable[];
}

export interface DatabaseSchemaOptionsTable {
  id: number;
  description?: string;
  name: string;
  schema: string;
  selected: boolean;
  numberTokens?: number;
  formattedDescription?: string;
  fields: DatabaseSchemaOptionsColumn[];
}

export interface DatabaseSchemaOptionsColumn {
  id: number;
  name: string;
  description?: string;
  database_type: string;
  target_table_id?: number;
  target_column_id?: number;
  target_formatted_name?: string;
}