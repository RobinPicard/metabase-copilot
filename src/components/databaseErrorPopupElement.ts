import dismissIcon from '../../assets/dismissIcon.png'
import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

// Create and append styles
const styles = document.createElement('style');
styles.textContent = `
  #databaseErrorPopupElement {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    top: 50px;
    right: 18px;
    max-width: 400px;
    max-height: 70%;
    padding: 0px 0px 24px 0px;
    background-color: var(--background-blue);
    border-radius: 5px;
    gap: 0px;
    border: 1px solid rgb(81, 158, 227);
  }

  #databaseErrorPopupElement .img {
    width: 24px;
    height: 24px;
    padding: 8px;
    cursor: pointer;
    box-sizing: border-box;
  }

  #databaseErrorPopupElement .text {
    font-size: 12px;
    line-height: 18px;
    color: rgb(76, 87, 115);
    font-weight: 400;
    padding: 0px 16px;
    font-family: Monaco, Menlo, "Ubuntu Mono", Consolas, "Source Code Pro", source-code-pro, monospace;
    overflow: auto;
  }
`;
document.head.appendChild(styles);

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
