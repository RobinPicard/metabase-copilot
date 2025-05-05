import magicWandIcon from '../../assets/magicWandIcon.png'
import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";
import promptQueryPopupElement from './promptQueryPopupElement';

// Create and append styles
const styles = document.createElement('style');
styles.textContent = `
  #promptQueryButtonElement {
    position: relative;
    height: 36px;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 10px 16px;
    gap: 10px;
    color: #509ee3;
    background-color: #519EE3;
    border-radius: 5px;
    cursor: pointer;
  }

  #promptQueryButtonElement .img {
    width: 16px;
    height: 16px;
  }

  #promptQueryButtonElement .text {
    font-weight: 600;
    font-size: 14px;
    line-height: 16px;
    color: #FFFFFF;
  }

  #promptQueryButtonElement .tooltip {
    visibility: hidden;
    position: absolute;
    top: 53px;
    right: -16px;
    width: 140px;
    font-size: 12px;
    padding: 12px;
    color: white;
    font-weight: bold;
    background-color: #2e353b;
    border: none;
    pointer-events: none;
    line-height: 1.26;
    font-size: 12px;
    border-radius: 6px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.13);
    word-wrap: break-word;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.3s ease-in-out, visibility 0s linear 0.3s;
  }

  #promptQueryButtonElement .tooltip::before {
    content: '';
    position: absolute;
    top: -8px;
    right: 60px;
    border-width: 0 8px 8px 8px;
    border-style: solid;
    border-color: transparent transparent #2e353b transparent;
  }

  #promptQueryButtonElement:hover:not(.clicked) .tooltip {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.3s ease-in-out, visibility 0s linear;
  }

  #promptQueryButtonElement.clicked .tooltip {
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.3s ease-in-out, visibility 0s linear 0.3s;
  }
`;
document.head.appendChild(styles);

const promptQueryButtonElement = document.createElement('div');
promptQueryButtonElement.id = getComponentIdFromVariable({promptQueryButtonElement});

const imageElement = document.createElement('img');
imageElement.src = chrome.runtime.getURL(magicWandIcon);
imageElement.className = 'img';

const textElement = document.createElement('span');
textElement.innerHTML = 'Prompt';
textElement.className = 'text';

const tooltipElement = document.createElement('div');
tooltipElement.className = 'tooltip'
tooltipElement.innerHTML = 'Ask the AI to generate a query<br>(⌘ + ⇧ + p)'

promptQueryButtonElement.appendChild(imageElement);
promptQueryButtonElement.appendChild(textElement);
promptQueryButtonElement.appendChild(tooltipElement);

promptQueryButtonElement.addEventListener('click', () => {
  const popup = document.getElementById(getComponentIdFromVariable({promptQueryPopupElement}));
  if (!popup) {
    promptQueryButtonElement.classList.add('clicked');
  }
});

promptQueryButtonElement.addEventListener('mouseleave', () => {
  const popup = document.getElementById(getComponentIdFromVariable({promptQueryPopupElement}));
  if (!popup) {
    promptQueryButtonElement.classList.remove('clicked');
  }
});

// Add observer to check if popup is present
const observer = new MutationObserver((mutations) => {
  const popup = document.getElementById(getComponentIdFromVariable({promptQueryPopupElement}));
  if (popup) {
    promptQueryButtonElement.classList.add('clicked');
  } else {
    promptQueryButtonElement.classList.remove('clicked');
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

export default promptQueryButtonElement;
