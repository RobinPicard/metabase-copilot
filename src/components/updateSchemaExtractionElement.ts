import './updateSchemaExtractionElement.css';

import loadImage from '../../assets/loadIcon.png'
import loadGif from '../../assets/loadIcon.gif'
import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";


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
