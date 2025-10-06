import { streamResponse } from '../llms/base';
import { ConfigDict } from '../types/chromeStorage';
import { storageKeyLocalConfig } from '../constants/chromeStorage';


const wrapLlmCall = (
  configDict: ConfigDict,
  systemInstruction: string,
  messages: string[],
  onResponseData: (chunk: string, isComplete: boolean) => void,
  onResponseError: (errorMessage: string) => void
) => {

  async function main() {
    try {
      const responseGenerator = streamResponse(
        configDict.providerSelected,
        configDict.modelSelected,
        configDict.providers[configDict.providerSelected].apiKey,
        systemInstruction,
        messages
      );

      for await (const [chunk, isComplete] of responseGenerator) {
        onResponseData(chunk, isComplete);
      }
    } catch (error) {
      // If the API key is invalid, set the status to invalid in the local config
      if (
        configDict
        && configDict.providers[configDict.providerSelected].apiKey
        && (error.type === 'invalid')
      ) {
        chrome.storage.local.set({
          [storageKeyLocalConfig]: {
            ...configDict,
            providers: {
              ...configDict.providers,
              [configDict.providerSelected]: {
                ...configDict.providers[configDict.providerSelected],
                status: "invalid",
              }
            }
          }
        })
      }
      onResponseError(error.message);
    }
  };

  main();
};


export { wrapLlmCall };
