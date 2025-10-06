export interface DatabaseResponse {
  id: number;
  engine: string;
  is_saved_questions: boolean;
  name: string;
  tables: DatabaseTableReponse[];
}

export interface DatabaseTableReponse {
  id: number;
  active: boolean;
}

export interface TableResponse {
  id: number;
  description?: string;
  name: string;
  schema: string;
  fields: ColumnResponse[];
}

export interface ColumnResponse {
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