import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import styled from 'styled-components';

import icon512 from '../../assets/icon512.png';
import {
  storageKeyLocalConfig,
  storageKeyLocalConfigOld
} from '../constants/chromeStorage';
import functions from '../firebase/functions';
import ApiKeyTab from './tabs/ApiKeyTab';
import SignInTab from './tabs/SignInTab';
import LoadingAnimation from './tabs/LoadingAnimation';
import { ConfigDict } from '../types/chromeStorage'
import { UserData } from '../types/backendApi'
import { AuthUser } from '../types/firebase'
import getFirebaseAuthToken from '../chromeMessaging/getFirebaseAuthToken';
import getFirebaseAuthUser from '../chromeMessaging/getFirebaseAuthUser';
import firebaseSignIn from '../chromeMessaging/firebaseSignIn';

const Popup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"signIn" | "apiKey" | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [configDict, setConfigDict] = useState<ConfigDict | null>(null);
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  ////////// hooks //////////

  // Start by getting the user's auth state
  useEffect(() => {
    setIsLoading(true);
    getFirebaseAuthUser()
      .then((authUser) => {
        if (authUser) {
          setAuthUser(authUser);
          getUser();
        } else {
          setAuthUser(null);
          setUser(null);
          getConfigDict();
        }
      })
      .catch((error) => {
        console.error('Error fetching auth user:', error);
        setIsLoading(false);
      });
  }, []);

  // Each time the configDict changes, update the storage
  useEffect(() => {
    if (configDict) {
      chrome.storage.local.set({ [storageKeyLocalConfig]: configDict });
    }
  }, [configDict]);

  // Set the active tab each time the authUser or configDict changes
  useEffect(() => {
    if (authUser) {
      setActiveTab('signIn');
    } else if (configDict?.key || configDict?.modelName) {
      setActiveTab('apiKey');
    } else {
      setActiveTab('signIn');
    }
  }, [authUser, user, configDict]);

  // If there's a logged in user that does not have a company, get the subscription url
  useEffect(() => {
    if (user && !user.company) {
      getSubscriptionUrl();
    }
  }, [user]);

  ////////// functions //////////

  // Get the user's data from the backend
  const getUser = async (idToken: string=null) => {
    try {
      let token = idToken;
      if (!idToken) {
        const tokenResponse = await getFirebaseAuthToken();
        token = tokenResponse;
      }
      const result = await functions.callFunction('api/getUser', token, "GET");
      const userData = result as UserData;
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
    setIsLoading(false);
  }

  // Get the config dict from the local storage
  const getConfigDict = async () => {
    chrome.storage.local.get([storageKeyLocalConfig, storageKeyLocalConfigOld], (result) => {
      const configDict = result[storageKeyLocalConfig] || result[storageKeyLocalConfigOld] || {};
      setConfigDict(configDict);
      if (result[storageKeyLocalConfigOld]) {
        chrome.storage.local.remove(storageKeyLocalConfigOld);
      }
    });
    setIsLoading(false);
  }

  // Get the user's subscription url from the backend
  const getSubscriptionUrl = async () => {
    const token = await getFirebaseAuthToken();
    const result = await functions.callFunction('api/getStripePaymentLink', token, "GET");
    setSubscriptionUrl(result.url);
  }

  ////////// user-triggered actions //////////

  // When the user clicks on the sign in button
  const signIn = async () => {
    setIsLoading(true);
    try {
      const authUser = await firebaseSignIn();
      setAuthUser(authUser);
      getUser();
    } catch (error) {
      setIsLoading(false);
      console.error('Error signing in:', error);
      setErrorMessage('Could not sign in. Please refresh the page. If the issue persists, reach out to our support.');
    }
  };

  // When the user clicks on the upgrade button
  const upgrade = async () => {
    try {
      if (subscriptionUrl) {
        window.open(subscriptionUrl, '_blank');
      } else {
        console.error('Subscription URL is undefined');
      }
    } catch (error) {
      console.error('Error opening Stripe subscription page:', error);
    }
  };

  ////////// rendering //////////
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'apiKey':
        return <ApiKeyTab
          configDict={configDict}
          setConfigDict={setConfigDict}
          setActiveTab={setActiveTab}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />;
      case 'signIn':
        return <SignInTab
          user={user}
          signIn={signIn}
          upgrade={upgrade}
          subscriptionUrl={subscriptionUrl}
          setActiveTab={setActiveTab}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />;
    }
  };

  return (
    <Root>
      <Header>
        <HeaderIcon src={icon512} alt="Header Icon" />
        <HeaderTitle>Metabase Copilot</HeaderTitle>
      </Header>
      <TabContentContainer>
        {isLoading ? <LoadingAnimation /> : renderTabContent()}
      </TabContentContainer>
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

const TabContentContainer = styled.div`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px 10px;
  flex-grow: 1;
`;


const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
