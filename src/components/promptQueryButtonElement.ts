import './promptQueryButtonElement.css';

import magicWandIcon from '../../assets/magicWandIcon.png'
import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";


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
  promptQueryButtonElement.classList.add('clicked');
});
  
promptQueryButtonElement.addEventListener('mouseleave', () => {
  promptQueryButtonElement.classList.remove('clicked');
});


export default promptQueryButtonElement;
