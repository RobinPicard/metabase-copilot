export interface ConfigDict {
  schema?: DatabasesSchema;
  schemaExtractedAt?: string;
  status?: 'error' | 'invalid' | 'valid';
  key?: string;
  modelName?: string;
}

export interface DatabasesSchema {
  [key: number]: {
    engine: string;
    tables: string;
  };
}
