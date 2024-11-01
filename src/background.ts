import {
  getAuthTokenActionName,
  signInActionName,
  signOutActionName,
  openOptionsPageActionName
} from './constants/chromeMessaging';


type RemoveInfo = {};

type Details = {
  frameId: number;
  tabId: number;
};

// Define a set to keep track of injected tabs
const injectedTabs = new Set<number>();

chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
  // Wait for the page to be completely loaded
  if (changeInfo.status === "complete" && tab.active && tab.url) {  // Ensure tab.url is defined before using it
    // Only consider the page if it has a url pattern of the native query editor of Metabase
    if (
      tab.url.includes("/question")
      && (tab.url.includes("meta") || tab.url.includes("localhost") || tab.url.includes("127.0.0.1"))
    ) {
      // Check if the script has already been injected for this tabId
      if (!injectedTabs.has(tabId)) {
        // If not, inject the script and add tabId to the injectedTabs set
        injectedTabs.add(tabId);
        chrome.scripting.executeScript({
          target: {tabId: tabId, allFrames: true},
          files: ['dist/content.js'],
        });
      }
    }
  }
});

// Remove the tab id from the set when a tab is closed
chrome.tabs.onRemoved.addListener((tabId: number, removeInfo: RemoveInfo) => {
  injectedTabs.delete(tabId);
});

// Remove the tab id from the set when a page is reloaded
chrome.webNavigation.onBeforeNavigate.addListener((details: Details) => {
  if (details.frameId !== 0) {
    return;
  }
  injectedTabs.delete(details.tabId);
});


//////////////////// authentication ////////////////////


// Modify the message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === getAuthTokenActionName) {
    chrome.identity.getAuthToken({ interactive: false }, async (token) => {
      if (token) {
        sendResponse({token: token});
      } else {
        sendResponse({});
      }
    });
    return true;
  }
  else if (message.action === signInActionName) {
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (token) {
        sendResponse({token: token});
      } else {
        sendResponse({});
      }
    });
    return true;
  }
  else if (message.action === signOutActionName) {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      console.log("signOutActionName, token", token);
      if (chrome.runtime.lastError || !token) {
        sendResponse({});
        return;
      }
      const revokeUrl = `https://accounts.google.com/o/oauth2/revoke?token=${token}`;
      fetch(revokeUrl)
        .then(() => {
          chrome.identity.removeCachedAuthToken({ token }, () => {
            console.log("signOutActionName, removed token");
            sendResponse({});
          });
        })
        .catch(error => {
          console.error('Error revoking token:', error);
          sendResponse({});
        });
    });
    return true;
  }
  else if (message.action === openOptionsPageActionName) {
    chrome.runtime.openOptionsPage();
  } 
});
