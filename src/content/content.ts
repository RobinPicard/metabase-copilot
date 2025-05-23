import promptQueryButtonElement from '../components/promptQueryButtonElement'
import promptQueryPopupElement from '../components/promptQueryPopupElement'
import revertQueryButtonElement from '../components/revertQueryButtonElement'
import updateQueryContainerElement from '../components/updateQueryContainerElement'
import updateSchemaExtractionElement from '../components/updateSchemaExtractionElement'
import databaseErrorExplainButtonElement from '../components/databaseErrorExplainButtonElement'
import databaseErrorFixButtonElement from '../components/databaseErrorFixButtonElement'
import databaseErrorPopupElement from '../components/databaseErrorPopupElement'
import feedbackMessageElement from '../components/feedbackMessageElement'

import pasteTextIntoElement from '../utils/pasteTextIntoElement'
import deleteTextInputElement from '../utils/deleteTextInputElement'
import getComponentIdFromVariable from '../utils/getComponentIdFromVariable'

import backendStreamingRequest from '../functions/backendStreamingRequest'
import chatgptStreamingRequest from '../functions/chatgptStreamingRequest'
import {
  createPromptQueryMessages,
  createDatabaseErrorExplainPromptMessages,
  createDatabaseErrorFixPromptMessages
} from '../functions/chatgptInputMessages'
import getRawDatabaseSchema from '../functions/getRawDatabaseSchema'
import getFormattedDatabaseSchema from '../functions/getFormattedDatabaseSchema'
import getMetabaseVersion from '../functions/getMetabaseVersion'

import getEditorOpenedElement from '../page_elements/getEditorOpenedElement'
import getErrorWarningElement from '../page_elements/getErrorWarningElement'
import getQueryEditorTextarea from '../page_elements/getQueryEditorTextarea'
import getVisualizationRootElement from '../page_elements/getVisualizationRootElement'
import getEditorTopBar from '../page_elements/getEditorTopBar'

import { ConfigDict } from '../types/chromeStorage'
import { UserData } from '../types/backendApi'

import functions from '../firebase/functions'

import { storageKeyOptionsTab } from '../constants/chromeStorage'

import openOptionsPage from '../chromeMessaging/openOptionsPage'
import getAuthToken from '../chromeMessaging/getAuthToken'

import { storageKeyLocalConfig } from '../constants/chromeStorage'

import { cleanupPopup } from '../components/promptQueryPopupElement'


////////////// global variables //////////////


let configDict: ConfigDict = {};
let user: UserData | null = null;

// store
let storeQueryContent: string | undefined = undefined;
let storeQueryError: string | undefined = undefined;
let storeDatabaseSelected: number | undefined = undefined;

// others
let isContentScriptLoaded: boolean = false;
let version: [number, number] = [50, 13]
let previousQueryContents: string[] = [];
let isOperationRunning: boolean = false;
let promptQueryPopupPosition: { left: number; top: number } | null = null;


////////////// metabase redux store state's variables and listener //////////////
  

// Function to set a listener for store updates
function setStoreListener(): void {

  // Listen for messages from the script about updates of the store states
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.source !== window || !event.data.type) {
      return;
    }
    if (event.data.type === 'METABASE_CHATGPT_QUERY_CONTENT_STATE') {
      storeQueryContent = event.data.payload;
    }
    if (event.data.type === 'METABASE_CHATGPT_QUERY_ERROR_STATE') {
      storeQueryError = event.data.payload;
    }
    if (event.data.type === 'METABASE_CHATGPT_DATABASE_SELECTED_STATE') {
      storeDatabaseSelected = event.data.payload;
    }
  });

  // Inject the script
  const injectedScriptStoreUpdates = document.createElement('script');
  injectedScriptStoreUpdates.src = chrome.runtime.getURL('dist/injectedScriptStoreUpdates.js');
  document.head?.appendChild(injectedScriptStoreUpdates);
}


////////////// insert elements + add listeners to buttons //////////////


function setupElements() {

  console.log("setupElements");

  function onElementAddedOrRemoved() {
    setupQueryEditingElements();
    setupErrorExplainElements();
    setupErrorFixElements();
  }

  function setupQueryEditingElements() {
    const editorOpenedElement = getEditorOpenedElement(version);
    var existingUpdateQueryContainerElement = document.getElementById(getComponentIdFromVariable({updateQueryContainerElement}))
    if (!existingUpdateQueryContainerElement && !editorOpenedElement) {
      return
    }
    if (existingUpdateQueryContainerElement && editorOpenedElement) {
      return
    }
    if (existingUpdateQueryContainerElement && !editorOpenedElement) {
      existingUpdateQueryContainerElement.remove();
      return
    }
    if (!existingUpdateQueryContainerElement && editorOpenedElement) {
      const editorTopBar = getEditorTopBar(version)
      updateQueryContainerElement.appendChild(revertQueryButtonElement);
      updateQueryContainerElement.appendChild(promptQueryButtonElement);
      if (!user || !user.role || user.role === "admin" || user.role === "developer") {
        updateQueryContainerElement.appendChild(updateSchemaExtractionElement);
        updateSchemaExtractionElement.setAttribute("schema_extracted_at", configDict?.schemaExtractedAt);
      }
      editorTopBar.insertBefore(updateQueryContainerElement, editorTopBar.firstChild);
    }
  }

  function setupErrorExplainElements() {
    const errorWarningElement = getErrorWarningElement(version);
    var existingDatabaseErrorExplainButtonElement = document.getElementById(getComponentIdFromVariable({databaseErrorExplainButtonElement}));
    if (!errorWarningElement && !existingDatabaseErrorExplainButtonElement) {
      return
    }
    if (errorWarningElement && existingDatabaseErrorExplainButtonElement) {
      return
    }
    if (!errorWarningElement && existingDatabaseErrorExplainButtonElement) {
      existingDatabaseErrorExplainButtonElement.remove();
      const existingdatabaseErrorPopupElement = document.getElementById(getComponentIdFromVariable({databaseErrorPopupElement}));
      if (existingdatabaseErrorPopupElement) {
        existingdatabaseErrorPopupElement.remove()
      }
      return
    }
    if (errorWarningElement && !existingDatabaseErrorExplainButtonElement) {
      const visualizationRootElement = getVisualizationRootElement(version);
      visualizationRootElement.appendChild(databaseErrorExplainButtonElement);
    }
  }

  function setupErrorFixElements() {
    const errorWarningElement = getErrorWarningElement(version);
    var existingDatabaseErrorFixButtonElement = document.getElementById(getComponentIdFromVariable({databaseErrorFixButtonElement}));
    if (!errorWarningElement && !existingDatabaseErrorFixButtonElement) {
      return
    }
    if (errorWarningElement && existingDatabaseErrorFixButtonElement) {
      return
    }
    if (!errorWarningElement && existingDatabaseErrorFixButtonElement) {
      existingDatabaseErrorFixButtonElement.remove();
      const existingdatabaseErrorPopupElement = document.getElementById(getComponentIdFromVariable({databaseErrorPopupElement}));
      if (existingdatabaseErrorPopupElement) {
        existingdatabaseErrorPopupElement.remove()
      }
      return
    }
    if (errorWarningElement && !existingDatabaseErrorFixButtonElement) {
      const visualizationRootElement = getVisualizationRootElement(version);
      visualizationRootElement.appendChild(databaseErrorFixButtonElement);
    }
  }

  // Add the listeners to the elements
  promptQueryButtonElement.addEventListener('click', function(event) {
    mainPromptQuery()
  });
  updateSchemaExtractionElement.addEventListener('click', function(event) {
    event.stopPropagation();
    onClickUpdateDatabasesSchema()
  })
  revertQueryButtonElement.addEventListener('click', function(event) {
    mainRevertQuery()
  });
  databaseErrorExplainButtonElement.addEventListener('click', function(event) {
    event.stopPropagation();
    mainDatabaseErrorExplain();
  });
  databaseErrorFixButtonElement.addEventListener('click', function(event) {
    event.stopPropagation();
    mainDatabaseErrorFix();
  });
  document.addEventListener('click', (event: MouseEvent) => {
    const existingFeedbackMessageElement = document.getElementById(getComponentIdFromVariable({feedbackMessageElement}));
    if (existingFeedbackMessageElement && !existingFeedbackMessageElement.contains(event.target as Node)) {
      existingFeedbackMessageElement.remove();
    }
  });
  document.addEventListener('keydown', handleShortcut);

  // Shortcut listener
  function handleShortcut(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'p') {
      event.preventDefault();
      mainPromptQuery();
    } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'e') {
      event.preventDefault();
      mainDatabaseErrorExplain();
    } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'f') {
      event.preventDefault();
      mainDatabaseErrorFix();
    }
  }

  // Setup the DOM change observer
  const observer = new MutationObserver(onElementAddedOrRemoved);
  const targetElement = document.body;
  const config = {
    childList: true,
    subtree: true,
  };
  observer.observe(targetElement, config);

  onElementAddedOrRemoved();
} 


////////////// Query-edition functions //////////////

function mainPromptQuery() {
  console.log("mainPromptQuery called");

  if (isOperationRunning) {
    console.log("Operation running, aborting");
    return;
  }

  // If popup is already open, close it and return
  const existingPopup = document.getElementById(getComponentIdFromVariable({promptQueryPopupElement}));
  if (existingPopup) {
    console.log("Popup already exists, closing it");
    cleanupPopup();
    return;
  }

  // Get latest configDict to ensure we have the most recent position
  chrome.storage.local.get([storageKeyLocalConfig], function(result) {
    const latestConfigDict = result[storageKeyLocalConfig] || {};
    const savedPosition = latestConfigDict.popupPosition;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = 350; // Width from CSS
    const popupHeight = 150; // Height from CSS
    
    let left: number;
    let top: number;

    if (savedPosition && typeof savedPosition.left === 'number' && typeof savedPosition.top === 'number') {
      console.log("Restoring saved position", savedPosition);
      // Ensure the popup stays within viewport bounds
      left = Math.min(Math.max(0, savedPosition.left), viewportWidth - popupWidth);
      top = Math.min(Math.max(0, savedPosition.top), viewportHeight - popupHeight);
      console.log("Adjusted position for viewport", { left, top });
    } else {
      // Position below the button if no saved position
      const button = document.getElementById(getComponentIdFromVariable({promptQueryButtonElement}));
      if (button) {
        const buttonRect = button.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        left = buttonRect.left + scrollX + (buttonRect.width / 2) - (popupWidth / 2);
        top = buttonRect.bottom + scrollY + 14;
        
        // Ensure default position stays within viewport bounds
        left = Math.min(Math.max(0, left), viewportWidth - popupWidth);
        top = Math.min(Math.max(0, top), viewportHeight - popupHeight);
        console.log("Setting default position", { left, top });
      } else {
        console.log("Prompt button not found, using center position");
        left = (viewportWidth - popupWidth) / 2;
        top = (viewportHeight - popupHeight) / 2;
      }
    }

    promptQueryPopupElement.style.left = `${left}px`;
    promptQueryPopupElement.style.top = `${top}px`;
    promptQueryPopupElement.style.transform = 'none';

    document.body.appendChild(promptQueryPopupElement);
    console.log("Popup appended to body");
    
    promptQueryPopupElement.focus();
    promptQueryPopupElement.addEventListener('keypress', onPressEnterInsideElement);
  });

  // Handle enter key inside the popup
  function onPressEnterInsideElement(event: KeyboardEvent) : void {
    if (event.key === 'Enter' && !event.shiftKey && !isOperationRunning) {
      event.preventDefault();
      isOperationRunning = true;
      pushPreviousQueryContent();
      const textarea = promptQueryPopupElement.querySelector('textarea');
      if (user) {
        const payload = {
          userPrompt: textarea.value,
          existingQuery: storeQueryContent,
          databaseId: storeDatabaseSelected,
        }
        backendStreamingRequest('api/writeQuery', payload, onApiResponseData, onApiRequestError);
      } else if (configDict.status === 'valid') {
        const promptMessages = createPromptQueryMessages(
          storeQueryContent,
          textarea.value,
          configDict.schema[storeDatabaseSelected]
        );
        chatgptStreamingRequest(configDict, promptMessages, onApiResponseData, onApiRequestError);
      } else if (configDict.status === 'error' || configDict.status === 'invalid') {
        onApiRequestError("Your API key is invalid. Please enter a valid API key in the extension popup or sign in.");
      } else {
        onApiRequestError("Sign in with the extension popup to use Metabase Copilot");
      }
    }
  };

  function onApiResponseData(content: string, isFinished: boolean) : void {
    if (isFinished) {
      isOperationRunning = false;
    }
    pasteTextIntoElement(getQueryEditorTextarea(version), content)
  }

  function onApiRequestError(errorMessage: string) : void {
    const existingDatabaseErrorPopupElement = document.getElementById(getComponentIdFromVariable({databaseErrorPopupElement}))
    if (existingDatabaseErrorPopupElement) {
      existingDatabaseErrorPopupElement.remove()
    }
    if (!errorMessage) {
      setFeedbackMessage("Unknown error, sorry.", "error")
    } else {
      setFeedbackMessage(errorMessage, "error")
    }
    isOperationRunning = false;
  }
}


////////////// Revert query function //////////////


function mainRevertQuery() {
  if (isOperationRunning || previousQueryContents.length === 0) {
    return
  }
  const queryEditorTextarea = getQueryEditorTextarea(version);
  deleteTextInputElement(queryEditorTextarea, storeQueryContent)
  pasteTextIntoElement(queryEditorTextarea, previousQueryContents.pop())
  if (previousQueryContents.length === 0) {
    document.getElementById(getComponentIdFromVariable({revertQueryButtonElement})).style.display = "none"
  }
}


function pushPreviousQueryContent() : void {
  const queryEditorTextarea = getQueryEditorTextarea(version);
  previousQueryContents.push(storeQueryContent);
  document.getElementById(getComponentIdFromVariable({revertQueryButtonElement})).style.display = "block";
  deleteTextInputElement(queryEditorTextarea, storeQueryContent);
}


////////////// Database error fix function //////////////


function mainDatabaseErrorFix() : void {

  function onApiRequestError(errorMessage: string) : void {
    const existingdatabaseErrorPopupElement = document.getElementById(getComponentIdFromVariable({databaseErrorPopupElement}))
    if (existingdatabaseErrorPopupElement) {
      existingdatabaseErrorPopupElement.remove();
    }
    if (!errorMessage) {
      setFeedbackMessage("Unknown error, sorry.", "error")
    } else {
      setFeedbackMessage(errorMessage, "error")
    }
    isOperationRunning = false;
  }
  
  function onApiResponseData(content: string, isFinished: boolean) : void {
    pasteTextIntoElement(getQueryEditorTextarea(version), content)
    if (isFinished) {
      isOperationRunning = false;
    }
  }

  if (isOperationRunning) {
    return;
  }
  isOperationRunning = true;
  const queryEditorTextarea = getQueryEditorTextarea(version);

  if (document.getElementById(getComponentIdFromVariable({databaseErrorPopupElement}))) {
    databaseErrorPopupElement.remove();
  }

  if (user) {
    pushPreviousQueryContent();
    const payload = {
      existingQuery: storeQueryContent,
      databaseError: storeQueryError,
      databaseId: storeDatabaseSelected,
    }
    backendStreamingRequest("api/fixDatabaseError", payload, onApiResponseData, onApiRequestError);
  } else if (configDict.status === 'valid') {
    pushPreviousQueryContent();
    const promptMessages = createDatabaseErrorFixPromptMessages(
      storeQueryContent,
      storeQueryError,
      configDict.schema[storeDatabaseSelected]
    );
    chatgptStreamingRequest(configDict, promptMessages, onApiResponseData, onApiRequestError);
  } else if (configDict.status === 'error' || configDict.status === 'invalid') {
    onApiRequestError("Your API key is invalid. Please enter a valid API key in the extension popup or sign in.");
  } else {
    onApiRequestError("Sign in with the extension popup to use Metabase Copilot");
  }
}


////////////// Database error explain function //////////////


function mainDatabaseErrorExplain() : void {

  function onApiRequestError(errorMessage: string) : void {
    const existingdatabaseErrorPopupElement = document.getElementById(getComponentIdFromVariable({databaseErrorPopupElement}))
    if (existingdatabaseErrorPopupElement) {
      existingdatabaseErrorPopupElement.remove();
    }
    if (!errorMessage) {
      setFeedbackMessage("Unknown error, sorry.", "error")
    } else {
      setFeedbackMessage(errorMessage, "error")
    }
    isOperationRunning = false;
  }
  
  function onApiResponseData(content: string, isFinished: boolean) : void {
    const previousContent = databaseErrorPopupElement.getAttribute("error-message");
    databaseErrorPopupElement.setAttribute("error-message", previousContent+content);
    if (isFinished) {
      isOperationRunning = false;
    }
  }

  if (isOperationRunning) {
    return;
  }
  isOperationRunning = true;

  databaseErrorPopupElement.setAttribute("error-message", "");
  if (!document.getElementById(getComponentIdFromVariable({databaseErrorPopupElement}))) {
    const visualizationRootElement = getVisualizationRootElement(version);
    visualizationRootElement.appendChild(databaseErrorPopupElement);
  }

  if (user) {
    const payload = {
      existingQuery: storeQueryContent,
      databaseError: storeQueryError,
      databaseId: storeDatabaseSelected,
    }
    backendStreamingRequest("api/explainDatabaseError", payload, onApiResponseData, onApiRequestError);
  } else if (configDict.status === 'valid') {
    const promptMessages = createDatabaseErrorExplainPromptMessages(
      storeQueryContent,
      storeQueryError,
      configDict.schema[storeDatabaseSelected]
    );
    chatgptStreamingRequest(configDict, promptMessages, onApiResponseData, onApiRequestError);
  } else if (configDict.status === 'error' || configDict.status === 'invalid') {
    onApiRequestError("Your API key is invalid. Please enter a valid API key in the extension popup or sign in.");
  } else {
    onApiRequestError("Sign in with the extension popup to use Metabase Copilot");
  }
}


////////////// databases schema things //////////////


function onClickUpdateDatabasesSchema(): void {
  if (isOperationRunning) {
    return;
  }
  if (!user && configDict.status !== 'valid') {
    setFeedbackMessage("Your API key is invalid. Please enter a valid API key in the extension popup or sign in", "error");
    return;
  }
  isOperationRunning = true;
  updateSchemaExtractionElement.setAttribute("animate", "true");
  setFeedbackMessage("Extracting the database schema structure, please do not close this page.", "success");
  updateDatabasesSchema().then(response => {
    updateSchemaExtractionElement.setAttribute("animate", "false");
    feedbackMessageElement.remove();
    if (configDict.schemaExtractedAt) {
      updateSchemaExtractionElement.setAttribute("schema_extracted_at", configDict.schemaExtractedAt);
    }
    if (user) {
      chrome.storage.local.set({ [storageKeyOptionsTab]: "databaseSchema" }, () => {
        openOptionsPage();
      });
    }
    isOperationRunning = false;
  }).catch(error => {
    setFeedbackMessage(error.message, "error");
    updateSchemaExtractionElement.setAttribute("animate", "false");
    isOperationRunning = false;
  });
}


async function updateDatabasesSchema(): Promise<void> {
  const rawDatabaseSchema = await getRawDatabaseSchema();
  if (user) {
    const token = await getAuthToken();
    try {
      await functions.callFunction('api/updateRawDatabaseSchema', token, "POST", rawDatabaseSchema);
    } catch (error) {
      console.error("Error updating raw database schema", error.message);
      throw new Error(error.message);
    }
  } else {
    const schema = await getFormattedDatabaseSchema(rawDatabaseSchema);
    configDict.schema = schema;
    configDict.schemaExtractedAt = new Date().toLocaleDateString("ja-JP");
    chrome.storage.local.set({ [storageKeyLocalConfig]: configDict });
  }
}


////////////// error message //////////////


function setFeedbackMessage(message: string, type: string) {
  try {
    if (!message || message === "") {
      return;
    }
    feedbackMessageElement.setAttribute("message", message);
    feedbackMessageElement.setAttribute("type", type);
    const existingFeedbackMessageElement = document.getElementById(getComponentIdFromVariable({feedbackMessageElement}));
    if (!existingFeedbackMessageElement) {
      const visualizationRootElement = getVisualizationRootElement(version);
      visualizationRootElement.appendChild(feedbackMessageElement);
    }
  } catch (error) {
    console.error("Error setting feedback message", error, message, type);
  }
}


////////////// main //////////////


function main() {

  console.log("main");

  if (isContentScriptLoaded) {
    return;
  }
  isContentScriptLoaded = true;

  getMetabaseVersion().then(response => {
    version = response;
  })

  getAuthToken().then(authToken => {
    if (authToken) {
      functions.callFunction('api/getUser', authToken, "GET").then(response => {
        user = response;
        setStoreListener();
        setupElements();
        if (!user?.formattedDatabaseSchema) {
          onClickUpdateDatabasesSchema();
        }
      }).catch(error => {
        console.error("Error getting user", error);
        setFeedbackMessage("Could not retrieve your user profile, sorry. Please refresh the page", "error");
      });
    } else {
      setStoreListener();
      setupElements();
      chrome.storage.local.get([storageKeyLocalConfig], function(result) {
        if (result[storageKeyLocalConfig]) {
          configDict = result[storageKeyLocalConfig];
          if (!configDict.schema) {
            onClickUpdateDatabasesSchema();
          }
        }
      });
    }
  });
}

main();
