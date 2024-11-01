import React, { useEffect } from 'react';
import styled from 'styled-components';

import {
  UserData,
  DatabaseSchemaOptionsData,
  DatabaseSchemaOptionsDatabaseData,
  DatabaseSchemaOptionsTableData
} from '../../types/backendApi'
import functions from '../../firebase/functions'
import { Collapse, Checkbox } from 'antd';
import getFirebaseAuthToken from '../../chromeMessaging/getAuthToken';


const { Panel } = Collapse;

interface Props {
  user: UserData;
  databaseSchemaOptions: DatabaseSchemaOptionsData;
  setDatabaseSchemaOptions: (options: DatabaseSchemaOptionsData) => void;
  setFeedbackMessage: (message: [string, "error" | "info" | null]) => void;
}


const SchemaOptionsTab: React.FC<Props> = ({ user, databaseSchemaOptions, setDatabaseSchemaOptions, setFeedbackMessage }) => {

  ////////// hooks //////////

  useEffect(() => {
    if (user.formattedDatabaseSchema) {
      getDatabaseSchemaOptions();
    }
  }, [user.formattedDatabaseSchema]);

  ////////// backend requests //////////

  // Get the user's data from the backend
  const getDatabaseSchemaOptions = async () => {
    try {
      const token = await getFirebaseAuthToken();
      const result = await functions.callFunction('api/getDatabaseSchemaOptions', token, "GET");
      setDatabaseSchemaOptions(result as DatabaseSchemaOptionsData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setFeedbackMessage(['Could not load the database schema options. Please refresh the page. If the issue persists, reach out to our support.', 'error']);
    }
  }

  const saveSchemaOptions = async () => {
    if (!databaseSchemaOptions) return;
    try {
      const token = await getFirebaseAuthToken();
      const response = await functions.callFunction('api/updateDatabaseSchemaOptions', token, "POST", databaseSchemaOptions);
      setFeedbackMessage(['Database schema options successfully saved.', 'info']);
    } catch (error) {
      console.error('Error saving schema options:', error);
      setFeedbackMessage(['Could not save the database schema options. Please refresh the page. If the issue persists, reach out to our support.', 'error']);
    }
  };

  ////////// functions //////////

  const groupTablesBySchema = (tables: DatabaseSchemaOptionsTableData[]) => {
    const schemas: { [key: string]: DatabaseSchemaOptionsTableData[] } = {};
    tables.forEach(table => {
      if (!schemas[table.schema]) {
        schemas[table.schema] = [];
      }
      schemas[table.schema].push(table);
    });
    return schemas;
  };

  ////////// user interactions //////////

  const handleSchemaChange = (databaseId: string, schemaName: string, checked: boolean, event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (!databaseSchemaOptions) return;

    const updatedOptions = { ...databaseSchemaOptions };
    updatedOptions[databaseId].tables = updatedOptions[databaseId].tables.map(table => {
      if (table.schema === schemaName) {
        return { ...table, selected: checked };
      }
      return table;
    });

    setDatabaseSchemaOptions(updatedOptions);
  };

  const handleTableChange = (databaseId: string, tableId: number, checked: boolean) => {
    if (!databaseSchemaOptions) return;

    const updatedOptions = { ...databaseSchemaOptions };
    updatedOptions[databaseId].tables = updatedOptions[databaseId].tables.map(table => {
      if (table.id === tableId) {
        return { ...table, selected: checked };
      }
      return table;
    });

    setDatabaseSchemaOptions(updatedOptions);
  };

  ////////// rendering //////////

  const renderTables = (databaseId: string, tables: DatabaseSchemaOptionsTableData[]) => {
    return tables.map(table => (
      <TableRow key={table.id}>
        <TableName>{table.name}</TableName>
        <TableCheckbox>
          <StyledCheckbox
            checked={table.selected}
            onChange={(e) => handleTableChange(databaseId, table.id, e.target.checked)}
          />
        </TableCheckbox>
      </TableRow>
    ));
  };

  const renderSchemas = (databaseId: string, database: DatabaseSchemaOptionsDatabaseData) => {
    const schemas = groupTablesBySchema(database.tables);
    return (
      <StyledCollapse>
        {Object.keys(schemas).map(schemaName => {
          const tables = schemas[schemaName];
          const isSelected = tables.some(table => table.selected);
          const selectedTokens = tables
            .filter(table => table.selected)
            .reduce((sum, table) => sum + (table.numberTokens || 0), 0)
          
          return (
            <StyledPanel 
              header={
                <SchemaHeader>
                  <SchemaName>{schemaName}</SchemaName>
                  <SchemaTokens>{selectedTokens > 0 ? `${selectedTokens.toLocaleString('en-US')} tokens` : ''}</SchemaTokens>
                  <SchemaCheckbox>
                    <StyledCheckbox
                      checked={isSelected}
                      onClick={(e) => handleSchemaChange(databaseId, schemaName, !isSelected, e)}
                    />
                  </SchemaCheckbox>
                </SchemaHeader>
              } 
              key={schemaName}
            >
              {renderTables(databaseId, tables)}
            </StyledPanel>
          );
        })}
      </StyledCollapse>
    );
  };

  const renderDatabases = () => {
    if (!databaseSchemaOptions) return null;

    return Object.keys(databaseSchemaOptions).map(databaseId => {
      const database = databaseSchemaOptions[databaseId];
      const totalTokens = database.tables
        .filter(table => table.selected)
        .reduce((sum, table) => sum + (table.numberTokens || 0), 0)

      return (
        <DatabaseContainer key={databaseId}>
          <DatabaseTitle>
            {database.name}
            {totalTokens > 0 && (
              <DatabaseTokens>
                {totalTokens.toLocaleString('en-US')} tokens
              </DatabaseTokens>
            )}
          </DatabaseTitle>
          {renderSchemas(databaseId, database)}
        </DatabaseContainer>
      );
    });
  };

  return (
    <Root>
      {
        !user.formattedDatabaseSchema ? (
          <NoDatabaseSchemaMessage>
            You first need to extract the database schema to able to update the options.<br/><br/>
            Go to the native query editor of Metabase to automatically extract the schema.
          </NoDatabaseSchemaMessage>
        ) : databaseSchemaOptions ? (
          <>
            <Description>
              Only select the schemas and tables you want to be included in the context provided to the LLM.
              <br/><br/>
              Limiting the number of tables selected for each database will improve the accuracy of the queries.
              <br/><br/>
              Due to context window constraints, the database schema description for a database will be truncated if it's longer than 125.000 tokens.
            </Description>
            {renderDatabases()}
            <SaveButtonContainer>
              <SaveButton onClick={saveSchemaOptions}>Save</SaveButton>
            </SaveButtonContainer>
          </>
        ) : (
          <div></div>
        )
      }
    </Root>
  );
}

const Root = styled.div`
  min-width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const NoDatabaseSchemaMessage = styled.div`
  font-size: 14px;
  line-height: 20px;
  color: var(--black);
`;

const Description = styled.div`
  font-size: 14px;
  color: var(--black);
  margin-bottom: 24px;
  line-height: 20px;
`;

const TableRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  width: 100%;
`;

const TableName = styled.div`
  flex: 1;
  color: var(--black);
`;

const TableCheckbox = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 50px;
`;

const StyledCollapse = styled(Collapse)`
  width: 100%;
  background-color: white;
`;

const StyledPanel = styled(Panel)`
  width: 100%;
`;

const SchemaHeader = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  color: var(--black);
  background-color: white;
`;

const SchemaName = styled.div`
  flex: 1;
  color: var(--black);
`;

const SchemaTokens = styled.div`
  text-align: right;
  padding-right: 8px;
  width: 100px;
  color: var(--black);
`;

const SchemaCheckbox = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 50px;
`;

const DatabaseContainer = styled.div`
  width: 100%;
  margin-bottom: 24px;
`;

const DatabaseTitle = styled.h2`
  display: flex;
  align-items: center;
`;

const DatabaseTokens = styled.span`
  margin-left: 16px;
  font-size: 14px;
  color: var(--black);
`;

const SaveButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

const SaveButton = styled.div`
  height: 36px;
  line-height: 36px;
  padding: 0px 16px;
  background-color: var(--dark-blue);
  border-radius: 5px;
  border: 1px solid var(--dark-blue);
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  text-align: center;
  color: white;

  &:hover {
    background-color: var(--dark-blue-hover);
  }
`;

const StyledCheckbox = styled(Checkbox)`
  .ant-checkbox-inner {
    transition: all 0.2s ease-out;
  }
  .ant-checkbox-checked .ant-checkbox-inner {
    background-color: var(--dark-blue);
    border-color: var(--dark-blue);
  }
  .ant-checkbox-checked::after {
    border-color: var(--dark-blue);
    transition: all 0.2s ease-out;
  }
  .ant-checkbox-inner::after {
    transition: all 0.1s ease-out;
  }
`;

export default SchemaOptionsTab;
