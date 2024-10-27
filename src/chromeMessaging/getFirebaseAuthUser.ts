import { User } from 'firebase/auth';

import { getFirebaseAuthUserActionName } from "../constants/chromeMessaging";


const getFirebaseAuthUser = async (): Promise<User | null> => {
  return new Promise<User | null>((resolve) => {
    chrome.runtime.sendMessage({action: getFirebaseAuthUserActionName}, (response) => {
      if (response.user) {
        resolve(response.user as User);
      }
      else {
        resolve(null);
      }
    });
  });
};


export default getFirebaseAuthUser;
