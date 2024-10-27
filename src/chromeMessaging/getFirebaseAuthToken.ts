import { getFirebaseTokenActionName } from "../constants/chromeMessaging";


function getFirebaseAuthToken(): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    chrome.runtime.sendMessage({action: getFirebaseTokenActionName}, (response: any) => {
      if (response?.token) {
        resolve(response.token);
      } else if (response?.error) {
        resolve(null);
      } else {
        resolve(null);
      }
    });
  });
};


export default getFirebaseAuthToken;
