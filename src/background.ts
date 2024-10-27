import auth from './firebase/auth';
import {
  getFirebaseAuthUserActionName,
  getFirebaseTokenActionName,
  firebaseSignInActionName,
  firebaseSignOutActionName,
  openOptionsPageActionName
} from './constants/chromeMessaging';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';


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


//////////////////// firebase authentication ////////////////////

// Add this function to wait for auth to initialize
function waitForAuth(timeout = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve();
    });

    setTimeout(() => {
      unsubscribe();
      reject(new Error('Auth initialization timeout'));
    }, timeout);
  });
}

// Modify the message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Helper function to handle auth-related actions
  const handleAuthAction = async (action: () => Promise<any>) => {
    try {
      await waitForAuth();
      const result = await action();
      sendResponse(result);
    } catch (error) {
      console.error('Auth error:', error);
      sendResponse({ error: "Authentication error" });
    }
  };

  if (message.action === getFirebaseAuthUserActionName) {
    handleAuthAction(async () => {
      const user = auth.currentUser;
      return user ? { user: user.toJSON() } : { error: "User not authenticated hereeeee" };
    });
    return true;
  }
  else if (message.action === getFirebaseTokenActionName) {
    handleAuthAction(async () => {
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken(false);
        return { token: idToken };
      }
      return { error: "User not authenticated" };
    });
    return true;
  }
  else if (message.action === firebaseSignInActionName) {
    handleAuthAction(async () => {
      const user = auth.currentUser;
      if (user) {
        return { user: user.toJSON() };
      }
      return new Promise((resolve) => {
        chrome.identity.getAuthToken({ interactive: true }, async (token) => {
          if (chrome.runtime.lastError || !token) {
            console.error(chrome.runtime.lastError);
            resolve({ error: "Error getting token" });
            return;
          }
          const credential = GoogleAuthProvider.credential(null, token);
          try {
            const userCredential = await signInWithCredential(auth, credential);
            if (userCredential.user) {
              resolve({ user: userCredential.user.toJSON() });
            } else {
              resolve({ error: "Error authenticating user" });
            }
          } catch (error) {
            console.error('Sign in error:', error);
            resolve({ error: "Error during sign in" });
          }
        });
      });
    });
    return true;
  }
  // sign out from firebase
  else if (message.action === firebaseSignOutActionName) {
    auth.signOut().then(() => {
      sendResponse({success: true});
    }).catch((error) => {
      sendResponse({error: "Error signing out"});
    });
  } else if (message.action === openOptionsPageActionName) {
    chrome.runtime.openOptionsPage();
  } 
  return true;
});
