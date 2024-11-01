import { getAuthTokenActionName } from "../constants/chromeMessaging";


const getAuthToken = async (): Promise<string | null> => {
  const result = await chrome.runtime.sendMessage({action: getAuthTokenActionName})
  const token = result.token;
  if (token) {
    return token;
  }
  return null;
};


export default getAuthToken;
