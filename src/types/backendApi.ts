interface CompanyData {
  name: string;
  subscriptionStatus: string;
  subscriptionCanceledAt: {_seconds: number, _nanoseconds: number};
  numberOfUsers: number;
}

export interface formattedDatabaseSchemaData {
  [key: number]: {
    engine: string;
    tables: string;
  };
}

export interface UserData {
  id: string,
  email: string;
  name: string;
  companyId: string;
  role: string;
  company: CompanyData;
  formattedDatabaseSchema?: formattedDatabaseSchemaData;
  lastQueryAt: {_seconds: number, _nanoseconds: number};
  dayQueriesCounter: number;
  createdAt: {_seconds: number, _nanoseconds: number};
}

// Database Schema Options

export interface DatabaseSchemaOptionsData {
  [id: string]: DatabaseSchemaOptionsDatabaseData;
}

export interface DatabaseSchemaOptionsDatabaseData {
  engine: string;
  name: string;
  tables: DatabaseSchemaOptionsTableData[];
}

export interface DatabaseSchemaOptionsTableData {
  id: number;
  description?: string;
  name: string;
  schema: string;
  selected: boolean;
  numberTokens?: number;
  formattedDescription?: string;
  fields: DatabaseSchemaOptionsColumnData[];
}

export interface DatabaseSchemaOptionsColumnData {
  id: number;
  name: string;
  description?: string;
  database_type: string;
  target_table_id?: number;
  target_column_id?: number;
  target_formatted_name?: string;
}

export interface CompanyUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export interface CompanyInvitation {
  email: string;
  role: string;
}

export interface Payment {
  companyId: string;
  invoiceId: string;
  customerId: string;
  subscriptionId: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: {_seconds: number, _nanoseconds: number};
}
