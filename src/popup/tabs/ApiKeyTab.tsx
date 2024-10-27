import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import { ConfigDict } from '../../types/chromeStorage'


interface ApiKeyTabProps {
  configDict: ConfigDict;
  setConfigDict: (key: ConfigDict) => void;
  setActiveTab: (tab: "signIn" | "apiKey") => void;
  errorMessage: string;
  setErrorMessage: (message: string) => void;
}

const ApiKeyTab: React.FC<ApiKeyTabProps> = ({ configDict, setConfigDict, setActiveTab, errorMessage, setErrorMessage }) => {
  const [inputApiKey, setInputApiKey] = useState('');

  const updateModelDisplay = (modelName: string) => {
    setConfigDict({ ...configDict, modelName });
  };

  const testApiToken = (apiToken: string) => {
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": "Test"}],
        "max_tokens": 3
      })
    })
    .then(response => response.json())
    .then(data => {
      let newConfigDict: ConfigDict = { ...configDict, modelName: configDict?.modelName || "gpt-4o-mini" };
      if (data.error?.message) {
        newConfigDict = { ...newConfigDict, status: "invalid", key: apiToken };
        setErrorMessage(data.error.message);
      } else if (data.choices && data.choices[0].message?.content) {
        newConfigDict = { ...newConfigDict, status: "valid", key: apiToken };
        setErrorMessage("");
      } else {
        newConfigDict = { ...newConfigDict, status: "error" };
        setErrorMessage("Unknown error, sorry");
      }
      // setConfigDict(newConfigDict);
      setConfigDict({ ...configDict, ...newConfigDict });
    })
    .catch(error => {
      setErrorMessage("Something went wrong, sorry");
    });
  };

  return (
    <Root>
      <ChangeTabButtonContainer>
        <ChangeTabButton onClick={() => setActiveTab('signIn')}>I want to log in</ChangeTabButton>
      </ChangeTabButtonContainer>
      <Main>
        <StatusContainer>
          <StatusLabel>Status:</StatusLabel>
          <StatusValue status={configDict.status}>
            {!configDict.status || configDict.status === "error" ? "Missing API key" :
            configDict.status === "invalid" ? "Invalid API key" :
            configDict.status === "valid" ? "Valid API key" : ""}
          </StatusValue>
        </StatusContainer>
        <ApiKeyParagraph>
          To use this extension, you need an OpenAI API key.{' '}
          <ApiKeyLink href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer">
            <span>learn more here</span>
          </ApiKeyLink>
        </ApiKeyParagraph>
        <ModelVersionContainer>
          <ModelLabel>Model:</ModelLabel>
          {['gpt-4o', 'gpt-4o-mini'].map((model) => (
            <ModelButton
              key={model}
              isSelected={configDict.modelName === model}
              onClick={() => updateModelDisplay(model)}
            >
              {model}
            </ModelButton>
          ))}
        </ModelVersionContainer>
        <InputContainer>
          <InputLabel>OpenAI API Key</InputLabel>
          <ApiInput
            id="api-input"
            type="text"
            value={inputApiKey}
            onChange={(e) => setInputApiKey(e.target.value)}
            placeholder="Enter your API key"
          />
        </InputContainer>
      </Main>
      <SubmitContainer>
        <ErrorMessage>{errorMessage}</ErrorMessage>
        <SubmitButton onClick={() => {
          if (inputApiKey) {
            testApiToken(inputApiKey);
          }
        }}>
          Submit
        </SubmitButton>
      </SubmitContainer>
    </Root>
  );
};

// Styled components

const Root = styled.div`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  margin: 0px;
  flex-grow: 1;
`;

const ChangeTabButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const ChangeTabButton = styled.div`
  font-size: 14px;
  margin: 8px 0;
  cursor: pointer;
  text-decoration: underline;
  font-style: italic;
`;

const Main = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 10px;
  gap: 24px;
  width: 100%;
  height: 100%;
  flex: none;
  align-self: stretch;
  flex-grow: 1;
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
    !props.status || props.status === "error" ? "#EDEDED" :
    props.status === "invalid" ? "var(--light-red)" :
    props.status === "valid" ? "var(--light-blue)" : ""
  };
`;

// api key

const ApiKeyParagraph = styled.p`
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 19px;
  flex: none;
  margin: 0px;
`;

const ApiKeyLink = styled.a`
  padding: 0px;
  
  span {
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 19px;
    text-decoration-line: underline;
  }
`;

// model version

const ModelVersionContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 0px;
  gap: 8px;
  height: 24px;
  width: 100%;
`;

const ModelLabel = styled.span`
  font-size: 16px;
  height: 24px;
  line-height: 24px;
  margin: 0px 8px 0px 0px;
`;

const ModelButton = styled.div<{ isSelected: boolean }>`
  font-size: 16px;
  height: 24px;
  line-height: 24px;
  margin: 0px 4px;
  cursor: pointer;
  font-weight: ${props => props.isSelected ? '600' : '400'};
  border-bottom: ${props => props.isSelected ? '2px solid var(--dark-blue)' : '2px solid transparent'};
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
  margin-top: 12px;
`;

const InputLabel = styled.p`
  font-weight: 600;
  font-size: 16px;
  line-height: 19px;
  margin: 0px;
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

// submit

const SubmitContainer = styled.div`
  height: 120px;
  display: flex;
  flex-direction: column;
  padding: 0px;
  gap: 16px;
  width: 100%;
  padding-bottom: 20px;
  padding-left: 10px;
  padding-right: 10px;
  box-sizing: border-box;
  justify-content: flex-end;
`;

const ErrorMessage = styled.div`
  font-size: 12px;
  line-height: 12px;
  color: var(--dark-red);
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


export default ApiKeyTab;
