import { openOptionsPageActionName } from "../constants/chromeMessaging";


const openOptionsPage = async () => {
  await chrome.runtime.sendMessage({action: openOptionsPageActionName})
};


export default openOptionsPage;
