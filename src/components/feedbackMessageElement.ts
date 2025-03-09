import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

// Create and append styles
const styles = document.createElement('style');
styles.textContent = `
  #feedbackMessageElement {
    position: fixed;
    bottom: 20px;
    right: 20px;
    border-radius: 4px;
    padding: 10px;
    max-width: 300px;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  #feedbackMessageElement.error {
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
  }

  #feedbackMessageElement.success {
    background-color: rgba(80, 158, 227, 0.2);
    border: 1px solid rgb(80, 158, 227);
  }

  #feedbackMessageElement .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  #feedbackMessageElement .text {
    margin: 0;
    font-size: 14px;
  }

  #feedbackMessageElement .text.error {
    color: #721c24;
  }

  #feedbackMessageElement .text.success {
    color: rgb(80, 158, 227);
  }

  #feedbackMessageElement .close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-left: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #feedbackMessageElement .close-button.error:hover svg path {
    stroke: #5a1720;
  }

  #feedbackMessageElement .close-button.success:hover svg path {
    stroke: #155724;
  }
`;
document.head.appendChild(styles);

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
