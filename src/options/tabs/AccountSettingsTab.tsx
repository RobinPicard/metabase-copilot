import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import getFirebaseAuthToken from '../../chromeMessaging/getAuthToken';
import firebaseSignOut from '../../chromeMessaging/authSignOut';
import functions from '../../firebase/functions'
import { UserData, CompanyUser, CompanyInvitation } from '../../types/backendApi';


interface Props {
  user: UserData;
  setUser: (user: UserData) => void;
  companyUsers: CompanyUser[];
  setCompanyUsers: (users: CompanyUser[]) => void;
  companyInvitations: CompanyInvitation[];
  setCompanyInvitations: (invitations: CompanyInvitation[]) => void;
  setFeedbackMessage: (message: [string, "error" | "info" | null]) => void;
}

const roles = {
  user: "Regular user",
  admin: "Admin",
  developer: "Developer"
}


const AccountSettingsTab: React.FC<Props> = ({
  user, setUser, companyUsers, setCompanyUsers, companyInvitations, setCompanyInvitations, setFeedbackMessage
}) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | undefined>(undefined);
  const [clickedCreateCompany, setClickedCreateCompany] = useState(false);
  const [showRemoveUserConfirmation, setShowRemoveUserConfirmation] = useState(false);
  const [userToRemove, setUserToRemove] = useState<CompanyUser | null>(null);

  ////////// hooks //////////

  // If the user has a company, get the company users/invitations; otherwise get the subscription url
  useEffect(() => {
    if (user.company) {
      if (user.role === 'admin') {
        getCompanyUsers();
        getCompanyInvitations();
      }
    } else {
      getSubscriptionUrl();
    }
  }, [user]);

  ////////// backend requests //////////

  // Get the user's company users from the backend
  const getCompanyUsers = async () => {
    try {
      const token = await getFirebaseAuthToken();
      const result = await functions.callFunction('api/getUsersCompany', token, "GET");
      setCompanyUsers(result as CompanyUser[]);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setFeedbackMessage(['Could not load company users. Please refresh the page. If the issue persists, reach out to our support.', 'error']);
    }
  }

  // Get the user's company invitations from the backend
  const getCompanyInvitations = async () => {
    try {
      const token = await getFirebaseAuthToken();
      const result = await functions.callFunction('api/getInvitationsCompany', token, "GET");
      setCompanyInvitations(result as CompanyInvitation[]);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setFeedbackMessage(['Could not load company invitations. Please refresh the page. If the issue persists, reach out to our support.', 'error']);
    }
  }

  // Get the user's subscription url from the backend
  const getSubscriptionUrl = async () => {
    try {
      const token = await getFirebaseAuthToken();
      const result = await functions.callFunction('api/getStripePaymentLink', token, "GET");
      setSubscriptionUrl(result.url);
    } catch (error) {
      console.error('Error fetching subscription URL:', error);
      setFeedbackMessage(['Could not load the Stripe subscription url. Please refresh the page. If the issue persists, reach out to our support.', 'error']);
    }
  }

  ////////// functions //////////

  const getCompanyNameDisplay = () => {
    if (user.company) {
      return user.company.name.split('.')[0];
    }
    return "";
  }

  const removeCompanyUser = async () => {
    try {
      const token = await getFirebaseAuthToken();
      await functions.callFunction('api/removeUserCompany', token, "POST", { userId: userToRemove.id });
      if (userToRemove.id === user.id) {
        window.location.reload();
      } else {
        const updatedUsers = companyUsers.filter(companyUser => companyUser.id !== userToRemove.id);
        setCompanyUsers(updatedUsers);
      }
      setShowRemoveUserConfirmation(false);
      setUserToRemove(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      setFeedbackMessage(['Could not remove the user. Please refresh the page. If the issue persists, reach out to our support.', 'error']);
    }
  };

  ////////// user interactions //////////

  // When the user clicks the upgrade button, open the Stripe subscription page
  const handleCreateCompany = async () => {
    try {
      if (subscriptionUrl) {
        setClickedCreateCompany(true);
        window.open(subscriptionUrl, '_blank');
      } else {
        setTimeout(() => {
          if (subscriptionUrl) {
            setClickedCreateCompany(true);
            window.open(subscriptionUrl, '_blank');
          } else {
            console.error('Subscription URL is still undefined after 1 second');
            setFeedbackMessage(['Could not open the Stripe subscription page. Please refresh the page. If the issue persists, reach out to our support.', 'error']);
          }
        }, 1000);
        }
    } catch (error) {
      console.error('Error opening Stripe subscription page:', error);
      setFeedbackMessage(['Could not open the Stripe subscription page. Please refresh the page. If the issue persists, reach out to our support.', 'error']);
    }
  };

  // When the user clicks on the sign out button, sign out of Firebase
  const handleSignOut = async () => {
    await firebaseSignOut();
    setUser(null);
  };

  // When the user changes the role of a company user, update the role in the backend and in the local state
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const token = await getFirebaseAuthToken();
      await functions.callFunction('api/updateUserCompany', token, "POST", { id: userId, role: newRole });
      const updatedUsers = companyUsers.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      );
      setCompanyUsers(updatedUsers);
    } catch (error) {
      console.error('Error updating user role:', error);
      setFeedbackMessage(['Could not update the user role. Please refresh the page. If the issue persists, reach out to our support.', 'error']);
    }
  };

  // When the user removes a company user, remove the user from the backend and update the local state
  const handleClickRemoveCompanyUser = async (user: CompanyUser) => {
    setUserToRemove(user);
    setShowRemoveUserConfirmation(true);
  };

  // When the user removes a company invitation, remove the invitation from the backend and update the local state
  const handleRemoveCompanyInvitation = async (email: string) => {
    try {
      const token = await getFirebaseAuthToken();
      await functions.callFunction('api/removeInvitationCompany', token, "POST", {email: email});
      const updatedInvitations = companyInvitations.filter(invitation => invitation.email !== email);
      setCompanyInvitations(updatedInvitations);
    } catch (error) {
      console.error('Error deleting user:', error);
      setFeedbackMessage(['Could not remove the invitation. Please refresh the page. If the issue persists, reach out to our support.', 'error']);
    }
  };

  // When the user adds a new company user or invitation, add the user/invitation to the backend and update the local state
  const handleAddUser = async () => {
    try {
      const token = await getFirebaseAuthToken();
      const newRecord = await functions.callFunction('api/InviteUser', token, "POST", { email: newUserEmail, role: newUserRole });
      // If the user already had an account, it's directly added to the company users
      if (newRecord.id) {
        const updatedCompanyUsers = companyUsers ? [...companyUsers, newRecord] : [newRecord];
        setCompanyUsers(updatedCompanyUsers);
      // If the user didn't have an account, it's added to the company invitations
      } else {
        const updatedCompanyInvitations = companyInvitations ? [...companyInvitations, newRecord] : [newRecord];
        setCompanyInvitations(updatedCompanyInvitations);
      }
      setNewUserEmail('');
      setNewUserRole('user');
    } catch (error) {
      console.error('Error adding user:', error);
      if (error.message) {
        setFeedbackMessage([error.message, 'error']);
      } else {
        setFeedbackMessage(['Could not invite the user. Please refresh the page. If the issue persists, reach out to our support.', 'error']);
      }
    }
  };

  ////////// rendering //////////

  const renderUserSection = () => {
    return (
      <UserProfileWrapper>
        <UserProfileContainer>
          <UserProfileInfo>
            <UserProfileRow>
              <UserProfileLabel>Email:</UserProfileLabel>
              <UserProfileValue>{user.email}</UserProfileValue>
            </UserProfileRow>
            <UserProfileRow>
              <UserProfileLabel>Name:</UserProfileLabel>
              <UserProfileValue>{user.name}</UserProfileValue>
            </UserProfileRow>
            {user.company && (
              <UserProfileRow>
                <UserProfileLabel>Company:</UserProfileLabel>
                <UserProfileValue>{getCompanyNameDisplay()}</UserProfileValue>
              </UserProfileRow>
            )}
            {user.company && (
              <UserProfileRow>
                <UserProfileLabel>Role:</UserProfileLabel>
                <UserProfileValue>{roles[user.role]}</UserProfileValue>
              </UserProfileRow>
            )}
          </UserProfileInfo>
        </UserProfileContainer>
        <Button onClick={handleSignOut}>Sign Out</Button>
      </UserProfileWrapper>
    )
  }

  const renderCompanySection = () => {
    if (!user.company) {
      return renderCompanyCreationSection();
    }
    if (companyUsers === undefined || companyInvitations === undefined) {
      return <div></div>;
    }
    else {
      return renderCompanyUsersSection();
    }
  }

  const renderCompanyCreationSection = () => {
    return (
      clickedCreateCompany ? (
        <CreateCompanyCost>
          Refresh the page after you're done subscribing with Stripe
        </CreateCompanyCost>
      ) : (
        <CreateCompanyContainer>
          <Button onClick={handleCreateCompany}>
            Upgrade account
          </Button>
          <CreateCompanyCost>
            Premium features:<br/>
            - make unlimited queries<br/>
            - collaborate with multiple users<br/>
            - manage a shared set of database schema settings<br/><br/>
            Cost: $15/user/month<br/>
          </CreateCompanyCost>
        </CreateCompanyContainer>
      )
    );
  };

  const renderCompanyUsersSection = () => {
    return (
      <>
        <SubTitle>Add a New User</SubTitle>
        <AddUserCard>
          <AddUserSection>
            <NewUserInput
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="New user email"
            />
            <NewUserRoleSelect
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
            >
              {Object.entries(roles).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </NewUserRoleSelect>
            <Button onClick={handleAddUser} disabled={!newUserEmail.trim()}>
              Add User
            </Button>
          </AddUserSection>
        </AddUserCard>

        <SubTitle>Current Users</SubTitle>
        <UserList>
          <UserListHeader>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span></span>
          </UserListHeader>
          {companyUsers?.map(user => (
            <UserItem key={user.id}>
              <UserEmail>{user.email}</UserEmail>
              <UserRoleCell>
                <UserRoleSelect
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                >
                  {Object.entries(roles).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </UserRoleSelect>
              </UserRoleCell>
              <UserStatus>Active</UserStatus>
              <DeleteButtonContainer>
                <DeleteButton onClick={() => handleClickRemoveCompanyUser(user)}>Remove</DeleteButton>
              </DeleteButtonContainer>
            </UserItem>
          ))}
          {companyInvitations?.map(invitation => (
            <UserItem key={invitation.email}>
              <UserEmail>{invitation.email}</UserEmail>
              <UserRole>{roles[invitation.role]}</UserRole>
              <UserStatus>Invited</UserStatus>
              <DeleteButtonContainer>
                <DeleteButton onClick={() => handleRemoveCompanyInvitation(invitation.email)}>Remove</DeleteButton>
              </DeleteButtonContainer>
            </UserItem>
          ))}
        </UserList>

        {showRemoveUserConfirmation && userToRemove && (
          <ConfirmationModal>
            <ModalContent>
              <ModalMessage>{`Are you sure you want to remove ${userToRemove.email} from your company?`}</ModalMessage>
              <ModalButtonContainer>
                <CancelButton onClick={() => {
                  setShowRemoveUserConfirmation(false);
                  setUserToRemove(null);
                }}>
                  Cancel
                </CancelButton>
                <ConfirmButton onClick={() => removeCompanyUser()}>
                  Confirm
                </ConfirmButton>
              </ModalButtonContainer>
            </ModalContent>
          </ConfirmationModal>
        )}
      </>
    )
  }

  return (
    <Root>

      {(user.role === 'admin' || !user.company) && (
        <Section>
          <SectionTitle>Company</SectionTitle>
          <SectionBody>
            {renderCompanySection()}
          </SectionBody>
        </Section>
      )}

      <Section>
        <SectionTitle>User Profile</SectionTitle>
        <SectionBody>
          {renderUserSection()}
        </SectionBody>
      </Section>

    </Root>
  );
}

////////// styles //////////

const Root = styled.div`
  min-width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 48px;
`;

const Button = styled.div<{ disabled?: boolean }>`
  width: fit-content;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background-color: #509ee3;
  border-radius: 6px;
  padding: 10px 16px;
  box-sizing: border-box;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: 200ms linear;

  &:hover {
    background-color: ${props => props.disabled ? '#509ee3' : '#509ee3e0'};
  }
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

//

const CreateCompanyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CreateCompanyCost = styled.div`
  font-size: 14px;
  background-color: #cce6ff21;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ebf3ff;
`;

// user profile

const UserProfileWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
`;

const UserProfileContainer = styled.div`
  width: 100%;
  border: 1px solid #509ee3;
  border-radius: 8px;
  padding: 24px;
  box-sizing: border-box;
  margin-bottom: 16px;
  background-color: white;
`;

const UserProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const UserProfileRow = styled.div`
  display: flex;
  align-items: center;
`;

const UserProfileLabel = styled.span`
  font-weight: 600;
  width: 120px;
  color: #4c5773;
  font-size: 13px;
`;

const UserProfileValue = styled.span`
  color: #4c5773;
  font-size: 13px;
`;

//

const AddUserSection = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  align-items: center;
`;

const UserList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #e7e5e5;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
`;

const UserListHeader = styled.div`
  display: grid;
  grid-template-columns: 30fr 17fr 5fr 10fr;
  gap: 16px;
  padding: 12px 16px;
  font-weight: bold;
  border-bottom: 1px solid #e7e5e5;
`;

const UserItem = styled.div`
  display: grid;
  grid-template-columns: 30fr 17fr 5fr 10fr;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e7e5e5;

  &:last-child {
    border-bottom: none;
  }
`;

const UserEmail = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
`;

const UserRoleSelect = styled.select`
  padding: 6px 28px 6px 8px; // Increased right padding for arrow
  border-radius: 4px;
  border: 1px solid #d0d0d0;
  width: auto;
  min-width: 110px;
  max-width: 100%; // Ensure it doesn't overflow its container
  appearance: none;
  background-image: url('data:image/svg+xml;utf8,<svg fill="%23000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>');
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  cursor: pointer;
`;

const UserRoleCell = styled.div`
  display: flex;
  justify-content: flex-start;
`;

const DeleteButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const DeleteButton = styled(Button)`
  padding: 6px 12px;
  font-size: 12px;
  background-color: white;
  color: #931e2a;
  border: 1px solid #931e2a;

  &:hover {
    background-color: #ffebed;
  }
`;

const UserStatus = styled.span`
  text-transform: capitalize;
  font-style: italic;
`;

const UserRole = styled.span`
  font-size: 13px;
`;

const AddUserCard = styled.div`
  background-color: white;
  border: 1px solid #eeecec;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 12px;
`;

const SubTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  margin-top: 4px;
`;

const NewUserInput = styled.input`
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #e7e5e5;
  flex-grow: 1;
  outline: none;

  &:focus {
    outline: solid #509ee3;
  }
`;

const NewUserRoleSelect = styled(UserRoleSelect)`
  width: 120px;
  cursor: pointer;
`;

// Remove user confirmation popup

const ConfirmationModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
`;

const ModalMessage = styled.p`
  margin-bottom: 20px;
  font-size: 16px;
  line-height: 1.5;
`;

const ModalButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const ModalButton = styled(Button)`
  padding: 8px 16px;
  font-size: 14px;
`;

const ConfirmButton = styled(ModalButton)`
  background-color: #931e2a;

  &:hover {
    background-color: #b32e3a;
  }
`;

const CancelButton = styled(ModalButton)`
  background-color: #e7e5e5;
  color: #4c5773;

  &:hover {
    background-color: #eeecec;
  }
`;

export default AccountSettingsTab;
