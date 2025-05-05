import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";
import promptQueryButtonElement from './promptQueryButtonElement';
import dismissIcon from '../../assets/dismissIcon.png';
import { storageKeyLocalConfig } from '../constants/chromeStorage';

// Create and append styles
const styles = document.createElement('style');
styles.textContent = `
  #promptQueryPopupElement {
    position: fixed;
    display: flex;
    flex-direction: row;
    width: 350px;
    height: 150px;
    padding: 0px 0px 0px 24px;
    background-color: white;
    border-radius: 0.5rem;
    gap: 0px;
    border: 1px solid rgb(81, 158, 227);
    z-index: 2147483647;
  }

  #promptQueryPopupElement textarea {
    width: 100%;
    height: 100%;
    padding: 18px 0px;
    color: rgb(76, 87, 115);
    background-color: white;
    border: none;
    resize: none;
    outline: none;
    font-size: 0.75rem;
    line-height: 1.125rem;
    font-family: Monaco, Menlo, "Ubuntu Mono", Consolas, "Source Code Pro", source-code-pro, monospace;
    cursor: move;
  }

  #promptQueryPopupElement img {
    width: 24px;
    height: 24px;
    padding: 8px;
    cursor: pointer;
    box-sizing: border-box;
  }

  .button-hover-disabled {
    pointer-events: none;
  }
`;
document.head.appendChild(styles);

const promptQueryPopupElement = document.createElement('div');
promptQueryPopupElement.id = getComponentIdFromVariable({promptQueryPopupElement});

// Create textarea
const textarea = document.createElement('textarea');

// Add dismiss button
const dismissElement = document.createElement('img');
dismissElement.src = chrome.runtime.getURL(dismissIcon);
dismissElement.addEventListener('click', function(event) {
  event.stopPropagation();
  const existingPopup = document.getElementById(getComponentIdFromVariable({promptQueryPopupElement}));
  if (existingPopup) {
    cleanupPopup();
  }
});

// Add drag functionality
let isDragging = false;
let currentX: number;
let currentY: number;
let initialX: number;
let initialY: number;
let initialLeft: number;
let initialTop: number;
let xOffset = 0;
let yOffset = 0;
let wasDragged = false;

promptQueryPopupElement.addEventListener('mousedown', (e) => {
  e.stopPropagation();
  dragStart(e);
});

// Add mousemove listener to document to handle fast movements
document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    e.preventDefault();
    drag(e);
  }
});

promptQueryPopupElement.addEventListener('mouseup', (e) => {
  e.stopPropagation();
  dragEnd();
});
promptQueryPopupElement.addEventListener('mouseleave', (e) => {
  e.stopPropagation();
  dragEnd();
});

function dragStart(e: MouseEvent) {
  initialX = e.pageX;
  initialY = e.pageY;
  
  // Get the current position from styles
  const style = window.getComputedStyle(promptQueryPopupElement);
  initialLeft = parseInt(style.left, 10) || 0;
  initialTop = parseInt(style.top, 10) || 0;

  if (e.target !== dismissElement) {
    isDragging = true;
    wasDragged = false;
  }
}

function drag(e: MouseEvent) {
  if (isDragging) {
    e.preventDefault();
    currentX = e.pageX - initialX;
    currentY = e.pageY - initialY;
    
    // Update actual position instead of using transform
    const left = initialLeft + currentX;
    const top = initialTop + currentY;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = 350; // Width from CSS
    const popupHeight = 150; // Height from CSS
    
    // Ensure the popup stays within viewport bounds
    promptQueryPopupElement.style.left = `${Math.min(Math.max(0, left), viewportWidth - popupWidth)}px`;
    promptQueryPopupElement.style.top = `${Math.min(Math.max(0, top), viewportHeight - popupHeight)}px`;
    wasDragged = true;
  }
}

function dragEnd() {
  isDragging = false;
}

// Add click to focus functionality
promptQueryPopupElement.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!isDragging) {
    textarea.focus();
  }
});

// Replace the existing mouseenter/mouseleave listeners with these
promptQueryPopupElement.addEventListener('mouseenter', (e) => {
  e.stopPropagation();
  const button = document.getElementById(getComponentIdFromVariable({promptQueryButtonElement}));
  if (button) {
    button.classList.add('button-hover-disabled');
  }
});

promptQueryPopupElement.addEventListener('mouseleave', (e) => {
  e.stopPropagation();
  const button = document.getElementById(getComponentIdFromVariable({promptQueryButtonElement}));
  if (button) {
    button.classList.remove('button-hover-disabled');
  }
});

// Function to clean up the popup
export function cleanupPopup() {
  const rect = promptQueryPopupElement.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  
  // Save the absolute position to configDict
  const position = {
    left: rect.left + scrollX,
    top: rect.top + scrollY
  };
  
  chrome.storage.local.get([storageKeyLocalConfig], function(result) {
    const configDict = result[storageKeyLocalConfig] || {};
    configDict.popupPosition = position;
    chrome.storage.local.set({ [storageKeyLocalConfig]: configDict });
  });
  
  // Remove the hover-disabled class from the button
  const button = document.getElementById(getComponentIdFromVariable({promptQueryButtonElement}));
  if (button) {
    button.classList.remove('button-hover-disabled');
  }
  
  textarea.value = '';
  promptQueryPopupElement.remove();
}

// Add the textarea and dismiss button to the popup
promptQueryPopupElement.appendChild(textarea);
promptQueryPopupElement.appendChild(dismissElement);

export default promptQueryPopupElement;
