import './databaseErrorPopupElement.css';

import dismissIcon from '../../assets/dismissIcon.png'
import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

const databaseErrorPopupElement = document.createElement('div');
databaseErrorPopupElement.id = getComponentIdFromVariable({databaseErrorPopupElement})
databaseErrorPopupElement.setAttribute("error-message", "")
databaseErrorPopupElement.style.display = 'none';

const dismissElement = document.createElement('img');
dismissElement.src = chrome.runtime.getURL(dismissIcon);
dismissElement.className = 'img';
dismissElement.addEventListener('click', function(event) {
  databaseErrorPopupElement.remove();
});

const textElement = document.createElement('span');
textElement.className = 'text';

databaseErrorPopupElement.appendChild(dismissElement)
databaseErrorPopupElement.appendChild(textElement)

// Create a MutationObserver instance to watch for attribute changes on the parent element
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'error-message') {
      const errorMessage = databaseErrorPopupElement.getAttribute("error-message") || "";
      textElement.innerHTML = errorMessage;
      
      // Show or hide the element based on the error message content
      databaseErrorPopupElement.style.display = errorMessage ? 'flex' : 'none';
    }
  });
});
// Configure the observer to watch for attribute changes on the parent element
observer.observe(databaseErrorPopupElement, { attributes: true });

export default databaseErrorPopupElement
