import { signOutActionName } from '../constants/chromeMessaging';


const authSignOut = async () => {
  await chrome.runtime.sendMessage({action: signOutActionName})
};


export default authSignOut;
