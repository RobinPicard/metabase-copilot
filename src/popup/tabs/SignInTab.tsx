import React from 'react';
import styled from 'styled-components';

import { UserData } from '../../types/backendApi'
import { storageKeyOptionsTab } from '../../constants/chromeStorage';


interface SignInTabProps {
  user: UserData;
  signIn: () => void;
  upgrade: () => void;
  subscriptionUrl: string;
  setActiveTab: (tab: "signIn" | "apiKey") => void;
  errorMessage: string;
  setErrorMessage: (message: string) => void;
}


const SignInTab: React.FC<SignInTabProps> = ({ user, signIn, upgrade, subscriptionUrl, setActiveTab, errorMessage, setErrorMessage }) => {

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
            Upgrade to have access to all the features of Metabase Copilot!
          </Description>
          <UpgradeExplanation>
            Premium features:<br/>
            <ul>
              <li>Make unlimited queries</li>
              <li>Collaborate with multiple users</li>
              <li>Manage a shared set of database schema settings</li>
            </ul>
            Cost: $10/user/month<br/>
          </UpgradeExplanation>
        </>
      )
    } else if (status === "signedInPremium") {
      return (
        <Description>
          Hello {getUserDisplayName()}!<br/><br/>
          You're all set, ready to user Metabase Copilot as part of {getCompanyDisplayName()}!<br/><br/>
          Open the options page to access the settings.
        </Description>
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


export default SignInTab;
