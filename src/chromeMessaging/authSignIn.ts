import { signInActionName } from '../constants/chromeMessaging';


const authSignIn = async () => {
  const result = await chrome.runtime.sendMessage({action: signInActionName})
  const token = result.token;
  if (token) {
    return token;
  }
  return null;
};


export default authSignIn;
