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

// Add message listener for opening options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openOptionsPage') {
    chrome.runtime.openOptionsPage();
  }
});
