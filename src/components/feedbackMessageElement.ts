import './feedbackMessageElement.css';

import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";


const feedbackMessageElement = document.createElement('div');
feedbackMessageElement.id = getComponentIdFromVariable({feedbackMessageElement});
feedbackMessageElement.setAttribute("message", "")
feedbackMessageElement.setAttribute("type", "")

const container = document.createElement('div');
container.className = 'container';

const text = document.createElement('p');
text.className = 'text';

const closeButton = document.createElement('button');
closeButton.className = 'close-button';
closeButton.innerHTML = `
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L11 11M1 11L11 1" stroke="#721c24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;
closeButton.addEventListener('click', function(event) {
  event.stopPropagation();
  feedbackMessageElement.remove();
});

container.appendChild(text);
container.appendChild(closeButton);
feedbackMessageElement.appendChild(container);

// Create a MutationObserver instance to watch for attribute changes on the parent element
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === "message") {
        text.innerHTML = feedbackMessageElement.getAttribute("message") || ""
      } else if (mutation.type === 'attributes' && mutation.attributeName === "type") {
        const type = feedbackMessageElement.getAttribute("type");
        feedbackMessageElement.classList.remove("error", "success");
        if (type === "error" || type === "success") {
          feedbackMessageElement.classList.add(type);
        }
        text.classList.remove("error", "success");
        if (type === "error" || type === "success") {
          text.classList.add(type);
        }
        closeButton.classList.remove("error", "success");
        if (type === "error" || type === "success") {
          closeButton.classList.add(type);
        }
      }
    });
  });
  // Configure the observer to watch for attribute changes on the parent element
  observer.observe(feedbackMessageElement, { attributes: true });


export default feedbackMessageElement;
