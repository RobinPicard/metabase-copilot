import { firebaseSignOutActionName } from '../constants/chromeMessaging';


const firebaseSignOut = async () => {
  const result = await chrome.runtime.sendMessage({action: firebaseSignOutActionName})
  return result;
};


export default firebaseSignOut;
