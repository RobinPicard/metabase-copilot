import React from 'react';
import styled from 'styled-components';

import { UserData } from '../../types/backendApi'
import { storageKeyOptionsTab } from '../../constants/chromeStorage';


interface SignInTabProps {
  user: UserData;
  signIn: () => void;
  upgrade: () => void;
  setActiveTab: (tab: "signIn" | "apiKey") => void;
  errorMessage: string;
  setErrorMessage: (message: string) => void;
  updateModel: (modelName: string) => Promise<void>;
}

const models = [
  {
    name: "gemini-1.5-flash",
    displayName: "Gemini 1.5 Flash",
    isThinkingModel: false,
  },
  {
    name: "gemini-2.0-flash",
    displayName: "Gemini 2.0 Flash",
    isThinkingModel: false,
  },
  {
    name: "gpt-4o",
    displayName: "GPT-4o",
    isThinkingModel: false,
  },
  {
    name: "o3-mini",
    displayName: "o3-mini",
    isThinkingModel: true,
  },
  {
    name: "claude-3-5-sonnet",
    displayName: "Claude 3.5 Sonnet",
    isThinkingModel: false,
  },
  {
    name: "claude-3-7-sonnet",
    displayName: "Claude 3.7 Sonnet",
    isThinkingModel: false,
  },
  {
    name: "claude-3-7-sonnet-thinking",
    displayName: "Claude 3.7 Sonnet Thinking",
    isThinkingModel: true,
  },
]

const SignInTab: React.FC<SignInTabProps> = ({ user, signIn, upgrade, setActiveTab, errorMessage, setErrorMessage, updateModel }) => {

  let status = null;
  if (!user) {
    status = "notSignedIn";
  } else if (user && user.company) {
    status = "signedInPremium";
  } else if (user && !user.company) {
    status = "signedInFree";
  }

  ////////// functions //////////

  const getUserDisplayName = () => {
    if (user) {
      const displayName = user.name;
      return displayName.split(' ')[0];
    }
  };

  const getCompanyDisplayName = () => {
    if (user) {
      const displayName = user.company?.name;
      return displayName.split('.')[0];
    }
  };

  ////////// user interactions //////////

  // When the user clicks on the options button, open the options page
  const onClickOptions = () => {
    chrome.storage.local.set({ [storageKeyOptionsTab]: "accountSettings" }, () => {
      chrome.runtime.openOptionsPage();
    });
  };

  // When the user clicks on the sign in button, launch the sign in with Firebase process
  const onClickSignIn = () => {
    try {
      signIn();
    } catch (error) {
      setErrorMessage("Error signing in. Please try again.");
    }
  };

  // When the user clicks on the upgrade button, open the Stripe subscription page
  const onClickUpgrade = () => {
    try {
      upgrade();
    } catch (error) {
      setErrorMessage("Error upgrading. Please try again.");
    }
  };

  ////////// rendering //////////

  const getOptionsChangeTabButtonDisplay = () => {
    if (status === "notSignedIn") {
      return (
        <OptionsChangeTabButton onClick={() => setActiveTab('apiKey')}>
          I'd rather use my own API key
        </OptionsChangeTabButton>
      )
    } else if (status === "signedInPremium" || status === "signedInFree") {
      return (
        <OptionsChangeTabButton onClick={onClickOptions}>
          Options
        </OptionsChangeTabButton>
      )
    }
  }

  const getBodyDisplay = () => {

    if (status === "notSignedIn") {
      return (
        <Description>
          Hello there!<br/><br/>
          Sign in to start using Metabase Copilot!
        </Description>
      )
    } else if (status === "signedInFree") {
      return (
        <>
          <Description>
            Hello {getUserDisplayName()}!<br/><br/>
            You're <b>all set</b> to use Metabase Copilot. Open Metabase to discover the extension's features!
          </Description>
          <UpgradeExplanation>
            Upgrade to premium to:<br/>
            <ul style={{ marginTop: 8, marginBottom: 8 }}>
              <li>Make unlimited queries</li>
              <li>Have access to the best models (Claude 3.7 Sonnet, o3-mini...)</li>
              <li>Add multiple users to your company with shared settings</li>
            </ul>
            Cost: $15/user/month<br/>
          </UpgradeExplanation>
        </>
      )
    } else if (status === "signedInPremium") {
      return (
        <>
          <Description>
            Hello {getUserDisplayName()}!<br/><br/>
            You're all set, ready to user Metabase Copilot as part of {getCompanyDisplayName()}!<br/><br/>
          </Description>
          <ModelSelector>
            <ModelTitle>Model selection:</ModelTitle>
              <ModelsContainer>
                {models.map((model) => (
                <li key={model.name}>
                  <ModelOption 
                    isSelected={user.modelName === model.name}
                    onClick={async () => {
                      try {
                        await updateModel(model.name);
                      } catch (error) {
                        setErrorMessage("Error updating model. Please try again.");
                      }
                    }}
                  >
                    {model.displayName}{model.isThinkingModel && "*"}
                  </ModelOption>
                </li>
              ))}
            </ModelsContainer>
            <ModelNote>* These "thinking" models can take significantly longer to respond</ModelNote>
          </ModelSelector>
        </>
      )
    }
  }

  const getSignInUpgradeButtonDisplay = () => {
    if (status === "notSignedIn") {
      return (
        <SignInUpgradeButton onClick={onClickSignIn}>
          Sign In with Google
        </SignInUpgradeButton>
      )
    } else if (status === "signedInFree") {
      return (
        <SignInUpgradeButton onClick={onClickUpgrade}>
          Upgrade
        </SignInUpgradeButton>
      )
    } else if (status === "signedInPremium") {
      return (<></>)
    }
  }

  return (
    <Root>

      {/* Top right hand corner: either options or change tab */}
      <OptionsChangeTabButtonContainer>
        {getOptionsChangeTabButtonDisplay()}
      </OptionsChangeTabButtonContainer>

      {/* Body */}
      <BodyContainer>
        {getBodyDisplay()}
        <ErrorMessageContainer>
          <ErrorMessage>{errorMessage}</ErrorMessage>
        </ErrorMessageContainer>
      </BodyContainer>

      {/* Bottom of the page: sign in/upgrade button */}
      <SignInUpgradeButtonContainer>
        {getSignInUpgradeButtonDisplay()}
      </SignInUpgradeButtonContainer>

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
  flex-grow: 1;
  box-sizing: border-box;
`;

// Top right hand corner: either options or change tab

const OptionsChangeTabButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const OptionsChangeTabButton = styled.div`
  font-size: 14px;
  margin: 8px 0;
  cursor: pointer;
  text-decoration: underline;
  font-style: italic;
`;

// Body

const BodyContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 10px;
  flex-grow: 1;
  box-sizing: border-box;
  gap: 12px;
`;

const Description = styled.div`
  font-size: 14px;
  color: var(--black);
  line-height: 20px;
`;

const UpgradeExplanation = styled.div`
  font-size: 13px;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--dark-blue);
  margin-top: 12px;

  ul {
    4px 0px 8px 0px;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }
`;

const ErrorMessageContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  flex-grow: 1;
`;

const ErrorMessage = styled.div`
  font-size: 14px;
  color: red;
`;

// Bottom of the page: sign in/upgrade button

const SignInUpgradeButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  padding-bottom: 20px;
  padding-left: 10px;
  padding-right: 10px;
  box-sizing: border-box;
  margin-top: 6px;
`;

const SignInUpgradeButton = styled.div`
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

const ModelSelector = styled.div`
  width: 100%;
  margin-top: 24px;
`;

const ModelTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
`;

const ModelsContainer = styled.ul`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(3, auto) auto;
  gap: 8px;
  width: 100%;
  list-style-type: disc;
  padding-left: 16px;
  margin: 0;

  li:last-child {
    grid-column: 1 / -1;
    list-style-type: disc;
  }
`;

const ModelOption = styled.div<{ isSelected: boolean }>`
  padding: 4px 0;
  cursor: pointer;
  font-size: 13px;
  font-weight: ${props => props.isSelected ? '800' : '400'};
  color: ${props => props.isSelected ? 'var(--dark-blue)' : 'var(--black)'};
  text-decoration: ${props => props.isSelected ? 'underline' : 'none'};
  transition: all 200ms ease;
`;

const ModelNote = styled.div`
  font-size: 12px;
  color: var(--black);
  font-style: italic;
  margin-top: 24px;
`;

export default SignInTab;
