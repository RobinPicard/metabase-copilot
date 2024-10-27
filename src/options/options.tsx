import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import styled from 'styled-components';

import functions from '../firebase/functions';
import AccountSettingsTab from './tabs/AccountSettingsTab';
import SchemaOptionsTab from './tabs/SchemaOptionsTab';
import BillingTab from './tabs/BillingTab';
import ContactTab from './tabs/ContactTab';
import TermsOfServiceTab from './tabs/TermsOfServiceTab';
import PrivacyPolicyTab from './tabs/PrivacyPolicyTab';
import {
  UserData,
  DatabaseSchemaOptionsData,
  CompanyUser,
  CompanyInvitation,
} from '../types/backendApi'
import { storageKeyOptionsTab } from '../constants/chromeStorage';
import getFirebaseAuthToken from '../chromeMessaging/getFirebaseAuthToken';
import { Payment } from '../types/backendApi';


const Options: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"accountSettings" | "databaseSchema" | "billing" | "contact" | "termsOfService" | "privacyPolicy" | null>(null);
  const [user, setUser] = useState<UserData | null | undefined>(undefined);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[] | null | undefined>(undefined);
  const [companyInvitations, setCompanyInvitations] = useState<CompanyInvitation[] | null | undefined>(undefined);
  const [databaseSchemaOptions, setDatabaseSchemaOptions] = useState<DatabaseSchemaOptionsData | null>(null);
  const [payments, setPayments] = useState<Payment[] | undefined>(undefined);
  const [feedbackMessage, setFeedbackMessage] = useState<[string | null, "error" | "info" | null]>([null, null]);
  const feedbackRef = useRef<HTMLDivElement>(null);

  ////////// hooks //////////

  // Close the error message when clicking outside of it
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

  // Get the user and set the tab to display
  useEffect(() => {
    getUser();
    chrome.storage.local.get([storageKeyOptionsTab], (result) => {
      if (result[storageKeyOptionsTab]) {
        setActiveTab(result[storageKeyOptionsTab] as "accountSettings" | "databaseSchema" | "billing");
      } else {
        setActiveTab("accountSettings");
      }
    });
  }, []);

  ////////// functions //////////

  // Get the user's data from the backend
  const getUser = async () => {
    try {
      const token = await getFirebaseAuthToken();
      const result = await functions.callFunction('api/getUser', token, "GET");
      setUser(result as UserData);
    } catch (error) {
      setUser(null);
      console.error('Error fetching user data:', error);
      setFeedbackMessage(['Could not load user data. Please refresh the page. If the issue persists, reach out to our support.', 'error']);
    }
  }

  ////////// rendering //////////

  const isLoading = user === undefined;
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'accountSettings':
        return <AccountSettingsTab
          user={user}
          setUser={setUser}
          companyUsers={companyUsers}
          setCompanyUsers={setCompanyUsers}
          companyInvitations={companyInvitations}
          setCompanyInvitations={setCompanyInvitations}
          setFeedbackMessage={setFeedbackMessage}
        />;
      case 'databaseSchema':
        return <SchemaOptionsTab
          user={user}
          databaseSchemaOptions={databaseSchemaOptions}
          setDatabaseSchemaOptions={setDatabaseSchemaOptions}
          setFeedbackMessage={setFeedbackMessage}
        />;
      case 'billing':
        return <BillingTab
          user={user}
          payments={payments}
          setPayments={setPayments}
          setFeedbackMessage={setFeedbackMessage}
        />;
      case 'contact':
        return <ContactTab />;
      case 'termsOfService':
        return <TermsOfServiceTab />;
      case 'privacyPolicy':
        return <PrivacyPolicyTab />;
    }
  };

  return (
    isLoading ? <div></div> :
    user === null ? <Description>Settings are only available to logged in users. Sign in through the extension popup page.</Description> :
    <Root>
      <ContentWrapper>
        <TabsContainer>
          <Tab isActive={activeTab === 'accountSettings'} onClick={() => setActiveTab('accountSettings')}>Account Settings</Tab>
          {(!user.company || user.role === 'admin' || user.role === 'developer') && (
            <Tab isActive={activeTab === 'databaseSchema'} onClick={() => setActiveTab('databaseSchema')}>Database Schema</Tab>
          )}
          {user.company && user.role === 'admin' && (
            <Tab isActive={activeTab === 'billing'} onClick={() => setActiveTab('billing')}>Billing</Tab>
          )}
          <Tab isActive={activeTab === 'contact'} onClick={() => setActiveTab('contact')}>Contact</Tab>
          <Tab isActive={activeTab === 'termsOfService'} onClick={() => setActiveTab('termsOfService')}>Terms of Service</Tab>
          <Tab isActive={activeTab === 'privacyPolicy'} onClick={() => setActiveTab('privacyPolicy')}>Privacy Policy</Tab>
        </TabsContainer>
        <TabContentContainer>
          {renderTabContent()}
        </TabContentContainer>
      </ContentWrapper>
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
};


const Root = styled.div`
  min-width: 720px;
  max-width: 720px;
  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  margin: 0 auto;
`;

const Description = styled.div`
  font-size: 14px;
  color: var(--black);
  line-height: 20px;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 680px; // Adjust this value as needed
  display: flex;
  flex-direction: column;
`;

const TabsContainer = styled.div`
  width: 100%;
  height: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 20px 0px;
  gap: 32px;
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: var(--background-blue);
  box-sizing: content-box;
`;

const Tab = styled.div<{ isActive: boolean }>`
  width: fit-content;
  height: 22px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 700;
  font-size: 13px;
  border-bottom: ${({ isActive }) => (isActive ? '2px solid var(--dark-blue)' : 'none')};
  color: ${({ isActive }) => (isActive ? 'var(--dark-blue)' : 'var(--black)')};
`;

const TabContentContainer = styled.div`
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 48px 0px;
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

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
