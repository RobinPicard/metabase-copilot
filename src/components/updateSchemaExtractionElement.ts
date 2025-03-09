import './updateSchemaExtractionElement.css';

import loadImage from '../../assets/loadIcon.png'
import loadGif from '../../assets/loadIcon.gif'
import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

// Create and append styles
const styles = document.createElement('style');
styles.textContent = `
  #updateSchemaExtractionElement {
    position: relative;
    height: 36px;
    width: 36px;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 8px;
    color: #509ee3;
    background-color: #519EE3;
    border-radius: 5px;
    cursor: pointer;
  }

  #updateSchemaExtractionElement .img {
    width: 20px;
    height: 20px;
  }

  #updateSchemaExtractionElement .tooltip {
    visibility: hidden;
    position: absolute;
    top: 53px;
    right: -40px;
    width: 120px;
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

  #updateSchemaExtractionElement .tooltip::before {
    content: '';
    position: absolute;
    top: -8px;
    right: 50px;
    border-width: 0 8px 8px 8px;
    border-style: solid;
    border-color: transparent transparent #2e353b transparent;
  }

  #updateSchemaExtractionElement:hover:not(.clicked) .tooltip {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.3s ease-in-out, visibility 0s linear;
  }

  #updateSchemaExtractionElement.clicked .tooltip {
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.3s ease-in-out, visibility 0s linear 0.3s;
  }
`;
document.head.appendChild(styles);

interface dataInterface {
  schema_extracted_at?: string | undefined,
  animate?: 'true' | 'false' | undefined,
};

var data : dataInterface = {
  schema_extracted_at: undefined,
  animate: 'false'
}

const updateSchemaExtractionElement = document.createElement('div');
updateSchemaExtractionElement.id = getComponentIdFromVariable({updateSchemaExtractionElement})

const imageElement = document.createElement('img');
imageElement.src = chrome.runtime.getURL(loadImage);
imageElement.className = 'img'

const tooltipElement = document.createElement('div');
tooltipElement.className = 'tooltip'

updateSchemaExtractionElement.appendChild(imageElement)
updateSchemaExtractionElement.appendChild(tooltipElement)

updateSchemaExtractionElement.addEventListener('click', () => {
  updateSchemaExtractionElement.classList.add('clicked');
});

updateSchemaExtractionElement.addEventListener('mouseleave', () => {
  updateSchemaExtractionElement.classList.remove('clicked');
});

// Create a MutationObserver instance to watch for attribute changes on the parent element
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "attributes" && ["animate", "schema_extracted_at"].includes(mutation.attributeName || "")) {
      const dataValue = updateSchemaExtractionElement.getAttribute(mutation.attributeName || "");
      data = {...data, [mutation.attributeName || ""]: dataValue};
      if (data.animate === 'true') {
        imageElement.src = chrome.runtime.getURL(loadGif);
        tooltipElement.innerHTML = "Database schema extraction is ongoing. Please do not close the tab."
      } else {
        imageElement.src = chrome.runtime.getURL(loadImage);
        tooltipElement.innerHTML = (
          `Rerun the database schema extraction`
        );
      }
    }
  });
});
observer.observe(updateSchemaExtractionElement, { attributes: true });

export default updateSchemaExtractionElement;
