import { openOptionsPageActionName } from "../constants/chromeMessaging";


const openOptionsPage = (): Promise<string | null> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({action: openOptionsPageActionName}, (response) => {
      resolve(response);
    });
  });
};


export default openOptionsPage;
