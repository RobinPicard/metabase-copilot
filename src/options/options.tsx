import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import styled from 'styled-components';

import './options.css';
import SchemaOptionsTab from './tabs/SchemaOptionsTab';
import ContactTab from './tabs/ContactTab';
import PrivacyPolicyTab from './tabs/PrivacyPolicyTab';


const Options: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"databaseSchema" | "contact" | "privacyPolicy">("databaseSchema");

  ////////// rendering //////////
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'databaseSchema':
        return <SchemaOptionsTab/>;
      case 'contact':
        return <ContactTab />;
      case 'privacyPolicy':
        return <PrivacyPolicyTab />;
    }
  };

  return (
    <Root>
      <ContentWrapper>
        <TabsContainer>
          <Tab isActive={activeTab === 'databaseSchema'} onClick={() => setActiveTab('databaseSchema')}>Database Schema</Tab>
          <Tab isActive={activeTab === 'contact'} onClick={() => setActiveTab('contact')}>Contact</Tab>
          <Tab isActive={activeTab === 'privacyPolicy'} onClick={() => setActiveTab('privacyPolicy')}>Privacy Policy</Tab>
        </TabsContainer>
        <TabContentContainer>
          {renderTabContent()}
        </TabContentContainer>
      </ContentWrapper>
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

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 680px;
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

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
