import {
  storageKeyLocalConfig,
  storageKeyLocalConfigOld
} from '../constants/chromeStorage';
import { ConfigDict } from '../types/chromeStorage';
import { defaultConfigDict } from '../constants/chromeStorage';

export const getConfigDict = (): Promise<ConfigDict> => {
  return new Promise((resolve) => {
    chrome.storage.local.get([storageKeyLocalConfig, storageKeyLocalConfigOld], (result) => {
      const configDict = result[storageKeyLocalConfig];
      if (configDict) {
        resolve(configDict);
        return;
      }
      const oldConfigDict = result[storageKeyLocalConfigOld];
      if (oldConfigDict) {
        var newConfigDict: ConfigDict = defaultConfigDict;
        newConfigDict.rawDatabaseSchema = oldConfigDict.schema;
        newConfigDict.rawDatabaseSchemaExtractedAt = oldConfigDict.schemaExtractedAt;
        newConfigDict.popupPosition = oldConfigDict.popupPosition;
        newConfigDict.providerSelected = "openai";
        newConfigDict.modelSelected = oldConfigDict.modelName;
        newConfigDict.providers.openai.apiKey = oldConfigDict.key;
        newConfigDict.providers.openai.status = oldConfigDict.status;
        chrome.storage.local.set({ [storageKeyLocalConfig]: newConfigDict });
        //chrome.storage.local.remove(storageKeyLocalConfigOld);
        resolve(newConfigDict);
        return;
      }
      resolve(defaultConfigDict);
    });
  });
};
