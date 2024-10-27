import { firebaseSignInActionName } from '../constants/chromeMessaging';


const firebaseSignIn = async () => {
  const result = await chrome.runtime.sendMessage({action: firebaseSignInActionName})
  const user = result.user;
  if (!user) {
    return null;
  }
  return user;
};


export default firebaseSignIn;
