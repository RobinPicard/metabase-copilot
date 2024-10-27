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
import getFirebaseAuthUser from '../chromeMessaging/getFirebaseAuthUser';
import getFirebaseAuthToken from '../chromeMessaging/getFirebaseAuthToken'

import { storageKeyLocalConfig } from '../constants/chromeStorage'


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


////////////// metabase redux store state's variables and listener //////////////
  

// Function to set a listener for store updates
function setStoreListener(): void {
  // Inject the script
  const injectedScriptStoreUpdates = document.createElement('script');
  injectedScriptStoreUpdates.src = chrome.runtime.getURL('dist/injectedScriptStoreUpdates.js');
  document.head?.appendChild(injectedScriptStoreUpdates);

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
}


////////////// insert elements + add listeners to buttons //////////////


function setupElements() {

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
} 


////////////// Query-edition functions //////////////


function mainPromptQuery() {

  if (isOperationRunning) {
    return
  }
  
  const queryEditorTextarea = getQueryEditorTextarea(version);

  // Add promptQueryPopupElement to DOM with an event listener on pressing Enter
  promptQueryButtonElement.appendChild(promptQueryPopupElement);
  promptQueryPopupElement.focus();
  promptQueryPopupElement.addEventListener('keypress', onPressEnterInsideElement);

  // Handle enter key inside the popup
  function onPressEnterInsideElement(event: KeyboardEvent) : void {
    if (event.key === 'Enter' && !event.shiftKey && !isOperationRunning) {
      event.preventDefault();
      isOperationRunning = true;
      pushPreviousQueryContent();
      if (user) {
        const payload = {
          userPrompt: promptQueryPopupElement.value,
          existingQuery: storeQueryContent,
          databaseId: storeDatabaseSelected,
        }
        backendStreamingRequest('api/writeQuery', payload, onApiResponseData, onApiRequestError);
      } else if (configDict.status === 'valid') {
        const promptMessages = createPromptQueryMessages(
          storeQueryContent,
          promptQueryPopupElement.value,
          configDict.schema[storeDatabaseSelected]
        );
        chatgptStreamingRequest(configDict, promptMessages, onApiResponseData, onApiRequestError);
      } else if (configDict.status === 'error' || configDict.status === 'invalid') {
        onApiRequestError("Your API key is invalid. Please enter a valid API key in the extension popup or sign in.");
      } else {
        onApiRequestError("Sign in with the extension popup to use Metabase Copilot");
      }
      cleanupPopup();
    }
  };

  // Add event listener for clicks outside of promptQueryPopupElement
  document.addEventListener('click', onClickOutsideElement);
  function onClickOutsideElement(event: KeyboardEvent) : void {
    if (
      promptQueryButtonElement.contains(promptQueryPopupElement as Node)
      && (!promptQueryPopupElement.contains(event.target as Node))
      && (!promptQueryButtonElement.contains(event.target as Node))
    ) {
      cleanupPopup();
    }
  }

  // remove the popup from the DOM and remove the listeners
  function cleanupPopup() : void {
    promptQueryPopupElement.value = '';
    promptQueryPopupElement.remove();
    promptQueryPopupElement.removeEventListener('keypress', onPressEnterInsideElement);
    document.removeEventListener('click', onClickOutsideElement);
  }

  function onApiResponseData(content: string, isFinished: boolean) : void {
    if (isFinished) {
      isOperationRunning = false;
    }
    pasteTextIntoElement(queryEditorTextarea, content)
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
    pasteTextIntoElement(queryEditorTextarea, content)
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
    const token = await getFirebaseAuthToken();
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

  if (isContentScriptLoaded) {
    return;
  }
  isContentScriptLoaded = true;

  getMetabaseVersion().then(response => {
    version = response;
  })

  getFirebaseAuthUser().then(authUser => {
    if (authUser) {
      getFirebaseAuthToken().then(token => {
        functions.callFunction('api/getUser', token, "GET").then(response => {
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
