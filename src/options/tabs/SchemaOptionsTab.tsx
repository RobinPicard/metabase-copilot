import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { Collapse, Checkbox } from 'antd';
import {
  ConfigDict,
  DatabaseSchemaOptionsDatabase,
  DatabaseSchemaOptionsTable,
} from '../../types/chromeStorage';
import { getConfigDict } from '../../functions/getConfigDict';
import { storageKeyLocalConfig } from '../../constants/chromeStorage';


const { Panel } = Collapse;


const SchemaOptionsTab: React.FC = () => {
  const [configDict, setConfigDict] = useState<ConfigDict | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<[string | null, "error" | "info" | null]>([null, null]);
  const feedbackRef = useRef<HTMLDivElement>(null);

  ////////// hooks //////////s

  // Get the config dict upon mounting
  useEffect(() => {
    getConfigDict().then((configDict) => {
      setConfigDict(configDict);
    });
  }, []);

  // Close the feedback message when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (feedbackRef.current && !feedbackRef.current.contains(event.target as Node)) {
        setFeedbackMessage([null, null]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  ////////// functions //////////

  const groupTablesBySchema = (tables: DatabaseSchemaOptionsTable[]) => {
    const schemas: { [key: string]: DatabaseSchemaOptionsTable[] } = {};
    tables.forEach(table => {
      if (!schemas[table.schema]) {
        schemas[table.schema] = [];
      }
      schemas[table.schema].push(table);
    });
    return schemas;
  };

  ////////// user interactions //////////

  const saveSchemaOptions = () => {
    chrome.storage.local.set({ [storageKeyLocalConfig]: configDict }, () => {
      setFeedbackMessage(["Schema options saved", "info"]);
    });
  }

  const handleSchemaChange = (databaseId: string, schemaName: string, checked: boolean, event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (!configDict?.databaseSchemaOptions) return;

    const updatedOptions = { ...configDict.databaseSchemaOptions };
    updatedOptions[databaseId].tables = updatedOptions[databaseId].tables.map(table => {
      if (table.schema === schemaName) {
        return { ...table, selected: checked };
      }
      return table;
    });

    setConfigDict({ ...configDict, databaseSchemaOptions: updatedOptions });
  };

  const handleTableChange = (databaseId: string, tableId: number, checked: boolean) => {
    if (!configDict?.databaseSchemaOptions) return;

    const updatedOptions = { ...configDict.databaseSchemaOptions };
    updatedOptions[databaseId].tables = updatedOptions[databaseId].tables.map(table => {
      if (table.id === tableId) {
        return { ...table, selected: checked };
      }
      return table;
    });

    setConfigDict({ ...configDict, databaseSchemaOptions: updatedOptions });
  };

  ////////// rendering //////////

  const renderTables = (databaseId: string, tables: DatabaseSchemaOptionsTable[]) => {
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

  const renderSchemas = (databaseId: string, database: DatabaseSchemaOptionsDatabase) => {
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
    if (!configDict?.databaseSchemaOptions) return null;

    return Object.keys(configDict.databaseSchemaOptions).map(databaseId => {
      const database = configDict.databaseSchemaOptions[databaseId];
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
        !configDict?.formattedDatabaseSchema ? (
          <NoDatabaseSchemaMessage>
            You first need to extract the database schema to able to update the options.<br/><br/>
            To do so, make sure you submitted a valid API key for the provider you selected and go to the native query editor of Metabase to automatically extract the schema.
          </NoDatabaseSchemaMessage>
        ) : configDict?.databaseSchemaOptions ? (
          <>
            <Description>
              Only select the schemas and tables you want to be included in the context provided to the LLM.
              <br/><br/>
              Limiting the number of tables selected for each database will improve the accuracy of the queries.
              <br/><br/>
              Due to context window constraints, the database schema description for a database may be truncated if it's too long.
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

      {feedbackMessage[0] && (
        <FeedbackMessage ref={feedbackRef} className={feedbackMessage[1]}>
          <FeedbackText className={feedbackMessage[1]}>{feedbackMessage[0]}</FeedbackText>
          <CloseButton onClick={() => setFeedbackMessage([null, null])}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L11 11M1 11L11 1" stroke="#721c24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </CloseButton>
        </FeedbackMessage>
      )}

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




const FeedbackMessage = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  border-radius: 4px;
  padding: 10px;
  max-width: 300px;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex;

  &.error {
    background-color: var(--light-red);
    border: 1px solid var(--dark-red);
  }

  &.info {
    background-color: var(--light-blue);
    border: 1px solid var(--dark-blue);
  }
`;

const FeedbackText = styled.p`
  margin: 0;
  font-size: 14px;

  &.error {
    color: var(--dark-red);
  }

  &.info {
    color: var(--black);
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-left: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover svg path {
    stroke: #5a1720;
  }
`;




export default SchemaOptionsTab;
