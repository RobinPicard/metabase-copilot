import {DatabaseSchemaOptionsRoot} from "../types/chromeStorage";
import {generateResponse} from "../llms/base";
import {ConfigDict} from "../types/chromeStorage";
import {providerModelsConfigs} from "../constants/models";

/* eslint-disable max-len */
const systemPrompt = `
You will receive a list of database schemas with the tables they contain. Your objective is to select the schemas that interest us. 
What we want is to identify the schemas that contain data relevant for analytics and that would be queried in SQL in a data visualisation tool by an end user (again for analytics, not debugging).

For instance, we would typically keep schemas called "prod", "public", "mart", "facts", "analytics", "reporting", "dbt_production"... 
On the other end, we do not want to include any dev schemas or landing schemas for etl tools. 
For instance, we would typically not keep schemas called "staging", "raw", "etl", "fivetran", "census", "salesforce", "hubspot", "sandbox", "temp", "audit", "change_log", "dev", "dbt_staging", "dbt_<user_name>"... 
If there are several schemas starting with "dbt_", keep only one (the one that looks like it's for production).

Regarding the name of the tables contained in each schema, tables that look like internal api names of etl tools are usually indication that the schema does not interest us. 
For instance: "asset__c", "user_account__items", "_sdc_rejected", "_fivetran_sync"...

Return a json array containing the names of the schemas as strings ordered from the most interesting to the least interesting. 
Format of your answer: string[]. 
Do not include any explanation, just the tuple. 
Do not start your response with backticks. 
Only include schema names provided in the input, do not add any other names. Include at least one schema name.
`;
/* eslint-enable max-len */


export async function selectDefaultTablesDatabaseSchemaOptions(
  databaseSchemaOptions: DatabaseSchemaOptionsRoot,
  configDict: ConfigDict
): Promise<DatabaseSchemaOptionsRoot> {
  for (const databaseId in databaseSchemaOptions) {
    // list the schemas in the database with their associated tables
    const schemas: { [key: string]: string[] } = {};
    for (const table of databaseSchemaOptions[databaseId].tables) {
      const schemaName = table.schema;
      const tableName = table.name;
      if (!schemas[schemaName]) {
        schemas[schemaName] = [];
      }
      if (!schemas[schemaName].includes(tableName)) {
        schemas[schemaName].push(tableName);
      }
    }
    try {
      // get from the llm the list of schemas to keep
      const llmSelectedSchemasString = await generateResponse(
        configDict.providers[configDict.providerSelected].provider,
        configDict.modelSelected,
        configDict.providers[configDict.providerSelected].apiKey,
        systemPrompt,
        [JSON.stringify(schemas)],
        null
      );
      const llmSelectedSchemasArray = JSON.parse(llmSelectedSchemasString);
      // keep only the X first schemas that respect the total number of tokens constraint
      const selectedSchemas = [];
      let totalTokensDatabase = 0;
      for (const schemaName of llmSelectedSchemasArray) {
        let totalTokensSchema = 0;
        for (const table of databaseSchemaOptions[databaseId].tables) {
          if (table.schema === schemaName) {
            totalTokensSchema += table.numberTokens as number;
          }
        }
        if (
          totalTokensSchema + totalTokensDatabase > providerModelsConfigs[configDict.providers[configDict.providerSelected].provider].models[configDict.providers[configDict.providerSelected].model].contextWindow && selectedSchemas.length > 0
        ) {
          break;
        } else {
          selectedSchemas.push(schemaName);
          totalTokensDatabase += totalTokensSchema;
        }
      }
      // update the selected field in the databaseSchemaOptions
      for (const table of databaseSchemaOptions[databaseId].tables) {
        if (selectedSchemas.includes(table.schema)) {
          table.selected = true;
        } else {
          table.selected = false;
        }
      }
    } catch (error) {
      console.log(`Error parsing the response from the llm for database ${databaseId}:`, error);
    }
  }
  return databaseSchemaOptions;
}