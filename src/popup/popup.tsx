import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import styled from 'styled-components';

import './popup.css';
import icon512 from '../../assets/icon512.png';
import { ConfigDict } from '../types/chromeStorage'
import { testConnection } from '../llms/base';
import { getConfigDict } from '../functions/getConfigDict';
import { storageKeyLocalConfig } from '../constants/chromeStorage';
import { providerModelsConfigs } from '../constants/models';
import { apiStatuses } from '../constants/apiStatuses';


const Popup: React.FC = () => {
  const [configDict, setConfigDict] = useState<ConfigDict | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [providerDisplayed, setProviderDisplayed] = useState<string | null>(null);
  const [modelDisplayed, setModelDisplayed] = useState<string | null>(null);
  const [inputApiKey, setInputApiKey] = useState<string>("");

  ////////// hooks //////////

  // Start by getting the configDict
  useEffect(() => {
    getConfigDict().then((configDict) => {
      setConfigDict(configDict);
      setProviderDisplayed(configDict.providerSelected);
      setModelDisplayed(configDict.modelSelected);
    });
  }, []);

  // Each time the configDict changes, update the storage
  useEffect(() => {
    if (configDict) {
      chrome.storage.local.set({ [storageKeyLocalConfig]: configDict });
    }
  }, [configDict]);

  ////////// functions //////////

  const testApiKey = async (provider: string, modelName: string, apiToken: string) => {
    setErrorMessage("");
    
    try {
      await testConnection(provider, modelName, apiToken);
      
      // Update config with valid status
      const newConfigDict: ConfigDict = {
        ...configDict,
        providers: {
          ...configDict?.providers,
          [provider]: {
            apiKey: apiToken,
            status: "valid"
          }
        }
      };
      setConfigDict(newConfigDict);
    } catch (error: any) {
      var status = "error";
      if (error.type === "invalid") {
        status = "invalid";
      } else if (error.type === "invalid") {
        status = "valid";
      } else {
        status = "error";
      }
      // Update config with invalid status
      const newConfigDict: ConfigDict = {
        ...configDict,
        providers: {
          ...configDict?.providers,
          [provider]: {
            apiKey: apiToken,
            status: status
          }
        }
      };
      setConfigDict(newConfigDict);
      setErrorMessage(error.message || "Invalid API key");
    }
  };

  const goToDatabaseSchemaOptions = () => {
    chrome.runtime.openOptionsPage();
  }

  ////////// event handlers //////////

  const onClickSubmit = () => {
    const apiKey = inputApiKey != "" ? inputApiKey : configDict.providers[providerDisplayed].apiKey;
    if (!modelDisplayed) {
      setErrorMessage("You must select a model to test the API key");
      return;
    }
    if (!apiKey) {
      setErrorMessage("You must enter an API key");
      return;
    }
    testApiKey(providerDisplayed, modelDisplayed, apiKey);
  }

  ////////// rendering //////////

  return (
    <Root>
      <Header>
        <HeaderIcon src={icon512} alt="Header Icon" />
        <HeaderTitle>Metabase Copilot</HeaderTitle>
      </Header>

      {configDict && (<>

        <Main>

          <OptionsButtonContainer>
            <OptionsButton onClick={() => goToDatabaseSchemaOptions()}>
              Database Schema Options
            </OptionsButton>
          </OptionsButtonContainer>

          <ApiKeyParagraph>
            To use the extension, you need to select a model and provide an API key for the associated provider.
          </ApiKeyParagraph>

          <ProviderContainer>
            <ProviderLabel>Provider:</ProviderLabel>
            {Object.keys(providerModelsConfigs).sort().reverse().map((provider) => (
              <ProviderButton
                key={provider}
                isSelected={providerDisplayed === provider}
                onClick={
                  () => {
                    setProviderDisplayed(provider);
                    setModelDisplayed(
                      provider === configDict.providerSelected 
                        ? configDict.modelSelected || null 
                        : null
                    );
                    setInputApiKey("");
                    setErrorMessage("");
                  }
                }
              >
                {providerModelsConfigs[provider].displayName}
              </ProviderButton>
            ))}
          </ProviderContainer>

          <ModelContainer>
            <ModelLabel>Model:</ModelLabel>
            <ModelButtonsContainter>
              {Object.keys(providerModelsConfigs[providerDisplayed].models).map((model) => (
                <ModelButton
                  key={model}
                  isSelected={modelDisplayed === model} 
                  onClick={
                    () => {
                      setModelDisplayed(model);
                      setConfigDict({
                        ...configDict,
                        providerSelected: providerDisplayed,
                        modelSelected: model
                      });
                    }
                  }
                >
                  {providerModelsConfigs[providerDisplayed].models[model].displayName}
                </ModelButton>
              ))}
            </ModelButtonsContainter>
          </ModelContainer>

          <InputContainer>
            <InputLabel>API Key:</InputLabel>
            <ApiInput
              id="api-input"
              type="text"
              value={inputApiKey}
              onChange={(e) => setInputApiKey(e.target.value)}
              placeholder={configDict.providers[providerDisplayed].apiKey ? 
                `${configDict.providers[providerDisplayed].apiKey.slice(0, 5)}...${configDict.providers[providerDisplayed].apiKey.slice(-2)}` : 
                "Enter your API key"}
            />
          </InputContainer>

          <StatusContainer>
            <StatusLabel>Status:</StatusLabel>
            <StatusValue status={configDict.providers[providerDisplayed]?.status || "none"}>
              {apiStatuses[configDict.providers[providerDisplayed]?.status] || "None"}
            </StatusValue>
          </StatusContainer>

          <ErrorMessage>{errorMessage}</ErrorMessage>

          <SubmitContainer>
            <SubmitButton onClick={onClickSubmit}>
              Submit
            </SubmitButton>
          </SubmitContainer>

        </Main>
        
      </>)}

    </Root>
  );
};

// styled components

const Root = styled.div`
  width: 320px;
  min-height: 480px;
  max-height: 480px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  margin: 0px;
`;

// header

const Header = styled.header`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 16px 20px;
  gap: 10px;
  width: 100%;
  height: 72px;
  border-bottom: 1px solid var(--light-grey);
  flex: none;
  align-self: stretch;
  flex-grow: 0;
`;

const HeaderIcon = styled.img`
  width: 40px;
  height: 40px;
`;

const HeaderTitle = styled.h1`
  font-style: normal;
  font-weight: 700;
  font-size: 24px;
  line-height: 40px;
  flex: none;
  flex-grow: 0;
  margin: 0px;
`;

// options button

const OptionsButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const OptionsButton = styled.div`
  font-size: 14px;
  margin-bottom: 8px;
  cursor: pointer;
  text-decoration: underline;
  font-style: italic;
`;

// main part

const Main = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 8px 16px;
  width: 100%;
  height: 100%;
  flex: none;
  align-self: stretch;
  flex-grow: 1;
`;

// description

const ApiKeyParagraph = styled.p`
  font-style: normal;
  font-weight: 400;
  font-size: 13px;
  line-height: 18px;
  flex: none;
  margin: 0px;
  color: var(--dark-grey);
  margin-top: 4px;
`;

// provider

const ProviderContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 0px;
  gap: 10px;
  height: 24px;
  width: 100%;
  margin-top: 16px;
`;

const ProviderLabel = styled.span`
  font-size: 14px;
  height: 24px;
  line-height: 24px;
  margin: 0px 8px 2px 0px;
  font-weight: 600;
`;

const ProviderButton = styled.div<{ isSelected: boolean }>`
  font-size: 14px;
  height: 16px;
  line-height: 16px;
  margin: 0px 4px;
  cursor: pointer;
  border-bottom: ${props => props.isSelected ? '2px solid #00ff00' : '2px solid transparent'};
`;


// model

const ModelContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 0px;
  gap: 8px;
  width: 100%;
  margin-top: 16px;
`;

const ModelLabel = styled.span`
  font-size: 14px;
  height: 24px;
  line-height: 24px;
  margin: 0px 8px 0px 0px;
  font-weight: 600;
`;

const ModelButtonsContainter = styled.div`
  display: flex;
  flex-wrap: wrap;
  row-gap: 12px;
  column-gap: 12px;
  width: 100%;
`;

const ModelButton = styled.div<{ isSelected: boolean }>`
  font-size: 14px;
  height: 16px;
  line-height: 16px;
  cursor: pointer;
  border-bottom: ${props => props.isSelected ? '2px solid #ff00ff' : '2px solid transparent'};
  display: inline-block;
  white-space: nowrap;
`;

// input

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  width: 100%;
  flex: none;
  align-self: stretch;
  gap: 8px;
  margin-top: 16px;
`;

const InputLabel = styled.p`
  font-size: 14px;
  height: 24px;
  line-height: 24px;
  margin: 0px 8px 0px 0px;
  font-weight: 600;
`;

const ApiInput = styled.input`
  width: 100%;
  height: 24px;
  background-color: transparent;
  border: none;
  border-bottom: 1px solid var(--neutral-grey);
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;

  &:focus {
    outline: none;
  }
`;

// status

const StatusContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  height: 32px;
  flex: none;
  margin-top: 16px;
`;

const StatusLabel = styled.span`
  font-size: 16px;
  line-height: 19px;
  font-weight: 600;
`;

const StatusValue = styled.span<{ status?: string }>`
  font-size: 16px;
  line-height: 19px;
  font-weight: 400;
  background-color: ${props => 
    !props.status || props.status === "error" || props.status === "none" ? "#EDEDED" :
    props.status === "invalid" ? "var(--light-red)" :
    props.status === "valid" ? "var(--light-blue)" : ""
  };
`;

// error message

const ErrorMessage = styled.div`
  width: 100%;
  font-size: 12px;
  line-height: 14px;
  color: var(--dark-red);
  min-height: 42px;
  max-height: 42px;
  overflow-y: auto;
  word-wrap: break-word;
`;

// submit

const SubmitContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0px;
  width: 100%;
  padding: 16px 0px 10px;
  box-sizing: border-box;
  justify-content: flex-end;
`;

const SubmitButton = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background-color: var(--dark-blue);
  border-radius: 6px;
  padding: 10px 24px;
  box-sizing: border-box;
  cursor: pointer;
  transition: 200ms linear;

  &:hover {
    background-color: var(--dark-blue-hover);
  }
`;


const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
