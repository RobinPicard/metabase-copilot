import promptQueryButtonElement from '../components/promptQueryButtonElement'
import promptQueryPopupElement from '../components/promptQueryPopupElement'
import revertQueryButtonElement from '../components/revertQueryButtonElement'
import updateQueryContainerElement from '../components/updateQueryContainerElement'
import updateSchemaExtractionElement from '../components/updateSchemaExtractionElement'
import databaseErrorExplainButtonElement from '../components/databaseErrorExplainButtonElement'
import databaseErrorFixButtonElement from '../components/databaseErrorFixButtonElement'
import databaseErrorPopupElement from '../components/databaseErrorPopupElement'
import feedbackMessageElement from '../components/feedbackMessageElement'
import { cleanupPopup } from '../components/promptQueryPopupElement'

import pasteTextIntoElement from '../utils/pasteTextIntoElement'
import deleteTextInputElement from '../utils/deleteTextInputElement'
import getComponentIdFromVariable from '../utils/getComponentIdFromVariable'

import {
  createPromptQueryMessages,
  createDatabaseErrorExplainPromptMessages,
  createDatabaseErrorFixPromptMessages
} from '../functions/createPromptMessages'
import getRawDatabaseSchema from '../functions/getRawDatabaseSchema'
import {createDefaultDatabaseSchemaOptions} from '../functions/createDefaultDatabaseSchemaOptions'
import { getConfigDict } from '../functions/getConfigDict'
import getMetabaseVersion from '../functions/getMetabaseVersion'
import {adaptDatabaseSchemaOptions} from '../functions/adaptDatabaseSchemaOptions'
import {selectDefaultTablesDatabaseSchemaOptions} from '../functions/selectDefaultTablesDatabaseSchemaOptions'
import {createFormattedDatabaseSchema} from '../functions/createFormattedDatabaseSchema'
import {wrapLlmCall} from '../functions/wrapLlmCall'

import getEditorOpenedElement from '../page_elements/getEditorOpenedElement'
import getErrorWarningElement from '../page_elements/getErrorWarningElement'
import getQueryEditorTextarea from '../page_elements/getQueryEditorTextarea'
import getVisualizationRootElement from '../page_elements/getVisualizationRootElement'
import getEditorTopBar from '../page_elements/getEditorTopBar'

import { ConfigDict } from '../types/chromeStorage'

import { storageKeyLocalConfig, defaultConfigDict } from '../constants/chromeStorage'


////////////// global variables //////////////


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
      updateQueryContainerElement.appendChild(updateSchemaExtractionElement);
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
    onClickUpdateRawDatabasesSchema()
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

  if (isOperationRunning) {
    return;
  }

  // If popup is already open, close it and return
  const existingPopup = document.getElementById(getComponentIdFromVariable({promptQueryPopupElement}));
  if (existingPopup) {
    cleanupPopup();
    return;
  }

  // Get latest configDict to ensure we have the most recent position
  getConfigDict().then((configDict) => {
    const savedPosition = configDict.popupPosition;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = 350; // Width from CSS
    const popupHeight = 150; // Height from CSS
    
    let left: number;
    let top: number;

    if (savedPosition && typeof savedPosition.left === 'number' && typeof savedPosition.top === 'number') {
      // Ensure the popup stays within viewport bounds
      left = Math.min(Math.max(0, savedPosition.left), viewportWidth - popupWidth);
      top = Math.min(Math.max(0, savedPosition.top), viewportHeight - popupHeight);
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
      } else {
        left = (viewportWidth - popupWidth) / 2;
        top = (viewportHeight - popupHeight) / 2;
      }
    }

    promptQueryPopupElement.style.left = `${left}px`;
    promptQueryPopupElement.style.top = `${top}px`;
    promptQueryPopupElement.style.transform = 'none';

    document.body.appendChild(promptQueryPopupElement);
    
    const textarea = promptQueryPopupElement.querySelector('textarea');
    textarea.focus();
    promptQueryPopupElement.addEventListener('keypress', onPressEnterInsideElement);
  });

  // Handle enter key inside the popup
  function onPressEnterInsideElement(event: KeyboardEvent) : void {
    if (event.key === 'Enter' && !event.shiftKey && !isOperationRunning) {
      event.preventDefault();
      isOperationRunning = true;
      pushPreviousQueryContent();
      const textarea = promptQueryPopupElement.querySelector('textarea');
      getConfigDict().then((configDict) => {
        configDict = configDict;
        if (configDict.providers[configDict.providerSelected].status === 'valid') {
          const [systemMessage, promptMessages] = createPromptQueryMessages(
            storeQueryContent,
            textarea.value,
            configDict.formattedDatabaseSchema[storeDatabaseSelected]
          );
          wrapLlmCall(
            configDict,
            systemMessage,
            promptMessages,
            onApiResponseData,
            onApiRequestError
          );
        } else if (
          configDict.providers[configDict.providerSelected].status === 'error'
          || configDict.providers[configDict.providerSelected].status === 'invalid'
        ) {
          onApiRequestError("Your API key is invalid. Please enter a valid API key in the extension popup.");
        }
      });
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

  getConfigDict().then((configDict) => {
    configDict = configDict;
    if (configDict.providers[configDict.providerSelected].status === 'valid') {
      pushPreviousQueryContent();
      const [systemMessage, promptMessages] = createDatabaseErrorFixPromptMessages(
        storeQueryContent,
        storeQueryError,
        configDict.formattedDatabaseSchema[storeDatabaseSelected]
      );
      wrapLlmCall(
        configDict,
        systemMessage,
        promptMessages,
        onApiResponseData,
        onApiRequestError
      );
    } else if (
      configDict.providers[configDict.providerSelected].status === 'error'
      || configDict.providers[configDict.providerSelected].status === 'invalid'
    ) {
      onApiRequestError("Your API key is invalid. Please enter a valid API key in the extension popup.");
    }
  });
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

  getConfigDict().then((configDict) => {
    configDict = configDict;
    if (configDict.providers[configDict.providerSelected].status === 'valid') {
      const [systemMessage, promptMessages] = createDatabaseErrorExplainPromptMessages(
        storeQueryContent,
        storeQueryError,
        configDict.formattedDatabaseSchema[storeDatabaseSelected]
      );
      wrapLlmCall(
        configDict,
        systemMessage,
        promptMessages,
        onApiResponseData,
        onApiRequestError
      );
    } else if (
      configDict.providers[configDict.providerSelected].status === 'error'
      || configDict.providers[configDict.providerSelected].status === 'invalid'
    ) {
      onApiRequestError("Your API key is invalid. Please enter a valid API key in the extension popup.");
    }
  });
}


////////////// databases schema things //////////////


function onClickUpdateRawDatabasesSchema(): void {
  if (isOperationRunning) {
    return;
  }
  getConfigDict().then((configDict) => {
    configDict = configDict;
    if (configDict.providers[configDict.providerSelected].status !== 'valid') {
      setFeedbackMessage("Your API key is invalid. Please enter a valid API key in the extension popup.", "error");
      return;
    }
    isOperationRunning = true;
    updateSchemaExtractionElement.setAttribute("animate", "true");
    setFeedbackMessage("Extracting the database schema structure, please do not close this page.", "success");
    updateRawDatabasesSchema().then(response => {
      updateSchemaExtractionElement.setAttribute("animate", "false");
      feedbackMessageElement.remove();
      if (configDict.rawDatabaseSchemaExtractedAt) {
        updateSchemaExtractionElement.setAttribute("schema_extracted_at", configDict.rawDatabaseSchemaExtractedAt);
      }
      chrome.runtime.sendMessage({ action: 'openOptionsPage' });
      isOperationRunning = false;
    }).catch(error => {
      setFeedbackMessage(error.message, "error");
      updateSchemaExtractionElement.setAttribute("animate", "false");
      isOperationRunning = false;
    });
  });
}


async function updateRawDatabasesSchema(): Promise<void> {
  const rawDatabaseSchema = await getRawDatabaseSchema();
  const configDict = await getConfigDict();
  
  configDict.rawDatabaseSchema = rawDatabaseSchema;
  configDict.rawDatabaseSchemaExtractedAt = new Date().toLocaleDateString("ja-JP");
  
  const defaultDatabaseSchemaOptions = createDefaultDatabaseSchemaOptions(rawDatabaseSchema);
  if (configDict.databaseSchemaOptions) {
    configDict.databaseSchemaOptions = adaptDatabaseSchemaOptions(
      configDict.databaseSchemaOptions,
      defaultDatabaseSchemaOptions
    );
  } else {
    try {
      configDict.databaseSchemaOptions = await selectDefaultTablesDatabaseSchemaOptions(defaultDatabaseSchemaOptions, configDict);
    } catch (error) {
      console.error("Error selecting default tables", error);
      configDict.databaseSchemaOptions = defaultDatabaseSchemaOptions;
    }
  }
  
  configDict.formattedDatabaseSchema = createFormattedDatabaseSchema(configDict.databaseSchemaOptions);
  chrome.storage.local.set({ [storageKeyLocalConfig]: configDict });
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

  setStoreListener();
  setupElements();
  getConfigDict().then((configDict) => {
    if (
      !configDict.databaseSchemaOptions
      && configDict.providers[configDict.providerSelected].status === 'valid'
    ) {
      onClickUpdateRawDatabasesSchema();
    }
  });
}

main();
