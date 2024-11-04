import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import functions from '../../firebase/functions'
import { UserData } from '../../types/backendApi';
import getFirebaseAuthToken from '../../chromeMessaging/getAuthToken'; 
import { Payment } from '../../types/backendApi';


interface Props {
  user: UserData;
  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  setFeedbackMessage: (message: [string, "error" | "info" | null]) => void;
}

const BillingTab: React.FC<Props> = ({user, payments, setPayments, setFeedbackMessage}) => {

  const [subscriptionUrl, setSubscriptionUrl] = useState<string | undefined>(undefined);

  ////////// hooks //////////

  useEffect(() => {
    if (user.company.subscriptionStatus) {
      getPayments();
    }
    getSubscriptionUrl();
  }, []);

  ////////// backend requests //////////

  const getSubscriptionUrl = async () => {
    const token = await getFirebaseAuthToken();
    const result = await functions.callFunction('api/getStripePaymentLink', token, "GET");
    setSubscriptionUrl(result.url);
  }

  const getPayments = async () => {
    const token = await getFirebaseAuthToken();
    const result = await functions.callFunction('api/getPayments?ok=ok', token, "GET");
    setPayments(result as Payment[]);
  }

  ////////// user interactions //////////

  const handleClickStripeSubscribe = async () => {
    try {
      if (subscriptionUrl) {
        window.open(subscriptionUrl, '_blank');
      } else {
        console.error('Subscription URL is undefined');
      }
    } catch (error) {
      console.error('Error opening Stripe subscription page:', error);
      setFeedbackMessage(['Error opening Stripe subscription page, sorry', 'error'])
    }
  }

  const handleClickCancelSubscription = async () => {
    try {
      const token = await getFirebaseAuthToken();
      const result = await functions.callFunction('api/cancelSubscription', token, "POST");
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setFeedbackMessage(['Error canceling subscription, sorry. Please retry and reach out to support if the problem persists', 'error'])
    }
  }

  ////////// rendering //////////

  const getStatusBlock = () => {
    if (!user.company.subscriptionStatus) {
      return (
        <StatusContainer>
          <Description>
            You have <strong>not subscribed</strong> to Metabase Copilot yet.<br/><br/>
            Subscribe to add users to your account and access all features. Billing will automatically adjust based on the number of users.
          </Description>
          {getCost()}
          <ButtonContainer>
            <StripeSubscribeButton onClick={handleClickStripeSubscribe}>
              Subscribe with Stripe
            </StripeSubscribeButton>
          </ButtonContainer>
        </StatusContainer>
      );
    } else if (user.company.subscriptionStatus === 'active' && !user.company.subscriptionCanceledAt) {
      return (
        <StatusContainer>
          <Description>Your subscription is <strong>active</strong>.</Description>
          {getCost()}
          <ButtonContainer>
            <CancelSubscriptionButton onClick={handleClickCancelSubscription}>
              Cancel Subscription
            </CancelSubscriptionButton>
          </ButtonContainer>
        </StatusContainer>
      );
    } else if (user.company.subscriptionStatus === 'active' && user.company.subscriptionCanceledAt) {
      return (
        <StatusContainer>
          <Description>
            Your subscription has been canceled.<br/><br/>
            You can still access all features until {new Date(user.company.subscriptionCanceledAt._seconds * 1000).toISOString().split('T')[0]}.
          </Description>
          {getCost()}
          <ButtonContainer>
            <StripeSubscribeButton onClick={handleClickStripeSubscribe}>
              Subscribe with Stripe
            </StripeSubscribeButton>
          </ButtonContainer>
        </StatusContainer>
      );
    } else if (user.company.subscriptionStatus === 'past_due' || user.company.subscriptionStatus === 'unpaid') {
      return (
        <StatusContainer>
          <Description>
            The last payment of your subscription was unsuccessful. Your account is <strong>temporarily disabled</strong>.<br/><br/>
            Please subscribe to re-enable your account.
          </Description>
          {getCost()}
          <ButtonContainer>
            <StripeSubscribeButton onClick={handleClickStripeSubscribe}>
              Subscribe with Stripe
            </StripeSubscribeButton>
          </ButtonContainer>
        </StatusContainer>
      );
    } else {
      return (
        <StatusContainer>
          <Description>
            Your subscription has been canceled.<br/><br/>
            Subscribe again to access all features.
          </Description>
          {getCost()}
          <ButtonContainer>
            <StripeSubscribeButton onClick={handleClickStripeSubscribe}>
              Subscribe with Stripe
            </StripeSubscribeButton>
          </ButtonContainer>
        </StatusContainer>
      );
    }
  }

  const getCost = () => (
    <CostBlockContainer>
      <CostRow>
        <CostLabel>Price:</CostLabel>
        <CostValue>$15 per user per month</CostValue>
      </CostRow>
      <CostRow>
        <CostLabel>Number of users:</CostLabel>
        <CostValue>{user.company.numberOfUsers}</CostValue>
      </CostRow>
      <CostRow>
        <CostLabel>Total price:</CostLabel>
        <CostValue>${user.company.numberOfUsers * 15}</CostValue>
      </CostRow>
    </CostBlockContainer>
  )

  const getPaymentsTable = () => (
    <PaymentList>
      <PaymentListHeader>
        <span>Date</span>
        <span>Amount</span>
        <span>Status</span>
      </PaymentListHeader>
      {payments
        .sort((a, b) => b.createdAt._seconds - a.createdAt._seconds)
        .map((payment, index) => (
          <PaymentItem key={index}>
            <PaymentDate>{new Date(payment.createdAt._seconds * 1000).toISOString().split('T')[0]}</PaymentDate>
            <PaymentAmount>${payment.amount / 100}</PaymentAmount>
            <PaymentStatus>{payment.status}</PaymentStatus>
          </PaymentItem>
        ))}
    </PaymentList>
  )

  return (
    <Root>
      <Section>
        <SectionTitle>Subscription</SectionTitle>
        <SectionBody>
          {getStatusBlock()}
        </SectionBody>
      </Section>
      {
        payments && payments.length > 0 && (
          <Section>
            <SectionTitle>Payment History</SectionTitle>
            <SectionBody>
              {getPaymentsTable()}
            </SectionBody>
          </Section>
        )
      }
    </Root>
  )
}

////////// styles //////////

const Root = styled.div`
  min-width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 56px;
`;

const Section = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  gap: 16px;
`;

const SectionTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  width: 200px;
`;

const SectionBody = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

// cost block

const StatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Description = styled.div`
  font-size: 14px;
  color: #4c5773;
  line-height: 20px;
`;

const CostBlockContainer = styled.div`
  width: 100%;
  border: 1px solid #509ee3;
  border-radius: 8px;
  padding: 24px;
  box-sizing: border-box;
  background-color: white;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CostRow = styled.div`
  display: flex;
  align-items: center;
`;

const CostLabel = styled.span`
  font-weight: 600;
  width: 240px;
  color: #4c5773;
  font-size: 13px;
`;

const CostValue = styled.span`
  color: #4c5773;
  font-size: 13px;
`;


// subscription link

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const Button = styled.div`
  width: fit-content;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: white;
  border-radius: 6px;
  padding: 10px 16px;
  box-sizing: border-box;
  cursor: pointer;
  transition: 200ms linear;
`;

const StripeSubscribeButton = styled(Button)`
  background-color: #007bff;
  color: white;
  border: 1px solid #509ee3;
  background-color: #509ee3;

  &:hover {
    background-color: #509ee3e0;
  }
`;

const CancelSubscriptionButton = styled(Button)`
  background-color: white;
  color: #931e2a;
  border: 1px solid #931e2a;

  &:hover {
    background-color: #ffebed;
  }
`;

// payment table

const PaymentList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #e7e5e5;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
`;

const PaymentListHeader = styled.div`
  display: grid;
  grid-template-columns: 5fr 4fr 3fr;
  gap: 16px;
  padding: 12px 16px;
  font-weight: bold;
  border-bottom: 1px solid #e7e5e5;
`;

const PaymentItem = styled.div`
  display: grid;
  grid-template-columns: 5fr 4fr 3fr;
  gap: 16px;
  align-items: center;
  padding: 18px 16px;
  border-bottom: 1px solid #e7e5e5;

  &:last-child {
    border-bottom: none;
  }
`;

const PaymentDate = styled.span`
  font-size: 13px;
`;

const PaymentAmount = styled.span`
  font-size: 13px;
`;

const PaymentStatus = styled.span`
  font-size: 13px;
`;


export default BillingTab;
