import './databaseErrorExplainButtonElement.css';

import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";


const databaseErrorExplainButtonElement = document.createElement('div');
databaseErrorExplainButtonElement.id = getComponentIdFromVariable({databaseErrorExplainButtonElement})
databaseErrorExplainButtonElement.innerHTML = 'Explain'

const tooltipElement = document.createElement('div');
tooltipElement.className = 'tooltip'
tooltipElement.innerHTML = 'Explain why the query caused an error<br>(⌘ + ⇧ + e)'

databaseErrorExplainButtonElement.appendChild(tooltipElement);

databaseErrorExplainButtonElement.addEventListener('click', () => {
  databaseErrorExplainButtonElement.classList.add('clicked');
});

databaseErrorExplainButtonElement.addEventListener('mouseleave', () => {
  databaseErrorExplainButtonElement.classList.remove('clicked');
});


export default databaseErrorExplainButtonElement
